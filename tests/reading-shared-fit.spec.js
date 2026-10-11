const {test,expect}=require('@playwright/test');
const samples={ru:['КОТ','МАШИНА','ЭЛЕКТРОВОЗ'],en:['CAT','SHOP','SHEEP','TRAIN','SPRING']};
async function boot(page,language,width){
 await page.setViewportSize({width,height:760});
 await page.goto('./');
 if(language==='en'){
  await page.evaluate(()=>localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true,c:true,h:true,i:true,b:true,sh:true,ee:true,tr:true,r:true,g:true})));
  await page.reload();
 }
 await page.evaluate(l=>PhonikaI18n.setLanguage(l),language);
 await page.locator('#wordsTab').click();
 await expect(page.locator('#readingView')).toBeVisible();
}
async function check(page,word){
 await page.evaluate(w=>{
  const el=document.getElementById('word');
  el.replaceChildren(...[...w].map(ch=>{const x=document.createElement('span');x.textContent=ch;x.className='AEIOUАЕЁИОУЫЭЮЯ'.includes(ch)?'vowel':'consonant';return x}));
  window.PhonikaWordFit.schedule();
 },word);
 await expect.poll(()=>page.evaluate(()=>{const e=document.getElementById('word');return e.scrollWidth<=e.clientWidth+2})).toBe(true);
 const data=await page.evaluate(()=>{
  const w=document.getElementById('word'),r=w.getBoundingClientRect(),stage=w.closest('.stage').getBoundingClientRect();
  const nav=[...document.querySelectorAll('#readingView .lesson-nav .nav-arrow')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
  return {width:r.width,left:r.left,right:r.right,center:(r.left+r.right)/2,stageCenter:(stage.left+stage.right)/2,viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,arrows:nav.map(x=>({left:x.left,right:x.right})),font:parseFloat(getComputedStyle(w).fontSize),colors:[...w.children].map(x=>[x.textContent,getComputedStyle(x).color])};
 });
 expect(data.left).toBeGreaterThanOrEqual(-1);expect(data.right).toBeLessThanOrEqual(data.viewport+1);
 expect(data.scroll).toBeLessThanOrEqual(data.viewport+1);
 expect(Math.abs(data.center-data.stageCenter)).toBeLessThanOrEqual(2);
 for(const a of data.arrows)expect(data.right<=a.left||data.left>=a.right).toBeTruthy();
 for(const [ch,color] of data.colors)expect(color).toBe('AEIOUАЕЁИОУЫЭЮЯ'.includes(ch)?'rgb(198, 40, 40)':'rgb(21, 101, 192)');
 for(const id of ['help','showPicture','readOk'])await expect(page.locator('#'+id)).toBeVisible();
 return data.font;
}
for(const width of [320,375,430])for(const lang of ['ru','en']){
 test(lang+' Reading shared fit '+width+'px',async({page})=>{
  await boot(page,lang,width);
  const sizes=[];
  for(const word of samples[lang])sizes.push(await check(page,word));
  expect(sizes[0]).toBeGreaterThan(sizes[sizes.length-1]);
  await page.setViewportSize({width:width+30,height:760});
  await check(page,samples[lang][samples[lang].length-1]);
 });
}
test('RU Reading independent progress, hint, navigation and finish remain intact',async({page})=>{
 await boot(page,'ru',375);
 const initial=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.locator('#showPicture').click();
 await expect(page.locator('#pic')).toBeVisible();
 await page.locator('#readOk').click();
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(initial);
 await page.locator('#wordsTab').click();
 await expect(page.locator('#readingView')).toBeVisible();
 await expect(page.locator('#word')).not.toBeEmpty();
});
