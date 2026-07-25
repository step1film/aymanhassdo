/* =====================================================
   STEP1 STORE — Swish callback
   =====================================================
   Swish anropar den här när en betalning ändrar status.
   Callbacken innehåller INTE kundvagnen, så själva ordern
   skapas i swish-complete.js (som frontenden pollar).

   Den här finns för att:
     • Swish kräver en giltig callbackUrl
     • ge dig en logg över betalningar (även om kunden
       stänger webbläsaren innan sidan hunnit polla)
   ===================================================== */
'use strict';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  let data = {};
  try { data = JSON.parse(event.body || '{}'); } catch { /* logga ändå */ }

  console.log('[swish-callback]', JSON.stringify({
    id: data.id,
    status: data.status,
    amount: data.amount,
    reference: data.payeePaymentReference,
    errorCode: data.errorCode || null
  }));

  // Swish förväntar sig 200 OK, annars görs nya försök.
  return { statusCode: 200, body: 'ok' };
};
