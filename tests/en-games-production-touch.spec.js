const {test,expect}=require('@playwright/test');
const known={s:true,a:true,t:true,p:true,n:true,i:true,b:true};
async function launch(page){
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s))},known);
 await page.reload();
 await page.evaluate(()=>window.PhonikaI18n.setLanguage('en'));
 await page.locator('#gamesTab').click();
 await expect(page.locator('#gamesGrid')).toBeVisible();
 return errors;
}
async function fingerTap(page,locator){
 await expect(locator).toBeVisible();await expect(locator).toBeEnabled();
 await expect(locator).toHaveAttribute('aria-disabled','false');
 await expect(locator).toHaveCSS('pointer-events','auto');
 const p=await locator.boundingBox();expect(p).toBeTruthy();
 const top=await page.evaluate(({x,y})=>{const el=document.elementFromPoint(x,y);return el?.closest('.game-card')?.id||null},{x:p.x+p.width/2,y:p.y+p.height/2});
 expect(top).toBe(await locator.getAttribute('id'));
 await page.touchscreen.tap(p.x+p.width/2,p.y+p.height/2);
}
test('EN Games touchscreen opens Build Word then What’s Missing without RU views or errors',async({page})=>{
 const errors=await launch(page);
 const build=page.locator('#buildWordGameCard');
 await fingerTap(page,build);
 await expect(page.locator('#buildWordGame')).toBeVisible();
 await expect(page.locator('#buildWordGame .find-title')).toHaveText('Build Word');
 await expect(page.locator('#buildLetters .build-letter').first()).toBeVisible();
 await expect(page.locator('#gamesGrid')).toBeHidden();
 await expect(page.locator('#readingView')).toBeHidden();
 await expect(page.locator('#findGame')).toBeHidden();
 await page.locator('#buildAllGames').click();
 await expect(page.locator('#gamesGrid')).toBeVisible();
 await fingerTap(page,page.locator('#missingWordGameCard'));
 await expect(page.locator('#missingWordGame')).toBeVisible();
 await expect(page.locator('#missingWordGame .find-title')).toHaveText("What's Missing?");
 await expect(page.locator('#missingFirst')).toBeVisible();
 await expect(page.locator('#missingSecond')).toBeVisible();
 await expect(page.locator('#readingView')).toBeHidden();
 await expect(page.locator('#findGame')).toBeHidden();
 await expect(page.locator('#buildWordGame')).toBeHidden();
 await page.evaluate(()=>PhonikaENMissing.reveal());
 await expect(page.locator('#missingAnswers .missing-answer')).toHaveCount(2);
 expect(errors).toEqual([]);
});
