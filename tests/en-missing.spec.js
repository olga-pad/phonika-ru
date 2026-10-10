const {test,expect}=require('@playwright/test');
async function init(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s))},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click()}
test('EN Missing eligible words, wrong-answer remediation, dinosaur, finish and Again',async({page})=>{
 test.setTimeout(60000);await init(page,{s:true,a:true,t:true,p:true,n:true,i:true,b:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#missingWordGameCard').click();await expect(page.locator('#missingWordGame')).toBeVisible();
 const tasks=await page.evaluate(()=>PhonikaENMissing.getTasks());expect(tasks.length).toBeGreaterThan(1);
 const pool=await page.evaluate(()=>PhonikaENReading.availableWords().filter(w=>PhonikaENReading.wordAvailable(w)).map(w=>w.word));
 for(const t of tasks){expect(pool).toContain(t.target);expect(pool).toContain(t.first);expect(pool).toContain(t.second);for(const w of t.answers)expect(pool).toContain(w)}
 for(let i=0;i<tasks.length;i++){
  await page.evaluate(()=>PhonikaENMissing.reveal());
  const t=await page.evaluate(()=>PhonikaENMissing.getCurrent());
  if(i===0){const wrong=t.answers.find(w=>w!==t.target);await page.locator('#missingAnswers .missing-answer').filter({hasText:wrong.toUpperCase()}).dispatchEvent('click');await expect(page.locator('#missingDinoSteps .done')).toHaveCount(0)}
  await page.locator('#missingAnswers .missing-answer').filter({hasText:t.target.toUpperCase()}).dispatchEvent('click');
  await expect(page.locator('#missingNext')).toBeEnabled();await page.locator('#missingNext').dispatchEvent('click');
 }
 for(let i=0;i<tasks.length+2&&await page.locator('#missingWordGame').isVisible();i++){await page.evaluate(()=>PhonikaENMissing.reveal());const t=await page.evaluate(()=>PhonikaENMissing.getCurrent());await page.locator('#missingAnswers .missing-answer').filter({hasText:t.target.toUpperCase()}).dispatchEvent('click');await page.locator('#missingNext').dispatchEvent('click')}
 await expect(page.locator('.games-completion:visible')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ru);
 await page.locator('.games-completion:visible .dino-again').click();await expect(page.locator('#missingWordGame')).toBeVisible();
});
test('EN Missing insufficient words leads to Sounds',async({page})=>{await init(page,{s:true});await page.locator('#missingWordGameCard').click();await expect(page.locator('#enMissingGoSounds')).toBeVisible();await page.locator('#enMissingGoSounds').click();await expect(page.locator('#lettersView')).toBeVisible()});
test('EN Missing language switch closes English game and restores RU',async({page})=>{await init(page,{s:true,a:true,t:true,p:true,n:true,i:true,b:true});await page.locator('#missingWordGameCard').click();await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));await expect(page.locator('#missingWordGame')).toBeHidden();await expect(page.locator('#gamesGrid')).toBeVisible()});
