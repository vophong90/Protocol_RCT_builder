/* ========================================================================
   Wizard Đề cương RCT – App entry (paths for src/steps/*, named exports)
   ======================================================================== */

/* ---------------------------- Imports bước ----------------------------- */
/* Mỗi module bước export: export function mount(el, ctx) { ... } */
import * as Step0  from './steps/step0_pico.js';
import * as Step1  from './steps/step1_question.js';
import * as Step2  from './steps/step2_objectives.js';
import * as Step3  from './steps/step3_intro.js';
import * as Step4  from './steps/step4_literature.js';
import * as Step5  from './steps/step5_design.js';
import * as Step6  from './steps/step6_sample_size.js';
import * as Step7  from './steps/step7_criteria.js';
import * as Step8  from './steps/step8_randomization.js';
import * as Step9  from './steps/step9_intervention.js';
import * as Step10 from './steps/step10_variables.js';
import * as Step11 from './steps/step11_data_collection.js';
import * as Step12 from './steps/step12_analysis.js';
import * as Step13 from './steps/step13_ethics.js';
import * as Step14 from './steps/step14_logic_check.js';
import * as Step15 from './steps/step15_flow_diagram.js';

/* ----------------------------- Hằng số & DOM ---------------------------- */
const LS_KEY_DATA     = 'rctWizardData';
const LS_KEY_LASTSTEP = 'rctWizardLastStep';

const TITLES = [
  'Bước 1 – PICO',
  'Bước 2 – Câu hỏi nghiên cứu',
  'Bước 3 – Mục tiêu',
  'Bước 4 – Mở đầu (CaRS)',
  'Bước 5 – Tổng quan tài liệu',
  'Bước 6 – Thiết kế nghiên cứu',
  'Bước 7 – Cỡ mẫu',
  'Bước 8 – Tiêu chí vào/loại',
  'Bước 9 – Ngẫu nhiên hoá',
  'Bước 10 – Mô tả can thiệp',
  'Bước 11 – Biến số',
  'Bước 12 – Thu thập dữ liệu',
  'Bước 13 – Phân tích số liệu',
  'Bước 14 – Đạo đức nghiên cứu',
  'Bước 15 – Kiểm tra logic',
  'Bước 16 – Sơ đồ nghiên cứu (Mermaid)',
];

const STEPS = [
  Step0, Step1, Step2, Step3, Step4, Step5, Step6, Step7,
  Step8, Step9, Step10, Step11, Step12, Step13, Step14, Step15,
];

const appEl      = document.getElementById('app');
const titleEl    = document.getElementById('page-title');
const stepEls    = [...Array(16).keys()].map(i => document.getElementById(`step-${i}`));
const stepBodies = [...Array(16).keys()].map(i => document.getElementById(`step-${i}-body`));
const navEls     = [...Array(16).keys()].map(i => document.getElementById(`nav-${i}`));

/* ---------------------------- Vendor handles --------------------------- */
/* PDF.js */
const pdfjsLib = window['pdfjsLib'] || window['pdfjs-dist'] || window['pdfjs'];
if (pdfjsLib && pdfjsLib.GlobalWorkerOptions) {
  // Dùng đường dẫn tuyệt đối từ web root (public root): /vendor/pdfjs/...
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
}

/* Mermaid, Chart, Papa, html2canvas lấy từ window (đã load trong index.html) */
const mermaid      = window.mermaid;
const Chart        = window.Chart;
const Papa         = window.Papa;
const html2canvas  = window.html2canvas;

/* ----------------------------- State & Storage -------------------------- */
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY_DATA);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Không parse được state, dùng {}.', e);
    return {};
  }
}
function persist() {
  try { localStorage.setItem(LS_KEY_DATA, JSON.stringify(state)); }
  catch (e) { console.error('Lưu state thất bại:', e); }
}
function setDeep(obj, path, value) {
  if (!path) return;
  const keys = Array.isArray(path) ? path : path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}
function getDeep(obj, path, fallback = undefined) {
  if (!path) return fallback;
  const keys = Array.isArray(path) ? path : path.split('.');
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return fallback;
    cur = cur[k];
  }
  return cur === undefined ? fallback : cur;
}

/* ------------------------------ Tiện ích chung -------------------------- */
function toast(msg, ms = 1800) {
  let root = document.getElementById('toast-root');
  if (!root) return alert(msg);
  root.classList.remove('hidden');
  root.innerHTML = `
    <div style="
      position: fixed; right: 16px; bottom: 16px; background:#111827; color:#fff;
      padding:10px 14px; border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,.18);
      z-index: 50; max-width: 60vw; font-size: 14px;">${escapeHtml(msg)}</div>`;
  setTimeout(() => { root.classList.add('hidden'); root.innerHTML = ''; }, ms);
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function extractTextFromPDF(fileOrArrayBuffer) {
  try {
    const data =
      fileOrArrayBuffer instanceof ArrayBuffer
        ? fileOrArrayBuffer
        : await fileOrArrayBuffer.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const out = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const strings = content.items.map(it => it.str);
      out.push(strings.join(' ').replace(/\s+/g, ' ').trim());
    }
    return out.join('\n\n');
  } catch (e) {
    console.error('extractTextFromPDF error:', e);
    toast('Không đọc được PDF.');
    return '';
  }
}

async function callGPT(prompt) {
  try {
    const res = await fetch('https://gpt-api-19xu.onrender.com/gpt.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'chat', prompt }),
    });
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      const c = j?.choices?.[0]?.message?.content ?? j?.content ?? txt;
      return String(c);
    } catch {
      return txt;
    }
  } catch (e) {
    console.error('callGPT error:', e);
    toast('Không kết nối được GPT endpoint.');
    return '';
  }
}

function downloadJSON(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function save(input, value) {
  if (typeof input === 'string') setDeep(state, input, value);
  else if (typeof input === 'object' && input) state = { ...state, ...input };
  persist();
}
function get(path, fallback) { return path ? getDeep(state, path, fallback) : state; }

/* ----------------------------- Điều hướng bước -------------------------- */
let current = clamp(parseInt(localStorage.getItem(LS_KEY_LASTSTEP) || '0', 10), 0, 15);
function clamp(v, a, b) { return Math.min(Math.max(v, a), b); }

async function goto(stepIndex) {
  current = clamp(stepIndex, 0, 15);
  localStorage.setItem(LS_KEY_LASTSTEP, String(current));

  navEls.forEach((el, i) => { if (el) el.classList.toggle('active', i === current); });
  stepEls.forEach((el, i) => { if (el) el.classList.toggle('active', i === current); });

  if (titleEl) titleEl.textContent = TITLES[current];

  const mod = STEPS[current];
  const targetEl = stepBodies[current] || appEl;
  if (mod && typeof mod.mount === 'function' && targetEl) {
    const ctx = {
      appEl, titleEl,
      state,
      save, get, goto,
      extractTextFromPDF, callGPT, downloadJSON, toast,
      vendor: { Papa, pdfjsLib, html2canvas, Chart, mermaid },
    };
    try {
      await mod.mount(targetEl, ctx);
    } catch (e) {
      console.error(`Lỗi render bước ${current}:`, e);
      targetEl.innerHTML = `<div style="color:#b91c1c">Không render được bước này. Xem console để biết chi tiết.</div>`;
    }
  } else if (targetEl) {
    targetEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:.75rem;">
        <span style="font-size:20px">ℹ️</span>
        <div>
          <div><strong>Chưa có module cho bước ${current + 1}.</strong></div>
          <div>Tạo file: <code>src/steps/step${current}_${slugTitle(TITLES[current])}.js</code> và export <code>mount(el, ctx)</code>.</div>
        </div>
      </div>`;
  }

  const sidebar = document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
}

function slugTitle(s) {
  return s.toLowerCase()
    .replace(/[()]/g,'')
    .replace(/\s+/g,'-')
    .replace(/[^a-z0-9\-]/g,'')
    .replace(/-+/g,'-');
}

/* ------------------------------- Sự kiện UI ----------------------------- */
function wireNav() {
  navEls.forEach((el, i) => { if (el) el.addEventListener('click', () => goto(i)); });
}
window.addEventListener('storage', (ev) => { if (ev.key === LS_KEY_DATA) state = loadState(); });

/* -------------------------------- Khởi động ----------------------------- */
function init() {
  wireNav();
  goto(current);
  console.log('%cWizard RCT', 'color:#0ea44b;font-weight:700', { step: current, state });
}
document.addEventListener('DOMContentLoaded', init);
