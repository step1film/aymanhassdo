/* =====================================================
   STEP1 STORE — Swish: kontrollera status & slutför order
   =====================================================
   Frontenden pollar den här medan kunden betalar i appen.
   Servern frågar ALLTID Swish om status — klienten kan inte
   påstå att något är betalt. Först när Swish svarar PAID och
   beloppet stämmer skapas Printful-ordern.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin } = require('./_lib/http');

const { priceCart, validateRecipient } = require('./_lib/catalog');
const { getPaymentRequest, swishConfigured } = require('./_lib/swish');
const { fulfilOrder } = require('./_lib/fulfil');
const { rimligFrakt, MAX_SEK } = require('./_lib/shipping');


/* Enkel skydd mot dubbla ordrar inom samma funktionsinstans.
   ⚠️ För skarp drift bör detta ligga i en databas/KV-store —
   se PAYMENTS_SETUP.md ("Att göra innan skarp drift"). */
const handled = new Set();

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

  const paymentId = String(payload.id || '').replace(/[^A-Za-z0-9]/g, '');
  if (!paymentId) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Betalnings-id saknas.' }) };
  }

  if (!swishConfigured()) {
    return { statusCode: 503, headers: cors, body: JSON.stringify({ error: 'Swish är inte aktiverat i butiken just nu.' }) };
  }

  let payment;
  try {
    payment = await getPaymentRequest(paymentId);
  } catch (err) {
    // Detaljen (Swish-felkod, vårt konto) stannar i loggen.
    console.error('[swish-complete] Kunde inte hämta status:', String((err && err.message) || err));
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte hämta betalstatus. Försök igen.' }) };
  }

  const status = payment.status;

  // Fortfarande på gång — be frontenden fortsätta polla.
  if (status !== 'PAID') {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ status }) };
  }

  if (handled.has(paymentId)) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ status: 'PAID', alreadyHandled: true }) };
  }

  try {
    let cart = priceCart(payload.items);
    const recipient = validateRecipient(payload.recipient || {});

    /* VARORNA räknas om ur katalogen och är facit. FRAKTEN hämtades
       live när betalningen skapades och kan ha ändrats sedan dess, så
       den kan inte jämföras mot ett fast tal — i stället kontrolleras
       att skillnaden mellan betalt och varorna är en rimlig frakt.
       Är den negativ har kunden betalat för lite för varorna, och det
       är fallet som kostar oss pengar. */
    const paid = Number(payment.amount);
    const fraktKr = Math.round((paid - cart.subtotal) * 100) / 100;

    if (!Number.isFinite(paid) || !rimligFrakt(fraktKr)) {
      console.warn(`[swish-complete] Beloppet stämmer inte: betalt ${paid}, varor ${cart.subtotal}, `
        + `ger ${fraktKr} kr i frakt — utanför spannet 0–${MAX_SEK} kr.`);
      return { statusCode: 409, headers: cors, body: JSON.stringify({ status: 'PAID', error: 'Beloppet stämmer inte.' }) };
    }

    // Frakten kunden faktiskt betalade är den som ska stå på kvittot.
    cart = priceCart(payload.items, { shipping: fraktKr });

    handled.add(paymentId);
    await fulfilOrder({
      reference: payment.payeePaymentReference || paymentId,
      recipient,
      lines: cart.lines,
      shipping: cart.shipping,
      total: cart.total,
      lang: payload.lang === 'en' ? 'en' : 'sv',
      paymentMethod: 'Swish'
    });
  } catch (err) {
    console.error('[swish-complete] Kunde inte skapa ordern:', String(err));
    // Kunden HAR betalat — svara ok, ordern hanteras manuellt via loggen.
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ status: 'PAID' }) };
};
