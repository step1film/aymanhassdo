/* =====================================================
   STEP1 STORE — delade HTTP-hjälpare
   =====================================================
   CORS: endast den egna sajten får anropa betalnings-
   endpointerna. Med '*' skulle vilken främmande webbplats
   som helst kunna skapa betalningar i ditt namn.

   Tillåtna ursprung sätts via SITE_URL (+ localhost för
   lokal utveckling med `netlify dev`).
   ===================================================== */
'use strict';

function allowedOrigins() {
  const list = [];
  if (process.env.SITE_URL) list.push(process.env.SITE_URL.replace(/\/$/, ''));
  // Netlify sätter URL automatiskt till sajtens egen adress. Utan den
  // nekas anrop från .netlify.app — där samma butik också visas.
  if (process.env.URL) list.push(process.env.URL.replace(/\/$/, ''));
  // Behåll GitHub Pages-adressen så länge butiken ligger kvar där
  list.push(
    'https://step1film.se',
    'https://www.step1film.se',
    'https://step1film.github.io',
    'https://step1film.netlify.app'
  );
  if (process.env.NETLIFY_DEV === 'true' || process.env.NODE_ENV === 'development') {
    list.push('http://localhost:8888', 'http://127.0.0.1:8888');
  }
  return [...new Set(list)];
}

/** CORS-headers för ett anrop — speglar bara godkända ursprung. */
function corsHeaders(event, methods = 'POST, OPTIONS') {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  const allowed = allowedOrigins();
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    // Okänt ursprung: släpp inte igenom webbläsaranrop
    headers['Access-Control-Allow-Origin'] = allowed[0] || 'null';
  }
  return headers;
}

/** true om anropet kommer från ett ursprung vi inte litar på. */
function isForeignOrigin(event) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || '';
  if (!origin) return false;            // t.ex. serveranrop / curl — inte en webbläsare
  return !allowedOrigins().includes(origin);
}

const json = (statusCode, headers, body) => ({ statusCode, headers, body: JSON.stringify(body) });


/* -----------------------------------------------------
   ENKEL SPÄRR MOT MISSBRUK
   -----------------------------------------------------
   Räknaren lever i funktionsinstansen. Den stoppar inte en
   angripare med tusen IP-adresser, men den stoppar allt som
   går genom en och samma, och den kostar ingenting. Ett
   riktigt skydd hör hemma i en KV-store — se PAYMENTS_SETUP.md.

   Varje funktionsfil har sin egen instans, alltså sin egen
   räknare. Det är avsiktligt: en spärr på fraktpriser ska
   inte kunna låsa ute någon från att betala.
--------------------------------------------------- */
function skapaSpärr({ windowMs = 10 * 60 * 1000, max = 10 } = {}) {
  const träffar = new Map();

  return function spärrad(nyckel, egetMax) {
    if (!nyckel) return false;
    const tak = egetMax || max;
    const nu = Date.now();
    const tider = (träffar.get(nyckel) || []).filter((t) => nu - t < windowMs);
    tider.push(nu);
    träffar.set(nyckel, tider);
    if (träffar.size > 500) {
      for (const [k, v] of träffar) if (!v.length || nu - v[v.length - 1] > windowMs) träffar.delete(k);
    }
    return tider.length > tak;
  };
}

/** Kundens IP så som Netlify ser den. */
function clientIp(event) {
  const h = (event && event.headers) || {};
  return h['x-nf-client-connection-ip'] || (h['x-forwarded-for'] || '').split(',')[0].trim() || '';
}

module.exports = { corsHeaders, isForeignOrigin, allowedOrigins, json, skapaSpärr, clientIp };
