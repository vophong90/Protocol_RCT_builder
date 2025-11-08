// src/steps/step2/index.js
// Step 2 – Mục tiêu nghiên cứu (module hoá, per-step GPT binding)

export const id = 2;
export const title = "Mục tiêu nghiên cứu";
export const subtitle = "Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.";
export const css = "./public/css/steps/step2.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step 2
  rootEl.closest('.step')?.setAttribute('data-scope', 'step2');

  // ---- UI ----
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Mục tiêu nghiên cứu</h3>
      <div class="card-subtitle">Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.</div>
    </div>

    <!-- Mục tiêu chính -->
    <div class="card-body">
      <label>Mục tiêu chính
        <textarea id="obj-main" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
      </label>
    </div>

    <!-- Mục tiêu phụ -->
    <div class="card-body">
      <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
      <div class="inline-row" style="gap:8px">
        <input id="obj-sub-input" type="text" placeholder="Nhập mục tiêu phụ..." />
        <button id="obj-sub-add" class="btn btn-secondary" type="button">Thêm</button>
      </div>
      <div id="obj-sub-list" class="sub-list" style="margin-top:.5rem"></div>
    </div>

    <!-- File + 2 nút GPT -->
    <div class="card-body">
      <div class="inline-row" style="gap:12px; flex-wrap:wrap;">
        <input id="obj-pdf" type="file" accept="application/pdf" />
        <span id="obj-fname" class="muted">Chưa chọn tệp PDF</span>
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button id="obj-gpt"  class="btn btn-primary" type="button">GPT gợi ý mục tiêu</button>
        <button id="obj-eval" class="btn btn-primary" type="button">GPT đánh giá mục tiêu</button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý -->
    <div id="obj-suggest-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="obj-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="obj-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="obj-suggest-ta" rows="8" placeholder="Mục tiêu chính: …&#10;- Mục tiêu phụ 1&#10;- Mục tiêu phụ 2"></textarea>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ -->
    <div id="obj-eval-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="obj-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="obj-eval-ta" rows="9" placeholder="Nhận xét theo SMART, bám PICO…"></textarea>
    </div>

    <div class="card-footer">
      <button id="obj-save" class="btn btn-primary" type="button">Lưu</button>
    </div>
  `.trim();

  // ===== Elements =====
  const $ = (sel) => rootEl.querySelector(sel);

  const mainEl     = $('#obj-main');

  const subInputEl = $('#obj-sub-input');
  const subAddBtn  = $('#obj-sub-add');
  const subListEl  = $('#obj-sub-list');

  const pdfEl      = $('#obj-pdf');
  const fnameChip  = $('#obj-fname');

  const saveBtn    = $('#obj-save');
  const gptBtn     = $('#obj-gpt');
  const evalBtn    = $('#obj-eval');

  const sWrap  = $('#obj-suggest-wrap');
  const sTA    = $('#obj-suggest-ta');
  const sApply = $('#obj-apply');
  const sCopy  = $('#obj-copy-suggest');
  const sHide  = $('#obj-hide-suggest');

  const eWrap  = $('#obj-eval-wrap');
  const eTA    = $('#obj-eval-ta');
  const eCopy  = $('#obj-copy-eval');
  const eHide  = $('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) { eTA.value = String(oldEval); eWrap.classList.remove('hidden'); }

  // ===== Sub objectives =====
  subAddBtn.addEventListener('click', addSubObjective);
  subInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addSubObjective(); }
  });

  function addSubObjective() {
    const v = (subInputEl.value || '').trim();
    if (!v) return;
    subObjectives.push(v);
    subInputEl.value = '';
    renderSubList();
  }

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives) || subObjectives.length === 0) {
      subListEl.innerHTML = '<div class="muted">Chưa có mục tiêu phụ.</div>';
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const row = document.createElement('div');
      row.className = 'sub-item';

      const t = document.createElement('div');
      t.className = 'sub-item-text';
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.className = 'sub-item-ctrls';

      const up = document.createElement('button');
      up.className = 'btn btn-ghost';
      up.textContent = '↑';
      up.title = 'Lên';
      up.onclick = () => {
        if (idx > 0) { [subObjectives[idx-1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx-1]]; renderSubList(); }
      };

      const down = document.createElement('button');
      down.className = 'btn btn-ghost';
      down.textContent = '↓';
      down.title = 'Xuống';
      down.onclick = () => {
        if (idx < subObjectives.length - 1) { [subObjectives[idx+1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx+1]]; renderSubList(); }
      };

      const del = document.createElement('button');
      del.className = 'btn btn-ghost';
      del.textContent = 'Xóa';
      del.onclick = () => { subObjectives.splice(idx, 1); renderSubList(); };

      controls.append(up, down, del);
      row.append(t, controls);
      subListEl.appendChild(row);
    });
  }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu');
  });

  // ===== File UI =====
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameChip.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  // ===== GPT Suggest =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'GPT gợi ý mục tiêu');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = typeof ctx.extractTextFromPDF === 'function'
            ? await ctx.extractTextFromPDF(f)
            : await fallbackExtractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO, câu hỏi nghiên cứu và (nếu có) tài liệu PDF,
hãy đề xuất MỘT mục tiêu chính và 2–5 mục tiêu phụ.

YÊU CẦU TRẢ VỀ JSON HỢP LỆ:
{"main":"...","subs":["...","..."]}

PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}

Trích lược tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await callAI('step2.suggest', prompt, ctx);
      const parsed = parseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        const lines = [];
        if (parsed.main) lines.push('Mục tiêu chính: ' + parsed.main);
        (parsed.subs || []).forEach(x => lines.push('- ' + x));
        sTA.value = lines.join('\n');
        sWrap.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý từ GPT.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý mục tiêu');
    }
  }

  // Áp dụng gợi ý
  sApply.addEventListener('click', () => {
    const obj = parseObjectives(sTA.value);
    if (!obj) { ctx.toast('Không nhận diện được gợi ý hợp lệ.'); return; }
    if (obj.main) mainEl.value = obj.main;
    if (Array.isArray(obj.subs)) subObjectives = obj.subs.slice();
    renderSubList();
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', subObjectives);
    ctx.toast('Đã chèn gợi ý vào các ô.');
  });
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sWrap.classList.add('hidden'));

  // ===== GPT Evaluate =====
  evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) { ctx.toast('Chưa có mục tiêu để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'GPT đánh giá mục tiêu');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đánh giá bộ mục tiêu sau theo tiêu chí SMART và bám PICO.
Trả lời gạch đầu dòng ngắn gọn (không trả JSON).

Mục tiêu chính:
${main || '(chưa có)'}

Mục tiêu phụ:
${subs.length ? subs.map((s,i)=> (i+1)+'. '+s).join('\\n') : '(chưa có)'}

Tham chiếu PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}
`.trim();

      const raw = await callAI('step2.evaluate', prompt, ctx);
      const text = String(raw || '').trim();
      eTA.value = text;
      eWrap.classList.remove('hidden');
      ctx.save('objectivesEval', eTA.value);
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá mục tiêu');
    }
  }

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eWrap.classList.add('hidden'));

  // ===== Helpers =====
  function parseObjectives(text) {
    try {
      const j = JSON.parse(String(text));
      const main = String(j?.main || '').trim();
      const subs = Array.isArray(j?.subs) ? j.subs.map(s => String(s || '').trim()).filter(Boolean) : [];
      if (!main && subs.length === 0) return null;
      return { main, subs };
    } catch {
      // fallback: tách theo dòng, nhận "Mục tiêu chính:" hoặc dòng đầu là chính
      const L = String(text || '')
        .split(/\r?\n/)
        .map(s => s.replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, '').trim())
        .filter(Boolean);
      if (L.length === 0) return null;
      let main = '';
      const subs = [];
      for (let i = 0; i < L.length; i++) {
        const ln = L[i];
        const m = ln.match(/^mục\s*tiêu\s*chính\s*:\s*(.+)$/iu);
        if (m) { main = m[1].trim(); continue; }
        if (!main) main = ln; else subs.push(ln);
      }
      return { main, subs };
    }
  }

  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }

  // Gọi GPT theo kiến trúc per-step binding, fallback qua ctx.callGPT nếu có
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') {
      return ctx_.callStepGPT(bindingKey, prompt);
    }
    if (typeof ctx_.callGPT === 'function') {
      return ctx_.callGPT(prompt);
    }
    throw new Error('Chưa cấu hình GPT binding cho step 2');
  }

  // Fallback đọc PDF bằng pdfjs nếu ctx chưa cung cấp
  async function fallbackExtractTextFromPDF(file, maxPages = 4) {
    const pdfjs = (globalThis.pdfjsLib || window.pdfjsLib);
    if (!pdfjs) throw new Error('pdfjsLib chưa được nạp');
    const buf = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buf }).promise;
    const n = Math.min(pdf.numPages, maxPages);
    let out = '';
    for (let i = 1; i <= n; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map(it => it.str).join(' ') + '\n';
    }
    return out.trim();
  }
}
