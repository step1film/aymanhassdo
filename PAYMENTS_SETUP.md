# STEP1 STORE — betalning (Swish + Klarna/kort)

Butiken är förberedd för två betalsätt:

| Betalsätt | Går via | Status |
|---|---|---|
| **Kort + Klarna** | Stripe | Kod klar — kräver Stripe-konto |
| **Swish** | Swish Handel (din bank) | Kod klar — kräver Swish Handel-avtal |

> **Just nu är betalning avstängd.** Butiken skickar en mejlbeställning som
> tidigare tills du fyllt i uppgifterna nedan och slagit på den. Ingenting
> går sönder under tiden.

---

## Så fungerar flödet

```
  Kund fyller i kassan
        │
        ├── Kort/Klarna ──► Stripe Checkout ──► kunden betalar
        │                        │
        │                   stripe-webhook  (verifierar signatur)
        │                        │
        └── Swish ──► swish-create-payment ──► kunden godkänner i appen
                                 │
                            swish-complete  (frågar Swish: är den betald?)
                                 │
                                 ▼
                          Printful-order skapas
```

**Viktigt om säkerheten:** webbläsaren skickar bara *produkt-id, färg,
storlek och antal* — aldrig priser. Servern räknar alltid om summan från
`functions/_lib/catalog.js`. Printful-ordern skapas först när
betalningen är **bekräftad av Stripe eller Swish**, aldrig direkt från
webbläsaren.

---

## Steg 1 — Driftsätt på Netlify (krävs för båda)

GitHub Pages kan bara visa statiska filer. Betalning kräver serverkod.

1. Skapa konto på [netlify.com](https://www.netlify.com) och koppla ditt GitHub-repo.
2. Netlify läser `netlify.toml` automatiskt: publicerar sidan och kör
   mappen `functions/` som serverless-endpoints.
3. Peka domänen **step1film.com** mot Netlify (Domain settings → Add domain).
4. Lägg in miljövariabler under **Site settings → Environment variables**
   (se `.env.example` för hela listan).

Sätt först:
```
SITE_URL = https://step1film.com
```

---

## Steg 2 — Kort + Klarna (Stripe)

1. Skapa konto på [stripe.com](https://stripe.com) och fyll i företagsuppgifterna.
2. **Aktivera Klarna:** Dashboard → *Settings → Payment methods* → slå på **Klarna**.
   (Kort är på som standard. Klarna kräver att kontot är godkänt.)
3. Hämta din hemliga nyckel: *Developers → API keys* → **Secret key**.
4. Skapa webhook: *Developers → Webhooks → Add endpoint*
   - **URL:** `https://step1film.com/.netlify/functions/stripe-webhook`
   - **Event:** `checkout.session.completed`
   - Kopiera **Signing secret** (`whsec_…`).
5. Lägg in i Netlify:
```
STRIPE_SECRET_KEY     = sk_live_…   (eller sk_test_… medan du testar)
STRIPE_WEBHOOK_SECRET = whsec_…
```

**Testa först:** använd `sk_test_…` och kortnumret `4242 4242 4242 4242`
(valfritt framtida datum + valfri CVC).

---

## Steg 3 — Swish

Swish för webbutik heter **Swish Handel** och tecknas hos **din bank** —
det går inte att skapa själv online.

1. **Teckna Swish Handel** hos din bank (Swedbank, SEB, Nordea, Handelsbanken m.fl.).
   Kräver företag med organisationsnummer. Du får:
   - ett **Swish-handelsnummer** (börjar oftast på `123…`)
   - tillgång till att skapa ett **certifikat**
2. **Skapa certifikatet** i bankens portal (ofta "Swish Certificate Management").
   Du får en **`.p12`-fil** och sätter ett **lösenord** för den.
3. **Koda certifikatet till base64** (så det kan ligga som miljövariabel):
   ```bash
   base64 -i swish.p12 | tr -d '\n'
   ```
   Kopiera hela strängen.
4. Lägg in i Netlify:
```
SWISH_PAYEE_ALIAS   = 1231234567        (ditt handelsnummer)
SWISH_CERT_P12      = <base64-strängen>
SWISH_CERT_PASSWORD = <lösenordet>
SWISH_ENV           = test              (byt till production när det funkar)
```

**Testmiljön (MSS)** kräver inget bankavtal — Swish tillhandahåller ett
testcertifikat på [developer.swish.nu](https://developer.swish.nu) så du kan
prova hela flödet innan avtalet är klart.

---

## Steg 4 — Slå på betalningen

Öppna `shop.js`, leta upp `CONFIG.payments` högst upp och ändra:

```js
payments: {
  apiBase: '/.netlify/functions',   // eller '/api'
  card: true,    // Stripe: kort + Klarna
  swish: true    // Swish
}
```

Sätt bara `true` på det du faktiskt aktiverat. Är båda `false` körs
mejlbeställning som förut.

---

## Steg 5 — Koppla Printful-varianterna

Betalningen fungerar redan utan detta, men för att ordern ska gå **automatiskt**
till tryck behöver varje variant sitt Printful-ID.

1. Hämta dina varianter (se `PRINTFUL_SETUP.md`) — endpointen
   `/.netlify/functions/printful-products` listar dem.
2. Fyll i dem i `functions/_lib/catalog.js`:
   ```js
   '24fps-hoodie': {
     name: '24FPS HOODIE', price: 699,
     variants: { 'black|M': 4011112, 'black|L': 4011113, /* … */ }
   },
   ```

Saknas ett ID skapas **ingen** Printful-order — istället loggas ordern i
Netlify-loggen (*Functions → Logs*) så att du kan lägga den manuellt.
Betalningen påverkas inte.

---

## Att göra innan skarp drift

- [ ] **Testa med testnycklar först** (Stripe `sk_test_…`, Swish `SWISH_ENV=test`).
- [ ] Sätt `PRINTFUL_CONFIRM_ORDERS=true` först när allt fungerar — annars
      skapas ordrarna som **utkast** i Printful (bra medan du testar).
- [ ] **Företag & moms:** du behöver oftast enskild firma/AB med F-skatt och
      momsregistrering hos Skatteverket för att sälja lagligt.
- [ ] **Köpvillkor + ångerrätt** måste finnas *innan* köp (distansavtalslagen,
      14 dagar). Informerar du inte kan ångerfristen förlängas upp till 12 månader.
- [ ] **Dubblettskydd:** `swish-complete.js` har idag ett enkelt minnesskydd
      mot dubbla ordrar. Vid högre volym bör betalnings-id sparas i en
      databas/KV-store (t.ex. Netlify Blobs) så att en order aldrig kan
      skapas två gånger även om servern startas om.
- [ ] **Håll priser i synk:** ändrar du ett pris i `shop.js` måste samma pris
      ändras i `functions/_lib/catalog.js`.

---

## Filerna

| Fil | Roll |
|---|---|
| `functions/_lib/catalog.js` | Serverns priskatalog + validering (aldrig lita på klienten) |
| `functions/_lib/fulfil.js` | Skapar Printful-ordern efter bekräftad betalning |
| `functions/_lib/swish.js` | Swish-API med klientcertifikat (mTLS) |
| `functions/create-checkout-session.js` | Startar Stripe Checkout (kort + Klarna) |
| `functions/stripe-webhook.js` | Tar emot Stripes bekräftelse → skapar ordern |
| `functions/swish-create-payment.js` | Skapar Swish-betalning (+ QR för dator) |
| `functions/swish-complete.js` | Kollar status hos Swish → skapar ordern |
| `functions/swish-callback.js` | Swish statusnotiser (loggning) |
