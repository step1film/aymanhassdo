/* =====================================================
   ADMIN — ladda upp en stor bilaga i delar
   =====================================================
   POST { id, del, data }   data är base64, högst ~3,5 MB rått
   → { ok: true }

   Ett anrop får vara högst sex megabyte, så en stor fil
   delas upp i webbläsaren och skickas hit bit för bit. Delarna
   läggs i Netlify Blobs under u/<id>/<del> och sätts ihop av
   mail-send eller mail-draft, som också tar bort dem efteråt.

   id börjar med en tidsstämpel. Delar som blivit liggande —
   en flik som stängdes mitt i — städas bort efter ett dygn,
   första gången en ny uppladdning börjar.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');
const B = require('./_lib/brev');

const MAX_DEL = 3.6 * 1024 * 1024;
const DYGN = 24 * 60 * 60 * 1000;

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

  if (!B.UPP_ID.test(String(d.id))) return json(400, headers, { fel: 'Ogiltigt id.' });
  const del = Number(d.del);
  if (!Number.isInteger(del) || del < 0 || del > 9) return json(400, headers, { fel: 'Ogiltig del.' });
  if (typeof d.data !== 'string') return json(400, headers, { fel: 'Data saknas.' });
  const bit = Buffer.from(d.data, 'base64');
  if (!bit.length || bit.length > MAX_DEL) return json(413, headers, { fel: 'Delen är för stor.' });

  try {
    const store = B.butik(event);
    await store.set(`u/${d.id}/${del}`, bit);

    if (del === 0) {
      try {
        const { blobs } = await store.list({ prefix: 'u/' });
        const gamla = blobs.filter(b => {
          const t = Number(b.key.split('/')[1].split('-')[0]);
          return Number.isFinite(t) && Date.now() - t > DYGN;
        });
        await Promise.all(gamla.slice(0, 50).map(b => store.delete(b.key)));
      } catch { /* städningen får vänta till nästa gång */ }
    }
    return json(200, headers, { ok: true });
  } catch (e) {
    console.error('mail-upload:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte ta emot filen.' });
  }
};
