const {test,expect}=require('@playwright/test');
async function prepare(page,width){
 await page.setViewportSize({width,height:width<500?740:900});
 await page.goto('./');
 await page.evaluate(()=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true}));});
 await page.reload();
 await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
 await page.locator('#wordsTab').click();
 await page.locator('#wordSessionSize').evaluate(el=>{el.value='3';el.dispatchEvent(new Event('change',{bubbles:true}))});
 await expect(page.locator('#readingView')).toBeVisible();
}
for(const width of [375,1024]){
 test('EN Reading uses RU finish component and replay at '+width+'px',async({page})=>{
  await prepare(page,width);
  for(let i=0;i<6;i++){
   await page.locator('#readOk').click();
   if(i<5)await page.locator('#readOk').click();
  }
  const finish=page.locator('#finishView');
  await expect(finish).toBeVisible();
  await expect(page.locator('#readingView')).toBeHidden();
  await expect(page.locator('#languageReadingNotice')).toBeHidden();
  await expect(finish.locator('.star')).toBeVisible();
  await expect(finish.locator('.star')).toHaveText('⭐');
  await expect(finish.locator('h1')).toHaveText('Hooray!');
  await expect(finish.locator('p').first()).toHaveText('You read all the words!');
  await expect(finish.locator('p').last()).toHaveText('3 words read!');
  const again=finish.locator('button.primary.continue');
  await expect(again).toHaveText('Read again');
  const geometry=await finish.evaluate(el=>{
   const a=el.getBoundingClientRect(),b=el.querySelector('button').getBoundingClientRect(),star=el.querySelector('.star').getBoundingClientRect();
   return {finish:{x:a.x,width:a.width},button:{x:b.x,right:b.right},starFont:getComputedStyle(el.querySelector('.star')).fontSize,display:getComputedStyle(el).display,layout:getComputedStyle(el).flexDirection,scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth};
  });
  expect(geometry.display).toBe('flex');
  expect(geometry.layout).toBe('column');
  expect(geometry.starFont).toBe('92px');
  expect(geometry.button.x).toBeGreaterThanOrEqual(geometry.finish.x);
  expect(geometry.button.right).toBeLessThanOrEqual(geometry.finish.x+geometry.finish.width+1);
  expect(geometry.scroll).toBeLessThanOrEqual(geometry.viewport+1);
  const before=await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'));
  await again.click();
  await expect(page.locator('#readingView')).toBeVisible();
  await expect(finish).toBeHidden();
  expect(await page.evaluate(()=>localStorage.getItem('phonika-en-word-progress'))).toBe(before);
  await page.evaluate(()=>PhonikaI18n.setLanguage('ru'));
  await expect(page.locator('#finishView h1')).toHaveText('Отлично!');
  await expect(page.locator('#languageReadingNotice')).toBeHidden();
 });
}
