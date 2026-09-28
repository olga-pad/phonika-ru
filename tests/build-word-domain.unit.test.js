'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {BuildWordGame,BuildWordTask,GameSession,Attempt,SessionStatus}=require('../games/domain/game-domain.js');

const reverse=items=>[...items].reverse();
const identity=items=>[...items];
const game=()=>new BuildWordGame({shuffle:reverse,arrangeTasks:identity});
const entries=[['кот','🐱'],['дом','🏠']];
const solve=(g,session)=>{const task=session.currentTask;const wanted=[...task.targetWord.toUpperCase()];for(const letter of wanted){const tile=task.shuffledLetters.find(t=>t.letter===letter&&!task.placedLetters.some(p=>p?.id===t.id));g.placeLetter(session,tile.id);}return task;};

test('Build Word creates browser-independent double-exposure tasks with construction state',()=>{
 const g=game(),session=g.createSession(entries,1);assert.equal(typeof document,'undefined');assert.equal(typeof window,'undefined');assert.ok(session instanceof GameSession);assert.equal(session.status,SessionStatus.PLAYING);assert.equal(session.originalTasks.length,2);assert.ok(session.currentTask instanceof BuildWordTask);assert.equal(session.currentTask.targetWord,'дом');assert.equal(session.currentTask.picture,'🏠');assert.equal(session.currentTask.placedLetters.every(x=>x===null),true);
});

test('placing letters is intermediate state and only a full construction creates Attempt',()=>{
 const g=game(),session=g.createSession([['кот','🐱']],1),task=session.currentTask;const first=task.shuffledLetters.find(t=>t.letter==='К');const placed=g.placeLetter(session,first.id);assert.equal(placed.type,'PLACED');assert.equal(task.attempts.length,0);assert.equal(task.attempted,false);assert.equal(task.completed,false);
 solve(g,session);assert.equal(task.attempts.length,1);assert.ok(task.attempts[0] instanceof Attempt);assert.equal(task.attempts[0].correct,true);assert.equal(task.rewarded,true);
});

test('wrong full construction records one failed Attempt and can be edited before correct construction',()=>{
 const g=game(),session=g.createSession([['кот','🐱']],1),task=session.currentTask;for(const tile of task.shuffledLetters)g.placeLetter(session,tile.id);assert.equal(task.isFull,true);assert.equal(task.attempts.length,1);assert.equal(task.attempts[0].correct,false);assert.equal(task.hadWrongAttempt,true);const returned=g.returnLetter(session,task.placedLetters[0].id);assert.equal(returned.type,'RETURNED');assert.equal(task.isFull,false);while(task.placedLetters.some(Boolean))g.returnLetter(session,task.placedLetters.find(Boolean).id);solve(g,session);assert.equal(task.completed,true);assert.equal(task.rewarded,false);assert.equal(task.attempts.length,2);assert.equal(task.attempts[1].correct,true);assert.equal(task.attempts[1].firstAttempt,false);
});

test('retry resets construction but preserves attempt history and can earn reward',()=>{
 const g=game(),session=g.createSession([['кот','🐱']],1);for(let exposure=0;exposure<2;exposure++){const task=session.currentTask;for(const tile of task.shuffledLetters)g.placeLetter(session,tile.id);while(task.placedLetters.some(Boolean))g.returnLetter(session,task.placedLetters.find(Boolean).id);solve(g,session);const transition=g.advance(session);if(exposure===0)assert.equal(transition.type,'NEXT');else assert.equal(transition.type,'RETRY');}
 const retried=session.currentTask;assert.equal(retried.passNumber,2);assert.equal(retried.placedLetters.every(x=>x===null),true);assert.equal(retried.attempts.length,2);solve(g,session);assert.equal(retried.rewarded,true);assert.equal(retried.attempts.length,3);assert.equal(retried.attempts[2].passNumber,2);
});

test('completed Build Word task cannot accept more construction actions',()=>{
 const g=game(),session=g.createSession([['кот','🐱']],1),task=solve(g,session),tile=task.shuffledLetters[0];assert.equal(g.placeLetter(session,tile.id).type,'BLOCKED');assert.equal(g.returnLetter(session,tile.id).type,'BLOCKED');assert.equal(task.attempts.length,1);
});

test('session cannot complete prematurely and completes only when every exposure is rewarded',()=>{
 const g=game(),session=g.createSession([['кот','🐱']],1);assert.throws(()=>session.complete(),/cannot complete/);let transition;for(let i=0;i<2;i++){solve(g,session);transition=g.advance(session);}assert.equal(transition.type,'COMPLETED');assert.equal(session.status,SessionStatus.COMPLETED);assert.equal(session.rewardedCount,2);
});

test('two Build Word sessions are independent',()=>{
 const g=game(),a=g.createSession(entries,1),b=g.createSession(entries,1);g.placeLetter(a,a.currentTask.shuffledLetters[0].id);assert.equal(a.currentTask.placedLetters.filter(Boolean).length,1);assert.equal(b.currentTask.placedLetters.filter(Boolean).length,0);assert.notEqual(a.currentTask.id,b.currentTask.id);
});
