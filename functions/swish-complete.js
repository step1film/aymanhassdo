/* =====================================================
   STEP1 STORE — Swish: kontrollera status & slutför order
   =====================================================
   Frontenden pollar den här medan kunden betalar i appen.
   Servern frågar ALLTID Swish om status — klienten kan inte
   påstå att något är betalt. Först när Swish svarar PAID och
   beloppet stämmer skapas Printful-ordern.
   ===================================================== */
'use strict';

const { priceCart, validateRecipient } = require('./_lib/catalog');
const { getPaymentRequest } = require('./_lib/swish');
const { fulfilOrder } = require('./_lib/fulfil');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

/* Enkel skydd mot dubbla ordrar inom samma funktionsinstans.
   ⚠️ För skarp drift bör detta ligga i en databas/KV-store —
   se PAYMENTS_SETUP.md ("Att göra innan skarp drift"). */
const handled = new Set();

exports.handler = async (event) => {
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

  let payment;
  try {
    payment = await getPaymentRequest(paymentId);
  } catch (err) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
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
    const cart = priceCart(payload.items);
    const recipient = validateRecipient(payload.recipient || {});

    // Beloppet Swish faktiskt tog betalt måste matcha serverns summa.
    const paid = Number(payment.amount);
    if (!Number.isFinite(paid) || Math.abs(paid - cart.total) > 0.01) {
      console.warn(`[swish-complete] Beloppet stämmer inte: betalt ${paid}, förväntat ${cart.total}`);
      return { statusCode: 409, headers: cors, body: JSON.stringify({ status: 'PAID', error: 'Beloppet stämmer inte.' }) };
    }

    handled.add(paymentId);
    await fulfilOrder({
      reference: payment.payeePaymentReference || paymentId,
      recipient,
      lines: cart.lines,
      shipping: cart.shipping,
      total: cart.total,
      paymentMethod: 'Swish'
    });
  } catch (err) {
    console.error('[swish-complete] Kunde inte skapa ordern:', String(err));
    // Kunden HAR betalat — svara ok, ordern hanteras manuellt via loggen.
  }

  return { statusCode: 200, headers: cors, body: JSON.stringify({ status: 'PAID' }) };
};
