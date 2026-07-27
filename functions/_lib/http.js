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

module.exports = { corsHeaders, isForeignOrigin, allowedOrigins, json };
