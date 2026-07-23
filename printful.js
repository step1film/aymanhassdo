/* =====================================================
   STEP1FILM Store — Printful frontend-brygga
   =====================================================
   Litet hjälp-lager mellan din butik (shop.js) och
   serverless-funktionerna i functions/.

   Frontend pratar ALDRIG direkt med Printful — bara med
   dina egna funktioner, som håller API-nyckeln hemlig.

   Exponerar window.S1F_Printful med:
     .enabled            – true om apiBase är satt
     .fetchProducts()    – hämtar dina produkter + varianter
     .createOrder(data)  – skickar en order (efter betalning)

   Aktiveras av CONFIG.printful i shop.js. Så länge apiBase är
   tomt är allt avstängt och butiken kör i mockup-/mejlläge.
   ===================================================== */
(function () {
  'use strict';

  // Läses från shop.js (window.S1F_CONFIG.printful) om det finns,
  // annars av (säkert default).
  function cfg() {
    return (window.S1F_CONFIG && window.S1F_CONFIG.printful) || { apiBase: '', enabled: false };
  }

  function base() {
    return (cfg().apiBase || '').replace(/\/$/, '');
  }

  const api = {
    get enabled() {
      const c = cfg();
      return Boolean(c.enabled && c.apiBase);
    },

    /* Hämtar { products: [ { id, name, thumbnail, variants:[...] } ] } */
    async fetchProducts() {
      if (!this.enabled) throw new Error('Printful är inte aktiverat (CONFIG.printful).');
      const res = await fetch(`${base()}/printful-products`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Kunde inte hämta produkter (${res.status})`);
      return res.json();
    },

    /* Skapar en order. Anropas EFTER bekräftad betalning.
       data = { recipient:{...}, items:[{variant_id, quantity}] } */
    async createOrder(data) {
      if (!this.enabled) throw new Error('Printful är inte aktiverat (CONFIG.printful).');
      const res = await fetch(`${base()}/printful-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Order misslyckades (${res.status})`);
      return json;
    }
  };

  window.S1F_Printful = api;
})();
