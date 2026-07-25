/* =====================================================
   STEP1 STORE — Swish: skapa betalningsförfrågan
   =====================================================
   Priserna räknas om på servern (catalog.js). Kunden får
   tillbaka ett betalnings-id + token för att öppna Swish.
   Ordern skapas hos Printful FÖRST när betalningen är
   bekräftad (swish-complete.js).
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin } = require('./_lib/http');

const { priceCart, validateRecipient } = require('./_lib/catalog');
const { createPaymentRequest, normalisePhone } = require('./_lib/swish');


exports.handler = async (event) => {
  const cors = corsHeaders(event, 'POST, OPTIONS');
  if (isForeignOrigin(event)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Otillåtet ursprung.' }) };
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
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

  const reference = 'S1F' + Date.now().toString(36).toUpperCase();

  try {
    const result = await createPaymentRequest({
      amount: cart.total,
      reference,
      message: 'STEP1 STORE',
      // Om kunden angett telefonnummer: skicka förfrågan direkt till appen
      payerAlias: payload.phone ? normalisePhone(payload.phone) : undefined
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
        amount: cart.total
      })
    };
  } catch (err) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }
};
