/* =====================================================
   STEP1 STORE — språk på villkorssidorna
   =====================================================
   Svenskan står i HTML-filerna och är den version som
   gäller rättsligt. Här ligger bara den engelska
   översättningen. Vid språkbyte byts innehållet ut;
   vid byte tillbaka återställs originalet, som sparas
   när sidan laddas. Saknas en nyckel blir texten kvar
   på svenska i stället för att försvinna.

   Delar nyckeln 's1f_lang' med shop.js och i18n.js,
   så språkvalet följer besökaren genom hela sajten.
   ===================================================== */
(function () {
  'use strict';

  const EN = {
    /* ---------- Gemensamt ---------- */
    navKv: 'Terms of purchase',
    navRa: 'Returns & right of withdrawal',
    navFl: 'Shipping & delivery',
    navIp: 'Privacy policy',
    toShop: 'To the shop',
    homeAria: 'STEP1FILM — home',
    updated: 'Last updated: ',
    govern: 'This is a translation. In the event of any discrepancy, the Swedish version applies.',

    /* ---------- Köpvillkor ---------- */
    kv1: 'Terms of purchase',
    kv2: 'The terms below apply when you shop as a consumer in STEP1 STORE.',
    kv3: 'Seller',
    kv4: 'Company',
    kv5: 'Company registration number',
    kv6: 'VAT number',
    kv7: 'Tax',
    kv8: 'Approved for Swedish F-tax',
    kv9: 'Address',
    kv10: 'Email',
    kv12: 'Website',
    kv13: 'Prices and VAT',
    kv14: 'All prices are shown in Swedish kronor (SEK) and <strong>include VAT</strong>. Shipping is added and is always shown before you complete your purchase. The total amount you pay is stated clearly at checkout.',
    kv15: 'Orders and the contract',
    kv16: 'The contract becomes binding once we have confirmed your order. You will receive an order confirmation by email to the address you provided. Please check that the details are correct — contact <a href="mailto:shop@step1film.se">shop@step1film.se</a> straight away if something is wrong.',
    kv17: 'We reserve the right to refuse or cancel an order in the event of an obvious pricing or typing error, if a product has been discontinued, or if we cannot verify the details you have given. If payment has already been made, the full amount is refunded.',
    kv18: 'Payment',
    kv19: 'You can pay by:',
    kv20: '<strong>Swish</strong>',
    kv21: '<strong>Card</strong> (Visa, Mastercard)',
    kv22: '<strong>Klarna</strong>',
    kv23: 'Card and Klarna payments are handled by Stripe. We never store your card details. Klarna’s own terms also apply when paying with Klarna.',
    kv24: 'Delivery',
    kv25: 'Products are printed to order. Normal delivery time is <strong>5–10 working days</strong>. See <a href="frakt-leverans.html">Shipping &amp; delivery</a> for full details.',
    kv26: 'Right of withdrawal',
    kv27: 'As a consumer you have a <strong>14-day right of withdrawal</strong> under the Swedish Distance and Off-Premises Contracts Act (2005:59). Read more at <a href="retur-angerratt.html">Returns &amp; right of withdrawal</a>.',
    kv28: 'Complaints',
    kv29: 'If the item is faulty or damaged, you have the right to complain for up to <strong>three years</strong> under the Swedish Consumer Sales Act (2022:260). A complaint must be made within a reasonable time of discovering the fault — within two months is always considered timely.',
    kv30: 'Contact us at <a href="mailto:shop@step1film.se">shop@step1film.se</a> and please attach a photo of the fault together with your order number. If the complaint is upheld we pay the return shipping and you get the item replaced or your money back.',
    kv31: 'If we cannot agree',
    kv32: 'We follow the recommendations of the Swedish National Board for Consumer Disputes (ARN). If you are not satisfied with how we have handled your case, you can turn to:',
    kv33: '<strong>The National Board for Consumer Disputes (ARN)</strong> — Box 174, 101 23 Stockholm, Sweden, <a href="https://www.arn.se" target="_blank" rel="noopener">arn.se</a>',
    kv34: '<strong>The European Commission’s online dispute resolution platform</strong> — <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener">ec.europa.eu/consumers/odr</a>',
    kv35: 'Swedish law applies to the contract.',
    kv36: 'Force majeure',
    kv37: 'We are not liable for delays caused by circumstances beyond our control, such as industrial action, decisions by public authorities, disruption at a supplier or carrier, or natural events.',

    /* ---------- Retur & ångerrätt ---------- */
    ra1: 'Returns & right of withdrawal',
    ra2: 'How to withdraw from a purchase or return an item from STEP1 STORE.',
    ra3: '14-day right of withdrawal',
    ra4: 'You have the right to withdraw from your purchase within <strong>14 days</strong> without giving any reason. The withdrawal period starts on the day you (or someone you have appointed) receive the item. If the order consists of several items delivered separately, the period runs from the day you received the last item.',
    ra5: 'The right of withdrawal follows the Swedish Distance and Off-Premises Contracts Act (2005:59).',
    ra6: 'How to do it',
    ra7: 'Tell us <strong>before the withdrawal period expires</strong> that you want to withdraw. Email <a href="mailto:shop@step1film.se">shop@step1film.se</a> with your order number. You can also use the Swedish Consumer Agency’s <a href="https://www.konsumentverket.se/for-konsument/dina-rattigheter-som-konsument/angerratt/" target="_blank" rel="noopener">standard withdrawal form</a>.',
    ra8: 'We reply with the return address and instructions.',
    ra9: 'Send the item back <strong>within 14 days</strong> of telling us.',
    ra10: 'Return shipping',
    ra11: '<strong>You pay the return shipping</strong> when exercising the right of withdrawal. Always keep your proof of postage — you are responsible for the item until it reaches us.',
    ra12: 'For a <strong>complaint</strong> (faulty or damaged item) we pay the return shipping instead.',
    ra13: 'Condition of the item',
    ra14: 'You may examine the item to the extent necessary to assess its characteristics and function — roughly as you could have done in a physical shop. If the item has been handled more than that, we may make a <strong>deduction for reduced value</strong> from the refund.',
    ra15: 'Please return the item in its original packaging, unused and unwashed.',
    ra16: 'Refunds',
    ra17: 'We refund the full amount, including the standard delivery cost, <strong>within 14 days</strong> of receiving your notice of withdrawal. We may, however, withhold the refund until we have received the item back, or until you have shown that it has been sent.',
    ra18: 'If you chose a more expensive delivery option than our standard one, we only refund the cost of standard delivery. Refunds are made using the same payment method you used for the purchase.',
    ra19: 'Exceptions to the right of withdrawal',
    ra20: 'The right of withdrawal does <strong>not</strong> apply to goods made to your own specifications or clearly personalised — for example a print carrying your own name or your own picture.',
    ra21: 'Our products are indeed printed to order, but the designs are our own standard choices and colour and size are picked from fixed options in the shop. <strong>You therefore have a full right of withdrawal on everything we sell today.</strong>',

    /* ---------- Frakt & leverans ---------- */
    fl1: 'Shipping & delivery',
    fl2: 'Delivery times, shipping cost and how we send your orders.',
    fl3: 'Shipping cost',
    fl4: 'Standard shipping',
    fl5: 'SEK 79',
    fl6: 'Free shipping',
    fl7: 'On orders from SEK 1,200',
    fl8: 'The shipping cost is always shown at checkout before you pay. The free-shipping threshold is calculated on the total price of the items, before shipping.',
    fl9: 'Delivery time',
    fl10: 'All products are <strong>printed to order</strong> — nothing sits in a warehouse. That means every garment is made just for you, but also that it takes a few extra days.',
    fl11: 'Production',
    fl12: '2–5 working days',
    fl13: 'Transport',
    fl14: '3–5 working days',
    fl15: 'Normal total',
    fl16: '<strong>5–10 working days</strong>',
    fl17: 'During peak season (e.g. November–December) it can take longer. If delivery is significantly delayed you have the right to cancel the purchase.',
    fl18: 'Delivery area',
    fl19: 'We deliver to addresses in <strong>Sweden</strong>. If you want to order to another country, email <a href="mailto:shop@step1film.se">shop@step1film.se</a> and we will come back to you with price and delivery time.',
    fl20: 'The products are made and shipped by our production partner Printful from their facilities within the EU. No customs charges apply for delivery within the EU.',
    fl21: 'Tracking',
    fl22: 'When your order leaves the print shop you receive an email with tracking information. If you have not received anything within 10 working days — get in touch and we will sort it out.',
    fl23: 'Damaged or lost parcels',
    fl24: 'If the parcel is damaged on delivery, report it to the carrier immediately and contact us. If the parcel is lost in transit we send a replacement or refund the full amount.',
    fl25: 'Uncollected parcels that are returned to us are charged at the actual shipping and return cost.',

    /* ---------- Integritetspolicy ---------- */
    ip1: 'Privacy policy',
    ip2: 'How STEP1 STORE processes your personal data under the GDPR.',
    ip3: 'Data controller',
    ip4: 'Company',
    ip5: 'Address',
    ip6: 'Email',
    ip8: 'What data we collect',
    ip9: '<strong>Contact and delivery details:</strong> name, email address, telephone number, street address, postcode and town.',
    ip10: '<strong>Order details:</strong> what you bought, the amount, order number and payment method.',
    ip11: '<strong>Technical information:</strong> data needed for the site to work, such as your language setting and the contents of your cart.',
    ip12: 'We never collect more data than is needed to complete your purchase, and we never store your card details.',
    ip13: 'Why — and on what legal basis',
    ip14: 'Completing your purchase and delivering the item',
    ip15: 'Performance of a contract (Art. 6(1)(b) GDPR)',
    ip16: 'Handling returns, complaints and customer service',
    ip17: 'Performance of a contract and legal obligation (Art. 6(1)(b) and (c))',
    ip18: 'Keeping accounting records',
    ip19: 'Legal obligation — the Swedish Accounting Act (Art. 6(1)(c))',
    ip20: 'Who we share the data with',
    ip21: 'We never sell your data on. To be able to deliver your order we share the necessary details with:',
    ip22: '<strong>Printful</strong> — printing and delivery (name and delivery address).',
    ip23: '<strong>Stripe</strong> — card and Klarna payments.',
    ip24: '<strong>Swish / Getswish AB</strong> — Swish payments.',
    ip25: '<strong>Netlify</strong> — hosting of the website.',
    ip26: '<strong>Our accountant and the Swedish Tax Agency</strong> — where required by law.',
    ip27: 'Some of these providers may process data outside the EU/EEA. Such transfers are then made with safeguards such as the European Commission’s standard contractual clauses.',
    ip28: 'How long we keep the data',
    ip29: 'Order data that constitutes accounting records is kept for <strong>seven years</strong> under the Swedish Accounting Act. Other data is deleted once it is no longer needed for its purpose.',
    ip30: 'Cookies and storage in your browser',
    ip31: 'The shop uses <strong>no tracking or marketing cookies</strong>. We only store your cart and your language choice locally in your own browser (localStorage) so the site works. That information is not sent to us and you can clear it whenever you like via your browser settings.',
    ip32: 'Your rights',
    ip33: 'You have the right to:',
    ip34: 'find out what data we hold about you (a copy of your record),',
    ip35: 'have incorrect data corrected,',
    ip36: 'have data erased, where we are not obliged to keep it,',
    ip37: 'request that processing be restricted,',
    ip38: 'object to the processing,',
    ip39: 'receive your data in a machine-readable format (data portability).',
    ip40: 'Contact <a href="mailto:info@step1film.se">info@step1film.se</a> and we will help you. If you are unhappy with how we process your personal data you can complain to the <strong>Swedish Authority for Privacy Protection (IMY)</strong>, <a href="https://www.imy.se" target="_blank" rel="noopener">imy.se</a>.'
  };

  let lang = localStorage.getItem('s1f_lang');
  if (lang !== 'sv' && lang !== 'en') lang = 'sv';

  // Svenskan i sidan är originalet — spara den innan något byts ut
  const SV = new Map();

  function apply() {
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-t]').forEach(el => {
      const key = el.getAttribute('data-t');
      if (!SV.has(el)) SV.set(el, el.innerHTML);
      el.innerHTML = (lang === 'en' && key in EN) ? EN[key] : SV.get(el);
    });

    // Navigering, sidhuvud och sidfot
    const map = {
      'kopvillkor.html': 'navKv',
      'retur-angerratt.html': 'navRa',
      'frakt-leverans.html': 'navFl',
      'integritetspolicy.html': 'navIp'
    };
    document.querySelectorAll('.legal-nav a, .foot-links a').forEach(a => {
      const key = map[(a.getAttribute('href') || '').split('/').pop()];
      if (!key) return;
      if (!SV.has(a)) SV.set(a, a.innerHTML);
      a.innerHTML = (lang === 'en') ? EN[key] : SV.get(a);
    });
    const shopLink = document.querySelector('.shop-header .header-link');
    if (shopLink) {
      if (!SV.has(shopLink)) SV.set(shopLink, shopLink.innerHTML);
      shopLink.innerHTML = (lang === 'en') ? EN.toShop : SV.get(shopLink);
    }

    // "Senast uppdaterad" — datumet står kvar, bara etiketten byts
    const upd = document.querySelector('.legal-updated');
    if (upd) {
      if (!SV.has(upd)) SV.set(upd, upd.innerHTML);
      upd.innerHTML = (lang === 'en')
        ? EN.updated + upd.innerHTML.replace(/^[^:]*:\s*/, '')
        : SV.get(upd);
    }

    // Villkor på ett annat språk än avtalsspråket måste vara tydligt märkta
    let note = document.querySelector('.legal-langnote');
    if (lang === 'en') {
      if (!note) {
        note = document.createElement('p');
        note.className = 'legal-langnote';
        note.textContent = EN.govern;
        const intro = document.querySelector('.legal-intro');
        if (intro && intro.parentNode) intro.parentNode.insertBefore(note, intro.nextSibling);
      }
    } else if (note) {
      note.remove();
    }

    document.querySelectorAll('.lang-toggle button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function init() {
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => {
        if (b.dataset.lang !== 'sv' && b.dataset.lang !== 'en') return;
        lang = b.dataset.lang;
        localStorage.setItem('s1f_lang', lang);
        apply();
      });
    });
    apply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
