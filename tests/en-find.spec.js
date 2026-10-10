const {test,expect}=require('@playwright/test');
async function init(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s));},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click()}
test('EN Find eligible answers, wrong/correct, completion, Again, RU isolation',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#findGameCard').click();await expect(page.locator('#findGame')).toBeVisible();
 const diagnostic=await page.evaluate(()=>({pool:PhonikaENReading.availableWords().map(x=>x.word),eligible:PhonikaENFind.eligible().map(x=>x.word),tasks:PhonikaENFind.getTasks()}));expect(diagnostic.eligible.length,JSON.stringify(diagnostic)).toBeGreaterThan(1);const tasks=diagnostic.tasks;expect(tasks.length,JSON.stringify(diagnostic)).toBeGreaterThan(1);
 expect(tasks.every(t=>t.targetWord===t.target)).toBeTruthy();
 for(let i=1;i<tasks.length;i++)expect(tasks[i].target).not.toBe(tasks[i-1].target);
 const valid=await page.evaluate(()=>PhonikaENReading.availableWords().filter(w=>PhonikaENReading.wordAvailable(w)).map(w=>w.word));
 for(const t of tasks){expect(valid).toContain(t.target);for(const w of t.choices)expect(valid).toContain(w)}
 for(let i=0;i<tasks.length;i++){
  const t=tasks[i],wrong=t.choices.find(w=>w!==t.target);
  if(i===0&&wrong){await page.locator('#findAnswers .find-answer').filter({hasText:wrong.toUpperCase()}).click();await expect(page.locator('#findAnswers .try-again')).toHaveCount(1)}
  await page.locator('#findAnswers .find-answer').filter({hasText:t.target.toUpperCase()}).click();
  await expect(page.locator('#findNext')).toBeEnabled();
  const completed=await page.locator('#findDinoSteps .dino-step.done').count();
  expect(completed).toBe(tasks.slice(0,i+1).filter((task,j)=>!(j===0&&task.choices.some(w=>w!==task.target))).length);await page.locator('#findNext').click();
 }
 // Wrong attempts enter remediation; solve remaining tasks.
 for(let k=0;k<tasks.length+2&&await page.locator('#findGame').isVisible();k++){
  const current=await page.evaluate(()=>PhonikaENFind.getTasks().find(t=>!t.completed));const target=current?.target;
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
 const button=page.locator('#enFindGoSounds');
 await expect(button).toHaveText('Go to Sounds');
 const visibility=await button.evaluate(el=>{const nodes=[];for(let n=el;n;n=n.parentElement){const st=getComputedStyle(n);nodes.push({id:n.id,tag:n.tagName,hidden:n.hidden,display:st.display,visibility:st.visibility,rect:n.getBoundingClientRect().toJSON()});if(n.id==='childView')break}return nodes});
 expect(visibility.filter(x=>x.hidden||x.display==='none'||x.visibility==='hidden'||x.rect.width===0||x.rect.height===0),JSON.stringify(visibility)).toEqual([]);
 await expect(button).toBeVisible();
 await expect(button).toBeEnabled();
 await button.click();
 await expect(page.locator('#lettersView')).toBeVisible();
});
test('EN Find switching to RU restores Russian Games cards',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});await page.locator('#findGameCard').click();
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
 await expect(page.locator('#gamesGrid')).toBeVisible();
 await expect(page.locator('#findGame')).toBeHidden();
 await expect(page.locator('#readingView')).toBeHidden();
});
