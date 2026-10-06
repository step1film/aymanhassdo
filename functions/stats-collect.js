/* =====================================================
   STATISTIK — tar emot sidvisningar från stats.js
   =====================================================
   POST med en liten JSON-kropp, skickad med sendBeacon som
   text/plain (då behövs ingen CORS-förfrågan i förväg).

     { t: 'pv',  p: '/om/', r: 'https://google.com/', w: 1440, u: 'newsletter', l: 'sv-SE' }
     { t: 'tid', p: '/om/', ms: 42000 }

   Svarar alltid 204 utan innehåll. En besökare ska aldrig
   märka att statistiken krånglar.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, skapaSpärr, clientIp } = require('./_lib/http');
const S = require('./_lib/stats');

const spärrad = skapaSpärr({ windowMs: 10 * 60 * 1000, max: 300 });
const MAX_TID = 30 * 60 * 1000;     // en sida räknas högst en halvtimme åt gången

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  const klart = { statusCode: 204, headers, body: '' };

  if (event.httpMethod === 'OPTIONS') return klart;
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: '' };
  if (isForeignOrigin(event)) return { statusCode: 403, headers, body: '' };

  const ua = (event.headers && event.headers['user-agent']) || '';
  if (!ua || S.ROBOT.test(ua)) return klart;

  const ip = clientIp(event);
  if (spärrad(ip)) return klart;

  let d;
  try {
    const kropp = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
    if (kropp.length > 2048) return klart;
    d = JSON.parse(kropp);
  } catch { return klart; }
  if (!d || (d.t !== 'pv' && d.t !== 'tid')) return klart;

  /* Bara sökvägen — frågesträngar kan bära e-post, ordernummer och annat. */
  const sida = String(d.p || '/').split(/[?#]/)[0].slice(0, 120) || '/';
  if (/^\/admin/.test(sida)) return klart;

  const nu = Date.now();
  const dag = S.dagFor(nu);
  const nyckel = 'e/' + dag + '/' + S.besokarId(ip, ua, dag) + '/' + nu + '-' + Math.random().toString(36).slice(2, 8);

  let h;
  if (d.t === 'pv') {
    /* Land, källa och enhet följer med varje sidvisning. Besöket tar
       dem från sin första när det byggs ihop i stats-read. */
    h = { t: 'pv', ts: nu, p: sida, ...S.plats(event), kalla: S.kalla(d.r, d.u), enhet: S.enhet(d.w),
      ...S.programvara(ua), sprak: String(d.l || '').replace(/[^A-Za-z-]/g, '').slice(0, 12),
      bredd: Math.max(0, Math.min(10000, Math.round(Number(d.w) || 0))) };
  } else {
    const ms = Math.max(0, Math.min(MAX_TID, Math.round(Number(d.ms) || 0)));
    if (!ms) return klart;
    h = { t: 'tid', ts: nu, p: sida, ms };
  }

  try {
    await S.butik(event).setJSON(nyckel, h);
  } catch (e) {
    console.error('stats-collect:', e && e.message);
  }
  return klart;
};
