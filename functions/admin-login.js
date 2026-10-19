/* =====================================================
   ADMIN — inloggning
   =====================================================
   POST { losenord } → { session }

   Rätt lösenord ger en HMAC-signerad sessionsnyckel med
   utgångstid. Servern sparar ingenting; giltigheten går
   att räkna fram ur signaturen.

   Ett fel lösenord svarar alltid efter minst en halv sekund.
   Det gör gissningar långsamma nog att vara meningslösa mot
   ett långt lösenord, utan att en riktig inloggning känns trög.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json, clientIp } = require('./_lib/http');
const { konfigurerad, likaTider, skapaNyckel, SESSION_TIMMAR } = require('./_lib/admin');

const dröj = ms => new Promise(r => setTimeout(r, ms));

/* Fördröjningen gör en gissning i taget långsam, men inte tusen
   samtidiga. Därför räknas också misslyckade försök per IP-adress:
   tio fel inom en kvart, sedan är inloggningen stängd för den
   adressen tills kvarten gått. Räknaren lever i funktionsinstansen
   och är ingen mur — men den gör en gissningsattack meningslös. */
const FONSTER = 15 * 60 * 1000;
const MAX_FEL = 10;
const fel = new Map();
const felFor = (ip) => (fel.get(ip) || []).filter(t => Date.now() - t < FONSTER);
function noteraFel(ip) {
  const t = felFor(ip);
  t.push(Date.now());
  fel.set(ip, t);
  if (fel.size > 1000) for (const [k] of fel) if (!felFor(k).length) fel.delete(k);
}

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });

  if (!konfigurerad()) {
    return json(503, headers, {
      fel: 'Admin är inte igångsatt. ADMIN_PASSWORD, ADMIN_SECRET och GITHUB_TOKEN saknas i miljön.'
    });
  }

  let kropp;
  try { kropp = JSON.parse(event.body || '{}'); }
  catch { return json(400, headers, { fel: 'Trasig förfrågan.' }); }

  const givet = typeof kropp.losenord === 'string' ? kropp.losenord : '';
  const start = Date.now();
  const ip = clientIp(event) || 'okänd';

  if (felFor(ip).length >= MAX_FEL) {
    return json(429, headers, { fel: 'För många felaktiga försök. Vänta en kvart och försök igen.' });
  }

  if (!givet || !likaTider(givet, process.env.ADMIN_PASSWORD)) {
    noteraFel(ip);
    await dröj(Math.max(0, 500 - (Date.now() - start)));
    return json(401, headers, { fel: 'Fel lösenord.' });
  }

  return json(200, headers, {
    session: skapaNyckel(),
    timmar: SESSION_TIMMAR
  });
};
