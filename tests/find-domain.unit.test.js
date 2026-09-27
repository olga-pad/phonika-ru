'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {FindGame,FindTask,GameSession,Attempt,SessionStatus}=require('../games/domain/game-domain.js');

const identity=items=>[...items];
const makeGame=()=>new FindGame({shuffle:identity,arrangeTasks:identity,random:()=>0});
const words=[{word:'кот',picture:'🐱'},{word:'дом',picture:'🏠'},{word:'мак',picture:'🌺'}];
const startWords=(game=makeGame(),size=2)=>game.createWordSession(words,size);

test('FindGame creates browser-independent word tasks with double exposure',()=>{
 const session=startWords();
 assert.ok(session instanceof GameSession);assert.equal(session.status,SessionStatus.PLAYING);assert.equal(session.originalTasks.length,4);
 assert.ok(session.currentTask instanceof FindTask);assert.equal(session.currentTask.mode,'words');assert.equal(session.currentTask.picture,'🐱');assert.equal('element' in session.currentTask,false);
 assert.equal(typeof document,'undefined');assert.equal(typeof window,'undefined');
});

test('FindGame creates syllable tasks using the requested session size',()=>{
 const game=makeGame(),session=game.createSyllableSession(['ма','мо','му','ми','ка'],3);
 assert.equal(session.originalTasks.length,3);assert.ok(session.originalTasks.every(task=>task.mode==='syllables'));assert.equal(session.currentTask.target,'ма');assert.ok(session.currentTask.answers.includes('ма'));
});

test('first-attempt correct Find answer completes and rewards task',()=>{
 const game=makeGame(),session=startWords(game),task=session.currentTask,result=game.answer(session,task.target);
 assert.ok(result.attempt instanceof Attempt);assert.equal(result.attempt.correct,true);assert.equal(result.attempt.firstAttempt,true);assert.equal(task.completed,true);assert.equal(task.rewarded,true);assert.equal(session.rewardedCount,1);
});

test('wrong Find answer records failure without completion or reward',()=>{
 const game=makeGame(),session=startWords(game),task=session.currentTask,wrong=task.answers.find(answer=>answer!==task.target),result=game.answer(session,wrong);
 assert.equal(result.attempt.correct,false);assert.equal(task.hadWrongAttempt,true);assert.equal(task.completed,false);assert.equal(task.rewarded,false);assert.equal(session.rewardedCount,0);assert.equal(game.advance(session).type,'BLOCKED');
});

test('wrong then correct Find task completes without reward and returns for retry',()=>{
 const game=makeGame(),session=game.createWordSession(words,1);
 for(let i=0;i<2;i++){
  const task=session.currentTask,wrong=task.answers.find(answer=>answer!==task.target);game.answer(session,wrong);game.answer(session,task.target);
  const transition=game.advance(session);if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'RETRY');
 }
 assert.equal(session.currentIndex,0);assert.equal(session.currentTask.passNumber,2);assert.equal(session.currentTask.completed,false);assert.equal(session.currentTask.attempts.length,2);
 game.answer(session,session.currentTask.target);assert.equal(session.currentTask.rewarded,true);assert.equal(session.currentTask.attempts.length,3);
});

test('Find session completes only after every original task is rewarded',()=>{
 const game=makeGame(),session=game.createWordSession(words,1);
 game.answer(session,session.currentTask.target);assert.equal(game.advance(session).type,'NEXT');
 game.answer(session,session.currentTask.target);assert.equal(game.advance(session).type,'COMPLETED');
 assert.equal(session.status,SessionStatus.COMPLETED);assert.equal(session.isRewardComplete,true);
});

test('two Find sessions created by one game are independent',()=>{
 const game=makeGame(),a=startWords(game),b=startWords(game);
 assert.notEqual(a.id,b.id);assert.notEqual(a.currentTask.id,b.currentTask.id);
 game.answer(a,a.currentTask.target);game.advance(a);
 assert.equal(a.rewardedCount,1);assert.equal(a.currentIndex,1);assert.equal(b.rewardedCount,0);assert.equal(b.currentIndex,0);assert.equal(b.currentTask.attempts.length,0);
});

test('completed Find task cannot accept another answer',()=>{
 const game=makeGame(),session=startWords(game),task=session.currentTask;game.answer(session,task.target);const count=task.attempts.length;
 assert.equal(game.answer(session,task.target),null);assert.equal(task.attempts.length,count);
});
