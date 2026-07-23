# STEP1FILM Store × Printful — uppkoppling

Den här guiden beskriver hur du kopplar din egen butik på **step1film.com** till
**Printful** (print-on-demand) — så att dina egna designer trycks och skickas
automatiskt när någon köper.

> **Kom ihåg det viktigaste:** Printful sköter bara **tryck + leverans**.
> Printful tar **aldrig** betalt av kunden. Du behöver därför alltid två delar:
>
> 1. En **kassa som tar betalt** (kort / Klarna / Swish)
> 2. En **koppling** som skickar den betalda ordern vidare till Printful
>
> Den här repo-strukturen är förberedd för båda delarna. Du kan börja enkelt
> (Steg 1–3) och lägga till automatisk betalning senare (Steg 4).

---

## Översikt — hur det hänger ihop

```
  Kund på step1film.com
          │  väljer produkt, färg, storlek → betalar
          ▼
  Kassa (Stripe / Snipcart)         ← tar betalt
          │  order + leveransadress
          ▼
  Serverless-funktion (functions/)  ← håller din API-nyckel hemlig
          │  skapar order via Printful API
          ▼
  Printful                          ← trycker + skickar till kunden
```

Frontend (din nuvarande sida) anropar **aldrig** Printful direkt — då skulle din
hemliga API-nyckel ligga öppet i webbläsaren. All kontakt med Printful går genom
en liten serverfunktion i mappen `functions/`.

---

## Vad du behöver göra själv (kan inte automatiseras)

Det här är sakerna bara du kan göra — de kräver ditt konto och dina designer:

### Steg 1 — Skapa Printful-konto och lägg upp produkterna
1. Skapa konto på <https://www.printful.com> (gratis).
2. Gå till **Product templates / Store → Add product**.
3. Välj produkt (t.ex. Unisex t-shirt, hoodie, keps, mugg) och **ladda upp din
   design** (loggan/trycket du gjort). Placera trycket, välj färger och storlekar.
4. Sätt ett **försäljningspris** per produkt (ditt pris till kunden, ovanpå
   Printfuls tryckkostnad — mellanskillnaden är din vinst).
5. Spara. Upprepa för varje plagg.

> 💡 Tips: Skapa en **"Manual order / API"-store** i Printful (Settings → Stores
> → Choose platform → **Manual order platform / API**). Det ger dig ett Store-ID
> och låter dig lägga ordrar via API:t — vilket är precis vad vår serverfunktion
> gör.

### Steg 2 — Hämta din API-nyckel
1. I Printful: **Settings → Developers → API access tokens**  (eller
   <https://developers.printful.com>).
2. Skapa en **token** och kopiera den. Den ser ut ungefär som `xxxxxxxx-xxxx-...`.
3. **Dela ALDRIG den här nyckeln.** Lägg den aldrig i `shop.js`, `shop.html`
   eller något som skickas till webbläsaren. Den ska bara ligga som en
   *miljövariabel* på servern (se Steg 4).

### Steg 3 — Skriv in produkternas ID i sajten
När produkterna finns i Printful har varje **variant** (kombination av färg +
storlek) ett eget `variant_id`. Du behöver mata in dem i `shop.js` så att en vald
variant kan skickas till Printful.

Du hittar variant-ID:n på två sätt:
- I Printful-produktens API-vy, eller
- Genom att öppna `functions/printful-products.js`-endpointen när den är
  driftsatt (den listar dina produkter + varianter åt dig).

I `shop.js`, i `PRODUCTS`-listan, fyll i fälten `printful` och `variants` — det
finns ett färdigt exempel längst ner i listan (`example-printful-tee`) att kopiera.

---

## Steg 4 — Koppla på riktig betalning (när du är redo)

Din sida ligger på **GitHub Pages**, som bara kan visa statiska filer och inte
kan hålla en hemlig API-nyckel eller ta betalt. För automatisk betalning +
Printful-order behöver du en plats som kan köra serverkod. Två gratisalternativ:

| Alternativ | Passar för | Guide |
|---|---|---|
| **Netlify** | Enklast, gratisnivå räcker gott | `netlify.toml` finns redan |
| **Cloudflare Pages** | Om du redan använder Cloudflare | Byt ut `functions/`-wrappern (se filkommentar) |

### 4a. Driftsätt sajten på Netlify
1. Skapa konto på <https://www.netlify.com> och koppla ditt GitHub-repo.
2. Netlify läser `netlify.toml` automatiskt och publicerar mappen som statisk
   sida + funktionerna i `functions/` som serverless-endpoints.
3. Peka din domän **step1film.com** mot Netlify (Domain settings → Add domain).

### 4b. Lägg in dina hemliga nycklar som miljövariabler
I Netlify: **Site settings → Environment variables**. Lägg till:

```
PRINTFUL_API_TOKEN   = din-printful-token
PRINTFUL_STORE_ID    = ditt-store-id        (om du har flera stores)
STRIPE_SECRET_KEY    = sk_live_...           (när du kopplar Stripe)
```

Se `.env.example` för hela listan. **Dessa värden hamnar aldrig i git** — de
lever bara i Netlifys inställningar.

### 4c. Välj betalning
- **Stripe Checkout** — kort + Klarna, funkar i Sverige, minst kod. Rekommenderas.
- **Snipcart** — kassa som klistras på en statisk sida med HTML-attribut.
- **Swish** — kräver företagsavtal (Swish Handel) via din bank; kan läggas till
  senare vid sidan av kort.

`functions/printful-order.js` är förberedd för att köra *efter* en lyckad
betalning (Stripe webhook) och skapa Printful-ordern automatiskt.

---

## Vad som redan är förberett i repot

| Fil | Vad den gör |
|---|---|
| `functions/printful-products.js` | Hämtar dina produkter/varianter från Printful (nyckeln stannar på servern). |
| `functions/printful-order.js` | Skapar en order i Printful efter betald order. |
| `printful.js` | Frontend-modul: hämtar produkter + skickar order till funktionerna ovan. |
| `shop.js` | Utökad så produkter kan bära riktiga Printful-bilder + `variants`. Faller tillbaka till SVG-mockuper tills du fyllt i riktig data. |
| `netlify.toml` | Driftsättningskonfig för Netlify. |
| `.env.example` | Mall för de hemliga nycklarna (kopieras till serverns miljövariabler). |

### Aktivera Printful-läget i frontend
I `shop.js`, i `CONFIG.printful`, sätt `apiBase` till din funktions-URL:

```js
printful: {
  // Tomt = av (nuvarande läge: SVG-mockuper + mejlbeställning).
  // På Netlify blir detta '/.netlify/functions'
  apiBase: '',
  enabled: false      // sätt true när produkterna och apiBase är på plats
}
```

Så länge `enabled: false` fungerar sajten exakt som idag. Ingenting går sönder
medan du förbereder Printful-sidan.

---

## Snabb ordning att jobba i

1. ✅ Repot är förberett (klart — den här strukturen).
2. ⬜ Skapa Printful-konto + ladda upp dina designer (Steg 1).
3. ⬜ Hämta API-token (Steg 2).
4. ⬜ Fyll i `variants` i `shop.js` (Steg 3).
5. ⬜ Driftsätt på Netlify + lägg in miljövariabler (Steg 4a–4b).
6. ⬜ Koppla Stripe och sätt `CONFIG.printful.enabled = true` (Steg 4c).

När du gjort Steg 1–2 och har din token + produkter: säg till, så hjälper jag dig
fylla i variant-ID:n och koppla betalningen.
