const {test,expect}=require('@playwright/test');
async function setup(page,sounds={}) {
 await page.goto('./');
 await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s));},sounds);
 await page.reload();
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('en'));
 await page.waitForTimeout(100);
}
test('EN excludes words requiring unmastered sounds and refreshes parent mastery',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const allowed=await page.evaluate(()=>window.PhonikaENReading.availableWords().map(w=>w.word));
 expect(allowed).toContain('sat');expect(allowed).not.toContain('bat');expect(allowed).not.toContain('hat');
 await expect(page.locator('#word')).not.toBeEmpty();
 await page.evaluate(()=>{localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true,b:true}));window.PhonikaENReading.refresh()});
 expect(await page.evaluate(()=>window.PhonikaENReading.availableWords().map(w=>w.word))).toContain('bat');
});
test('EN empty state and FR placeholder without RU words',async({page})=>{
 await setup(page,{});
 await expect(page.locator('#languageReadingNotice')).toContainText('Not enough sounds learned yet');
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('fr'));
 await expect(page.locator('#languageReadingNotice')).toContainText('Le parcours de lecture en français sera bientôt disponible.');
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('ru'));
 await expect(page.locator('#languageReadingNotice')).toBeHidden();
});
test('EN independent progress, reading controls and navigation',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const ruBefore=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#showPicture').click();
 await expect(page.locator('#pic')).toBeVisible();
 await page.locator('#readOk').click();
 await expect(page.locator('#readOk')).toContainText('Continue');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'))).not.toBeNull();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ruBefore);
 await page.locator('#readOk').click();
 await expect(page.locator('#word')).not.toBeEmpty();
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('ru'));
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ruBefore);
});
