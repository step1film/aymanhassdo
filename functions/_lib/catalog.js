/* =====================================================
   STEP1 STORE — serverside priskatalog
   =====================================================
   ⚠️ SÄKERHET: priser får ALDRIG hämtas från webbläsaren.
   Kunden skickar bara produkt-id, färg, storlek och antal —
   servern räknar ut priset härifrån.

   ⚠️ HÅLL I SYNK med PRODUCTS i shop.js. Ändrar du ett pris
   där måste du ändra det här också.
   ===================================================== */
'use strict';

const CURRENCY = 'sek';

// Frakt (kr) — spegla CONFIG.shippingFee / shippingFreeOver i shop.js
const SHIPPING_FEE = 59;
const SHIPPING_FREE_OVER = 899;

/* id → { name, price, sizePrices?, variants? }
   variants: 'färg|storlek' → Printful sync_variant_id
   (fylls i när Printful-varianterna är hämtade, se PRINTFUL_SETUP.md) */
const CATALOG = {
  'reel-mugg':          { name: "Director's Morning", price: 229 },
  'awesome-mugg':       { name: 'AWESOME MUGG',       price: 229 },
  'take-one-sleeve':    { name: 'TAKE ONE SLEEVE',    price: 499, sizePrices: { '13"': 499, '15"': 599 } },
  'static-reel-sleeve': { name: 'STATIC REEL SLEEVE', price: 429, sizePrices: { '13"': 429, '15"': 499 } },
  'rolling-backpack':   { name: 'ROLLING BACKPACK',   price: 699 },
  'spoiler-hoodie':     { name: 'SPOILER HOODIE',     price: 629 },
  '24fps-hoodie':       { name: '24FPS HOODIE',       price: 699 },
  'reel-trucker-cap':   { name: 'On-Set Trucker',     price: 349 },
  'action-dad-cap':     { name: 'ACTION DAD CAP',     price: 349 },
  'directors-beanie':   { name: "DIRECTOR'S BEANIE",  price: 285 },
  'ad1-beanie':         { name: 'AD1 BEANIE',         price: 285 },
  'lil-director-tee':   { name: "LIL' DIRECTOR TEE",  price: 249 },
  'crew-tee':           { name: 'CREW TEE',           price: 275 },
  'icon-stickers':      { name: 'ICON STICKERS',      price: 85 },
  'gear-stickers':      { name: 'GEAR STICKERS',      price: 85 }
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
