/* =====================================================
   ADMIN — besöksstatistik
   =====================================================
   GET ?dagar=1|7|30|90 med sessionsnyckeln i X-Admin-Session
   → { period, totalt, perDag, lander, stader, kallor, sidor,
       enheter, justNu, besokare, besokareFran }

   Avslutade dygn (före i går) räknas ihop till r/<dag> en
   gång och sparas; de enskilda händelserna raderas då och
   besöken sparas hopbyggda i v/<dag>. I går och i dag räknas
   fram varje gång — ett besök som pågår vid midnatt kan
   fortfarande skicka tid.

   besokare är de enskilda besöken, nyast först, för de dygn
   i perioden som ligger inom S.SPARA_BESOK. v/<dag> som är
   äldre än så raderas vid varje läsning.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');
const S = require('./_lib/stats');

const JUST_NU = 5 * 60 * 1000;

/** Hämta dagens händelser, några i taget, och bygg ihop dem till besök. */
async function besokFor(store, dag) {
  const { blobs } = await store.list({ prefix: 'e/' + dag + '/' });
  const perBesokare = new Map();
  for (let i = 0; i < blobs.length; i += 25) {
    const del = blobs.slice(i, i + 25);
    const data = await Promise.all(del.map(b => store.get(b.key, { type: 'json' }).catch(() => null)));
    data.forEach((h, j) => {
      if (!h) return;
      const id = del[j].key.split('/')[2];
      if (!perBesokare.has(id)) perBesokare.set(id, []);
      perBesokare.get(id).push(h);
    });
  }
  const besok = [];
  for (const h of perBesokare.values()) { const b = S.byggBesok(h); if (b) besok.push(b); }
  return { besok, nycklar: blobs.map(b => b.key) };
}

async function dagSumma(store, dag, avslutad, medBesok) {
  if (avslutad) {
    const sparad = await store.get('r/' + dag, { type: 'json' }).catch(() => null);
    if (sparad) {
      const besok = medBesok ? (await store.get('v/' + dag, { type: 'json' }).catch(() => null)) || [] : [];
      return { sum: sparad, besok };
    }
  }
  const { besok, nycklar } = await besokFor(store, dag);
  const sum = S.tomDag(dag);
  besok.forEach(b => S.raknaIn(sum, b));
  if (avslutad) {
    if (medBesok && besok.length) await store.setJSON('v/' + dag, besok.map(S.besokUt));
    await store.setJSON('r/' + dag, sum);
    for (let i = 0; i < nycklar.length; i += 25) {
      await Promise.all(nycklar.slice(i, i + 25).map(k => store.delete(k).catch(() => {})));
    }
  }
  return { sum, besok: medBesok ? besok.map(S.besokUt) : [] };
}

/** Radera sparade besök som är äldre än S.SPARA_BESOK dygn. */
async function rensaBesok(store, grans) {
  const { blobs } = await store.list({ prefix: 'v/' });
  const gamla = blobs.map(b => b.key).filter(k => k.slice(2) < grans);
  await Promise.all(gamla.map(k => store.delete(k).catch(() => {})));
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
    const besokGrans = S.dagarFore(idag, S.SPARA_BESOK - 1);
    const svar = await Promise.all(dagar.map(d => dagSumma(store, d, d < igar, d >= besokGrans)));
    await rensaBesok(store, besokGrans).catch(e => console.error('stats-read rensa:', e && e.message));
    const summor = svar.map(s => s.sum);
    const tot = S.slaIhop(summor);

    const nu = Date.now();
    const idagsBesok = svar[svar.length - 1].besok;
    const justNu = idagsBesok.filter(b => nu - (b.senast || 0) < JUST_NU).length;

    const allaBesok = svar.flatMap(x => x.besok).sort((a, b) => b.start - a.start);

    return json(200, headers, {
      period: { fran: dagar[0], till: idag, dagar: antal },
      totalt: { besok: tot.besok, visningar: tot.visningar, ms: tot.ms, studs: tot.studs },
      perDag: summor.map(d => ({ dag: d.dag, besok: d.besok, visningar: d.visningar, ms: d.ms })),
      lander: topp(tot.lander, 'besok', 30),
      stader: topp(tot.stader, 'besok', 30),
      kallor: topp(tot.kallor, 'besok', 20),
      sidor: topp(tot.sidor, 'visningar', 20),
      enheter: topp(tot.enheter, 'besok', 5),
      justNu,
      besokare: allaBesok.slice(0, 1000),
      besokareTotalt: allaBesok.length,
      besokareFran: dagar[0] > besokGrans ? dagar[0] : besokGrans
    });
  } catch (e) {
    console.error('stats-read:', e && e.name, e && e.message);
    return json(502, headers, { fel: 'Kunde inte läsa statistiken (' + ((e && e.name) || 'okänt fel') + '). Se funktionsloggen för stats-read i Netlify.' });
  }
};
