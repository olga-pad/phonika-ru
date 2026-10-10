const {test,expect}=require('@playwright/test');
const words=['CAT','SHOP','SHEEP','TRAIN','SPRING'];
for(const width of [320,375,430]){
 test('EN Reading word fit at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:760});
  await page.goto('./');
  await page.evaluate(()=>PhonikaI18n.setLanguage('en'));
  await expect(page.locator('#readingView')).toBeVisible();
  for(const word of words){
   await page.evaluate(w=>{
    const el=document.querySelector('#word');
    el.replaceChildren(...[...w].map(ch=>{const s=document.createElement('span');s.textContent=ch;s.className='AEIOU'.includes(ch)?'vowel':'consonant';return s}));
    el.classList.remove('hand');
    window.dispatchEvent(new Event('resize'));
   },word);
   await page.waitForTimeout(120);
   const result=await page.evaluate(()=>{
    const el=document.querySelector('#word'),r=el.getBoundingClientRect();
    const nav=[...document.querySelectorAll('#readingView .lesson-nav .nav-arrow')].filter(e=>!e.hidden&&getComputedStyle(e).display!=='none').map(e=>e.getBoundingClientRect());
    return {left:r.left,right:r.right,width:r.width,scroll:el.scrollWidth,font:parseFloat(getComputedStyle(el).fontSize),viewport:document.documentElement.clientWidth,body:document.documentElement.scrollWidth,nav:nav.map(x=>({left:x.left,right:x.right,top:x.top,bottom:x.bottom})),colors:[...el.children].map(x=>({letter:x.textContent,color:getComputedStyle(x).color}))};
   });
   expect(result.scroll).toBeLessThanOrEqual(result.width+2);
   expect(result.left).toBeGreaterThanOrEqual(0);
   expect(result.right).toBeLessThanOrEqual(result.viewport+1);
   expect(result.body).toBeLessThanOrEqual(result.viewport+1);
   for(const arrow of result.nav)expect(result.right<=arrow.left||result.left>=arrow.right).toBeTruthy();
   for(const c of result.colors)expect(c.color).toBe('AEIOU'.includes(c.letter)?'rgb(198, 40, 40)':'rgb(21, 101, 192)');
   for(const id of ['help','showPicture','readOk'])await expect(page.locator('#'+id)).toBeVisible();
   if(word==='CAT')expect(result.font).toBeGreaterThanOrEqual(70);
  }
 });
}
