'use strict';
/* Mobile lesson shell overrides live here because games.js is loaded for the whole child experience.
   Desktop rules remain untouched; the shell is intentionally reusable by Games. */
const mobileResponsiveLayout=document.createElement('style');
mobileResponsiveLayout.id='mobile-responsive-layout';
mobileResponsiveLayout.textContent=`
@media (max-width:700px){
  #childView{
    width:100%;max-width:none;height:100dvh;min-height:100dvh;
    padding:max(6px,env(safe-area-inset-top)) clamp(10px,3.5vw,16px) max(10px,env(safe-area-inset-bottom));
    overflow:hidden;display:flex;flex-direction:column;
  }
  #childView header{
    flex:0 0 auto;min-height:clamp(44px,7dvh,52px);height:auto;gap:8px;
    width:100%;max-width:none;margin:0;position:relative;z-index:3;
  }
  #childView header #childHome,#childView header #parentOpen{
    width:clamp(44px,12vw,50px)!important;height:clamp(44px,12vw,50px)!important;
    min-width:44px!important;min-height:44px!important;border-radius:14px!important;
  }
  #childView .brand-lockup .brand-home svg{width:clamp(30px,8vw,35px);height:clamp(30px,8vw,35px)}
  #childView #parentOpen .parent-chart-icon{transform:scale(.9)}
  #childView .tabs{
    flex:0 0 auto;width:min(62vw,270px);margin:calc(-1 * clamp(44px,7dvh,52px)) auto clamp(2px,1dvh,8px);
    padding:3px;border-radius:20px;z-index:4;
  }
  #childView .tab{min-height:clamp(38px,6dvh,44px);padding:5px clamp(7px,2vw,12px);font-size:clamp(13px,3.8vw,15px);border-radius:17px}
  #childView .reading{flex:1 1 auto;min-height:0;height:auto;max-width:100%;overflow:hidden;display:flex;flex-direction:column}
  #childView .reading>.dino-track{flex:0 0 clamp(54px,9dvh,68px)}
  #childView .stage{flex:1 1 0;min-height:0;width:100%;padding:clamp(0px,1dvh,6px) clamp(50px,14vw,62px) clamp(2px,1dvh,8px);overflow:hidden}
  #childView .actions,#childView #lettersView .actions{flex:0 0 auto;width:min(100%,440px);grid-template-columns:1fr;gap:clamp(5px,1dvh,9px);margin:0 auto;padding-bottom:0}
  #childView .actions button{min-height:clamp(46px,7dvh,52px);padding:clamp(6px,1dvh,9px) 14px;border-radius:14px;font-size:clamp(14px,3.8vw,16px);line-height:1.1;gap:8px}
  #childView .actions button svg{width:clamp(22px,6vw,25px);height:clamp(22px,6vw,25px)}
  #childView .dino-track{box-sizing:border-box;width:100%;height:clamp(54px,9dvh,68px);margin:0 auto!important;padding:0 clamp(42px,12vw,50px)!important;transform:none!important;overflow:hidden!important}
  #childView .dino-path{left:clamp(43px,12vw,51px);right:clamp(43px,12vw,51px);top:clamp(35px,5.6dvh,42px);height:5px}
  #childView .dino-steps{left:clamp(44px,12vw,52px);right:clamp(44px,12vw,52px);top:clamp(24px,4dvh,31px)}
  #childView .dino-step{width:clamp(23px,6.5vw,27px);height:clamp(23px,6.5vw,27px);border-width:3px;flex:0 0 auto}
  #childView .step-check{font-size:clamp(15px,4.5vw,19px)}
  #childView .dino{font-size:clamp(37px,11vw,44px);top:clamp(7px,1.2dvh,10px);transform:scaleX(-1)!important}
  #childView .dino-finish,#childView .finish-flag{right:0;top:clamp(6px,1dvh,9px);font-size:clamp(33px,10vw,39px);transform:none!important}
  #childView .word,#childView .letter-card{font-size:clamp(76px,min(29vw,18dvh),138px);max-width:100%;line-height:1}
  #childView .picture,#childView .letter-picture{height:clamp(62px,12dvh,94px);min-height:clamp(62px,12dvh,94px);margin:clamp(1px,.7dvh,5px) 0 0;font-size:clamp(54px,min(19vw,11dvh),76px)}
  #childView .reward{min-height:clamp(8px,1.8dvh,16px)}
  #childView .lesson-nav{inset:0;overflow:hidden}
  #childView .nav-arrow{width:clamp(44px,12vw,48px);height:clamp(44px,12vw,48px);min-height:44px;top:50%}
  #childView .nav-arrow svg{width:clamp(23px,6.5vw,26px);height:clamp(23px,6.5vw,26px)}
  #childView .nav-prev{left:0}#childView .nav-next{right:0}
  #childView #gamesView{min-height:0;flex:1 1 auto;max-width:100%;overflow:auto}
}
@media (max-width:700px) and (max-height:680px){
  #childView{padding-top:max(4px,env(safe-area-inset-top));padding-bottom:max(6px,env(safe-area-inset-bottom))}
  #childView header{min-height:44px}
  #childView .tabs{margin-top:-44px;margin-bottom:1px}
  #childView .tab{min-height:36px}
  #childView .reading>.dino-track{flex-basis:50px}
  #childView .dino-track{height:50px}
  #childView .dino-path{top:31px}#childView .dino-steps{top:20px}#childView .dino{top:4px}#childView .dino-finish,#childView .finish-flag{top:3px}
  #childView .stage{padding-top:0;padding-bottom:0}
  #childView .word,#childView .letter-card{font-size:clamp(68px,min(27vw,15dvh),112px)}
  #childView .picture,#childView .letter-picture{height:clamp(48px,9dvh,66px);min-height:clamp(48px,9dvh,66px);font-size:clamp(44px,9dvh,60px)}
  #childView .actions,#childView #lettersView .actions{gap:4px}
  #childView .actions button{min-height:44px;padding:5px 12px}
}
`;
document.head.appendChild(mobileResponsiveLayout);
document.write('<script src="./games/games.js?v=2"><\/script><script src="./games/find.js?v=2"><\/script><script src="./games/build-word.js?v=2"><\/script><script src="./games/missing-word.js?v=2"><\/script><script src="./games/catch.js?v=1"><\/script><script src="./games/branding.js?v=1"><\/script>');
