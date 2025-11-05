// src/steps/step1_question.js
// Step 1 – Câu hỏi nghiên cứu
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div id="rq-card" class="card">
  <div class="card-header">
    <h3 class="card-title">Câu hỏi nghiên cứu</h3>
    <div class="card-subtitle">Bạn có thể nhập trực tiếp hoặc dùng GPT gợi ý từ PICO/PDF.</div>
  </div>

  <style>
    /* ===== Chỉ áp dụng trong card này ===== */
    #rq-card .card-title { font-weight: 600; }
    #rq-card label { font-weight: 500; color: #111827; }

    #rq-card .rq-textarea {
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
    #rq-card .rq-textarea::placeholder { color: #9aa3af; }

    #rq-card .action-bar{
      display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;
      margin-top: 4px;
    }
    #rq-card .left-tools, #rq-card .right-tools { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    #rq-card .left-tools { flex: 1 1 360px; }
    #rq-card .right-tools { justify-content:flex-end; }

    /* File input full-width, đồng bộ với Step 0 */
    #rq-card .file-wrap { width: 100%; }
    #rq-card input[type="file"] {
      width: 100%;
      font: 500 14.5px/1 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .5rem .6rem;
      background: #fff;
    }
    #rq-card input[type="file"]::file-selector-button {
      margin-right: .6rem;
      border: 1px solid var(--border);
      background: #fff;
      padding: .5rem .85rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    #rq-card input[type="file"]::file-selector-button:hover { background: #f9fafb; }
    #rq-card .file-note { color: var(--muted); font-size: .85rem; margin-left: 4px; }

    /* Kết quả GPT */
    #rq-card .result-area{
      width:100%; min-height:160px; max-height:42vh; resize:vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size: 14px;
      line-height:1.55; padding:.85rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
      white-space: pre-wrap;
    }
    #rq-card .section{margin:0 2px 12px}
    #rq-card .result-head{display:flex; align-items:center; justify-content:space-between; gap:8px}
    #rq-card .btn-row{display:flex; gap:8px; align-items:center; flex-wrap:wrap}
    #rq-card .mini{font-size:.9rem}

    /* Nút đồng bộ */
    #rq-card .btn { min-height: 38px; }

    /* Ẩn/hiện */
    .hidden { display: none !important; }
  </style>

  <!-- Ô nhập câu hỏi chính -->
  <div class="card-body">
    <textarea id="rq-text" class="rq-textarea" rows="4" placeholder="Nhập câu hỏi nghiên cứu (một câu, rõ ràng, bám PICO)"></textarea>
  </div>

  <!-- Thanh hành động: Chọn PDF + 2 nút GPT -->
  <div class="card-body action-bar">
    <div class="left-tools">
      <div class="file-wrap">
        <input id="rq-pdf" type="file" accept="application/pdf" />
        <div class="file-note" id="rq-fname">Chưa chọn tệp PDF</div>
      </div>
    </div>
    <div class="right-tools">
      <button id="rq-gpt"  class="btn btn-primary"   type="button">GPT gợi ý câu hỏi</button>
      <button id="rq-eval" class="btn btn-secondary" type="button">GPT đánh giá câu hỏi</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="rq-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <label class="mini" for="rq-apply-which">Chèn gợi ý #</label>
        <select id="rq-apply-which" class="mini">
          <option value="1">1</option><option value="2">2</option><option value="3">3</option>
        </select>
        <button id="rq-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
        <button id="rq-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="rq-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="rq-suggest-ta" class="result-area" placeholder="1) …&#10;2) …&#10;3) …"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="rq-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="rq-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="rq-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="rq-eval-ta" class="result-area" placeholder="Nhận xét & điểm theo tiêu chí sẽ xuất hiện tại đây…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="rq-save" class="btn btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const rqEl        = rootEl.querySelector('#rq-text');

  const pdfEl       = rootEl.querySelector('#rq-pdf');
  const fnameChip   = rootEl.querySelector('#rq-fname');

  const saveBtn     = rootEl.querySelector('#rq-save');
  const gptBtn      = rootEl.querySelector('#rq-gpt');
  const evalBtn     = rootEl.querySelector('#rq-eval');

  const sBox        = rootEl.querySelector('#rq-suggest-box');
  const sTA         = rootEl.querySelector('#rq-suggest-ta');
  const sApplyWhich = rootEl.querySelector('#rq-apply-which');
  const sApply      = rootEl.querySelector('#rq-apply');
  const sCopy       = rootEl.querySelector('#rq-copy-suggest');
  const sHide       = rootEl.querySelector('#rq-hide-suggest');

  const eBox        = rootEl.querySelector('#rq-eval-box');
  const eTA         = rootEl.querySelector('#rq-eval-ta');
  const eCopy       = rootEl.querySelector('#rq-copy-eval');
  const eHide       = rootEl.querySelector('#rq-hide-eval');

  // ⚠️ Chỉ 1 hằng BULLET_RE, dùng \uXXXX để tránh lỗi encoding/regex
  const BULLET_RE = new RegExp("^\\s*(?:\\d+[.)]|[\\-\\u2013\\u2014\\u2022*])\\s*");

  // ===== Load state =====
  rqEl.value = ctx.get('researchQuestion', '') || '';
  const oldEval = ctx.get('researchQuestionEval', '');
  if (oldEval) { eTA.value = String(oldEval); eBox.classList.remove('hidden'); }

  // ===== Events =====
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameChip.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  saveBtn.addEventListener('click', () => {
    ctx.save('researchQuestion', (rqEl.value || '').trim());
    ctx.toast('Đã lưu câu hỏi nghiên cứu');
  });

  gptBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToField);
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Handlers =====
  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico = ctx.get('pico', {}) || {};
      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO hiện có.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO (và tài liệu nếu có), hãy đề xuất **3 câu hỏi nghiên cứu** rõ ràng, đúng tinh thần RCT, tiếng Việt, mỗi câu một dòng, ngắn gọn.

YÊU CẦU TRẢ VỀ JSON:
{"candidates":["câu 1","câu 2","câu 3"]}

PICO hiện có:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const arr = parseCandidates(raw);
      if (arr.length === 0) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step1 suggest):', raw);
      } else {
        sTA.value = arr.map((x, i) => `${i + 1}) ${x}`).join('\n');
        sBox.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý từ GPT.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý câu hỏi');
    }
  }

  async function onEvaluate() {
    const currentQ = (rqEl.value || '').trim();
    if (!currentQ) { ctx.toast('Bạn chưa nhập câu hỏi để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico = ctx.get('pico', {}) || {};
      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy ĐÁNH GIÁ câu hỏi nghiên cứu dưới đây theo các tiêu chí và trả lời ngắn gọn bằng gạch đầu dòng (không trả JSON):
- Rõ ràng & tập trung (1–5)
- Bám PICO (1–5)
- Đo lường được (1–5)
- Khả thi & đạo đức (1–5)
- Gợi ý chỉnh sửa (1–3 câu)

Câu hỏi nghiên cứu: "${currentQ}"

PICO tham chiếu:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const text = String(raw || '').trim();
      eTA.value = text || '';
      eBox.classList.remove('hidden');
      ctx.save('researchQuestionEval', eTA.value);
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá câu hỏi');
    }
  }

  function applySuggestionToField() {
    // lấy chỉ số 1..3
    const idx = Math.max(1, Math.min(3, parseInt(sApplyWhich.value || '1', 10))) - 1;
    const lines = (sTA.value || '')
      .split(/\r?\n/)
      .map(s => s.replace(BULLET_RE, '').trim())
      .filter(Boolean);
    if (!lines[idx]) { ctx.toast('Không tìm thấy gợi ý để chèn.'); return; }
    rqEl.value = lines[idx];
    ctx.save('researchQuestion', (rqEl.value || '').trim());
    ctx.toast(`Đã chèn gợi ý #${idx + 1} vào ô câu hỏi.`);
  }

  /* ===== Helpers ===== */
  function parseCandidates(text) {
    try {
      const j = JSON.parse(String(text));
      const arr = Array.isArray(j?.candidates) ? j.candidates : [];
      return arr.map(x => String(x || '').trim()).filter(Boolean).slice(0, 3);
    } catch {}
    return String(text || '')
      .split(/\r?\n/)
      .map(s => s.replace(BULLET_RE, '').trim())
      .filter(Boolean)
      .slice(0, 3);
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
