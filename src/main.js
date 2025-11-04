// src/main.js
import { initRouter, goToStep } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { loadData } from './state/storage.js';

// Mermaid (global) – giữ cấu hình cũ: startOnLoad=false để control thủ công
if (window.mermaid && typeof window.mermaid.initialize === 'function') {
  window.mermaid.initialize({ startOnLoad: false });
}

// pdf.js worker đã cấu hình trong index.html (giữ nguyên như baseline)

// Expose một số hàm global nếu HTML dùng onclick/onsubmit cũ
// (Ở các Đợt 2..4 khi import stepX.js, sẽ gán tiếp các hàm cụ thể lên window)
window.goToStep = goToStep;

function bootstrap() {
  // Đọc state ban đầu (không đổi key)
  loadData();
  // Vẽ navbar nếu có #navbar
  renderNavbar();
  // Kích hoạt router
  initRouter();
}

document.addEventListener('DOMContentLoaded', bootstrap);
