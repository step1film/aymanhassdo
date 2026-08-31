# SEO — så syns step1film.se i Småland och Jönköpings län

Två delar: vad som är gjort i koden, och vad bara du kan göra.
Den andra delen är den som avgör mest.

---

## Vad som är gjort

### Strukturerad data

Sajten talar om för Google vad verksamheten är och **var** den finns.
Tre block i `index.html`:

| Block | Säger |
|-------|-------|
| `Person` | Vem Ayman är, vad han kan, vilka språk |
| `ProfessionalService` + `LocalBusiness` | Att STEP1FILM är ett företag, vad det erbjuder, och vilka orter det tar uppdrag i |
| `WebSite` | Sajten som helhet |

Det viktigaste fältet för lokal sökning är `areaServed`. Det listar
Jönköpings län, Småland och orterna Jönköping, Värnamo, Vaggeryd,
Nässjö, Gislaved och Eksjö.

`hasOfferCatalog` listar de sex tjänsterna från panel 03 — planering,
manus, inspelning, klipp, ljud och filmteam. Det är de orden någon
faktiskt söker på.

**Kontrollera att Google läser det rätt:**
<https://search.google.com/test/rich-results> → klistra in
`https://step1film.se/`

### Titel och beskrivning

```
Filmproduktion i Småland & Jönköpings län — STEP1FILM
```

Söktermen först, varumärket sist. Ingen känner till STEP1FILM än, men
många söker på "filmproduktion Småland".

### Rubriken

Sidans `<h1>` lyder *"STEP1FILM — filmproduktion i Småland och
Jönköpings län"*. Bara märket syns i bild; resten läses av sökmotorer
och skärmläsare.

Det är inte fusk: texten säger samma sak som resten av sidan. Att göma
text som säger *något annat* än sidan visar heter cloaking och ger
straff. Skriv aldrig in något i den taggen som inte stämmer med sidan.

### Svenskan står i filen, inte bara i webbläsaren

Texterna byts av `i18n.js` när sidan laddas, och svenska är standard.
Men *källkoden* var skriven på engelska: `<html lang="sv">` överst och
"The Dream", "Selected Works", "Let's Work" i själva taggarna. Google
kör visserligen JavaScript och såg svenskan till slut, men den första
avläsningen — den som går snabbast och sker oftast — läste en engelsk
sida som utgav sig för att vara svensk. Detsamma gällde alla robotar
som inte kör JavaScript alls, och förhandsvisningarna när någon delar
länken.

Nu står de svenska strängarna i `index.html` från början, precis som i
`store.html`. Språkväljaren fungerar likadant som förut: engelskan
ligger kvar i `i18n.js` och läggs på med ett klick.

⚠️ Ändrar du en text i admin → Texter ändras `i18n.js`. Den svenska
raden i `index.html` följer **inte** med automatiskt — den är bara
utgångsläget som visas innan skriptet hunnit köra. Skiljer de sig åt
syns admin-texten på skärmen, men Google kan hinna läsa den gamla.
Säg till när en text ändrats, så skriver jag om båda.

### Typsnitten flyttade hem

Låg hos Google Fonts och jsdelivr, ligger nu i `assets/fonts/`.
Tre vinster:

- **GDPR.** Ett anrop till Google Fonts skickar besökarens IP till
  Google innan sidan ens ritats. Det har fällts i domstol i EU.
  Nu lämnar ingenting sajten utom videospelaren.
- **Fart.** Två DNS-slagningar och två TLS-handskakningar färre.
- **Konsekvens.** DSEG7-typsnittet hämtades från jsdelivr, som vår egen
  säkerhetsheader blockerar — det hade slutat fungera vid en flytt till
  Netlify. Det användes dessutom aldrig, så det är borttaget.

### Hastighet

Mätt på simulerad mobil:

| Mått | Värde | Googles gräns för "bra" |
|------|-------|-------------------------|
| LCP (största innehållet syns) | 220 ms | under 2 500 ms |
| CLS (hoppar layouten) | 0,012 | under 0,1 |

Gott om marginal. Nedräkningen i introt påverkar inte måtten — den
ligger ovanpå en sida som redan ritats.

### Övrigt

- `sitemap.xml` med `lastmod` på alla sex sidor. Butiksraden pekade
  på `/shop.html` — det gamla namnet. Omdirigeringen från det namnet
  står i `netlify.toml`, men sajten ligger på GitHub Pages, som inte
  läser den filen: sökmotorn skickades alltså till en 404. Raden lyder
  nu `/store`, samma adress som butikens egen `canonical`.
- `robots.txt` släpper in allt utom `/admin/` och `/_archive/`
- Varje sida har egen titel, beskrivning och `canonical`
- Butiken har `Product`-schema med pris och lagerstatus på 14 produkter
- Svenska är standardspråk (`<html lang="sv">`)

---

## Vad bara du kan göra

Koden är i ordning. Det som återstår väger tyngre, och kräver dig.

### 1. Google Business Profile — det enskilt viktigaste

Söker någon "filmare Jönköping" visar Google först en **kartruta** med
tre företag. Den rutan går inte att ta sig in i med kod. Den kräver ett
verifierat företag.

<https://business.google.com> → Lägg till företag

- **Kategori:** *Videoproduktionstjänst* (huvudkategori)
- **Ytterligare kategorier:** Filmproduktionsbolag, Fotograf
- **Område:** vill du inte visa din adress, välj *"Jag levererar varor
  och tjänster till mina kunder"* och ange Jönköpings län som
  serviceområde. Då syns aldrig gatan.
- Verifiering sker med ett brev, videosamtal eller telefon. Räkna med
  en till två veckor.

Lägg sedan upp bilder: stillbilder från inspelningar, porträttet, en
affisch. Företag med bilder får väsentligt fler klick.

**Säg till när profilen finns** — då lägger jag in adressen och
kartlänken i den strukturerade datan, och kopplar ihop dem.

### 2. Länkar från andra sajter

Google litar på en sajt som andra länkar till. Ingen av dem kostar
pengar:

- **Vaggeryds kommun, Värnamo kommun, Region Jönköpings län** — har ofta
  register över kulturaktörer i länet
- **Film i Jönköpings län / regionens filmresurscentrum** — be om att stå
  med bland regionens filmare
- **Kulturella listor** — Kulturrådet, Svenska Filminstitutets
  branschregister
- **Story AB** — samproducenten. Be dem länka till step1film.se från
  sin projektsida för Birds of Passage.
- **Uppdragsgivarna** — Kinnarps, Hemköp, Arcus, Vaggeryds kommun.
  Har någon av dem en "det här är filmen vi gjorde"-sida, be om en länk.
- **Festivalerna** — CortoDino och Cefalù har sannolikt kvar sidor från
  2020 med filmen. Be dem länka till sajten.

Fem sådana länkar gör mer för rankingen än allt jag skrivit i koden.

### 3. Skriv om orterna

Google rankar på det som står på sidan, inte bara i koden. Just nu står
"Småland" några gånger. Naturliga ställen att skriva ut orterna:

- Panel 02, reklamfilmen: *"Regi och foto för varumärken i Vaggeryd,
  Värnamo och Jönköping"* — om det stämmer
- Kontaktpanelen: en rad om var du utgår ifrån
- Filmerna: var de spelades in

**Skriv aldrig in en ort du inte arbetat i.** Det syns, och det gör
sajten mindre trovärdig för både Google och den som läser.

Allt går att ändra i admin → Texter.

### 4. En egen sida per tjänst

**Det här är svaret på frågan om varför hela sajten syns som en enda
träff.** Google indexerar adresser, inte avsnitt. `#films` och
`#about` är samma adress som `/` — panelerna sveper in med JavaScript
utan att adressen ändras, så det finns bara ett dokument att indexera.
Att lägga in länkar till `#films` hade inte ändrat det: en sökmotor
gör aldrig en egen träff av ett ankare. (Innehållet i panelerna läses
däremot — de ligger alla i HTML:en från början, bara dolda med
`clip-path`. Ingenting är gömt för Google.)

Startsidan kan alltså bara ranka på *en* huvudsökning, och den är satt
till "filmproduktion Småland / Jönköpings län". Vill du ha fler
sökningar behövs fler adresser:

En ensidig webbplats kan bara ranka på ett fåtal sökningar. Vill du på
allvar synas på "reklamfilm Jönköping" och "dokumentärfilm Småland"
behövs en sida för varje — med egen adress, egen rubrik och 300–500 ord
riktig text.

Förslag i tur och ordning:

1. `/reklamfilm-smaland/` — kunderna, arbetssättet, exempel
2. `/dokumentarfilm/` — Birds of Passage, Nya ord, arbetsprocessen
3. `/film-for-foretag-jonkoping/` — vad ett företag får, hur det går till

Säg till så bygger jag dem. Texten behöver komma från dig — det är dina
uppdrag och ditt sätt att arbeta, och det märks direkt om den är påhittad.

### 5. Google Search Console

<https://search.google.com/search-console> → lägg till `step1film.se`,
verifiera med en DNS-post hos one.com, och skicka in
`https://step1film.se/sitemap.xml`.

Där ser du vad folk faktiskt söker på när de hittar dig. Efter en månad
vet du vilka ord som är värda att skriva mer om — det är bättre än att
gissa.

---

## Vad du inte ska göra

- **Köp aldrig länkar.** Google hittar dem och sajten faller.
- **Fyll inte sidan med ortsnamn.** "Filmproduktion Jönköping Värnamo
  Nässjö Eksjö Vaggeryd" i en rad läses som spam.
- **Kopiera inte text från en annan filmares sajt.** Dubblettinnehåll
  rankar inte, och det är dessutom deras.
- **Vänta inte på resultat i morgon.** Ny strukturerad data syns i
  Search Console på några dagar. Ranking i ett nytt område tar tre till
  sex månader. Google Business Profile går snabbast.

---

## Ordningen jag skulle ta det i

1. Google Business Profile — **börja här**
2. Search Console + skicka in sitemap
3. Be om länkar från Story AB och två uppdragsgivare
4. Skriv ut orterna i texten, via admin
5. Bygg tjänstesidorna när du har text till dem
