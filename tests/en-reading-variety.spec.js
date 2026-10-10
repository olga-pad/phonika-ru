const {test,expect}=require('@playwright/test');
async function setup(page,sounds){await page.goto('./');await page.evaluate(s=>{localStorage.clear();localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s))},sounds);await page.reload();await page.evaluate(()=>PhonikaI18n.setLanguage('en'));await expect(page.locator('#readingView')).toBeVisible()}
test('mastery changes invalidate session and unlock b without unknown graphemes',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,i:true,n:true});
 const first=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));
 expect(first).toContain('sat');expect(first).not.toContain('bat');expect(first).toContain('sit');expect(first).toContain('pin');expect(first).not.toContain('ship');
 await page.evaluate(()=>{localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,i:true,n:true,b:true}));PhonikaENReading.refresh()});
 const next=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));
 expect(next).toContain('bat');expect(next).not.toContain('hat');
 const sessions=await page.evaluate(()=>{const out=[];for(let i=0;i<5;i++){out.push(PhonikaENReading.currentSession());PhonikaENReading.beginNewSession()}return out});expect(sessions.some(words=>words.includes('bat'))).toBeTruthy();
 const d=await page.evaluate(()=>PhonikaENReading.diagnostic());expect(d.unlockedBeyondLevel.some(w=>w.word==='sit')).toBeTruthy();expect(d.blockedByLevel).toEqual([]);
});
test('sessions rotate, include review, and selection survives reload',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true,b:true,c:true,h:true,m:true,f:true});
 const sessions=[];
 for(let i=0;i<3;i++){sessions.push(await page.evaluate(()=>PhonikaENReading.currentSession()));await page.evaluate(()=>PhonikaENReading.beginNewSession())}
 expect(new Set(sessions.map(s=>s.join(','))).size).toBeGreaterThan(1);
 expect(sessions[1].some(w=>sessions[0].includes(w))||sessions[2].some(w=>sessions[1].includes(w))).toBeTruthy();
 const history=await page.evaluate(()=>localStorage.getItem('phonika-en-reading-selection-v1'));
 await page.reload();expect(await page.evaluate(()=>localStorage.getItem('phonika-en-reading-selection-v1'))).toBe(history);
});
test('EN Find sees new eligible words without modifying RU progress',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,n:true});
 const ru=await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'));
 await page.evaluate(()=>{localStorage.setItem('phonika-en-known-sounds',JSON.stringify({s:true,a:true,t:true,p:true,n:true,b:true}));PhonikaENReading.refresh()});
 const pool=await page.evaluate(()=>PhonikaENFind.eligible().map(w=>w.word));expect(pool).toContain('bat');
 expect(await page.evaluate(()=>localStorage.getItem('soundsteps-profile-v1'))).toBe(ru);
});

test('later-level words require complete graphemes, including digraphs',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,i:true,n:true,h:true});
 const before=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));
 expect(before).toContain('sit');expect(before).toContain('pin');expect(before).not.toContain('ship');
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('phonika-en-known-sounds'));s.sh=true;localStorage.setItem('phonika-en-known-sounds',JSON.stringify(s));PhonikaENReading.refresh()});
 const after=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));
 expect(after).toContain('ship');
 expect(await page.evaluate(()=>PhonikaENFind.eligible().map(w=>w.word))).toContain('ship');
 await page.reload();expect(await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word))).toContain('ship');
});
test('new Reading session can include words from later levels',async({page})=>{
 await setup(page,{s:true,a:true,t:true,p:true,i:true,n:true});
 const pool=await page.evaluate(()=>PhonikaENReading.availableWords().map(w=>w.word));expect(pool).toContain('sit');
 const sessions=await page.evaluate(()=>{const result=[];for(let i=0;i<8;i++){result.push(PhonikaENReading.currentSession());PhonikaENReading.beginNewSession()}return result});
 expect(sessions.some(x=>x.includes('sit'))).toBeTruthy();
});
