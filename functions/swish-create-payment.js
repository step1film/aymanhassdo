/* =====================================================
   STEP1 STORE — Swish: skapa betalningsförfrågan
   =====================================================
   Priserna räknas om på servern (catalog.js). Kunden får
   tillbaka ett betalnings-id + token för att öppna Swish.
   Ordern skapas hos Printful FÖRST när betalningen är
   bekräftad (swish-complete.js).
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, skapaSpärr, clientIp } = require('./_lib/http');

const { priceCart, validateRecipient } = require('./_lib/catalog');
const { createPaymentRequest, normalisePhone, isValidPayerAlias, swishConfigured } = require('./_lib/swish');
const { resolveShipping } = require('./_lib/shipping');


/* -----------------------------------------------------
   SPÄRR MOT MISSBRUK
   -----------------------------------------------------
   En betalningsförfrågan med telefonnummer plingar RAKT i
   någons Swish-app. Utan spärr kunde endpointen användas för
   att spamma främmande människor med förfrågningar i STEP1:s
   namn — en färdig grund för bluffbetalningar.

   Själva räknaren ligger i _lib/http.js och delas med de
   andra endpointerna.
--------------------------------------------------- */
const spärrad = skapaSpärr({ windowMs: 10 * 60 * 1000, max: 8 });
const MAX_PER_IP = 8;
const MAX_PER_PHONE = 3;


exports.handler = async (event) => {
  const cors = corsHeaders(event, 'POST, OPTIONS');
  if (isForeignOrigin(event)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Otillåtet ursprung.' }) };
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  /* Är Swish inte färdigkopplat ska kunden få veta det HÄR, innan
     kassan låtsas starta en betalning. Kassan frågar payment-methods
     och döljer alternativet, men den som kommer förbi ändå ska mötas
     av ett begripligt svar. */
  if (!swishConfigured()) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'Swish är inte aktiverat i butiken just nu.' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Ogiltig JSON.' }) }; }

  let cart, recipient;
  try {
    cart = priceCart(payload.items);
    recipient = validateRecipient(payload.recipient || {});
  } catch (err) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }

  /* Frakten hämtas live för kundens land. Svarar inte Printful blir
     det standardpriset — kassan stannar aldrig på en frakt. */
  const frakt = await resolveShipping({ lines: cart.lines, subtotal: cart.subtotal, recipient });
  cart = priceCart(payload.items, { shipping: frakt.amount });

  /* Telefonnumret avgör om förfrågan skickas till en app. Går det inte
     att tolka som ett svenskt mobilnummer skickas ingenting någonstans
     — kunden får QR-koden i stället. */
  const rawPhone = payload.phone || recipient.phone || '';
  const payerAlias = rawPhone ? normalisePhone(rawPhone) : '';
  const usePayer = isValidPayerAlias(payerAlias);

  if (spärrad(clientIp(event), MAX_PER_IP) || (usePayer && spärrad('tel:' + payerAlias, MAX_PER_PHONE))) {
    return { statusCode: 429, headers: cors, body: JSON.stringify({ error: 'För många försök. Vänta en stund och prova igen.' }) };
  }

  const reference = 'S1F' + Date.now().toString(36).toUpperCase();

  try {
    const result = await createPaymentRequest({
      amount: cart.total,
      reference,
      message: 'STEP1 STORE',
      // Om kunden angett ett giltigt mobilnummer: skicka förfrågan direkt till appen
      payerAlias: usePayer ? payerAlias : undefined
    });

    // QR-kod för datoranvändare (Swish publika QR-API, inget certifikat krävs)
    let qr = null;
    if (result.token) {
      try {
        const qrRes = await fetch('https://mpc.getswish.net/qrg-swish/api/v1/commerce', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'png', size: 300, border: 0, transparent: true, token: result.token })
        });
        if (qrRes.ok) {
          const buf = Buffer.from(await qrRes.arrayBuffer());
          qr = 'data:image/png;base64,' + buf.toString('base64');
        }
      } catch { /* QR är valfri — appen kan ändå öppnas via token */ }
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        id: result.id,
        token: result.token,
        qr,
        reference,
        amount: cart.total,
        shipping: cart.shipping
      })
    };
  } catch (err) {
    /* Swish svar kan innehålla felkoder och detaljer om vårt konto.
       Kunden ska se något begripligt; detaljen stannar i loggen. */
    console.error('[swish-create-payment]', String((err && err.message) || err));
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte starta Swish-betalningen. Försök igen.' }) };
  }
};
