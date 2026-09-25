'use strict';
/* Presentation-only product branding and stable visual identifiers for the game picker. */
document.addEventListener('DOMContentLoaded',()=>{
  const brand=document.querySelector('#childHome .brand-full');
  if(brand){
    brand.replaceChildren();
    const name=document.createElement('span');
    name.className='phonika-brand-name';
    name.textContent='Фоника';
    const tagline=document.createElement('span');
    tagline.className='phonika-brand-tagline';
    tagline.textContent='Читаем вместе!';
    brand.append(name,tagline);
  }

  const grid=document.getElementById('gamesGrid');
  const cards=[...document.querySelectorAll('#gamesGrid .game-card')];
  const cardByName=new Map(cards.map(card=>[card.textContent.trim(),card]));
  const labels=new Map([
    ['Найди','🔎 Найди'],
    ['Поймай','🎣 Поймай'],
    ['Собери слово','🧩 Собери слово'],
    ['Что пропало?','🤔 Что пропало?']
  ]);
  labels.forEach((label,name)=>{
    const card=cardByName.get(name);
    if(!card)return;
    card.textContent=label;
    grid?.appendChild(card);
  });

  const style=document.createElement('style');
  style.textContent=`
#childHome .brand-full{display:flex;flex-direction:column;align-items:flex-start;justify-content:center;line-height:1.05;text-align:left}
#childHome .phonika-brand-name{font-size:1.08em;font-weight:800}
#childHome .phonika-brand-tagline{margin-top:3px;font-size:.72em;font-weight:600;color:#55746d;white-space:nowrap}
#childView #gamesGrid.games-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%}
#childView #gamesGrid .game-card{display:flex;align-items:center;justify-content:center;min-width:0;min-height:64px;padding:14px 10px;gap:.35em;white-space:normal;overflow-wrap:normal;word-break:normal;line-height:1.2;text-align:center}
@media(max-width:600px){
  #childView #gamesGrid.games-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  #childView #gamesGrid .game-card{min-height:62px;padding:13px 8px;font-size:clamp(15px,4.4vw,17px)}
}
@media(max-width:340px){
  #childView #gamesGrid .game-card{padding-inline:6px;font-size:15px}
  #childHome .phonika-brand-tagline{font-size:.68em}
}`;
  document.head.appendChild(style);
});
