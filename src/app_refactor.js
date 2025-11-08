import { initRouter, goToStep, getCurrentStep } from './router_refactor.js';
import { getState, saveState, setAt } from './state/store.js';
import { ensureCSS } from './utils/css.js';

// Import demo steps (0, 5, 15) — sau sẽ thay bằng bước thật
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

async function mountStep(i){
  const s = STEPS[i];
  if (!s) return;
  if (s.css) ensureCSS(s.css);
  const outlet = document.getElementById(`step-${i}-body`);
  if (!outlet) return;
  outlet.innerHTML = '';
  const ctx = {
    state: getState(),
    save: saveState,
    setAt,
    goto: goToStep,
    toast: (msg) => console.log('[toast]', msg),
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
