'use strict';
// EN course data and eligibility functions sourced from phonika-en/app-core.js.
(()=>{
const LEVELS=[
{title:'Short a — CVC word families',sounds:['s','a','t','p','n','c','b','h','m','f'],words:[['sat','🪑'],['pat','👋'],['tap','👆'],['nap','😴'],['pan','🍳'],['tan','🟤'],['ant','🐜'],['cat','🐱'],['bat','🦇'],['hat','🎩'],['mat','🧘'],['man','👨'],['fan','🪭'],['can','🥫'],['map','🗺️'],['cap','🧢'],['bag','👜'],['tag','🏷️'],['rag','🧽']]},
{title:'Short i — CVC word families',sounds:['i','l'],words:[['sit','🪑'],['hit','🎯'],['fit','💪'],['pit','🕳️'],['pin','📌'],['fin','🐟'],['tin','🥫'],['lip','👄'],['sip','🥤'],['tip','👉'],['pig','🐷']]},
{title:'Short o — CVC word families',sounds:['o','d','g'],words:[['hot','🔥'],['pot','🍲'],['dot','🔵'],['hop','🐰'],['top','🔝'],['dog','🐶'],['log','🪵'],['fog','🌫️'],['cot','🛏️']]},
{title:'Short e — CVC word families',sounds:['e','r'],words:[['pet','🐶'],['net','🥅'],['wet','💧'],['hen','🐔'],['pen','🖊️'],['ten','🔟'],['bed','🛏️'],['red','🔴'],['leg','🦵']]},
{title:'Short u — CVC word families',sounds:['u'],words:[['sun','☀️'],['run','🏃'],['fun','🎉'],['bug','🐛'],['hug','🤗'],['mug','☕'],['cup','🥤'],['pup','🐶'],['bus','🚌']]},
{title:'Mixed short vowels — true decoding',sounds:[],words:[['cat','🐱'],['pig','🐷'],['sun','☀️'],['bed','🛏️'],['dog','🐶'],['map','🗺️'],['red','🔴'],['sit','🪑'],['cup','🥤'],['hen','🐔'],['fox','🦊']]},
{title:'Digraphs — sh, ch, th, ck, ng',sounds:['sh','ch','th','ck','ng'],words:[['ship','🚢'],['shop','🏪'],['fish','🐟'],['chat','💬'],['chin','🙂'],['thin','📏'],['duck','🦆'],['sock','🧦'],['sing','🎵'],['ring','💍']]},
{title:'Consonant blends — st, sp, sw, fl, cl, tr, gr, fr',sounds:['st','sp','sw','fl','cl','tr','gr','fr'],words:[['stop','🛑'],['spin','🌀'],['swim','🏊'],['flag','🚩'],['clap','👏'],['trip','🧳'],['grin','😁'],['frog','🐸']]},
{title:'Magic e — long vowels',sounds:['a_e','i_e','o_e','u_e'],words:[['cake','🎂'],['lake','🏞️'],['make','🛠️'],['name','🏷️'],['bike','🚲'],['kite','🪁'],['five','5️⃣'],['home','🏠'],['hope','🤞'],['cube','🧊']]},
{title:'Vowel teams — ee, ai, ay, oa, oo',sounds:['ee','ai','ay','oa','oo'],words:[['see','👀'],['bee','🐝'],['feet','🦶'],['rain','🌧️'],['train','🚆'],['day','☀️'],['play','⚽'],['boat','⛵'],['goat','🐐'],['moon','🌙']]}
];

const VOWEL_GRAPHEMES=new Set(['a','e','i','o','u','a_e','i_e','o_e','u_e','ai','ay','ee','ea','oa','ow','oo','ar','or','ur','er','ir','ou','oi','oy','igh','air','ear','ure']);
const getJson=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')||fallback}catch{return fallback}};
let level=Math.min(10,Math.max(1,Number(localStorage.getItem('phonika-level')||1)));
const soundProgress=getJson('phonika-en-sound-progress',{});
const parentSounds=()=>getJson('phonika-en-known-sounds',{});
function soundsThroughLevel(){return LEVELS.slice(0,level).flatMap(x=>x.sounds)}
function wordsThroughLevel(){return LEVELS.slice(0,level).flatMap(x=>x.words.map(w=>({word:w[0],picture:w[1],tricky:!!w[2]})))}
function state(obj,k){if(typeof obj[k]==='number')obj[k]={self:obj[k],mastered:obj[k]>=3,at:0};return obj[k]||(obj[k]={self:0,mastered:false,at:0})}
function soundMastered(s){return !!parentSounds()[s]||state(soundProgress,s).mastered}
function graphemes(word){const all=soundsThroughLevel(),known=[...all].sort((a,b)=>b.length-a.length).filter(x=>!x.includes('_'));let out=[],magicIndex=-1,magicKey=null;if(word.endsWith('e')&&word.length>=4){for(let i=0;i<word.length-1;i++){const key=word[i]+'_e';if(all.includes(key)){magicIndex=i;magicKey=key;break}}}for(let i=0;i<word.length;){if(i===magicIndex){out.push(magicKey);i++;continue}if(magicKey&&i===word.length-1&&word[i]==='e'){i++;continue}const g=known.find(x=>word.startsWith(x,i));out.push(g||word[i]);i+=(g||word[i]).length}return [...new Set(out)]}function wordAvailable(w){return graphemes(w.word).every(soundMastered)}

function availableWords(){return wordsThroughLevel().filter(wordAvailable)}
const readProgress=getJson('phonika-en-word-progress',{});
let queue=[],index=0,reads={},marked=false,assisted=false;
const $=id=>document.getElementById(id);
const lang=()=>window.PhonikaI18n?.language||localStorage.getItem('uiLanguage')||'ru';
const isEN=()=>lang()==='en';
const save=()=>localStorage.setItem('phonika-en-word-progress',JSON.stringify(readProgress));
const shown=w=>{const s=window.style||'upper';return s==='upper'||s==='handUpper'?w.toUpperCase():s==='title'||s==='handTitle'?w[0].toUpperCase()+w.slice(1):w};
const renderWord=w=>{const el=$('word');el.replaceChildren(...[...shown(w)].map(ch=>{const span=document.createElement('span');span.textContent=ch;span.className='aeiou'.includes(ch.toLowerCase())?'vowel':'consonant';return span}));el.classList.toggle('hand',String(window.style||'').startsWith('hand'))};
const notice=document.createElement('div');notice.id='languageReadingNotice';notice.className='panel';notice.hidden=true;
$('readingView').insertAdjacentElement('afterend',notice);
let lastLang='ru',ruSnapshot=null,done=false,step=0;
const track=()=>document.querySelector('#readingView .dino-track');
const snapshotRU=()=>{if(ruSnapshot)return;const ids=['word','pic','reward','confirmation','readOk'];ruSnapshot={nodes:Object.fromEntries(ids.map(id=>[id,$(id)?.innerHTML])),track:track()?.innerHTML,readHidden:$('readingView').hidden,finishHidden:$('finishView').hidden};};
const restoreRU=()=>{if(!ruSnapshot)return;for(const [id,html] of Object.entries(ruSnapshot.nodes)){if($(id)&&html!==undefined)$(id).innerHTML=html}if(track()&&ruSnapshot.track!==undefined)track().innerHTML=ruSnapshot.track;$('readingView').hidden=ruSnapshot.readHidden;$('finishView').hidden=ruSnapshot.finishHidden;ruSnapshot=null;};
const goal=()=>queue.length*2;
const updateTrack=()=>{const t=track();if(!t)return;const steps=t.querySelector('.dino-steps');if(steps){steps.replaceChildren(...Array.from({length:goal()},(_,i)=>{const el=document.createElement('span');el.className='dino-step'+(i<step?' done':'');if(i<step)el.innerHTML='<span class="step-check">✓</span>';return el}))}const d=t.querySelector('.dino');if(d)d.style.left='calc('+Math.min(100,step/Math.max(1,goal())*100)+'% - '+Math.min(46,step/Math.max(1,goal())*46)+'px)'};
const finishEN=()=>{done=true;$('readingView').hidden=true;notice.hidden=false;notice.replaceChildren();const h=document.createElement('h1');h.textContent='Great!';const p=document.createElement('p');p.textContent=queue.length+' words read!';const again=document.createElement('button');again.className='primary';again.textContent='Again';again.onclick=()=>{queue=[];reads={};step=0;done=false;show()};notice.append(h,p,again)};
const show=()=>{
 const l=lang(),reading=$('readingView'),finish=$('finishView');
 if(l==='ru'){notice.hidden=true;restoreRU();lastLang='ru';return}
 if(lastLang==='ru')snapshotRU();lastLang=l;
 finish.hidden=true;
 if(l==='fr'){reading.hidden=true;notice.hidden=false;notice.textContent='Le parcours de lecture en français sera bientôt disponible.';return}
 const available=availableWords();
 const previous=queue.length;
 queue=queue.filter(w=>available.some(x=>x.word===w));
 if(!queue.length&&available.length){queue=available.slice(0,Math.max(1,Number($('wordSessionSize')?.value)||5)).map(x=>x.word);index=0;reads={};step=0;done=false}
 if(previous!==queue.length)step=Math.min(step,goal());
 if(!queue.length){reading.hidden=true;notice.hidden=false;notice.replaceChildren();const p=document.createElement('p');p.textContent='Not enough sounds learned yet. Learn a few more sounds to unlock new words.';const b=document.createElement('button');b.className='primary';b.textContent='Go to Sounds';b.onclick=()=>{$('parentOpen')?.click();$('knownSounds')?.scrollIntoView({block:'center'})};notice.append(p,b);return}
 if(done){finishEN();return}
 notice.hidden=true;reading.hidden=false;index=Math.min(index,queue.length-1);
 const w=queue[index],obj=available.find(x=>x.word===w);
 if(!obj||!wordAvailable(obj)){queue=queue.filter(x=>x!==w);show();return}
 renderWord(w);$('pic').textContent=obj.picture;$('pic').hidden=true;$('reward').textContent='';$('confirmation').textContent='';$('readOk').disabled=false;$('readOk').classList.remove('done');$('readOk').textContent='✓ I read it myself';$('readOk').dataset.continueNext='';marked=false;assisted=false;updateTrack();
};
const advance=(delta=1)=>{if(!queue.length)return;if(delta>0&&index===queue.length-1){if(queue.every(w=>(reads[w]||0)>=2)){finishEN();return}index=queue.findIndex(w=>(reads[w]||0)<2);if(index<0)index=0}else index=(index+delta+queue.length)%queue.length;show()};
document.addEventListener('click',e=>{
 if(lang()==='ru'||$('parentView')?.hidden===false)return;
 const b=e.target.closest('button');if(!b)return;
 const nav=b.closest('#readingView .lesson-nav');
 const target=nav?(b.classList.contains('nav-prev')?'prev':'next'):b.id;
 if(!['prev','next','readOk','help','showPicture'].includes(target))return;
 e.stopImmediatePropagation();e.preventDefault();
 if(lang()!=='en'||!queue.length)return;
 if(target==='prev'){advance(-1);return}
 if(target==='next'){advance();return}
 if(target==='readOk'){
   if(b.dataset.continueNext==='1'){advance();return}
   if(marked||assisted)return;
   const w=queue[index],obj=availableWords().find(x=>x.word===w);if(!obj||!wordAvailable(obj)){show();return}
   const p=state(readProgress,w);p.self=Math.min(3,p.self+1);if(p.self>=3){p.mastered=true;p.at=Date.now()}save();
   reads[w]=Math.min(2,(reads[w]||0)+1);step=Math.min(goal(),step+1);marked=true;
   b.dataset.continueNext='1';b.textContent='Continue →';$('confirmation').textContent=p.mastered?'Mastered!':'Counted';updateTrack();if(queue.every(x=>(reads[x]||0)>=2))setTimeout(()=>{if(lang()==='en')finishEN()},500);
   return
 }
 assisted=true;if(target==='showPicture')$('pic').hidden=false;else if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(queue[index]||'');u.lang='en-GB';speechSynthesis.speak(u)}
},true);
window.addEventListener('phonika:ui-language',()=>requestAnimationFrame(show));
document.addEventListener('DOMContentLoaded',()=>{if(lang()!=='ru')requestAnimationFrame(show);$('parentBack')?.addEventListener('click',()=>requestAnimationFrame(show));$('wordsTab')?.addEventListener('click',()=>requestAnimationFrame(show));$('wordSessionSize')?.addEventListener('change',()=>{queue=[];requestAnimationFrame(show)});});
window.PhonikaENReading={availableWords,wordAvailable,refresh:show};
})();
