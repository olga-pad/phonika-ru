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
 await expect(page.locator('#readOk')).toHaveText('Next word →');
 const beforeWord=await page.locator('#word').innerText();
 await page.locator('#readOk').click();
 await expect(page.locator('#word')).not.toHaveText(beforeWord);
 expect(await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'))).toBeNull();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ruBefore);
 await page.locator('#readOk').click();
 await expect(page.locator('#readOk')).toContainText('Continue');
 await page.locator('#readOk').click();
 await expect(page.locator('#word')).not.toBeEmpty();
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('ru'));
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ruBefore);
});

test('Help me read changes main action to Next word without mastery',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const word=await page.locator('#word').innerText();
 await page.locator('#help').click();
 await expect(page.locator('#readOk')).toHaveText('Next word →');
 await page.locator('#readOk').click();
 await expect(page.locator('#word')).not.toHaveText(word);
 expect(await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'))).toBeNull();
});
test('EN navigation and dinosaur advance only after independent reading',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const before=await page.locator('#word').innerText();
 const progress=()=>page.locator('#readingView .dino-step.done').count();
 expect(await progress()).toBe(0);
 await page.locator('#showPicture').click();
 await page.locator('#readOk').click();
 expect(await progress()).toBe(0);
 await page.locator('#readOk').click();
 await expect(page.locator('#readOk')).toHaveText('Continue →');
 expect(await progress()).toBe(1);
 await page.locator('#readingView .nav-prev').click();
 await expect(page.locator('#word')).toHaveText(before);
 await page.locator('#readingView .nav-next').click();
 await expect(page.locator('#word')).not.toHaveText(before);
});
test('EN full session completes and Again restarts',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 await page.evaluate(()=>{document.getElementById('wordSessionSize').value='2';document.getElementById('wordSessionSize').dispatchEvent(new Event('change',{bubbles:true}))});
 await expect(page.locator('#readingView')).toBeVisible();
 for(let i=0;i<4;i++){
  await page.locator('#readOk').click();
  await expect(page.locator('#readOk')).toHaveText('Continue →');
  if(i<3)await page.locator('#readOk').click();
 }
 await expect(page.locator('#languageReadingNotice')).toContainText('Great!');
 await page.getByRole('button',{name:'Again'}).click();
 await expect(page.locator('#readingView')).toBeVisible();
 await expect(page.locator('#readOk')).toContainText('I read it myself');
});
test('RU EN FR RU preserves RU stored progress and English mastery',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const ruBefore=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#readOk').click();
 const enBefore=await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'));
 expect(enBefore).not.toBeNull();
 await page.evaluate(()=>PhonikaI18n.setLanguage('fr'));
 await expect(page.locator('#languageReadingNotice')).toContainText('français');
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ruBefore);
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 expect(await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'))).toBe(enBefore);
});
