# Presspanelen — sparad, inte raderad

Panel 04 visade tre presscitat. Den byttes mot ett CV, men markupen
ligger kvar här om citaten ska tillbaka.

**Så här återställer du den:**

1. Klistra in `press-panel.html` i `index.html` där panel 04 står nu.
2. Ta bort `hidden`-attributet på `<section>`.
3. Texterna finns kvar i `i18n.js` under nycklarna `pq1`–`pq3m`
   och `p4Title` / `p4Meta`. De skrevs om för CV:t — de gamla
   lyder:

   ```
   p4Title: 'Med deras<br>ord'   /  'In their<br>words'
   p4Meta:  'Press & kundomdömen' / 'Press & client notes'
   ```

Numrering, prickar, fokusenhetens totalsiffra och rullhöjden räknas
om automatiskt efter hur många paneler som är påslagna — du behöver
inte röra något annat.
