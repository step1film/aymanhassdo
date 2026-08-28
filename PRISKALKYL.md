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

Femton produkter är avlästa i Printful. Tre är fortfarande gissade och
märkta som sådana.

| Produkt | Pris | Vara | Frakt | **Kvar** | Nollpris | Källa |
|---|---:|---:|---:|---:|---:|:--|
| 24FPS HOODIE | 699 | 349 | 65 | **+183** | 461 | avläst |
| ROLLING BACKPACK | 649 | 375 | 102 | **+82** | 543 | avläst |
| SPOILER HOODIE | 629 | 285 | 65 | **+193** | 378 | avläst |
| TAKE ONE SLEEVE 15" | 599 | 225 | 65 | **+230** | 300 | avläst |
| STEP1 JERSEY | 549 | 259 | 40 | **+183** | 312 | avläst |
| GLITCH SLEEVE 15" | 549 | 215 | 65 | **+202** | 287 | avläst |
| TAKE ONE SLEEVE 13" | 499 | 225 | 65 | **+153** | 300 | avläst |
| GLITCH SLEEVE 13" | 449 | 215 | 65 | **+125** | 287 | avläst |
| ACTION DAD CAP | 399 | 155 | 40 | **+171** | 177 | avläst |
| LIL' DIRECTOR TEE | 399 | 140 | 55 | +171 | 177 | gissad |
| DIRECTOR'S BEANIE | 349 | 174 | 40 | **+114** | 202 | avläst |
| CREW TEE (dold) | 349 | 175 | 46 | **+107** | 211 | avläst |
| AD1 BEANIE (dold) | 309 | 174 | 40 | +83 | 202 | gissad |
| DIRECTOR'S MORNING | 299 | 99 | 54 | **+136** | 122 | avläst |
| STEP1 FAN | 299 | 164 | 40 | **+85** | 189 | avläst |
| AWESOME MUGG | 249 | 110 | 85 | +56 | 177 | gissad |
| ICON STICKERS | 99 | 29 | 31 | **+75** | 2 | avläst |
| GEAR STICKERS | 99 | 29 | 31 | **+75** | 2 | avläst¹ |

¹ Samma produkt som Icon Stickers.

**Ingen produkt ligger minus.**

### Ryggsäcken hade gått back

Den höjdes från 529 till 649 på en gissning. Avläsningen visar att
gissningen var för mild: ryggsäcken kostar 375 kr att tillverka och
**102 kr att skicka** — dubbelt mot ett plagg, för att den är skrymmande.
**På 529 kr hade varje såld ryggsäck kostat dig 11 kr.** Nollpriset
ligger på 543 kr, alltså över det gamla priset.

### Jerseyn kostade mindre än gissat

258,52 kr och 40 kr i frakt mot gissade 310 och 65. På 549 kr blir det
183 kr kvar i stället för de 107 tabellen sa tidigare. Priset står kvar
enligt regeln nedan.

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

## Tre priser står kvar på en gissning

**LIL' DIRECTOR TEE (399)**, **AWESOME MUGG (249)** och den dolda
**AD1 BEANIE (309)** är inte avlästa. Awesome Mugg är den enda som ser
tunn ut, och gissningen är sannolikt för hög — Director's Morning
visade sig kosta 99 kr att trycka, inte 130. Läs av den när du har
vägen förbi.

**ON SET CAP** finns inte i butiken än (den väntar på bilder), men
siffrorna är avlästa: 155 kr + 40 kr frakt. På 349 kr skulle den lämna
133 kr. Variant-id:na ligger sparade i katalogen.

## Retail price i Printful stämmer inte

Priset i Printful debiterar ingen — men det kan hamna på följesedeln i
paketet, och då läser kunden ett annat pris än det hen betalade.

| Produkt | I Printful | I butiken |
|---|---:|---:|
| 24FPS HOODIE | 407–441 | 699 |
| ROLLING BACKPACK | 699 | 649 |
| SPOILER HOODIE | 649 | 629 |
| STEP1 JERSEY | 429 | 549 |
| ACTION DAD CAP | 349 | 399 |
| DIRECTOR'S BEANIE | 285 | 349 |
| STEP1 FAN | 349 | 299 |
| DIRECTOR'S MORNING | 229 | 299 |
| TAKE ONE SLEEVE | 499–599 | 499–599 ✔ |
| CREW TEE | 349 | 349 ✔ |
| ICON STICKERS | 99 | 99 ✔ |

Rätta dem i Printful, eller stäng av priser på följesedeln.

## Kvar att läsa av

Lil' Director Tee · Awesome Mugg · AD1 Beanie (dold)

## Övrigt att räkna med

- **Returer.** 14 dagars ångerrätt gäller, och en returnerad tryckt vara
  kan inte säljas vidare — hela tryckkostnaden är förlorad.
- **Fri frakt över 1 200 kr** kostar 60–80 kr på de ordrar som når dit.
  Med två plagg i korgen bär marginalen det.
- **Månadsavgifter.** Swish Handel kostar 60–100 kr i månaden beroende
  på bank. Vid 100 kr per order behövs ungefär en order i månaden bara
  för att betala Swish.
