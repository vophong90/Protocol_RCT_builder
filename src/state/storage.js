// src/state/storage.js
const KEY = 'rctWizardData';
let cache = null;

export function loadData() {
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    cache = {};
  }
  return cache;
}

export function getData() {
  return cache ?? loadData();
}

export function saveData() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache ?? {}));
  } catch (e) {
    console.warn('saveData failed', e);
  }
}

export function setData(path, value) {
  const obj = getData();
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[parts.at(-1)] = value;
  cache = obj;
  saveData();
  document.dispatchEvent(
    new CustomEvent('wizard:datachange', { detail: { path, value } })
  );
}

export function updateData(mutator) {
  const obj = getData();
  const next = mutator ? mutator({ ...obj }) : obj;
  cache = next;
  saveData();
  document.dispatchEvent(
    new CustomEvent('wizard:datachange', { detail: { full: true } })
  );
}
