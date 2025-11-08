import { initRouter, goToStep, getCurrentStep } from './router_refactor.js';
import { getState, saveState, setAt } from './state/store.js';
import { ensureCSS } from './utils/css.js';
import { askGPT } from './services/gpt.js';

// Import demo steps (0, 5, 15)
import * as Step0 from './steps/step0/index.js';
import * as Step5 from './steps/step5/index.js';
import * as Step15 from './steps/step15/index.js';

const STEPS = { 0: Step0, 5: Step5, 15: Step15 };

function renderNav(){
  const nav = document.getElementById('nav');
  const items = [0,5,15].map(i => {
    const s = STEPS[i];
    return `<button class="tab ${i===getCurrentStep()?'active':''}" data-step="${i}">
      <strong>${i+1}. ${s.title}</strong>${s.subtitle?` <small>${s.subtitle}</small>`:''}</button>`;
  }).join('');
  nav.innerHTML = items;
  nav.querySelectorAll('button[data-step]').forEach(btn =>
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.step))));
}

function setTitle(i){
  const title = document.getElementById('page-title');
  const s = STEPS[i];
  title.textContent = `Bước ${i+1} – ${s.title}`;
}

// ---- Adapter cho ctx.get / ctx.save / ctx.callGPT ----
function ctxGet(key, fallback){
  const s = getState();
  if (!key) return s;
  return (s[key] !== undefined) ? s[key] : fallback;
}
function ctxSave(key, value){
  if (typeof key === 'string') {
    // Merge đơn giản cấp 1 (đúng với cách bạn dùng: 'design', 'interventions', ...)
    const next = {};
    next[key] = value;
    saveState(next);
  } else if (key && typeof key === 'object') {
    // backup: cho phép save(patchObject)
    saveState(key);
  } else {
    console.warn('[ctx.save] Sai tham số:', key);
  }
  return getState();
}
const ctxToast = (msg) => console.log('[toast]', msg);
const ctxCallGPT = (prompt) => askGPT(prompt);

async function mountStep(i){
  const s = STEPS[i];
  if (!s) return;
  if (s.css) ensureCSS(s.css);
  const outlet = document.getElementById(`step-${i}-body`);
  if (!outlet) return;
  outlet.innerHTML = '';

  const ctx = {
    // state helpers gốc
    state: getState(),
    save: saveState,  // save patch thô (nếu step cần)
    setAt,

    // adapter tương thích file Step 5 cũ của bạn
    get: ctxGet,
    save: ctxSave,        // override: cho phép save('design', {...})
    callGPT: ctxCallGPT,
    toast: ctxToast,

    // điều hướng
    goto: goToStep,
  };

  await s.mount(outlet, ctx);
}

document.addEventListener('wizard:stepchange', () => {
  renderNav();
  setTitle(getCurrentStep());
  mountStep(getCurrentStep());
});

renderNav();
setTitle(getCurrentStep());
initRouter();
mountStep(getCurrentStep());
