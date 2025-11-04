// src/router.js
import { renderNavbar } from './components/navbar.js';

let current = 0;

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const readHashStep = () => {
  const m = location.hash.match(/#step-(\d+)/);
  return m ? Number(m[1]) : null;
};

export function getCurrentStep() {
  return current;
}

export function goToStep(n) {
  const total = document.querySelectorAll('.step').length || 16;
  const max = total - 1;
  const next = clamp(Number(n ?? 0), 0, max);

  current = next;

  // Hiển thị/ẩn các step (giữ nguyên DOM cũ)
  const steps = document.querySelectorAll('.step');
  steps.forEach((el, i) => el.classList.toggle('active', i === next));

  // Đồng bộ URL + localStorage
  const hash = `#step-${next}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  localStorage.setItem('currentStep', String(next));

  // Cập nhật navbar & phát sự kiện
  try { renderNavbar(); } catch {}
  document.dispatchEvent(
    new CustomEvent('wizard:stepchange', { detail: { step: next } })
  );
}

export function initRouter() {
  const initial =
    readHashStep() ?? Number(localStorage.getItem('currentStep') || 0);
  goToStep(initial);

  window.addEventListener('hashchange', () => {
    const s = readHashStep();
    if (s != null) goToStep(s);
  });
}
