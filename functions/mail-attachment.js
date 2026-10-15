/* =====================================================
   ADMIN — en bilaga
   =====================================================
   GET ?konto=…&uid=…&mapp=inkorg|skickat&nr=0
   → { namn, typ, storlek, data }   (data är base64)

   Filen går genom funktionen och lagras ingenstans, precis
   som breven. Netlify tillåter högst sex megabyte i ett svar,
   och base64 gör filen en tredjedel större — därför går det
   att hämta bilagor upp till drygt fyra megabyte här. Större
   filer får man öppna i mejlprogrammet; svaret säger det.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');

/* 4,3 MB råa byte blir ungefär 5,75 MB base64 — strax under
   Netlifys gräns med plats kvar för resten av svaret. */
const MAX_BYTE = 4.3 * 1024 * 1024;

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
  /* Samma skäl som i mail-read: bara ett heltal får gå in i IMAP. */
  const uid = Number(q.uid);
  if (!Number.isInteger(uid) || uid < 1) return json(400, headers, { fel: 'Ogiltigt uid.' });
  const nr = Number(q.nr);
  if (!Number.isInteger(nr) || nr < 0) return json(400, headers, { fel: 'Ogiltig bilaga.' });

  const mapp = q.mapp || 'inkorg';
  if (!M.MAPPAR.includes(mapp)) return json(400, headers, { fel: 'Okänd mapp.' });

  try {
    const b = await M.bilaga(konto, { mapp, uid, nr });
    if (!b) return json(404, headers, { fel: 'Bilagan finns inte kvar.' });
    if (b.innehall.length > MAX_BYTE) {
      return json(413, headers, { fel: 'Filen är för stor för att hämtas här (över 4 MB). Öppna den i ditt vanliga mejlprogram.' });
    }
    return json(200, headers, {
      namn: b.namn,
      typ: b.typ,
      storlek: b.innehall.length,
      data: b.innehall.toString('base64')
    });
  } catch (e) {
    console.error('mail-attachment:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte hämta bilagan.' });
  }
};
