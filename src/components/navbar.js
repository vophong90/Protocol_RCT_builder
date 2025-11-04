// src/components/navbar.js
import { getCurrentStep, goToStep } from '../router.js';

export function renderNavbar() {
  const host = document.getElementById('navbar');
  if (!host) return; // nếu bạn không có #navbar thì bỏ qua, không thay đổi HTML hiện có

  const s = getCurrentStep();
  const items = Array.from({ length: 16 }, (_, i) =>
    `<button class="nav-step${i===s?' is-active':''}" data-step="${i}">Bước ${i}</button>`
  ).join('');

  host.innerHTML = `
    <div class="navbar-inner">
      <button id="btn-prev" aria-label="Trước">&larr;</button>
      <div class="nav-steps">${items}</div>
      <button id="btn-next" aria-label="Tiếp">&rarr;</button>
    </div>
  `;

  host.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-step]');
    if (btn) goToStep(Number(btn.dataset.step));
    if (e.target.id === 'btn-prev') goToStep(s - 1);
    if (e.target.id === 'btn-next') goToStep(s + 1);
  });
}
