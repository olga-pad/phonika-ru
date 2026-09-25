'use strict';
/* Keep shared Games completion UI inside the active game area instead of letting .finish behave like an app-level page. */
document.addEventListener('DOMContentLoaded',()=>{
  const G=window.PhonikaGames;
  const childTabs=document.getElementById('childTabs');
  const gamesGrid=document.getElementById('gamesGrid');

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
    });
  });
  observer.observe(document.getElementById('gamesView')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
  sync();

  /* Shared list navigation must also clear the scoped completion state. */
  const originalShowGamesList=G?.showGamesList;
  if(G&&originalShowGamesList)G.showGamesList=()=>{
    document.querySelectorAll('#gamesView .game-completion-host').forEach(game=>game.classList.remove('game-completion-host'));
    originalShowGamesList();
  };
});
