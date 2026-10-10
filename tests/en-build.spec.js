const {test,expect}=require('@playwright/test');
async function init(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s))},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click()}
async function assemble(page,word){const t=await page.evaluate(()=>PhonikaENBuild.getTasks().find(x=>!x.completed));const used=new Set();for(const ch of word.toUpperCase()){const id=t.tiles.findIndex((x,i)=>x===ch&&!used.has(i));expect(id).toBeGreaterThanOrEqual(0);used.add(id);await page.locator('#buildLetters .build-letter').nth(id).dispatchEvent('click')}}
test('EN Build Word wrong attempt, correct assembly, dinosaur, remediation, Again',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true,i:true,b:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#buildWordGameCard').click();await expect(page.locator('#buildWordGame')).toBeVisible();
 const tasks=await page.evaluate(()=>PhonikaENBuild.getTasks());expect(tasks.length).toBeGreaterThan(1);
 const pool=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));for(const t of tasks)expect(pool).toContain(t.targetWord);
 for(let i=0;i<tasks.length;i++){
  const t=tasks[i];
  if(i===0){const wrong=t.targetWord.split('').reverse().join('');if(wrong!==t.targetWord){await assemble(page,wrong);await expect(page.locator('#buildDinoSteps .done')).toHaveCount(0);for(let j=0;j<wrong.length;j++)await page.locator('#buildSlots .build-slot').nth(j).dispatchEvent('click')}}
  await assemble(page,t.targetWord);await expect(page.locator('#buildNext')).toBeEnabled();
  await page.locator('#buildNext').dispatchEvent('click');
 }
 for(let i=0;i<tasks.length+2&&await page.locator('#buildWordGame').isVisible();i++){const t=await page.evaluate(()=>PhonikaENBuild.getTasks()[0]);if(!t)break;await assemble(page,t.targetWord);await page.locator('#buildNext').dispatchEvent('click')}
 await expect(page.locator('.games-completion:visible')).toBeVisible();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ru);
 await page.locator('.games-completion:visible .dino-again').click();await expect(page.locator('#buildWordGame')).toBeVisible();
});
test('EN Build Word insufficient words links to Sounds',async({page})=>{
 await init(page,{s:true});await page.locator('#buildWordGameCard').click();
 await expect(page.locator('#enBuildGoSounds')).toBeVisible();await page.locator('#enBuildGoSounds').click();
 await expect(page.locator('#lettersView')).toBeVisible();
});
test('EN Build Word language switch restores RU games',async({page})=>{
 await init(page,{s:true,a:true,t:true,p:true,n:true});await page.locator('#buildWordGameCard').click();
 await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));await expect(page.locator('#buildWordGame')).toBeHidden();
 await expect(page.locator('#gamesGrid')).toBeVisible();
});
