/* =====================================================
   STEP1FILM — SHOP
   Standalone store logic: products, live colour preview,
   variant selection, cart (localStorage), SV/EN i18n,
   and a lightweight checkout (order request via e-mail).

   Payment provider (Swish / Stripe) is intentionally NOT
   wired yet — it will be added once the site moves to its
   own domain. See CONFIG.contactEmail for the order sink.
   ===================================================== */
(function () {
  'use strict';

  /* -----------------------------------------------------
     CONFIG — edit these when going live
  ----------------------------------------------------- */
  const CONFIG = {
    currency: 'kr',
    contactEmail: 'shop@step1film.se',
    // Swish number is shown at checkout as info only for now.
    // Leave empty to hide until you have a business number.
    swishNumber: '',

    // Frakt: fast avgift per order (kr). Sätt freeOver för att ge
    // fri frakt över ett visst ordervärde (0 = alltid frakt).
    shippingFee: 79,
    shippingFreeOver: 1200,

    /* ---------------------------------------------------
       BETALNING — se PAYMENTS_SETUP.md
       ---------------------------------------------------
       apiBase pekar på Netlify, eftersom sidorna ligger på
       GitHub Pages men funktionerna körs hos Netlify. Full
       adress krävs — en relativ sökväg hade letat på fel värd.

       card/swish slås på när respektive konto är klart.
       Är båda false faller butiken tillbaka på mejlbeställning.
    --------------------------------------------------- */
    payments: {
      apiBase: 'https://step1film.netlify.app/.netlify/functions',
      card: true,    // Stripe: kort + Klarna
      swish: false   // Swish Handel — väntar på avtal med banken
    }
  };

  window.S1F_CONFIG = CONFIG;

  /* -----------------------------------------------------
     COLOUR PALETTE — hex used for the live garment preview
  ----------------------------------------------------- */
  const COLORS = {
    black:    { hex: '#1e1e1e', sv: 'Svart',    en: 'Black',    light: false },
    white:    { hex: '#f2f2f2', sv: 'Vit',      en: 'White',    light: true  },
    sand:     { hex: '#d9c7a3', sv: 'Sand',     en: 'Sand',     light: true  },
    forest:   { hex: '#2f4034', sv: 'Skogsgrön', en: 'Forest',  light: false },
    charcoal: { hex: '#3a3a3a', sv: 'Koladgrå', en: 'Charcoal', light: false },
    bone:     { hex: '#e7e2d6', sv: 'Ben',      en: 'Bone',     light: true  },
    stone:    { hex: '#b9b3a7', sv: 'Sten',     en: 'Stone',    light: true  },
    red:      { hex: '#c11a1a', sv: 'Röd',      en: 'Red',      light: false },
    pink:     { hex: '#e85ba0', sv: 'Rosa',     en: 'Pink',     light: false },
    lightpink:{ hex: '#f2cfe0', sv: 'Ljusrosa', en: 'Light pink', light: true },
    candy:    { hex: '#f4a7c3', sv: 'Rosa',     en: 'Pink',     light: true  },
    natural:  { hex: '#e9e0c9', sv: 'Naturvit', en: 'Natural',  light: true  },
    silver:   { hex: '#b3b7ba', sv: 'Silver',   en: 'Silver',   light: true  },
    lightblue:{ hex: '#a9cce3', sv: 'Ljusblå',  en: 'Light blue', light: true },
    brown:    { hex: '#5a4632', sv: 'Brun',     en: 'Brown',    light: false },
    olive:    { hex: '#5c5d3a', sv: 'Oliv',     en: 'Olive',    light: false },
    orange:   { hex: '#d9772e', sv: 'Orange',   en: 'Orange',   light: false },
    khaki:    { hex: '#8a8354', sv: 'Khaki',    en: 'Khaki',    light: true  },
    camel:    { hex: '#ab7742', sv: 'Kamel',    en: 'Camel',    light: false },
    yellow:   { hex: '#f2d24e', sv: 'Gul',      en: 'Yellow',   light: true  },
    heather:  { hex: '#b8b5ad', sv: 'Heather',  en: 'Heather',  light: true  },
    navy:     { hex: '#1f2a4d', sv: 'Marinblå', en: 'Navy',     light: false },
    // Flerfärgad pastell — swatchen visas som en gradient
    pastel:   { hex: 'linear-gradient(90deg,#f6b6c4,#f7d9a6,#eef0a6,#b6e3c6,#a9d8ef,#c9b8e6)', sv: 'Pastell', en: 'Pastel', light: true }
  };

  /* -----------------------------------------------------
     SVG GARMENT TEMPLATES — recolour via --gc / --pc vars
  ----------------------------------------------------- */
  const SVG = {
    tee: (print) => `
      <svg class="garment" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <path class="garment-body" d="M84 44 L104 44 Q120 62 136 44 L156 44 L200 74 L174 106 L158 92 L158 206 Q158 214 150 214 L90 214 Q82 214 82 206 L82 92 L66 106 L40 74 Z"/>
        <path class="garment-detail" d="M104 44 Q120 64 136 44"/>
        <text class="garment-print" x="120" y="140">${print}</text>
      </svg>`,
    hoodie: (print) => `
      <svg class="garment" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <path class="garment-body" d="M82 52 L100 46 Q120 30 140 46 L158 52 L202 84 L176 116 L160 102 L160 208 Q160 214 152 214 L88 214 Q80 214 80 208 L80 102 L64 116 L38 84 Z"/>
        <path class="garment-body" d="M100 46 Q120 66 140 46 Q146 62 132 74 Q120 66 108 74 Q94 62 100 46 Z"/>
        <path class="garment-detail" d="M108 74 L108 96 M132 74 L132 96"/>
        <path class="garment-detail" d="M94 150 L146 150 L138 190 L102 190 Z"/>
        <text class="garment-print" x="120" y="132">${print}</text>
      </svg>`,
    cap: (print) => `
      <svg class="garment" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <path class="garment-body" d="M56 150 Q56 74 120 74 Q184 74 184 150 Q120 138 56 150 Z"/>
        <path class="garment-body" d="M60 148 Q120 138 210 162 Q214 176 194 178 Q120 190 58 168 Q50 156 60 148 Z"/>
        <circle class="garment-detail" cx="120" cy="80" r="5" style="fill:var(--pc);stroke:none;opacity:.6"/>
        <text class="garment-print" x="120" y="128" style="font-size:22px">${print}</text>
      </svg>`,
    mug: (print) => `
      <svg class="garment" viewBox="0 0 240 240" role="img" aria-hidden="true">
        <path class="garment-handle" d="M172 96 q40 6 40 44 q0 38 -40 44"/>
        <rect class="garment-body" x="60" y="70" width="112" height="112" rx="14"/>
        <text class="garment-print" x="116" y="138" style="font-size:22px">${print}</text>
      </svg>`
  };

  /* -----------------------------------------------------
     PRODUCTS
  ----------------------------------------------------- */
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const PRODUCTS = [
    /* ===== RIKTIGA PRINTFUL-PRODUKTER =====================
       Bild laddas från assets/products/. Ladda upp filen med
       exakt det filnamn som står i `image` nedan. Saknas den
       visas mockupen tills vidare. Variant-ID:n läggs till när
       vi kopplar leverans. */
    {
      id: 'reel-mugg', cat: 'mugs', type: 'mug', print: 'S1F',
      name: { sv: "Director's Morning", en: "Director's Morning" },
      desc: { sv: 'Där varje historia börjar — en kopp kaffe och en idé. Svart glansig mugg, 15 oz.', en: 'Where every story begins — a cup of coffee and an idea. Black glossy mug, 15 oz.' },
      material: { sv: ['Keramik, svart glansig', 'Volym: 15 oz (ca 440 ml)'], en: ['Ceramic, black glossy', 'Volume: 15 oz (approx. 440 ml)'] },
      price: 249,
      colors: ['black'],
      sizes: null,
      image: 'assets/products/reel-mugg.webp',
      gallery: [
        'assets/products/reel-mugg.webp',
        'assets/products/reel-mugg-2.webp',
        'assets/products/reel-mugg-lifestyle.webp'
      ]
    },
    {
      id: 'awesome-mugg', cat: 'mugs', type: 'mug', print: 'AWE',
      name: { sv: 'AWESOME MUGG', en: 'AWESOME MUG' },
      desc: { sv: 'Efter en lång dag på inspelning sitter en varm choklad fint — och en påminnelse om att du redan är awesome. Vit glansig mugg, 11 oz.', en: 'After a long day on set, hot chocolate is a must — and a reminder that you\'re already awesome. White glossy mug, 11 oz.' },
      badge: { sv: 'Mest populär', en: 'Most popular' },
      material: { sv: ['Keramik, vit glansig', 'Volym: 11 oz (ca 330 ml)'], en: ['Ceramic, white glossy', 'Volume: 11 oz (approx. 330 ml)'] },
      price: 249,
      colors: ['white'],
      sizes: null,
      image: 'assets/products/awesome-mugg-stacked.webp',
      // Basbild (utan siffra) först, sedan 01, 02, 03, 04, 05
      gallery: [
        'assets/products/awesome-mugg-stacked.webp',
        'assets/products/awesome-mugg-hands.webp',
        'assets/products/awesome-mugg.webp',
        'assets/products/awesome-mugg-model.webp',
        'assets/products/awesome-mugg-holiday.webp',
        'assets/products/awesome-mugg-box.webp'
      ]
    },
    {
      id: 'take-one-sleeve', cat: 'accessories', type: 'sleeve', print: 'S1F',
      name: { sv: 'TAKE ONE SLEEVE', en: 'TAKE ONE SLEEVE' },
      desc: { sv: 'Inspirerad av filmklappan. "Take One" är början på varje berättelse — bär din utrustning som crewet.', en: 'Inspired by the clapperboard. "Take One" is the start of every story — carry your gear like the crew.' },
      material: { sv: ['Vadderat fodral med dragkedja', 'Finns för 13" och 15"'], en: ['Padded sleeve with zipper', 'Available for 13" and 15"'] },
      badge: { sv: 'Trend', en: 'Trending' },
      price: 529,
      sizePrices: { '13"': 529, '15"': 629 },
      colors: ['pastel'],
      sizes: ['13"', '15"'], defaultSize: '13"',
      image: 'assets/products/take-one-sleeve.webp',
      gallery: [
        'assets/products/take-one-sleeve.webp',
        'assets/products/take-one-sleeve-1.webp',
        'assets/products/take-one-sleeve-2.webp',
        'assets/products/take-one-sleeve-4.webp'
      ]
    },
    {
      id: 'rolling-backpack', cat: 'accessories', type: 'backpack', print: 'S1F',
      name: { sv: 'ROLLING BACKPACK', en: 'ROLLING BACKPACK' },
      desc: { sv: '"Rolling!" Packa din vision och bär den vart du än filmar. Inspirerad av Östersjön, ritad på Fårö. Vadderad laptopficka.', en: '"Rolling!" Pack your vision and carry it wherever you shoot. Inspired by the Baltic Sea, drawn on Fårö. Padded laptop pocket.' },
      badge: { sv: 'Bestseller', en: 'Bestseller' },
      material: { sv: ['Vadderad laptopficka', 'Justerbara axelremmar'], en: ['Padded laptop pocket', 'Adjustable shoulder straps'] },
      price: 739,
      colors: ['navy', 'pink'],
      sizes: null,
      image: 'assets/products/backpack-navy.webp',
      // Egen bild per färg i kundvagnen
      images: {
        pink: 'assets/products/backpack-pink.webp',
        navy: 'assets/products/backpack-navy.webp'
      },
      // Eget bildspel per färg på produktkortet
      galleries: {
        pink: [
          'assets/products/backpack-pink.webp',
          'assets/products/backpack-pink-1.webp',
          'assets/products/backpack-pink-3.webp',
          'assets/products/backpack-pink-4.webp',
          'assets/products/backpack-pink-5.webp',
          'assets/products/backpack-pink-6.webp',
          'assets/products/backpack-pink-7.webp',
          'assets/products/backpack-pink-8.webp',
          'assets/products/backpack-pink-9.webp'
        ],
        navy: [
          'assets/products/backpack-navy.webp',
          'assets/products/backpack-navy-1.webp',
          'assets/products/backpack-navy-2.webp',
          'assets/products/backpack-navy-3.webp',
          'assets/products/backpack-navy-4.webp',
          'assets/products/backpack-navy-5.webp',
          'assets/products/backpack-navy-6.webp',
          'assets/products/backpack-navy-7.webp',
          'assets/products/backpack-navy-8.webp',
          'assets/products/backpack-navy-9.webp'
        ]
      }
    },

    {
      id: 'spoiler-hoodie', cat: 'clothing', type: 'hoodie', print: 'S1F',
      name: { sv: 'SPOILER HOODIE', en: 'SPOILER HOODIE' },
      desc: { sv: 'Du vet alltid hur filmen slutar — äg det. Skön hoodie för den som sett allt.', en: 'You always know how the film ends — own it. A cosy hoodie for those who\'ve seen it all.' },
      price: 669,
      colors: ['natural', 'lightpink', 'white'],
      // Printful gör bara S–XL på den här modellen
      sizes: ['S', 'M', 'L', 'XL'], defaultSize: 'M',
      image: 'assets/products/hoodie-natural.webp',
      images: {
        natural: 'assets/products/hoodie-natural.webp',
        lightpink: 'assets/products/hoodie-pink.webp',
        white: 'assets/products/hoodie-white.webp'
      },
      galleries: {
        natural: [
          'assets/products/hoodie-natural.webp',
          'assets/products/hoodie-natural-1.webp',
          'assets/products/hoodie-natural-2.webp',
          'assets/products/hoodie-natural-3.webp',
          'assets/products/hoodie-natural-4.webp'
        ],
        lightpink: [
          'assets/products/hoodie-pink.webp',
          'assets/products/hoodie-pink-1.webp',
          'assets/products/hoodie-pink-3.webp',
          'assets/products/hoodie-pink-4.webp'
        ],
        white: [
          'assets/products/hoodie-white.webp',
          'assets/products/hoodie-white-1.webp',
          'assets/products/hoodie-white-2.webp',
          'assets/products/hoodie-white-3.webp',
          'assets/products/hoodie-white-5.webp'
        ]
      }
    },

    {
      id: '24fps-hoodie', cat: 'clothing', type: 'hoodie', print: '24',
      name: { sv: '24FPS HOODIE', en: '24FPS HOODIE' },
      desc: { sv: 'Livet levs i 24 bilder per sekund — inspirerad av filmälskare. Bär känslan av film. Mjuk 100 % bomull med fleecefodrad insida som håller värmen.', en: 'Life runs at 24 frames per second — inspired by film lovers. Wear the feeling of film. Made with smooth 100% cotton and a soft fleece-lined interior for warmth.' },
      badge: { sv: 'Filmfavorit', en: 'Film favourite' },
      price: 739,
      colors: ['black', 'lightpink'],
      // Printful har inte XS på den här modellen, och kallar XXL för 2XL
      sizes: ['S', 'M', 'L', 'XL', '2XL'], defaultSize: 'M',
      image: 'assets/products/hoodie-24fps-black.webp',
      images: {
        black: 'assets/products/hoodie-24fps-black.webp',
        lightpink: 'assets/products/hoodie-24fps-lightpink.webp'
      },
      galleries: {
        black: [
          'assets/products/hoodie-24fps-black.webp',
          'assets/products/hoodie-24fps-black-1.webp',
          'assets/products/hoodie-24fps-black-2.webp',
          'assets/products/hoodie-24fps-black-3.webp',
          'assets/products/hoodie-24fps-black-4.webp',
          'assets/products/hoodie-24fps-black-5.webp',
          'assets/products/hoodie-24fps-black-6.webp',
          'assets/products/hoodie-24fps-black-8.webp',
          'assets/products/hoodie-24fps-black-9.webp',
          'assets/products/hoodie-24fps-black-10.webp'
        ],
        lightpink: [
          'assets/products/hoodie-24fps-lightpink.webp',
          'assets/products/hoodie-24fps-lightpink-1.webp',
          'assets/products/hoodie-24fps-lightpink-2.webp',
          'assets/products/hoodie-24fps-lightpink-3.webp',
          'assets/products/hoodie-24fps-lightpink-4.webp',
          'assets/products/hoodie-24fps-lightpink-5.webp',
          'assets/products/hoodie-24fps-lightpink-6.webp',
          'assets/products/hoodie-24fps-lightpink-7.webp'
        ]
      },
      fit: {
        sv: 'Liten i storleken – välj gärna en storlek större än vanligt.',
        en: 'Runs small – consider ordering one size up.'
      },
      details: {
        sv: {
          desc: [
            'Vissa plagg bär bara ett tryck — den här bär en känsla. 24FPS HOODIE är gjord för dig som lever och andas film, med en tung, mjuk bomullsfleece som känns lika bra som den ser ut.',
            'Rymlig passform, varm huva och en generös känguruficka gör den lika hemma på inspelningsplatsen som i soffan efter premiären. Detta är inte bara en hoodie. Det är en del av STEP1-universumet — designad i studion, byggd för din vardag.'
          ],
          specs: ['100% bomull utsida', '65% ringspunnen bomull, 35% polyester', 'Känguruficka fram', 'Tygpatch på ryggen', 'Matchande plana dragsnören', 'Huva i 3 paneler'],
          fine: 'För vuxna · EU-garanti: 2 år · Uppfyller krav för brandsäkerhet, bly, kadmium, bisfenoler och ftalater.'
        },
        en: {
          desc: [
            'Some garments carry just a print — this one carries a feeling. The 24FPS HOODIE is made for those who live and breathe film: a heavy, soft cotton fleece that feels as good as it looks.',
            "Relaxed fit, warm hood and a roomy kangaroo pocket make it as at home on set as on the couch after the premiere. This isn't just a hoodie. It's part of the STEP1 universe — designed in the studio, built for your everyday."
          ],
          specs: ['100% cotton face', '65% ring-spun cotton, 35% polyester', 'Front pouch pocket', 'Self-fabric patch on the back', 'Matching flat drawstrings', '3-panel hood'],
          fine: 'For adults · EU warranty: 2 years · Meets flammability, lead, cadmium, bisphenol and phthalate requirements.'
        }
      }
    },
    {
      id: 'reel-trucker-cap', cat: 'caps', type: 'cap', print: 'S1F',
      name: { sv: 'STEP1 FAN', en: 'STEP1 FAN' },
      desc: { sv: 'Sätt på dig Step1-kepsen och något händer — idéerna börjar rulla. Bär den och du bär med dig Step1. Broderad logga, vit mesh, justerbar. One size.', en: 'Put on the Step1 cap and something happens — the ideas start rolling. Wear it and you carry Step1 with you. Embroidered logo, white mesh, adjustable. One size.' },
      price: 369,
      colors: ['navy', 'silver', 'black'],
      sizes: null,
      image: 'assets/products/trucker-cap-navy.webp',
      images: {
        navy: 'assets/products/trucker-cap-navy.webp',
        silver: 'assets/products/trucker-cap-silver.webp',
        black: 'assets/products/trucker-cap-black.webp'
      },
      galleries: {
        navy: [
          'assets/products/trucker-cap-navy.webp',
          'assets/products/trucker-cap-navy-1.webp',
          'assets/products/trucker-cap-navy-2.webp',
          'assets/products/trucker-cap-navy-3.webp',
          'assets/products/trucker-cap-navy-5.webp'
        ],
        silver: [
          'assets/products/trucker-cap-silver.webp',
          'assets/products/trucker-cap-silver-1.webp',
          'assets/products/trucker-cap-silver-2.webp',
          'assets/products/trucker-cap-silver-3.webp',
          'assets/products/trucker-cap-silver-4.webp',
          'assets/products/trucker-cap-silver-5.webp'
        ],
        black: [
          'assets/products/trucker-cap-black.webp',
          'assets/products/trucker-cap-black-1.webp',
          'assets/products/trucker-cap-black-2.webp',
          'assets/products/trucker-cap-black-3.webp',
          'assets/products/trucker-cap-black-4.webp',
          'assets/products/trucker-cap-black-5.webp'
        ]
      }
    },
    {
      id: 'icon-stickers', cat: 'accessories', type: 'sticker', print: 'S1F',
      name: { sv: 'ICON STICKERS', en: 'ICON STICKERS' },
      desc: { sv: 'Små ikoner, stora historier. Dekorera din värld med filmkärlek — kiss-cut stickers i rosa.', en: 'Small icons, big stories. Decorate your world with film love — kiss-cut stickers in pink.' },
      price: 99,
      colors: ['pink'],
      sizes: null,
      image: 'assets/products/icon-stickers.webp',
      gallery: [
        'assets/products/icon-stickers.webp',
        'assets/products/icon-stickers-1.webp',
        'assets/products/icon-stickers-2.webp'
      ]
    },

    {
      id: 'directors-beanie', cat: 'caps', type: 'cap', print: 'DIR',
      name: { sv: "DIRECTOR'S BEANIE", en: "DIRECTOR'S BEANIE" },
      desc: { sv: '"Reserved for vision." Håll huvudet varmt och blicken skarp — för idéernas timmar. "Inspirerad av Smålands skogar" One size.', en: '"Reserved for vision." Keep your head warm and your eye sharp — for the hours of ideas. "Inspired by the forests of Småland." One size.' },
      price: 309,
      colors: ['olive', 'black', 'brown', 'navy'],
      sizes: null,
      image: 'assets/products/beanie-olive.webp',
      images: {
        black: 'assets/products/beanie-black.webp',
        brown: 'assets/products/beanie-brown.webp',
        navy: 'assets/products/beanie-navy.webp',
        olive: 'assets/products/beanie-olive.webp'
      },
      galleries: {
        black: ['assets/products/beanie-black.webp', 'assets/products/beanie-black-1.webp', 'assets/products/beanie-black-2.webp', 'assets/products/beanie-black-3.webp', 'assets/products/beanie-black-5.webp'],
        brown: ['assets/products/beanie-brown.webp', 'assets/products/beanie-brown-1.webp', 'assets/products/beanie-brown-2.webp', 'assets/products/beanie-brown-3.webp', 'assets/products/beanie-brown-4.webp'],
        navy: ['assets/products/beanie-navy.webp', 'assets/products/beanie-navy-1.webp', 'assets/products/beanie-navy-2.webp', 'assets/products/beanie-navy-3.webp'],
        olive: ['assets/products/beanie-olive.webp', 'assets/products/beanie-olive-1.webp', 'assets/products/beanie-olive-2.webp', 'assets/products/beanie-olive-3.webp', 'assets/products/beanie-olive-4.webp']
      }
    },
    {
      id: 'ad1-beanie', cat: 'caps', type: 'cap', print: 'AD1',
      name: { sv: 'AD1 BEANIE', en: 'AD1 BEANIE' },
      desc: { sv: '"Reserved for vision." För tankarna som blir till film. Ribbstickad mössa med vikt kant. One size.', en: '"Reserved for vision." For the thoughts that become films. Ribbed knit beanie, cuffed. One size.' },
      price: 309,
      colors: ['candy', 'orange', 'white'],
      sizes: null,
      image: 'assets/products/ad1-beanie-pink.webp',
      images: {
        candy: 'assets/products/ad1-beanie-pink.webp',
        orange: 'assets/products/ad1-beanie-orange.webp',
        white: 'assets/products/ad1-beanie-white.webp'
      },
      galleries: {
        candy: ['assets/products/ad1-beanie-pink.webp', 'assets/products/ad1-beanie-pink-1.webp', 'assets/products/ad1-beanie-pink-2.webp', 'assets/products/ad1-beanie-pink-3.webp'],
        orange: ['assets/products/ad1-beanie-orange.webp', 'assets/products/ad1-beanie-orange-1.webp', 'assets/products/ad1-beanie-orange-2.webp'],
        white: ['assets/products/ad1-beanie-white.webp', 'assets/products/ad1-beanie-white-1.webp', 'assets/products/ad1-beanie-white-2.webp', 'assets/products/ad1-beanie-white-3.webp']
      }
    },
    {
      id: 'static-reel-sleeve', cat: 'accessories', type: 'sleeve', print: 'S1F',
      name: { sv: 'GLITCH SLEEVE', en: 'GLITCH SLEEVE' },
      desc: { sv: 'Inspirerad av glitchen mellan tagningarna. Skydda din maskin med en design som är helt unik. Vadderat med dragkedja.', en: 'Inspired by the glitch between takes. Protect your machine with a design that\'s one of a kind. Padded, zippered.' },
      material: { sv: ['Vadderat fodral med dragkedja', 'Finns för 13" och 15"'], en: ['Padded sleeve with zipper', 'Available for 13" and 15"'] },
      price: 459,
      sizePrices: { '13"': 459, '15"': 529 },
      colors: ['silver'],
      sizes: ['13"', '15"'], defaultSize: '13"',
      image: 'assets/products/static-sleeve.webp',
      gallery: [
        'assets/products/static-sleeve.webp',
        'assets/products/static-sleeve-1.webp',
        'assets/products/static-sleeve-2.webp'
      ]
    },
    {
      id: 'lil-director-tee', cat: 'clothing', type: 'tee', print: 'LIL',
      name: { sv: "LIL' DIRECTOR TEE", en: "LIL' DIRECTOR TEE" },
      desc: { sv: 'En ny liten regissör är född. "Get ready for some movies, with a bottle of popcorn" — mjuk baby-tee. Storlek 6–24 mån.', en: 'A tiny new director is born. "Get ready for some movies, with a bottle of popcorn" — soft baby tee. Sizes 6–24 months.' },
      badge: { sv: 'Nyhet', en: 'New' },
      material: { sv: ['Mjuk bomull', 'Storlek 6–24 månader'], en: ['Soft cotton', 'Sizes 6–24 months'] },
      price: 269,
      colors: ['candy', 'lightblue', 'white'],
      sizes: ['6M', '12M', '18M', '24M'], defaultSize: '12M',
      image: 'assets/products/lil-tee-pink.webp',
      images: {
        candy: 'assets/products/lil-tee-pink.webp',
        lightblue: 'assets/products/lil-tee-lightblue.webp',
        white: 'assets/products/lil-tee-white.webp'
      },
      galleries: {
        candy: ['assets/products/lil-tee-pink.webp', 'assets/products/lil-tee-pink-1.webp', 'assets/products/lil-tee-pink-2.webp', 'assets/products/lil-tee-pink-3.webp'],
        lightblue: ['assets/products/lil-tee-lightblue.webp', 'assets/products/lil-tee-lightblue-1.webp', 'assets/products/lil-tee-lightblue-2.webp', 'assets/products/lil-tee-lightblue-3.webp', 'assets/products/lil-tee-lightblue-4.webp'],
        white: ['assets/products/lil-tee-white.webp', 'assets/products/lil-tee-white-1.webp', 'assets/products/lil-tee-white-2.webp', 'assets/products/lil-tee-white-3.webp']
      }
    },

    {
      id: 'crew-tee', cat: 'clothing', type: 'tee', print: 'CREW',
      name: { sv: 'CREW TEE', en: 'CREW TEE' },
      desc: { sv: 'Ingen film blir till utan sitt crew. Bär laget — en unisex-tee som är skön och klädsam på alla.', en: "No film happens without its crew. Wear the team — a unisex tee that's comfortable and flattering on everyone." },
      price: 289,
      colors: ['heather', 'yellow', 'black'],
      // Printful gör bara S–XL på den här modellen
      sizes: ['S', 'M', 'L', 'XL'], defaultSize: 'M',
      image: 'assets/products/crew-tee-heather.webp',
      images: {
        yellow: 'assets/products/crew-tee-yellow.webp',
        black: 'assets/products/crew-tee-black.webp',
        heather: 'assets/products/crew-tee-heather.webp'
      },
      galleries: {
        yellow: ['assets/products/crew-tee-yellow.webp', 'assets/products/crew-tee-yellow-1.webp', 'assets/products/crew-tee-yellow-2.webp', 'assets/products/crew-tee-yellow-3.webp'],
        black: ['assets/products/crew-tee-black.webp', 'assets/products/crew-tee-black-1.webp', 'assets/products/crew-tee-black-2.webp', 'assets/products/crew-tee-black-3.webp', 'assets/products/crew-tee-black-4.webp'],
        heather: ['assets/products/crew-tee-heather.webp', 'assets/products/crew-tee-heather-1.webp', 'assets/products/crew-tee-heather-2.webp', 'assets/products/crew-tee-heather-3.webp', 'assets/products/crew-tee-heather-4.webp']
      }
    },
    {
      id: 'action-dad-cap', cat: 'caps', type: 'cap', print: 'ACT',
      name: { sv: 'ACTION DAD CAP', en: 'ACTION DAD CAP' },
      desc: { sv: 'Klappan slår ihop och allt börjar. "And action" — de två orden som startar varje scen. Bär dem varje dag. 100 % bomullsmanchester. One size.', en: 'The slate claps and everything begins. "And action" — the two words that start every scene. Wear them every day. 100% cotton corduroy. One size.' },
      badge: { sv: 'Nyhet', en: 'New' },
      material: { sv: ['100 % bomullsmanchester', 'Justerbar spänne', 'One size'], en: ['100% cotton corduroy', 'Adjustable snap', 'One size'] },
      price: 369,
      colors: ['camel', 'black'],
      sizes: null,
      image: 'assets/products/dad-cap-camel.webp',
      images: {
        camel: 'assets/products/dad-cap-camel.webp',
        black: 'assets/products/dad-cap-black.webp'
      },
      galleries: {
        camel: ['assets/products/dad-cap-camel.webp', 'assets/products/dad-cap-camel-1.webp', 'assets/products/dad-cap-camel-2.webp', 'assets/products/dad-cap-camel-3.webp'],
        black: ['assets/products/dad-cap-black.webp', 'assets/products/dad-cap-black-1.webp', 'assets/products/dad-cap-black-2.webp', 'assets/products/dad-cap-black-3.webp']
      }
    },
    {
      id: 'gear-stickers', cat: 'accessories', type: 'sticker', print: 'S1F',
      name: { sv: 'GEAR STICKERS', en: 'GEAR STICKERS' },
      desc: { sv: 'En hyllning till kamerorna som format filmhistorien. Kiss-cut stickers, tåliga och vattenavvisande.', en: 'A tribute to the cameras that shaped film history. Kiss-cut stickers, durable and water-resistant.' },
      price: 99,
      colors: ['forest'],
      sizes: null,
      image: 'assets/products/gear-stickers.webp',
      gallery: [
        'assets/products/gear-stickers.webp',
        'assets/products/gear-stickers-1.webp',
        'assets/products/gear-stickers-2.webp',
        'assets/products/gear-stickers-3.webp'
      ]
    }

    /* ===================================================
       PÅ VÄG IN — färdigskrivna, väntar bara på bilderna
       ===================================================
       Så här aktiverar du dem när bilderna är uppladdade:
         1. Ta bort raden ovanför blocket ( `/*` ) och raden
            under ( slut-tecknet ), så koden börjar gälla.
         2. Lägg till id:t i PRODUCT_ORDER längre ner.
         3. Lägg till pris i functions/_lib/catalog.js
            (raderna ligger redan där, utkommenterade).

       BILDER SOM BEHÖVS (exakta filnamn, i assets/products/):
         Step1 Jersey — samma bild för alla storlekar:
           step1-jersey.png          ← visas först
           step1-jersey-1.png        ← visas vid hover
           step1-jersey-2.png, -3.png …  (så många du har)

         On Set Cap — en uppsättning per färg:
           on-set-cap-navy.png,     on-set-cap-navy-1.png, -2.png …
           on-set-cap-charcoal.png, on-set-cap-charcoal-1.png, -2.png …
           on-set-cap-white.png,    on-set-cap-white-1.png, -2.png …

    , {
      id: 'step1-jersey', cat: 'clothing', type: 'jersey', print: 'S1F',
      name: { sv: 'STEP1 JERSEY', en: 'STEP1 JERSEY' },
      desc: { sv: 'Nummer 23 på bröstet och hela pastellspektrumet på ryggen. Ett lag som inte spelar boll — vi gör film. Allover-tryck, återvunnen polyester.', en: 'Number 23 on the chest and the whole pastel spectrum down the back. A team that doesn\'t play ball — we make films. All-over print, recycled polyester.' },
      material: { sv: ['Allover-tryck, återvunnen polyester', 'Ledig passform', 'Ärmlös'], en: ['All-over print, recycled polyester', 'Relaxed fit', 'Sleeveless'] },
      price: 459,
      colors: ['pastel'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'], defaultSize: 'M',
      image: 'assets/products/step1-jersey.webp',
      gallery: [
        'assets/products/step1-jersey.webp',
        'assets/products/step1-jersey-1.webp',
        'assets/products/step1-jersey-2.webp'
      ]
    }
    , {
      id: 'on-set-cap', cat: 'caps', type: 'cap', print: 'S1F',
      name: { sv: 'ON SET CAP', en: 'ON SET CAP' },
      desc: { sv: 'För dagarna på inspelning. Lampan tänds, ljuset går upp — och allt annat får vänta. Broderad framtill, justerbar. One size.', en: 'For the days on set. The lamp switches on, the light comes up — and everything else can wait. Embroidered front, adjustable. One size.' },
      material: { sv: ['100 % bomull', 'Broderi framtill', 'Justerbar spänne', 'One size'], en: ['100% cotton', 'Front embroidery', 'Adjustable buckle', 'One size'] },
      price: 369,
      colors: ['navy', 'charcoal', 'white'],
      sizes: null,
      image: 'assets/products/on-set-cap-navy.webp',
      images: {
        navy: 'assets/products/on-set-cap-navy.webp',
        charcoal: 'assets/products/on-set-cap-charcoal.webp',
        white: 'assets/products/on-set-cap-white.webp'
      },
      galleries: {
        navy: ['assets/products/on-set-cap-navy.webp', 'assets/products/on-set-cap-navy-1.webp', 'assets/products/on-set-cap-navy-2.webp'],
        charcoal: ['assets/products/on-set-cap-charcoal.webp', 'assets/products/on-set-cap-charcoal-1.webp', 'assets/products/on-set-cap-charcoal-2.webp'],
        white: ['assets/products/on-set-cap-white.webp', 'assets/products/on-set-cap-white-1.webp', 'assets/products/on-set-cap-white-2.webp']
      }
    }
    =================================================== */

    /* ---------------------------------------------------
       EXEMPEL — riktig Printful-produkt (kopiera & fyll i)
       ---------------------------------------------------
       Skillnaden mot mockuperna ovan:
         • `images` : riktiga produktbilder per färg (från Printful)
         • `variants`: kartar färg+storlek → Printfuls variant_id
           (hämtas från /printful-products, se PRINTFUL_SETUP.md)
       Så länge du inte fyllt i `images` faller kortet tillbaka
       till SVG-mockupen automatiskt.

    , {
      id: 'tee-real', cat: 'clothing', type: 'tee', print: 'S1F',
      name: { sv: 'STEP1FILM Tee', en: 'STEP1FILM Tee' },
      desc: { sv: 'Din riktiga design, tryckt av Printful.', en: 'Your real design, printed by Printful.' },
      price: 279,
      colors: ['black', 'white'],
      sizes: ['S', 'M', 'L', 'XL'], defaultSize: 'M',
      images: {
        black: 'https://.../din-svarta-tee.png',
        white: 'https://.../din-vita-tee.png'
      },
      variants: {
        'black|S': 4011111, 'black|M': 4011112, 'black|L': 4011113, 'black|XL': 4011114,
        'white|S': 4011121, 'white|M': 4011122, 'white|L': 4011123, 'white|XL': 4011124
      }
    }
    --------------------------------------------------- */
  ];

  /* -----------------------------------------------------
     VISNINGSORDNING — ids i den ordning de ska visas.
     Produkter som saknas i listan hamnar sist (i array-ordning).
  ----------------------------------------------------- */
  /* Ordningen nedan följer några klassiska köppsykologiska principer:
     · Ankring — de dyraste plaggen först, allt därefter känns rimligare.
     · Social bevisning — de flaggade produkterna (Filmfavorit, Bestseller,
       Trend, Mest populär) ligger i första skärmen.
     · Kontrasteffekt — priset växlar upp och ner istället för att falla
       jämnt, så varje ny produkt läses som ett eget beslut.
     · Von Restorff — inga två grannar delar kategori (två hoodies, två
       mössor, två fodral ligger aldrig bredvid varandra).
     · Litet första ja — 229 kr-muggen tidigt sänker tröskeln till första köpet.
     · Serieposition — starkast först och billig impuls sist, där kunden
       ändå överväger att fylla på till fri frakt (1 200 kr).

     TIDIGARE ORDNING (för att backa detta steg):
       action-dad-cap, take-one-sleeve, 24fps-hoodie, awesome-mugg,
       rolling-backpack, lil-director-tee, icon-stickers, crew-tee,
       spoiler-hoodie, reel-trucker-cap, reel-mugg, ad1-beanie,
       static-reel-sleeve, directors-beanie, gear-stickers            */
  /* Tillfälligt dolda — slut hos Printful. Ta bort id:t ur listan för
     att visa produkten igen; allt annat (bilder, priser, variant-id)
     ligger kvar orört. */
  const HIDDEN = ['crew-tee', 'ad1-beanie'];
  
    const PRODUCT_ORDER = [
    '24fps-hoodie',        // 699 · Filmfavorit — ankare + starkaste berättelsen
    'rolling-backpack',    // 699 · Bestseller — håller ankaret uppe
    'take-one-sleeve',     // 499 · Trend — första prissänkningen känns som en lättnad
    'awesome-mugg',        // 229 · Mest populär — det lilla första ja:et
    'action-dad-cap',      // 349 · Nyhet
    'spoiler-hoodie',      // 629 · kontrast tillbaka uppåt
    'crew-tee',            // 275
    'static-reel-sleeve',  // 429 · skilt från TAKE ONE så de inte äter varandra
    'reel-trucker-cap',    // 349
    'lil-director-tee',    // 249 · Nyhet — presenten, känslan
    'icon-stickers',       //  85 · impuls
    'directors-beanie',    // 285
    'reel-mugg',           // 229
    'ad1-beanie',          // 285
    'gear-stickers'        //  85 · sista lilla ja:et upp mot fri frakt
    // PÅ VÄG IN — lägg in dessa när bilderna finns:
    // 'step1-jersey'  (429) passar direkt efter 'take-one-sleeve'
    // 'on-set-cap'    (349) passar direkt efter 'action-dad-cap'
  ];
  // Filtrera bort dolda produkter innan något renderas eller prissätts
  for (let i = PRODUCTS.length - 1; i >= 0; i--) {
    if (HIDDEN.includes(PRODUCTS[i].id)) PRODUCTS.splice(i, 1);
  }

  PRODUCTS.sort((a, b) => {
    const ia = PRODUCT_ORDER.indexOf(a.id);
    const ib = PRODUCT_ORDER.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });

  /* -----------------------------------------------------
     i18n
  ----------------------------------------------------- */
  const I18N = {
    sv: {
      tagline: 'MERCH & PRINT',
      heroTitle: 'STEP1 STORE',
      heroManifest: 'Skapad av filmare — för dig som älskar berättelser.',
      heroLead: 'Det är filmkultur att bära, dela och leva.',
      heroCta: 'Utforska kollektionen',
      trustShip: 'Fri frakt från 1 200 kr',
      trustReturn: '14 dagars ångerrätt',
      trustPrint: 'Tryckt på beställning',
      all: 'Allt', clothing: 'Kläder', caps: 'Kepsar', mugs: 'Muggar', accessories: 'Tillbehör',
      colorLabel: 'Färg', sizeLabel: 'Storlek', oneSize: 'One size',
      detailsLabel: 'Detaljer & storlek', materialLabel: 'Material & detaljer',
      careLabel: 'Skötselråd', deliveryLabel: 'Leverans',
      deliveryTime: 'Tryckt på beställning · leverans 5–10 arbetsdagar',
      zoomHint: 'Klicka för att zooma', zoomTip: 'Klicka på bilden för att zooma · dra för att panorera',
      add: 'Lägg i vagnen', added: 'Tillagd ✓',
      cart: 'Vagnen', cartTitle: 'Din vagn', empty: 'Din vagn är tom.',
      keepShopping: 'Fortsätt handla',
      subtotal: 'Summa', checkout: 'Till kassan',
      remove: 'Ta bort',
      coBack: 'Tillbaka', coTitle: 'Kassa',
      name: 'Namn', email: 'E-post', phone: 'Telefon',
      address: 'Adress', zip: 'Postnr', city: 'Ort',
      notes: 'Meddelande (valfritt)',
      payTitle: 'Betalsätt',
      swishName: 'Swish', swishDesc: 'Läggs till snart',
      invoiceName: 'Beställningsförfrågan', invoiceDesc: 'Vi mejlar dig en betalningslänk',
      payCard: 'Kort / Klarna', payCardDesc: 'Betala säkert via Stripe',
      paySwish: 'Swish', paySwishDesc: 'Betala med Swish-appen',
      payNow: 'Betala', paying: 'Öppnar betalning…',
      swishWaiting: 'Öppna Swish-appen och godkänn betalningen…',
      swishOpenApp: 'Öppna Swish',
      swishScan: 'Skanna QR-koden med Swish-appen',
      swishDeclined: 'Betalningen avbröts eller nekades.',
      swishTimeout: 'Betalningen tog för lång tid. Försök igen.',
      payError: 'Något gick fel med betalningen. Försök igen.',
      thanksPaid: 'Tack! Din betalning är genomförd och ordern skickas till tryck.',
      placeOrder: 'Skicka beställning',
      orderSummary: 'Sammanfattning',
      shipping: 'Frakt', shippingCalc: 'Räknas vid utcheckning',
      freeShipping: 'Fri frakt',
      total: 'Totalt',
      thanksTitle: 'Tack för din beställning!',
      thanksText: 'Vi har tagit emot din förfrågan och hör av oss på mejl med betalning och leverans. Betalning (Swish/kort) aktiveras när butiken flyttat till egen domän.',
      done: 'Klar',
      required: 'Fyll i namn och e-post.',
      copy: 'Kopiera', copied: 'Kopierad',
      addedToast: 'Tillagd i vagnen — nu börjar berättelsen.'
    },
    en: {
      tagline: 'MERCH & PRINT',
      heroTitle: 'STEP1 STORE',
      heroManifest: 'Designed by filmmakers — for people who love stories.',
      heroLead: "It's film culture to wear, share and live.",
      heroCta: 'Explore the collection',
      trustShip: 'Free shipping from 1,200 kr',
      trustReturn: '14-day right of return',
      trustPrint: 'Printed on demand',
      all: 'All', clothing: 'Clothing', caps: 'Caps', mugs: 'Mugs', accessories: 'Accessories',
      colorLabel: 'Colour', sizeLabel: 'Size', oneSize: 'One size',
      detailsLabel: 'Details & size', materialLabel: 'Material & details',
      careLabel: 'Care', deliveryLabel: 'Delivery',
      deliveryTime: 'Printed on demand · delivery in 5–10 business days',
      zoomHint: 'Click to zoom', zoomTip: 'Click the image to zoom · drag to pan',
      add: 'Add to cart', added: 'Added ✓',
      cart: 'Cart', cartTitle: 'Your cart', empty: 'Your cart is empty.',
      keepShopping: 'Keep shopping',
      subtotal: 'Subtotal', checkout: 'Checkout',
      remove: 'Remove',
      coBack: 'Back', coTitle: 'Checkout',
      name: 'Name', email: 'Email', phone: 'Phone',
      address: 'Address', zip: 'ZIP', city: 'City',
      notes: 'Message (optional)',
      payTitle: 'Payment',
      swishName: 'Swish', swishDesc: 'Coming soon',
      invoiceName: 'Order request', invoiceDesc: "We'll email you a payment link",
      payCard: 'Card / Klarna', payCardDesc: 'Pay securely via Stripe',
      paySwish: 'Swish', paySwishDesc: 'Pay with the Swish app',
      payNow: 'Pay', paying: 'Opening payment…',
      swishWaiting: 'Open the Swish app and approve the payment…',
      swishOpenApp: 'Open Swish',
      swishScan: 'Scan the QR code with the Swish app',
      swishDeclined: 'The payment was cancelled or declined.',
      swishTimeout: 'The payment timed out. Please try again.',
      payError: 'Something went wrong with the payment. Please try again.',
      thanksPaid: 'Thank you! Your payment went through and the order is going to print.',
      placeOrder: 'Place order',
      orderSummary: 'Summary',
      shipping: 'Shipping', shippingCalc: 'Calculated at checkout',
      freeShipping: 'Free shipping',
      total: 'Total',
      thanksTitle: 'Thank you for your order!',
      thanksText: "We've received your request and will email you with payment and delivery. Payment (Swish/card) goes live once the store moves to its own domain.",
      done: 'Done',
      required: 'Please fill in name and email.',
      copy: 'Copy', copied: 'Copied',
      addedToast: 'Added to cart — and let the story begin.'
    }
  };

  /* -----------------------------------------------------
     STATE
  ----------------------------------------------------- */
  let lang = localStorage.getItem('s1f_lang') || 'sv';
  let filter = 'all';
  // Fylls längre ned, när priceFor/variantKey finns definierade
  let cart = [];
  // Per-card selected variant (colour + size), keyed by product id
  const selection = {};

  const t = (k) => (I18N[lang][k] || k);
  // Färgnamn — tål okända nycklar (t.ex. gammal vagn efter sortimentsändring)
  const cname = (key) => {
    const c = COLORS[key];
    return (c && c[lang]) || String(key || '');
  };
  // Produktnamn — tål trasiga/gamla poster
  const pname = (obj) => (obj && obj.name && (obj.name[lang] || obj.name.sv)) || '';
  // Pris för en produkt givet vald storlek (stöder olika pris per storlek)
  const priceFor = (p, size) => (p.sizePrices && size && p.sizePrices[size] != null) ? p.sizePrices[size] : p.price;

  /**
   * Läser kundvagnen och saneras mot dagens sortiment.
   * Poster vars produkt inte längre finns tas bort (servern skulle ändå
   * avvisa dem), och priserna räknas om så att visat pris aldrig är gammalt.
   */
  function loadCart() {
    let raw;
    try { raw = JSON.parse(localStorage.getItem('s1f_cart')); }
    catch (e) { return []; }
    if (!Array.isArray(raw)) return [];

    const cleaned = [];
    raw.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const p = PRODUCTS.find((x) => x.id === item.id);
      if (!p) return;                                   // produkten finns inte längre

      const color = p.colors.includes(item.color) ? item.color : p.colors[0];
      const size = p.sizes ? (p.sizes.includes(item.size) ? item.size : p.defaultSize) : null;
      const qty = Math.min(20, Math.max(1, parseInt(item.qty, 10) || 1));

      cleaned.push({
        key: variantKey(p.id, color, size),
        id: p.id, type: p.type, print: p.print,
        name: p.name,                                   // alltid dagens namn
        price: priceFor(p, size),                       // alltid dagens pris
        color, size, qty,
        variant_id: (p.variants && p.variants[`${color}|${size || 'one'}`]) || null
      });
    });
    return cleaned;
  }

  // Nu finns alla hjälpfunktioner — läs in och sanera vagnen.
  cart = loadCart();
  function saveCart() { localStorage.setItem('s1f_cart', JSON.stringify(cart)); }

  /* -----------------------------------------------------
     GARMENT RENDER HELPER
  ----------------------------------------------------- */
  function garmentMarkup(product, colorKey) {
    const c = COLORS[colorKey] || COLORS.black;
    const pc = c.light ? '#1a1a1a' : '#f2f2f2';
    const wrap = document.createElement('div');
    wrap.style.setProperty('--gc', c.hex);
    wrap.style.setProperty('--pc', pc);
    wrap.style.width = '100%';
    wrap.style.height = '100%';
    wrap.style.display = 'flex';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'center';

    // Riktig produktbild (från Printful) om den finns för vald färg,
    // annars en enda produktbild, annars SVG-mockupen.
    const photo = (product.images && product.images[colorKey]) || product.image;
    if (photo) {
      const img = document.createElement('img');
      img.className = 'garment garment-photo';
      img.src = photo;
      img.alt = (product.name && (product.name[lang] || product.name.sv)) || '';
      img.loading = 'lazy';
      // Om bildfilen inte finns ännu (t.ex. inte uppladdad) — visa
      // SVG-mockupen istället så inget ser trasigt ut.
      img.addEventListener('error', () => {
        wrap.innerHTML = SVG[product.type] ? SVG[product.type](product.print) : '';
      });
      wrap.appendChild(img);
    } else {
      wrap.innerHTML = SVG[product.type](product.print);
    }
    return wrap;
  }

  /* -----------------------------------------------------
     SKÖTSELRÅD per produkttyp
     ⚠️ Stäm av mot Printfuls produktsida för varje artikel.
  ----------------------------------------------------- */
  const CARE = {
    tee: {
      sv: 'Tvätta ut och in i högst 30 °C med liknande färger. Torktumla inte. Stryk inte direkt på trycket.',
      en: 'Machine wash inside out at max 30 °C with like colours. Do not tumble dry. Do not iron directly on the print.'
    },
    hoodie: {
      sv: 'Tvätta ut och in i högst 30 °C med liknande färger. Torktumla inte. Stryk inte direkt på trycket.',
      en: 'Machine wash inside out at max 30 °C with like colours. Do not tumble dry. Do not iron directly on the print.'
    },
    cap: {
      sv: 'Handtvätta i ljummet vatten med mild tvål. Låt lufttorka. Torktumla inte.',
      en: 'Hand wash in lukewarm water with mild soap. Air dry. Do not tumble dry.'
    },
    mug: {
      sv: 'Tål maskindisk och mikrovågsugn.',
      en: 'Dishwasher and microwave safe.'
    },
    sleeve: {
      sv: 'Torka av med en fuktig trasa. Maskintvätta inte.',
      en: 'Wipe clean with a damp cloth. Do not machine wash.'
    },
    backpack: {
      sv: 'Torka av med en fuktig trasa. Maskintvätta inte.',
      en: 'Wipe clean with a damp cloth. Do not machine wash.'
    },
    sticker: {
      sv: 'Tål väta och sol. Fäster bäst på rena, släta ytor. Tål inte maskindisk.',
      en: 'Water and sun resistant. Sticks best to clean, smooth surfaces. Not dishwasher safe.'
    }
  };

  /* -----------------------------------------------------
     BILDSPEL (slideshow) — återanvänds per produkt/färg
  ----------------------------------------------------- */
  // Vilka bilder gäller för en produkt givet vald färg?
  // - galleries: { colorKey: [bilder] }  (olika bilder per färg)
  // - gallery:   [bilder]                (samma oavsett färg)
  function imagesFor(p, colorKey) {
    if (p.galleries) return p.galleries[colorKey] || [];
    if (p.gallery) return p.gallery;
    return null;
  }

  function clearVisualTimer(visual) {
    if (visual._slideTimer) {
      clearInterval(visual._slideTimer);
      const i = slideTimers.indexOf(visual._slideTimer);
      if (i > -1) slideTimers.splice(i, 1);
      visual._slideTimer = null;
    }
  }

  // Bygg (eller bygg om) bildspelet i en produktrutas visual-element.
  function buildSlideshow(visual, p, colorKey) {
    clearVisualTimer(visual);
    visual.querySelectorAll('.pc-slides, .pc-nav, .pc-dots').forEach((el) => el.remove());

    const slidesWrap = document.createElement('div');
    slidesWrap.className = 'pc-slides';
    const slideEls = [];
    const imgs = imagesFor(p, colorKey);

    if (imgs && imgs.length) {
      imgs.forEach((src, i) => {
        const s = document.createElement('div');
        s.className = 'pc-slide' + (i === 0 ? ' active' : '');
        const img = document.createElement('img');
        img.className = 'garment garment-photo';
        img.src = src;
        img.alt = p.name[lang];
        img.loading = i === 0 ? 'eager' : 'lazy';
        img.title = t('zoomHint');
        img.addEventListener('error', () => { s.innerHTML = SVG[p.type] ? SVG[p.type](p.print) : ''; });
        // Klicka för att zooma (öppnar förstoringsläge)
        img.addEventListener('click', (e) => { e.stopPropagation(); openLightbox(imgs, i, p.name[lang]); });
        s.appendChild(img);
        slidesWrap.appendChild(s);
        slideEls.push(s);
      });
    } else {
      const s = document.createElement('div');
      s.className = 'pc-slide active';
      s.appendChild(garmentMarkup(p, colorKey));
      slidesWrap.appendChild(s);
      slideEls.push(s);
    }
    visual.appendChild(slidesWrap);

    if (slideEls.length <= 1) {
      visual.onmouseenter = null;
      visual.onmouseleave = null;
      return;
    }

    // Bildspelet rullar av sig självt och loopar. Pausar när kunden
    // för musen över kortet eller själv bläddrar, så man hinner titta.
    let idx = 0;
    let userInteracted = false; // sant när kunden bläddrat själv
    let stopAuto = () => {};    // sätts när autospelningen startats nedan
    const dotWrap = document.createElement('div');
    dotWrap.className = 'pc-dots';
    const dots = slideEls.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'pc-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `${p.name[lang]} — ${i + 1}`);
      d.addEventListener('click', (e) => { e.stopPropagation(); userInteracted = true; stopAuto(); go(i); });
      dotWrap.appendChild(d);
      return d;
    });
    const go = (n) => {
      idx = (n + slideEls.length) % slideEls.length;
      slideEls.forEach((s, i) => s.classList.toggle('active', i === idx));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    };
    const mkNav = (cls, sym, dir, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pc-nav ' + cls;
      b.innerHTML = sym;
      b.setAttribute('aria-label', label);
      b.addEventListener('click', (e) => { e.stopPropagation(); userInteracted = true; stopAuto(); go(idx + dir); });
      return b;
    };
    visual.appendChild(mkNav('pc-prev', '&#8249;', -1, 'Föregående bild'));
    visual.appendChild(mkNav('pc-next', '&#8250;', 1, 'Nästa bild'));
    visual.appendChild(dotWrap);

    /* Automatisk växling. Respekterar prefers-reduced-motion, och stannar
       medan musen vilar på kortet eller efter att kunden bläddrat själv. */
    const stillMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let timer = null;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    stopAuto = stop;
    const play = () => {
      if (stillMotion || userInteracted || timer) return;
      timer = setInterval(() => go(idx + 1), 3200);
    };
    // Rulla bara medan kortet syns — sparar batteri och data
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? play() : stop()));
      }, { threshold: 0.35 }).observe(visual);
    } else {
      play();
    }
    const canHover = window.matchMedia && window.matchMedia('(hover: hover)').matches;
    if (canHover) {
      visual.onmouseenter = stop;
      visual.onmouseleave = () => { if (!userInteracted) play(); };
    } else {
      visual.onmouseenter = null;
      visual.onmouseleave = null;
    }

    // Swajp i sidled (mobil/touch) för att bläddra bilderna.
    let touchX = null;
    slidesWrap.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
    slidesWrap.addEventListener('touchend', (e) => {
      if (touchX == null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 30) { userInteracted = true; go(idx + (dx < 0 ? 1 : -1)); }
      touchX = null;
    }, { passive: true });
  }

  /* -----------------------------------------------------
     PRODUCT GRID
  ----------------------------------------------------- */
  const grid = document.getElementById('grid');
  let slideTimers = []; // aktiva bildspels-timers (rensas vid omritning)

  function renderGrid() {
    slideTimers.forEach((id) => clearInterval(id));
    slideTimers = [];
    grid.innerHTML = '';
    const list = PRODUCTS.filter((p) => filter === 'all' || p.cat === filter);

    list.forEach((p) => {
      if (!selection[p.id]) {
        selection[p.id] = { color: p.colors[0], size: p.sizes ? p.defaultSize : null };
      }
      const sel = selection[p.id];

      const card = document.createElement('article');
      card.className = 'product-card';

      // Visual
      const visual = document.createElement('div');
      visual.className = 'pc-visual';
      const badgeText = t(p.cat);
      const badge = document.createElement('span');
      badge.className = 'pc-badge';
      badge.textContent = badgeText;
      visual.appendChild(badge);

      // Kampanj-etikett (t.ex. Bestseller / Nyhet) — uppe till höger
      if (p.badge) {
        const pb = document.createElement('span');
        pb.className = 'pc-promo';
        pb.textContent = (p.badge[lang] || p.badge.sv);
        visual.appendChild(pb);
      }

      // Bildspel (galleri/per färg om det finns, annars SVG-mockup)
      buildSlideshow(visual, p, sel.color);

      // Body
      const body = document.createElement('div');
      body.className = 'pc-body';

      const head = document.createElement('div');
      head.className = 'pc-head';
      head.innerHTML = `<h3 class="pc-name">${p.name[lang]}</h3>
        <span class="pc-price" data-price>${priceFor(p, sel.size)} ${CONFIG.currency}</span>`;
      body.appendChild(head);

      const desc = document.createElement('p');
      desc.className = 'pc-desc';
      desc.textContent = p.desc[lang];
      body.appendChild(desc);

      // Passform-varning (t.ex. "liten i storleken") — alltid synlig
      if (p.fit) {
        const fit = document.createElement('p');
        fit.className = 'pc-fit';
        fit.textContent = '↕ ' + (p.fit[lang] || p.fit.sv);
        body.appendChild(fit);
      }

      // Colours
      const colWrap = document.createElement('div');
      colWrap.innerHTML = `<span class="opt-label">${t('colorLabel')}: <span class="opt-value" data-cval>${cname(sel.color)}</span></span>`;
      const swatches = document.createElement('div');
      swatches.className = 'swatches';
      p.colors.forEach((ck) => {
        const sw = document.createElement('button');
        sw.className = 'swatch' + (ck === sel.color ? ' active' : '');
        sw.style.background = COLORS[ck].hex;
        sw.setAttribute('aria-label', cname(ck));
        sw.title = cname(ck);
        sw.addEventListener('click', () => {
          sel.color = ck;
          // update swatches
          swatches.querySelectorAll('.swatch').forEach((el) => el.classList.remove('active'));
          sw.classList.add('active');
          colWrap.querySelector('[data-cval]').textContent = cname(ck);
          // Bygg om bildspelet för den valda färgen
          // (per-färg-bilder för t.ex. backpacken, annars omfärgad mockup)
          buildSlideshow(visual, p, ck);
        });
        swatches.appendChild(sw);
      });
      colWrap.appendChild(swatches);
      body.appendChild(colWrap);

      // Sizes
      if (p.sizes) {
        const sizeWrap = document.createElement('div');
        sizeWrap.innerHTML = `<span class="opt-label">${t('sizeLabel')}</span>`;
        const sizes = document.createElement('div');
        sizes.className = 'sizes';
        p.sizes.forEach((sz) => {
          const b = document.createElement('button');
          b.className = 'size' + (sz === sel.size ? ' active' : '');
          b.textContent = sz;
          b.addEventListener('click', () => {
            sel.size = sz;
            sizes.querySelectorAll('.size').forEach((el) => el.classList.remove('active'));
            b.classList.add('active');
            // Uppdatera priset om produkten har olika pris per storlek
            const priceEl = head.querySelector('[data-price]');
            if (priceEl) priceEl.textContent = `${priceFor(p, sz)} ${CONFIG.currency}`;
          });
          sizes.appendChild(b);
        });
        sizeWrap.appendChild(sizes);
        body.appendChild(sizeWrap);
      } else {
        const one = document.createElement('div');
        one.innerHTML = `<span class="opt-label">${t('sizeLabel')}: <span class="opt-value">${t('oneSize')}</span></span>`;
        body.appendChild(one);
      }

      // Detaljer & storlek (utfällbart) — visas på alla produkter
      {
        const dd = p.details ? (p.details[lang] || p.details.sv) : null;
        const det = document.createElement('details');
        det.className = 'pc-details';
        const sum = document.createElement('summary');
        sum.textContent = t('detailsLabel');
        det.appendChild(sum);
        const dbody = document.createElement('div');
        dbody.className = 'pc-details-body';

        const addLabel = (txt) => {
          const lbl = document.createElement('span');
          lbl.className = 'opt-label';
          lbl.textContent = txt;
          dbody.appendChild(lbl);
        };

        // Säljande beskrivning (om produkten har en)
        if (dd && dd.desc) {
          const paras = Array.isArray(dd.desc) ? dd.desc : [dd.desc];
          paras.forEach((txt) => {
            const dp = document.createElement('p');
            dp.textContent = txt;
            dbody.appendChild(dp);
          });
        }

        // Material & detaljer
        const specs = (dd && dd.specs) || (p.material && (p.material[lang] || p.material.sv));
        if (specs && specs.length) {
          addLabel(t('materialLabel'));
          const ul = document.createElement('ul');
          ul.className = 'pc-specs';
          specs.forEach((s) => { const li = document.createElement('li'); li.textContent = s; ul.appendChild(li); });
          dbody.appendChild(ul);
        }

        // Skötselråd (per produkttyp)
        const care = CARE[p.type];
        if (care) {
          addLabel(t('careLabel'));
          const cp = document.createElement('p');
          cp.textContent = care[lang] || care.sv;
          dbody.appendChild(cp);
        }

        // Leveranstid — samma för alla
        addLabel(t('deliveryLabel'));
        const dl = document.createElement('p');
        dl.textContent = t('deliveryTime');
        dbody.appendChild(dl);

        if (dd && dd.fine) {
          const fine = document.createElement('p');
          fine.className = 'pc-fine';
          fine.textContent = dd.fine;
          dbody.appendChild(fine);
        }
        det.appendChild(dbody);
        body.appendChild(det);
      }

      // Add to cart
      const add = document.createElement('button');
      add.className = 'add-btn';
      add.textContent = t('add');
      add.addEventListener('click', () => {
        addToCart(p, sel);
        add.textContent = t('added');
        add.classList.add('added');
        setTimeout(() => { add.textContent = t('add'); add.classList.remove('added'); }, 1300);
      });
      body.appendChild(add);

      card.appendChild(visual);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  /* -----------------------------------------------------
     CART
  ----------------------------------------------------- */
  function variantKey(id, color, size) { return `${id}|${color}|${size || 'one'}`; }

  function addToCart(p, sel) {
    const key = variantKey(p.id, sel.color, sel.size);
    const existing = cart.find((i) => i.key === key);
    if (existing) {
      existing.qty += 1;
    } else {
      // Printful-variantens ID (om produkten har en variants-karta).
      // Nyckel: 'colorKey|SIZE' för kläder, 'colorKey|one' för one-size.
      const variantId = p.variants
        ? (p.variants[`${sel.color}|${sel.size || 'one'}`] || null)
        : null;
      cart.push({
        key, id: p.id, type: p.type, print: p.print,
        name: p.name, price: priceFor(p, sel.size),
        color: sel.color, size: sel.size, qty: 1,
        variant_id: variantId
      });
    }
    saveCart();
    updateCartCount();
    renderCart();
    showToast(t('addedToast'));
  }

  function updateCartCount() {
    const count = cart.reduce((n, i) => n + i.qty, 0);
    const el = document.getElementById('cartCount');
    el.textContent = count;
    el.classList.toggle('show', count > 0);
  }

  function cartTotal() { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
  // Fraktavgift för nuvarande vagn (0 vid tom vagn eller över freeOver-gränsen)
  function shippingCost() {
    if (cart.length === 0) return 0;
    if (CONFIG.shippingFreeOver > 0 && cartTotal() >= CONFIG.shippingFreeOver) return 0;
    return CONFIG.shippingFee || 0;
  }
  function grandTotal() { return cartTotal() + shippingCost(); }

  function renderCart() {
    const body = document.getElementById('cartBody');
    const foot = document.getElementById('cartFoot');
    body.innerHTML = '';

    if (cart.length === 0) {
      body.innerHTML = `<div class="cart-empty">${t('empty')}</div>`;
      foot.style.display = 'none';
      return;
    }
    foot.style.display = 'block';

    cart.forEach((item) => {
      const p = PRODUCTS.find((x) => x.id === item.id);
      const row = document.createElement('div');
      row.className = 'cart-item';

      const vis = document.createElement('div');
      vis.className = 'ci-visual';
      vis.appendChild(garmentMarkup(p || item, item.color));

      const info = document.createElement('div');
      info.className = 'ci-info';
      const variantTxt = cname(item.color) + (item.size ? ' · ' + item.size : '');
      info.innerHTML = `<div class="ci-name">${pname(item)}</div>
        <div class="ci-variant">${variantTxt}</div>
        <div class="ci-price">${item.price} ${CONFIG.currency}</div>`;

      const right = document.createElement('div');
      right.className = 'ci-right';
      const qty = document.createElement('div');
      qty.className = 'qty';
      qty.innerHTML = `<button aria-label="-">−</button><span>${item.qty}</span><button aria-label="+">+</button>`;
      const [minus, , plus] = qty.childNodes;
      minus.addEventListener('click', () => changeQty(item.key, -1));
      plus.addEventListener('click', () => changeQty(item.key, 1));

      const rm = document.createElement('button');
      rm.className = 'ci-remove';
      rm.textContent = t('remove');
      rm.addEventListener('click', () => removeItem(item.key));

      right.appendChild(qty);
      right.appendChild(rm);

      row.appendChild(vis);
      row.appendChild(info);
      row.appendChild(right);
      body.appendChild(row);
    });

    document.getElementById('cartTotalVal').textContent = `${cartTotal()} ${CONFIG.currency}`;
  }

  function changeQty(key, delta) {
    const item = cart.find((i) => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter((i) => i.key !== key);
    saveCart();
    updateCartCount();
    renderCart();
  }
  function removeItem(key) {
    cart = cart.filter((i) => i.key !== key);
    saveCart();
    updateCartCount();
    renderCart();
  }

  /* -----------------------------------------------------
     DRAWER (cart + checkout share one panel)
  ----------------------------------------------------- */
  const overlay = document.getElementById('overlay');
  const drawer = document.getElementById('drawer');
  const cartView = document.getElementById('cartView');
  const checkoutView = document.getElementById('checkoutView');
  const thanksView = document.getElementById('thanksView');

  function openDrawer() {
    showCartView();
    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
  }
  function showCartView() {
    cartView.style.display = 'flex';
    checkoutView.style.display = 'none';
    thanksView.style.display = 'none';
    renderCart();
  }
  function showCheckoutView() {
    if (cart.length === 0) return;
    cartView.style.display = 'none';
    thanksView.style.display = 'none';
    checkoutView.style.display = 'block';
    renderCheckout();
    renderPayMethods();
  }

  /** Visar betalvalen om betalning är aktiverad (annars mejlbeställning). */
  function renderPayMethods() {
    const wrap = document.getElementById('payMethods');
    if (!wrap) return;
    const on = payEnabled();
    wrap.style.display = on ? 'flex' : 'none';
    if (!on) return;

    const cardOpt = wrap.querySelector('[data-pay="card"]');
    const swishOpt = wrap.querySelector('[data-pay="swish"]');
    cardOpt.style.display = CONFIG.payments.card ? '' : 'none';
    swishOpt.style.display = CONFIG.payments.swish ? '' : 'none';

    // Se till att ett tillgängligt alternativ är valt
    const checked = wrap.querySelector('input[name="payMethod"]:checked');
    if (!checked || checked.closest('.pay-option').style.display === 'none') {
      const first = wrap.querySelector('.pay-option:not([style*="none"]) input');
      if (first) first.checked = true;
    }
    document.getElementById('placeOrder').textContent = t('payNow');
  }

  /* -----------------------------------------------------
     CHECKOUT
  ----------------------------------------------------- */
  function renderCheckout() {
    const sum = document.getElementById('orderSummary');
    let rows = '';
    cart.forEach((item) => {
      const variantTxt = cname(item.color) + (item.size ? ' · ' + item.size : '');
      rows += `<div class="os-row">
        <span class="os-item-name">${item.qty}× ${pname(item)} <small>(${variantTxt})</small></span>
        <span>${item.price * item.qty} ${CONFIG.currency}</span>
      </div>`;
    });
    const ship = shippingCost();
    const shipVal = ship > 0 ? `${ship} ${CONFIG.currency}` : t('freeShipping');
    sum.innerHTML = rows +
      `<div class="os-row"><span>${t('subtotal')}</span><span>${cartTotal()} ${CONFIG.currency}</span></div>
       <div class="os-row"><span>${t('shipping')}</span><span>${shipVal}</span></div>
       <div class="os-row total"><span>${t('total')}</span><span>${grandTotal()} ${CONFIG.currency}</span></div>`;
  }

  /* -----------------------------------------------------
     BETALNING — Stripe (kort/Klarna) och Swish
  ----------------------------------------------------- */
  const payApi = () => (CONFIG.payments.apiBase || '').replace(/\/$/, '');
  const payEnabled = () => Boolean(payApi() && (CONFIG.payments.card || CONFIG.payments.swish));

  // Kundvagn i det format servern förväntar sig (utan priser — de räknas på servern)
  function cartPayload() {
    return cart.map((i) => ({ id: i.id, color: i.color, size: i.size, qty: i.qty }));
  }

  function recipientPayload() {
    const get = (id) => (document.getElementById(id).value || '').trim();
    return {
      name: get('coName'),
      email: get('coEmail'),
      phone: get('coPhone'),
      address1: get('coAddress'),
      zip: get('coZip'),
      city: get('coCity'),
      country_code: 'SE',
      notes: get('coNotes')
    };
  }

  function selectedPayMethod() {
    const el = document.querySelector('input[name="payMethod"]:checked');
    return el ? el.value : 'card';
  }

  function setPayBusy(busy, label) {
    const btn = document.getElementById('placeOrder');
    btn.disabled = busy;
    btn.textContent = busy ? (label || t('paying')) : (payEnabled() ? t('payNow') : t('placeOrder'));
  }

  async function payWithCard(recipient) {
    setPayBusy(true);
    try {
      const res = await fetch(`${payApi()}/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartPayload(), recipient, lang })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || t('payError'));
      // Töm vagnen först när Stripe bekräftat i webhooken — men lämna sidan nu
      window.location.href = data.url;
    } catch (err) {
      setPayBusy(false);
      showToast(String(err.message || err));
    }
  }

  async function payWithSwish(recipient) {
    const pending = document.getElementById('swishPending');
    const qrEl = document.getElementById('swishQr');
    const msgEl = document.getElementById('swishMsg');
    const openEl = document.getElementById('swishOpen');
    setPayBusy(true);

    try {
      const res = await fetch(`${payApi()}/swish-create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartPayload(), recipient, phone: recipient.phone })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id) throw new Error(data.error || t('payError'));

      pending.style.display = 'block';
      msgEl.textContent = t('swishWaiting');

      // Mobil: öppna Swish-appen direkt. Dator: visa QR-kod.
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile && data.token) {
        const back = encodeURIComponent(window.location.href);
        openEl.href = `swish://paymentrequest?token=${data.token}&callbackurl=${back}`;
        openEl.style.display = 'inline-block';
        openEl.click();
      } else if (data.qr) {
        qrEl.src = data.qr;
        qrEl.style.display = 'block';
        msgEl.textContent = t('swishScan');
      }

      // Polla status tills betalt / nekat / timeout (~3 min)
      const deadline = Date.now() + 180000;
      const poll = async () => {
        if (Date.now() > deadline) {
          pending.style.display = 'none';
          setPayBusy(false);
          showToast(t('swishTimeout'));
          return;
        }
        let s = {};
        try {
          const r = await fetch(`${payApi()}/swish-complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.id, items: cartPayload(), recipient, lang })
          });
          s = await r.json().catch(() => ({}));
        } catch { /* nätverksglapp — försök igen */ }

        if (s.status === 'PAID') {
          pending.style.display = 'none';
          setPayBusy(false);
          finishPaidOrder();
        } else if (s.status === 'DECLINED' || s.status === 'CANCELLED' || s.status === 'ERROR') {
          pending.style.display = 'none';
          setPayBusy(false);
          showToast(t('swishDeclined'));
        } else {
          setTimeout(poll, 2000);
        }
      };
      setTimeout(poll, 2500);
    } catch (err) {
      pending.style.display = 'none';
      setPayBusy(false);
      showToast(String(err.message || err));
    }
  }

  /** Efter bekräftad betalning: töm vagn och visa tack-vyn. */
  function finishPaidOrder() {
    cart = [];
    saveCart();
    updateCartCount();
    const txt = document.querySelector('#thanksView [data-i18n="thanksText"]');
    if (txt) txt.textContent = t('thanksPaid');
    showThanks();
  }

  function placeOrder() {
    const get = (id) => (document.getElementById(id).value || '').trim();
    const name = get('coName');
    const email = get('coEmail');
    if (!name || !email) { showToast(t('required')); return; }

    // Riktig betalning om den är aktiverad, annars mejlbeställning
    if (payEnabled()) {
      const recipient = recipientPayload();
      if (!recipient.address1 || !recipient.zip || !recipient.city) { showToast(t('required')); return; }
      const method = selectedPayMethod();
      if (method === 'swish' && CONFIG.payments.swish) return payWithSwish(recipient);
      if (CONFIG.payments.card) return payWithCard(recipient);
      return payWithSwish(recipient);
    }

    const lines = cart.map((item) => {
      const variantTxt = cname(item.color) + (item.size ? ' / ' + item.size : '');
      return `- ${item.qty}x ${pname(item)} (${variantTxt}) = ${item.price * item.qty} ${CONFIG.currency}`;
    }).join('\n');

    const bodyText =
`STEP1FILM STORE — ${lang === 'sv' ? 'Ny beställning' : 'New order'}

${lang === 'sv' ? 'Kund' : 'Customer'}: ${name}
${t('email')}: ${email}
${t('phone')}: ${get('coPhone')}
${t('address')}: ${get('coAddress')}, ${get('coZip')} ${get('coCity')}
${t('notes')}: ${get('coNotes')}

${lang === 'sv' ? 'Order' : 'Order'}:
${lines}

${t('subtotal')}: ${cartTotal()} ${CONFIG.currency}
${t('shipping')}: ${shippingCost() > 0 ? `${shippingCost()} ${CONFIG.currency}` : t('freeShipping')}
${t('total')}: ${grandTotal()} ${CONFIG.currency}`;

    const subject = encodeURIComponent(`STEP1FILM Order — ${name} (${grandTotal()} ${CONFIG.currency})`);
    const mailto = `mailto:${CONFIG.contactEmail}?subject=${subject}&body=${encodeURIComponent(bodyText)}`;

    // Open the user's mail client with the pre-filled order
    window.location.href = mailto;

    // Clear the cart, then show confirmation
    cart = [];
    saveCart();
    updateCartCount();
    showThanks();
  }

  function showThanks() {
    cartView.style.display = 'none';
    checkoutView.style.display = 'none';
    thanksView.style.display = 'block';
  }

  /* -----------------------------------------------------
     TOAST
  ----------------------------------------------------- */
  let toastTimer;
  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* -----------------------------------------------------
     LANGUAGE
  ----------------------------------------------------- */
  function applyStaticI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });
    // Category filter labels
    document.querySelectorAll('.cat-filter button').forEach((b) => {
      b.textContent = t(b.dataset.cat);
    });
  }

  function setLang(l) {
    lang = l;
    localStorage.setItem('s1f_lang', l);
    applyStaticI18n();
    renderGrid();
    if (checkoutView.style.display === 'block') renderCheckout();
    else renderCart();
  }

  /* -----------------------------------------------------
     LIGHTBOX / ZOOM — helskärm med förstoring & panorering
  ----------------------------------------------------- */
  let lb, lbImg, lbStage, lbCounter, lbImages = [], lbIndex = 0, lbZoom = false;

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML =
      '<button class="lb-close" aria-label="Stäng">×</button>' +
      '<button class="lb-nav lb-prev" aria-label="Föregående">‹</button>' +
      '<button class="lb-nav lb-next" aria-label="Nästa">›</button>' +
      '<div class="lb-stage"><img class="lb-img" alt=""></div>' +
      '<div class="lb-counter"></div>' +
      '<div class="lb-hint"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector('.lb-img');
    lbStage = lb.querySelector('.lb-stage');
    lbCounter = lb.querySelector('.lb-counter');

    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', (e) => { e.stopPropagation(); lbGo(lbIndex - 1); });
    lb.querySelector('.lb-next').addEventListener('click', (e) => { e.stopPropagation(); lbGo(lbIndex + 1); });
    // Klick på bakgrunden (utanför bild) stänger
    lb.addEventListener('click', (e) => { if (e.target === lb || e.target === lbStage) closeLightbox(); });

    // Dator: rör musen över zoomad bild för att panorera
    lbStage.addEventListener('mousemove', (e) => {
      if (!lbZoom) return;
      setOrigin(e.clientX, e.clientY);
    });
    // Klick på bilden växlar zoom in/ut
    lbImg.addEventListener('click', (e) => {
      e.stopPropagation();
      if (lbZoom) { setZoom(false); } else { setZoom(true); setOrigin(e.clientX, e.clientY); }
    });

    // Mobil: tryck för att växla zoom, dra för att panorera, svajp för att byta bild
    let tX = 0, tY = 0, moved = false;
    lbStage.addEventListener('touchstart', (e) => {
      const t0 = e.changedTouches[0]; tX = t0.clientX; tY = t0.clientY; moved = false;
    }, { passive: true });
    lbStage.addEventListener('touchmove', (e) => {
      const t0 = e.changedTouches[0];
      if (Math.abs(t0.clientX - tX) > 8 || Math.abs(t0.clientY - tY) > 8) moved = true;
      if (lbZoom) setOrigin(t0.clientX, t0.clientY);
    }, { passive: true });
    lbStage.addEventListener('touchend', (e) => {
      const t0 = e.changedTouches[0];
      const dx = t0.clientX - tX;
      if (!lbZoom && moved && Math.abs(dx) > 40) { lbGo(lbIndex + (dx < 0 ? 1 : -1)); return; }
      if (!moved) { // tap
        if (lbZoom) setZoom(false); else { setZoom(true); setOrigin(t0.clientX, t0.clientY); }
      }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lbGo(lbIndex - 1);
      else if (e.key === 'ArrowRight') lbGo(lbIndex + 1);
    });
  }

  function setOrigin(clientX, clientY) {
    const r = lbImg.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - r.top) / r.height) * 100));
    lbImg.style.transformOrigin = x + '% ' + y + '%';
  }
  function setZoom(on) {
    lbZoom = on;
    lbImg.style.transform = on ? 'scale(2.4)' : 'scale(1)';
    lbImg.classList.toggle('zoomed', on);
  }
  function lbGo(n) {
    if (!lbImages.length) return;
    lbIndex = (n + lbImages.length) % lbImages.length;
    setZoom(false);
    lbImg.style.transformOrigin = 'center center';
    lbImg.src = lbImages[lbIndex];
    lbCounter.textContent = (lbIndex + 1) + ' / ' + lbImages.length;
    lb.querySelectorAll('.lb-nav').forEach((el) => { el.style.display = lbImages.length > 1 ? '' : 'none'; });
  }
  function openLightbox(images, index, alt) {
    if (!lb) buildLightbox();
    lbImages = images.slice();
    lbImg.alt = alt || '';
    lb.querySelector('.lb-hint').textContent = t('zoomTip');
    lbGo(index || 0);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove('open');
    setZoom(false);
    if (!drawer.classList.contains('open')) document.body.style.overflow = '';
  }

  /* -----------------------------------------------------
     WIRE UP
  ----------------------------------------------------- */
  function init() {
    buildLightbox();
    // Filter
    document.querySelectorAll('.cat-filter button').forEach((b) => {
      b.addEventListener('click', () => {
        filter = b.dataset.cat;
        document.querySelectorAll('.cat-filter button').forEach((x) => x.classList.remove('active'));
        b.classList.add('active');
        renderGrid();
      });
    });

    // Language
    document.querySelectorAll('.lang-toggle button').forEach((b) => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    // Cart open/close
    document.getElementById('cartOpen').addEventListener('click', openDrawer);
    ['cartClose', 'cartClose2', 'cartClose3'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', closeDrawer);
    });
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    // Cart -> checkout navigation
    document.getElementById('toCheckout').addEventListener('click', showCheckoutView);
    document.getElementById('keepShopping').addEventListener('click', closeDrawer);
    document.getElementById('backToCart').addEventListener('click', showCartView);
    document.getElementById('placeOrder').addEventListener('click', placeOrder);
    document.getElementById('thanksDone').addEventListener('click', closeDrawer);

    applyStaticI18n();
    renderGrid();
    renderCart();
    updateCartCount();
    handlePaymentReturn();
  }

  /** Kunden kommer tillbaka från Stripe: ?order=ok | ?order=cancelled */
  function handlePaymentReturn() {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('order');
    if (!status) return;

    // Städa URL:en så statusen inte ligger kvar vid omladdning
    window.history.replaceState({}, '', window.location.pathname);

    if (status === 'ok') {
      finishPaidOrder();
      overlay.classList.add('open');
      drawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else if (status === 'cancelled') {
      showToast(t('swishDeclined'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
