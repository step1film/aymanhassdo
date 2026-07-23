/* =====================================================
   STEP1FILM Store — Printful: list products
   =====================================================
   Serverless-funktion som hämtar dina Printful-produkter
   (och deras varianter) SÅ ATT DIN API-NYCKEL ALDRIG
   LÄMNAR SERVERN.

   Format: Netlify Functions (exports.handler).
   - Cloudflare Pages / Vercel: se not längst ner.

   Miljövariabler som krävs (se .env.example):
     PRINTFUL_API_TOKEN   – din Printful-token (hemlig)
     PRINTFUL_STORE_ID    – valfritt, om du har flera stores

   Anropa från frontend via printful.js:  GET /printful-products
   Svaret innehåller produkter + varianter (inkl. variant_id som
   du skriver in i shop.js → PRODUCTS[].variants).
   ===================================================== */
'use strict';

const PRINTFUL_API = 'https://api.printful.com';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = process.env.PRINTFUL_API_TOKEN;
  if (!token) {
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: 'PRINTFUL_API_TOKEN saknas i serverns miljövariabler.' })
    };
  }

  const authHeaders = { Authorization: `Bearer ${token}` };
  if (process.env.PRINTFUL_STORE_ID) {
    authHeaders['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID;
  }

  try {
    // 1) Lista alla sync-produkter i din store
    const listRes = await fetch(`${PRINTFUL_API}/store/products`, { headers: authHeaders });
    if (!listRes.ok) {
      const text = await listRes.text();
      return { statusCode: listRes.status, headers: cors, body: JSON.stringify({ error: 'Printful list failed', detail: text }) };
    }
    const list = await listRes.json();
    const products = (list.result || []);

    // 2) Hämta varianter för varje produkt (parallellt)
    const detailed = await Promise.all(products.map(async (p) => {
      const dRes = await fetch(`${PRINTFUL_API}/store/products/${p.id}`, { headers: authHeaders });
      if (!dRes.ok) return { id: p.id, name: p.name, thumbnail: p.thumbnail_url, variants: [] };
      const d = await dRes.json();
      const r = d.result || {};
      const variants = (r.sync_variants || []).map((v) => ({
        variant_id: v.id,                    // <-- detta ID skriver du in i shop.js
        name: v.name,
        size: v.size || null,
        color: v.color || null,
        price: v.retail_price,
        currency: v.currency,
        image: (v.files && (v.files.find((f) => f.type === 'preview') || {}).preview_url) || p.thumbnail_url
      }));
      return {
        id: p.id,
        name: (r.sync_product && r.sync_product.name) || p.name,
        thumbnail: p.thumbnail_url,
        variants
      };
    }));

    return { statusCode: 200, headers: cors, body: JSON.stringify({ products: detailed }) };
  } catch (err) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'Kunde inte nå Printful', detail: String(err) }) };
  }
};

/* -----------------------------------------------------
   Cloudflare Pages / Vercel-anpassning:
   Byt ut signaturen mot deras format och läs miljövariabler
   därifrån. Logiken (fetch mot Printful) är identisk.

   // Cloudflare Pages Functions (functions/printful-products.js):
   // export async function onRequestGet({ env }) {
   //   const token = env.PRINTFUL_API_TOKEN; ...
   // }

   // Vercel (api/printful-products.js):
   // export default async function handler(req, res) {
   //   const token = process.env.PRINTFUL_API_TOKEN; ...
   // }
   ----------------------------------------------------- */
