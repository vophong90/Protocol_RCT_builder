// src/steps/step1/index.js
// Step 1 – Câu hỏi nghiên cứu (module hoá, per-step GPT binding)

export const id = 1;
export const title = "Câu hỏi nghiên cứu";
export const subtitle = "Nhập trực tiếp hoặc dùng GPT gợi ý từ PICO/PDF";
export const css = "./public/css/steps/step1.css"; // (tuỳ chọn)

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step 1
  rootEl.closest('.step')?.setAttribute('data-scope', 'step1');

  // ---- UI ----
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Câu hỏi nghiên cứu</h3>
      <div class="card-subtitle">Bạn có thể nhập trực tiếp hoặc dùng GPT gợi ý từ PICO/PDF.</div>
    </div>

    <div class="card-body">
      <label>Câu hỏi nghiên cứu
        <textarea id="rq-text" rows="4" placeholder="Nhập một câu hỏi nghiên cứu rõ ràng, bám PICO (một câu)."></textarea>
      </label>
    </div>

    <!-- Chọn file + 2 nút GPT -->
    <div class="card-body">
      <div class="inline-row" style="gap:12px; flex-wrap:wrap;">
        <input id="rq-pdf" type="file" accept="application/pdf" />
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button id="rq-gpt"  class="btn btn-primary" type="button">GPT gợi ý câu hỏi</button>
        <button id="rq-eval" class="btn btn-secondary" type="button">GPT đánh giá câu hỏi</button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý -->
    <div id="rq-suggest-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap; align-items:center">
          <label for="rq-apply-which" style="font-weight:600">Chèn gợi ý #</label>
          <select id="rq-apply-which">
            <option value="1">1</option><option value="2">2</option><option value="3">3</option>
          </select>
          <button id="rq-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="rq-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="rq-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="rq-suggest-ta" rows="8" placeholder="1) …&#10;2) …&#10;3) …"></textarea>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ -->
    <div id="rq-eval-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="rq-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="rq-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="rq-eval-ta" rows="10" placeholder="Nhận xét & điểm theo tiêu chí sẽ xuất hiện tại đây…"></textarea>
    </div>

    <div class="card-footer">
      <button id="rq-save" class="btn btn-primary" type="button">Lưu</button>
    </div>
  `.trim();

  // ==== Elements (scope theo rootEl) ====
  const $ = (sel) => rootEl.querySelector(sel);

  const rqEl        = $('#rq-text');

  const pdfEl       = $('#rq-pdf');

  const saveBtn     = $('#rq-save');
  const gptBtn      = $('#rq-gpt');
  const evalBtn     = $('#rq-eval');

  const sWrap       = $('#rq-suggest-wrap');
  const sTA         = $('#rq-suggest-ta');
  const sApplyWhich = $('#rq-apply-which');
  const sApply      = $('#rq-apply');
  const sCopy       = $('#rq-copy-suggest');
  const sHide       = $('#rq-hide-suggest');

  const eWrap       = $('#rq-eval-wrap');
  const eTA         = $('#rq-eval-ta');
  const eCopy       = $('#rq-copy-eval');
  const eHide       = $('#rq-hide-eval');

  // Regex gạch đầu dòng an toàn Unicode
  const BULLET_RE = new RegExp("^\\s*(?:\\d+[.)]|[\\-\\u2013\\u2014\\u2022*])\\s*");

  // ==== Load state ====
  rqEl.value = ctx.get('researchQuestion', '') || '';
  const oldEval = ctx.get('researchQuestionEval', '');
  if (oldEval) { eTA.value = String(oldEval); eWrap.classList.remove('hidden'); }

  // ==== Events ====
  // Tooltip tên file (không hiện chip “chưa chọn tệp” nữa)
  pdfEl.addEventListener('change', () => {
    pdfEl.title = pdfEl.files?.[0]?.name || '';
  });

  saveBtn.addEventListener('click', () => {
    ctx.save('researchQuestion', (rqEl.value || '').trim());
    ctx.toast('Đã lưu câu hỏi nghiên cứu');
  });

  gptBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToField);
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sWrap.classList.add('hidden'));

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eWrap.classList.add('hidden'));

  // ==== Handlers ====
  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'GPT gợi ý câu hỏi');
      const pico = ctx.get('pico', {}) || {};
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

      const raw = await callAI('step1.suggest', prompt, ctx);
      const arr = parseCandidates(raw);
      if (arr.length === 0) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step1 suggest):', raw);
      } else {
        sTA.value = arr.map((x, i) => `${i + 1}) ${x}`).join('\n');
        sWrap.classList.remove('hidden');
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
      toggleBusy(evalBtn, true, 'GPT đánh giá câu hỏi');
      const pico = ctx.get('pico', {}) || {};

      // Đọc PDF (nếu có) để mô hình bám dữ liệu thật
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
          ctx.toast('Không đọc được PDF đính kèm, đánh giá sẽ không trích nguồn từ file.');
        }
      }

      const today = new Date().toISOString().slice(0,10);

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy ĐÁNH GIÁ câu hỏi nghiên cứu dưới đây theo **FINER** và **SMART**, đồng thời **trích dẫn tài liệu tham khảo CÓ THẬT** khi đưa ra nhận xét (nếu có).

YÊU CẦU NGHIÊM NGẶT VỀ NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên bài báo hoặc tác giả.
- Chỉ liệt kê tối đa 5 tài liệu mà bạn **chắc chắn ≥90%** là có thật. Ưu tiên trích từ PDF đính kèm (nếu có).
- Mỗi tài liệu phải có: Tác giả chính, năm, tiêu đề, tạp chí/sách, và **DOI hoặc PMID hoặc URL chính thức**.
- Nếu không tìm thấy nguồn phù hợp để trích dẫn, hãy viết đúng câu: **"Không tìm thấy nguồn phù hợp để trích dẫn."**

ĐỊNH DẠNG TRẢ LỜI (không trả JSON):
FINER
- Feasible: [điểm]/5 — nhận xét ngắn
- Interesting: [điểm]/5 — …
- Novel: [điểm]/5 — …
- Ethical: [điểm]/5 — …
- Relevant: [điểm]/5 — …

SMART
- Specific: [điểm]/5 — …
- Measurable: [điểm]/5 — …
- Achievable/Feasible: [điểm]/5 — …
- Relevant: [điểm]/5 — …
- Time-bound: [điểm]/5 — …

Kết luận (1–3 câu): …
Tham khảo:
1) … (DOI/PMID/URL)
2) … (DOI/PMID/URL)
(hoặc ghi: "Không tìm thấy nguồn phù hợp để trích dẫn.")

Câu hỏi nghiên cứu: "${currentQ}"
Ngày đánh giá: ${today}

PICO tham chiếu:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Tài liệu đính kèm (trích đoạn, nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await callAI('step1.evaluate', prompt, ctx);
      const text = String(raw || '').trim();
      eTA.value = text || '';
      eWrap.classList.remove('hidden');
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

  // ==== Helpers ====
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

  // Gọi GPT theo kiến trúc per-step binding, fallback qua ctx.callGPT nếu có
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') {
      return ctx_.callStepGPT(bindingKey, prompt);
    }
    if (typeof ctx_.callGPT === 'function') {
      // fallback: dùng callGPT cũ nếu bạn chưa bật binding
      return ctx_.callGPT(prompt);
    }
    throw new Error('Chưa cấu hình GPT binding cho step 1');
  }

  // Fallback đọc PDF bằng pdfjs nếu ctx chưa cung cấp
  async function fallbackExtractTextFromPDF(file, maxPages = 4) {
    const pdfjs = (globalThis.pdfjsLib || window.pdfjsLib);
    if (!pdfjs) throw new Error('pdfjsLib chưa được nạp');
    const buf = await file.arrayBuffer();
    the_pdf = await pdfjs.getDocument({ data: buf }).promise;
    const n = Math.min(the_pdf.numPages, maxPages);
    let out = '';
    for (let i = 1; i <= n; i++) {
      const page = await the_pdf.getPage(i);
      const content = await page.getTextContent();
      out += content.items.map(it => it.str).join(' ') + '\n';
    }
    return out.trim();
  }
}
