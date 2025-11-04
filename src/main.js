// src/main.js
import { initRouter, goToStep } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { loadData } from './state/storage.js';
import { applyBrand } from './brand.js';   // <-- thêm

if (window.mermaid && typeof window.mermaid.initialize === 'function') {
  window.mermaid.initialize({ startOnLoad: false });
}
window.goToStep = goToStep;

async function bootstrap() {
  await applyBrand();   // <-- áp brand từ public/brand/brand.json
  loadData();
  renderNavbar();
  initRouter();
}
document.addEventListener('DOMContentLoaded', bootstrap);
