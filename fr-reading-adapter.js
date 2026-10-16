'use strict';
// French UI adapter reuses the existing card, navigation, progress track and parent controls.
(()=>{
const $=id=>document.getElementById(id),model=window.PhonikaFR;
const lang=()=>window.PhonikaI18n?.language||localStorage.getItem('uiLanguage')||'ru';
const levels=['Mes premiers mots','Le E muet','Les lettres finales muettes'];
const get=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||f}catch{return f}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let queue=[],index=0,reads={},step=0,marked=false,assisted=false,done=false,signature='';
const progressKey='phonika-fr-word-progress',sessionKey='phonika-fr-reading-session';
const restore=()=>{const s=get(sessionKey,{});queue=Array.isArray(s.queue)?s.queue:[];index=s.index||0;reads=s.reads||{};step=s.step||0;done=!!s.done;signature=s.signature||''};
const persist=()=>save(sessionKey,{queue,index,reads,step,done,signature});
restore();
const goal=()=>Math.max(1,queue.length*2);
const updateTrack=()=>{const track=$('readingView').querySelector('.dino-track');if(!track)return;const steps=track.querySelector('.dino-steps'),dino=track.querySelector('.dino');if(steps){steps.replaceChildren(...Array.from({length:goal()},(_,i)=>{const el=document.createElement('span');el.className='dino-step'+(i<step?' done':'');if(i<step)el.textContent='✓';return el}))}if(dino){const p=Math.min(100,100*step/goal());dino.style.left='calc('+p+'% - '+(p*.46)+'px)'}};
const label=(s)=>s.silent?'Lettre finale muette '+s.grapheme:s.grapheme+' → /'+s.phoneme+'/';
const renderParent=()=>{
 if(lang()!=='fr')return;
 const box=$('knownSounds'),toggle=$('toggleAllSounds');if(!box)return;
 const title=box.closest('.tone-known')?.querySelector('h2');if(title){const text=title.querySelector('.collapse-action-text');const btn=title.querySelector('button');if(btn&&btn.firstChild?.nodeType===3)btn.firstChild.nodeValue='Qu’est-ce que votre enfant connaît déjà ?';}
 const p=model.read();box.replaceChildren(...model.inventory.map(s=>{const b=document.createElement('button');b.type='button';b.className='known-letter '+(s.silent?'sign-choice':'consonant-choice')+(p[s.key]?' selected':'');b.dataset.sound=s.key;b.setAttribute('aria-pressed',String(!!p[s.key]));b.textContent=label(s);b.title='Exemple : '+s.example;b.onclick=()=>{model.set(s.key,!model.known(s.key));renderParent()};return b}));
 const all=model.inventory.every(s=>p[s.key]);toggle.textContent=all?'Tout effacer':'Tout sélectionner';toggle.onclick=()=>{model.inventory.forEach(s=>p[s.key]=!all);save(model.progressKey,p);window.dispatchEvent(new Event('phonika:fr-mastery'));renderParent()};
 const select=$('level');if(select){const value=localStorage.getItem('phonika-fr-level')||'1';select.replaceChildren(...levels.map((name,i)=>{const o=document.createElement('option');o.value=String(i+1);o.textContent='Niveau '+(i+1)+' — '+name;return o}));select.value=value}
};
const wordMarkup=w=>{const el=$('word');el.replaceChildren(...[...w.word].map(ch=>{const s=document.createElement('span');s.textContent=ch;s.className='AEIOUYÂÉÈÊ'.includes(ch)?'vowel':'consonant';return s}))};
const finish=()=>{done=true;persist();$('readingView').hidden=true;const f=$('finishView');f.hidden=false;f.replaceChildren();const title=document.createElement('h2');title.textContent='Bravo !';const again=document.createElement('button');again.className='primary';again.textContent='Recommencer';again.onclick=()=>{queue=[];reads={};step=0;done=false;signature='';showReading()};f.append(title,again)};
const showReading=()=>{
 if(lang()!=='fr'||section!=='words')return;
 const available=model.available(),sig=available.map(w=>w.word).join('|');
 if(sig!==signature){queue=[];reads={};step=0;done=false;signature=sig}
 if(!queue.length&&available.length){const size=Math.max(1,Number($('wordSessionSize')?.value)||5);const level=Number(localStorage.getItem('phonika-fr-level')||1);queue=[...available].sort((a,b)=>Math.abs(a.level-level)-Math.abs(b.level-level)||a.level-b.level).slice(0,size).map(w=>w.word);index=0}
 persist();
 const notice=$('frReadingNotice');
 if(!queue.length){$('readingView').hidden=true;$('finishView').hidden=true;notice.hidden=false;notice.replaceChildren();const p=document.createElement('p');p.textContent='Apprenez davantage de sons et de correspondances pour débloquer des mots.';const b=document.createElement('button');b.textContent='Aller aux sons';b.className='primary';b.onclick=()=>{$('lettersTab').click()};notice.append(p,b);return}
 notice.hidden=true;if(done){finish();return}
 $('finishView').hidden=true;$('readingView').hidden=false;index=Math.min(index,queue.length-1);
 const w=model.words.find(x=>x.word===queue[index]);if(!w)return;
 wordMarkup(w);$('pic').hidden=true;$('reward').textContent='';$('confirmation').textContent='';
 const button=$('readOk');button.textContent=marked?'Mot suivant':'J’ai lu tout seul';button.disabled=false;button.dataset.continueNext='';marked=false;assisted=false;updateTrack();persist();
};
const next=delta=>{if(!queue.length)return;index=(index+delta+queue.length)%queue.length;marked=false;assisted=false;showReading()};
const notice=document.createElement('div');notice.id='frReadingNotice';notice.className='intro';notice.hidden=true;$('readingView').insertAdjacentElement('afterend',notice);
document.addEventListener('click',e=>{
 if(lang()!=='fr'||section!=='words'||$('parentView').hidden===false)return;
 const b=e.target.closest('button');if(!b)return;const nav=b.closest('#readingView .lesson-nav');const action=nav?(b.classList.contains('nav-prev')?'prev':'next'):b.id;
 if(!['prev','next','readOk','help','showPicture'].includes(action))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(action==='prev'){next(-1);return}if(action==='next'){next(1);return}
 if(action==='help'){assisted=true;$('readOk').textContent='Mot suivant';return}
 if(action==='showPicture'){assisted=true;$('readOk').textContent='Mot suivant';return}
 if(marked||assisted){next(1);return}
 const w=queue[index];if(!w||!model.eligible(model.words.find(x=>x.word===w)))return;
 const p=get(progressKey,{}),old=p[w]||{self:0,mastered:false};old.self=Math.min(3,old.self+1);old.mastered=old.self>=3;p[w]=old;save(progressKey,p);
 reads[w]=Math.min(2,(reads[w]||0)+1);step=Math.min(goal(),step+1);marked=true;persist();updateTrack();$('confirmation').textContent=old.mastered?'Mot maîtrisé !':'Bravo !';$('confirmation').classList.add('show');b.textContent='Mot suivant';
 if(queue.every(x=>(reads[x]||0)>=2))finish();
},true);
const soundCards=()=>{
 if(lang()!=='fr'||section!=='letters')return;
 const items=model.inventory;let idx=Number(sessionStorage.getItem('phonika-fr-sound-index')||0)%items.length;
 const draw=()=>{const s=items[idx];$('letterCard').textContent=s.grapheme;$('letterPicture').textContent=label(s)+' · '+s.example;$('letterPicture').hidden=false;$('letterHelp').disabled=true;$('letterHelp').textContent='Audio indisponible';$('letterShowPicture').disabled=true;$('letterKnown').textContent=model.known(s.key)?'✓ Acquis':'Je connais ce son';$('letterKnown').disabled=false};
 draw();window.PhonikaFRUI.soundNext=delta=>{idx=(idx+delta+items.length)%items.length;sessionStorage.setItem('phonika-fr-sound-index',idx);draw()};
 window.PhonikaFRUI.soundMark=()=>{model.set(items[idx].key,true);draw()};
};
window.PhonikaFRUI={renderParent,showReading,soundCards};
window.addEventListener('phonika:fr-mastery',()=>{if(lang()==='fr'&&section==='words')showReading()});
window.addEventListener('phonika:ui-language',()=>requestAnimationFrame(()=>{if(lang()==='fr'){if(section==='words')showReading();else soundCards()}}));
document.addEventListener('DOMContentLoaded',()=>{$('parentBack').addEventListener('click',()=>requestAnimationFrame(()=>{if(lang()==='fr')showReading()}));$('wordsTab').addEventListener('click',()=>requestAnimationFrame(showReading));$('lettersTab').addEventListener('click',()=>requestAnimationFrame(soundCards));});
})();
