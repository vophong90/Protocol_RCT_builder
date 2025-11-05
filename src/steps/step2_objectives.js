// src/steps/step2_objectives.js
// Step 2 – Mục tiêu nghiên cứu
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div id="obj-card" class="card">
  <div class="card-header">
    <h3 class="card-title">Mục tiêu nghiên cứu</h3>
    <div class="card-subtitle">Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.</div>
  </div>

  <style>
    /* ===== Chỉ áp dụng trong card này ===== */
    #obj-card .card-title { font-weight: 600; }
    #obj-card label { font-weight: 500; color: #111827; }

    /* Textarea/Input thống nhất với Step 0–1 */
    #obj-card .form-textarea,
    #obj-card .form-input {
      width: 100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .9rem 1rem;
      outline: 0;
      transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
    }
    #obj-card .form-textarea { min-height: 110px; resize: vertical; }
    #obj-card .form-textarea::placeholder,
    #obj-card .form-input::placeholder { color: #9aa3af; }

    /* Hàng nhập mục tiêu phụ */
    #obj-card .subrow { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:.5rem; }
    #obj-card .subrow .form-input { flex:1; min-width:260px; padding:.75rem .9rem; border-radius:10px; }

    /* Danh sách mục tiêu phụ */
    #obj-card .list { border:1px dashed var(--border); border-radius:12px; padding:8px 10px; background:#fff; }
    #obj-card .list-item { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:8px 4px; }
    #obj-card .list-item + .list-item { border-top:1px solid var(--border); }
    #obj-card .list-item .controls { display:flex; gap:8px; }

    /* File input full-width + tên file */
    #obj-card .filebar { display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap; }
    #obj-card .file-wrap { width: 100%; max-width: 520px; }
    #obj-card input[type="file"] {
      width: 100%;
      font: 500 14.5px/1 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .5rem .6rem;
      background: #fff;
    }
    #obj-card input[type="file"]::file-selector-button {
      margin-right: .6rem;
      border: 1px solid var(--border);
      background: #fff;
      padding: .5rem .85rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    #obj-card input[type="file"]::file-selector-button:hover { background: #f9fafb; }
    #obj-card .file-note { color: var(--muted); font-size: .85rem; margin-top: 4px; }

    /* Khung kết quả GPT (gợi ý/đánh giá) */
    #obj-card .section { margin: 0 2px 12px; }
    #obj-card .result-area {
      width:100%; min-height:170px; max-height:42vh; resize:vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 14px;
      line-height:1.55; padding:.85rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
      white-space: pre-wrap;
    }
    #obj-card .result-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #obj-card .btn-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

    /* Nút đồng bộ */
    #obj-card .btn { min-height: 38px; }

    /* Ẩn/hiện */
    .hidden { display: none !important; }
  </style>

  <!-- Mục tiêu chính -->
  <div class="card-body">
    <label>
      Mục tiêu chính
      <textarea id="obj-main" class="form-textarea" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
    </label>
  </div>

  <!-- Mục tiêu phụ -->
  <div class="card-body">
    <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
    <div class="subrow">
      <input id="obj-sub-input" type="text" class="form-input" placeholder="Nhập mục tiêu phụ… (nhấn Enter để thêm)"/>
      <button id="obj-sub-add" class="btn btn-secondary" type="button">Thêm</button>
    </div>
    <div id="obj-sub-list" class="list"></div>
  </div>

  <!-- File + nút GPT -->
  <div class="card-body filebar">
    <div class="file-wrap">
      <input id="obj-pdf" type="file" accept="application/pdf" />
      <div id="obj-fname" class="file-note">Chưa chọn tệp PDF</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="obj-gpt"  class="btn btn-primary"   type="button">GPT gợi ý mục tiêu</button>
      <button id="obj-eval" class="btn btn-secondary" type="button">GPT đánh giá mục tiêu</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="obj-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <button id="obj-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
        <button id="obj-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-suggest-ta" class="result-area" placeholder="Mục tiêu chính: …&#10;- Mục tiêu phụ 1&#10;- Mục tiêu phụ 2"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="obj-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="obj-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-eval-ta" class="result-area" placeholder="Nhận xét theo SMART, bám PICO…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="obj-save" class="btn btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const mainEl     = rootEl.querySelector('#obj-main');

  const subInputEl = rootEl.querySelector('#obj-sub-input');
  const subAddBtn  = rootEl.querySelector('#obj-sub-add');
  const subListEl  = rootEl.querySelector('#obj-sub-list');

  const pdfEl      = rootEl.querySelector('#obj-pdf');
  const fnameEl    = rootEl.querySelector('#obj-fname');

  const saveBtn    = rootEl.querySelector('#obj-save');
  const gptBtn     = rootEl.querySelector('#obj-gpt');
  const evalBtn    = rootEl.querySelector('#obj-eval');

  const sBox   = rootEl.querySelector('#obj-suggest-box');
  const sTA    = rootEl.querySelector('#obj-suggest-ta');
  const sApply = rootEl.querySelector('#obj-apply');
  const sCopy  = rootEl.querySelector('#obj-copy-suggest');
  const sHide  = rootEl.querySelector('#obj-hide-suggest');

  const eBox   = rootEl.querySelector('#obj-eval-box');
  const eTA    = rootEl.querySelector('#obj-eval-ta');
  const eCopy  = rootEl.querySelector('#obj-copy-eval');
  const eHide  = rootEl.querySelector('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', []))
    ? ctx.get('subObjectives', [])
    : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) { eTA.value = String(oldEval); eBox.classList.remove('hidden'); }

  // ===== Sub objectives =====
  subAddBtn?.addEventListener('click', addSubObjective);
  subInputEl?.addEventListener('keydown', (e) => {
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
      subListEl.innerHTML = `<div style="opacity:.7">Chưa có mục tiêu phụ.</div>`;
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const item = document.createElement('div');
      item.className = 'list-item';

      const t = document.createElement('div');
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.className = 'controls';

      const upBtn = document.createElement('button');
      upBtn.className = 'btn btn-ghost';
      upBtn.textContent = '↑';
      upBtn.title = 'Lên';
      upBtn.onclick = () => {
        if (idx > 0) { [subObjectives[idx-1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx-1]]; renderSubList(); }
      };

      const downBtn = document.createElement('button');
      downBtn.className = 'btn btn-ghost';
      downBtn.textContent = '↓';
      downBtn.title = 'Xuống';
      downBtn.onclick = () => {
        if (idx < subObjectives.length - 1) { [subObjectives[idx+1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx+1]]; renderSubList(); }
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-ghost';
      delBtn.textContent = 'Xóa';
      delBtn.onclick = () => { subObjectives.splice(idx, 1); renderSubList(); };

      controls.append(upBtn, downBtn, delBtn);
      item.append(t, controls);
      subListEl.appendChild(item);
    });
  }

  // ===== Save =====
  saveBtn?.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu');
  });

  // ===== GPT Suggest =====
  gptBtn?.addEventListener('click', onSuggest);

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
        sTA.value = [
          parsed.main ? \`Mục tiêu chính: \${parsed.main}\` : '',
          ...(parsed.subs || []).map(x => \`- \${x}\`)
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

  // Áp dụng gợi ý
  sApply?.addEventListener('click', () => {
    const obj = parseObjectives(sTA.value);
    if (!obj) { ctx.toast('Không nhận diện được gợi ý hợp lệ.'); return; }
    if (obj.main) mainEl.value = obj.main;
    if (Array.isArray(obj.subs)) subObjectives = obj.subs.slice();
    renderSubList();
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', subObjectives);
    ctx.toast('Đã chèn gợi ý vào các ô.');
  });
  sCopy?.addEventListener('click', () => copyText(sTA.value || ''));
  sHide?.addEventListener('click', () => sBox.classList.add('hidden'));

  // ===== GPT Evaluate =====
  evalBtn?.addEventListener('click', onEvaluate);

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
${subs.length ? subs.map((s,i)=> (i+1) + '. ' + s).join('\\n') : '(chưa có)'}

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

  eCopy?.addEventListener('click', () => copyText(eTA.value || ''));
  eHide?.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Helpers =====
  function parseObjectives(text) {
    const raw = String(text || '');
    // Ưu tiên code-fence ```json
    const fenced = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;
    // JSON chuẩn {"main":"...","subs":["...","..."]}
    try {
      const j = JSON.parse(candidate);
      const main = String(j?.main || '').trim();
      const subs = Array.isArray(j?.subs) ? j.subs.map(s => String(s || '').trim()).filter(Boolean) : [];
      if (!main && subs.length === 0) return null;
      return { main, subs };
    } catch { /* ignore */ }

    // Fallback: "Mục tiêu chính: ..." + gạch đầu dòng
    const lines = candidate
      .split(/\\r?\\n/)
      .map(s => s.replace(/^\\s*[-*\\d.)]+\\s*/, '').trim())
      .filter(Boolean);

    if (lines.length === 0) return null;

    let main = '';
    const subs = [];
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const m = ln.match(/^mục\\s*tiêu\\s*chính\\s*:\\s*(.+)$/i);
      if (m) { main = m[1].trim(); continue; }
      if (!main && i === 0) { main = ln; } else { subs.push(ln); }
    }
    return { main, subs };
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
}
