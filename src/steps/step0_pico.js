// src/steps/step0_pico.js
// Step 0 – PICO
// Yêu cầu context (ctx):
// - ctx.get(key, def), ctx.save(key, val), ctx.toast(msg)
// - ctx.callGPT(prompt)  -> backend gpt.php cần đọc {action:"chat", prompt}
// - ctx.extractTextFromPDF(file)
// - ctx.downloadJSON(name, obj) (optional)

export async function mount(rootEl, ctx) {
  // ---------- UI ----------
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">PICO</h3>
    <div class="card-subtitle">Nhập trực tiếp hoặc dùng GPT để gợi ý từ bối cảnh/PDF.</div>
  </div>

  <div class="card-body grid-2">
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

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <!-- File input (skinned) -->
    <input id="pico-pdf" type="file" accept="application/pdf" style="position:absolute;opacity:0;pointer-events:none;width:0;height:0" />
    <button id="pico-choose" class="btn-outline" type="button">Chọn PDF</button>
    <span id="pico-fname" class="muted">Chưa chọn</span>

    <div style="flex:1"></div>

    <button id="pico-gpt-suggest" class="btn-primary" type="button">GPT Gợi ý PICO</button>
    <button id="pico-gpt-eval" class="btn-outline" type="button">GPT Đánh giá PICO</button>
  </div>

  <!-- KẾT QUẢ GPT – GỢI Ý -->
  <div id="pico-suggest-box" class="card muted hidden" style="margin:0 16px 12px;">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px">
        <button id="pico-apply" class="btn-primary" type="button">Chèn vào 4 ô</button>
        <button id="pico-copy-suggest" class="btn-ghost" type="button">Sao chép</button>
        <button id="pico-hide-suggest" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <pre id="pico-suggest-pre" style="white-space:pre-wrap;max-height:40vh;overflow:auto;margin:0"></pre>
    </div>
  </div>

  <!-- KẾT QUẢ GPT – ĐÁNH GIÁ -->
  <div id="pico-eval-box" class="card muted hidden" style="margin:0 16px 12px;">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px">
        <button id="pico-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="pico-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <pre id="pico-eval-pre" style="white-space:pre-wrap;max-height:40vh;overflow:auto;margin:0"></pre>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="pico-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ---------- Bind ----------
  const pEl   = document.getElementById('pico-p');
  const iEl   = document.getElementById('pico-i');
  const cEl   = document.getElementById('pico-c');
  const oEl   = document.getElementById('pico-o');

  const pdfEl    = document.getElementById('pico-pdf');
  const chooseEl = document.getElementById('pico-choose');
  const fnameEl  = document.getElementById('pico-fname');

  const saveEl     = document.getElementById('pico-save');
  const suggestEl  = document.getElementById('pico-gpt-suggest');
  const evalEl     = document.getElementById('pico-gpt-eval');

  const sBox   = document.getElementById('pico-suggest-box');
  const sPre   = document.getElementById('pico-suggest-pre');
  const sApply = document.getElementById('pico-apply');
  const sCopy  = document.getElementById('pico-copy-suggest');
  const sHide  = document.getElementById('pico-hide-suggest');

  const eBox   = document.getElementById('pico-eval-box');
  const ePre   = document.getElementById('pico-eval-pre');
  const eCopy  = document.getElementById('pico-copy-eval');
  const eHide  = document.getElementById('pico-hide-eval');

  // ---------- Load state ----------
  const st = ctx.get('pico', {}) || {};
  pEl.value = st.p || '';
  iEl.value = st.i || '';
  cEl.value = st.c || '';
  oEl.value = st.o || '';

  // ---------- Events ----------
  saveEl.addEventListener('click', onSave);

  chooseEl.addEventListener('click', () => pdfEl.click());
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn';
  });

  suggestEl.addEventListener('click', onSuggest);
  evalEl.addEventListener('click', onEvaluate);

  sApply.addEventListener('click', applySuggestionToFields);
  sCopy.addEventListener('click', () => copyText(sPre.textContent || ''));
  sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  eCopy.addEventListener('click', () => copyText(ePre.textContent || ''));
  eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ---------- Handlers ----------
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

      // Lưu và hiển thị xem trước
      const text = String(reply ?? '');
      ctx.save('debug.picoSuggestRaw', text);
      sPre.textContent = text;
      sBox.classList.remove('hidden');

      // Nếu parse được JSON → cũng điền nháp vào fields (không ép buộc)
      const pico = parsePICOFromGPT(text);
      if (pico.p || pico.i || pico.c || pico.o) {
        // hiển thị JSON format đẹp trong preview
        sPre.textContent = JSON.stringify(pico, null, 2);
      } else {
        ctx.toast('GPT trả về không đúng JSON P/I/C/O. Xem “Kết quả GPT – Gợi ý”.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
    } finally {
      toggleBusy(suggestEl, false, 'GPT Gợi ý PICO');
    }
  }

  async function onEvaluate() {
    try {
      toggleBusy(evalEl, true, 'Đang đánh giá...');
      const prompt = await buildEvaluatePrompt();
      const reply  = await ctx.callGPT(prompt);

      const text = String(reply ?? '');
      ctx.save('debug.picoEvalRaw', text);
      ePre.textContent = text;
      eBox.classList.remove('hidden');

      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(evalEl, false, 'GPT Đánh giá PICO');
    }
  }

  function applySuggestionToFields() {
    const text = sPre.textContent || '';
    const pico = parsePICOFromGPT(text);
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

  // ---------- Prompt builders ----------
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
YÊU CẦU ĐẦU RA: TRẢ VỀ CHỈ MỘT ĐỐI TƯỢNG JSON HỢP LỆ, không kèm giải thích:
{"p":"...","i":"...","c":"...","o":"..."}

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
Bạn là phản biện phương pháp nghiên cứu. Hãy đánh giá PICO dưới đây theo gạch đầu dòng súc tích:
- Điểm mạnh
- Điểm cần chỉnh (cụ thể từng thành phần P/I/C/O)
- Gợi ý tối ưu hóa (nếu có)
Trả lời bằng tiếng Việt, không trả JSON.

P: ${current.p || '(trống)'}
I: ${current.i || '(trống)'}
C: ${current.c || '(trống)'}
O: ${current.o || '(trống)'}
`.trim();
  }

  // ---------- Helpers ----------
  function toggleBusy(btn, busy, textWhenDone) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset._prev = btn.textContent || '';
      btn.textContent = 'Đang xử lý...';
    } else {
      btn.disabled = false;
      btn.textContent = textWhenDone || btn.dataset._prev || '';
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

    // Nếu có code fence ```json ... ```
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
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
