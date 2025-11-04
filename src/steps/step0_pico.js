// src/steps/step0_pico.js
// Mỗi step export hàm mount(el, ctx)
// - ctx.get, ctx.save, ctx.toast
// - ctx.callGPT(prompt)  -> gọi endpoint GPT custom
// - ctx.extractTextFromPDF(file) -> đọc PDF thành text
// - ctx.downloadJSON(name, obj) (nếu cần)

export async function mount(rootEl, ctx) {
  // ---- UI ----
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">PICO</h3>
    <div class="card-subtitle">Nhập trực tiếp hoặc dùng GPT để gợi ý từ bối cảnh/PDF.</div>
  </div>

  <div class="card-body grid-2">
    <label>Population (P)
      <textarea id="pico-p" rows="3" placeholder="Đối tượng nghiên cứu"></textarea>
    </label>
    <label>Intervention (I)
      <textarea id="pico-i" rows="3" placeholder="Can thiệp"></textarea>
    </label>
    <label>Comparator (C)
      <textarea id="pico-c" rows="3" placeholder="Đối chứng"></textarea>
    </label>
    <label>Outcome (O)
      <textarea id="pico-o" rows="3" placeholder="Kết cục"></textarea>
    </label>
  </div>

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input id="pico-pdf" type="file" accept="application/pdf" />
    <button id="pico-gpt" class="btn-outline">GPT gợi ý PICO (từ bối cảnh/PDF)</button>
    <small id="pico-gpt-hint" style="opacity:.8">Tùy chọn: chọn PDF (bài báo/đề cương) trước khi bấm GPT.</small>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="pico-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ---- Bind elements ----
  const pEl   = document.getElementById('pico-p');
  const iEl   = document.getElementById('pico-i');
  const cEl   = document.getElementById('pico-c');
  const oEl   = document.getElementById('pico-o');
  const pdfEl = document.getElementById('pico-pdf');
  const gptEl = document.getElementById('pico-gpt');
  const saveEl= document.getElementById('pico-save');

  // ---- Load state ----
  const st = ctx.get('pico', {});
  pEl.value = st.p || '';
  iEl.value = st.i || '';
  cEl.value = st.c || '';
  oEl.value = st.o || '';

  // ---- Save handler ----
  saveEl.addEventListener('click', () => {
    ctx.save('pico', {
      p: (pEl.value || '').trim(),
      i: (iEl.value || '').trim(),
      c: (cEl.value || '').trim(),
      o: (oEl.value || '').trim(),
    });
    ctx.toast('Đã lưu PICO');
  });

  // ---- GPT helper: build prompt ----
  async function buildPromptFromInputsAndPDF() {
    const current = {
      p: (pEl.value || '').trim(),
      i: (iEl.value || '').trim(),
      c: (cEl.value || '').trim(),
      o: (oEl.value || '').trim(),
    };

    let pdfText = '';
    const file = pdfEl?.files?.[0];
    if (file) {
      try {
        pdfText = await ctx.extractTextFromPDF(file);
        // Cắt gọn tránh prompt quá dài
        if (pdfText.length > 5000) pdfText = pdfText.slice(0, 5000) + '\n...[cắt bớt]';
      } catch (e) {
        console.error('PDF read error:', e);
        ctx.toast('Không đọc được PDF, sẽ chỉ dùng dữ liệu hiện có.');
      }
    }

    // Prompt chuẩn: yêu cầu trả JSON p,i,c,o
    const prompt = `
Bạn là trợ lý biên soạn đề cương RCT. Hãy đề xuất/hoàn thiện 4 thành phần PICO ngắn gọn, rõ ràng bằng tiếng Việt.
Nếu "Thông tin hiện có" đã điền, bạn chuẩn hóa và tối ưu lại (không bịa thêm). Nếu trống, bạn suy luận hợp lý dựa trên "Tài liệu" (nếu có).

YÊU CẦU:
- Trả về đúng JSON với 4 khóa: "p", "i", "c", "o".
- Mỗi khóa là 1-3 câu, súc tích.

Thông tin hiện có:
P: ${current.p || '(chưa có)'}
I: ${current.i || '(chưa có)'}
C: ${current.c || '(chưa có)'}
O: ${current.o || '(chưa có)'}

Tài liệu (nếu có, có thể trích ý chính):
${pdfText || '(không có)'}

Trả về JSON đúng cú pháp: {"p":"...","i":"...","c":"...","o":"..."}.
`.trim();

    return prompt;
  }

  // ---- Parse JSON từ kết quả GPT (có fallback) ----
  function parsePICOFromGPT(text) {
    // Thử parse JSON trực tiếp
    try {
      const j = JSON.parse(text);
      if (j && typeof j === 'object') {
        const out = {
          p: String(j.p ?? '').trim(),
          i: String(j.i ?? '').trim(),
          c: String(j.c ?? '').trim(),
          o: String(j.o ?? '').trim(),
        };
        const ok = out.p || out.i || out.c || out.o;
        if (ok) return out;
      }
    } catch (_) { /* ignore */ }

    // Fallback đơn giản: tìm dòng bắt đầu P:/I:/C:/O:
    const mP = /(?:^|\n)\s*p\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(text);
    const mI = /(?:^|\n)\s*i\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(text);
    const mC = /(?:^|\n)\s*c\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(text);
    const mO = /(?:^|\n)\s*o\s*[:\-]\s*(.+?)(?=\n[a-z]\s*[:\-]|\n?$)/is.exec(text);
    return {
      p: (mP?.[1] || '').trim(),
      i: (mI?.[1] || '').trim(),
      c: (mC?.[1] || '').trim(),
      o: (mO?.[1] || '').trim(),
    };
  }

  // ---- GPT button ----
  gptEl.addEventListener('click', async () => {
    try {
      gptEl.disabled = true;
      const prevTxt = gptEl.textContent;
      gptEl.textContent = 'Đang gọi GPT...';

      const prompt = await buildPromptFromInputsAndPDF();
      const reply  = await ctx.callGPT(prompt);
      const pico   = parsePICOFromGPT(String(reply || ''));

      // Cập nhật UI nếu có nội dung
      if (pico.p || pico.i || pico.c || pico.o) {
        if (pico.p) pEl.value = pico.p;
        if (pico.i) iEl.value = pico.i;
        if (pico.c) cEl.value = pico.c;
        if (pico.o) oEl.value = pico.o;

        // Lưu ngay
        ctx.save('pico', {
          p: (pEl.value || '').trim(),
          i: (iEl.value || '').trim(),
          c: (cEl.value || '').trim(),
          o: (oEl.value || '').trim(),
        });
        ctx.toast('Đã cập nhật PICO từ GPT');
      } else {
        ctx.toast('GPT không trả về cấu trúc mong muốn. Kiểm tra console.');
        console.warn('GPT raw reply:', reply);
      }

      gptEl.textContent = prevTxt;
      gptEl.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
      gptEl.disabled = false;
      gptEl.textContent = 'GPT gợi ý PICO (từ bối cảnh/PDF)';
    }
  });
}
