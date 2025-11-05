// src/steps/step0_pico.js
// Step 0 – PICO
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  // ===== UI =====
  rootEl.innerHTML = `
<div id="pico-card" class="card">
  <div class="card-header">
    <h3 class="card-title">PICO</h3>
    <div class="card-subtitle">Nhập trực tiếp hoặc dùng GPT để gợi ý từ bối cảnh/PDF.</div>
  </div>

  <style>
    /* ===== Chỉ áp dụng trong card này (scoped bằng #pico-card) ===== */
    #pico-card .card-title { font-weight: 600; }
    #pico-card label { font-weight: 500; color: #111827; }

    #pico-card .pico-grid { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width:1024px){ #pico-card .pico-grid { grid-template-columns: 1fr 1fr; } }

    #pico-card .form-textarea {
      width: 100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .9rem 1rem;
      outline: 0;
      transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
      min-height: 110px;
      resize: vertical;
    }
    #pico-card .form-textarea::placeholder { color: #9aa3af; }

    #pico-card .action-bar {
      display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;
      margin-top: 4px;
    }
    #pico-card .left-tools, #pico-card .right-tools { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    #pico-card .left-tools { flex: 1 1 360px; }
    #pico-card .right-tools { justify-content: flex-end; }

    /* File input full-width, kiểu đồng bộ */
    #pico-card .file-wrap { width: 100%; }
    #pico-card input[type="file"] {
      width: 100%;
      font: 500 14.5px/1 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .5rem .6rem;
      background: #fff;
    }
    #pico-card input[type="file"]::file-selector-button {
      margin-right: .6rem;
      border: 1px solid var(--border);
      background: #fff;
      padding: .5rem .85rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    #pico-card input[type="file"]::file-selector-button:hover { background: #f9fafb; }

    #pico-card .file-note {
      color: var(--muted);
      font-size: .85rem;
      margin-left: 4px;
    }

    /* Kết quả GPT */
    #pico-card .result-area {
      width:100%; min-height:170px; max-height:42vh; resize:vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 14px;
      line-height:1.55;
      padding:.85rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
      white-space: pre-wrap;
    }
    #pico-card .result-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #pico-card .btn-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    #pico-card .section { margin: 0 2px 12px; }

    /* Đồng bộ nút */
    #pico-card .btn { min-height: 38px; }
    #pico-card .btn-primary,
    #pico-card .btn-secondary,
    #pico-card .btn-ghost { font-weight: 600; }

    /* Ẩn/hiện dùng class hidden */
    .hidden { display: none !important; }
  </style>

  <!-- Fields -->
  <div class="card-body pico-grid">
    <label>Population (P)
      <textarea id="pico-p" class="form-textarea" rows="4" placeholder="Đối tượng nghiên cứu (vd: Người lớn béo phì đơn thuần)"></textarea>
    </label>
    <label>Intervention (I)
      <textarea id="pico-i" class="form-textarea" rows="4" placeholder="Can thiệp (vd: Cấy chỉ)"></textarea>
    </label>
    <label>Comparator (C)
      <textarea id="pico-c" class="form-textarea" rows="4" placeholder="Đối chứng (vd: Ăn kiêng/Chăm sóc chuẩn)"></textarea>
    </label>
    <label>Outcome (O)
      <textarea id="pico-o" class="form-textarea" rows="4" placeholder="Kết cục (vd: BMI, vòng eo, tỉ lệ mỡ cơ thể)"></textarea>
    </label>
  </div>

  <!-- Actions -->
  <div class="card-body action-bar">
    <div class="left-tools">
      <div class="file-wrap">
        <input id="pico-pdf" type="file" accept="application/pdf" />
        <div class="file-note" id="pico-fname">Chưa chọn tệp PDF</div>
      </div>
    </div>
    <div class="right-tools">
      <button id="pico-gpt-suggest" class="btn btn-primary" type="button">GPT gợi ý PICO</button>
      <button id="pico-gpt-eval" class="btn btn-secondary" type="button">GPT đánh giá PICO</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="pico-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <button id="pico-apply" class="btn btn-primary" type="button">Chèn vào 4 ô</button>
        <button id="pico-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="pico-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="pico-suggest-ta" class="result-area" placeholder='{"p":"...","i":"...","c":"...","o":"..."}'></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="pico-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="pico-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="pico-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="pico-eval-ta" class="result-area" placeholder="Nhận xét & gợi ý tối ưu hóa từ GPT sẽ xuất hiện tại đây..."></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="pico-save" class="btn btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Bind =====
  const pEl = document.getElementById('pico-p');
  const iEl = document.getElementById('pico-i');
  const cEl = document.getElementById('pico-c');
  const oEl = document.getElementById('pico-o');

  const pdfEl   = document.getElementById('pico-pdf');
  const fnameEl = document.getElementById('pico-fname');

  const saveEl    = document.getElementById('pico-save');
  const suggestEl = document.getElementById('pico-gpt-suggest');
  const evalEl    = document.getElementById('pico-gpt-eval');

  const sBox  = document.getElementById('pico-suggest-box');
  const sTA   = document.getElementById('pico-suggest-ta');
  const sApply= document.getElementById('pico-apply');
  const sCopy = document.getElementById('pico-copy-suggest');
  const sHide = document.getElementById('pico-hide-suggest');

  const eBox  = document.getElementById('pico-eval-box');
  const eTA   = document.getElementById('pico-eval-ta');
  const eCopy = document.getElementById('pico-copy-eval');
  const eHide = document.getElementById('pico-hide-eval');

  // ===== Load state =====
  const st = ctx.get('pico', {}) || {};
  pEl.value = st.p || '';
  iEl.value = st.i || '';
  cEl.value = st.c || '';
  oEl.value = st.o || '';

  // ===== Events =====
  saveEl.addEventListener('click', onSave);

  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  suggestEl.addEventListener('click', onSuggest);
  evalEl.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToFields);
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Handlers =====
  function onSave() {
    ctx.save('pico', {
      p: (pEl.value || '').trim(),
      i: (iEl.value || '').trim(),
      c: (cEl.value || '').trim(),
      o: (oEl.value || '').trim(),
    });
    ctx.toast('Đã lưu PICO');
  }

  async function onSuggest() {
    try {
      toggleBusy(suggestEl, true, 'Đang gợi ý...');
      const prompt = await buildSuggestPrompt();
      const reply  = await ctx.callGPT(prompt);
      const raw    = String(reply ?? '');

      // Lưu & render
      ctx.save('debug.picoSuggestRaw', raw);

      // Ưu tiên JSON hợp lệ → prettify; nếu không, giữ nguyên
      const pico = parsePICOFromGPT(raw);
      sTA.value = (pico.p || pico.i || pico.c || pico.o)
        ? JSON.stringify(pico, null, 2)
        : raw;

      sBox.classList.remove('hidden');
      ctx.toast('Đã nhận gợi ý từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
    } finally {
      toggleBusy(suggestEl, false, 'GPT gợi ý PICO');
    }
  }

  async function onEvaluate() {
    try {
      toggleBusy(evalEl, true, 'Đang đánh giá...');
      const prompt = await buildEvaluatePrompt();
      const reply  = await ctx.callGPT(prompt);
      const raw    = String(reply ?? '');

      ctx.save('debug.picoEvalRaw', raw);
      eTA.value = raw;         // render trực tiếp vào khung đánh giá
      eBox.classList.remove('hidden');
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(evalEl, false, 'GPT đánh giá PICO');
    }
  }

  function applySuggestionToFields() {
    const pico = parsePICOFromGPT(sTA.value || '');
    if (!(pico.p || pico.i || pico.c || pico.o)) {
      ctx.toast('Không nhận diện được JSON P/I/C/O để chèn.');
      return;
    }
    if (pico.p) pEl.value = pico.p;
    if (pico.i) iEl.value = pico.i;
    if (pico.c) cEl.value = pico.c;
    if (pico.o) oEl.value = pico.o;
    onSave();
    ctx.toast('Đã chèn kết quả GPT vào 4 ô.');
  }

  // ===== Prompt builders =====
  async function buildSuggestPrompt() {
    const current = {
      p: (pEl.value || '').trim(),
      i: (iEl.value || '').trim(),
      c: (cEl.value || '').trim(),
      o: (oEl.value || '').trim(),
    };

    let pdfText = '';
    const f = pdfEl?.files?.[0];
    if (f) {
      try {
        pdfText = await ctx.extractTextFromPDF(f);
        if (pdfText.length > 5000) pdfText = pdfText.slice(0, 5000) + '\\n...[cắt bớt]';
      } catch (e) {
        console.warn('PDF read error:', e);
        ctx.toast('Không đọc được PDF, sẽ chỉ dùng dữ liệu đã nhập.');
      }
    }

    return `
Bạn là trợ lý biên soạn đề cương RCT. Hãy đề xuất/chuẩn hóa 4 thành phần PICO (tiếng Việt, ngắn gọn).
YÊU CẦU: Chỉ trả về đúng một JSON hợp lệ: {"p":"...","i":"...","c":"...","o":"..."} – không kèm giải thích.

Thông tin hiện có:
P: ${current.p || '(chưa có)'}
I: ${current.i || '(chưa có)'}
C: ${current.c || '(chưa có)'}
O: ${current.o || '(chưa có)'}

Tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();
  }

  async function buildEvaluatePrompt() {
    const current = {
      p: (pEl.value || '').trim(),
      i: (iEl.value || '').trim(),
      c: (cEl.value || '').trim(),
      o: (oEl.value || '').trim(),
    };
    return `
Bạn là phản biện phương pháp nghiên cứu. Hãy đánh giá PICO dưới đây bằng gạch đầu dòng súc tích:
- Điểm mạnh
- Điểm cần chỉnh (riêng cho P/I/C/O)
- Gợi ý tối ưu hoá (nếu có)
Trả lời tiếng Việt, không trả JSON.

P: ${current.p || '(trống)'}
I: ${current.i || '(trống)'}
C: ${current.c || '(trống)'}
O: ${current.o || '(trống)'}
`.trim();
  }

  // ===== Helpers =====
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

  function copyText(t) {
    try {
      navigator.clipboard?.writeText(t);
      ctx.toast('Đã sao chép.');
    } catch { ctx.toast('Không sao chép được.'); }
  }

  function parsePICOFromGPT(raw) {
    if (!raw) return { p:'', i:'', c:'', o:'' };

    // Ưu tiên code-fence ```json
    const fenced = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;

    // Thử parse JSON
    try {
      const j = JSON.parse(candidate);
      if (j && typeof j === 'object') {
        return {
          p: String(j.p ?? '').trim(),
          i: String(j.i ?? '').trim(),
          c: String(j.c ?? '').trim(),
          o: String(j.o ?? '').trim(),
        };
      }
    } catch { /* ignore */ }

    // Fallback dò P:/I:/C:/O:
    const mP = /(?:^|\\n)\\s*p\\s*[:\\-]\\s*(.+?)(?=\\n[a-z]\\s*[:\\-]|\\n?$)/is.exec(candidate);
    const mI = /(?:^|\\n)\\s*i\\s*[:\\-]\\s*(.+?)(?=\\n[a-z]\\s*[:\\-]|\\n?$)/is.exec(candidate);
    const mC = /(?:^|\\n)\\s*c\\s*[:\\-]\\s*(.+?)(?=\\n[a-z]\\s*[:\\-]|\\n?$)/is.exec(candidate);
    const mO = /(?:^|\\n)\\s*o\\s*[:\\-]\\s*(.+?)(?=\\n[a-z]\\s*[:\\-]|\\n?$)/is.exec(candidate);
    return {
      p: (mP?.[1] || '').trim(),
      i: (mI?.[1] || '').trim(),
      c: (mC?.[1] || '').trim(),
      o: (mO?.[1] || '').trim(),
    };
  }
}
