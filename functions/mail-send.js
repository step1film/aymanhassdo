/* =====================================================
   ADMIN — skicka mejl
   =====================================================
   POST { konto, till, kopia?, dold?, amne, text, html?,
          bilagor?, uppladdade?, medfoljande?,
          svarPa?, referenser?, utkast? }
   → { ok: true, id, iSkickat }

   Brevet och bilagorna tolkas i _lib/brev.js. Avsändaren
   bestäms av `konto` och slås upp mot MAIL_ACCOUNTS på
   servern — webbläsaren kan inte skicka i någon annans namn.

   `utkast` är uid för ett utkast som brevet skrevs från.
   Det tas bort ur Utkast när brevet gått iväg.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');
const B = require('./_lib/brev');

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

  let t;
  try {
    t = await B.tolka(event, d, { strikt: true });
  } catch (e) {
    console.error('mail-send (bilagor):', e && e.message);
    return json(502, headers, { fel: 'Kunde inte hämta bilagorna.' });
  }
  if (t.fel) return json(t.status || 400, headers, { fel: t.fel });

  try {
    const svar = await M.skicka(t.konto, t.brev);
    /* Brevet är ute. Städningen får inte göra det till ett fel. */
    const utkast = Number(d.utkast);
    if (Number.isInteger(utkast) && utkast > 0) {
      try { await M.raderaUtkast(t.konto, utkast); } catch {}
    }
    await B.stada(event, t.uppladdningar);
    return json(200, headers, { ok: true, ...svar });
  } catch (e) {
    console.error('mail-send:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte skicka. Kontrollera SMTP-uppgifterna hos one.com.' });
  }
};
