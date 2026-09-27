'use strict';

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PhonikaGameDomain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SessionStatus=Object.freeze({NOT_STARTED:'NOT_STARTED',PLAYING:'PLAYING',COMPLETED:'COMPLETED'});
  let idSequence=0;
  const nextId=prefix=>`${prefix}-${++idSequence}`;

  class GameTask {
    constructor({id=nextId('task')}={}){this.id=id;this.attempted=false;this.completed=false;this.hadWrongAttempt=false;this.rewarded=false;this.closed=false;this.passNumber=1;this.attempts=[];}
    beginRetryPass(){if(this.rewarded)throw new Error('Rewarded task cannot be retried');this.passNumber++;this.attempted=false;this.completed=false;this.hadWrongAttempt=false;this.resetPassState();return this;}
    resetPassState(){}
  }

  class MissingWordTask extends GameTask {
    constructor({id,targetWord,firstWord,secondWord,missingWord,distractor,answers}){super({id});if(typeof targetWord!=='string'||typeof firstWord!=='string'||typeof secondWord!=='string'||typeof missingWord!=='string')throw new TypeError('MissingWordTask word fields must be strings');if(!Array.isArray(answers)||!answers.includes(missingWord))throw new TypeError('MissingWordTask answers must include missingWord');this.targetWord=targetWord;this.firstWord=firstWord;this.secondWord=secondWord;this.missingWord=missingWord;this.distractor=distractor??null;this.answers=[...answers];this.phase='memorize';}
    resetPassState(){this.phase='memorize';}
  }

  class FindTask extends GameTask {
    constructor({id,mode,targetWord=null,targetSyllable=null,picture='',answers}){super({id});if(mode!=='words'&&mode!=='syllables')throw new TypeError('FindTask mode must be words or syllables');const target=mode==='words'?targetWord:targetSyllable;if(typeof target!=='string'||!target)throw new TypeError('FindTask target must be a non-empty string');if(!Array.isArray(answers)||!answers.includes(target))throw new TypeError('FindTask answers must include target');this.mode=mode;this.targetWord=mode==='words'?target:null;this.targetSyllable=mode==='syllables'?target:null;this.picture=picture||'';this.answers=[...answers];}
    get target(){return this.mode==='words'?this.targetWord:this.targetSyllable;}
  }

  class CatchTask extends GameTask {
    constructor({id,targetWord,distractor=null,answers}){super({id});if(typeof targetWord!=='string'||!targetWord)throw new TypeError('CatchTask targetWord must be a non-empty string');if(!Array.isArray(answers)||!answers.includes(targetWord))throw new TypeError('CatchTask answers must include targetWord');this.targetWord=targetWord;this.distractor=distractor;this.answers=[...answers];}
  }

  class Attempt {
    constructor({id=nextId('attempt'),answer,correct,firstAttempt,taskId,sessionId,passNumber,taskIndex}){this.id=id;this.answer=answer;this.correct=Boolean(correct);this.firstAttempt=Boolean(firstAttempt);this.taskId=taskId;this.sessionId=sessionId;this.passNumber=passNumber;this.taskIndex=taskIndex;}
  }

  class GameSession {
    constructor({id=nextId('session')}={}){this.id=id;this.originalTasks=[];this.tasks=[];this.currentIndex=0;this.status=SessionStatus.NOT_STARTED;}
    start(tasks){if(this.status!==SessionStatus.NOT_STARTED)throw new Error('Session can only be started once');this.originalTasks=[...tasks];this.tasks=[...tasks];this.currentIndex=0;this.status=SessionStatus.PLAYING;return this;}
    get currentTask(){return this.tasks[this.currentIndex]||null;}
    get completedTasks(){return this.originalTasks.filter(task=>task.completed);}
    get rewardedCount(){return this.originalTasks.filter(task=>task.rewarded).length;}
    get isRewardComplete(){return this.originalTasks.length>0&&this.rewardedCount===this.originalTasks.length;}
    previous(){if(this.status===SessionStatus.PLAYING&&this.currentIndex>0)this.currentIndex--;return this.currentTask;}
    next(){if(this.status!==SessionStatus.PLAYING)return null;if(this.currentIndex<this.tasks.length-1){this.currentIndex++;return this.currentTask;}return null;}
    replaceTasks(tasks){if(this.status!==SessionStatus.PLAYING)throw new Error('Only a playing session can replace tasks');this.tasks=[...tasks];this.currentIndex=0;return this;}
    complete(){if(!this.isRewardComplete)throw new Error('Session cannot complete before all original tasks are rewarded');this.status=SessionStatus.COMPLETED;return this;}
  }

  class Game {
    constructor({shuffle,arrangeTasks,random=Math.random}={}){this.shuffle=shuffle||((items)=>[...items]);this.arrangeTasks=arrangeTasks||((tasks)=>[...tasks]);this.random=random;}
    answerTask(session,selected,isCorrect){const task=this.playingTask(session);if(!task||task.completed)return null;const correct=Boolean(isCorrect),attempt=new Attempt({answer:selected,correct,firstAttempt:!task.attempted,taskId:task.id,sessionId:session.id,passNumber:task.passNumber,taskIndex:session.currentIndex});task.attempts.push(attempt);task.attempted=true;if(correct){task.completed=true;const rewarded=!task.hadWrongAttempt&&!task.rewarded;if(rewarded){task.rewarded=true;task.closed=true;}return{attempt,task,rewarded};}task.hadWrongAttempt=true;return{attempt,task,rewarded:false};}
    previous(session){return this.requireSession(session).previous();}
    advanceSession(session){this.requireSession(session);if(session.status!==SessionStatus.PLAYING||!session.currentTask?.completed)return{type:'BLOCKED',task:session.currentTask};const next=session.next();if(next)return{type:'NEXT',task:next};if(session.isRewardComplete){session.complete();return{type:'COMPLETED'};}const pending=session.originalTasks.filter(task=>!task.rewarded).map(task=>task.beginRetryPass());session.replaceTasks(this.shuffle(pending));return{type:'RETRY',task:session.currentTask};}
    requireSession(session){if(!(session instanceof GameSession))throw new TypeError('GameSession is required');return session;}
    playingTask(session){this.requireSession(session);return session.status===SessionStatus.PLAYING?session.currentTask:null;}
    createDoubleExposureTasks(items,fallbackPool,makeTask){const current=[...new Set(items)],fallback=[...new Set(fallbackPool)],tasks=[];current.forEach(target=>{const primary=this.shuffle(current.filter(item=>item!==target)),extra=this.shuffle(fallback.filter(item=>item!==target&&!primary.includes(item))),pool=[...primary,...extra],distractors=pool.slice(0,2);if(!distractors.length){tasks.push(makeTask(target,null));return;}if(distractors.length===1)distractors.push(distractors[0]);distractors.forEach(distractor=>tasks.push(makeTask(target,distractor)));});return this.arrangeTasks(tasks);}
  }

  class MissingWordGame extends Game {
    createSession(wordPool,sessionSize){const pool=[...new Set(wordPool)],count=Math.min(pool.length,Math.max(1,Number(sessionSize)||5)),words=this.shuffle(pool).slice(0,count),tasks=[];words.forEach(target=>{for(let exposure=0;exposure<2;exposure++){const remaining=this.shuffle(words.filter(word=>word!==target))[0]||target,distractor=this.shuffle(words.filter(word=>word!==target&&word!==remaining))[0]||remaining,hideFirst=this.random()<.5;tasks.push(new MissingWordTask({targetWord:target,firstWord:hideFirst?target:remaining,secondWord:hideFirst?remaining:target,missingWord:target,distractor,answers:distractor===target?[target]:this.shuffle([target,distractor])}));}});return new GameSession().start(this.arrangeTasks(tasks));}
    reveal(session){const task=this.playingTask(session);if(task&&!task.completed)task.phase='answer';return task;}
    answer(session,selected){const task=this.playingTask(session);return task?this.answerTask(session,selected,selected===task.missingWord):null;}
    advance(session){return this.advanceSession(session);}
  }

  class FindGame extends Game {
    createWordSession(wordEntries,sessionSize){const entries=this.uniqueWordEntries(wordEntries),count=Math.min(entries.length,Math.max(1,Number(sessionSize)||5)),selected=this.shuffle(entries.map(item=>item.word)).slice(0,count),byWord=new Map(entries.map(item=>[item.word,item]));const tasks=this.createDoubleExposureTasks(selected,entries.map(item=>item.word),(target,distractor)=>this.makeWordTask(target,distractor,byWord));return new GameSession().start(tasks);}
    createSyllableSession(syllablePool,sessionSize){const syllables=[...new Set(syllablePool.map(value=>String(value||'').trim().toLocaleLowerCase('ru-RU')).filter(Boolean))],count=Math.min(syllables.length,Math.max(1,Number(sessionSize)||5)),targets=this.shuffle(syllables).slice(0,count);return new GameSession().start(targets.map(target=>new FindTask({mode:'syllables',targetSyllable:target,answers:this.syllableAnswers(target,syllables)})));}
    answer(session,selected){const task=this.playingTask(session);return task?this.answerTask(session,selected,selected===task.target):null;}
    advance(session){return this.advanceSession(session);}
    uniqueWordEntries(entries){const seen=new Set(),result=[];entries.forEach(entry=>{const word=Array.isArray(entry)?entry[0]:entry?.word,picture=Array.isArray(entry)?entry[1]:entry?.picture;if(typeof word==='string'&&word&&!seen.has(word)){seen.add(word);result.push({word,picture:picture||''});}});return result;}
    makeWordTask(target,distractor,byWord){return new FindTask({mode:'words',targetWord:target,picture:byWord.get(target)?.picture||'',answers:distractor?this.shuffle([target,distractor]):[target]});}
    syllableAnswers(target,syllables){const consonant=target[0],vowel=target[1],sameConsonant=syllables.filter(x=>x!==target&&x[0]===consonant),sameVowel=syllables.filter(x=>x!==target&&x[1]===vowel&&x[0]!==consonant),used=new Set([target]);const pick=pool=>{const choices=this.shuffle(pool.filter(x=>!used.has(x)));if(!choices.length)return null;used.add(choices[0]);return choices[0];};const result=[target,pick(sameConsonant),pick(sameVowel)],different=syllables.filter(x=>x[0]!==consonant&&x[1]!==vowel);result.push(pick(different)||pick(syllables));return this.shuffle(result.filter(Boolean));}
  }

  class CatchGame extends Game {
    createSession(wordPool,sessionSize){const pool=[...new Set(wordPool.filter(word=>typeof word==='string'&&word))],count=Math.min(pool.length,Math.max(1,Number(sessionSize)||5)),words=this.shuffle(pool).slice(0,count);const tasks=this.createDoubleExposureTasks(words,pool,(targetWord,distractor)=>new CatchTask({targetWord,distractor,answers:distractor?this.shuffle([targetWord,distractor]):[targetWord]}));return new GameSession().start(tasks);}
    answer(session,selected){const task=this.playingTask(session);return task?this.answerTask(session,selected,selected===task.targetWord):null;}
    advance(session){return this.advanceSession(session);}
  }

  return {Game,MissingWordGame,FindGame,CatchGame,GameSession,GameTask,MissingWordTask,FindTask,CatchTask,Attempt,SessionStatus};
});
