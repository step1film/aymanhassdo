/* =====================================================
   STEP1 STORE — orderhantering efter betalning
   =====================================================
   Anropas av betalnings-webhookarna (Stripe / Swish) när
   betalningen är BEKRÄFTAD. Skapar ordern hos Printful.

   Om variant-ID:n saknas (inte ifyllda i catalog.js) skapas
   ingen Printful-order — istället loggas ordern så att du
   kan lägga den manuellt. Betalningen påverkas inte.
   ===================================================== */
'use strict';

const PRINTFUL_API = 'https://api.printful.com';

/**
 * Skapar en order hos Printful.
 * @param {{recipient:object, lines:Array, reference:string}} order
 * @returns {Promise<{ok:boolean, skipped?:boolean, reason?:string, order_id?:number}>}
 */
async function createPrintfulOrder(order) {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) return { ok: false, skipped: true, reason: 'PRINTFUL_API_TOKEN saknas' };

  const items = order.lines
    .filter((l) => l.variant_id)
    .map((l) => ({ sync_variant_id: l.variant_id, quantity: l.qty }));

  if (items.length !== order.lines.length) {
    // Minst en rad saknar variant-ID → lägg ordern manuellt.
    return { ok: false, skipped: true, reason: 'Variant-ID saknas för en eller flera rader' };
  }

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;

  const confirm = process.env.PRINTFUL_CONFIRM_ORDERS === 'true';
  const r = order.recipient;

  const body = {
    external_id: order.reference,
    recipient: {
      name: r.name,
      address1: r.address1,
      address2: r.address2 || '',
      city: r.city,
      state_code: r.state_code || '',
      country_code: r.country_code || 'SE',
      zip: r.zip,
      email: r.email || '',
      phone: r.phone || ''
    },
    items
  };

  const res = await fetch(`${PRINTFUL_API}/orders${confirm ? '?confirm=1' : ''}`, {
    method: 'POST', headers, body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, reason: JSON.stringify(data).slice(0, 500) };

  return { ok: true, draft: !confirm, order_id: data.result && data.result.id };
}

/** Läsbar orderrad-sammanfattning (för loggar / mejl). */
function summarise(order) {
  const rows = order.lines
    .map((l) => `  ${l.qty}× ${l.name}${l.color ? ' / ' + l.color : ''}${l.size ? ' / ' + l.size : ''} = ${l.lineTotal} kr`)
    .join('\n');
  const r = order.recipient;
  return [
    `STEP1 STORE — betald order ${order.reference}`,
    '',
    `${r.name} · ${r.email}${r.phone ? ' · ' + r.phone : ''}`,
    `${r.address1}, ${r.zip} ${r.city}, ${r.country_code || 'SE'}`,
    r.notes ? `Meddelande: ${r.notes}` : '',
    '',
    rows,
    `  Frakt: ${order.shipping} kr`,
    `  TOTALT: ${order.total} kr  (${order.paymentMethod || 'okänd metod'})`
  ].filter(Boolean).join('\n');
}

/**
 * Kör hela efter-betalning-flödet: skapa Printful-order + logga.
 * Kastar aldrig — betalningen är redan genomförd.
 */
async function fulfilOrder(order) {
  const summary = summarise(order);
  let result;
  try {
    result = await createPrintfulOrder(order);
  } catch (err) {
    result = { ok: false, reason: String(err) };
  }

  if (result.ok) {
    console.log(`[fulfil] Printful-order skapad (${result.draft ? 'utkast' : 'skarp'}) #${result.order_id}\n${summary}`);
  } else {
    // Syns i Netlify-loggen — lägg ordern manuellt i Printful.
    console.warn(`[fulfil] ⚠️ MANUELL HANTERING KRÄVS (${result.reason})\n${summary}`);
  }
  return result;
}

module.exports = { createPrintfulOrder, fulfilOrder, summarise };
