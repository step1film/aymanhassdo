/* =====================================================
   ADMIN — inkorgens rubriker
   =====================================================
   GET ?konto=info@step1film.se&mapp=inkorg|skickat&fran=0
   med sessionsnyckeln i X-Admin-Session
   → { konton: [...], mapp, totalt, brev: [...] }

   Utan ?konto svarar den bara med listan över brevlådor, så
   fliken kan rita sina val innan något valts.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const M = require('./_lib/mail');

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';
  /* Post är personlig. Ingen mellanhand får spara den. */
  headers['Cache-Control'] = 'no-store, max-age=0';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });
  if (!M.konfigurerad()) return json(503, headers, { fel: 'Mejlfliken är inte igångsatt. Sätt MAIL_ACCOUNTS.' });

  const q = event.queryStringParameters || {};
  const konton = M.kontolista();

  if (!q.konto) return json(200, headers, { konton, brev: [], totalt: 0 });

  const konto = M.kontoFor(q.konto);
  if (!konto) return json(404, headers, { fel: 'Okänd brevlåda.' });

  const mapp = q.mapp || 'inkorg';
  if (!M.MAPPAR.includes(mapp)) return json(400, headers, { fel: 'Okänd mapp.' });
  const fran = Math.max(0, Number(q.fran) || 0);
  const antal = Math.min(50, Math.max(5, Number(q.antal) || 25));

  try {
    const { totalt, brev, saknas } = await M.lista(konto, { mapp, fran, antal });
    if (saknas) return json(404, headers, { fel: 'Hittade ingen Skickat-mapp i brevlådan.' });
    return json(200, headers, { konton, mapp, totalt, fran, brev });
  } catch (e) {
    /* Felmeddelandet från IMAP kan innehålla serverns svar ordagrant.
       Det går till loggen, inte till webbläsaren. */
    console.error('mail-list:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte läsa brevlådan. Kontrollera MAIL_ACCOUNTS och att IMAP är påslaget hos one.com.' });
  }
};
