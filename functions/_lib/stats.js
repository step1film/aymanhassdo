/* =====================================================
   STEP1FILM — besöksstatistik, delat bibliotek
   =====================================================
   Egen, enkel statistik i stället för Google Analytics.
   Ingen cookie, ingen lagring i besökarens webbläsare och
   ingen IP-adress sparas.

   HUR EN BESÖKARE KÄNNS IGEN
   -----------------------------------------------------
   Samma knep som Plausible och Fathom använder: servern
   räknar fram ett id ur IP-adress + webbläsare + dygnets
   salt och sparar bara hashen. Saltet byts varje dygn och
   sparas aldrig, så id:t går inte att föra tillbaka till en
   person — och samma person får ett nytt id i morgon. Ett
   "besök" är alltså en besökare under ett dygn.

   VAR DET LIGGER
   -----------------------------------------------------
   Netlify Blobs, butiken "statistik". Ingen extra tjänst,
   inget konto, ingen miljövariabel — Netlify kopplar in den
   själv.

     e/<dag>/<id>/<tid>-<slump>   en händelse: sidvisning eller tid
     r/<dag>                      dygnets sammanställning

   Varje händelse är en egen post som skrivs en gång och
   aldrig läses om och skrivs över. Blobs från en funktion
   i Lambda-format läser med "eventual consistency" — en
   läsning kan vara upp till en minut gammal — och då hade
   ett besök som uppdaterades på plats tappat sidvisningar
   när någon klickade snabbt. Besöken byggs ihop vid läsning.

   Ett avslutat dygn räknas ihop till r/<dag> första gången
   adminsidan frågar efter det, och de enskilda händelserna
   raderas då. Besöken sparas samtidigt hopbyggda i v/<dag>
   så att man kan klicka på en besökare och se stad, enhet,
   webbläsare och vilka sidor den läste. De raderas efter
   SPARA_BESOK dygn — sedan finns bara siffrorna kvar.

     v/<dag>                      dygnets besök, högst 30 dygn

   Webbläsarens identifierande sträng (user-agent) sparas
   aldrig som den är, bara namnet på webbläsaren och systemet.
   ===================================================== */
'use strict';

const crypto = require('crypto');
const { getStore, connectLambda } = require('@netlify/blobs');

const ZON = 'Europe/Stockholm';
const SPARA_BESOK = 30;           // dygn som enskilda besök finns kvar

/** Butiken. connectLambda behövs för funktioner i Lambda-format. */
function butik(event) {
  connectLambda(event);
  /* Inte consistency: 'strong' — connectLambda sätter ingen
     uncachedEdgeURL, och då kastar varje anrop BlobsConsistencyError. */
  return getStore({ name: 'statistik' });
}

/** YYYY-MM-DD i svensk tid. */
function dagFor(ms = Date.now()) {
  return new Date(ms).toLocaleDateString('sv-SE', { timeZone: ZON });
}

/** Dagen `n` dygn före `dag`. Räknar mitt på dagen så sommartid inte flyttar datumet. */
function dagarFore(dag, n) {
  const d = new Date(dag + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Besökarens id för i dag. Bara hashen lämnar funktionen. */
function besokarId(ip, ua, dag) {
  const salt = process.env.STATS_SALT || process.env.ADMIN_SECRET || 'step1film-statistik';
  return crypto.createHash('sha256').update(salt + '|' + dag + '|' + ip + '|' + ua).digest('hex').slice(0, 20);
}

/* -----------------------------------------------------
   Var besökaren är
   -----------------------------------------------------
   Netlify slår upp IP-adressen åt oss och lägger svaret i
   x-nf-geo (base64-kodad JSON). Vi tar land och stad och
   släpper resten — koordinater sparas inte.
----------------------------------------------------- */
function plats(event) {
  const h = (event && event.headers) || {};
  const ra = h['x-nf-geo'];
  let g = null;
  if (ra) {
    try { g = JSON.parse(Buffer.from(ra, 'base64').toString('utf8')); }
    catch { try { g = JSON.parse(ra); } catch { g = null; } }
  }
  const land = (g && g.country && g.country.code) || h['x-country'] || '';
  return {
    land: String(land).slice(0, 2).toUpperCase(),
    landnamn: String((g && g.country && g.country.name) || '').slice(0, 60),
    stad: String((g && g.city) || '').slice(0, 60),
    region: String((g && g.subdivision && g.subdivision.name) || '').slice(0, 60)
  };
}

/* -----------------------------------------------------
   Varifrån besökaren kom
----------------------------------------------------- */
const EGNA = /(^|\.)step1film\.(se|github\.io|netlify\.app)$/;
const KANDA = [
  [/(^|\.)google\./, 'Google'],
  [/(^|\.)bing\.com$/, 'Bing'],
  [/(^|\.)duckduckgo\.com$/, 'DuckDuckGo'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'Facebook'],
  [/(^|\.)instagram\.com$/, 'Instagram'],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, 'LinkedIn'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'X / Twitter'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'YouTube'],
  [/(^|\.)vimeo\.com$/, 'Vimeo'],
  [/(^|\.)tiktok\.com$/, 'TikTok'],
  [/(^|\.)(messenger\.com|m\.me)$/, 'Messenger'],
  [/(^|\.)chatgpt\.com$/, 'ChatGPT'],
  [/(^|\.)(mail\.google\.com|outlook\.(live|office)\.com)$/, 'E-post']
];

function kalla(ref, utm) {
  if (utm) return String(utm).slice(0, 40);
  if (!ref) return 'Direkt';
  let host = '';
  try { host = new URL(ref).hostname.toLowerCase(); } catch { return 'Direkt'; }
  if (!host || EGNA.test(host)) return '';             // intern navigering
  for (const [m, namn] of KANDA) if (m.test(host)) return namn;
  return host.replace(/^(www|m|l|lm)\./, '').slice(0, 60);
}

function enhet(bredd) {
  const b = Number(bredd) || 0;
  if (!b) return 'Okänd';
  if (b < 700) return 'Mobil';
  if (b < 1100) return 'Surfplatta';
  return 'Dator';
}

/* -----------------------------------------------------
   Webbläsare och system
   -----------------------------------------------------
   Ur user-agent. Ordningen spelar roll: Edge, Opera och
   Samsung säger alla också "Chrome", och Chrome säger
   "Safari".
----------------------------------------------------- */
const WEBBLASARE = [
  [/Edg(e|A|iOS)?\//, 'Edge'],
  [/OPR\/|Opera/, 'Opera'],
  [/SamsungBrowser/, 'Samsung Internet'],
  [/FBAN|FBAV|FB_IAB/, 'Facebook (inbyggd)'],
  [/Instagram/, 'Instagram (inbyggd)'],
  [/Firefox|FxiOS/, 'Firefox'],
  [/Chrome|CriOS/, 'Chrome'],
  [/Safari/, 'Safari']
];
const SYSTEM = [
  [/iPad/, 'iPadOS'],
  [/iPhone|iPod/, 'iOS'],
  [/Android/, 'Android'],
  [/CrOS/, 'ChromeOS'],
  [/Windows/, 'Windows'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Linux/, 'Linux']
];

function programvara(ua) {
  const u = String(ua || '');
  const hitta = (lista) => { for (const [m, namn] of lista) if (m.test(u)) return namn; return ''; };
  return { webblasare: hitta(WEBBLASARE), os: hitta(SYSTEM) };
}

const ROBOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch/i;

/* -----------------------------------------------------
   Sammanställning
----------------------------------------------------- */
function tomDag(dag) {
  return { dag, besok: 0, visningar: 0, ms: 0, studs: 0,
    lander: {}, stader: {}, kallor: {}, sidor: {}, enheter: {} };
}

function lagg(obj, nyckel, falt) {
  const r = obj[nyckel] || (obj[nyckel] = {});
  for (const k in falt) r[k] = (r[k] || 0) + falt[k];
  return r;
}

/** Bygg ihop händelserna för en besökare till ett besök. */
function byggBesok(handelser) {
  handelser.sort((a, b) => a.ts - b.ts);
  const forsta = handelser.find(h => h.t === 'pv');
  if (!forsta) return null;
  const b = {
    start: forsta.ts, senast: forsta.ts,
    land: forsta.land, landnamn: forsta.landnamn, stad: forsta.stad, region: forsta.region,
    kalla: forsta.kalla || 'Direkt', enhet: forsta.enhet,
    webblasare: forsta.webblasare || '', os: forsta.os || '',
    sprak: forsta.sprak || '', bredd: forsta.bredd || 0,
    visningar: 0, ms: 0, sidor: {}, vag: []
  };
  for (const h of handelser) {
    const s = b.sidor[h.p] || (b.sidor[h.p] = { visningar: 0, ms: 0 });
    if (h.t === 'pv') {
      b.visningar += 1; s.visningar += 1;
      b.vag.push({ p: h.p, ts: h.ts, ms: 0 });
    } else {
      b.ms += h.ms || 0; s.ms += h.ms || 0;
      /* Tiden hör till den senaste visningen av samma sida. */
      for (let i = b.vag.length - 1; i >= 0; i--) {
        if (b.vag[i].p === h.p) { b.vag[i].ms += h.ms || 0; break; }
      }
    }
    b.senast = Math.max(b.senast, h.ts);
  }
  if (b.vag.length > 60) b.vag = b.vag.slice(0, 60);
  return b;
}

/** Det som sparas i v/<dag> och visas i admin: inga id:n, ingen user-agent. */
function besokUt(b) {
  return {
    start: b.start, senast: b.senast,
    land: b.land || '', landnamn: b.landnamn || '', stad: b.stad || '', region: b.region || '',
    kalla: b.kalla || 'Direkt', enhet: b.enhet || 'Okänd',
    webblasare: b.webblasare || '', os: b.os || '', sprak: b.sprak || '', bredd: b.bredd || 0,
    visningar: b.visningar || 0, ms: b.ms || 0, vag: b.vag || []
  };
}

/** Räkna in ett besök i en dagssammanställning. */
function raknaIn(sum, b) {
  sum.besok += 1;
  sum.visningar += b.visningar || 0;
  sum.ms += b.ms || 0;
  if ((b.visningar || 0) <= 1) sum.studs += 1;
  const land = b.land || '??';
  const l = lagg(sum.lander, land, { besok: 1, ms: b.ms || 0 });
  if (b.landnamn) l.namn = b.landnamn;
  if (b.stad) {
    const s = lagg(sum.stader, b.stad + '|' + land, { besok: 1, ms: b.ms || 0 });
    if (b.region) s.region = b.region;
  }
  if (b.kalla) lagg(sum.kallor, b.kalla, { besok: 1 });
  lagg(sum.enheter, b.enhet || 'Okänd', { besok: 1 });
  for (const p in (b.sidor || {})) {
    lagg(sum.sidor, p, { visningar: b.sidor[p].visningar || 0, ms: b.sidor[p].ms || 0 });
  }
}

/** Slå ihop flera dagssammanställningar till en. */
function slaIhop(dagar) {
  const tot = tomDag('');
  for (const d of dagar) {
    tot.besok += d.besok; tot.visningar += d.visningar; tot.ms += d.ms; tot.studs += d.studs;
    for (const grupp of ['lander', 'stader', 'kallor', 'sidor', 'enheter']) {
      for (const k in d[grupp]) {
        const { namn, region, ...tal } = d[grupp][k];
        const r = lagg(tot[grupp], k, tal);
        if (namn) r.namn = namn;
        if (region) r.region = region;
      }
    }
  }
  return tot;
}

module.exports = {
  butik, dagFor, dagarFore, besokarId, plats, kalla, enhet, programvara, ROBOT,
  SPARA_BESOK, tomDag, byggBesok, besokUt, raknaIn, slaIhop
};
