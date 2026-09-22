'use strict';

// Match the spoken word, never just its first letter or its emoji.
const pictureAssets = Object.freeze({
  'автобус': 'bus', 'мама': 'mother', 'кот': 'cat', 'игрушки': 'toys',
  'нос': 'nose', 'папа': 'father', 'барабан': 'drum', 'волк': 'wolf',
  'дом': 'house', 'гусеница': 'caterpillar', 'зебра': 'zebra', 'жук': 'beetle',
  'шар': 'balloon', 'цыплёнок': 'chick', 'сыр': 'cheese', 'енот': 'raccoon',
  'ёжик': 'hedgehog', 'ёж': 'hedgehog', 'юла': 'spinning-top',
  'конь': 'horse', 'подъезд': 'entrance'
});

function renderPicture(target, word, emoji) {
  const asset = pictureAssets[word];
  target.replaceChildren();
  if (!asset) {
    target.textContent = emoji;
    return;
  }
  const image = document.createElement('img');
  image.className = 'card-illustration';
  image.alt = word;
  image.decoding = 'async';
  image.draggable = false;
  // Keep an unavailable image from leaving an empty hint.
  image.onerror = () => {
    if (image.parentNode === target) target.textContent = emoji;
  };
  image.src = './assets/pictures/' + asset + '.png';
  target.append(image);
}
