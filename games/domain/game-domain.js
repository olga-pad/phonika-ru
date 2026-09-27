'use strict';

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PhonikaGameDomain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const SessionStatus=Object.freeze({NOT_STARTED:'NOT_STARTED',PLAYING:'PLAYING',COMPLETED:'COMPLETED'});

  class Game {
    constructor({shuffle,arrangeTasks,random=Math.random}={}){
      this.shuffle=shuffle||((items)=>[...items]);
      this.arrangeTasks=arrangeTasks||((tasks)=>[...tasks]);
      this.random=random;
      this.session=new GameSession();
    }
  }

  class Attempt {
    constructor({answer,correct,firstAttempt,taskIndex}){
      this.answer=answer;
      this.correct=Boolean(correct);
      this.firstAttempt=Boolean(firstAttempt);
      this.taskIndex=taskIndex;
    }
  }

  class GameTask {
    constructor(data){
      Object.assign(this,data);
      this.attempted=false;
      this.completed=false;
      this.hadWrongAttempt=false;
      this.rewarded=false;
      this.closed=false;
      this.phase='memorize';
      this.attempts=[];
    }
    resetForRetry(){
      this.attempted=false;
      this.completed=false;
      this.hadWrongAttempt=false;
      this.phase='memorize';
      this.attempts=[];
      return this;
    }
  }

  class GameSession {
    constructor(){
      this.originalTasks=[];
      this.tasks=[];
      this.currentIndex=0;
      this.status=SessionStatus.NOT_STARTED;
    }
    start(tasks){
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
    previous(){if(this.currentIndex>0)this.currentIndex--;return this.currentTask;}
    next(){if(this.currentIndex<this.tasks.length-1){this.currentIndex++;return this.currentTask;}return null;}
    replaceTasks(tasks){this.tasks=[...tasks];this.currentIndex=0;return this;}
    complete(){this.status=SessionStatus.COMPLETED;}
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
          tasks.push(new GameTask({
            targetWord:target,
            firstWord:hideFirst?target:remaining,
            secondWord:hideFirst?remaining:target,
            missingWord:target,
            distractor,
            answers:distractor===target?[target]:this.shuffle([target,distractor])
          }));
        }
      });
      return this.session.start(this.arrangeTasks(tasks));
    }
    reveal(){const task=this.session.currentTask;if(task)task.phase='answer';return task;}
    answer(selected){
      const task=this.session.currentTask;
      if(!task||task.completed)return null;
      const correct=selected===task.missingWord;
      const attempt=new Attempt({answer:selected,correct,firstAttempt:!task.attempted,taskIndex:this.session.currentIndex});
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
    previous(){return this.session.previous();}
    advance(){
      if(!this.session.currentTask?.completed)return {type:'BLOCKED',task:this.session.currentTask};
      const next=this.session.next();
      if(next)return {type:'NEXT',task:next};
      if(this.session.isRewardComplete){this.session.complete();return {type:'COMPLETED'};}
      const pending=this.session.originalTasks.filter(task=>!task.rewarded).map(task=>task.resetForRetry());
      this.session.replaceTasks(this.shuffle(pending));
      return {type:'RETRY',task:this.session.currentTask};
    }
  }

  return {Game,MissingWordGame,GameSession,GameTask,Attempt,SessionStatus};
});
