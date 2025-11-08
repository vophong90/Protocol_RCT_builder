// src/app.js
import { initRouter, goToStep, getCurrentStep } from './router.js';

const TITLES = [
  "PICO","Câu hỏi nghiên cứu","Mục tiêu","Mở đầu (CaRS)","Tổng quan tài liệu",
  "Thiết kế nghiên cứu","Cỡ mẫu","Tiêu chí vào/loại","Ngẫu nhiên hoá","Mô tả can thiệp",
  "Biến số","Thu thập dữ liệu","Phân tích số liệu","Đạo đức nghiên cứu","Kiểm tra logic","Sơ đồ nghiên cứu (Mermaid)"
];

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

function renderStub(i){
  const body = document.getElementById(`step-${i}-body`);
  if (!body) return;
  body.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">${TITLES[i]}</h3>
      <div class="card-subtitle muted">Stub – Bước này sẽ được tách UI/logic ở các bước sau.</div>
    </div>
    <div class="card-body">
      <div class="muted">Đang ở bước ${i+1}. (Router & layout đã hoạt động)</div>
    </div>
  `;
}

document.addEventListener('wizard:stepchange', () => {
  renderNav();
  const i = getCurrentStep();
  setTitle(i);
  renderStub(i);
});

// khởi động
renderNav();
setTitle(getCurrentStep());
initRouter();          // kích hoạt hash router
renderStub(getCurrentStep());
