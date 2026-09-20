'use strict';
document.write('<script src="./app-core.js?v=52"><\/script>');
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('letterNext')?.remove();document.getElementById('next')?.remove();
  if(!localStorage.getItem('ss-style') && !(Storage.load()||{}).style){style='upper';persist();}
  const stylePanel=document.getElementById('letterStyle')?.closest('.panel'),summary=document.querySelector('#parentView .parent-summary');if(stylePanel&&summary)summary.insertAdjacentElement('afterend',stylePanel);
  const icon=(name)=>({home:'<svg viewBox="0 0 24 24"><path d="M3 11.2 12 3l9 8.2v9.3a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z"/></svg>',chart:'<svg viewBox="0 0 24 24"><rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>',sound:'<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 8.2a5 5 0 0 1 0 7.6M18.7 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',eyeOff:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="currentColor"/><circle cx="12" cy="12" r="3" fill="white"/><path d="M4 4 20 20" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"/></svg>',check:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="white"/><path d="m7.5 12 3 3 6-7" fill="none" stroke="#35b96f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',left:'<svg viewBox="0 0 24 24"><path d="M14.5 5 7.5 12l7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',right:'<svg viewBox="0 0 24 24"><path d="m9.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'})[name];
  const brand=document.querySelector('#childView .brand');if(brand){brand.className='brand brand-lockup';brand.innerHTML=`<span class="brand-home">${icon('home')}</span><span><strong>Phonika.ru</strong><small>Читаем вместе!</small></span>`;}const parentOpen=document.getElementById('parentOpen');if(parentOpen)parentOpen.innerHTML=`${icon('chart')}<span>Кабинет родителя</span>`;
  const card=document.getElementById('letterCard'),letterPictureBtn=document.getElementById('letterShowPicture'),letterPicture=document.getElementById('letterPicture'),letterMastery=document.getElementById('letterKnown'),word=document.getElementById('word'),wordPictureBtn=document.getElementById('showPicture'),wordPicture=document.getElementById('pic'),wordMastery=document.getElementById('readOk'),help=document.getElementById('help');
  const letterActions=document.querySelector('#lettersView .actions'),letterHelp=document.createElement('button');letterHelp.type='button';letterHelp.id='letterHelp';letterHelp.className='help';if(letterActions)letterActions.insertBefore(letterHelp,letterPictureBtn);
  const pictureLabel=(btn,picture,isExample=false)=>{const hidden=picture.hidden;btn.innerHTML=hidden?`<span>${isExample?'Показать пример':'Показать картинку'}</span>`:`${icon('eyeOff')}<span>${isExample?'Скрыть пример':'Скрыть картинку'}</span>`;};
  const setActionLabels=()=>{if(help)help.innerHTML=`${icon('sound')}<span>Помоги прочитать</span>`;letterHelp.innerHTML=`${icon('sound')}<span>Помоги прочитать</span>`;if(wordPictureBtn)pictureLabel(wordPictureBtn,wordPicture);if(letterPictureBtn){const x=currentLetter();pictureLabel(letterPictureBtn,letterPicture,!!(x&&isSign(x[0])));}if(wordMastery&&!wordMastery.classList.contains('done'))wordMastery.innerHTML=`${icon('check')}<span>Прочитал сам</span>`;if(letterMastery&&!letterMastery.classList.contains('done'))letterMastery.innerHTML=`${icon('check')}<span>Прочитал сам</span>`;};
  card.onclick=null;word.onclick=null;letterPicture.onclick=null;wordPicture.onclick=null;
  letterHelp.onclick=()=>{const x=currentLetter();if(!x)return;letterMastery.disabled=true;speak(x[1]);};if(help)help.onclick=()=>{if(!current)return;usedHint=true;wordMastery.disabled=true;speak(current[0],.68);};
  letterPictureBtn.onclick=()=>{const x=currentLetter();if(!x)return;letterMastery.disabled=true;letterPicture.hidden=!letterPicture.hidden;setActionLabels();};wordPictureBtn.onclick=()=>{if(!current)return;usedHint=true;wordMastery.disabled=true;wordPicture.hidden=!wordPicture.hidden;setActionLabels();};
  const REQUIRED_SESSION_READS=3;
  const lessonGoals={words:new Set(),letters:new Set()},lessonSuccesses={words:new Map(),letters:new Map()};
  const resetLessonGoal=(kind)=>{
    const items=kind==='words'?sessionWords:letterSession;
    const size=kind==='words'?wordSessionSize:letterSessionSize;
    lessonGoals[kind]=new Set(items.slice(0,size));
    lessonSuccesses[kind]=new Map([...lessonGoals[kind]].map(key=>[key,0]));
    if(kind==='words')$('finishView').hidden=true;else $('letterFinishView').hidden=true;
  };
  const markLessonPassed=(kind,key)=>{
    if(!lessonGoals[kind].has(key))return;
    lessonSuccesses[kind].set(key,Math.min(REQUIRED_SESSION_READS,(lessonSuccesses[kind].get(key)||0)+1));
  };
  const unresolvedLessonItems=(kind)=>[...lessonGoals[kind]].filter(key=>(lessonSuccesses[kind].get(key)||0)<REQUIRED_SESSION_READS);
  const allLessonItemsMastered=(kind)=>lessonGoals[kind].size>0&&unresolvedLessonItems(kind).length===0;
  const restartPendingCycle=(kind)=>{
    const pending=unresolvedLessonItems(kind);
    if(!pending.length)return false;
    if(kind==='words'){sessionWords=pending;sessionIndex=0;$('finishView').hidden=true;$('readingView').hidden=false;showSessionWord();wordMastery.disabled=false;usedHint=false;markedThisTurn=false;}
    else{letterSession=pending;letterIndex=0;$('letterFinishView').hidden=true;$('lettersView').hidden=false;showLetter();}
    setActionLabels();navRefreshers[kind]?.();return true;
  };
  const completeLesson=(kind)=>{
    if(!allLessonItemsMastered(kind)){restartPendingCycle(kind);return;}
    if(kind==='words'){$('readingView').hidden=true;$('finishView').hidden=false;}
    else{$('lettersView').hidden=true;$('letterFinishView').hidden=false;}
  };
  const navRefreshers={};
  const makeNav=(view,kind)=>{
    const stage=view?.querySelector('.stage');if(!stage)return;
    const nav=document.createElement('div');nav.className='lesson-nav';
    const prev=document.createElement('button');prev.type='button';prev.className='nav-arrow nav-prev';prev.setAttribute('aria-label','Предыдущий');prev.innerHTML=icon('left');
    const next=document.createElement('button');next.type='button';next.className='nav-arrow nav-next';next.setAttribute('aria-label','Следующий');next.innerHTML=icon('right');
    nav.append(prev,next);stage.append(nav);
    const state=()=>({i:kind==='words'?sessionIndex:letterIndex,total:kind==='words'?sessionWords.length:letterSession.length});
    const refresh=()=>{const {total}=state();prev.hidden=total<=0;next.hidden=total<=0;};
    navRefreshers[kind]=refresh;
    prev.onclick=()=>{const {total}=state();if(!total)return;if(kind==='words'){sessionIndex=sessionIndex<=0?total-1:sessionIndex-1;showSessionWord();wordMastery.disabled=false;usedHint=false;markedThisTurn=false;}else{letterIndex=letterIndex<=0?total-1:letterIndex-1;showLetter();letterMastery.disabled=false;}setActionLabels();refresh();};
    next.onclick=()=>{
      const {i,total}=state();if(!total)return;
      if(i>=total-1){
        if(allLessonItemsMastered(kind)){completeLesson(kind);return;}
        restartPendingCycle(kind);refresh();return;
      }
      if(kind==='words'){sessionIndex++;showSessionWord();wordMastery.disabled=false;usedHint=false;markedThisTurn=false;}
      else{letterIndex++;showLetter();letterMastery.disabled=false;}
      setActionLabels();refresh();
    };
    refresh();
  };
  makeNav(document.getElementById('readingView'),'words');makeNav(document.getElementById('lettersView'),'letters');
  const ensureSoundCards=()=>{if(section!=='letters'||letterSession.length)return;const review=letters.map(x=>x[0]).filter(ch=>lst(ch).mastered).sort((a,b)=>lst(a).masteredAt-lst(b).masteredAt);letterSession=(review.length?review:letters.map(x=>x[0])).slice(0,letterSessionSize);letterIndex=0;$('lettersView').hidden=false;if(letterSession.length)showLetter();setActionLabels();navRefreshers.letters?.();};
  const baseWordMastery=wordMastery.onclick;
  wordMastery.onclick=(event)=>{
    if(wordMastery.disabled||usedHint||markedThisTurn)return;
    const key=current?.[0];if(!key)return;
    if(typeof baseWordMastery==='function')baseWordMastery.call(wordMastery,event);
    if(markedThisTurn)markLessonPassed('words',key);
  };
  const baseLetterMastery=letterMastery.onclick;
  letterMastery.onclick=(event)=>{
    if(letterMastery.disabled)return;
    const key=currentLetter()?.[0];if(!key)return;
    if(typeof baseLetterMastery==='function')baseLetterMastery.call(letterMastery,event);
    if(letterMarked)markLessonPassed('letters',key);
  };
  const finishGuard=new MutationObserver(()=>{
    if(!$('finishView').hidden&&!allLessonItemsMastered('words')){$('finishView').hidden=true;$('readingView').hidden=false;restartPendingCycle('words');}
    if(!$('letterFinishView').hidden&&!allLessonItemsMastered('letters')){$('letterFinishView').hidden=true;$('lettersView').hidden=false;restartPendingCycle('letters');}
  });
  finishGuard.observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  const refreshCurrentNav=()=>{ensureSoundCards();navRefreshers[section==='letters'?'letters':'words']?.();};
  $('lettersTab').addEventListener('click',()=>requestAnimationFrame(()=>{ensureSoundCards();resetLessonGoal('letters');refreshCurrentNav();}));
  $('wordsTab').addEventListener('click',()=>requestAnimationFrame(()=>{resetLessonGoal('words');refreshCurrentNav();}));
  switchSection(section==='letters'?'letters':'words');ensureSoundCards();resetLessonGoal(section==='letters'?'letters':'words');setActionLabels();refreshCurrentNav();requestAnimationFrame(()=>{ensureSoundCards();setActionLabels();refreshCurrentNav();});setTimeout(()=>{ensureSoundCards();setActionLabels();refreshCurrentNav();},0);
});