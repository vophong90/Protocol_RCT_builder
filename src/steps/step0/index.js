// src/steps/step0/index.js
// Step 0 – PICO (module hoá, per-step GPT binding)

export const id = 0;
export const title = "PICO";
export const subtitle = "Nhập trực tiếp hoặc dùng GPT từ bối cảnh/PDF";
export const css = "./public/css/steps/step0.css"; // (tuỳ chọn)

export async function mount(rootEl, ctx) {
  // Scope CSS riêng cho step 0
  const scopeEl = rootEl.closest('.step');
  scopeEl?.setAttribute('data-scope', 'step0');

  // ---- UI ----
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">PICO</h3>
      <div class="card-subtitle">Nhập trực tiếp hoặc dùng GPT để gợi ý từ bối cảnh/PDF.</div>
    </div>

    <!-- 4 ô PICO -->
    <div class="card-body grid-2">
      <label>Population (P)
        <textarea id="pico-p" rows="4" placeholder="Đối tượng nghiên cứu (vd: Người lớn béo phì đơn thuần)"></textarea>
      </label>
      <label>Intervention (I)
        <textarea id="pico-i" rows="4" placeholder="Can thiệp (vd: Cấy chỉ)"></textarea>
      </label>
      <label>Comparator (C)
        <textarea id="pico-c" rows="4" placeholder="Đối chứng (vd: Ăn kiêng/Chăm sóc chuẩn)"></textarea>
      </label>
      <label>Outcome (O)
        <textarea id="pico-o" rows="4" placeholder="Kết cục (vd: BMI, vòng eo, tỉ lệ mỡ cơ thể)"></textarea>
      </label>
    </div>

    <!-- Chọn file + 2 nút GPT -->
    <div class="card-body">
      <div class="inline-row" style="gap:12px; flex-wrap:wrap;">
        <input id="pico-pdf" type="file" accept="application/pdf" />
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button id="pico-gpt-suggest" class="btn btn-primary" type="button">GPT gợi ý PICO</button>
        <button id="pico-gpt-eval"    class="btn btn-primary" type="button">GPT đánh giá PICO</button>
      </div>
    </div>

    <!-- Kết quả GPT – Gợi ý -->
    <div id="pico-suggest-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="pico-apply" class="btn btn-primary" type="button">Chèn vào 4 ô</button>
          <button id="pico-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="pico-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="pico-suggest-ta" rows="8" placeholder='{"p":"...","i":"...","c":"...","o":"..."}'></textarea>
    </div>

    <!-- Kết quả GPT – Đánh giá -->
    <div id="pico-eval-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="pico-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="pico-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="pico-eval-ta" rows="10" placeholder="Nhận xét & gợi ý tối ưu hoá từ GPT sẽ xuất hiện tại đây..."></textarea>
    </div>

    <div class="card-footer">
      <button id="pico-save" class="btn btn-primary" type="button">Lưu</button>
    </div>
  `.trim();

  // ====== Bind DOM (ưu tiên query trong rootEl) ======
  const $ = (sel) => rootEl.querySelector(sel);

  const pEl = $('#pico-p');
  const iEl = $('#pico-i');
  const cEl = $('#pico-c');
  const oEl = $('#pico-o');

  const pdfEl   = $('#pico-pdf');

  const saveEl    = $('#pico-save');
  const suggestEl = $('#pico-gpt-suggest');
  const evalEl    = $('#pico-gpt-eval');

  const sWrap = $('#pico-suggest-wrap');
  const sTA   = $('#pico-suggest-ta');
  const sApply= $('#pico-apply');
  const sCopy = $('#pico-copy-suggest');
  const sHide = $('#pico-hide-suggest');

  const eWrap = $('#pico-eval-wrap');
  const eTA   = $('#pico-eval-ta');
  const eCopy = $('#pico-copy-eval');
  const eHide = $('#pico-hide-eval');

  // ====== Load state ======
  const st = ctx.get('pico', {}) || {};
  pEl.value = st.p || '';
  iEl.value = st.i || '';
  cEl.value = st.c || '';
  oEl.value = st.o || '';

  // ====== Events ======
  saveEl.addEventListener('click', onSave);

  // (tuỳ chọn) đặt tooltip tên file khi chọn
  pdfEl.addEventListener('change', () => {
    pdfEl.title = pdfEl.files?.[0]?.name || '';
  });

  suggestEl.addEventListener('click', onSuggest);
  evalEl.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToFields);
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sWrap.classList.add('hidden'));

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eWrap.classList.add('hidden'));

  // ====== Handlers ======
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
      toggleBusy(suggestEl, true, 'GPT gợi ý PICO');
      const prompt = await buildSuggestPrompt();
      const reply  = await callAI('step0.suggest', prompt, ctx);
      const raw    = String(reply ?? '');

      ctx.save('debug.picoSuggestRaw', raw);

      const pico = parsePICOFromGPT(raw);
      sTA.value = (pico.p || pico.i || pico.c || pico.o)
        ? JSON.stringify(pico, null, 2)
        : raw;

      sWrap.classList.remove('hidden');
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
      toggleBusy(evalEl, true, 'GPT đánh giá PICO');
      const prompt = await buildEvaluatePrompt();
      const reply  = await callAI('step0.evaluate', prompt, ctx);
      const raw    = String(reply ?? '');

      ctx.save('debug.picoEvalRaw', raw);
      eTA.value = raw;
      eWrap.classList.remove('hidden');
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

  // ====== Prompt builders ======
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
        pdfText = typeof ctx.extractTextFromPDF === 'function'
          ? await ctx.extractTextFromPDF(f)
          : await fallbackExtractTextFromPDF(f);
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

  // ====== Helpers ======
  function toggleBusy(btn, busy, labelWhenDone) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || '';
      btn.textContent = 'Đang xử lý...';
    } else {
      btn.disabled = false;
      btn.textContent = labelWhenDone || btn.dataset.prev || '';
    }
  }

  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  function parsePICOFromGPT(raw) {
    if (!raw) return { p:'', i:'', c:'', o:'' };

    // Ưu tiên lấy trong ```json
    const fenced = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;

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

  // Gọi GPT theo kiến trúc per-step binding, fallback qua ctx.callGPT nếu có
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') {
      return ctx_.callStepGPT(bindingKey, prompt);
    }
    if (typeof ctx_.callGPT === 'function') {
      // fallback: dùng callGPT cũ nếu bạn chưa bật binding
      return ctx_.callGPT(prompt);
    }
    throw new Error('Chưa cấu hình GPT binding cho step 0');
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
      out += content.items.map(it => it.str).join(' ') + '\\n';
    }
    return out.trim();
  }
}
