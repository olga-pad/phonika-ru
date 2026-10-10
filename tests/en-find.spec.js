const {test,expect}=require('@playwright/test');
async function init(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s));},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click()}
test('EN Find eligible answers, wrong/correct, completion, Again, RU isolation',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#findGameCard').click();await expect(page.locator('#findGame')).toBeVisible();
 const tasks=await page.evaluate(()=>PhonikaENFind.getTasks());expect(tasks.length).toBeGreaterThan(1);
 const valid=await page.evaluate(()=>PhonikaENReading.availableWords().filter(w=>PhonikaENReading.wordAvailable(w)).map(w=>w.word));
 for(const t of tasks){expect(valid).toContain(t.target);for(const w of t.choices)expect(valid).toContain(w)}
 for(let i=0;i<tasks.length;i++){
  const t=tasks[i],wrong=t.choices.find(w=>w!==t.target);
  if(i===0&&wrong){await page.locator('#findAnswers .find-answer').filter({hasText:wrong.toUpperCase()}).click();await expect(page.locator('#findAnswers .try-again')).toHaveCount(1)}
  await page.locator('#findAnswers .find-answer').filter({hasText:t.target.toUpperCase()}).click();
  await expect(page.locator('#findNext')).toBeEnabled();await page.locator('#findNext').click();
 }
 // Wrong attempts enter remediation; solve remaining tasks.
 for(let k=0;k<tasks.length+2&&await page.locator('#findGame').isVisible();k++){
  const current=await page.evaluate(()=>PhonikaENFind.getTasks()[0]);const target=current?.target;
  if(!target)break;
  await page.locator('#findAnswers .find-answer').filter({hasText:target.toUpperCase()}).click();
  await page.locator('#findNext').click();
 }
 await expect(page.locator('.games-completion:visible')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ru);
 await page.locator('.games-completion:visible .dino-again').click();
 await expect(page.locator('#findGame')).toBeVisible();
});
test('EN Find insufficient words never uses unknown distractors',async({page})=>{
 await init(page,{s:true});await page.locator('#findGameCard').click();
 await expect(page.locator('#findAnswers')).toContainText('Learn a few more sounds to unlock this game!');
 await page.getByRole('button',{name:'Go to Sounds'}).click();
 await expect(page.locator('#lettersView')).toBeVisible();
});
test('EN Find switching to RU restores Russian Games cards',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});await page.locator('#findGameCard').click();
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
 await expect(page.locator('#gamesGrid')).toBeVisible();
 await expect(page.locator('#findGame')).toBeHidden();
 await expect(page.locator('#readingView')).toBeHidden();
});
