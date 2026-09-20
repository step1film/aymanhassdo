/* =====================================================
   STEP1 STORE — frakt
   =====================================================
   Kunden betalar standardfrakten, 79 kr. Servern frågar ändå
   Printful vad frakten faktiskt kostar och skriver ner svaret
   i loggen — så det går att se vilka produkter som kostar mer
   i frakt än de drar in. Det är skuggläget, standard.

   SHIPPING_MODE=live låter i stället Printfuls pris bli det
   kunden betalar. Svarar inte Printful används fast pris.

   ⚠️ Körs bara på servern. Anropet kräver PRINTFUL_API_TOKEN,
   och den får aldrig lämna servern.

   -----------------------------------------------------
   VARFÖR ETT FAST PRIS SOM RESERV
   -----------------------------------------------------
   Ett fraktanrop står mellan kunden och betalknappen. Är
   Printful nere, långsamt, eller svarar konstigt, ska kassan
   inte stanna — den ska ta standardpriset och gå vidare. En
   utebliven order kostar mer än några kronors felräknad frakt.

   Reserven används vid: nätverksfel, timeout, svar utanför
   2xx, tomt svar, saknad token, och rader utan Printful-id.
   Varje gång loggas det, så det går att se hur ofta det sker.

   -----------------------------------------------------
   TAKET
   -----------------------------------------------------
   frakt-leverans.html lovar 79 kr i standardfrakt. Printful
   tar mer än så för vissa varor (ryggsäcken 102 kr). Kunden
   ska inte mötas av en högre siffra i kassan än den vi
   publicerat, så priset kapas vid standardpriset: blir live-
   priset lägre får kunden det lägre, blir det högre står vi
   för mellanskillnaden. SHIPPING_CAP_TO_STANDARD=false tar
   bort taket — men då måste frakt-leverans.html skrivas om.

   Miljövariabler (alla valfria, standardvärden nedan):
     SHIPPING_FALLBACK_SEK     79    reservpris = publicerad standardfrakt
     SHIPPING_FREE_OVER_SEK    1200  fri frakt över detta ordervärde
     SHIPPING_MAX_SEK          199   spärr: högre frakt än så är ett fel
     SHIPPING_TIMEOUT_MS       5000  hur länge vi väntar på Printful
     SHIPPING_MODE             shadow  shadow | live | off (se nedan)
     SHIPPING_LIVE             -     'false' = samma som SHIPPING_MODE=off
     SHIPPING_CAP_TO_STANDARD  true  'false' = låt live-priset gå över 79
   ===================================================== */
'use strict';

const PRINTFUL_API = 'https://api.printful.com';

function tal(v, standard) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : standard;
}

const FALLBACK_SEK = tal(process.env.SHIPPING_FALLBACK_SEK, 79);
const FREE_OVER_SEK = tal(process.env.SHIPPING_FREE_OVER_SEK, 1200);
const MAX_SEK = tal(process.env.SHIPPING_MAX_SEK, 199);
const TIMEOUT_MS = tal(process.env.SHIPPING_TIMEOUT_MS, 5000);
const CAP_TO_STANDARD = process.env.SHIPPING_CAP_TO_STANDARD !== 'false';

/* -----------------------------------------------------
   TRE LÄGEN
   -----------------------------------------------------
   shadow  (standard)  Kunden betalar alltid standardfrakten. Servern
                       frågar ändå Printful — men bara för att skriva
                       ner svaret i loggen, så det går att se vilka
                       produkter som kostar mer i frakt än de drar in.
                       Frågan ställs utanför betalvägen, så kunden
                       aldrig får vänta på den.
   live                Kunden betalar Printfuls pris (med taket).
   off                 Printful frågas aldrig. Bara fast pris.

   Varför shadow är standard: butiken skickar bara inom Sverige, där
   frakten ligger mellan 46 och 102 kr. Live-priser hade gett kunden
   46 kr ibland — och tagit bort de ~25 kr som PRISKALKYL.md räknar
   med att frakten bidrar med per order. Vid låg volym är det
   skillnaden mellan vinst och nolla. Loggen ger ändå signalen om
   vilken produkt som behöver ett högre pris.

   SHIPPING_LIVE=false finns kvar och betyder off, så en befintlig
   miljövariabel inte plötsligt betyder något annat.
--------------------------------------------------- */
function lasLage() {
  const v = String(process.env.SHIPPING_MODE || '').trim().toLowerCase();
  if (v === 'live' || v === 'shadow' || v === 'off') return v;
  if (process.env.SHIPPING_LIVE === 'false') return 'off';
  return 'shadow';
}
const MODE = lasLage();
const LIVE = MODE === 'live';

/* Samma vagn och samma land ger samma frakt. Cachen håller
   Printful-anropen nere när kunden räknar om i kassan, och
   hindrar att någon kan mala endpointen mot Printfuls
   anropstak genom att ladda om sidan. */
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map();

function cacheNyckel(country, lines) {
  const rader = lines.map((l) => `${l.variant_id}:${l.qty}`).sort().join(',');
  return `${String(country).toUpperCase()}|${rader}`;
}

function frånCache(nyckel) {
  const träff = cache.get(nyckel);
  if (!träff) return null;
  if (Date.now() - träff.tid > CACHE_MS) { cache.delete(nyckel); return null; }
  return träff.värde;
}

function tillCache(nyckel, värde) {
  cache.set(nyckel, { tid: Date.now(), värde });
  if (cache.size > 200) {
    for (const [k, v] of cache) if (Date.now() - v.tid > CACHE_MS) cache.delete(k);
  }
}


/**
 * Hämtar fraktalternativ från Printful för en mottagare + vagn.
 * Kastar Error vid timeout, nätverksfel eller svar utanför 2xx.
 *
 * @param {{country_code:string, state_code?:string, city?:string, zip?:string}} recipient
 * @param {Array<{variant_id:number, quantity:number}>} items
 * @param {string} currency
 * @returns {Promise<Array<{id,name,rate,currency,minDeliveryDays,maxDeliveryDays,minDeliveryDate,maxDeliveryDate}>>}
 */
async function getPrintfulShippingRates(recipient, items, currency = 'SEK') {
  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) throw new Error('PRINTFUL_API_TOKEN saknas i miljövariablerna');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
  if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;

  // Utan tidsgräns kan ett hängande anrop hålla kvar kunden i kassan
  // tills funktionen dör av sig själv. Vi bryter själva i stället.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${PRINTFUL_API}/shipping-rates`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ recipient, items, currency }),
      signal: ctrl.signal
    });
  } catch (err) {
    if (err && err.name === 'AbortError') throw new Error(`Printful svarade inte inom ${TIMEOUT_MS} ms`);
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const detalj = (data && data.error && data.error.message) || (data && data.result) || 'okänt fel';
    throw new Error(`Printful shipping-rates fel (${response.status}): ${detalj}`);
  }

  const result = Array.isArray(data && data.result) ? data.result : null;
  if (!result || !result.length) throw new Error('Printful svarade utan fraktalternativ.');

  return result.map((r) => ({
    id: r.id,
    name: r.name,
    rate: r.rate,
    currency: r.currency,
    minDeliveryDays: r.minDeliveryDays != null ? r.minDeliveryDays : null,
    maxDeliveryDays: r.maxDeliveryDays != null ? r.maxDeliveryDays : null,
    minDeliveryDate: r.minDeliveryDate != null ? r.minDeliveryDate : null,
    maxDeliveryDate: r.maxDeliveryDate != null ? r.maxDeliveryDate : null
  }));
}


/** Det fasta priset, som det ser ut för en given vagn. */
function fastFrakt(subtotal, orsak) {
  if (FREE_OVER_SEK > 0 && subtotal >= FREE_OVER_SEK) {
    return { amount: 0, currency: 'SEK', source: 'free', name: 'Fri frakt', minDays: null, maxDays: null };
  }
  return {
    amount: FALLBACK_SEK, currency: 'SEK', source: 'fallback',
    name: 'Frakt', minDays: null, maxDays: null, reason: orsak || null
  };
}


/**
 * Räknar fram frakten för en vagn. Kastar aldrig — kan inte
 * Printful svara blir det standardpriset.
 *
 * @param {{lines:Array, subtotal:number, recipient?:object}} p
 *   lines: raderna från catalog.priceCart (behöver variant_id + qty)
 * @returns {Promise<{amount:number, currency:string, source:'free'|'printful'|'fallback',
 *                    name:string, minDays:number|null, maxDays:number|null, reason?:string}>}
 */
async function resolveShipping({ lines, subtotal, recipient }) {
  // Fri frakt går före allt annat — då behöver Printful inte frågas.
  if (FREE_OVER_SEK > 0 && subtotal >= FREE_OVER_SEK) return fastFrakt(subtotal);

  /* I shadow och off debiteras standardpriset, och betalvägen ska då
     inte vänta på ett anrop vars svar ändå inte används. Själva
     uppslaget görs av skuggaFrakt(), som shipping-rates anropar. */
  if (!LIVE) return fastFrakt(subtotal, MODE);
  if (!process.env.PRINTFUL_API_TOKEN) {
    console.warn('[shipping] fast pris: PRINTFUL_API_TOKEN saknas');
    return fastFrakt(subtotal, 'token saknas');
  }

  const land = String((recipient && recipient.country_code) || 'SE').toUpperCase().slice(0, 2);
  const rader = (lines || []).filter((l) => l.variant_id);
  if (!rader.length || rader.length !== (lines || []).length) {
    console.warn(`[shipping] fast pris: rader utan Printful-id (${rader.length}/${(lines || []).length}), land ${land}`);
    return fastFrakt(subtotal, 'variant-id saknas');
  }

  const nyckel = cacheNyckel(land, rader);
  const cachad = frånCache(nyckel);
  if (cachad) return cachad;

  let svar;
  try {
    svar = await getPrintfulShippingRates(
      {
        country_code: land,
        // Printful kräver delstat för US/AU/CA; postnummer förfinar priset där det finns
        state_code: (recipient && recipient.state_code) || undefined,
        city: (recipient && recipient.city) || undefined,
        zip: (recipient && recipient.zip) || undefined
      },
      rader.map((l) => ({ variant_id: l.variant_id, quantity: l.qty })),
      'SEK'
    );
  } catch (err) {
    // Det här är raden att räkna i loggen: hur ofta faller vi tillbaka?
    console.warn(`[shipping] FALLBACK ${FALLBACK_SEK} kr — Printful svarade inte (land ${land}): ${String((err && err.message) || err)}`);
    return fastFrakt(subtotal, 'printful-fel');
  }

  // Billigaste alternativet vinner. Uppåt till hel krona, så vi
  // aldrig debiterar mindre än vad frakten kostar oss.
  const billigast = svar
    .map((r) => ({ ...r, kr: Math.ceil(Number(r.rate)) }))
    .filter((r) => Number.isFinite(r.kr) && r.kr >= 0)
    .sort((a, b) => a.kr - b.kr)[0];

  if (!billigast) {
    console.warn(`[shipping] FALLBACK ${FALLBACK_SEK} kr — Printful svarade utan användbart pris (land ${land})`);
    return fastFrakt(subtotal, 'inget pris i svaret');
  }

  let belopp = billigast.kr;

  if (CAP_TO_STANDARD && belopp > FALLBACK_SEK) {
    console.log(`[shipping] Printful ville ha ${belopp} kr, kunden betalar ${FALLBACK_SEK} kr (taket) — land ${land}`);
    belopp = FALLBACK_SEK;
  }
  if (belopp > MAX_SEK) {
    console.warn(`[shipping] ${belopp} kr överstiger spärren ${MAX_SEK} kr — kapas. Land ${land}`);
    belopp = MAX_SEK;
  }

  const resultat = {
    amount: belopp,
    currency: 'SEK',
    source: 'printful',
    name: billigast.name || 'Frakt',
    minDays: billigast.minDeliveryDays,
    maxDays: billigast.maxDeliveryDays
  };
  tillCache(nyckel, resultat);
  return resultat;
}


/**
 * Skuggläget: frågar Printful vad frakten HADE kostat och skriver ner
 * svaret. Påverkar aldrig priset och kastar aldrig — det här får inte
 * kunna störa ett köp.
 *
 * Loggraden är till för att läsas om ett halvår: den säger vilken
 * produkt det gäller, vad Printful tog, och vad vi tog.
 */
async function skuggaFrakt({ lines, subtotal, recipient }) {
  if (MODE !== 'shadow') return;
  if (!process.env.PRINTFUL_API_TOKEN) return;
  if (FREE_OVER_SEK > 0 && subtotal >= FREE_OVER_SEK) return;   // fri frakt, inget att jämföra

  const rader = (lines || []).filter((l) => l.variant_id);
  if (!rader.length || rader.length !== (lines || []).length) return;

  const land = String((recipient && recipient.country_code) || 'SE').toUpperCase().slice(0, 2);
  const nyckel = 'skugga|' + cacheNyckel(land, rader);
  if (frånCache(nyckel)) return;                                 // redan loggad nyligen

  try {
    const svar = await getPrintfulShippingRates(
      { country_code: land, zip: (recipient && recipient.zip) || undefined },
      rader.map((l) => ({ variant_id: l.variant_id, quantity: l.qty })),
      'SEK'
    );
    const billigast = svar
      .map((r) => Math.ceil(Number(r.rate)))
      .filter((kr) => Number.isFinite(kr))
      .sort((a, b) => a - b)[0];
    if (!Number.isFinite(billigast)) return;

    tillCache(nyckel, true);

    const varor = rader.map((l) => `${l.qty}× ${l.id || l.variant_id}`).join(', ');
    const vitag = FALLBACK_SEK;
    const tecken = billigast > vitag ? 'ÖVER' : 'under';
    console.log(`[shipping] SKUGGA: Printful ${billigast} kr, vi tog ${vitag} kr `
      + `(${tecken} vårt pris) — ${land}, ${varor}`);
  } catch (err) {
    console.warn(`[shipping] SKUGGA kunde inte hämta pris: ${String((err && err.message) || err)}`);
  }
}


/** Ligger frakten i ett rimligt spann? Används av beloppskontrollerna. */
function rimligFrakt(kr) {
  return Number.isFinite(kr) && kr >= -0.01 && kr <= MAX_SEK + 0.01;
}

module.exports = {
  getPrintfulShippingRates, resolveShipping, skuggaFrakt, rimligFrakt,
  FALLBACK_SEK, FREE_OVER_SEK, MAX_SEK, TIMEOUT_MS, MODE, LIVE, CAP_TO_STANDARD
};
