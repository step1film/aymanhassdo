/* =====================================================
   STEP1 STORE — serverside priskatalog
   =====================================================
   ⚠️ SÄKERHET: priser får ALDRIG hämtas från webbläsaren.
   Kunden skickar bara produkt-id, färg, storlek och antal —
   servern räknar ut priset härifrån.

   ⚠️ HÅLL I SYNK med PRODUCTS i shop.js. Ändrar du ett pris
   där måste du ändra det här också.

   PRISREGEL: priset här och i shop.js är det kunden betalar.
   Printfuls "retail price" är bara en anteckning inne i Printful
   och debiterar ingen. Skiljer de sig åt gäller det HÖGRE priset
   — och det skrivs in här och i shop.js, inte tvärtom.
   ===================================================== */
'use strict';

const CURRENCY = 'sek';

// Frakt (kr) — spegla CONFIG.shippingFee / shippingFreeOver i shop.js
const SHIPPING_FEE = 79;
const SHIPPING_FREE_OVER = 1200;

/* id → { name, price, sizePrices?, variants? }
   variants: 'färg|storlek' → Printful sync_variant_id
   (fylls i när Printful-varianterna är hämtade, se PRINTFUL_SETUP.md) */
const CATALOG = {
  'reel-mugg': {
    name: "Director's Morning", price: 249,
    variants: { 'black|one': 5415345254 }
  },
  'awesome-mugg': {
    name: 'AWESOME MUGG', price: 249,
    variants: { 'white|one': 5415373167 }
  },
  'take-one-sleeve': {
    name: 'TAKE ONE SLEEVE', price: 529, sizePrices: { '13"': 529, '15"': 629 },
    variants: { 'pastel|13"': 5415334461, 'pastel|15"': 5415334462 }
  },
  'static-reel-sleeve': {
    name: 'GLITCH SLEEVE', price: 459, sizePrices: { '13"': 459, '15"': 529 },
    variants: { 'silver|13"': 5415374045, 'silver|15"': 5415374046 }
  },
  'rolling-backpack': {
    name: 'ROLLING BACKPACK', price: 739,
    // Navy och rosa är två separata produkter hos Printful
    variants: { 'navy|one': 5415353196, 'pink|one': 5415329629 }
  },
  'spoiler-hoodie': {
    name: 'SPOILER HOODIE', price: 669,
    // Printful: Bone = natur, Lavender = ljusrosa
    variants: {
      'natural|S': 5415690062, 'natural|M': 5415690063, 'natural|L': 5415690064, 'natural|XL': 5415690065,
      'lightpink|S': 5415690058, 'lightpink|M': 5415690059, 'lightpink|L': 5415690060, 'lightpink|XL': 5415690061,
      'white|S': 5415690066, 'white|M': 5415690067, 'white|L': 5415690068, 'white|XL': 5415690069
    }
  },
  '24fps-hoodie': {
    name: '24FPS HOODIE', price: 739,
    variants: {
      'black|S': 5415343283, 'black|M': 5415343284, 'black|L': 5415343285,
      'black|XL': 5415343286, 'black|2XL': 5415343287,
      'lightpink|S': 5415343289, 'lightpink|M': 5415343290, 'lightpink|L': 5415343291,
      'lightpink|XL': 5415343292, 'lightpink|2XL': 5415343293
    }
  },
  'reel-trucker-cap': {
    name: 'STEP1 FAN', price: 369,
    // Printful: Heather Grey/White = silver
    variants: { 'navy|one': 5415344277, 'silver|one': 5415344278, 'black|one': 5415344276 }
  },
  'action-dad-cap': {
    name: 'ACTION DAD CAP', price: 369,
    variants: { 'camel|one': 5415342081, 'black|one': 5415342080 }
  },
  'directors-beanie': {
    name: "DIRECTOR'S BEANIE", price: 309,
    variants: {
      'olive|one': 5415347439, 'black|one': 5415347436,
      'brown|one': 5415347437, 'navy|one': 5415347438
    }
  },
  'ad1-beanie': {
    name: 'AD1 BEANIE', price: 309,
    // Printful: Baby Pink = candy, Gold = orange
    variants: { 'candy|one': 5415348966, 'orange|one': 5415348965, 'white|one': 5415348967 }
  },
  'lil-director-tee': {
    name: "LIL' DIRECTOR TEE", price: 269,
    variants: {
      'candy|6M': 5415644687, 'candy|12M': 5415644688, 'candy|18M': 5415644689, 'candy|24M': 5415644690,
      'lightblue|6M': 5415644691, 'lightblue|12M': 5415644692, 'lightblue|18M': 5415644693, 'lightblue|24M': 5415644694,
      'white|6M': 5415644695, 'white|12M': 5415644696, 'white|18M': 5415644697, 'white|24M': 5415644698
    }
  },
  'crew-tee': {
    name: 'CREW TEE', price: 289,
    // Printful: Heather Slate = heather
    variants: {
      'heather|S': 5415681066, 'heather|M': 5415681067, 'heather|L': 5415681068, 'heather|XL': 5415681069,
      'yellow|S': 5415681070, 'yellow|M': 5415681071, 'yellow|L': 5415681072, 'yellow|XL': 5415681073,
      'black|S': 5415681062, 'black|M': 5415681063, 'black|L': 5415681064, 'black|XL': 5415681065
    }
  },
  'icon-stickers': {
    name: 'ICON STICKERS', price: 99,
    variants: { 'pink|one': 5415346306 }
  },
  'gear-stickers': {
    name: 'GEAR STICKERS', price: 99,
    variants: { 'forest|one': 5415372317 }
  },
  'step1-jersey': {
    name: 'STEP1 JERSEY', price: 459,
    variants: {
      'pastel|XS': 5415333024, 'pastel|S': 5415333025, 'pastel|M': 5415333026,
      'pastel|L': 5415333027, 'pastel|XL': 5415333028
    }
  }
  // PÅ VÄG IN — avkommentera samtidigt som produkten aktiveras i shop.js.
  // Variant-id:n är redan hämtade och ifyllda.
  // ,'on-set-cap': {
  //   name: 'ON SET CAP', price: 369,
  //   variants: { 'navy|one': 5415333757, 'charcoal|one': 5415333758, 'white|one': 5415333759 }
  // }
};

/** Pris för en produkt givet vald storlek. */
function priceFor(id, size) {
  const p = CATALOG[id];
  if (!p) return null;
  if (p.sizePrices && size && p.sizePrices[size] != null) return p.sizePrices[size];
  return p.price;
}

/**
 * Validerar en kundvagn från webbläsaren och räknar om allt på servern.
 * Kastar Error vid ogiltig indata.
 * @returns {{ lines, subtotal, shipping, total, currency }}
 */
function priceCart(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Tom kundvagn.');
  if (items.length > 50) throw new Error('För många rader.');

  const lines = items.map((raw) => {
    const id = String(raw.id || '');
    const product = CATALOG[id];
    if (!product) throw new Error(`Okänd produkt: ${id}`);

    const qty = Math.floor(Number(raw.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > 20) throw new Error('Ogiltigt antal.');

    const size = raw.size ? String(raw.size).slice(0, 12) : null;
    const color = raw.color ? String(raw.color).slice(0, 24) : null;
    const unit = priceFor(id, size);
    if (unit == null) throw new Error(`Saknar pris: ${id}`);

    return {
      id,
      name: product.name,
      color,
      size,
      qty,
      unitPrice: unit,
      lineTotal: unit * qty,
      // Printful-variant, om den är ifylld
      variant_id: (product.variants && product.variants[`${color}|${size || 'one'}`]) || null
    };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FEE;

  return { lines, subtotal, shipping, total: subtotal + shipping, currency: CURRENCY };
}

/** Enkel validering av mottagaruppgifter. */
function validateRecipient(r) {
  const req = ['name', 'email', 'address1', 'city', 'zip'];
  const out = {};
  for (const f of req) {
    const v = (r && r[f] != null) ? String(r[f]).trim() : '';
    if (!v) throw new Error(`Fältet "${f}" saknas.`);
    out[f] = v.slice(0, 120);
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(out.email)) throw new Error('Ogiltig e-postadress.');
  out.phone = r.phone ? String(r.phone).trim().slice(0, 40) : '';
  out.country_code = (r.country_code ? String(r.country_code) : 'SE').toUpperCase().slice(0, 2);
  out.notes = r.notes ? String(r.notes).trim().slice(0, 500) : '';
  return out;
}

module.exports = {
  CATALOG, CURRENCY, SHIPPING_FEE, SHIPPING_FREE_OVER,
  priceFor, priceCart, validateRecipient
};
