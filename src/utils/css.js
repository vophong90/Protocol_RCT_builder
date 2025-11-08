// src/utils/css.js
const loaded = new Set();

export function ensureCSS(href){
  if (!href || loaded.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  loaded.add(href);
}
