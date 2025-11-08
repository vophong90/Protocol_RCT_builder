// src/state/store.js
const LS_KEY = 'rctWizardData';

// --- public API ---
let state = load();
export const getState = () => state;

/**
 * Gộp patch vào state hiện tại rồi ghi localStorage.
 * Ví dụ: saveState({ design: { type: 'parallel' } })
 */
export function saveState(patch = {}) {
  state = deepMerge(state, patch);
  persist();
  return state;
}

/**
 * Gán theo path dạng "a.b.c" hoặc ['a','b','c'] rồi ghi localStorage.
 * Ví dụ: setAt('notes.5', 'ghi chú bước 6');
 */
export function setAt(path, value) {
  setDeep(state, path, value);
  persist();
  return state;
}

// --- internals ---
function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

function setDeep(obj, path, value) {
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function deepMerge(target, source) {
  if (Array.isArray(source)) return source.slice();
  if (source && typeof source === 'object') {
    const out = { ...(target || {}) };
    for (const k of Object.keys(source)) {
      out[k] = deepMerge(out[k], source[k]);
    }
    return out;
  }
  return source;
}
