// src/steps/step2_objectives.js
// Step 2 – Mục tiêu nghiên cứu
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Mục tiêu nghiên cứu</h3>
    <div class="card-subtitle">Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.</div>
  </div>

  <style>
    .obj-textarea{
      width:100%; font:inherit; line-height:1.55;
      padding:.9rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
    }
    .action-bar{display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap}
    .left-tools,.right-tools{display:flex; gap:8px; align-items:center; flex-wrap:wrap}
    .file-chip{
      display:inline-flex; gap:.5rem; align-items:center;
      background:#fff; border:1px solid var(--border); color:var(--muted);
      padding:.35rem .7rem; border-radius:999px;
    }
    .result-area{
      width:100%; min-height:160px; max-height:42vh; resize:vertical;
      font:inherit; line-height:1.55; padding:.85rem 1rem;
      border:1px solid var(--border); border-radius:12px; background:#fff;
    }
    .section{margin:0 16px 12px}
    .result-head{display:flex; align-items:center; justify-content:space-between; gap:8px}
    .btn-row{display:flex; gap:8px; align-items:center}
    .mini{font-size:.85rem}
  </style>

  <!-- Mục tiêu chính -->
  <div class="card-body">
    <label>
      Mục tiêu chính
      <textarea id="obj-main" class="obj-textarea" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
    </label>
  </div>

  <!-- Mục tiêu phụ -->
  <div class="card-body">
    <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:.5rem">
      <input id="obj-sub-input" type="text" class="obj-textarea" placeholder="Nhập mục tiêu phụ..." style="flex:1;min-width:260px; padding:.6rem .9rem"/>
      <button id="obj-sub-add" class="btn-secondary" type="button">Thêm</button>
    </div>
    <div id="obj-sub-list" class="list"></div>
  </div>

  <!-- Thanh hành động (file + GPT) -->
  <div class="card-body action-bar">
    <div class="left-tools">
      <input id="obj-pdf" type="file" accept="application/pdf" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" />
      <button id="obj-choose" class="btn-outline" type="button">Chọn PDF</button>
      <span id="obj-fname" class="file-chip">Chưa chọn</span>
    </div>
    <div class="right-tools">
      <button id="obj-gpt"  class="btn-primary" type="button">GPT gợi ý mục tiêu</button>
      <button id="obj-eval" class="btn-outline" type="button">GPT đánh giá mục tiêu</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý (textarea riêng) -->
  <div id="obj-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <button id="obj-apply" class="btn-primary" type="button">Chèn vào ô</button>
        <button id="obj-copy-suggest" class="btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-suggest" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-suggest-ta" class="result-area" placeholder="Mục tiêu chính: …&#10;- Mục tiêu phụ 1&#10;- Mục tiêu phụ 2"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ (textarea riêng) -->
  <div id="obj-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="obj-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-eval-ta" class="result-area" placeholder="Nhận xét theo SMART, bám PICO…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="obj-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const mainEl       = rootEl.querySelector('#obj-main');

  const subInputEl   = rootEl.querySelector('#obj-sub-input');
  const subAddBtn    = rootEl.querySelector('#obj-sub-add');
  const subListEl    = rootEl.querySelector('#obj-sub-list');

  const pdfEl        = rootEl.querySelector('#obj-pdf');
  const chooseBtn    = rootEl.querySelector('#obj-choose');
  const fnameChip    = rootEl.querySelector('#obj-fname');

  const saveBtn      = rootEl.querySelector('#obj-save');
  const gptBtn       = rootEl.querySelector('#obj-gpt');
  const evalBtn      = rootEl.querySelector('#obj-eval');

  const sBox         = rootEl.querySelector('#obj-suggest-box');
  const sTA          = rootEl.querySelector('#obj-suggest-ta');
  const sApply       = rootEl.querySelector('#obj-apply');
  const sCopy        = rootEl.querySelector('#obj-copy-suggest');
  const sHide        = rootEl.querySelector('#obj-hide-suggest');

  const eBox         = rootEl.querySelector('#obj-eval-box');
  const eTA          = rootEl.querySelector('#obj-eval-ta');
  const eCopy        = rootEl.querySelector('#obj-copy-eval');
  const eHide        = rootEl.querySelector('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives', []) : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) { eTA.value = String(oldEval); eBox.classList.remove('hidden'); }

  // ===== Sub objectives =====
  subAddBtn.addEventListener('click', () => {
    const v = (subInputEl.value || '').trim();
    if (!v) return;
    subObjectives.push(v);
    subInputEl.value = '';
    renderSubList();
  });

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives) || subObjectives.length === 0) {
      subListEl.innerHTML = `<div style="opacity:.7">Chưa có mục tiêu phụ.</div>`;
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.padding = '8px 0';

      const t = document.createElement('div');
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';

      const upBtn = document.createElement('button');
      upBtn.className = 'btn-ghost';
      upBtn.textContent = '↑';
      upBtn.title = 'Lên';
      upBtn.onclick = () => {
        if (idx > 0) { [subObjectives[idx-1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx-1]]; renderSubList(); }
      };

      const downBtn = document.createElement('button');
      downBtn.className = 'btn-ghost';
      downBtn.textContent = '↓';
      downBtn.title = 'Xuống';
      downBtn.onclick = () => {
        if (idx < subObjectives.length - 1) { [subObjectives[idx+1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx+1]]; renderSubList(); }
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.textContent = 'Xóa';
      delBtn.onclick = () => { subObjectives.splice(idx, 1); renderSubList(); };

      controls.append(upBtn, downBtn, delBtn);
      item.append(t, controls);
      subListEl.appendChild(item);
    });
  }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu');
  });

  // ===== File choose =====
  chooseBtn.addEventListener('click', () => pdfEl.click());
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameChip.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn';
  });

  // ===== GPT Suggest =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO, câu hỏi nghiên cứu, và (nếu có) tài liệu PDF, hãy đề xuất **một mục tiêu chính** và **2–5 mục tiêu phụ**.

YÊU CẦU TRẢ VỀ JSON THUẦN:
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

      const raw = await ctx.callGPT(prompt);
      const parsed = parseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        // Hiển thị chuẩn hoá trong textarea (font đồng bộ)
        sTA.value = [
          parsed.main ? `Mục tiêu chính: ${parsed.main}` : '',
          ...(parsed.subs || []).map((x, i) => `- ${x}`)
        ].filter(Boolean).join('\\n');
        sBox.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý từ GPT.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý mục tiêu');
    }
  }

  // Áp dụng nội dung từ textarea gợi ý -> điền vào ô chính/phụ
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
  sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  // ===== GPT Evaluate =====
  evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) { ctx.toast('Chưa có mục tiêu để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đánh giá bộ mục tiêu sau theo tiêu chí SMART và bám PICO.
Trả về gạch đầu dòng ngắn gọn (không trả JSON).

Mục tiêu chính:
${main || '(chưa có)'}

Mục tiêu phụ:
${subs.length ? subs.map((s,i)=>\`\${i+1}. \${s}\`).join('\\n') : '(chưa có)'}

Tham chiếu PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const text = String(raw || '').trim();
      eTA.value = text;
      eBox.classList.remove('hidden');
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
  eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Helpers =====
  function parseObjectives(text) {
    // Ưu tiên JSON {"main": "...", "subs":[...]}
    try {
      const j = JSON.parse(String(text));
      const main = String(j?.main || '').trim();
      const subs = Array.isArray(j?.subs) ? j.subs.map(s => String(s || '').trim()).filter(Boolean) : [];
      if (!main && subs.length === 0) return null;
      return { main, subs };
    } catch (_) {
      // Fallback từ textarea: dòng đầu có thể là "Mục tiêu chính: …"
      const lines = String(text || '')
        .split(/\r?\n/)
        .map(s => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
        .filter(Boolean);
      if (lines.length === 0) return null;

      let main = '';
      const subs = [];
      lines.forEach((ln, i) => {
        const m = ln.match(/^mục\s*tiêu\s*chính\s*:\s*(.+)$/i);
        if (m) { main = m[1].trim(); return; }
        if (i === 0 && !main) { main = ln; }
        else { subs.push(ln); }
      });
      return { main, subs };
    }
  }

  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || '';
      btn.textContent = 'Đang xử lý...';
    } else {
      btn.disabled = false;
      btn.textContent = label || btn.dataset.prev || '';
    }
  }
}
