'use strict';

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PhonikaGameDomain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SessionStatus=Object.freeze({NOT_STARTED:'NOT_STARTED',PLAYING:'PLAYING',COMPLETED:'COMPLETED'});
  let idSequence=0;
  const nextId=prefix=>`${prefix}-${++idSequence}`;

  class Game {
    constructor({shuffle,arrangeTasks,random=Math.random}={}){
      this.shuffle=shuffle||((items)=>[...items]);
      this.arrangeTasks=arrangeTasks||((tasks)=>[...tasks]);
      this.random=random;
    }
  }

  class Attempt {
    constructor({id=nextId('attempt'),answer,correct,firstAttempt,taskId,sessionId,passNumber,taskIndex}){
      this.id=id;
      this.answer=answer;
      this.correct=Boolean(correct);
      this.firstAttempt=Boolean(firstAttempt);
      this.taskId=taskId;
      this.sessionId=sessionId;
      this.passNumber=passNumber;
      this.taskIndex=taskIndex;
    }
  }

  class GameTask {
    constructor({id=nextId('task'),targetWord,firstWord,secondWord,missingWord,distractor,answers}){
      if(typeof targetWord!=='string'||typeof firstWord!=='string'||typeof secondWord!=='string'||typeof missingWord!=='string') throw new TypeError('GameTask word fields must be strings');
      if(!Array.isArray(answers)||!answers.includes(missingWord)) throw new TypeError('GameTask answers must include missingWord');
      this.id=id;
      this.targetWord=targetWord;
      this.firstWord=firstWord;
      this.secondWord=secondWord;
      this.missingWord=missingWord;
      this.distractor=distractor??null;
      this.answers=[...answers];
      this.attempted=false;
      this.completed=false;
      this.hadWrongAttempt=false;
      this.rewarded=false;
      this.closed=false;
      this.phase='memorize';
      this.passNumber=1;
      this.attempts=[];
    }
    beginRetryPass(){
      if(this.rewarded) throw new Error('Rewarded task cannot be retried');
      this.passNumber++;
      this.attempted=false;
      this.completed=false;
      this.hadWrongAttempt=false;
      this.phase='memorize';
      return this;
    }
  }

  class GameSession {
    constructor({id=nextId('session')}={}){
      this.id=id;
      this.originalTasks=[];
      this.tasks=[];
      this.currentIndex=0;
      this.status=SessionStatus.NOT_STARTED;
    }
    start(tasks){
      if(this.status!==SessionStatus.NOT_STARTED) throw new Error('Session can only be started once');
      this.originalTasks=[...tasks];
      this.tasks=[...tasks];
      this.currentIndex=0;
      this.status=SessionStatus.PLAYING;
      return this;
    }
    get currentTask(){return this.tasks[this.currentIndex]||null;}
    get completedTasks(){return this.originalTasks.filter(task=>task.completed);}
    get rewardedCount(){return this.originalTasks.filter(task=>task.rewarded).length;}
    get isRewardComplete(){return this.originalTasks.length>0&&this.rewardedCount===this.originalTasks.length;}
    previous(){if(this.status===SessionStatus.PLAYING&&this.currentIndex>0)this.currentIndex--;return this.currentTask;}
    next(){if(this.status!==SessionStatus.PLAYING)return null;if(this.currentIndex<this.tasks.length-1){this.currentIndex++;return this.currentTask;}return null;}
    replaceTasks(tasks){
      if(this.status!==SessionStatus.PLAYING) throw new Error('Only a playing session can replace tasks');
      this.tasks=[...tasks];this.currentIndex=0;return this;
    }
    complete(){
      if(!this.isRewardComplete) throw new Error('Session cannot complete before all original tasks are rewarded');
      this.status=SessionStatus.COMPLETED;
      return this;
    }
  }

  class MissingWordGame extends Game {
    createSession(wordPool,sessionSize){
      const pool=[...new Set(wordPool)];
      const count=Math.min(pool.length,Math.max(1,Number(sessionSize)||5));
      const words=this.shuffle(pool).slice(0,count);
      const tasks=[];
      words.forEach(target=>{
        for(let exposure=0;exposure<2;exposure++){
          const remaining=this.shuffle(words.filter(word=>word!==target))[0]||target;
          const distractor=this.shuffle(words.filter(word=>word!==target&&word!==remaining))[0]||remaining;
          const hideFirst=this.random()<.5;
          tasks.push(new GameTask({targetWord:target,firstWord:hideFirst?target:remaining,secondWord:hideFirst?remaining:target,missingWord:target,distractor,answers:distractor===target?[target]:this.shuffle([target,distractor])}));
        }
      });
      return new GameSession().start(this.arrangeTasks(tasks));
    }
    reveal(session){
      const task=this.#playingTask(session);
      if(task&&!task.completed)task.phase='answer';
      return task;
    }
    answer(session,selected){
      const task=this.#playingTask(session);
      if(!task||task.completed)return null;
      const correct=selected===task.missingWord;
      const attempt=new Attempt({answer:selected,correct,firstAttempt:!task.attempted,taskId:task.id,sessionId:session.id,passNumber:task.passNumber,taskIndex:session.currentIndex});
      task.attempts.push(attempt);
      task.attempted=true;
      if(correct){
        task.completed=true;
        const rewarded=!task.hadWrongAttempt&&!task.rewarded;
        if(rewarded){task.rewarded=true;task.closed=true;}
        return {attempt,task,rewarded};
      }
      task.hadWrongAttempt=true;
      return {attempt,task,rewarded:false};
    }
    previous(session){return this.#requireSession(session).previous();}
    advance(session){
      this.#requireSession(session);
      if(session.status!==SessionStatus.PLAYING)return {type:'BLOCKED',task:session.currentTask};
      if(!session.currentTask?.completed)return {type:'BLOCKED',task:session.currentTask};
      const next=session.next();
      if(next)return {type:'NEXT',task:next};
      if(session.isRewardComplete){session.complete();return {type:'COMPLETED'};}
      const pending=session.originalTasks.filter(task=>!task.rewarded).map(task=>task.beginRetryPass());
      session.replaceTasks(this.shuffle(pending));
      return {type:'RETRY',task:session.currentTask};
    }
    #requireSession(session){if(!(session instanceof GameSession))throw new TypeError('GameSession is required');return session;}
    #playingTask(session){this.#requireSession(session);return session.status===SessionStatus.PLAYING?session.currentTask:null;}
  }

  return {Game,MissingWordGame,GameSession,GameTask,Attempt,SessionStatus};
});
