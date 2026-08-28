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
const { fulfilOrder } = require('./_lib/fulfil');

/* Stripe kan skicka samma händelse mer än en gång — vid omförsök, och
   i sällsynta fall två gånger direkt. Vi svarar alltid 200, så
   omförsöken är få, men en dubblett skulle annars bli en andra
   Printful-order på samma betalning. Setet lever så länge
   funktionsinstansen gör; för skarp drift hör det hemma i en KV-store,
   se PAYMENTS_SETUP.md. */
const handledEvents = new Set();

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

  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'ignored' };
  }

  if (handledEvents.has(stripeEvent.id)) {
    return { statusCode: 200, body: 'ok (redan hanterad)' };
  }

  const session = stripeEvent.data.object;
  if (session.payment_status !== 'paid') {
    console.log('[stripe-webhook] Session ej betald ännu:', session.id);
    return { statusCode: 200, body: 'not paid' };
  }

  try {
    const md = session.metadata || {};
    const recipient = JSON.parse(md.recipient || '{}');
    const compact = JSON.parse(md.lines || '[]'); // [[id, color, size, qty], …]

    // Räkna om priserna på servern igen — metadata är bara referens.
    const cart = priceCart(compact.map(([id, color, size, qty]) => ({ id, color, size, qty })));

    /* Kontrollera att kunden betalat det ordern kostar nu. Sessionen
       skapades med serverns priser, så det stämmer i normalfallet —
       men ändras ett pris medan en kassa står öppen betalar kunden det
       gamla priset och vi hade tryckt ordern för det nya. Kunden HAR
       betalat, så vi svarar 200 och lägger ordern för hand. */
    const paidOre = Number(session.amount_total);
    const vantatOre = Math.round(cart.total * 100);
    if (Number.isFinite(paidOre) && Math.abs(paidOre - vantatOre) > 1) {
      console.warn(`[stripe-webhook] ⚠️ MANUELL HANTERING: order ${md.reference} betalades `
        + `med ${paidOre / 100} kr men kostar ${cart.total} kr enligt katalogen. `
        + `Ingen Printful-order lagd — kontrollera priset och lägg ordern för hand `
        + `eller återbetala mellanskillnaden.`);
      handledEvents.add(stripeEvent.id);
      return { statusCode: 200, body: 'ok (beloppet stämmer inte, manuell hantering)' };
    }

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
      return { statusCode: 200, body: 'ok (utländsk adress, manuell hantering)' };
    }

    handledEvents.add(stripeEvent.id);
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
