// src/steps/step0_pico.js
// Step 0 – PICO
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  // rootEl CHÍNH LÀ .card trong index → không tạo thêm .card lồng bên trong
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

    <!-- Hàng điều khiển: file + 2 nút GPT -->
    <div class="card-body control-row row-spaced">
      <input id="pico-pdf" type="file" accept="application/pdf" />
      <span class="muted" id="pico-fname">Chưa chọn tệp PDF</span>

      <button id="pico-gpt-suggest" class="btn btn-primary" type="button">GPT gợi ý PICO</button>
      <button id="pico-gpt-eval" class="btn btn-primary" type="button">GPT đánh giá PICO</button>
    </div>

    <!-- Kết quả GPT – Gợi ý -->
    <div id="pico-suggest-wrap" class="card-body" style="display:none">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="pico-apply" class="btn btn-primary" type="button">Chèn vào 4 ô</button>
          <button id="pico-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="pico-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="pico-suggest-ta" rows="8" placeholder='{"p":"...","i":"...","c":"...","o":"..."}'></textarea>
    </div>

    <!-- Kết quả GPT – Đánh giá -->
    <div id="pico-eval-wrap" class="card-body" style="display:none">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
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

  // ====== Bind DOM ======
  const pEl = document.getElementById('pico-p');
  const iEl = document.getElementById('pico-i');
  const cEl = document.getElementById('pico-c');
  const oEl = document.getElementById('pico-o');

  const pdfEl   = document.getElementById('pico-pdf');
  const fnameEl = document.getElementById('pico-fname');

  const saveEl    = document.getElementById('pico-save');
  const suggestEl = document.getElementById('pico-gpt-suggest');
  const evalEl    = document.getElementById('pico-gpt-eval');

  const sWrap = document.getElementById('pico-suggest-wrap');
  const sTA   = document.getElementById('pico-suggest-ta');
  const sApply= document.getElementById('pico-apply');
  const sCopy = document.getElementById('pico-copy-suggest');
  const sHide = document.getElementById('pico-hide-suggest');

  const eWrap = document.getElementById('pico-eval-wrap');
  const eTA   = document.getElementById('pico-eval-ta');
  const eCopy = document.getElementById('pico-copy-eval');
  const eHide = document.getElementById('pico-hide-eval');

  // ====== Load state ======
  const st = ctx.get('pico', {}) || {};
  pEl.value = st.p || '';
  iEl.value = st.i || '';
  cEl.value = st.c || '';
  oEl.value = st.o || '';

  // ====== Events ======
  saveEl.addEventListener('click', onSave);

  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  suggestEl.addEventListener('click', onSuggest);
  evalEl.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToFields);
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => (sWrap.style.display = 'none'));

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => (eWrap.style.display = 'none'));

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
      toggleBusy(suggestEl, true);
      const prompt = await buildSuggestPrompt();
      const reply  = await ctx.callGPT(prompt);
      const raw    = String(reply ?? '');

      ctx.save('debug.picoSuggestRaw', raw);

      const pico = parsePICOFromGPT(raw);
      sTA.value = (pico.p || pico.i || pico.c || pico.o)
        ? JSON.stringify(pico, null, 2)
        : raw;

      sWrap.style.display = '';
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
      toggleBusy(evalEl, true);
      const prompt = await buildEvaluatePrompt();
      const reply  = await ctx.callGPT(prompt);
      const raw    = String(reply ?? '');

      ctx.save('debug.picoEvalRaw', raw);
      eTA.value = raw;
      eWrap.style.display = '';
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
        pdfText = await ctx.extractTextFromPDF(f);
        if (pdfText.length > 5000) pdfText = pdfText.slice(0, 5000) + '\n...[cắt bớt]';
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
    try {
      navigator.clipboard?.writeText(t);
      ctx.toast('Đã sao chép.');
    } catch {
      ctx.toast('Không sao chép được.');
    }
  }

  function parsePICOFromGPT(raw) {
    if (!raw) return { p:'', i:'', c:'', o:'' };

    // Ưu tiên lấy trong ```json
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
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

    const mP = /(?:^|\n)\s*p\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(candidate);
    const mI = /(?:^|\n)\s*i\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(candidate);
    const mC = /(?:^|\n)\s*c\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(candidate);
    const mO = /(?:^|\n)\s*o\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(candidate);
    return {
      p: (mP?.[1] || '').trim(),
      i: (mI?.[1] || '').trim(),
      c: (mC?.[1] || '').trim(),
      o: (mO?.[1] || '').trim(),
    };
  }
}
