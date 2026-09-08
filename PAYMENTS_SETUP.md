# STEP1 STORE — betalning (Swish + Klarna/kort)

Butiken är förberedd för betalning med kort, Klarna och Swish:

| Betalsätt | Går via | Status |
|---|---|---|
| **Kort + Klarna** | Stripe | Kod klar — kräver Stripe-konto |
| **Swish** | Swish Handel (din bank) | Kod klar, numret inlagt — kräver certifikat |
| **Swish via Stripe** | Stripe | Kod klar — alternativ utan bankcertifikat |

**Swish-numret 123 154 04 59** ligger inlagt både i butiken (visas under
Swish-alternativet i kassan) och på servern som förval i
`functions/_lib/swish.js`. Det som återstår är certifikatet: Swish
Commerce API kräver ömsesidig TLS, alltså en `.p12`-fil från banken.
Utan den svarar Swish inte alls.

**Du behöver inte slå på något i koden.** Kassan frågar servern —
`/.netlify/functions/payment-methods` — vilka nycklar som faktiskt
ligger på plats, och visar bara de betalsätt som fungerar hela vägen.
Swish tänds alltså av sig själv samma stund som `SWISH_CERT_P12` finns
i Netlifys miljövariabler, och ett halvkopplat betalsätt kan aldrig
visas för en kund. `CONFIG.payments` i `shop.js` står på `'auto'`;
`false` finns kvar som nödbroms.

> **Just nu är betalning avstängd** — inte av koden, utan av
> `CONFIG.kassaStangd` i `shop.js` (kassan är pausad medan Netlify-
> deployerna står stilla). Butiken skickar en mejlbeställning som
> tidigare. Ingenting går sönder under tiden.

---

## Så fungerar flödet

```
  Kassan öppnas ──► payment-methods  (vilka betalsätt är kopplade?)
        │
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
3. Peka domänen **step1film.se** mot Netlify (Domain settings → Add domain).
4. Lägg in miljövariabler under **Site settings → Environment variables**
   (se `.env.example` för hela listan).

Sätt först:
```
SITE_URL = https://step1film.se
```

---

## Steg 2 — Kort + Klarna (Stripe)

1. Skapa konto på [stripe.com](https://stripe.com) och fyll i företagsuppgifterna.
2. **Aktivera Klarna:** Dashboard → *Settings → Payment methods* → slå på **Klarna**.
   (Kort är på som standard. Klarna kräver att kontot är godkänt.)
3. Hämta din hemliga nyckel: *Developers → API keys* → **Secret key**.
4. Skapa webhook: *Developers → Webhooks → Add endpoint*
   - **URL:** `https://step1film.se/.netlify/functions/stripe-webhook`
   - **Events:** `checkout.session.completed`,
     `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`
     (de två sista gäller betalsätt som bekräftas i efterhand — utan dem
     hade en sådan betalning aldrig blivit en order)
   - Kopiera **Signing secret** (`whsec_…`).
5. Lägg in i Netlify:
```
STRIPE_SECRET_KEY     = sk_live_…   (eller sk_test_… medan du testar)
STRIPE_WEBHOOK_SECRET = whsec_…
```

**Testa först:** använd `sk_test_…` och kortnumret `4242 4242 4242 4242`
(valfritt framtida datum + valfri CVC).

**Båda nycklarna krävs.** Med bara `STRIPE_SECRET_KEY` går betalningen
igenom men webhooken kan inte verifiera signaturen — kunden hade betalat
utan att ordern skapades. Därför visas kortalternativet i kassan först
när `STRIPE_WEBHOOK_SECRET` också finns.

**Vilka betalsätt Stripe visar** styrs av `STRIPE_PAYMENT_METHODS`
(tomt = `card,klarna`). Listan låg förut hårdkodad, och var Klarna inte
godkänt på kontot avvisade Stripe hela kassan — även kortbetalningen.
Nu räcker det att ändra miljövariabeln:
```
STRIPE_PAYMENT_METHODS = card            # bara kort
STRIPE_PAYMENT_METHODS = card,klarna     # standard
STRIPE_PAYMENT_METHODS = card,klarna,swish
```

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
SWISH_PAYEE_ALIAS   = 1231540459        (STEP1FILM:s handelsnummer, 123 154 04 59)
SWISH_CERT_P12      = <base64-strängen>
SWISH_CERT_PASSWORD = <lösenordet>
SWISH_ENV           = test              (byt till production när det funkar)
```

**Testmiljön (MSS)** kräver inget bankavtal — Swish tillhandahåller ett
testcertifikat på [developer.swish.nu](https://developer.swish.nu) så du kan
prova hela flödet innan avtalet är klart.

### Swish utan bankcertifikat — via Stripe

Stripe stödjer numera Swish för svenska kronor. Det är en genväg om du
inte vill vänta på bankens certifikat:

1. Stripe Dashboard → *Settings → Payment methods* → slå på **Swish**.
2. Sätt `STRIPE_PAYMENT_METHODS = card,klarna,swish` i Netlify.

Kunden får då Swish inne i Stripes kassa i stället för i vår egen.
Skillnaden: Stripe tar sin avgift även på Swish-betalningen, och
pengarna landar hos Stripe i stället för direkt på handelsnumret.
Swish Handel är billigare i längden — det här är vägen som fungerar i
dag. Båda kan vara påslagna samtidigt, men visa bara ett Swish-
alternativ i kassan så kunden inte behöver välja mellan två likadana.

### Så vet du att Swish är kopplat

```bash
curl https://step1film.netlify.app/.netlify/functions/payment-methods
```
```json
{"card":true,"swish":true,"swishNumber":"123 154 04 59","swishTest":true,"cardTest":false}
```

`swish: true` betyder att certifikatet, handelsnumret och callback-
adressen finns — då syns Swish i kassan. `swishTest: true` betyder att
`SWISH_ENV` fortfarande står på `test` (MSS): betalningarna är alltså
inte på riktigt. Svaret innehåller aldrig en nyckel, bara ja/nej och
handelsnumret som ändå står på kvittot.

---

## Steg 4 — Slå på betalningen

Det sker av sig självt. `CONFIG.payments` i `shop.js` står på `'auto'`:

```js
payments: {
  apiBase: 'https://step1film.netlify.app/.netlify/functions',
  card: 'auto',  // Stripe: kort + Klarna
  swish: 'auto'  // Swish Handel
}
```

Kassan frågar `payment-methods` när den öppnas och visar de betalsätt
servern säger sig klara. Lägg in nycklarna i Netlify — betalsättet dyker
upp i kassan utan att någon rör koden.

`true` tvingar fram ett betalsätt oavsett vad servern säger (använd bara
för felsökning — kunden kan mötas av ett serverfel). `false` är
nödbromsen: stänger av betalsättet direkt. Svarar servern inte alls
faller butiken tillbaka på mejlbeställning som förut.

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

## Organisationsnummer — enskild firma

För en **enskild firma är organisationsnumret detsamma som ditt personnummer**.
E-handelslagen och distansavtalslagen kräver att numret visas i butiken, men
det är samtidigt en personuppgift. Det är en verklig målkonflikt — frågan har
till och med tagits upp i riksdagen.

Alternativen, med för- och nackdelar:

| Val | Följer lagen | Integritet | Kommentar |
|---|---|---|---|
| **Publicera hela numret** | ✅ Ja | ⚠️ Lägst | Vanligast för enskild firma. Personnummer är offentlig uppgift i Sverige, men publicering gör det lättare att skrapa. |
| **Visa bara YYMMDD-XXXX** | ⚠️ Osäkert | 🟡 Bättre | Vissa gör så. Inte tydligt förenligt med kravet. |
| **"Lämnas på begäran"** | ❌ Nej | ✅ Bäst | Uppfyller inte informationskravet. |
| **Starta aktiebolag** | ✅ Ja | ✅ Bäst | AB får ett eget org.nr (556…/559…) — personnumret hålls utanför. Kräver 25 000 kr i aktiekapital och mer administration. |

**Rekommendation:** börjar du i liten skala är det vanligaste att publicera
numret. Känns det obekvämt är ett AB den enda lösningen som både följer lagen
och skyddar personnumret.

Fyll i valet i `company.js` → `orgNr`.

---

## Att göra innan skarp drift

- [ ] **Testa med testnycklar först** (Stripe `sk_test_…`, Swish `SWISH_ENV=test`).
- [ ] Sätt `PRINTFUL_CONFIRM_ORDERS=true` först när allt fungerar — annars
      skapas ordrarna som **utkast** i Printful (bra medan du testar).
- [ ] **Företag & moms:** du behöver oftast enskild firma/AB med F-skatt och
      momsregistrering hos Skatteverket för att sälja lagligt.
- [ ] **Köpvillkor + ångerrätt** måste finnas *innan* köp (distansavtalslagen,
      14 dagar). Informerar du inte kan ångerfristen förlängas upp till 12 månader.
- [ ] **Dubblettskydd:** `swish-complete.js` och `stripe-webhook.js` har
      i dag ett enkelt minnesskydd mot dubbla ordrar (Stripe-sidan nycklar
      på sessionens id, så samma köp inte blir två ordrar när det kommer in
      som två olika händelser). Vid högre volym bör betalnings-id sparas i
      en databas/KV-store (t.ex. Netlify Blobs) så att en order aldrig kan
      skapas två gånger även om servern startas om.
- [ ] **Spärren mot missbruk** i `swish-create-payment.js` räknar försök per
      IP och per telefonnummer i funktionsinstansens minne. Den stoppar det
      som går genom en och samma IP, men inte en angripare med många. Ett
      riktigt skydd hör hemma i samma KV-store som dubblettskyddet.
- [ ] **Om kunden stänger webbläsaren mitt i en Swish-betalning** skapas
      ingen order — sidan är den som frågar Swish om status. Betalningen
      syns i `swish-callback`-loggen (*Functions → Logs*), så ordern går att
      lägga för hand. Ett callback som kan slutföra ordern själv kräver att
      vagnen sparas utanför minnet, alltså samma KV-store igen.
- [ ] **Håll priser i synk:** ändrar du ett pris i `shop.js` måste samma pris
      ändras i `functions/_lib/catalog.js`.

---

## Filerna

| Fil | Roll |
|---|---|
| `functions/_lib/catalog.js` | Serverns priskatalog + validering (aldrig lita på klienten) |
| `functions/_lib/fulfil.js` | Skapar Printful-ordern efter bekräftad betalning |
| `functions/_lib/swish.js` | Swish-API med klientcertifikat (mTLS) |
| `functions/payment-methods.js` | Säger vilka betalsätt som är färdigkopplade |
| `functions/create-checkout-session.js` | Startar Stripe Checkout (kort + Klarna) |
| `functions/stripe-webhook.js` | Tar emot Stripes bekräftelse → skapar ordern |
| `functions/swish-create-payment.js` | Skapar Swish-betalning (+ QR för dator) |
| `functions/swish-complete.js` | Kollar status hos Swish → skapar ordern |
| `functions/swish-callback.js` | Swish statusnotiser (loggning) |
