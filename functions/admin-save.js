/* =====================================================
   ADMIN — spara
   =====================================================
   POST { del, data }  med sessionsnyckeln i X-Admin-Session
     del = 'innehall' | 'texter' | 'produkter'
   → { commit, filer }

   PRISSYNKEN
   -----------------------------------------------------
   Priset finns på två ställen: shop.js (det kunden ser) och
   functions/_lib/catalog.js (det servern faktiskt debiterar).
   Sparar man bara det ena ser kunden ett pris och betalar ett
   annat. Därför bygger den här funktionen BÅDA filerna ur
   samma inskickade produktlista och skriver dem i EN commit —
   det går inte att spara det ena utan det andra.

   Variant-id:n (Printful) finns bara i catalog.js och rörs
   aldrig av formuläret; de läses ur den befintliga filen och
   skrivs tillbaka oförändrade.
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin, json } = require('./_lib/http');
const A = require('./_lib/admin');

/* -----------------------------------------------------
   Kontroller. Trasig indata får aldrig nå filerna — en
   sparning som går igenom här hamnar direkt på sajten.
----------------------------------------------------- */
const ärObjekt = v => v && typeof v === 'object' && !Array.isArray(v);

function granskaTexter(d) {
  if (!ärObjekt(d) || !ärObjekt(d.sv) || !ärObjekt(d.en)) {
    throw new Error('Texterna måste ha både sv och en.');
  }
  for (const spr of ['sv', 'en']) {
    for (const [k, v] of Object.entries(d[spr])) {
      if (typeof v !== 'string') throw new Error(`Texten "${k}" (${spr}) är inte text.`);
      if (v.length > 4000) throw new Error(`Texten "${k}" (${spr}) är orimligt lång.`);
    }
  }
  // Saknas en nyckel på engelska faller sidan tillbaka på svenska, men
  // en helt tom engelsk lista är nästan alltid ett misstag.
  if (!Object.keys(d.sv).length) throw new Error('Den svenska textlistan är tom.');
  return { sv: d.sv, en: d.en };
}

function granskaInnehall(d) {
  if (!ärObjekt(d)) throw new Error('Innehållet är inte ett objekt.');
  const ut = {};
  for (const k of A.INNEHALL_NYCKLAR) {
    if (!(k in d)) throw new Error(`${k} saknas — spara aldrig en halv lista.`);
    ut[k] = d[k];
  }
  if (!Array.isArray(ut.STEP1FILM_FILMOGRAPHY)) throw new Error('Filmografin måste vara en lista.');
  if (!Array.isArray(ut.STEP1FILM_CLIENTS)) throw new Error('Logotyperna måste vara en lista.');
  if (!Array.isArray(ut.STEP1FILM_SELECTED)) throw new Error('Utvald av måste vara en lista.');
  if (!Array.isArray(ut.STEP1FILM_MEDIA)) throw new Error('I media måste vara en lista.');
  /* Länkarna hamnar i href på sajten. Bara http(s) — en javascript:-adress
     härifrån hade blivit ett skript som kör i besökarens webbläsare. */
  for (const post of [...ut.STEP1FILM_SELECTED, ...ut.STEP1FILM_MEDIA]) {
    if (!ärObjekt(post)) throw new Error('En post i CV-listorna är inte ett objekt.');
    if (post.url != null && post.url !== '') {
      if (typeof post.url !== 'string' || !/^https?:\/\//i.test(post.url)) {
        throw new Error(`Ogiltig länk: ${JSON.stringify(post.url)}. Adressen måste börja med https://`);
      }
    }
  }
  if (!ärObjekt(ut.STEP1FILM_VIDEO)) throw new Error('Showreelen måste vara ett objekt.');
  return ut;
}

function granskaProdukter(d) {
  if (!Array.isArray(d) || !d.length) throw new Error('Produktlistan är tom.');
  if (d.length > 200) throw new Error('Orimligt många produkter.');
  const sedda = new Set();
  for (const p of d) {
    if (!ärObjekt(p)) throw new Error('En produkt är inte ett objekt.');
    if (typeof p.id !== 'string' || !/^[a-z0-9-]{2,40}$/.test(p.id)) {
      throw new Error(`Ogiltigt produkt-id: ${JSON.stringify(p.id)}. Bara små bokstäver, siffror och bindestreck.`);
    }
    if (sedda.has(p.id)) throw new Error(`Produkt-id:t "${p.id}" finns två gånger.`);
    sedda.add(p.id);

    if (!ärObjekt(p.name) || typeof p.name.sv !== 'string' || !p.name.sv.trim()) {
      throw new Error(`"${p.id}" saknar svenskt namn.`);
    }
    const pris = Number(p.price);
    if (!Number.isFinite(pris) || pris < 1 || pris > 100000 || Math.floor(pris) !== pris) {
      throw new Error(`"${p.id}" har ett ogiltigt pris: ${p.price}. Ange hela kronor.`);
    }
    p.price = pris;

    if (p.sizePrices != null) {
      if (!ärObjekt(p.sizePrices)) throw new Error(`"${p.id}": storlekspriser måste vara ett objekt.`);
      for (const [s, v] of Object.entries(p.sizePrices)) {
        const n = Number(v);
        if (!Number.isFinite(n) || n < 1 || n > 100000 || Math.floor(n) !== n) {
          throw new Error(`"${p.id}": ogiltigt pris för storlek ${s}.`);
        }
        p.sizePrices[s] = n;
      }
    }
  }
  return d;
}

/** Bygger serverkatalogen ur produktlistan. Detta ÄR prissynken. */
function byggKatalog(produkter, gamlaVarianter) {
  const ut = {};
  for (const p of produkter) {
    const rad = { name: p.name.sv, price: p.price };
    if (p.sizePrices && Object.keys(p.sizePrices).length) rad.sizePrices = p.sizePrices;
    /* Dolda produkter måste märkas här också. Utan flaggan försvinner
       produkten ur butiken men går fortfarande att beställa genom att
       skicka id:t direkt till servern — kunden betalar och
       Printful-ordern misslyckas. catalog.js läser HIDDEN härifrån. */
    if (p.hidden) rad.hidden = true;
    // Variant-id:n kommer aldrig från formuläret — de bevaras som de är.
    rad.variants = (gamlaVarianter && gamlaVarianter[p.id]) || {};
    ut[p.id] = rad;
  }
  return ut;
}

exports.handler = async (event) => {
  const headers = corsHeaders(event, 'POST, OPTIONS');
  headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Admin-Session';

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, headers, { fel: 'Metod stöds inte.' });
  if (isForeignOrigin(event)) return json(403, headers, { fel: 'Otillåtet ursprung.' });
  if (!A.konfigurerad()) return json(503, headers, { fel: 'Admin är inte igångsatt.' });
  if (!A.giltigNyckel(A.nyckelUr(event))) return json(401, headers, { fel: 'Sessionen har gått ut. Logga in igen.' });

  let kropp;
  try { kropp = JSON.parse(event.body || '{}'); }
  catch { return json(400, headers, { fel: 'Trasig förfrågan.' }); }

  const del = String(kropp.del || '');
  if (!['innehall', 'texter', 'produkter'].includes(del)) {
    return json(400, headers, { fel: `Okänd del: ${del}` });
  }

  try {
    const filer = [];
    let text;

    if (del === 'texter') {
      const data = granskaTexter(kropp.data);
      const kalla = await A.lasFil('i18n.js');
      filer.push({
        path: 'i18n.js',
        content: A.bytBlock(kalla, 'texter', A.FILER.texter.wrap(data, '  '))
      });
      text = 'Admin: texter';

    } else if (del === 'innehall') {
      const data = granskaInnehall(kropp.data);
      const kalla = await A.lasFil('site-config.js');
      filer.push({
        path: 'site-config.js',
        content: A.bytBlock(kalla, 'innehall', A.skrivInnehall(data))
      });
      text = 'Admin: filmer, CV och klipp';

    } else {
      const produkter = granskaProdukter(kropp.data);

      const [shKalla, catKalla] = await Promise.all([
        A.lasFil('shop.js'),
        A.lasFil('functions/_lib/catalog.js')
      ]);

      // Variant-id:n läses ur den nuvarande katalogen och följer med över
      const gammal = A.lasBlock(catKalla, 'katalog', 'CATALOG');
      const varianter = Object.fromEntries(
        Object.entries(gammal).map(([id, p]) => [id, p.variants || {}])
      );
      const katalog = byggKatalog(produkter, varianter);

      filer.push({
        path: 'shop.js',
        content: A.bytBlock(shKalla, 'produkter', A.FILER.produkter.wrap(produkter, '  '))
      });
      filer.push({
        path: 'functions/_lib/catalog.js',
        content: A.bytBlock(catKalla, 'katalog', A.FILER.katalog.wrap(katalog, ''))
      });
      text = 'Admin: produkter och priser';
    }

    const sha = await A.skrivFiler(filer, text + '\n\nSparad från step1film.se/admin.');
    return json(200, headers, {
      ok: true,
      commit: sha.slice(0, 7),
      filer: filer.map(f => f.path)
    });

  } catch (e) {
    console.error('admin-save:', del, e.message, e.detalj || '');
    // Granskningsfel är till för att läsas av den som sparar
    const kod = e.status === 409 ? 409 : (e.status ? 502 : 400);
    return json(kod, headers, {
      fel: kod === 409
        ? 'Någon annan hann spara emellan. Ladda om admin och försök igen.'
        : e.message
    });
  }
};
