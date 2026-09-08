/* =====================================================
   STEP1 STORE — vilka betalsätt är faktiskt påslagna?
   =====================================================
   Butiken låg förut och gissade: två boolskor i shop.js som
   någon fick minnas att ändra när ett konto blev klart. Stod
   de fel åt ena hållet försvann ett betalsätt som fungerade,
   åt andra hållet möttes kunden av ett serverfel mitt i kassan.

   Servern vet svaret — den har nycklarna. Den här endpointen
   säger vad som går att betala med just nu, och kassan rättar
   sig efter den. Swish tänds alltså av sig själv samma stund
   som certifikatet ligger i miljövariablerna.

   Svaret innehåller BARA ja/nej och handelsnumret (som ändå
   står på kvittot) — aldrig en nyckel, aldrig en del av en.
   ===================================================== */
'use strict';

const { corsHeaders } = require('./_lib/http');
const { swishConfigured, PAYEE_ALIAS } = require('./_lib/swish');

/** 1231540459 → "123 154 04 59" (samma gruppering som Swish själv visar) */
function formatAlias(alias) {
  const n = String(alias || '').replace(/\D/g, '');
  if (n.length !== 10) return n || null;
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
}

exports.handler = async (event) => {
  const cors = corsHeaders(event, 'GET, OPTIONS');
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  /* Kort kräver BÅDA nycklarna. Med bara den hemliga nyckeln går
     betalningen igenom men webhooken kan inte verifiera Stripes
     signatur — kunden hade betalat utan att ordern skapades. */
  const card = Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
  const swish = swishConfigured();

  return {
    statusCode: 200,
    headers: cors,
    body: JSON.stringify({
      card,
      swish,
      swishNumber: swish ? formatAlias(process.env.SWISH_PAYEE_ALIAS || PAYEE_ALIAS) : null,
      // Testläge syns i kassan så ingen tror att en MSS-betalning är på riktigt
      swishTest: swish && process.env.SWISH_ENV !== 'production',
      cardTest: card && String(process.env.STRIPE_SECRET_KEY).startsWith('sk_test_')
    })
  };
};
