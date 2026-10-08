const {test,expect}=require('@playwright/test');
async function prepare(page){await page.goto('./');await page.evaluate(()=>localStorage.clear());await page.reload();await page.locator('#lettersTab').click();}
test('RU Sounds remain Russian and switch EN FR RU without reload',async({page})=>{
 await prepare(page);await expect(page.locator('#letterCard')).toContainText(/[А-ЯЁ]/);
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await expect(page.locator('#letterCard')).toContainText(/[A-Z]/);await expect(page.locator('#letterCard')).not.toContainText(/[А-ЯЁ]/);
 expect(await page.evaluate(()=>PhonikaSounds.inventory())).toContain('sh');
 await page.evaluate(()=>PhonikaI18n.setLanguage('fr'));await expect(page.locator('#letterCard')).not.toContainText(/[А-ЯЁ]/);
 await expect(page.locator('#languageSoundNotice')).toBeVisible();
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));await expect(page.locator('#letterCard')).toContainText(/[А-ЯЁ]/);
});
test('EN Sounds mastery uses EN storage, unlocks eligible Reading, leaves RU untouched',async({page})=>{
 await prepare(page);const before=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 await expect(page.locator('#letterCard')).not.toBeEmpty();
 await page.locator('#letterKnown').click();
 const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('phonika-en-sound-progress')||'{}'));
 expect(data.s.self).toBe(1);expect(data.s.mastered).toBe(false);
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(before);
 expect(await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word))).not.toContain('sat');
 await page.evaluate(()=>{localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true}));PhonikaENReading.refresh()});
 expect(await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word))).toContain('sat');
});
test('EN help does not grant mastery; FR audio disabled',async({page})=>{
 await prepare(page);await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 await page.locator('#letterHelp').click();await page.locator('#letterKnown').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('phonika-en-sound-progress')||'{}'))).toEqual({});
 await page.evaluate(()=>PhonikaI18n.setLanguage('fr'));
 await expect(page.locator('#letterHelp')).toBeDisabled();
 await expect(page.locator('#letterShowPicture')).toBeDisabled();
});
