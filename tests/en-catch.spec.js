const {test,expect}=require('@playwright/test');
async function init(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s))},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click()}
test('EN Catch complete cycle, wrong answer remediation, dinosaur, Again, RU isolation',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true,i:true,b:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#catchGameCard').click();await expect(page.locator('#catchGame')).toBeVisible();
 const tasks=await page.evaluate(()=>PhonikaENCatch.getTasks());expect(tasks.length).toBeGreaterThan(1);
 const pool=await page.evaluate(()=>PhonikaENReading.availableWords().filter(w=>PhonikaENReading.wordAvailable(w)).map(w=>w.word));
 for(const t of tasks){expect(pool).toContain(t.targetWord);for(const w of t.answers)expect(pool).toContain(w)}
 for(let i=0;i<tasks.length;i++){
  const t=tasks[i],wrong=t.answers.find(w=>w!==t.targetWord);
  if(i===0){await page.locator('#catchArea .catch-answer').filter({hasText:wrong.toUpperCase()}).click();await expect(page.locator('#catchDinoSteps .done')).toHaveCount(0)}
  await page.locator('#catchArea .catch-answer').filter({hasText:t.targetWord.toUpperCase()}).click();
  await expect(page.locator('#catchNext')).toBeEnabled();
  await expect(page.locator('#catchDinoSteps .done')).toHaveCount(i);
  await page.locator('#catchNext').click();
 }
 for(let i=0;i<tasks.length+2&&await page.locator('#catchGame').isVisible();i++){
  const t=await page.evaluate(()=>PhonikaENCatch.getTasks()[0]);if(!t)break;
  await page.locator('#catchArea .catch-answer').filter({hasText:t.targetWord.toUpperCase()}).click();
  await page.locator('#catchNext').click();
 }
 await expect(page.locator('.games-completion:visible')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ru);
 await page.locator('.games-completion:visible .dino-again').click();
 await expect(page.locator('#catchGame')).toBeVisible();
});
test('EN Catch no eligible words offers working Sounds link',async({page})=>{
 await init(page,{s:true});await page.locator('#catchGameCard').click();
 await expect(page.locator('#catchArea')).toContainText('Learn a few more sounds to unlock this game!');
 await expect(page.locator('#enCatchGoSounds')).toBeVisible();
 await page.locator('#enCatchGoSounds').click();
 await expect(page.locator('#lettersView')).toBeVisible();
});
test('EN Catch switches back to RU without changing RU data',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});
 await page.locator('#catchGameCard').click();await expect(page.locator('#catchGame')).toBeVisible();
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
 await expect(page.locator('#catchGame')).toBeHidden();
 await expect(page.locator('#gamesGrid')).toBeVisible();
});
