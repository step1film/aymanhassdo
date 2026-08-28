# STEP1 STORE — prisunderlag

Uppdaterad 2026-08-28, efter andra avstämningen mot Printful.

Det här är räkningen bakom priserna: vad som blir kvar när moms,
tryckkostnad, frakt och betalavgifter är betalda.

---

## Räkningen

Kunden betalar ett pris **inklusive moms**, plus 79 kr frakt om ordern
är under 1 200 kr. Av bruttot går en femtedel till Skatteverket — 25 %
moms räknas som 25/125, alltså 20 % av det kunden betalar.

```
  Kunden betalar          P + 79 kr
– moms                    20 % av (P + 79)
– Printful, vara          deras pris, ex moms (omvänd skattskyldighet)
– Printful, frakt         deras fraktpris till Sverige
– betalavgift             3 % av (P + 79) + 2 kr
= täckningsbidrag
```

**Betalavgiften** räknas på det dyraste betalsättet, så siffrorna nedan
håller oavsett hur kunden betalar:

| Betalsätt | Avgift |
|---|---|
| Kort inom EES (Stripe) | 1,5 % + 1,80 kr |
| Klarna (via Stripe) | ca 3 % + 2 kr ← **kalkylen räknar med denna** |
| Swish Handel | ca 2 kr per betalning + månadsavgift till banken |

Förenklat: **täckningsbidrag = 0,77 × pris + 59 kr − Printfulkostnad.**

Fraktspannen i Printful (t.ex. 65–166 kr) är olika världsdelar. Vi
levererar bara till Sverige, så den **lägre** änden gäller. Varupriset
räknas tvärtom på den **högre** änden — dyraste storleken i serien.

---

## Sortimentet

Alla priser i butiken är nu räknade mot avlästa Printfulsiffror.

| Produkt | Pris | Vara | Frakt | **Kvar** | Marginal | Nollpris |
|---|---:|---:|---:|---:|---:|---:|
| 24FPS HOODIE | 699 | 349 | 65 | **+183** | 24 % | 461 |
| ROLLING BACKPACK | 649 | 375 | 102 | **+82** | 11 % | 543 |
| SPOILER HOODIE | 629 | 285 | 65 | **+193** | 27 % | 378 |
| TAKE ONE SLEEVE 15" | 599 | 225 | 65 | **+230** | 34 % | 300 |
| STEP1 JERSEY | 549 | 259 | 40 | **+183** | 29 % | 312 |
| GLITCH SLEEVE 15" | 549 | 215 | 65 | **+202** | 32 % | 287 |
| TAKE ONE SLEEVE 13" | 499 | 225 | 65 | **+153** | 26 % | 300 |
| GLITCH SLEEVE 13" | 449 | 215 | 65 | **+125** | 24 % | 287 |
| ACTION DAD CAP | 399 | 155 | 40 | **+171** | 36 % | 177 |
| LIL' DIRECTOR TEE | 399 | 109 | 40 | **+217** | 45 % | 117 |
| DIRECTOR'S BEANIE | 349 | 174 | 40 | **+114** | 27 % | 202 |
| CREW TEE (dold) | 349 | 175 | 46 | **+107** | 25 % | 211 |
| AD1 BEANIE (dold) | 309 | 174 | 40 | **+83** | 21 % | 202 |
| DIRECTOR'S MORNING | 299 | 99 | 54 | **+136** | 36 % | 122 |
| STEP1 FAN | 299 | 164 | 40 | **+85** | 23 % | 189 |
| AWESOME MUGG | 249 | 65 | 47 | **+139** | 42 % | 69 |
| ICON STICKERS | 99 | 29 | 31 | **+75** | 42 % | 2 |
| GEAR STICKERS¹ | 99 | 29 | 31 | **+75** | 42 % | 2 |

¹ Inte avläst för sig — samma produkt som Icon Stickers.

**Ingen produkt ligger minus.** Snittet är 142 kr per order och lägsta
marginalen 11 % (ryggsäcken). Alla priser står som de ligger.

### Ryggsäcken hade gått back

Den höjdes från 529 till 649 på en gissning. Avläsningen visar att
gissningen var för mild: ryggsäcken kostar 375 kr att tillverka och
**102 kr att skicka** — dubbelt mot ett plagg, för att den är skrymmande.
**På 529 kr hade varje såld ryggsäck kostat dig 11 kr.** Nollpriset
ligger på 543 kr, alltså över det gamla priset. Den är fortfarande
sortimentets tunnaste produkt.

### Tre som var bättre än gissat

Awesome Mugg kostar 65 kr att trycka, inte 110 — den lämnar 139 kr på
249, inte 56 som tabellen sa. Lil' Director Tee kostar 109 och lämnar
217 kr, sortimentets bästa marginal. Jerseyn kostar 259 i stället för
310. Priserna står kvar; en produkt som tål ett lägre pris ska inte
säljas billigare.

### CREW TEE höjd från 289 till 349

Produkten är dold i butiken, så ingen har kunnat köpa den. På 289 kr
hade den lämnat 60 kr; på 349 blir det 107. 349 är också priset som
redan står i Printful. Säg till om du vill ha tillbaka 289.

## Regeln: priset går bara uppåt

När en avläsning visar att en produkt tål ett lägre pris **sänks det
inte**. Priset står kvar på den nivå som ger bäst vinst, och avläsningen
används bara till att upptäcka priser som är för låga.

Muggen är exemplet. Den höjdes till 299 kr på en gissning: att en
15-ozmugg kostar omkring 130 kr att trycka och 90 kr att skicka. De
avlästa siffrorna säger 99 och 54 — gissningen låg 44 % för högt, och
muggen hade burit sitt ursprungliga pris på 175 kr med 41 kr kvar.

**Priset står kvar på 299 kr**, där det ger 136 kr i stället för 41.
Nollpriset ligger på 122 kr, så marginalen är god.

Detsamma gäller ryggsäcken och jerseyn när deras siffror kommer: visar
de att 529 och 429 hade gått ihop, står 649 och 549 kvar ändå.

---

## Kvar att läsa av

**Gear Stickers.** Den enda produkten som inte lästs av för sig.
Den är samma dekalark som Icon Stickers, så siffrorna är rimliga
— men läs av den när du ändå är inne.

**ON SET CAP** finns inte i butiken än (den väntar på bilder), men
siffrorna är avlästa: 155 kr + 40 kr frakt. På 349 kr skulle den lämna
133 kr. Variant-id:na ligger sparade i katalogen, så den är snabb att
lägga in.

## Retail price i Printful stämmer inte

Priset i Printful debiterar ingen — men det kan hamna på följesedeln i
paketet, och då läser kunden ett annat pris än det hen betalade. Elva
av arton skiljer sig.

| Produkt | I Printful | I butiken |
|---|---:|---:|
| 24FPS HOODIE | 407–441 | 699 |
| ROLLING BACKPACK | 699 | 649 |
| SPOILER HOODIE | 649 | 629 |
| STEP1 JERSEY | 429 | 549 |
| ACTION DAD CAP | 349 | 399 |
| LIL' DIRECTOR TEE | 299 | 399 |
| DIRECTOR'S BEANIE | 285 | 349 |
| AD1 BEANIE | 285 | 309 |
| STEP1 FAN | 349 | 299 |
| DIRECTOR'S MORNING | 229 | 299 |
| AWESOME MUGG | 229 | 249 |
| TAKE ONE SLEEVE | 499–599 | 499–599 ✔ |
| CREW TEE | 349 | 349 ✔ |
| ICON STICKERS | 99 | 99 ✔ |

Rätta dem i Printful, eller stäng av priser på följesedeln.

## Övrigt att räkna med

- **Returer.** 14 dagars ångerrätt gäller, och en returnerad tryckt vara
  kan inte säljas vidare — hela tryckkostnaden är förlorad.
- **Fri frakt över 1 200 kr** kostar 60–80 kr på de ordrar som når dit.
  Med två plagg i korgen bär marginalen det.
- **Månadsavgifter.** Swish Handel kostar 60–100 kr i månaden beroende
  på bank. Vid 100 kr per order behövs ungefär en order i månaden bara
  för att betala Swish.
