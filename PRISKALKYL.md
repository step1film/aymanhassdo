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

Tio produkter är avlästa i Printful. Sex är fortfarande gissade och
märkta som sådana.

| Produkt | Pris | Vara | Frakt | **Kvar** | Nollpris | Källa |
|---|---:|---:|---:|---:|---:|:--|
| 24FPS HOODIE | 699 | 349 | 65 | **+183** | 461 | avläst |
| SPOILER HOODIE | 629 | 285 | 65 | **+193** | 378 | avläst |
| TAKE ONE SLEEVE 15" | 599 | 225 | 65 | **+230** | 300 | avläst |
| TAKE ONE SLEEVE 13" | 499 | 225 | 65 | **+153** | 300 | avläst |
| GLITCH SLEEVE 15" | 549 | 215 | 65 | **+202** | 287 | avläst |
| GLITCH SLEEVE 13" | 449 | 215 | 65 | **+125** | 287 | avläst |
| ACTION DAD CAP | 399 | 155 | 40 | **+171** | 177 | avläst |
| DIRECTOR'S BEANIE | 349 | 174 | 40 | **+114** | 202 | avläst |
| STEP1 FAN (keps) | 299 | 164 | 40 | **+85** | 189 | avläst |
| DIRECTOR'S MORNING | 175 | 99 | 54 | **+41** | 122 | avläst |
| ROLLING BACKPACK | 649 | 360 | 80 | +119 | 495 | gissad |
| STEP1 JERSEY | 549 | 310 | 65 | +107 | 411 | gissad |
| LIL' DIRECTOR TEE | 399 | 140 | 55 | +171 | 177 | gissad |
| AWESOME MUGG | 249 | 110 | 85 | +56 | 177 | gissad |
| ICON / GEAR STICKERS | 99 | 30 | 35 | +70 | 8 | gissad |

**Ingen produkt ligger minus.**

---

## Muggen tillbaka på 175 kr

Den höjdes till 299 i förra omgången på en gissning: att en 15-ozmugg
kostar omkring 130 kr att trycka och 90 kr att skicka. De avlästa
siffrorna säger 99 kr och 54 kr — gissningen låg 44 % för högt.

**Vid 175 kr blir det 41 kr kvar.** Det är tunt men positivt, och det är
priset du bad om, så det står kvar. Nollpriset ligger på 122 kr.

Att veta: en retur kostar dig hela tryckkostnaden, 153 kr. Det är fyra
sålda muggar för att ta igen en enda retur.

---

## Två priser står kvar på en gissning

**ROLLING BACKPACK (649)** och **STEP1 JERSEY (549)** höjdes från dina
529 och 429 för att gissningen sa att de bara lämnade 26 respektive
14 kr. Muggen visade att gissningarna kan ligga rejält fel åt det
pessimistiska hållet.

Skicka Printfulsiffrorna för de två, så räknar jag om — bär de dina
ursprungliga priser sätter jag tillbaka dem.

**AWESOME MUGG (249)** lämnar 56 kr på en gissning som troligen är för
hög, av samma skäl som Director's Morning. Den är också värd att läsa av.

---

## Retail price i Printful stämmer inte

Priset i Printful debiterar ingen — men det kan hamna på följesedeln i
paketet, och då läser kunden ett annat pris än det hen betalade.

| Produkt | I Printful | I butiken |
|---|---:|---:|
| SPOILER HOODIE | 649 | 629 |
| DIRECTOR'S BEANIE | 285 | 349 |
| STEP1 FAN | 349 | 299 |
| DIRECTOR'S MORNING | 229 | 175 |
| 24FPS HOODIE | 407–441 | 699 |
| ACTION DAD CAP | 349 | 399 |
| TAKE ONE SLEEVE | 499–599 | 499–599 ✔ |

Rätta dem i Printful, eller stäng av priser på följesedeln.

---

## Kvar att läsa av

Rolling Backpack · Step1 Jersey · Awesome Mugg · Lil' Director Tee ·
Icon Stickers · Gear Stickers · (och de dolda: Crew Tee, AD1 Beanie)

---

## Övrigt att räkna med

- **Returer.** 14 dagars ångerrätt gäller, och en returnerad tryckt vara
  kan inte säljas vidare — hela tryckkostnaden är förlorad.
- **Fri frakt över 1 200 kr** kostar 60–80 kr på de ordrar som når dit.
  Med två plagg i korgen bär marginalen det.
- **Månadsavgifter.** Swish Handel kostar 60–100 kr i månaden beroende
  på bank. Vid 100 kr per order behövs ungefär en order i månaden bara
  för att betala Swish.
