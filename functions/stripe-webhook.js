/* =====================================================
   STEP1 STORE — Stripe webhook
   =====================================================
   Stripe anropar den här när betalningen är klar. Först då
   skapas ordern hos Printful (aldrig från webbläsaren, så
   ingen kan trigga tryck utan att ha betalat).

   Miljövariabler:
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET  – whsec_… (från Stripe Dashboard)

   OBS: signaturen måste verifieras mot RÅ body — därför
   läses event.body som text och Netlify måste inte parsa den.
   ===================================================== */
'use strict';

const Stripe = require('stripe');
const { priceCart, SHIP_COUNTRIES } = require('./_lib/catalog');
const { rimligFrakt, MAX_SEK } = require('./_lib/shipping');
const { fulfilOrder } = require('./_lib/fulfil');

/* Stripe kan skicka samma händelse mer än en gång — vid omförsök, och
   i sällsynta fall två gånger direkt. Vi svarar alltid 200, så
   omförsöken är få, men en dubblett skulle annars bli en andra
   Printful-order på samma betalning. Setet lever så länge
   funktionsinstansen gör; för skarp drift hör det hemma i en KV-store,
   se PAYMENTS_SETUP.md.

   Nyckeln är SESSIONENS id, inte händelsens: samma köp kan komma in
   som två olika händelser (completed och async_payment_succeeded för
   betalsätt som bekräftas i efterhand). Två händelse-id:n hade sett
   olika ut och blivit två ordrar — sessions-id:t är samma köp. */
const handledSessions = new Set();

/* checkout.session.completed  – betalt direkt (kort, Klarna, Swish)
   async_payment_succeeded     – betalsätt som bekräftas i efterhand
   async_payment_failed        – samma sak, men betalningen gick inte igenom */
const PAID_EVENTS = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const key = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whsec) return { statusCode: 500, body: 'Stripe-nycklar saknas.' };

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body, 'utf8');

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(raw, event.headers['stripe-signature'], whsec);
  } catch (err) {
    console.warn('[stripe-webhook] Ogiltig signatur:', String(err.message || err));
    return { statusCode: 400, body: 'Ogiltig signatur' };
  }

  if (stripeEvent.type === 'checkout.session.async_payment_failed') {
    const s = stripeEvent.data.object;
    console.warn(`[stripe-webhook] Betalningen misslyckades för session ${s.id} `
      + `(order ${(s.metadata && s.metadata.reference) || '—'}). Ingen order lagd.`);
    return { statusCode: 200, body: 'ok (betalning misslyckades)' };
  }

  if (!PAID_EVENTS.includes(stripeEvent.type)) {
    return { statusCode: 200, body: 'ignored' };
  }

  const session = stripeEvent.data.object;

  if (handledSessions.has(session.id)) {
    return { statusCode: 200, body: 'ok (redan hanterad)' };
  }

  /* Betalsätt som bekräftas i efterhand kommer hit som 'unpaid'. Då
     händer ingenting nu — async_payment_succeeded kommer när pengarna
     är på plats, och först då skapas ordern. */
  if (session.payment_status !== 'paid') {
    console.log('[stripe-webhook] Session ej betald ännu:', session.id, session.payment_status);
    return { statusCode: 200, body: 'not paid' };
  }

  try {
    const md = session.metadata || {};
    const recipient = JSON.parse(md.recipient || '{}');
    const compact = JSON.parse(md.lines || '[]'); // [[id, color, size, qty], …]

    // Räkna om priserna på servern igen — metadata är bara referens.
    let cart = priceCart(compact.map(([id, color, size, qty]) => ({ id, color, size, qty })));

    /* Kontrollera att kunden betalat det ordern kostar.
       -----------------------------------------------------
       VARORNA är facit: summan räknas om ur katalogen, precis som
       när sessionen skapades. FRAKTEN kan däremot inte jämföras mot
       ett fast tal längre — den hämtas live från Printful och kan ha
       ändrats mellan kassan och den här webhooken. Att räkna om den
       här hade gett falsklarm på fullt korrekta ordrar.

       I stället kontrolleras skillnaden: det kunden betalade minus
       varorna ska vara en frakt i ett rimligt spann. Blir den negativ
       har kunden betalat för lite för varorna, och det är det farliga
       fallet. Blir den för stor är något fel oavsett vad. Kunden HAR
       betalat, så vi svarar 200 och lägger ordern för hand. */
    const paidOre = Number(session.amount_total);
    const betaltKr = paidOre / 100;
    const fraktKr = Math.round((betaltKr - cart.subtotal) * 100) / 100;

    if (!Number.isFinite(paidOre) || !rimligFrakt(fraktKr)) {
      console.warn(`[stripe-webhook] ⚠️ MANUELL HANTERING: order ${md.reference} betalades `
        + `med ${betaltKr} kr. Varorna kostar ${cart.subtotal} kr enligt katalogen, vilket ger `
        + `${fraktKr} kr i frakt — utanför spannet 0–${MAX_SEK} kr. `
        + `Ingen Printful-order lagd — kontrollera priset och lägg ordern för hand `
        + `eller återbetala mellanskillnaden.`);
      handledSessions.add(session.id);
      return { statusCode: 200, body: 'ok (beloppet stämmer inte, manuell hantering)' };
    }

    // Frakten kunden faktiskt betalade är den som ska stå på kvittot.
    cart = priceCart(compact.map(([id, color, size, qty]) => ({ id, color, size, qty })), { shipping: fraktKr });

    // Stripe kan ha samlat in en annan leveransadress — den vinner.
    const sd = session.shipping_details || session.customer_details;
    if (sd && sd.address && sd.address.line1) {
      recipient.name = sd.name || recipient.name;
      recipient.address1 = sd.address.line1;
      recipient.address2 = sd.address.line2 || '';
      recipient.city = sd.address.city || recipient.city;
      recipient.zip = sd.address.postal_code || recipient.zip;
      recipient.country_code = sd.address.country || recipient.country_code || 'SE';
    }

    /* Landkontroll efter Stripes adress.
       Butikens formulär skickar alltid SE, men Klarna och kortbetalningar
       samlar in en egen faktureringsadress som skriver över den. Utan den
       här kontrollen kunde en order till ett annat land gå till tryck med
       svensk frakt betald — förlust på varje sådan order.
       Kunden HAR betalat, så vi svarar 200 och lägger ordern för hand. */
    if (!SHIP_COUNTRIES.includes(String(recipient.country_code).toUpperCase())) {
      console.warn(`[stripe-webhook] ⚠️ MANUELL HANTERING: order ${md.reference} har `
        + `leveransland ${recipient.country_code}, vi levererar bara till `
        + `${SHIP_COUNTRIES.join(', ')}. Ingen Printful-order lagd. `
        + `Kontakta kunden om utrikesfrakt eller återbetala.\n`
        + JSON.stringify(recipient));
      handledSessions.add(session.id);
      return { statusCode: 200, body: 'ok (utländsk adress, manuell hantering)' };
    }

    handledSessions.add(session.id);
    await fulfilOrder({
      reference: md.reference || session.client_reference_id || session.id,
      recipient,
      lines: cart.lines,
      shipping: cart.shipping,
      total: cart.total,
      lang: md.lang === 'en' ? 'en' : 'sv',
      paymentMethod: 'Stripe (kort/Klarna)'
    });
  } catch (err) {
    // Svara 200 ändå — annars försöker Stripe om i all oändlighet.
    console.error('[stripe-webhook] Kunde inte skapa ordern:', String(err));
  }

  return { statusCode: 200, body: 'ok' };
};
