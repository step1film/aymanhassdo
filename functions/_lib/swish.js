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
                           tillbaka hit. Behövs bara om funktionerna ligger
                           på en annan adress än den Netlify själv sätter.
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

/* Swish Handel tar bara belopp inom det här spannet. Kontrollen görs
   här också, inte bara hos Swish, så kunden möts av ett begripligt
   fel i kassan i stället för ett rått API-svar. */
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 150000;

/** Adressen Swish ska ringa tillbaka till — dit FUNKTIONERNA ligger.
    Netlify sätter URL automatiskt, så en callback hamnar rätt även om
    SITE_URL pekar på GitHub Pages där butiken visas. */
function apiBaseUrl() {
  return (process.env.API_URL || process.env.URL || process.env.SITE_URL || '').replace(/\/$/, '');
}

/** true när servern har allt som krävs för en Swish-betalning.
    Används av payment-methods.js: saknas något visas inte Swish alls
    i kassan, i stället för att kunden möts av ett serverfel. */
function swishConfigured() {
  return Boolean(process.env.SWISH_CERT_P12 && (process.env.SWISH_PAYEE_ALIAS || PAYEE_ALIAS) && apiBaseUrl());
}

/** Swish kräver landsnummer utan inledande nolla: 46 + svenskt mobilnummer. */
function isValidPayerAlias(n) {
  return /^467\d{8}$/.test(String(n || ''));
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
  const api = apiBaseUrl();
  if (!api) throw new Error('API_URL (eller SITE_URL) saknas i serverns miljövariabler.');

  /* Beloppet kommer från catalog.js, aldrig från webbläsaren — men en
     tom vagn eller ett räknefel ska inte bli en betalningsförfrågan. */
  const amount = Number(p.amount);
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
    throw new Error(`Ogiltigt belopp: ${p.amount}`);
  }

  const body = {
    payeeAlias: payee,
    amount: amount.toFixed(2),
    currency: 'SEK',
    callbackUrl: `${api}/.netlify/functions/swish-callback`,
    payeePaymentReference: p.reference.replace(/[^A-Za-z0-9]/g, '').slice(0, 35),
    message: (p.message || 'STEP1 STORE').slice(0, 50)
  };
  /* Skickas payerAlias går förfrågan RAKT ut till den telefonen. Ett
     felskrivet nummer hade landat hos en främling som ombeds betala vår
     order — därför måste formatet stämma, annars körs QR-flödet i
     stället (kunden skannar själv och inget skickas till någon). */
  if (p.payerAlias && isValidPayerAlias(p.payerAlias)) body.payerAlias = p.payerAlias;

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

module.exports = {
  createPaymentRequest, getPaymentRequest, normalisePhone, isValidPayerAlias,
  swishConfigured, swishHost, apiBaseUrl, PAYEE_ALIAS, MIN_AMOUNT, MAX_AMOUNT
};
