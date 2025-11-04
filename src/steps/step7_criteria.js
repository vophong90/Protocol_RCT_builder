// src/steps/step7_criteria.js
// Step 7 – Tiêu chí vào/loại (baseline)
// - Hai khối nhập: inclusion / exclusion (mỗi dòng là 1 tiêu chí)
// - Đọc PDF để hỗ trợ trích xuất bối cảnh
// - GPT gợi ý tiêu chí dựa trên PICO + bối cảnh (JSON → đổ vào textarea)
// - GPT đánh giá tiêu chí hiện có
// - Lưu vào state.criteria { inclusion:[], exclusion:[], notes, sources }

export async function mount(root, ctx) {
  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Tiêu chí vào/loại</h3>
    <div class="card-subtitle">
      Mỗi dòng là một tiêu chí. Bạn có thể đọc PDF để lấy bối cảnh, nhờ GPT gợi ý, và lưu lại.
    </div>
  </div>

  <div class="card-body grid-3">
    <label>Tải PDF hỗ trợ
      <input id="crit-pdf" type="file" accept="application/pdf" />
    </label>
    <button id="crit-readpdf" class="btn-secondary" style="align-self:end">Đọc PDF</button>
    <div class="muted" id="crit-pdfhint" style="align-self:end">Chưa có nội dung PDF</div>
  </div>

  <div class="card-body grid-2">
    <label>Tiêu chí <b>Vào</b> (mỗi dòng 1 tiêu chí)
      <textarea id="crit-inc" rows="12" placeholder="- Tuổi 40–75
- Chẩn đoán THK gối theo ACR
- Đồng ý tham gia và ký consent"></textarea>
    </label>

    <label>Tiêu chí <b>Loại</b> (mỗi dòng 1 tiêu chí)
      <textarea id="crit-exc" rows="12" placeholder="- Phẫu thuật khớp gối gần đây
- Bệnh kèm theo nặng (suy tim, suy thận giai đoạn cuối)
- Phụ nữ có thai/cho con bú"></textarea>
    </label>
  </div>

  <div class="card-body">
    <label>Ghi chú (tuỳ chọn)
      <textarea id="crit-notes" rows="4" placeholder="Ví dụ: Quy trình sàng lọc, kiểm tra tiêu chí tại lần khám 0..."></textarea>
    </label>
  </div>

  <div class="card-footer" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="crit-suggest" class="btn-primary">GPT gợi ý tiêu chí</button>
    <button id="crit-eval" class="btn-secondary">GPT đánh giá tiêu chí hiện có</button>
    <button id="crit-save" class="btn-secondary">Lưu</button>
  </div>

  <div class="card-body" id="crit-out" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Đánh giá:</div>
    <div id="crit-out-html" class="prose"></div>
  </div>
</div>
`.trim();

  // ---- elements
  const fileEl   = root.querySelector('#crit-pdf');
  const readBtn  = root.querySelector('#crit-readpdf');
  const hintEl   = root.querySelector('#crit-pdfhint');

  const incTA    = root.querySelector('#crit-inc');
  const excTA    = root.querySelector('#crit-exc');
  const notesTA  = root.querySelector('#crit-notes');

  const suggestBtn = root.querySelector('#crit-suggest');
  const evalBtn    = root.querySelector('#crit-eval');
  const saveBtn    = root.querySelector('#crit-save');

  const outWrap = root.querySelector('#crit-out');
  const outHtml = root.querySelector('#crit-out-html');

  // ---- restore state
  const st = ctx.get('criteria', {}) || {};
  incTA.value   = Array.isArray(st.inclusion) ? st.inclusion.join('\n') : (st.inclusion || '');
  excTA.value   = Array.isArray(st.exclusion) ? st.exclusion.join('\n') : (st.exclusion || '');
  notesTA.value = st.notes || '';

  let pdfContext = st.sources || '';
  if (pdfContext && pdfContext.length > 0) {
    hintEl.textContent = `Đã nạp PDF (${pdfContext.length.toLocaleString()} ký tự)`;
  }

  // ---- helpers
  function linesToArray(s) {
    return String(s || '')
      .split(/\r?\n/)
      .map(x => x.replace(/^[\s\-•\*]+/, '').trim())
      .filter(Boolean);
  }
  function arrToText(a) {
    return (a || []).map(x => (x || '').trim()).filter(Boolean).join('\n');
  }
  function safeSlice(s, max = 10000) {
    if (!s) return '';
    return String(s).slice(0, max);
  }

  // ---- read PDF
  readBtn.addEventListener('click', async () => {
    try {
      const f = fileEl.files && fileEl.files[0];
      if (!f) { ctx.toast('Chọn một file PDF trước đã.'); return; }
      const text = await ctx.extractTextFromPDF(f);
      pdfContext = safeSlice(text, 20000); // đủ ngữ cảnh, hạn chế quá dài
      hintEl.textContent = `Đã nạp PDF (${pdfContext.length.toLocaleString()} ký tự)`;
      ctx.toast('Đã đọc PDF.');
    } catch (e) {
      console.error(e);
      ctx.toast('Không đọc được PDF.');
    }
  });

  // ---- GPT suggest
  suggestBtn.addEventListener('click', async () => {
    const pico   = ctx.get('pico', {}) || {};
    const design = ctx.get('design', {}) || {};
    const rq     = ctx.get('researchQuestion', '') || '';
    const obj    = ctx.get('mainObjective', '') || '';

    const prompt = `
Bạn là trợ lý nghiên cứu lâm sàng. Dựa vào thông tin sau, hãy GỢI Ý bộ tiêu chí vào và loại cho RCT, xuất đúng JSON:

PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Thiết kế: ${JSON.stringify(design)}
Câu hỏi NC: ${rq}
Mục tiêu chính: ${obj}

Bối cảnh trích từ PDF (nếu có, có thể bỏ qua nếu không liên quan):
"""${safeSlice(pdfContext, 6000)}"""

YÊU CẦU ĐẦU RA (JSON, không kèm giải thích):
{
  "inclusion": ["...","..."],
  "exclusion": ["...","..."]
}
`.trim();

    outWrap.style.display = '';
    outHtml.innerHTML = `<div>Đang gợi ý tiêu chí bằng GPT...</div>`;

    const raw = await ctx.callGPT(prompt);
    let inclusion = [], exclusion = [];

    try {
      const j = JSON.parse(raw);
      if (Array.isArray(j?.inclusion)) inclusion = j.inclusion.map(x => String(x||'').trim()).filter(Boolean);
      if (Array.isArray(j?.exclusion)) exclusion = j.exclusion.map(x => String(x||'').trim()).filter(Boolean);
    } catch {
      // fallback: cố gắng tách dòng khi GPT trả text
      const txt = String(raw || '');
      const incMatch = txt.match(/inclusion[^:\n]*[:\n]+([\s\S]*?)exclusion/i);
      const excMatch = txt.match(/exclusion[^:\n]*[:\n]+([\s\S]*)$/i);
      const incText = incMatch ? incMatch[1] : '';
      const excText = excMatch ? excMatch[1] : '';
      inclusion = linesToArray(incText);
      exclusion = linesToArray(excText);
    }

    if (!inclusion.length && !exclusion.length) {
      outHtml.innerHTML = `<div style="color:#b91c1c">GPT không trả về JSON hợp lệ. Bạn có thể chạy lại hoặc chỉnh tay.</div>`;
      return;
    }

    // merge đơn giản: gợi ý không ghi đè nếu user đã nhập, chỉ bổ sung phần còn thiếu
    const curInc = linesToArray(incTA.value);
    const curExc = linesToArray(excTA.value);
    const mergedInc = dedup([...curInc, ...inclusion]);
    const mergedExc = dedup([...curExc, ...exclusion]);

    incTA.value = arrToText(mergedInc);
    excTA.value = arrToText(mergedExc);

    outHtml.innerHTML = `<div>Đã chèn gợi ý vào ô tiêu chí. Hãy rà soát rồi bấm <b>Lưu</b>.</div>`;
  });

  // ---- GPT eval
  evalBtn.addEventListener('click', async () => {
    const pico   = ctx.get('pico', {}) || {};
    const design = ctx.get('design', {}) || {};
    const incArr = linesToArray(incTA.value);
    const excArr = linesToArray(excTA.value);

    if (!incArr.length && !excArr.length) {
      ctx.toast('Chưa có tiêu chí để đánh giá.');
      return;
    }

    const prompt = `
Bạn là chuyên gia RCT. Đánh giá bộ tiêu chí vào/loại sau về tính rõ ràng, loại trừ mâu thuẫn, và mức khả thi sàng lọc.
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Thiết kế: ${JSON.stringify(design)}

TIÊU CHÍ VÀO:
${incArr.map(x => '- ' + x).join('\n')}

TIÊU CHÍ LOẠI:
${excArr.map(x => '- ' + x).join('\n')}

YÊU CẦU: Trả về các mục:
1) Nhận xét tổng quát (3–6 gạch đầu dòng)
2) Mục tiêu/sàng lọc nào thiếu/bị mơ hồ
3) Gợi ý tinh chỉnh (dưới dạng danh sách)
`.trim();

    outWrap.style.display = '';
    outHtml.innerHTML = `<div>Đang đánh giá bằng GPT...</div>`;

    const res = await ctx.callGPT(prompt);
    outHtml.innerHTML = `<pre style="white-space:pre-wrap">${escapeHtml(res || '')}</pre>`;
  });

  // ---- save
  saveBtn.addEventListener('click', () => {
    const inclusion = linesToArray(incTA.value);
    const exclusion = linesToArray(excTA.value);

    ctx.save('criteria', {
      inclusion,
      exclusion,
      notes: (notesTA.value || '').trim(),
      sources: pdfContext || '',
      savedAt: new Date().toISOString(),
    });

    ctx.toast('Đã lưu tiêu chí vào/loại');
  });

  // ---- local helpers (scoped)
  function dedup(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      const k = x.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(x); }
    }
    return out;
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
}
