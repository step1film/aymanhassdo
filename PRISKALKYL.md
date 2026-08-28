# STEP1 STORE — prisunderlag

Uppdaterad 2026-08-28, i samband med prissänkningen.

Det här är räkningen bakom priserna: vad som blir kvar när moms,
tryckkostnad, frakt och betalavgifter är betalda. Siffrorna är
kalkylunderlag, inte bokföring.

---

## Så räknas en order

Kunden betalar ett pris **inklusive moms**. Av varje hundralapp går
20 kr till Skatteverket (25 % moms räknas som 25/125 av priset).

```
  Kunden betalar            P kr inkl. moms   (+ 79 kr frakt under 1 200 kr)
– moms                      P × 0,20
– tryck och frakt           Printfuls kostnad (ex moms, omvänd skattskyldighet)
– betalavgift               ca 3 % + 2 kr på hela beloppet
= täckningsbidrag
```

**Betalavgiften** är en avrundad värsta-fall-siffra som täcker båda
betalsätten:

| Betalsätt | Avgift |
|---|---|
| Kort inom EES (Stripe) | 1,5 % + 1,80 kr |
| Klarna (via Stripe) | ca 3 % + 2 kr |
| Swish Handel | ca 2 kr per betalning + månadsavgift till banken |

Kalkylen nedan räknar med 3 % + 2 kr, alltså det dyraste alternativet.

> ⚠️ **Tryckkostnaderna nedan är uppskattningar** från Printfuls
> normala EU-priser för respektive produkttyp, omräknade till kronor på
> 11,50 kr/euro. De ÄR INTE hämtade från ditt Printful-konto. Öppna
> Printful → produkten → varianten och läs av "Your price", så byter jag
> ut siffrorna mot de riktiga.

---

## Produkterna, ett i taget

Antaget: en vara per order, kunden betalar 79 kr frakt.

| Produkt | Pris | Moms | Tryck + frakt (uppsk.) | Avgift | **Kvar** |
|---|---:|---:|---:|---:|---:|
| 24FPS HOODIE | 699 | −140 | −298 | −25 | **+299** |
| SPOILER HOODIE | 629 | −126 | −298 | −23 | **+245** |
| TAKE ONE SLEEVE 13" | 499 | −100 | −274 | −19 | **+169** |
| TAKE ONE SLEEVE 15" | 599 | −120 | −286 | −22 | **+234** |
| GLITCH SLEEVE 13" | 449 | −90 | −274 | −18 | **+130** |
| GLITCH SLEEVE 15" | 549 | −110 | −286 | −21 | **+195** |
| DIRECTOR'S BEANIE | 349 | −70 | −207 | −15 | **+121** |
| STEP1 FAN (keps) | 299 | −60 | −207 | −13 | **+82** |
| ROLLING BACKPACK | 529 | −106 | −414 | −20 | **+52** |
| STEP1 JERSEY | 429 | −86 | −368 | −17 | **+21** |
| DIRECTOR'S MORNING (mugg) | 175 | −35 | −195 | −10 | **−2** |

Fraktintäkten (79 kr, varav 63 kr efter moms) ingår i "Kvar".

---

## Vad räkningen säger

**Sju av elva bär sig med god marginal.** Hoodies, fodral, keps och
mössa ligger på 80–300 kr per order. Det är rimligt för tryck på
beställning, där ingen kapitalbindning finns.

**Tre behöver ses över:**

- **DIRECTOR'S MORNING, 175 kr** går back. En 15-ozmugg kostar omkring
  110 kr att trycka och nästan 90 kr att skicka — muggfrakt är dyr för
  att paketet är tungt och ömtåligt. Vid 175 kr betalar du för att sälja
  den. **Lägsta pris för att tjäna något: 249 kr.** Vill du ha en
  billig ingångsprodukt är dekalerna (99 kr) ett bättre val — de väger
  ingenting.

- **STEP1 JERSEY, 429 kr** lämnar ett tjugotal kronor. En enda
  returorder äter upp vinsten på tio sålda. **Föreslaget: 549 kr.**

- **ROLLING BACKPACK, 529 kr** lämnar ett femtiotal. Ryggsäcken är den
  dyraste produkten i sortimentet att tillverka. **Föreslaget: 649 kr.**

**Fri frakt över 1 200 kr** kostar dig ungefär 60–80 kr på de ordrar som
når dit. Med de nya lägre priserna krävs två plagg för att komma över
gränsen, och då är marginalen god nog att bära det. Gränsen kan stå kvar.

---

## Innan butiken öppnas

1. Läs av de riktiga tryckkostnaderna i Printful och stäm av tabellen.
2. Kom ihåg att en retur kostar dig hela tryckkostnaden — 14 dagars
   ångerrätt gäller och varan kan inte säljas vidare.
3. Räkna med Swish Handels månadsavgift (60–100 kr beroende på bank)
   och Stripes eventuella fasta avgifter.
4. Bokför momsen löpande. Den syns aldrig på kontot som "din" — den är
   Skatteverkets från början.
