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

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const { konfigurerad, likaTider, skapaNyckel, SESSION_TIMMAR } = require('./_lib/admin');

const dröj = ms => new Promise(r => setTimeout(r, ms));

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

  if (!givet || !likaTider(givet, process.env.ADMIN_PASSWORD)) {
    await dröj(Math.max(0, 500 - (Date.now() - start)));
    return json(401, headers, { fel: 'Fel lösenord.' });
  }

  return json(200, headers, {
    session: skapaNyckel(),
    timmar: SESSION_TIMMAR
  });
};
