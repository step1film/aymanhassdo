# STEP1 STORE — prisunderlag

Uppdaterad 2026-08-28, efter avstämning mot Printful.

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

---

## Avlästa Printfulpriser

Tre produkter är avlästa i Printful (2026-08-28). Fraktpriset står som
ett spann; den lägre änden gäller Sverige, den högre gäller fjärran
länder som vi ändå inte levererar till.

| Produkt | Printful vara | Printful frakt (SE) |
|---|---:|---:|
| SPOILER HOODIE (unisex) | 255–285 kr | 65 kr |
| DIRECTOR'S BEANIE | 174 kr | 40 kr |
| THE GLITCH SLEEVE | 189–215 kr | 65 kr |

Kalkylen räknar genomgående med den **högre** änden av varupriset —
alltså det dyraste plagget i serien, den dyraste storleken.

Resten av sortimentet är uppskattat utifrån de tre avlästa: hoodies och
fodral delar produkt med de avlästa och har därför samma siffra, medan
mugg, ryggsäck, jersey, kepsar, barn-t-shirt och dekaler är gissade
utifrån produkttyp. **De behöver läsas av i Printful.**

---

## Sortimentet

| Produkt | Pris | Kostnad | **Kvar** | Nollpris | Källa |
|---|---:|---:|---:|---:|:--|
| 24FPS HOODIE | 699 | 350 | **+247** | 378 | uppskattad¹ |
| SPOILER HOODIE | 629 | 350 | **+193** | 378 | avläst |
| TAKE ONE SLEEVE 15" | 599 | 280 | **+240** | 287 | uppskattad¹ |
| TAKE ONE SLEEVE 13" | 499 | 280 | **+163** | 287 | uppskattad¹ |
| GLITCH SLEEVE 15" | 549 | 280 | **+202** | 287 | avläst |
| GLITCH SLEEVE 13" | 449 | 280 | **+125** | 287 | avläst |
| ROLLING BACKPACK | 649 | 440 | **+119** | 495 | uppskattad |
| STEP1 JERSEY | 549 | 375 | **+107** | 411 | uppskattad |
| DIRECTOR'S BEANIE | 349 | 214 | **+114** | 202 | avläst |
| ACTION DAD CAP | 399 | 230 | **+136** | 222 | uppskattad |
| LIL' DIRECTOR TEE | 399 | 195 | **+171** | 177 | uppskattad |
| DIRECTOR'S MORNING | 299 | 220 | **+69** | 209 | uppskattad |
| STEP1 FAN (keps) | 299 | 230 | **+59** | 222 | uppskattad |
| AWESOME MUGG | 249 | 195 | **+56** | 177 | uppskattad |
| ICON / GEAR STICKERS | 99 | 65 | **+70** | 8 | uppskattad |

¹ Samma Printfulprodukt som den avlästa raden ovanför.

**Ingen produkt ligger minus.**

---

## Tre priser ändrades

| Produkt | Önskat | Satt | Varför |
|---|---:|---:|---|
| DIRECTOR'S MORNING | 175 | **299** | Gick back 26 kr per såld mugg. En mugg kostar omkring 130 kr att trycka och 90 kr att skicka — muggfrakt är dyr för att paketet är tungt och ömtåligt. Nollpriset ligger på 209 kr. |
| STEP1 JERSEY | 429 | **549** | Lämnade 14 kr. En enda retur åt upp vinsten på tio sålda. |
| ROLLING BACKPACK | 529 | **649** | Lämnade 26 kr. Ryggsäcken är dyrast i sortimentet att tillverka. |

Övriga priser står som önskat.

---

## Två som är tunna men positiva

**STEP1 FAN, 299 kr** lämnar 59 kr och **AWESOME MUGG, 249 kr** lämnar
56 kr. Båda bygger på uppskattade kostnader. Stämmer gissningen är de
lönsamma; ligger Printful 50 kr högre än antaget är de det inte. Läs av
dem innan butiken öppnar.

---

## Att göra innan butiken öppnas

1. **Läs av resten i Printful.** Mugg, ryggsäck, jersey, kepsar,
   barn-t-shirt och dekaler är uppskattade. Skicka siffrorna så räknas
   tabellen om.

2. **Uppdatera "Retail price" i Printful.** Där står fortfarande gamla
   priser — 649 kr för Spoiler Hoodie som nu kostar 629, och 285 kr för
   mössan som nu kostar 349. Priset i Printful debiterar ingen, men det
   kan hamna på följesedeln i paketet, och då läser kunden ett annat
   pris än det hen betalade.

3. **Räkna med returer.** 14 dagars ångerrätt gäller, och en returnerad
   tryckt vara kan inte säljas vidare — hela tryckkostnaden är förlorad.
   Vid 100 kr i täckningsbidrag krävs tre nya sålda för att ta igen en
   retur på en hoodie.

4. **Fri frakt över 1 200 kr** kostar 60–80 kr på de ordrar som når dit.
   Med två plagg i korgen är marginalen god nog att bära det.

5. **Månadsavgifter.** Swish Handel kostar 60–100 kr i månaden beroende
   på bank. Det är fasta kostnader som ligger utanför tabellen — vid
   100 kr per order behövs alltså ungefär en order i månaden bara för
   att betala Swish.
