'use strict';
// Language-specific Sounds view. EN inventory and associations from phonika-en/app-core.js.
// RU state and handlers are not modified.
(()=>{
const ASSOC={s:['sun','☀️'],a:['apple','🍎'],t:['tiger','🐯'],p:['pig','🐷'],i:['insect','🐞'],n:['nest','🪺'],m:['map','🗺️'],d:['dog','🐶'],g:['goat','🐐'],o:['orange','🍊'],c:['cat','🐱'],k:['kite','🪁'],e:['egg','🥚'],u:['umbrella','☂️'],r:['rabbit','🐰'],h:['hat','🎩'],b:['ball','⚽'],f:['fish','🐟'],l:['lion','🦁'],j:['jam','🍓'],v:['van','🚐'],w:['web','🕸️'],x:['box','📦'],y:['yak','🐂'],z:['zebra','🦓'],ck:['duck','🦆'],ff:['puff','💨'],ll:['bell','🔔'],ss:['kiss','💋'],st:['stop','🛑'],sp:['spin','🌀'],sn:['snail','🐌'],cr:['crab','🦀'],tr:['tree','🌳'],pl:['plant','🌱'],bl:['block','🧱'],cl:['clap','👏'],fr:['frog','🐸'],gr:['grin','😁'],sh:['ship','🚢'],ch:['chair','🪑'],th:['thumb','👍'],ng:['ring','💍'],qu:['queen','👑'],'a_e':['cake','🎂'],'i_e':['bike','🚲'],'o_e':['home','🏠'],'u_e':['cube','🧊'],ai:['rain','🌧️'],ay:['play','⚽'],ee:['feet','🦶'],ea:['sea','🌊'],oa:['boat','⛵'],ow:['snow','❄️'],oo:['moon','🌙'],ar:['car','🚗'],or:['fork','🍴'],ur:['turn','↩️'],er:['fern','🌿'],ir:['bird','🐦'],ou:['cloud','☁️'],oi:['coin','🪙'],oy:['boy','👦'],igh:['night','🌙'],air:['chair','🪑'],ear:['hear','👂'],ure:['pure','💧']};
const EN_LEVEL_SOUNDS=[['s','a','t','p','n','c','b','h','m','f'],['i','l'],['o','d','g'],['e','r'],['u'],[],['sh','ch','th','ck','ng'],['st','sp','sw','fl','cl','tr','gr','fr'],['a_e','i_e','o_e','u_e'],['ee','ai','ay','oa','oo']];
const EN_SOUNDS=[...new Set(EN_LEVEL_SOUNDS.flat())],FR_SOUNDS='abcdefghijklmnopqrstuvwxyz'.split('');
const EN_VOWELS=new Set(['a','e','i','o','u','a_e','i_e','o_e','u_e','ee','ai','ay','oa','oo']);
const $=id=>document.getElementById(id);
const lang=()=>window.PhonikaI18n?.language||localStorage.getItem('uiLanguage')||'ru';
const json=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'{}')||{}}catch{return {}}};
const soundState=()=>json('phonika-en-sound-progress');
const parentState=()=>json('phonika-en-known-sounds');
const mastered=k=>!!parentState()[k]||!!soundState()[k]?.mastered;
let active='ru',queue=[],index=0,reads={},assisted=false,marked=false,finished=false,ruView=null;
const view=$('lettersView'),card=$('letterCard'),picture=$('letterPicture'),known=$('letterKnown');
const notice=document.createElement('p');notice.id='languageSoundNotice';notice.className='intro';notice.hidden=true;view.querySelector('.stage').append(notice);
const current=()=>queue[index];
const inventory=()=>lang()==='fr'?FR_SOUNDS:EN_SOUNDS;
const display=k=>k.includes('_')?k.replace('_','…'):k;
const styled=k=>{const st=typeof style==='string'?style:'upper';const val=display(k);return st==='upper'||st==='handUpper'?val.toUpperCase():st==='title'||st==='handTitle'?val[0].toUpperCase()+val.slice(1):val};
const save=(k)=>{const progress=soundState(),old=progress[k]||{},self=Math.min(3,Number(old.self||0)+1);progress[k]={...old,self,mastered:self>=3||!!old.mastered,at:self>=3?Date.now():(old.at||0)};localStorage.setItem('phonika-en-sound-progress',JSON.stringify(progress));window.PhonikaENReading?.refresh?.();};
const ruSnapshot=()=>{if(ruView)return;ruView={card:card.innerHTML,cardClass:card.className,picture:picture.innerHTML,pictureHidden:picture.hidden,known:known.innerHTML,knownDisabled:known.disabled,viewHidden:view.hidden,finishHidden:$('letterFinishView').hidden};};
const restoreRU=()=>{if(!ruView)return;card.innerHTML=ruView.card;card.className=ruView.cardClass;picture.innerHTML=ruView.picture;picture.hidden=ruView.pictureHidden;known.innerHTML=ruView.known;known.disabled=ruView.knownDisabled;view.hidden=ruView.viewHidden;$('letterFinishView').hidden=ruView.finishHidden;ruView=null;};
const render=()=>{
 if(lang()==='ru'){notice.hidden=true;restoreRU();active='ru';return}
 if(active==='ru')ruSnapshot();active=lang();
 if(section!=='letters')return;
 view.hidden=false;$('letterFinishView').hidden=true;
 if(!queue.length||!inventory().includes(current())){queue=inventory().slice(0,Math.max(1,Number($('letterSessionSize')?.value)||5));index=0;reads={};finished=false}
 const k=current();if(!k)return;
 card.textContent=styled(k);card.className='letter-card '+((lang()==='fr'?'aeiouy'.includes(k):EN_VOWELS.has(k))?'vowel':'consonant')+(typeof style==='string'&&style.startsWith('hand')?' hand':'');
 picture.hidden=true;picture.textContent=lang()==='en'?(ASSOC[k]?.[1]||''):'';
 notice.hidden=lang()!=='fr';notice.textContent='French phoneme audio is not available yet.';
 $('letterHelp').disabled=lang()==='fr';$('letterShowPicture').disabled=lang()==='fr';
 $('letterShowPicture').textContent=lang()==='fr'?'Audio unavailable':'Show picture';
 $('letterHelp').textContent=lang()==='fr'?'Audio unavailable':'Help me read';
 known.disabled=false;known.dataset.continueNext='';known.textContent='✓ I know this sound';marked=false;assisted=false;
};
const next=(delta=1)=>{if(!queue.length)return;index=(index+delta+queue.length)%queue.length;render()};
const speakExample=()=>{const k=current(),text=ASSOC[k]?.[0];if(!text||!('speechSynthesis'in window))return;speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-GB';utterance.rate=.7;speechSynthesis.speak(utterance)};
document.addEventListener('click',e=>{
 if(lang()==='ru'||section!=='letters'||$('parentView')?.hidden===false)return;
 const b=e.target.closest('button');if(!b)return;
 const nav=b.closest('#lettersView .lesson-nav');
 const action=nav?(b.classList.contains('nav-prev')?'prev':'next'):b.id;
 if(!['prev','next','letterHelp','letterShowPicture','letterKnown','letterPicture'].includes(action))return;
 e.preventDefault();e.stopImmediatePropagation();
 if(action==='prev'){next(-1);return}
 if(action==='next'){next();return}
 if(action==='letterHelp'||action==='letterPicture'){if(lang()==='en'){assisted=true;speakExample()}return}
 if(action==='letterShowPicture'){if(lang()==='en'){assisted=true;picture.hidden=!picture.hidden}return}
 if(action==='letterKnown'){
  if(known.dataset.continueNext==='1'){next();return}
  if(marked||assisted)return;
  if(lang()==='en')save(current());
  // FR has no independent mastery contract for child Sounds.
  marked=true;known.dataset.continueNext='1';known.textContent='Continue →';
  reads[current()]=(reads[current()]||0)+1;
 }
},true);
const refresh=()=>{if(lang()==='ru'){render();return}if(section==='letters')render()};
window.addEventListener('phonika:ui-language',()=>requestAnimationFrame(refresh));
document.addEventListener('DOMContentLoaded',()=>{
 $('lettersTab')?.addEventListener('click',()=>requestAnimationFrame(refresh));
 $('parentBack')?.addEventListener('click',()=>requestAnimationFrame(refresh));
 $('childHome')?.addEventListener('click',()=>requestAnimationFrame(refresh));
 $('letterSessionSize')?.addEventListener('change',()=>{queue=[];requestAnimationFrame(refresh)});
 if(lang()!=='ru')requestAnimationFrame(refresh);
});
window.PhonikaSounds={refresh,inventory:()=>[...inventory()],mastered};
})();
