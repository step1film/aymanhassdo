# Från GitHub Pages till step1film.se — i rätt ordning

En lista att beta av uppifrån och ned. Varje steg går att stanna vid —
sajten är i gång hela tiden, ingenting slocknar mellan stegen.

**Läs så här:** 🙋 = du gör det, 🤖 = säg till så gör jag det.

---

## Upplägget: sajten stannar där den är

Hela webbplatsen ligger kvar på **GitHub Pages** under din egen domän.
Netlify får bara ett jobb: att köra de sju funktionerna som tar emot
betalningar och lägger tryckordern. Ingen sida flyttar.

```
  step1film.se              →  GitHub Pages
    index.html, shop.html, villkorssidorna, bilderna

  step1film.netlify.app     →  Netlify
    functions/  ·  Stripe, Swish, Printful
```

Butiken anropar funktionerna över nätet när någon betalar. Det är därför
`functions/_lib/http.js` bara släpper igenom anrop från step1film.se —
ingen annan sajt kan skapa betalningar i ditt namn.

**En sak att veta:** säkerhetsheadrarna i `netlify.toml` (CSP, HSTS,
X-Frame-Options) gäller bara det Netlify serverar. GitHub Pages kan inte
sätta egna headers, så de skyddar funktionerna men inte sidorna. Vill du
ha dem på hela sajten måste allt ligga på Netlify — säg till, det är en
kvart att byta.

---

## Del 1 · Få upp funktionerna på Netlify (ca 20 min)

Netlify bygger hela repot, men vi använder bara `functions/`-delen.
Butiken står kvar i demoläge, inga betalningar är påslagna.

- [x] **1.1** ✅ Skapa konto på [netlify.com](https://netlify.com) — logga in med GitHub, då hittar Netlify repot direkt.
- [x] **1.2** ✅ *Add new site* → *Import an existing project* → GitHub → välj `step1film/aymanhassdo`.
- [x] **1.3** ✅ Branch: `main`. Build command och publish directory lämnar du **tomma** — `netlify.toml` i repot säger redan vad som gäller. Tryck *Deploy*.
- [x] **1.4** ✅ Adressen är `step1film.netlify.app`. Funktionen svarar `{"error":"Not found"}` — rätt. Ursprungligen som `step1film.netlify.app`. Öppna `https://DIN-ADRESS/.netlify/functions/printful-products` — det ska svara med ett **felmeddelande om att token saknas**. Det låter fel, men är precis rätt: funktionen körs, den har bara inga nycklar än.
- [x] **1.5** ✅ Adressen är `step1film.netlify.app`, redan inskriven i dokumentationen. 🤖 Jag skriver in den i `shop.js` så butiken vet vart den ska ringa.

> Sajten som Netlify också visar på den adressen är bara en biprodukt.
> Den du och kunderna använder är step1film.se på GitHub Pages.

---

## Del 2 · Peka step1film.se mot GitHub Pages (ca 30 min + väntan)

Domänen går till **GitHub**, inte Netlify.

- [x] **2.1** ✅ **Klart** — fyra A-poster mot GitHub. ⚠️ CNAME för `www` saknas fortfarande. Ursprungligen: hos den du köpte domänen av, lägg fyra A-poster för `step1film.se` mot GitHubs adresser `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` — och en CNAME för `www` mot `step1film.github.io`.
- [x] **2.2** ✅ Domänen inlagd i GitHub Pages. Kvar: kryssa i **Enforce HTTPS** (certifikatet är utfärdat).
- [x] **2.3** ✅ DNS slog igenom, certifikat utfärdat.
- [x] **2.4** ✅ `https://step1film.se` fungerar med hänglås.
- [ ] **2.5** 🙋 I **Netlify**, sätt två miljövariabler (*Site settings → Environment variables*):
  - `SITE_URL` = `https://step1film.se` — dit kunden skickas efter betalning
  - `API_URL` = `https://step1film.netlify.app` — dit Swish ringer tillbaka

> Båda behövs eftersom sajten och funktionerna ligger på olika värdar.
> Blandar du ihop dem hamnar kunden fel efter betalning, eller så når
> Swish-kvittot aldrig fram.

---

## Del 3 · Städa innan pengar är inblandade

- [x] **3.1** ✅ **Klart** — den gamla Printful-token är raderad.
- [x] **3.2** ✅ **Klart** — lagd som hemlig miljövariabel. Ursprunglig text: Lägg den nya token som miljövariabel i Netlify: `PRINTFUL_API_TOKEN`. **Aldrig i koden.**
- [x] **3.3** ✅ **Klart** — `ADMIN_KEY` satt och verifierad (404 utan nyckel). Ursprunglig text: Sätt miljövariabeln `ADMIN_KEY` i Netlify till en lång slumpsträng (`openssl rand -hex 32`, eller vilken lång rad tecken som helst). Den skyddar funktionen som listar din butik.
- [x] **3.4** ✅ **Klart** — variant-id:n hämtade via `printful-products`.
- [x] **3.5** ✅ **Klart** — alla 68 kombinationer mappade i `catalog.js` och korskontrollerade mot butiken.
- [ ] **3.6** 🙋 `PRINTFUL_CONFIRM_ORDERS` — **skapa den inte.** Koden läser den som `=== 'true'`, alltså exakt ordet `true` och inget annat. Finns variabeln inte, blir varje order ett **utkast** i Printful som inte debiteras. Det är först i steg 5.3 du lägger till den.

---

## Del 4 · Betalning i testläge

Fyll i det du har — Stripe och Swish är oberoende av varandra, du kan
köra igång det ena först.

**Stripe (kort + Klarna)**
- [ ] **4.1** 🙋 Skapa Stripe-konto, aktivera Klarna under *Payment methods*.
- [ ] **4.2** 🙋 Miljövariabel `STRIPE_SECRET_KEY` = din **`sk_test_…`** (testnyckeln, inte den skarpa).
- [ ] **4.3** 🙋 Stripe → *Developers → Webhooks* → lägg till endpoint:
      `https://step1film.netlify.app/.netlify/functions/stripe-webhook`, händelse `checkout.session.completed`.
      **Netlify-adressen, inte step1film.se** — det är där funktionen bor.
- [ ] **4.4** 🙋 Kopiera *Signing secret* → miljövariabel `STRIPE_WEBHOOK_SECRET`.

**Swish**
- [ ] **4.5** 🙋 Teckna **Swish Handel** hos din bank (tar några dagar — starta tidigt).
- [ ] **4.6** 🙋 Banken ger dig ett certifikat (`.p12`). Koda det: `base64 -i swish.p12 | tr -d '\n'`
- [ ] **4.7** 🙋 Miljövariabler: `SWISH_PAYEE_ALIAS`, `SWISH_CERT_P12`, `SWISH_CERT_PASSWORD`, och `SWISH_ENV` = `test`.

**Slå på**
- [ ] **4.8** 🤖 Jag sätter `apiBase: 'https://step1film.netlify.app/.netlify/functions'` och `card: true` / `swish: true` i `shop.js`.
- [ ] **4.9** 🙋 Gör en testbeställning med Stripes testkort `4242 4242 4242 4242`. Kontrollera att ordern dyker upp som **utkast** i Printful med rätt produkt, färg och storlek.

---

## Del 5 · Skarpt läge

Gör bara detta när ett helt testköp gått igenom felfritt.

- [ ] **5.1** 🙋 Byt `STRIPE_SECRET_KEY` till `sk_live_…` och lägg om webhooken i Stripes live-läge (nytt signing secret).
- [ ] **5.2** 🙋 Byt `SWISH_ENV` till `production`.
- [ ] **5.3** 🙋 Sätt `PRINTFUL_CONFIRM_ORDERS` = `true`. **Nu debiteras du på riktigt för varje order.**
- [ ] **5.4** 🙋 Köp något själv, för fullt pris, med ditt eget kort. Det är enda sättet att veta att hela kedjan håller.
- [ ] **5.5** 🙋 Kontrollera att orderbekräftelsen kommer och att paketet dyker upp.

---

## Kan göras när som helst — oberoende av allt ovan

- [ ] 🙋 **Logotyper** till reklamraden → `assets/clients/`
- [ ] 🙋 **Affischer** till kortfilmerna → `assets/films/posters/`
- [ ] 🙋 Bilder som fortfarande saknas: `take-one-sleeve-3.png`, `backpack-pink-2.png`, `hoodie-24fps-black-7.png`
- [ ] 🙋 Nya bilder till **Step1 Jersey** och **On Set Cap** (produkterna ligger färdigskrivna och väntar)
- [ ] 🤖 Material/passform saknas på 7 produkter — säg till så fyller jag i det jag kan och frågar om resten

---

## Om något går fel

| Symptom | Trolig orsak |
|---|---|
| Sajten är vit på `.netlify.app` | Fel publish directory — ska vara `.` (eller tomt) |
| Butiken: "Kunde inte nå servern" | `apiBase` pekar fel, eller så saknas step1film.se i tillåtna ursprung |
| Swish betald men ingen order | `API_URL` saknas — kvittot gick till GitHub Pages i stället för Netlify |
| Trailern är svart | Vimeo-nyckeln `h=` har bytts — skicka ny embed-kod |
| "Betalning kunde inte skapas" | Miljövariabel saknas eller är felstavad i Netlify |
| Order betald men inget i Printful | Webhookens signing secret stämmer inte |
| Mejlen slutade fungera efter DNS | Namnservrarna byttes utan att MX-posterna följde med |

Fastnar du: skicka felmeddelandet och vilket steg du står på, så tar vi det därifrån.
