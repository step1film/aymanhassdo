/* =====================================================
   ADMIN — mejlinställningar (signaturer)
   =====================================================
   GET                         → { signaturer: { adress: html } }
   POST { konto, signatur }    → { ok: true }

   Signaturerna ligger i Netlify Blobs, inte i repot — repot
   är publikt, och en signatur kan innehålla ett mobilnummer.
   Här följer de med till vilken dator eller telefon man än
   loggar in från. Bara adresser i MAIL_ACCOUNTS kan ha en.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');
const B = require('./_lib/brev');

const NYCKEL = 'installningar';

async function lasIn(store) {
  try { return (await store.get(NYCKEL, { type: 'json' })) || {}; }
  catch { return {}; }
}

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'GET, POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';
  headers['Cache-Control'] = 'no-store, max-age=0';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });
  if (!M.konfigurerad()) return json(503, headers, { fel: 'Mejlfliken är inte igångsatt.' });

  try {
    const store = B.butik(event);
    const inst = await lasIn(store);
    const signaturer = inst.signaturer || {};

    if (event.httpMethod === 'GET') return json(200, headers, { signaturer });

    let d;
    try { d = JSON.parse(event.body || '{}'); }
    catch { return json(400, headers, { fel: 'Trasig JSON.' }); }
    const konto = M.kontoFor(d.konto);
    if (!konto) return json(404, headers, { fel: 'Okänd brevlåda.' });
    const signatur = String(d.signatur || '');
    if (signatur.length > 200000) return json(413, headers, { fel: 'Signaturen är för stor. Använd mindre bilder.' });

    signaturer[konto.adress.toLowerCase()] = signatur;
    await store.setJSON(NYCKEL, { ...inst, signaturer });
    return json(200, headers, { ok: true });
  } catch (e) {
    console.error('mail-settings:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte läsa eller spara inställningarna.' });
  }
};
