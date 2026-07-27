# Från GitHub Pages till step1film.se — i rätt ordning

En lista att beta av uppifrån och ned. Varje steg går att stanna vid —
sajten är i gång hela tiden, ingenting slocknar mellan stegen.

**Läs så här:** 🙋 = du gör det, 🤖 = säg till så gör jag det.

---

## Del 1 · Få upp sajten på Netlify (ca 20 min)

Här flyttar vi bara var sajten visas. Butiken står kvar i demoläge,
inga betalningar är påslagna. Domänen rör vi inte än.

- [ ] **1.1** 🙋 Skapa konto på [netlify.com](https://netlify.com) — logga in med GitHub, då hittar Netlify repot direkt.
- [ ] **1.2** 🙋 *Add new site* → *Import an existing project* → GitHub → välj `step1film/aymanhassdo`.
- [ ] **1.3** 🙋 Branch: `main`. Build command och publish directory lämnar du **tomma** — `netlify.toml` i repot säger redan vad som gäller. Tryck *Deploy*.
- [ ] **1.4** 🙋 Du får en adress i stil med `random-namn-123.netlify.app`. Öppna den och kolla:
  - startsidan laddar, introt räknar ner
  - trailern på 001 spelar när du klickar
  - SV/EN-knappen byter språk
  - butiken visar alla 15 produkter
- [ ] **1.5** 🙋 **Skicka mig adressen** om något ser fel ut. 🤖 Jag felsöker mot den riktiga miljön.

> **Varför Netlify och inte GitHub Pages med din domän?** GitHub Pages kan
> bara servera filer. De sju funktionerna som tar emot Swish, skapar
> Stripe-betalningar och lägger Printful-ordern måste köras på en server.
> Pekar du domänen mot GitHub Pages nu får du göra om DNS-flytten sedan.

---

## Del 2 · Peka step1film.se dit (ca 30 min + väntan)

- [ ] **2.1** 🙋 Netlify → *Domain management* → *Add a domain* → `step1film.se`.
- [ ] **2.2** 🙋 Netlify visar vad du ska ändra hos den som du köpte domänen av. Två vägar:
  - **Enklast:** byt namnservrar till Netlifys (de sköter allt sedan)
  - **Om du har mejl på domänen:** behåll namnservrarna och lägg bara in de A-/CNAME-poster Netlify anger — annars kan mejlen sluta fungera
- [ ] **2.3** ⏳ Vänta. DNS tar allt från 10 minuter till ett dygn. Netlify visar när det slagit igenom.
- [ ] **2.4** 🙋 Kontrollera att `https://step1film.se` funkar **med hänglås**. Netlify ordnar certifikatet automatiskt, men det kommer först när DNS är klart.
- [ ] **2.5** 🙋 Sätt miljövariabeln `SITE_URL` = `https://step1film.se` i Netlify (*Site settings → Environment variables*). Den används för retur-adresser efter betalning.

---

## Del 3 · Städa innan pengar är inblandade

- [ ] **3.1** 🙋 **Återkalla Printful-token som du klistrade in i chatten.** Printful → *Settings → Developers* → ta bort den gamla, skapa en ny. Den gamla har legat i en chattlogg och ska inte användas skarpt.
- [ ] **3.2** 🙋 Lägg den nya token som miljövariabel i Netlify: `PRINTFUL_API_TOKEN`. **Aldrig i koden.**
- [ ] **3.3** 🙋 Hämta dina Printful-variant-id:n (Printful → produkten → varje variant har ett id).
- [ ] **3.4** 🤖 Jag skriver in dem i `functions/_lib/catalog.js` så rätt plagg i rätt färg och storlek beställs.
- [ ] **3.5** 🙋 Låt `PRINTFUL_CONFIRM_ORDERS` vara **tom**. Då skapas ordrar som utkast och du blir inte debiterad medan vi testar.

---

## Del 4 · Betalning i testläge

Fyll i det du har — Stripe och Swish är oberoende av varandra, du kan
köra igång det ena först.

**Stripe (kort + Klarna)**
- [ ] **4.1** 🙋 Skapa Stripe-konto, aktivera Klarna under *Payment methods*.
- [ ] **4.2** 🙋 Miljövariabel `STRIPE_SECRET_KEY` = din **`sk_test_…`** (testnyckeln, inte den skarpa).
- [ ] **4.3** 🙋 Stripe → *Developers → Webhooks* → lägg till endpoint:
      `https://step1film.se/.netlify/functions/stripe-webhook`, händelse `checkout.session.completed`.
- [ ] **4.4** 🙋 Kopiera *Signing secret* → miljövariabel `STRIPE_WEBHOOK_SECRET`.

**Swish**
- [ ] **4.5** 🙋 Teckna **Swish Handel** hos din bank (tar några dagar — starta tidigt).
- [ ] **4.6** 🙋 Banken ger dig ett certifikat (`.p12`). Koda det: `base64 -i swish.p12 | tr -d '\n'`
- [ ] **4.7** 🙋 Miljövariabler: `SWISH_PAYEE_ALIAS`, `SWISH_CERT_P12`, `SWISH_CERT_PASSWORD`, och `SWISH_ENV` = `test`.

**Slå på**
- [ ] **4.8** 🤖 Jag sätter `apiBase: '/.netlify/functions'` och `card: true` / `swish: true` i `shop.js`.
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
| Trailern är svart | Vimeo-nyckeln `h=` har bytts — skicka ny embed-kod |
| "Betalning kunde inte skapas" | Miljövariabel saknas eller är felstavad i Netlify |
| Order betald men inget i Printful | Webhookens signing secret stämmer inte |
| Mejlen slutade fungera efter DNS | Namnservrarna byttes utan att MX-posterna följde med |

Fastnar du: skicka felmeddelandet och vilket steg du står på, så tar vi det därifrån.
