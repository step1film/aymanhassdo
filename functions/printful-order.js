/* =====================================================
   STEP1FILM Store — Printful: create order
   =====================================================
   Skapar en order i Printful (tryck + leverans) EFTER att
   kunden har betalat. API-nyckeln stannar på servern.

   Format: Netlify Functions (exports.handler).

   ⚠️ VIKTIGT OM BETALNING:
   Den här funktionen SKAPAR bara ordern i Printful. Den tar
   INTE betalt. Anropa den först när betalning är bekräftad,
   t.ex. från en Stripe-webhook (payment_intent.succeeded).
   Om du anropar den direkt från frontend utan betalning
   riskerar du att betala för tryck utan att ha fått betalt.

   Sätt PRINTFUL_CONFIRM_ORDERS=true som miljövariabel för att
   lägga skarpa (debiterade) ordrar. Standard är utkast (draft),
   så du kan testa hela flödet utan att bli debiterad.

   Miljövariabler (se .env.example):
     PRINTFUL_API_TOKEN       – din Printful-token (hemlig)
     PRINTFUL_STORE_ID        – valfritt
     PRINTFUL_CONFIRM_ORDERS  – 'true' för skarp order, annars draft

   Body (JSON) som förväntas:
   {
     "recipient": {
       "name": "...", "address1": "...", "city": "...",
       "zip": "...", "country_code": "SE", "email": "..."
     },
     "items": [ { "variant_id": 123456, "quantity": 1 }, ... ]
   }
   ===================================================== */
'use strict';

const PRINTFUL_API = 'https://api.printful.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'PRINTFUL_API_TOKEN saknas i serverns miljövariabler.' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Ogiltig JSON i body.' }) };
  }

  const { recipient, items } = payload;
  if (!recipient || !Array.isArray(items) || items.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'recipient och items krävs.' }) };
  }
  // Grundläggande validering av mottagare
  for (const f of ['name', 'address1', 'city', 'zip', 'country_code']) {
    if (!recipient[f]) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: `recipient.${f} saknas.` }) };
    }
  }

  const authHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (process.env.PRINTFUL_STORE_ID) authHeaders['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;

  const confirm = process.env.PRINTFUL_CONFIRM_ORDERS === 'true';

  const order = {
    recipient: {
      name: recipient.name,
      address1: recipient.address1,
      address2: recipient.address2 || '',
      city: recipient.city,
      state_code: recipient.state_code || '',
      country_code: recipient.country_code,
      zip: recipient.zip,
      email: recipient.email || '',
      phone: recipient.phone || ''
    },
    items: items.map((i) => ({
      sync_variant_id: i.variant_id,
      quantity: Math.max(1, parseInt(i.quantity, 10) || 1)
    }))
  };

  try {
    // confirm=1 lägger skarp order direkt; annars skapas ett utkast
    const url = `${PRINTFUL_API}/orders${confirm ? '?confirm=1' : ''}`;
    const res = await fetch(url, { method: 'POST', headers: authHeaders, body: JSON.stringify(order) });
    const data = await res.json();

    if (!res.ok) {
      return { statusCode: res.status, headers: cors, body: JSON.stringify({ error: 'Printful order failed', detail: data }) };
    }

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        ok: true,
        draft: !confirm,
        order_id: data.result && data.result.id,
        status: data.result && data.result.status
      })
    };
  } catch (err) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte nå Printful', detail: String(err) }) };
  }
};
