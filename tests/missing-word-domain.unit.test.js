'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {MissingWordGame,GameSession,GameTask,Attempt,SessionStatus}=require('../games/domain/game-domain.js');

const identity=items=>[...items];
const makeGame=()=>new MissingWordGame({shuffle:identity,arrangeTasks:identity,random:()=>0});
const start=(game,words=['кот','дом'],size=2)=>game.createSession(words,size);

test('game owns rules, not a mutable session',()=>{
 const game=makeGame();
 assert.equal('session' in game,false);
 assert.equal(typeof document,'undefined');
 assert.equal(typeof window,'undefined');
});

test('createSession returns a new playing session with explicit domain ids',()=>{
 const game=makeGame(),session=start(game,['кот','дом','мак'],2);
 assert.ok(session instanceof GameSession);assert.equal(session.status,SessionStatus.PLAYING);assert.match(session.id,/^session-/);
 assert.equal(session.originalTasks.length,4);assert.ok(session.currentTask instanceof GameTask);assert.match(session.currentTask.id,/^task-/);
 assert.equal('element' in session.currentTask,false);
});

test('two sessions from one game are independent',()=>{
 const game=makeGame(),a=start(game),b=start(game);
 assert.notEqual(a,b);assert.notEqual(a.id,b.id);assert.notEqual(a.currentTask.id,b.currentTask.id);
 game.reveal(a);game.answer(a,a.currentTask.missingWord);game.advance(a);
 assert.equal(a.currentIndex,1);assert.equal(a.rewardedCount,1);
 assert.equal(b.currentIndex,0);assert.equal(b.rewardedCount,0);assert.equal(b.currentTask.phase,'memorize');assert.equal(b.currentTask.attempts.length,0);
});

test('wrong then correct completes task without reward and records identified attempts',()=>{
 const game=makeGame(),session=start(game);game.reveal(session);const task=session.currentTask;
 const wrong=task.answers.find(answer=>answer!==task.missingWord);const first=game.answer(session,wrong);const second=game.answer(session,task.missingWord);
 assert.ok(first.attempt instanceof Attempt);assert.match(first.attempt.id,/^attempt-/);assert.equal(first.attempt.taskId,task.id);assert.equal(first.attempt.sessionId,session.id);
 assert.equal(first.attempt.correct,false);assert.equal(first.attempt.firstAttempt,true);assert.equal(second.attempt.firstAttempt,false);assert.equal(task.completed,true);assert.equal(task.rewarded,false);
});

test('cannot answer an already completed task',()=>{
 const game=makeGame(),session=start(game);game.reveal(session);const task=session.currentTask;
 game.answer(session,task.missingWord);const count=task.attempts.length;
 assert.equal(game.answer(session,task.missingWord),null);assert.equal(task.attempts.length,count);
});

test('session cannot be completed prematurely',()=>{
 const session=new GameSession().start([new GameTask({targetWord:'кот',firstWord:'кот',secondWord:'дом',missingWord:'кот',distractor:'дом',answers:['кот','дом']})]);
 assert.throws(()=>session.complete(),/cannot complete/);assert.equal(session.status,SessionStatus.PLAYING);
});

test('retry preserves earlier attempt history and starts a new pass state',()=>{
 const game=makeGame(),session=start(game,['кот'],1);
 for(let i=0;i<2;i++){
  game.reveal(session);const task=session.currentTask;game.answer(session,'неверно');game.answer(session,task.missingWord);
  const transition=game.advance(session);if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'RETRY');
 }
 const retried=session.currentTask;
 assert.equal(retried.passNumber,2);assert.equal(retried.attempted,false);assert.equal(retried.completed,false);assert.equal(retried.hadWrongAttempt,false);
 assert.equal(retried.attempts.length,2);assert.equal(retried.attempts[0].correct,false);assert.equal(retried.attempts[1].correct,true);assert.equal(retried.attempts[0].passNumber,1);
 game.reveal(session);const retryAttempt=game.answer(session,retried.missingWord).attempt;
 assert.equal(retryAttempt.passNumber,2);assert.equal(retryAttempt.firstAttempt,true);assert.equal(retried.attempts.length,3);
});

test('advance cannot complete until every original task is rewarded',()=>{
 const game=makeGame(),session=start(game,['кот'],1);game.reveal(session);game.answer(session,session.currentTask.missingWord);
 const transition=game.advance(session);
 assert.equal(transition.type,'NEXT');assert.equal(session.status,SessionStatus.PLAYING);assert.equal(session.rewardedCount,1);assert.equal(session.originalTasks.length,2);
});

test('session becomes completed only when all original tasks are rewarded',()=>{
 const game=makeGame(),session=start(game,['кот'],1);
 for(let i=0;i<2;i++){game.reveal(session);game.answer(session,session.currentTask.missingWord);const transition=game.advance(session);if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'COMPLETED');}
 assert.equal(session.status,SessionStatus.COMPLETED);assert.equal(session.isRewardComplete,true);assert.equal(game.answer(session,'кот'),null);
});

test('a new session starts clean after a previous session changed',()=>{
 const game=makeGame(),oldSession=start(game);game.reveal(oldSession);game.answer(oldSession,oldSession.currentTask.missingWord);
 const fresh=start(game);
 assert.equal(fresh.status,SessionStatus.PLAYING);assert.equal(fresh.currentIndex,0);assert.equal(fresh.rewardedCount,0);assert.ok(fresh.originalTasks.every(task=>task.attempts.length===0&&!task.completed&&!task.rewarded&&task.passNumber===1));
});
