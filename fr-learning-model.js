'use strict';
// French correspondences and eligibility: the approved course is the only word source.
(()=>{
const words=window.PhonikaFRWords||[];
const key=s=>s.silent?'rule:silent-final-'+s.grapheme.toLowerCase():s.grapheme.toLowerCase()+'|'+s.phoneme;
const requirements=w=>[...new Set([...w.segments.map(key),...(w.rules||[]).filter(r=>r.startsWith('silent-final-')).map(r=>'rule:'+r)])];
const inventory=[...new Map(words.flatMap(w=>w.segments.map(s=>[key(s),{key:key(s),grapheme:s.grapheme,phoneme:s.phoneme,silent:s.silent,example:w.word}]))).values()];
const progressKey='phonika-fr-known-correspondences';
const read=()=>{try{return JSON.parse(localStorage.getItem(progressKey)||'{}')||{}}catch{return {}}};
const known=k=>!!read()[k];
const set=(k,value)=>{const p=read();p[k]=!!value;localStorage.setItem(progressKey,JSON.stringify(p));window.dispatchEvent(new Event('phonika:fr-mastery'));};
const eligible=w=>requirements(w).every(known);
window.PhonikaFR={words,inventory,requirements,read,known,set,eligible,available:()=>words.filter(eligible),progressKey};
})();
