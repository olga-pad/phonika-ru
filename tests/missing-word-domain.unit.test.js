'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {MissingWordGame,GameSession,GameTask,Attempt,SessionStatus}=require('../games/domain/game-domain.js');

const identity=items=>[...items];
const makeGame=()=>new MissingWordGame({shuffle:identity,arrangeTasks:identity,random:()=>0});

test('domain model is browser-independent and starts with NOT_STARTED session',()=>{
 const game=makeGame();
 assert.ok(game.session instanceof GameSession);
 assert.equal(game.session.status,SessionStatus.NOT_STARTED);
 assert.equal(typeof document,'undefined');
 assert.equal(typeof window,'undefined');
});

test('MissingWordGame creates two tasks per selected word without DOM state',()=>{
 const game=makeGame();
 game.createSession(['кот','дом','мак'],2);
 assert.equal(game.session.status,SessionStatus.PLAYING);
 assert.equal(game.session.originalTasks.length,4);
 assert.ok(game.session.currentTask instanceof GameTask);
 assert.equal('element' in game.session.currentTask,false);
});

test('wrong then correct answer completes task but does not reward it',()=>{
 const game=makeGame();game.createSession(['кот','дом'],2);game.reveal();
 const task=game.session.currentTask;
 const wrong=task.answers.find(answer=>answer!==task.missingWord);
 const first=game.answer(wrong);
 assert.ok(first.attempt instanceof Attempt);assert.equal(first.attempt.correct,false);assert.equal(first.attempt.firstAttempt,true);
 const second=game.answer(task.missingWord);
 assert.equal(second.attempt.correct,true);assert.equal(second.attempt.firstAttempt,false);assert.equal(task.completed,true);assert.equal(task.rewarded,false);
});

test('first-attempt correct answer rewards task',()=>{
 const game=makeGame();game.createSession(['кот','дом'],2);game.reveal();
 const result=game.answer(game.session.currentTask.missingWord);
 assert.equal(result.attempt.firstAttempt,true);assert.equal(result.rewarded,true);assert.equal(game.session.rewardedCount,1);
});

test('unfinished rewards return as retry tasks and can then be rewarded',()=>{
 const game=makeGame();game.createSession(['кот'],1);
 for(let i=0;i<2;i++){
  game.reveal();const task=game.session.currentTask;game.answer('неверно');game.answer(task.missingWord);
  const transition=game.advance();
  if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'RETRY');
 }
 assert.equal(game.session.currentIndex,0);assert.equal(game.session.currentTask.hadWrongAttempt,false);
 game.reveal();game.answer(game.session.currentTask.missingWord);assert.equal(game.session.rewardedCount,1);
});

test('session becomes COMPLETED only when all original tasks are rewarded',()=>{
 const game=makeGame();game.createSession(['кот'],1);
 for(let i=0;i<2;i++){
  game.reveal();game.answer(game.session.currentTask.missingWord);
  const transition=game.advance();
  if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'COMPLETED');
 }
 assert.equal(game.session.status,SessionStatus.COMPLETED);assert.equal(game.session.isRewardComplete,true);
});
