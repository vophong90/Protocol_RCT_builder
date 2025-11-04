// src/components/navbar.js
import { getCurrentStep, goToStep } from '../router.js';

const LS_KEY = 'navbar-open';

function ensureHost() {
  let host = document.getElementById('navbar');
  if (!host) {
    host = document.createElement('div');
    host.id = 'navbar';
    document.body.prepend(host);
  }
  return host;
}

export function renderNavbar() {
  const host = ensureHost();
  const isOpen = (localStorage.getItem(LS_KEY) ?? '1') === '1';
  const s = getCurrentStep();

  const stepBtns = Array.from({ length: 16 }, (_, i) =>
    `<button class="nav-step${i===s?' is-active':''}" data-step="${i}" aria-label="Bước ${i}">Bước ${i}</button>`
  ).join('');

  host.innerHTML = `
    <div class="navbar-inner">
      <div class="brand">
        <img class="brand-logo" src="./public/brand/logo.svg" alt="" />
        <span class="brand-name">${document.title || 'Wizard RCT'}</span>
      </div>
      <div class="nav-actions">
        <button id="btn-prev" class="ghost" aria-label="Trước">&larr;</button>
        <button id="btn-toggle" aria-expanded="${isOpen ? 'true':'false'}">Lộ trình</button>
        <button id="btn-next" class="ghost" aria-label="Tiếp">&rarr;</button>
      </div>
    </div>
    <div class="nav-steps-panel ${isOpen ? 'open' : ''}">
      ${stepBtns}
    </div>
  `;

  host.addEventListener('click', (e) => {
    const tgt = e.target;

    const btnStep = tgt.closest('[data-step]');
    if (btnStep) {
      goToStep(Number(btnStep.dataset.step));
      return;
    }
    if (tgt.id === 'btn-prev') {
      goToStep(s - 1);
      return;
    }
    if (tgt.id === 'btn-next') {
      goToStep(s + 1);
      return;
    }
    if (tgt.id === 'btn-toggle') {
      const panel = host.querySelector('.nav-steps-panel');
      const open = !panel.classList.contains('open');
      panel.classList.toggle('open', open);
      tgt.setAttribute('aria-expanded', open ? 'true':'false');
      localStorage.setItem(LS_KEY, open ? '1':'0');
      return;
    }
  });
}
