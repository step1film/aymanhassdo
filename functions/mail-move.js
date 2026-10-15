/* =====================================================
   ADMIN — flytta ett brev
   =====================================================
   POST { konto, mapp, uid, till }
   → { ok: true }

   Både mapp och till är ord ur M.MAPPAR — 'inkorg',
   'skrap', 'papperskorg' … — aldrig fria mappnamn. Används
   för "Inte skräppost" och "Återställ" ur papperskorgen.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';
  headers['Cache-Control'] = 'no-store, max-age=0';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });
  if (!M.konfigurerad()) return json(503, headers, { fel: 'Mejlfliken är inte igångsatt.' });

  let d;
  try { d = JSON.parse(event.body || '{}'); }
  catch { return json(400, headers, { fel: 'Trasig JSON.' }); }

  const konto = M.kontoFor(d.konto);
  if (!konto) return json(404, headers, { fel: 'Okänd brevlåda.' });
  const uid = Number(d.uid);
  if (!Number.isInteger(uid) || uid < 1) return json(400, headers, { fel: 'Ogiltigt uid.' });
  if (!M.MAPPAR.includes(d.mapp) || !M.MAPPAR.includes(d.till)) return json(400, headers, { fel: 'Okänd mapp.' });

  try {
    const svar = await M.flytta(konto, { mapp: d.mapp, uid, till: d.till });
    if (!svar.ok) return json(404, headers, { fel: 'Hittade inte mappen i brevlådan.' });
    return json(200, headers, { ok: true });
  } catch (e) {
    console.error('mail-move:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte flytta brevet.' });
  }
};
