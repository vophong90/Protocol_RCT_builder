// src/app.js
import { initRouter, goToStep, getCurrentStep } from './router.js';
import { getState, saveState, setAt } from './state/store.js';
import { ensureCSS } from './utils/css.js';
import { aiRun } from './services/ai.js';

const TITLES = [
  "PICO","Câu hỏi nghiên cứu","Mục tiêu","Mở đầu","Tổng quan tài liệu",
  "Thiết kế nghiên cứu","Cỡ mẫu","Tiêu chí chọn/loại","Ngẫu nhiên hoá","Mô tả can thiệp",
  "Biến số","Thu thập dữ liệu","Phân tích số liệu","Đạo đức nghiên cứu","Kiểm tra logic","Sơ đồ nghiên cứu"
];

// ---- ctx adapter (giữ y như Bước 2, dùng chung cho mọi step) ----
function ctxGet(key, fallback) {
  const s = getState();
  if (!key) return s;
  return (s[key] !== undefined) ? s[key] : fallback;
}
function ctxSave(key, value) {
  if (typeof key === 'string') {
    const patch = {}; patch[key] = value;
    return saveState(patch);
  } else if (key && typeof key === 'object') {
    return saveState(key);
  } else {
    console.warn('[ctx.save] Sai tham số:', key);
    return getState();
  }
}
const baseCtx = {
  get: ctxGet,
  save: ctxSave,
  setAt,
  toast: (msg) => console.log('[toast]', msg),
  goto: goToStep,
  callStepGPT: aiRun,
};

// ---- Nav + Title ----
function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = TITLES.map((t, i) =>
    `<button class="tab ${i===getCurrentStep()?'active':''}" data-step="${i}"><strong>${i+1}. ${t}</strong></button>`
  ).join('');
  nav.querySelectorAll('button[data-step]').forEach(btn =>
    btn.addEventListener('click', () => goToStep(Number(btn.dataset.step))));
}
function setTitle(i){
  document.getElementById('page-title').textContent = `Bước ${i+1} – ${TITLES[i]}`;
}

// ---- Fallback stub (nếu chưa có module cho step đó) ----
function renderStub(i){
  const body = document.getElementById(`step-${i}-body`);
  if (!body) return;
  const notes = baseCtx.get('notes', {});
  const note = notes?.[i] ?? '';
  body.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${TITLES[i]}</h3>
      <div class="card-subtitle muted">Stub – Bước này sẽ được tách UI/logic ở các bước sau.</div>
    </div>
    <div class="card-body grid-1">
      <div class="muted">Đang ở bước ${i+1}. (Module chưa được tạo → hiển thị tạm)</div>
      <label>Ghi chú bước này
        <textarea id="note-input" rows="4" placeholder="Nhập ghi chú, sẽ được lưu vào localStorage...">${note}</textarea>
      </label>
      <div class="inline-row">
        <button id="btn-save-note" class="btn btn-primary" type="button">Lưu ghi chú</button>
        <span class="muted" id="save-msg" aria-live="polite"></span>
      </div>
    </div>
  `;
  const ta = body.querySelector('#note-input');
  const btn = body.querySelector('#btn-save-note');
  const msg = body.querySelector('#save-msg');
  btn.addEventListener('click', () => {
    const value = (ta.value || '').trim();
    const nextNotes = { ...(baseCtx.get('notes', {})), [i]: value };
    baseCtx.save('notes', nextNotes);
    msg.textContent = 'Đã lưu!';
    setTimeout(() => (msg.textContent = ''), 1200);
  });
}

// ---- Dynamic import & mount ----
async function mountStep(i){
  const outlet = document.getElementById(`step-${i}-body`);
  if (!outlet) return;
  outlet.innerHTML = ''; // clear

  try {
    // cố gắng nạp module: ./steps/step{i}/index.js
    const mod = await import(`./steps/step${i}/index.js`);
    if (mod?.css) ensureCSS(mod.css);

    // ghép ctx (có thể mở rộng thêm API riêng nếu từng step cần)
    const ctx = { ...baseCtx };

    await mod.mount(outlet, ctx);
  } catch (err) {
    // nếu chưa có module → fallback stub
    renderStub(i);
  }
}

// ---- Lắng nghe chuyển bước ----
document.addEventListener('wizard:stepchange', () => {
  renderNav();
  const i = getCurrentStep();
  setTitle(i);
  mountStep(i);
});

// ---- Khởi động ----
renderNav();
setTitle(getCurrentStep());
initRouter();
mountStep(getCurrentStep());
