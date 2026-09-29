/* =====================================================
   STEP1 STORE — Stripe Checkout (kort + Klarna)
   =====================================================
   Skapar en Stripe Checkout-session och returnerar URL:en
   som kunden skickas till. Priserna räknas ALLTID om på
   servern via catalog.js — klientens priser ignoreras.

   Miljövariabler:
     STRIPE_SECRET_KEY   – sk_live_… / sk_test_…
     SITE_URL            – t.ex. https://step1film.se
   ===================================================== */
'use strict';

const { corsHeaders, isForeignOrigin } = require('./_lib/http');

const Stripe = require('stripe');
const { priceCart, validateRecipient } = require('./_lib/catalog');
const { resolveShipping } = require('./_lib/shipping');


/* Betalsätten hos Stripe.
   -----------------------------------------------------
   Stod förut hårdkodat som ['card','klarna']. Problemet: är Klarna
   inte godkänt på kontot avvisar Stripe HELA sessionen — och då
   fungerar inte kortbetalningen heller, fast den var klar. Nu styrs
   listan av en miljövariabel, så ett betalsätt kan tas bort eller
   läggas till utan en ny deploy.

   Stripe har numera även Swish (SEK, engångsbetalningar). Det är ett
   alternativ till Swish Handel för den som inte vill vänta på
   bankens certifikat — slå på Swish i Stripe Dashboard och lägg till
   'swish' här. Se PAYMENTS_SETUP.md. */
const ALLOWED_METHODS = ['card', 'klarna', 'swish', 'link', 'paypal'];
const DEFAULT_METHODS = ['card', 'klarna'];

function paymentMethods() {
  const raw = String(process.env.STRIPE_PAYMENT_METHODS || '').toLowerCase();
  const list = raw.split(',').map((m) => m.trim()).filter((m) => ALLOWED_METHODS.includes(m));
  return list.length ? [...new Set(list)] : DEFAULT_METHODS;
}

exports.handler = async (event) => {
  const cors = corsHeaders(event, 'POST, OPTIONS');
  if (isForeignOrigin(event)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Otillåtet ursprung.' }) };
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'STRIPE_SECRET_KEY saknas i serverns miljövariabler.' }) };
  }

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Ogiltig JSON.' }) }; }

  let cart, recipient;
  try {
    cart = priceCart(payload.items);
    recipient = validateRecipient(payload.recipient || {});
  } catch (err) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: String(err.message || err) }) };
  }

  /* Frakten hämtas live för kundens land. Svarar inte Printful blir
     det standardpriset — kassan stannar aldrig på en frakt. */
  const frakt = await resolveShipping({ lines: cart.lines, subtotal: cart.subtotal, recipient });
  cart = priceCart(payload.items, { shipping: frakt.amount });

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  const site = (process.env.SITE_URL || `https://${event.headers.host}`).replace(/\/$/, '');
  const reference = 'S1F-' + Date.now().toString(36).toUpperCase();

  // Rader i öre (Stripe räknar i minsta valutaenhet)
  const line_items = cart.lines.map((l) => ({
    quantity: l.qty,
    price_data: {
      currency: cart.currency,
      unit_amount: l.unitPrice * 100,
      product_data: {
        name: l.name,
        description: [l.color, l.size].filter(Boolean).join(' · ') || undefined
      }
    }
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethods(),
      line_items,
      customer_email: recipient.email,
      client_reference_id: reference,
      locale: payload.lang === 'en' ? 'en' : 'sv',
      shipping_options: [{
        shipping_rate_data: {
          type: 'fixed_amount',
          display_name: cart.shipping === 0 ? 'Fri frakt' : (frakt.name || 'Frakt'),
          fixed_amount: { amount: cart.shipping * 100, currency: cart.currency }
        }
      }],
      // Kompakt orderdata så webhooken kan skapa Printful-ordern
      metadata: {
        reference,
        recipient: JSON.stringify(recipient).slice(0, 480),
        lines: JSON.stringify(cart.lines.map((l) => [l.id, l.color, l.size, l.qty])).slice(0, 480),
        shipping: String(cart.shipping),
        // Så det går att se i Stripe om frakten var live eller reserven
        shippingSource: frakt.source,
        total: String(cart.total),
        // Så att bekräftelsemejlet kommer på samma språk som butiken stod på
        lang: payload.lang === 'en' ? 'en' : 'sv'
      },
      success_url: `${site}/store?order=ok&ref=${reference}`,
      cancel_url: `${site}/store?order=cancelled`
    });

    return { statusCode: 200, headers: cors, body: JSON.stringify({ url: session.url, reference }) };
  } catch (err) {
    // Logga detaljen på servern — visa aldrig interna fel för kunden
    console.error('[create-checkout-session]', String(err && err.message || err));
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte skapa betalning. Försök igen.' }) };
  }
};
