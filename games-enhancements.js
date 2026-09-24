'use strict';
(() => {
  const MEMORY_KEY = 'phonika-missing-memory-seconds';
  const allowedMemorySeconds = [2, 3, 5, 7];
  const readMemorySeconds = () => {
    const value = Number(localStorage.getItem(MEMORY_KEY) || 3);
    return allowedMemorySeconds.includes(value) ? value : 3;
  };

  // Missing Word already owns timer lifecycle/cleanup. Only replace its reveal delay
  // with the parent-selected duration, leaving every other timeout untouched.
  const nativeSetTimeout = window.setTimeout.bind(window);
  window.setTimeout = (handler, delay, ...args) => {
    const isMissingReveal = delay === 2000 && typeof handler === 'function' && String(handler).includes('revealMissingTask');
    return nativeSetTimeout(handler, isMissingReveal ? readMemorySeconds() * 1000 : delay, ...args);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const parentMain = document.querySelector('#parentView main');
    const stylePanel = document.querySelector('#parentView .tone-style');
    if (parentMain && !document.getElementById('missingMemorySeconds')) {
      const panel = document.createElement('section');
      panel.className = 'panel tone-missing-time';
      panel.innerHTML = '<h2>Что пропало?</h2><p class="intro">Сколько времени показывать слова для запоминания.</p><label for="missingMemorySeconds"><strong>Показывать слова</strong></label><select id="missingMemorySeconds" aria-label="Время показа слов в игре Что пропало?"><option value="2">2 сек</option><option value="3">3 сек</option><option value="5">5 сек</option><option value="7">7 сек</option></select>';
      if (stylePanel) parentMain.insertBefore(panel, stylePanel);
      else parentMain.appendChild(panel);
      const select = panel.querySelector('#missingMemorySeconds');
      select.value = String(readMemorySeconds());
      select.addEventListener('change', () => {
        const value = Number(select.value);
        localStorage.setItem(MEMORY_KEY, String(allowedMemorySeconds.includes(value) ? value : 3));
      });
    }

    const css = document.createElement('style');
    css.textContent = `
      #missingMemorySeconds{width:100%;min-height:52px;border:1px solid #cadbd3;border-radius:13px;background:white;padding:10px 14px}
      #gamesView .game-learning.hand{font-family:"Bad Script",cursive!important;font-weight:400!important;letter-spacing:0!important}
      #gamesView .find-question-row,
      #gamesView .build-task-row,
      #gamesView .missing-task-row{box-sizing:border-box;width:100%;padding-left:76px!important;padding-right:76px!important}
      #gamesView .find-question,
      #gamesView .build-center,
      #gamesView .missing-center{width:min(100%,468px);max-width:468px;margin-inline:auto;min-width:0}
      #gamesView .build-slots,#gamesView .build-letters,#gamesView .missing-words,#gamesView .missing-answers{max-width:100%}
      @media(max-width:430px){
        #gamesView .find-question-row,
        #gamesView .build-task-row,
        #gamesView .missing-task-row{padding-left:54px!important;padding-right:54px!important}
        #gamesView .find-question,#gamesView .build-center,#gamesView .missing-center{width:100%;max-width:100%}
        #gamesView .missing-words,#gamesView .missing-answers{gap:8px}
        #gamesView .missing-word,#gamesView .missing-answer{min-width:0;padding-left:6px;padding-right:6px}
      }`;
    document.head.appendChild(css);

    const learningSelector = '.find-answer,.build-slot:not(.empty),.build-letter,.missing-word,.missing-answer';
    const applyTypography = root => {
      const scope = root?.querySelectorAll ? root : document;
      const nodes = [];
      if (root instanceof Element && root.matches(learningSelector)) nodes.push(root);
      nodes.push(...scope.querySelectorAll(learningSelector));
      nodes.forEach(el => {
        const raw = el.dataset.learningValue || el.textContent.trim();
        if (!raw || raw === '?') return;
        el.dataset.learningValue = raw.toLowerCase();
        if (typeof shown === 'function') el.textContent = shown(raw);
        el.classList.add('game-learning');
        el.classList.toggle('hand', typeof style === 'string' && style.startsWith('hand'));
      });
    };

    applyTypography(document.getElementById('gamesView'));
    const gamesView = document.getElementById('gamesView');
    if (gamesView) {
      const observer = new MutationObserver(records => records.forEach(record => {
        record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) applyTypography(node); });
        if (record.type === 'characterData' && record.target.parentElement) applyTypography(record.target.parentElement);
      }));
      observer.observe(gamesView, {subtree:true, childList:true, characterData:true});
    }

    document.getElementById('parentBack')?.addEventListener('click', () => nativeSetTimeout(() => applyTypography(document.getElementById('gamesView')), 0));
    document.querySelectorAll('.style-option').forEach(button => button.addEventListener('click', () => nativeSetTimeout(() => applyTypography(document.getElementById('gamesView')), 0)));
  });
})();
