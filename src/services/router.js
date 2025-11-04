// src/router.js
import { qs, qsa, show, hide } from './utils/dom.js';

const TOTAL_STEPS = 16; // 0..15

export function getCurrentStep() {
  const h = location.hash || '#step-0';
  const m = h.match(/#step-(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  return isNaN(n) ? 0 : Math.max(0, Math.min(TOTAL_STEPS - 1, n));
}

export function goToStep(n) {
  const clamped = Math.max(0, Math.min(TOTAL_STEPS - 1, Number(n)));
  if (`#step-${clamped}` !== location.hash) {
    location.hash = `#step-${clamped}`;
  } else {
    renderStep(clamped);
  }
}

export function nextStep() { goToStep(getCurrentStep() + 1); }
export function prevStep() { goToStep(getCurrentStep() - 1); }

export function renderStep(n = getCurrentStep()) {
  const steps = qsa('.step');
  steps.forEach(hide);
  const el = qs(`#step-${n}`);
  show(el);
  // Nếu mỗi step có hàm onShowStepX thì gọi (giữ nguyên hành vi nếu đã dùng trước đây)
  const hookName = `onShow_step${n}`;
  if (typeof window[hookName] === 'function') {
    try { window[hookName](); } catch (e) { /* noop */ }
  }
}

export function initRouter() {
  window.addEventListener('hashchange', () => renderStep(getCurrentStep()));
  if (!location.hash) location.hash = '#step-0';
  renderStep();
}
