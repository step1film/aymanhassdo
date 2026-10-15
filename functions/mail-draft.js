/* =====================================================
   ADMIN — spara utkast
   =====================================================
   POST samma fält som mail-send, plus ersatt?
   → { ok: true, uid }

   Utkastet läggs i brevlådans Utkast-mapp, så det syns i
   telefonens mejlprogram också. `ersatt` är uid för förra
   versionen av samma utkast; den tas bort när den nya ligger
   på plats. Inga fält är obligatoriska — ett utkast får vara
   halvfärdigt — men adresserna som står där ska vara giltiga.
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
    t = await B.tolka(event, d, { strikt: false });
  } catch (e) {
    console.error('mail-draft (bilagor):', e && e.message);
    return json(502, headers, { fel: 'Kunde inte hämta bilagorna.' });
  }
  if (t.fel) return json(t.status || 400, headers, { fel: t.fel });

  const ersatt = Number(d.ersatt);
  try {
    const svar = await M.sparaUtkast(t.konto, t.brev, Number.isInteger(ersatt) && ersatt > 0 ? ersatt : null);
    if (!svar.ok) return json(404, headers, { fel: 'Hittade ingen Utkast-mapp i brevlådan.' });
    await B.stada(event, t.uppladdningar);
    return json(200, headers, svar);
  } catch (e) {
    console.error('mail-draft:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte spara utkastet.' });
  }
};
