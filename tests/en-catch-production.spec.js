const {test,expect}=require('@playwright/test');
test('production-style EN Games touch opens Catch without RU views or JS errors',async({page,isMobile})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true,i:true,b:true}));});
 await page.reload();
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 await page.locator('#gamesTab').click();
 await expect(page.locator('#gamesGrid')).toBeVisible();
 const card=page.locator('#catchGameCard');
 await expect(card).toBeVisible();await expect(card).toBeEnabled();
 await expect(card).toHaveAttribute('aria-disabled','false');
 const position=await card.boundingBox();expect(position).toBeTruthy();
 if(isMobile)await page.touchscreen.tap(position.x+position.width/2,position.y+position.height/2);
 else await card.click();
 await expect(page.locator('#catchGame')).toBeVisible();
 await expect(page.locator('#catchGame .find-title')).toHaveText('Catch');
 await expect(page.locator('#catchArea .catch-answer')).toHaveCount(2);
 const answers=await page.locator('#catchArea .catch-answer').allInnerTexts();
 const pool=await page.evaluate(()=>PhonikaENReading.availableWords().filter(w=>PhonikaENReading.wordAvailable(w)).map(w=>w.word.toUpperCase()));
 for(const answer of answers)expect(pool).toContain(answer.trim().toUpperCase());
 await expect(page.locator('#readingView')).toBeHidden();
 await expect(page.locator('#findGame')).toBeHidden();
 await expect(page.locator('#gamesGrid')).toBeHidden();
 expect(errors).toEqual([]);
});
test('EN unfinished cards display Coming soon and cannot be activated',async({page})=>{
 await page.goto('./');await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await page.locator('#gamesTab').click();
 for(const i of [2]){const card=page.locator('#gamesGrid .game-card').nth(i);await expect(card).toContainText('Coming soon');await expect(card).toHaveAttribute('aria-disabled','true');await expect(card).toHaveCSS('pointer-events','none')}
});
