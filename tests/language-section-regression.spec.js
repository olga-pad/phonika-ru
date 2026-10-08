const {test,expect}=require('@playwright/test');
async function init(page){
 await page.goto('./');await page.evaluate(()=>localStorage.clear());await page.reload();
 await page.evaluate(()=>localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true})));
}
async function language(page,l){
 await page.locator('#parentOpen').click();
 await page.locator('.parent-language-option').filter({hasText:l.toUpperCase()}).click();
 await page.locator('#parentBack').click();
}
async function exclusive(page,tab,view){
 await expect(page.locator('#'+tab)).toHaveClass(/\bon\b/);
 for(const id of ['lettersTab','wordsTab','gamesTab'].filter(x=>x!==tab))await expect(page.locator('#'+id)).not.toHaveClass(/\bon\b/);
 await expect(page.locator('#'+view)).toBeVisible();
 for(const id of ['readingView','lettersView','gamesView'].filter(x=>x!==view))await expect(page.locator('#'+id)).toBeHidden();
}
test('RU Games -> Parent EN -> Games only; EN Games -> RU restores RU cards',async({page})=>{
 await init(page);await page.locator('#gamesTab').click();await exclusive(page,'gamesTab','gamesView');
 await language(page,'en');await exclusive(page,'gamesTab','gamesView');
 await expect(page.locator('#englishGamesNotice')).toHaveText('English games coming soon');
 await expect(page.locator('#gamesGrid')).toBeHidden();
 await language(page,'ru');await exclusive(page,'gamesTab','gamesView');
 await expect(page.locator('#gamesGrid')).toBeVisible();
 await expect(page.locator('#englishGamesNotice')).toBeHidden();
});
test('RU Reading -> EN Reading remains exclusive',async({page})=>{
 await init(page);await page.locator('#wordsTab').click();await language(page,'en');
 await exclusive(page,'wordsTab','readingView');
 await expect(page.locator('#word')).not.toBeEmpty();
});
test('RU Sounds -> EN Sounds remains exclusive',async({page})=>{
 await init(page);await page.locator('#lettersTab').click();await language(page,'en');
 await exclusive(page,'lettersTab','lettersView');
 await expect(page.locator('#letterCard')).not.toContainText(/[А-ЯЁ]/);
});
test('RU EN FR RU from Games never mixes sections',async({page})=>{
 await init(page);await page.locator('#gamesTab').click();
 for(const l of ['en','fr','ru']){await language(page,l);await exclusive(page,'gamesTab','gamesView')}
 await expect(page.locator('#gamesGrid')).toBeVisible();
});
