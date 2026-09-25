'use strict';
/* Presentation-only product branding and stable visual identifiers for the game picker. */
document.addEventListener('DOMContentLoaded',()=>{
  const brand=document.querySelector('#childHome .brand-full');
  if(brand)brand.textContent='Phonika — Читаем вместе';

  const cards=[...document.querySelectorAll('#gamesGrid .game-card')];
  const labels=new Map([
    ['Найди','🔎 Найди'],
    ['Поймай','🎣 Поймай'],
    ['Что пропало?','🫣 Что пропало?'],
    ['Собери слово','🧩 Собери слово']
  ]);
  cards.forEach(card=>{
    const label=labels.get(card.textContent.trim());
    if(label)card.textContent=label;
  });

  const style=document.createElement('style');
  style.textContent='#childView #gamesGrid .game-card{gap:.35em;white-space:normal;overflow-wrap:normal;word-break:normal}@media(max-width:430px){#childView #gamesGrid .game-card{font-size:clamp(15px,4.4vw,17px);padding-inline:clamp(6px,2.4vw,10px)}}';
  document.head.appendChild(style);
});
