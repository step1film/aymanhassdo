# Clapperboard-intro — arkiverad teknik

Den scroll-drivna klappan som låg först på step1film.se fram till juli 2026.
Togs bort från sajten (efter introt går besökaren nu direkt till showreelen),
men sparas här för att kunna återanvändas på en annan webbplats.

**Den här mappen publiceras inte.** Namnet börjar med `_`, vilket gör att
GitHub Pages hoppar över den, och `robots.txt` + `netlify.toml` blockerar
sökvägen. Den ligger i git-historiken, inte på webben.

## Innehåll

| Fil | Vad det är |
|---|---|
| `clapperboard.html` | Hela tekniken i **en enda fil** — HTML, CSS och JS inlinat |
| `bg-stage.jpg` | Scenbakgrunden bakom klappan |

Öppna `clapperboard.html` direkt i en webbläsare och scrolla. Inget bygge,
inga beroenden utöver två webbtypsnitt som hämtas från Google Fonts och
jsDelivr (se nedan).

## Hur den fungerar

Hela koreografin styrs av `window.scrollY` mot en osynlig 100vh-hög
scrollzon (`#clapper-zone`). Ingen animation spelar av sig själv — besökaren
"vevar" fram sekvensen med scrollhjulet, vilket är det som gör att det känns
som en filmrulle och inte som en intro man väntar ut.

Två faser, mappade mot 0 → 100vh:

| Scroll | Fas | Vad som händer |
|---|---|---|
| 0 → 0.92 | **CLOSE** | Armen fälls ned (`rotate`), tavlan roterar från snedställd till rakt fram (`rotateX/rotateY`) och skalas upp från 0.42 till 1.05 — easeOutCubic |
| 0.92 → 1.0 | **EXIT** | Klapp-ljudet spelas en gång, hela scenen glider uppåt (`translateY(-100vh)`) och avtäcker innehållet bakom |

Detaljer värda att behålla vid återanvändning:

- **Klapp-ljudet är syntetiserat i Web Audio** (`playClap()`) — ingen ljudfil.
  Brus med exponentiellt avtagande hölje, lågpassfilter vid 2 kHz och en
  peaking-boost vid 480 Hz gör det till ett trä-"tok" i stället för en smäll.
- **Timecode** tickar på riktigt i 25 fps mot besökarens klocka, i
  7-segmentstypsnittet DSEG7 Classic.
- **DAY / NIGHT** sätts efter besökarens lokala timme (06–18 = DAY).
- **ROLL** är ett besöksräknare i `localStorage` — samma besökare ser talet
  öka. Det var den detalj som fick tavlan att kännas levande.
- **Bakgrundstexten** (`initNotebookText`) skriver ut manusrader tecken för
  tecken i flera zoner, med enstaka "felslag" som rättas — `GLITCH`-tabellen
  mappar varje tangent till sin granne på tangentbordet.

## Att tänka på om du flyttar den

- `perspective: 1400px` sitter på `#clapper` — utan den blir 3D-rotationen platt.
- `prefers-reduced-motion` stänger av hela sekvensen. Behåll det.
- Ljudet kräver en användargest först i de flesta webbläsare. Här funkar det
  eftersom scrollningen *är* gesten — trigga aldrig klappet vid sidladdning.
- Två externa typsnitt: **Bebas Neue + Inter** (Google Fonts) och **DSEG7
  Classic** (jsDelivr, `@font-face` överst i `<style>`). Vill du vara helt
  oberoende, ladda ner dem och peka om URL:erna.
- Sidan har `noindex, nofollow` i `<head>`. Ta bort det om den ska
  publiceras någon annanstans.
