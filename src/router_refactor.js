const TOTAL_STEPS = 16; // 0..15 (mặc định hỗ trợ đủ)
export function getCurrentStep(){
  const m = (location.hash || '#step-0').match(/#step-(\d+)/);
  const n = m ? parseInt(m[1], 10) : 0;
  return Number.isNaN(n) ? 0 : Math.max(0, Math.min(TOTAL_STEPS-1, n));
}
export function goToStep(n){
  const clamped = Math.max(0, Math.min(TOTAL_STEPS-1, Number(n)));
  const targetHash = `#step-${clamped}`;
  if (location.hash !== targetHash) location.hash = targetHash; else renderStep(clamped);
}
export function renderStep(n = getCurrentStep()){
  const steps = document.querySelectorAll('.step'); steps.forEach(el => el.classList.remove('active'));
  const el = document.getElementById(`step-${n}`); if (el) el.classList.add('active');
  document.dispatchEvent(new CustomEvent('wizard:stepchange', { detail:{ step:n } }));
}
export function initRouter(){
  window.addEventListener('hashchange', () => renderStep(getCurrentStep()));
  if (!location.hash) location.hash = '#step-0';
  renderStep();
}
