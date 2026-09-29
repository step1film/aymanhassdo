/* =====================================================
   ADMIN — radera ett brev
   =====================================================
   POST { konto, uid, mapp? }   mapp: 'inkorg' (standard) eller 'skickat'
   → { ok: true, borta: false }   flyttat till papperskorgen
   → { ok: true, borta: true }    raderat på riktigt (låg redan där)

   POST och inte DELETE: adminsidan pratar JSON över POST med
   alla andra funktioner, och en metod till här hade bara varit
   en sak till att hålla reda på i CORS-raderna.

   Raderingen görs i mail.js. Den flyttar till papperskorgen i
   första hand — se kommentaren där om varför.
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

  /* Samma kontroll som i mail-read: uid går rakt in i ett
     IMAP-kommando, och `1:*` hade raderat hela brevlådan. */
  const uid = Number(d.uid);
  if (!Number.isInteger(uid) || uid < 1) return json(400, headers, { fel: 'Ogiltigt uid.' });

  /* Bara mapparna listan känner till. Ett fritt mappnamn härifrån
     hade låtit webbläsaren peka ut vilken brevlåda som helst. */
  const mapp = M.MAPPAR.includes(d.mapp) ? d.mapp : 'inkorg';

  try {
    const svar = await M.radera(konto, { mapp, uid });
    if (!svar.ok) {
      return json(409, headers, { fel: 'Brevlådan har ingen papperskorg, så brevet lämnades orört.' });
    }
    return json(200, headers, svar);
  } catch (e) {
    console.error('mail-delete:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte radera brevet.' });
  }
};
