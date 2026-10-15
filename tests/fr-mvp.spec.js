const {test,expect}=require('@playwright/test');
test('FR curriculum has 23/20/12 words and NEZ uses EZ',async({page})=>{
 await page.goto('./');
 const data=await page.evaluate(()=>({words:PhonikaFR.words.map(w=>w.word),counts:[1,2,3].map(l=>PhonikaFR.words.filter(w=>w.level===l).length),nez:PhonikaFR.words.find(w=>w.word==='NEZ')}));
 expect(data.counts).toEqual([23,20,12]);expect(new Set(data.words).size).toBe(55);
 expect(data.nez.segments.map(s=>s.grapheme)).toEqual(['N','EZ']);
 expect(data.nez.silentLetters).toEqual([]);
});
test('FR eligibility separates O phonemes and silent E',async({page})=>{
 await page.goto('./');
 const result=await page.evaluate(()=>{
  localStorage.removeItem(PhonikaFR.progressKey);
  const req=w=>PhonikaFR.requirements(PhonikaFR.words.find(x=>x.word===w));
  req('MOTO').forEach(k=>PhonikaFR.set(k,true));
  const moto=PhonikaFR.available().some(w=>w.word==='MOTO'),bol=PhonikaFR.available().some(w=>w.word==='BOL');
  req('PILE').filter(k=>!k.startsWith('rule:')).forEach(k=>PhonikaFR.set(k,true));
  const pileBefore=PhonikaFR.available().some(w=>w.word==='PILE');
  PhonikaFR.set('rule:silent-final-e',true);
  return {moto,bol,pileBefore,pileAfter:PhonikaFR.available().some(w=>w.word==='PILE')};
 });
 expect(result).toEqual({moto:true,bol:false,pileBefore:false,pileAfter:true});
});
test('FR Parent Mode saves correspondence mastery after reload',async({page})=>{
 await page.goto('./');await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.locator('#parentOpen').click();
 await page.locator('.parent-language-option').filter({hasText:/^FR$/}).click();
 await page.locator('.tone-known .collapse-toggle').click();
 const button=page.locator('#knownSounds [data-sound="o|o"]');
 await expect(button).toBeVisible();await button.click();
 await expect(button).toHaveAttribute('aria-pressed','true');
 await page.reload();await page.locator('#parentOpen').click();
 await expect(page.locator('#knownSounds [data-sound="o|o"]')).toHaveAttribute('aria-pressed','true');
});
