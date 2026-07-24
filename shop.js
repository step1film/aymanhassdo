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
    contactEmail: 'step1film@gmail.com',
    // Swish number is shown at checkout as info only for now.
    // Leave empty to hide until you have a business number.
    swishNumber: '',

    /* ---------------------------------------------------
       PRINTFUL (print-on-demand) — se PRINTFUL_SETUP.md
       ---------------------------------------------------
       Så länge apiBase är tomt / enabled = false körs butiken
       precis som idag (SVG-mockuper + mejlbeställning).
       Sätt apiBase till din funktions-URL och enabled: true
       när dina Printful-produkter och backend är på plats.
         Netlify:          '/.netlify/functions'  (eller '/api')
    --------------------------------------------------- */
    printful: {
      apiBase: '',
      enabled: false
    }
  };

  // Exponera konfigurationen så printful.js kan läsa den.
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
    natural:  { hex: '#e9e0c9', sv: 'Naturvit', en: 'Natural',  light: true  },
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
      name: { sv: 'REEL MUGG', en: 'REEL MUG' },
      desc: { sv: 'Svart glansig mugg, 15 oz. Rosa filmrulle-tryck. Fri frakt.', en: 'Black glossy mug, 15 oz. Pink film-reel print. Free shipping.' },
      price: 229,
      freeShipping: true,
      colors: ['black'],
      sizes: null,
      image: 'assets/products/reel-mugg.png',
      gallery: [
        'assets/products/reel-mugg.png',
        'assets/products/reel-mugg-2.png',
        'assets/products/reel-mugg-lifestyle.png'
      ]
    },
    {
      id: 'awesome-mugg', cat: 'mugs', type: 'mug', print: 'AWE',
      name: { sv: 'AWESOME MUGG', en: 'AWESOME MUG' },
      desc: { sv: 'Vit glansig mugg. Rosa pixel-tryck "I\'m Awesome". Fri frakt.', en: 'White glossy mug. Pink pixel print "I\'m Awesome". Free shipping.' },
      price: 229,
      freeShipping: true,
      colors: ['white'],
      sizes: null,
      image: 'assets/products/awesome-mugg-stacked.png',
      // Basbild (utan siffra) först, sedan 01, 02, 03, 04, 05
      gallery: [
        'assets/products/awesome-mugg-stacked.png',
        'assets/products/awesome-mugg-hands.png',
        'assets/products/awesome-mugg.png',
        'assets/products/awesome-mugg-model.png',
        'assets/products/awesome-mugg-holiday.png',
        'assets/products/awesome-mugg-box.png'
      ]
    },
    {
      id: 'take-one-sleeve', cat: 'accessories', type: 'sleeve', print: 'S1F',
      name: { sv: 'TAKE ONE SLEEVE', en: 'TAKE ONE SLEEVE' },
      desc: { sv: 'Laptop-fodral i pastellregnbåge, "Take One". Vadderat med dragkedja. Fri frakt.', en: 'Pastel-rainbow laptop sleeve, "Take One". Padded, zippered. Free shipping.' },
      price: 499,
      sizePrices: { '13"': 499, '15"': 599 },
      freeShipping: true,
      colors: ['pastel'],
      sizes: ['13"', '15"'], defaultSize: '13"',
      image: 'assets/products/take-one-sleeve.png',
      gallery: [
        'assets/products/take-one-sleeve.png',
        'assets/products/take-one-sleeve-1.png',
        'assets/products/take-one-sleeve-2.png',
        'assets/products/take-one-sleeve-4.png'
      ]
    },
    {
      id: 'rolling-backpack', cat: 'accessories', type: 'backpack', print: 'S1F',
      name: { sv: 'ROLLING BACKPACK', en: 'ROLLING BACKPACK' },
      desc: { sv: 'Ryggsäck med kamera-tryck "Rolling". Vadderad laptopficka. Välj färg. Fri frakt.', en: 'Backpack with camera print "Rolling". Padded laptop pocket. Pick a colour. Free shipping.' },
      price: 699,
      freeShipping: true,
      colors: ['pink', 'navy'],
      sizes: null,
      image: 'assets/products/backpack-pink.png',
      // Egen bild per färg i kundvagnen
      images: {
        pink: 'assets/products/backpack-pink.png',
        navy: 'assets/products/backpack-navy.png'
      },
      // Eget bildspel per färg på produktkortet
      galleries: {
        pink: [
          'assets/products/backpack-pink.png',
          'assets/products/backpack-pink-1.png',
          'assets/products/backpack-pink-3.png',
          'assets/products/backpack-pink-4.png',
          'assets/products/backpack-pink-5.png',
          'assets/products/backpack-pink-6.png',
          'assets/products/backpack-pink-7.png',
          'assets/products/backpack-pink-8.png',
          'assets/products/backpack-pink-9.png'
        ],
        navy: [
          'assets/products/backpack-navy.png',
          'assets/products/backpack-navy-1.png',
          'assets/products/backpack-navy-2.png',
          'assets/products/backpack-navy-3.png',
          'assets/products/backpack-navy-4.png',
          'assets/products/backpack-navy-5.png',
          'assets/products/backpack-navy-6.png',
          'assets/products/backpack-navy-7.png',
          'assets/products/backpack-navy-8.png',
          'assets/products/backpack-navy-9.png'
        ]
      }
    },

    {
      id: 'spoiler-hoodie', cat: 'clothing', type: 'hoodie', print: 'S1F',
      name: { sv: 'SPOILER HOODIE', en: 'SPOILER HOODIE' },
      desc: { sv: 'Unisex-hoodie: "Jag är expert på att spoila filmer". Borstad insida. Välj färg. Fri frakt.', en: 'Unisex hoodie: "Expert at spoiling films". Brushed inside. Pick a colour. Free shipping.' },
      price: 629,
      freeShipping: true,
      colors: ['natural', 'lightpink', 'white'],
      sizes: SIZES, defaultSize: 'M',
      image: 'assets/products/hoodie-natural.png',
      images: {
        natural: 'assets/products/hoodie-natural.png',
        lightpink: 'assets/products/hoodie-pink.png',
        white: 'assets/products/hoodie-white.png'
      },
      galleries: {
        natural: [
          'assets/products/hoodie-natural.png',
          'assets/products/hoodie-natural-1.png',
          'assets/products/hoodie-natural-2.png',
          'assets/products/hoodie-natural-3.png',
          'assets/products/hoodie-natural-4.png'
        ],
        lightpink: [
          'assets/products/hoodie-pink.png',
          'assets/products/hoodie-pink-1.png',
          'assets/products/hoodie-pink-3.png',
          'assets/products/hoodie-pink-4.png'
        ],
        white: [
          'assets/products/hoodie-white.png',
          'assets/products/hoodie-white-1.png',
          'assets/products/hoodie-white-2.png',
          'assets/products/hoodie-white-3.png',
          'assets/products/hoodie-white-5.png'
        ]
      }
    },

    {
      id: '24fps-hoodie', cat: 'clothing', type: 'hoodie', print: '24',
      name: { sv: '24FPS HOODIE', en: '24FPS HOODIE' },
      desc: { sv: 'Svart unisex-hoodie: "Living life at 24fps" (ryggtryck) + ärmtryck. Fri frakt.', en: 'Black unisex hoodie: "Living life at 24fps" back print + sleeve print. Free shipping.' },
      price: 699,
      freeShipping: true,
      colors: ['black'],
      sizes: SIZES, defaultSize: 'M',
      image: 'assets/products/hoodie-24fps.png',
      gallery: [
        'assets/products/hoodie-24fps.png',
        'assets/products/hoodie-24fps-1.png',
        'assets/products/hoodie-24fps-2.png',
        'assets/products/hoodie-24fps-3.png',
        'assets/products/hoodie-24fps-5.png',
        'assets/products/hoodie-24fps-6.png',
        'assets/products/hoodie-24fps-7.png'
      ]
    },

    /* ===== MOCKUPER (byts ut mot riktiga produkter efterhand) ===== */
    {
      id: 'tee-classic', cat: 'clothing', type: 'tee', print: 'S1F',
      name: { sv: 'STEP1FILM Tee', en: 'STEP1FILM Tee' },
      desc: { sv: 'Tung 220g ekologisk bomull. Screentryckt logga.', en: 'Heavy 220g organic cotton. Screen-printed logo.' },
      price: 249,
      colors: ['black', 'white', 'sand', 'forest'],
      sizes: SIZES, defaultSize: 'M'
    },
    {
      id: 'hoodie-director', cat: 'clothing', type: 'hoodie', print: 'DIR',
      name: { sv: 'Director-Hoodie', en: "Director's Hoodie" },
      desc: { sv: 'Borstad insida, dubbellager huva, känguruficka.', en: 'Brushed inside, double-layer hood, kangaroo pocket.' },
      price: 549,
      colors: ['black', 'charcoal', 'bone'],
      sizes: SIZES, defaultSize: 'M'
    },
    {
      id: 'tee-crew', cat: 'clothing', type: 'tee', print: 'CREW',
      name: { sv: 'Crew Tee', en: 'Crew Tee' },
      desc: { sv: 'Ryggtryck "CREW". Perfekt på inspelning.', en: 'Back print "CREW". Perfect on set.' },
      price: 259,
      colors: ['black', 'forest', 'sand'],
      sizes: SIZES, defaultSize: 'L'
    },
    {
      id: 'cap-clapper', cat: 'caps', type: 'cap', print: 'S1F',
      name: { sv: 'Clapperboard-Keps', en: 'Clapperboard Cap' },
      desc: { sv: 'Broderad logga, justerbar spänne. One size.', en: 'Embroidered logo, adjustable strap. One size.' },
      price: 299,
      colors: ['black', 'stone', 'red'],
      sizes: null
    },
    {
      id: 'cap-dad', cat: 'caps', type: 'cap', print: 'ACT',
      name: { sv: 'Action Dad Cap', en: 'Action Dad Cap' },
      desc: { sv: 'Mjuk oformad kupa, buren look. One size.', en: 'Soft unstructured crown, worn-in look. One size.' },
      price: 279,
      colors: ['charcoal', 'sand', 'black'],
      sizes: null
    },
    {
      id: 'mug-cut', cat: 'mugs', type: 'mug', print: 'CUT',
      name: { sv: 'Coffee & Cut Mugg', en: 'Coffee & Cut Mug' },
      desc: { sv: '350 ml keramik. Tål maskindisk.', en: '350 ml ceramic. Dishwasher safe.' },
      price: 149,
      colors: ['black', 'white'],
      sizes: null
    },
    {
      id: 'mug-roll', cat: 'mugs', type: 'mug', print: 'S1F',
      name: { sv: 'Roll Sound Mugg', en: 'Roll Sound Mug' },
      desc: { sv: 'Emalj-look, 300 ml. Robust för fältbruk.', en: 'Enamel look, 300 ml. Rugged for field use.' },
      price: 169,
      colors: ['white', 'red', 'black'],
      sizes: null
    }

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
     i18n
  ----------------------------------------------------- */
  const I18N = {
    sv: {
      tagline: 'MERCH & PRINT',
      heroTitle: 'STEP1FILM STORE',
      heroText: 'Du blir garanterat lite mer kreativ med en Step1Film på dig. 🙂 Välj färg, storlek och lägg i vagnen.',
      all: 'Allt', clothing: 'Kläder', caps: 'Kepsar', mugs: 'Muggar', accessories: 'Tillbehör',
      colorLabel: 'Färg', sizeLabel: 'Storlek', oneSize: 'One size',
      add: 'Lägg i vagn', added: 'Tillagd ✓',
      cart: 'Vagn', cartTitle: 'Din vagn', empty: 'Din vagn är tom.',
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
      addedToast: 'Tillagd i vagnen'
    },
    en: {
      tagline: 'MERCH & PRINT',
      heroTitle: 'STEP1FILM STORE',
      heroText: "You're guaranteed to get a little more creative wearing a Step1Film. 🙂 Pick a colour, a size and add to cart.",
      all: 'All', clothing: 'Clothing', caps: 'Caps', mugs: 'Mugs', accessories: 'Accessories',
      colorLabel: 'Colour', sizeLabel: 'Size', oneSize: 'One size',
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
      addedToast: 'Added to cart'
    }
  };

  /* -----------------------------------------------------
     STATE
  ----------------------------------------------------- */
  let lang = localStorage.getItem('s1f_lang') || 'sv';
  let filter = 'all';
  let cart = loadCart();
  // Per-card selected variant (colour + size), keyed by product id
  const selection = {};

  const t = (k) => (I18N[lang][k] || k);
  const cname = (key) => COLORS[key][lang];
  // Pris för en produkt givet vald storlek (stöder olika pris per storlek)
  const priceFor = (p, size) => (p.sizePrices && size && p.sizePrices[size] != null) ? p.sizePrices[size] : p.price;

  function loadCart() {
    try { return JSON.parse(localStorage.getItem('s1f_cart')) || []; }
    catch (e) { return []; }
  }
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
        img.addEventListener('error', () => { s.innerHTML = SVG[p.type] ? SVG[p.type](p.print) : ''; });
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

    // Ingen auto-växling — kunden bläddrar själv med pilar/punkter.
    let idx = 0;
    const dotWrap = document.createElement('div');
    dotWrap.className = 'pc-dots';
    const dots = slideEls.map((_, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'pc-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', `${p.name[lang]} — ${i + 1}`);
      d.addEventListener('click', (e) => { e.stopPropagation(); go(i); });
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
      b.addEventListener('click', (e) => { e.stopPropagation(); go(idx + dir); });
      return b;
    };
    visual.appendChild(mkNav('pc-prev', '&#8249;', -1, 'Föregående bild'));
    visual.appendChild(mkNav('pc-next', '&#8250;', 1, 'Nästa bild'));
    visual.appendChild(dotWrap);
    visual.onmouseenter = null;
    visual.onmouseleave = null;
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
      info.innerHTML = `<div class="ci-name">${item.name[lang]}</div>
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
        <span class="os-item-name">${item.qty}× ${item.name[lang]} <small>(${variantTxt})</small></span>
        <span>${item.price * item.qty} ${CONFIG.currency}</span>
      </div>`;
    });
    const allFree = cart.length > 0 && cart.every((i) => {
      const p = PRODUCTS.find((x) => x.id === i.id);
      return p && p.freeShipping;
    });
    const shipVal = allFree ? t('freeShipping') : t('shippingCalc');
    sum.innerHTML = rows +
      `<div class="os-row"><span>${t('shipping')}</span><span>${shipVal}</span></div>
       <div class="os-row total"><span>${t('total')}</span><span>${cartTotal()} ${CONFIG.currency}</span></div>`;
  }

  function placeOrder() {
    const get = (id) => (document.getElementById(id).value || '').trim();
    const name = get('coName');
    const email = get('coEmail');
    if (!name || !email) { showToast(t('required')); return; }

    const lines = cart.map((item) => {
      const variantTxt = cname(item.color) + (item.size ? ' / ' + item.size : '');
      return `- ${item.qty}x ${item.name[lang]} (${variantTxt}) = ${item.price * item.qty} ${CONFIG.currency}`;
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

${t('total')}: ${cartTotal()} ${CONFIG.currency}`;

    const subject = encodeURIComponent(`STEP1FILM Order — ${name} (${cartTotal()} ${CONFIG.currency})`);
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
     WIRE UP
  ----------------------------------------------------- */
  function init() {
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
