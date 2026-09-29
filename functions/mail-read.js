/* =====================================================
   ADMIN — ett helt brev
   =====================================================
   GET ?konto=…&uid=…&mapp=inkorg|skickat
   → { amne, fran, till, kopia, dold, datum, html, text, bilagor }

   Brevet markeras som läst i samma anrop. HTML:en skickas
   rå härifrån och saneras i admin innan den visas — se
   renaHtml() i admin.js.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';
  headers['Cache-Control'] = 'no-store, max-age=0';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });
  if (!M.konfigurerad()) return json(503, headers, { fel: 'Mejlfliken är inte igångsatt.' });

  const q = event.queryStringParameters || {};
  const konto = M.kontoFor(q.konto);
  if (!konto) return json(404, headers, { fel: 'Okänd brevlåda.' });
  /* uid går rakt in i ett IMAP-kommando. Bara ett heltal släpps
     igenom — annars kan `1:*` be om hela brevlådan på en gång. */
  const uid = Number(q.uid);
  if (!Number.isInteger(uid) || uid < 1) return json(400, headers, { fel: 'Ogiltigt uid.' });

  const mapp = q.mapp || 'inkorg';
  if (!M.MAPPAR.includes(mapp)) return json(400, headers, { fel: 'Okänd mapp.' });

  try {
    const brev = await M.las(konto, { mapp, uid });
    if (!brev) return json(404, headers, { fel: 'Brevet finns inte kvar.' });
    return json(200, headers, brev);
  } catch (e) {
    console.error('mail-read:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte hämta brevet.' });
  }
};
