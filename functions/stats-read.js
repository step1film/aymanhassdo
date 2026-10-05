/* =====================================================
   ADMIN — besöksstatistik
   =====================================================
   GET ?dagar=1|7|30|90 med sessionsnyckeln i X-Admin-Session
   → { period, totalt, perDag, lander, stader, kallor, sidor,
       enheter, justNu }

   Avslutade dygn (före i går) räknas ihop till r/<dag> en
   gång och sparas; de enskilda besöken raderas då. I går
   och i dag räknas fram varje gång — ett besök som pågår
   vid midnatt kan fortfarande skicka tid.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const S = require('./_lib/stats');

const JUST_NU = 5 * 60 * 1000;

/** Hämta alla besök för en dag, några i taget. */
async function besokFor(store, dag) {
  const { blobs } = await store.list({ prefix: 's/' + dag + '/' });
  const ut = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const del = await Promise.all(blobs.slice(i, i + 25).map(b => store.get(b.key, { type: 'json' }).catch(() => null)));
    del.forEach((b, j) => { if (b) ut.push({ key: blobs[i + j].key, ...b }); });
  }
  return ut;
}

async function dagSumma(store, dag, avslutad) {
  if (avslutad) {
    const sparad = await store.get('r/' + dag, { type: 'json' }).catch(() => null);
    if (sparad) return { sum: sparad, besok: [] };
  }
  const besok = await besokFor(store, dag);
  const sum = S.tomDag(dag);
  besok.forEach(b => S.raknaIn(sum, b));
  if (avslutad) {
    await store.setJSON('r/' + dag, sum);
    await Promise.all(besok.map(b => store.delete(b.key).catch(() => {})));
  }
  return { sum, besok };
}

/** Objekt → sorterad lista, störst först. */
function topp(obj, falt, antal) {
  return Object.entries(obj)
    .map(([k, v]) => ({ nyckel: k, ...v }))
    .sort((a, b) => (b[falt] || 0) - (a[falt] || 0))
    .slice(0, antal);
}

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'GET, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'GET') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });

  const q = event.queryStringParameters || {};
  const antal = [1, 7, 30, 90].includes(Number(q.dagar)) ? Number(q.dagar) : 7;

  const idag = S.dagFor();
  const igar = S.dagarFore(idag, 1);
  const dagar = [];
  for (let i = antal - 1; i >= 0; i--) dagar.push(S.dagarFore(idag, i));

  try {
    const store = S.butik(event);
    const svar = await Promise.all(dagar.map(d => dagSumma(store, d, d < igar)));
    const summor = svar.map(s => s.sum);
    const tot = S.slaIhop(summor);

    const nu = Date.now();
    const idagsBesok = svar[svar.length - 1].besok;
    const justNu = idagsBesok.filter(b => nu - (b.senast || 0) < JUST_NU).length;

    return json(200, headers, {
      period: { fran: dagar[0], till: idag, dagar: antal },
      totalt: { besok: tot.besok, visningar: tot.visningar, ms: tot.ms, studs: tot.studs },
      perDag: summor.map(d => ({ dag: d.dag, besok: d.besok, visningar: d.visningar, ms: d.ms })),
      lander: topp(tot.lander, 'besok', 30),
      stader: topp(tot.stader, 'besok', 30),
      kallor: topp(tot.kallor, 'besok', 20),
      sidor: topp(tot.sidor, 'visningar', 20),
      enheter: topp(tot.enheter, 'besok', 5),
      justNu
    });
  } catch (e) {
    console.error('stats-read:', e && e.message);
    return json(502, headers, { fel: 'Kunde inte läsa statistiken. Är Netlify Blobs igång för sajten?' });
  }
};
