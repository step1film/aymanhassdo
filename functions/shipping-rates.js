/* =====================================================
   STEP1 STORE — frakt till kassan
   =====================================================
   Kassan frågar den här när den vet vad kunden ska ha och
   vart det ska. Servern räknar om vagnen ur catalog.js och
   hämtar frakten från Printful (shipping.js).

   Svaret är bara en siffra att VISA. Det kunden faktiskt
   debiteras räknas fram på nytt när betalningen skapas —
   webbläsaren kan inte påstå vad frakten kostar.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, skapaSpärr, clientIp } = require('./_lib/http');
const { priceCart, SHIPPING_FREE_OVER } = require('./_lib/catalog');
const { resolveShipping } = require('./_lib/shipping');

/* Cachen i shipping.js tar de flesta anropen, men en vagn som
   ändras varje gång går förbi den. Spärren håller Printfuls
   anropstak utom räckhåll. Den är rundligt tilltagen — en kund
   som pillar i kassan ska aldrig slå i den. */
const spärrad = skapaSpärr({ windowMs: 10 * 60 * 1000, max: 60 });


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

  let cart;
  try {
    cart = priceCart(payload.items);
  } catch (err) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }

  if (spärrad(clientIp(event))) {
    return { statusCode: 429, headers: cors, body: JSON.stringify({ error: 'För många försök. Vänta en stund.' }) };
  }

  /* Kunden har oftast inte fyllt i adressen än när kassan öppnas.
     Landet räcker för priset; postnummer förfinar det bara i länder
     som prissätter per region. */
  const mottagare = {
    country_code: payload.country_code || (payload.recipient && payload.recipient.country_code) || 'SE',
    zip: (payload.recipient && payload.recipient.zip) || payload.zip || undefined,
    city: (payload.recipient && payload.recipient.city) || undefined,
    state_code: (payload.recipient && payload.recipient.state_code) || undefined
  };

  // Kastar aldrig — värsta fallet är det fasta priset.
  const frakt = await resolveShipping({
    lines: cart.lines,
    subtotal: cart.subtotal,
    recipient: mottagare
  });

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      shipping: frakt.amount,
      currency: 'sek',
      // 'printful' = live, 'fallback' = fast pris, 'free' = över gränsen
      source: frakt.source,
      subtotal: cart.subtotal,
      total: cart.subtotal + frakt.amount,
      freeOver: SHIPPING_FREE_OVER,
      estimate: (frakt.minDays || frakt.maxDays)
        ? { minDays: frakt.minDays, maxDays: frakt.maxDays }
        : null
    })
  };
};
