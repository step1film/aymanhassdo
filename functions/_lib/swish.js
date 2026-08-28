/* =====================================================
   STEP1 STORE — Swish Handel (Swish Commerce API v2)
   =====================================================
   Swish kräver ömsesidig TLS (mTLS): din server måste
   presentera ett klientcertifikat som du får när du tecknar
   "Swish Handel" hos din bank. Certifikatet läggs som en
   base64-kodad .p12-fil i miljövariabeln SWISH_CERT_P12.

   Miljövariabler:
     SWISH_PAYEE_ALIAS   – ditt Swish-handelsnummer (123XXXXXXX)
     SWISH_CERT_P12      – .p12-certifikatet, base64-kodat
     SWISH_CERT_PASSWORD – lösenord till .p12
     SWISH_ENV           – 'test' (MSS) eller 'production'
     API_URL             – där funktionerna körs (Netlify). Swish ringer
                           tillbaka hit. Sätts bara när sajten ligger på
                           en annan värd än funktionerna.
     SITE_URL            – sajtens adress. Används som reserv om API_URL
                           inte är satt (allt på samma värd).

   Se PAYMENTS_SETUP.md för hur du får tag på allt detta.
   ===================================================== */
'use strict';

const https = require('node:https');
const { randomUUID } = require('node:crypto');

const HOSTS = {
  test: 'mss.cpc.getswish.net',
  production: 'cpc.getswish.net'
};

function swishHost() {
  return HOSTS[process.env.SWISH_ENV === 'production' ? 'production' : 'test'];
}

/** Bygger TLS-optionerna från certifikatet i miljövariabeln. */
function tlsOptions() {
  const b64 = process.env.SWISH_CERT_P12;
  if (!b64) throw new Error('SWISH_CERT_P12 saknas i serverns miljövariabler.');
  return {
    pfx: Buffer.from(b64, 'base64'),
    passphrase: process.env.SWISH_CERT_PASSWORD || ''
  };
}

/** Lågnivå-anrop mot Swish med klientcertifikat. */
function swishRequest(method, path, body) {
  const payload = body ? JSON.stringify(body) : null;
  const opts = {
    host: swishHost(),
    port: 443,
    path,
    method,
    headers: { 'Content-Type': 'application/json' },
    ...tlsOptions()
  };
  if (payload) opts.headers['Content-Length'] = Buffer.byteLength(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = data ? JSON.parse(data) : null; } catch { /* Swish svarar tomt vid 201 */ }
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Swish svarade inte i tid.')));
    if (payload) req.write(payload);
    req.end();
  });
}

/**
 * Skapar en betalningsförfrågan.
 * @param {{amount:number, reference:string, message:string, payerAlias?:string}} p
 *   payerAlias = kundens mobilnummer (46701234567). Utelämnas i
 *   m-commerce (då öppnas Swish-appen direkt på telefonen).
 * @returns {Promise<{id:string, token:string|null}>}
 */
/* Handelsnumret betalningarna går till. Ett Swish-handelsnummer är
   inte en hemlighet — det står på kvitton och skyltar — så det ligger
   som förval här. Miljövariabeln vinner om den är satt, så numret kan
   bytas utan en ny deploy. */
const PAYEE_ALIAS = '1231540459';

async function createPaymentRequest(p) {
  const payee = process.env.SWISH_PAYEE_ALIAS || PAYEE_ALIAS;
  if (!payee) throw new Error('SWISH_PAYEE_ALIAS saknas i serverns miljövariabler.');

  const instructionId = randomUUID().replace(/-/g, '').toUpperCase();
  // Callbacken måste peka dit FUNKTIONERNA ligger — inte dit sajten ligger.
  // Ligger butiken på GitHub Pages och funktionerna på Netlify är det två
  // olika adresser, och då är API_URL den som gäller.
  const api = (process.env.API_URL || process.env.SITE_URL || '').replace(/\/$/, '');
  if (!api) throw new Error('API_URL (eller SITE_URL) saknas i serverns miljövariabler.');

  const body = {
    payeeAlias: payee,
    amount: p.amount.toFixed(2),
    currency: 'SEK',
    callbackUrl: `${api}/.netlify/functions/swish-callback`,
    payeePaymentReference: p.reference.replace(/[^A-Za-z0-9]/g, '').slice(0, 35),
    message: (p.message || 'STEP1 STORE').slice(0, 50)
  };
  if (p.payerAlias) body.payerAlias = p.payerAlias;

  const res = await swishRequest('PUT', `/swish-cpcapi/api/v2/paymentrequests/${instructionId}`, body);

  if (res.status !== 201) {
    const detail = Array.isArray(res.body) ? res.body.map((e) => e.errorCode).join(', ') : res.raw;
    throw new Error(`Swish avvisade betalningen (${res.status}): ${detail}`);
  }

  return {
    id: instructionId,
    // Token används för att öppna Swish-appen / generera QR-kod
    token: res.headers['paymentrequesttoken'] || null
  };
}

/** Hämtar status för en betalning. status: CREATED | PAID | DECLINED | ERROR | CANCELLED */
async function getPaymentRequest(id) {
  const safe = String(id).replace(/[^A-Za-z0-9]/g, '');
  const res = await swishRequest('GET', `/swish-cpcapi/api/v2/paymentrequests/${safe}`, null);
  if (res.status !== 200 || !res.body) throw new Error(`Kunde inte hämta betalstatus (${res.status}).`);
  return res.body;
}

/** Normaliserar mobilnummer till Swish-format: 46701234567 */
function normalisePhone(input) {
  let n = String(input || '').replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('00')) n = n.slice(2);
  if (n.startsWith('0')) n = '46' + n.slice(1);
  if (!n.startsWith('46')) n = '46' + n;
  return n;
}

module.exports = { createPaymentRequest, getPaymentRequest, normalisePhone, swishHost, PAYEE_ALIAS };
