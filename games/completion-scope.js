'use strict';
/* Keep shared Games completion UI inside the active game area instead of letting .finish behave like an app-level page. */
document.addEventListener('DOMContentLoaded',()=>{
  const G=window.PhonikaGames;
  const childTabs=document.getElementById('childTabs');
  const gamesGrid=document.getElementById('gamesGrid');
  const completionTimers=new WeakMap();
  const gameCardIds={findGame:'findGameCard',catchGame:'catchGameCard',buildWordGame:'buildWordGameCard',missingWordGame:'missingWordGameCard'};

  const style=document.createElement('style');
  style.textContent=`
    /* Navigation has only disabled/enabled states. Reward/success must never recolor arrows. */
    #childView #gamesView .find-nav-arrow.game-nav-success{
      background:#fff!important;
      color:#123f73!important;
      border-color:#d2deea!important;
      box-shadow:0 2px 8px #123f730d!important;
    }
    #childView #gamesView .find-nav-arrow.game-nav-success:hover{
      background:#fff!important;
      color:#123f73!important;
      border-color:#d2deea!important;
    }
    #childView #gamesView .find-nav-arrow.game-nav-success:disabled{
      opacity:.32;
      cursor:default;
    }
    /* Find answers stay a symmetric responsive 2x2 grid on mobile. */
    @media(max-width:700px){
      #childView #findGame .find-answers{
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        grid-auto-rows:1fr;
        gap:10px;
        width:100%;
        align-items:stretch;
      }
      #childView #findGame .find-answer{
        width:100%;
        min-width:0;
        height:100%;
        min-height:76px;
        display:flex;
        align-items:center;
        justify-content:center;
        text-align:center;
      }
      #childView #findGame .find-answer:last-child{
        grid-column:auto!important;
        width:100%!important;
      }
    }
    #childView #gamesView .game-completion-host{display:block!important}
    #childView #gamesView .game-completion-host> :not(.find-header):not(.games-completion){display:none!important}
    #childView #gamesView .game-completion-host>.find-header{display:flex!important}
    #childView #gamesView .games-completion{
      width:100%;min-height:0;height:auto;
      padding:clamp(24px,6vh,56px) 12px 20px;
      margin:0 auto;
      display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
    }
    @media(max-width:700px){
      #childView #gamesView .games-completion{
        min-height:0;height:auto;
        padding:clamp(18px,4dvh,34px) 8px max(14px,env(safe-area-inset-bottom));
      }
    }
  `;
  document.head.appendChild(style);

  const gameForCompletion=completion=>{
    if(completion.parentElement?.classList.contains('find-game'))return completion.parentElement;
    let game=completion.previousElementSibling;
    return game?.classList.contains('find-game')?game:null;
  };

  const activate=completion=>{
    if(!completion?.classList.contains('games-completion')||completion.hidden)return;
    const game=gameForCompletion(completion);
    if(!game)return;
    if(completion.parentElement!==game)game.appendChild(completion);
    game.hidden=false;
    game.classList.add('game-completion-host');
    if(childTabs)childTabs.hidden=false;
  };

  const deactivate=completion=>{
    const game=completion?.parentElement?.classList.contains('find-game')?completion.parentElement:null;
    if(!game)return;
    game.classList.remove('game-completion-host');
    if(!completion.hidden)return;
    if(gamesGrid?.hidden&&childTabs)childTabs.hidden=true;
  };

  const progressIsComplete=game=>{
    const steps=[...game.querySelectorAll('.dino-steps .dino-step')];
    return steps.length>0&&steps.every(step=>step.classList.contains('done'));
  };

  const showProgressCompletion=game=>{
    if(!game||game.hidden||!progressIsComplete(game))return;
    let completion=game.querySelector('.games-completion');
    if(!completion){
      completion=document.createElement('section');
      completion.className='finish dino-celebration games-completion progress-completion';
      completion.innerHTML=G.completionHtml;
      game.appendChild(completion);
      completion.querySelector('.dino-again')?.addEventListener('click',()=>{
        completion.hidden=true;
        game.classList.remove('game-completion-host');
        const card=document.getElementById(gameCardIds[game.id]);
        card?.click();
      });
    }
    completion.hidden=false;
    activate(completion);
  };

  const scheduleProgressCompletion=game=>{
    if(!game||completionTimers.has(game)||!progressIsComplete(game))return;
    /* Let the final green state, dinosaur step and existing confetti finish before replacing the game area. */
    const timer=setTimeout(()=>{
      completionTimers.delete(game);
      showProgressCompletion(game);
    },850);
    completionTimers.set(game,timer);
  };

  const sync=()=>document.querySelectorAll('#gamesView .games-completion').forEach(completion=>completion.hidden?deactivate(completion):activate(completion));
  const observer=new MutationObserver(records=>{
    records.forEach(record=>{
      if(record.type==='childList')record.addedNodes.forEach(node=>{
        if(node.nodeType!==1)return;
        if(node.classList?.contains('games-completion'))activate(node);
        node.querySelectorAll?.('.games-completion').forEach(activate);
      });
      if(record.type==='attributes'&&record.target.classList?.contains('games-completion')){
        record.target.hidden?deactivate(record.target):activate(record.target);
      }
      if(record.type==='attributes'&&record.attributeName==='class'&&record.target.classList?.contains('dino-step')&&record.target.classList.contains('done')){
        scheduleProgressCompletion(record.target.closest('.find-game'));
      }
    });
  });
  observer.observe(document.getElementById('gamesView')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class']});
  sync();

  /* Shared list navigation must also clear the scoped completion state. */
  const originalShowGamesList=G?.showGamesList;
  if(G&&originalShowGamesList)G.showGamesList=()=>{
    document.querySelectorAll('#gamesView .game-completion-host').forEach(game=>game.classList.remove('game-completion-host'));
    document.querySelectorAll('#gamesView .progress-completion').forEach(completion=>completion.hidden=true);
    originalShowGamesList();
  };
});
