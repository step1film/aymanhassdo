/* =====================================================
   STEP1FILM ADMIN — delat bibliotek
   =====================================================
   Adminsidan på step1film.se/admin är statiska filer och
   ligger öppet. All riktig kontroll sker därför här, på
   servern. Sidan i webbläsaren är bara ett formulär.

   MILJÖVARIABLER (sätts i Netlify → Site settings →
   Environment variables). Se ADMIN_SETUP.md.

     ADMIN_PASSWORD   lösenordet du loggar in med
     ADMIN_SECRET     lång slumpsträng, signerar sessionsnyckeln
     GITHUB_TOKEN     fine-grained PAT med Contents: read+write
                      på ENDAST step1film/aymanhassdo
     GITHUB_REPO      valfri, standard step1film/aymanhassdo
     GITHUB_BRANCH    valfri, standard main

   Saknas någon av de fyra första är admin helt avstängt —
   funktionerna svarar 503 och rör ingenting.

   -----------------------------------------------------
   SÄKERHETSMODELLEN, KORT
   -----------------------------------------------------
   1. Lösenordet jämförs tidssäkert, så svarstiden inte
      avslöjar hur många tecken som stämde.
   2. Rätt lösenord ger en sessionsnyckel: en HMAC-signerad
      sträng med utgångstid. Servern sparar ingenting —
      giltigheten går att räkna fram ur signaturen.
   3. GITHUB_TOKEN lämnar aldrig servern. Webbläsaren får
      aldrig se den.
   4. Bara filer i VITLISTAN går att skriva. Utan den hade
      en kapad session kunnat skriva ett GitHub-workflow och
      därmed köra godtycklig kod i repot.
   5. Bilder får bara läggas under assets/ och bara i de
      format som listas i BILDTYPER.
   ===================================================== */
'use strict';

const crypto = require('crypto');

const REPO   = process.env.GITHUB_REPO || 'step1film/aymanhassdo';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const GH     = 'https://api.github.com';

/* Hur länge en inloggning gäller. Kort nog att en glömd flik inte
   blir en öppen dörr, långt nog att man hinner skriva en text. */
const SESSION_TIMMAR = 8;

/* -----------------------------------------------------
   VITLISTAN — de enda filer admin får skriva.
   `block` är namnet mellan ADMIN:START och ADMIN:SLUT.
   `wrap` bygger raden som ersätter blockets innehåll.
----------------------------------------------------- */
const FILER = {
  innehall: {
    path: 'site-config.js',
    block: 'innehall',
    // Flera globaler i ett block — byggs av skrivInnehall() nedan
    wrap: null
  },
  texter: {
    path: 'i18n.js',
    block: 'texter',
    indent: '  ',
    wrap: (data, ind) => ind + 'const STRINGS = ' + jsonIndrag(data, ind) + ';'
  },
  produkter: {
    path: 'shop.js',
    block: 'produkter',
    indent: '  ',
    wrap: (data, ind) => ind + 'const PRODUCTS = ' + jsonIndrag(data, ind) + ';'
  },
  katalog: {
    path: 'functions/_lib/catalog.js',
    block: 'katalog',
    indent: '',
    wrap: (data, ind) => 'const CATALOG = ' + jsonIndrag(data, ind) + ';'
  }
};

/* Bilder: bara under de här mapparna, bara de här typerna. */
const BILDMAPPAR = [
  'assets/products/',
  'assets/clients/',
  'assets/films/posters/',
  'assets/films/mammor/',
  'assets/portraits/'
];
const BILDTYPER = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
const MAX_BILD = 4 * 1024 * 1024;     // 4 MB — större hör inte hemma på en webbsida

/* -----------------------------------------------------
   Hjälpare
----------------------------------------------------- */

/** JSON med indrag som passar in där blocket sitter. */
function jsonIndrag(data, ind) {
  const rader = JSON.stringify(data, null, 2).split('\n');
  return rader.map((r, i) => (i === 0 ? r : ind + r)).join('\n');
}

/** Är admin påslaget? Utan alla fyra variabler gör vi ingenting. */
function konfigurerad() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SECRET && process.env.GITHUB_TOKEN);
}

/** Tidssäker strängjämförelse — svarstiden får inte läcka något. */
function likaTider(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  // timingSafeEqual kräver samma längd, så hasha först: då blir
  // längden alltid 32 byte oavsett vad som skickades in.
  const ha = crypto.createHash('sha256').update(ba).digest();
  const hb = crypto.createHash('sha256').update(bb).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Sessionsnyckel: "utgångstid.signatur". Servern sparar ingenting. */
function skapaNyckel() {
  const utgar = Date.now() + SESSION_TIMMAR * 3600 * 1000;
  const sig = crypto.createHmac('sha256', process.env.ADMIN_SECRET)
    .update(String(utgar)).digest('base64url');
  return `${utgar}.${sig}`;
}

/** true om nyckeln är äkta och inte gått ut. */
function giltigNyckel(nyckel) {
  if (!konfigurerad() || typeof nyckel !== 'string') return false;
  const bit = nyckel.split('.');
  if (bit.length !== 2) return false;
  const utgar = Number(bit[0]);
  if (!Number.isFinite(utgar) || utgar < Date.now()) return false;
  const vantad = crypto.createHmac('sha256', process.env.ADMIN_SECRET)
    .update(bit[0]).digest('base64url');
  return likaTider(bit[1], vantad);
}

/** Plockar sessionsnyckeln ur anropet. */
function nyckelUr(event) {
  const h = event.headers || {};
  return h['x-admin-session'] || h['X-Admin-Session'] || '';
}

/* -----------------------------------------------------
   GitHub
----------------------------------------------------- */
async function gh(vag, init = {}) {
  const svar = await fetch(GH + vag, {
    ...init,
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'step1film-admin',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  });
  const text = await svar.text();
  if (!svar.ok) {
    // Kasta aldrig vidare GitHubs svar rakt av — det kan innehålla
    // sökvägar och kontonamn som inte hör hemma i webbläsaren.
    const e = new Error(`GitHub ${svar.status}`);
    e.status = svar.status;
    e.detalj = text.slice(0, 300);
    throw e;
  }
  return text ? JSON.parse(text) : null;
}

/** Filens innehåll som text, från den gren vi publicerar från. */
async function lasFil(path) {
  const r = await gh(`/repos/${REPO}/contents/${encodeURI(path)}?ref=${encodeURIComponent(BRANCH)}`);
  return Buffer.from(r.content, 'base64').toString('utf8');
}

/**
 * Skriver flera filer i EN commit.
 * Contents-API:t klarar bara en fil i taget, och då hade shop.js och
 * catalog.js kunnat hamna i olika commits — med ett fönster där kunden
 * ser ett pris och betalar ett annat. Git Data-API:t bygger i stället
 * ett träd och en commit, så alla filer landar samtidigt eller inte alls.
 * @param {Array<{path:string, content:string}|{path:string, base64:string}>} filer
 */
async function skrivFiler(filer, meddelande) {
  if (!filer.length) throw new Error('Inga filer att spara.');

  const ref = await gh(`/repos/${REPO}/git/ref/heads/${encodeURIComponent(BRANCH)}`);
  const forald = ref.object.sha;
  const commit = await gh(`/repos/${REPO}/git/commits/${forald}`);

  const trad = [];
  for (const f of filer) {
    const blob = await gh(`/repos/${REPO}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify(f.base64
        ? { content: f.base64, encoding: 'base64' }
        : { content: f.content, encoding: 'utf-8' })
    });
    trad.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const nyttTrad = await gh(`/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: commit.tree.sha, tree: trad })
  });

  const nyCommit = await gh(`/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: meddelande,
      tree: nyttTrad.sha,
      parents: [forald]
    })
  });

  await gh(`/repos/${REPO}/git/refs/heads/${encodeURIComponent(BRANCH)}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: nyCommit.sha })
  });

  return nyCommit.sha;
}

/* -----------------------------------------------------
   Blocken i filerna
----------------------------------------------------- */

/** Plockar ut texten mellan ADMIN:START <namn> och ADMIN:SLUT <namn>. */
function hittaBlock(kalla, namn) {
  const start = new RegExp(`^[ \\t]*/\\* ADMIN:START ${namn} \\*/[ \\t]*$`, 'm');
  const slut  = new RegExp(`^[ \\t]*/\\* ADMIN:SLUT ${namn} \\*/[ \\t]*$`, 'm');
  const a = kalla.match(start);
  const b = kalla.match(slut);
  if (!a || !b || b.index < a.index) {
    throw new Error(`Hittar inte ADMIN-blocket "${namn}". Filen måste ha kvar båda markörerna.`);
  }
  return { fran: a.index + a[0].length, till: b.index, mark: a[0] };
}

/** Byter ut innehållet mellan markörerna, allt annat i filen står kvar. */
function bytBlock(kalla, namn, nyttInnehall) {
  const { fran, till } = hittaBlock(kalla, namn);
  return kalla.slice(0, fran) + '\n' + nyttInnehall + '\n' + kalla.slice(till);
}

/** Läser JSON-värdet ur ett block genom att köra det som JS. */
function lasBlock(kalla, namn, uttryck) {
  const { fran, till } = hittaBlock(kalla, namn);
  const kod = kalla.slice(fran, till);
  // Blocket sätter antingen window.X eller const X. Kör det i en tom
  // kontext med ett window-objekt och läs av resultatet.
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', `${kod}\n; return (${uttryck});`);
  return fn({});
}

/** site-config.js: nio globaler i ett block. */
const INNEHALL_NYCKLAR = [
  'STEP1FILM_VIDEO', 'STEP1FILM_EMBEDS', 'STEP1FILM_REEL', 'STEP1FILM_CLIENTS',
  'STEP1FILM_FILMOGRAPHY', 'STEP1FILM_SELECTED', 'STEP1FILM_MEDIA',
  'STEP1FILM_EDUCATION', 'STEP1FILM_CV', 'STEP1FILM_POSTERS'
];

function lasInnehall(kalla) {
  const uttryck = '{' + INNEHALL_NYCKLAR.map(k => `${JSON.stringify(k)}: window.${k}`).join(', ') + '}';
  return lasBlock(kalla, 'innehall', uttryck);
}

function skrivInnehall(data) {
  return INNEHALL_NYCKLAR
    .map(k => `window.${k} = ${JSON.stringify(data[k], null, 2)};`)
    .join('\n\n');
}

/* -----------------------------------------------------
   Kontroller av det som kommer in
----------------------------------------------------- */

/** true om sökvägen är en tillåten bildplats. */
function tillatenBild(path) {
  if (typeof path !== 'string' || !path) return false;
  if (path.includes('..') || path.startsWith('/') || path.includes('//')) return false;
  if (!/^[A-Za-z0-9/._-]+$/.test(path)) return false;
  if (!BILDMAPPAR.some(m => path.startsWith(m))) return false;
  const typ = path.split('.').pop().toLowerCase();
  return Object.prototype.hasOwnProperty.call(BILDTYPER, typ);
}

module.exports = {
  REPO, BRANCH, FILER, BILDMAPPAR, BILDTYPER, MAX_BILD, SESSION_TIMMAR,
  INNEHALL_NYCKLAR,
  konfigurerad, likaTider, skapaNyckel, giltigNyckel, nyckelUr,
  gh, lasFil, skrivFiler,
  hittaBlock, bytBlock, lasBlock, lasInnehall, skrivInnehall, jsonIndrag,
  tillatenBild
};
