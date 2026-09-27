'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {CatchGame,CatchTask,GameSession,Attempt,SessionStatus}=require('../games/domain/game-domain.js');

const identity=items=>[...items];
const game=()=>new CatchGame({shuffle:identity,arrangeTasks:identity});

test('Catch creates browser-independent double-exposure session',()=>{
 const g=game(),session=g.createSession(['кот','дом','мак'],2);
 assert.equal(typeof document,'undefined');assert.equal(typeof window,'undefined');
 assert.ok(session instanceof GameSession);assert.equal(session.status,SessionStatus.PLAYING);assert.equal(session.originalTasks.length,4);
 assert.ok(session.currentTask instanceof CatchTask);assert.deepEqual(session.originalTasks.map(t=>t.targetWord),['кот','кот','дом','дом']);
 assert.ok(session.originalTasks.every(t=>t.answers.includes(t.targetWord)));
});

test('correct first catch completes, rewards and records attempt',()=>{
 const g=game(),session=g.createSession(['кот','дом'],1),task=session.currentTask,result=g.answer(session,task.targetWord);
 assert.ok(result.attempt instanceof Attempt);assert.equal(result.attempt.correct,true);assert.equal(result.attempt.firstAttempt,true);assert.equal(result.rewarded,true);
 assert.equal(task.completed,true);assert.equal(task.rewarded,true);assert.equal(task.closed,true);assert.equal(session.rewardedCount,1);
});

test('wrong catch keeps task active and correct retry completes without reward',()=>{
 const g=game(),session=g.createSession(['кот','дом'],1),task=session.currentTask,wrong=task.answers.find(x=>x!==task.targetWord);
 const miss=g.answer(session,wrong);assert.equal(miss.attempt.correct,false);assert.equal(task.completed,false);assert.equal(task.hadWrongAttempt,true);
 const hit=g.answer(session,task.targetWord);assert.equal(hit.attempt.correct,true);assert.equal(hit.attempt.firstAttempt,false);assert.equal(hit.rewarded,false);assert.equal(task.completed,true);assert.equal(task.rewarded,false);
});

test('advance uses common retry lifecycle and retry can earn reward',()=>{
 const g=game(),session=g.createSession(['кот'],1);
 for(let i=0;i<2;i++){const task=session.currentTask;g.answer(session,'ошибка');g.answer(session,task.targetWord);const transition=g.advance(session);if(i===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'RETRY');}
 const retried=session.currentTask;assert.equal(retried.passNumber,2);assert.equal(retried.completed,false);assert.equal(retried.hadWrongAttempt,false);assert.equal(retried.attempts.length,2);
 const result=g.answer(session,retried.targetWord);assert.equal(result.rewarded,true);assert.equal(result.attempt.firstAttempt,true);assert.equal(result.attempt.passNumber,2);
});

test('Catch completes only after every original exposure is rewarded',()=>{
 const g=game(),session=g.createSession(['кот'],1);
 let transition;for(let i=0;i<2;i++){g.answer(session,session.currentTask.targetWord);transition=g.advance(session);}
 assert.equal(transition.type,'COMPLETED');assert.equal(session.status,SessionStatus.COMPLETED);assert.equal(session.rewardedCount,2);assert.equal(g.answer(session,'кот'),null);
});

test('two Catch sessions from one game are independent',()=>{
 const g=game(),a=g.createSession(['кот','дом'],1),b=g.createSession(['кот','дом'],1);
 g.answer(a,a.currentTask.targetWord);g.advance(a);
 assert.equal(a.currentIndex,1);assert.equal(a.rewardedCount,1);assert.equal(b.currentIndex,0);assert.equal(b.rewardedCount,0);assert.equal(b.currentTask.attempts.length,0);assert.notEqual(a.currentTask.id,b.currentTask.id);
});

test('previous navigation is domain session navigation and completed task cannot be answered twice',()=>{
 const g=game(),session=g.createSession(['кот'],1),first=session.currentTask;g.answer(session,first.targetWord);g.advance(session);assert.equal(session.currentIndex,1);g.previous(session);assert.equal(session.currentIndex,0);assert.equal(g.answer(session,first.targetWord),null);
});
