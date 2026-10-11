'use strict';
// Shared presentation-only fitter for RU, EN and future FR Reading.
(()=>{
 const reading=document.getElementById('readingView'),word=document.getElementById('word');
 if(!reading||!word)return;
 let frame=0;
 const fit=()=>{
  if(reading.hidden||!word.children.length)return;
  const stage=word.closest('.stage'),box=stage?.getBoundingClientRect();
  if(!box?.width)return;
  const middle=box.left+box.width/2;
  let left=box.left+8,right=box.right-8;
  reading.querySelectorAll('.lesson-nav .nav-arrow').forEach(arrow=>{
   if(arrow.hidden||getComputedStyle(arrow).display==='none')return;
   const r=arrow.getBoundingClientRect();
   if(!r.width||!r.height)return;
   if(r.left<middle&&r.right>left)left=Math.max(left,r.right+8);
   if(r.right>middle&&r.left<right)right=Math.min(right,r.left-8);
  });
  const available=Math.max(1,2*Math.min(middle-left,right-middle));
  word.style.maxWidth=available+'px';
  word.style.fontSize='116px';
  let size=116;
  if(word.scrollWidth>available){
   size=Math.max(12,Math.floor(size*available/word.scrollWidth));
   word.style.fontSize=size+'px';
   while(word.scrollWidth>available&&size>12)word.style.fontSize=(--size)+'px';
  }
 };
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit)};
 new MutationObserver(schedule).observe(word,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
 new MutationObserver(schedule).observe(reading,{attributes:true,attributeFilter:['hidden']});
 if('ResizeObserver'in window)new ResizeObserver(schedule).observe(word.closest('.stage'));
 window.addEventListener('resize',schedule);
 window.addEventListener('orientationchange',schedule);
 window.addEventListener('phonika:ui-language',schedule);
 document.addEventListener('click',e=>{if(e.target.closest('.style-option,#wordsTab,#parentBack'))schedule()},true);
 document.fonts?.ready.then(schedule);
 window.PhonikaWordFit={fit,schedule};
 schedule();
})();
