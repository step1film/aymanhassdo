/* =====================================================
   STEP1 STORE — företagsuppgifter (EN KÄLLA)
   =====================================================
   ⚠️ FYLL I DE MARKERADE FÄLTEN INNAN BUTIKEN ÖPPNAR.

   Enligt distansavtalslagen och e-handelslagen MÅSTE en
   webbutik tydligt visa företagets namn, organisationsnummer,
   postadress och kontaktuppgifter innan kunden köper.
   Uppgifterna nedan används automatiskt i sidfoten och på
   alla villkorssidor — ändra bara här.
   ===================================================== */
(function () {
  'use strict';

  const COMPANY = {
    legalName: 'Ayman Hassdo',
    /* ⬇️ ORGANISATIONSNUMMER — ENDA FÄLTET SOM ÅTERSTÅR
       För enskild firma är org.nr detsamma som ditt personnummer.
       E-handelslagen kräver att det visas, men det är också en
       personuppgift. Se PAYMENTS_SETUP.md → "Organisationsnummer"
       för alternativen innan du fyller i. */
    orgNr: 'FYLL I ORG.NR',
    street: 'Östra Vasagatan 1A',
    zip: '568 32',
    city: 'Skillingaryd',
    country: 'Sverige',
    // ⬇️ FYLL I när momsregistreringen är klar (SE + org.nr utan bindestreck + 01)
    vatNr: '',

    brand: 'STEP1FILM',
    owner: 'Ayman Hassdo',
    // Butikens adress — order, retur, frakt, reklamation
    email: 'shop@step1film.se',
    // Allmän företagskontakt (ej köpärenden)
    infoEmail: 'info@step1film.se',
    phone: '',            // valfritt, men rekommenderas
    domain: 'step1film.se',
    year: 2026
  };

  /** Sant när alla obligatoriska uppgifter är ifyllda. */
  COMPANY.isComplete = !/FYLL I/.test(
    [COMPANY.legalName, COMPANY.orgNr, COMPANY.street, COMPANY.zip].join(' ')
  );

  COMPANY.addressLine = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}, ${COMPANY.country}`;

  /** Fyller alla [data-company="fält"] på sidan. */
  function fill() {
    document.querySelectorAll('[data-company]').forEach((el) => {
      const key = el.getAttribute('data-company');
      const val = COMPANY[key];
      if (val == null || val === '') { el.closest('[data-company-row]')?.remove(); return; }
      el.textContent = val;
      if (!COMPANY.isComplete && /FYLL I/.test(String(val))) el.classList.add('needs-info');
    });
  }

  window.S1F_COMPANY = COMPANY;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fill);
  else fill();
})();
