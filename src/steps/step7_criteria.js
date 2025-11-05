// src/steps/step7_criteria.js
// Step 7 – Tiêu chí vào/loại (aligned with new index.html)
// - Không tạo .card mới (rootEl đã là .card)
// - File input full-width (form-input), cụm GPT có 2 box (Gợi ý / Đánh giá) với copy/hide
// - Lưu: state.criteria { inclusion:[], exclusion:[], notes, sources, evaluation? }

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Tiêu chí vào/loại</h3>
      <div class="card-subtitle">
        Mỗi dòng là một tiêu chí. Có thể đọc PDF để lấy bối cảnh, nhờ GPT gợi ý, và lưu lại.
      </div>
    </div>

    <style>
      /* Scoped helpers */
      #crit .hidden { display: none !important; }
      #crit .inline-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
      #crit .form-input {
        width: 100%;
        font: 500 15px/1.4 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
        background: #fff;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: .6rem .75rem;
        outline: 0;
      }
      #crit .grid-3 { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; }
      #crit .grid-2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
      @media (max-width: 1100px){ #crit .grid-3{ grid-template-columns: repeat(2, minmax(0,1fr)); } }
      @media (max-width: 780px){ #crit .grid-3, #crit .grid-2{ grid-template-columns: 1fr; } }
    </style>

    <div id="crit">
      <!-- PDF helper -->
      <div class="card-body grid-3">
        <label>Tải PDF hỗ trợ
          <input id="crit-pdf" class="form-input" type="file" accept="application/pdf" />
        </label>
        <button id="crit-readpdf" class="btn-secondary" style="align-self:end">Đọc PDF</button>
        <div class="muted" id="crit-pdfhint" style="align-self:end">Chưa có nội dung PDF</div>
      </div>

      <!-- Inclusion / Exclusion -->
      <div class="card-body grid-2">
        <label>Tiêu chí <b>Vào</b> (mỗi dòng 1 tiêu chí)
          <textarea id="crit-inc" class="form-input" rows="12" placeholder="- Tuổi 40–75
- Chẩn đoán THK gối theo ACR
- Đồng ý tham gia và ký consent"></textarea>
        </label>

        <label>Tiêu chí <b>Loại</b> (mỗi dòng 1 tiêu chí)
          <textarea id="crit-exc" class="form-input" rows="12" placeholder="- Phẫu thuật khớp gối gần đây
- Bệnh kèm theo nặng (suy tim, suy thận giai đoạn cuối)
- Phụ nữ có thai/cho con bú"></textarea>
        </label>
      </div>

      <!-- Notes -->
      <div class="card-body">
        <label>Ghi chú (tuỳ chọn)
          <textarea id="crit-notes" class="form-input" rows="4" placeholder="Ví dụ: Quy trình sàng lọc, kiểm tra tiêu chí tại lần khám 0..."></textarea>
        </label>
      </div>

      <!-- GPT buttons -->
      <div class="card-body inline-row">
        <button id="crit-suggest" class="btn-primary" type="button">GPT gợi ý tiêu chí</button>
        <button id="crit-eval"    class="btn-primary" type="button">GPT đánh giá tiêu chí hiện có</button>
        <button id="crit-save"    class="btn-secondary" type="button">Lưu</button>
      </div>

      <!-- GPT Suggest Box -->
      <div id="crit-sugg-box" class="card hidden" style="margin:0 16px 12px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <strong>Kết quả GPT – Gợi ý tiêu chí</strong>
          <div class="inline-row">
            <button id="crit-apply-sugg" class="btn-primary" type="button">Áp dụng JSON vào ô</button>
            <button id="crit-copy-sugg"  class="btn-ghost"   type="button">Sao chép</button>
            <button id="crit-hide-sugg"  class="btn-ghost"   type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="crit-sugg-ta" class="form-input" rows="10" placeholder='{"inclusion":["..."],"exclusion":["..."]}'></textarea>
          <div class="muted">Kiểm tra JSON trước khi bấm “Áp dụng”.</div>
        </div>
      </div>

      <!-- GPT Evaluation Box -->
      <div id="crit-eval-box" class="card hidden" style="margin:0 16px 12px">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <strong>Kết quả GPT – Đánh giá tiêu chí</strong>
          <div class="inline-row">
            <button id="crit-copy-eval" class="btn-ghost" type="button">Sao chép</button>
            <button id="crit-hide-eval" class="btn-ghost" type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="crit-eval-ta" class="form-input" rows="10" placeholder="Nhận xét tổng quát, điểm thiếu/mơ hồ, gợi ý tinh chỉnh..."></textarea>
        </div>
      </div>
    </div>
  `.trim();

  // --- elements
  const fileEl   = rootEl.querySelector('#crit-pdf');
  const readBtn  = rootEl.querySelector('#crit-readpdf');
  const hintEl   = rootEl.querySelector('#crit-pdfhint');

  const incTA    = rootEl.querySelector('#crit-inc');
  const excTA    = rootEl.querySelector('#crit-exc');
  const notesTA  = rootEl.querySelector('#crit-notes');

  const suggestBtn = rootEl.querySelector('#crit-suggest');
  const evalBtn    = rootEl.querySelector('#crit-eval');
  const saveBtn    = rootEl.querySelector('#crit-save');

  const suggBox  = rootEl.querySelector('#crit-sugg-box');
  const sTA      = rootEl.querySelector('#crit-sugg-ta');
  const applySugg = rootEl.querySelector('#crit-apply-sugg');
  const copySugg = rootEl.querySelector('#crit-copy-sugg');
  const hideSugg = rootEl.querySelector('#crit-hide-sugg');

  const evalBox  = rootEl.querySelector('#crit-eval-box');
  const eTA      = rootEl.querySelector('#crit-eval-ta');
  const copyEval = rootEl.querySelector('#crit-copy-eval');
  const hideEval = rootEl.querySelector('#crit-hide-eval');

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
  function dedup(arr) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      const k = x.toLowerCase();
      if (!seen.has(k)) { seen.add(k); out.push(x); }
    }
    return out;
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

  // ---- read PDF
  readBtn.addEventListener('click', async () => {
    try {
      const f = fileEl.files && fileEl.files[0];
      if (!f) { ctx.toast('Chọn một file PDF trước đã.'); return; }
      const text = await ctx.extractTextFromPDF(f);
      pdfContext = safeSlice(text, 20000);
      hintEl.textContent = `Đã nạp PDF (${pdfContext.length.toLocaleString()} ký tự)`;
      ctx.toast('Đã đọc PDF.');
    } catch (e) {
      console.error(e);
      ctx.toast('Không đọc được PDF.');
    }
  });

  // ---- GPT suggest
  suggestBtn.addEventListener('click', async () => {
    try {
      toggleBusy(suggestBtn, true, 'GPT gợi ý tiêu chí');

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
}`.trim();

      const raw = await ctx.callGPT(prompt);
      const txt = String(raw || '').trim();
      if (!txt) { ctx.toast('GPT không trả về nội dung.'); return; }

      sTA.value = txt;
      suggBox.classList.remove('hidden');
      ctx.toast('Đã nhận gợi ý JSON.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
    } finally {
      toggleBusy(suggestBtn, false, 'GPT gợi ý tiêu chí');
    }
  });

  // Áp dụng JSON gợi ý vào 2 ô
  applySugg?.addEventListener('click', () => {
    try {
      const raw = sTA.value || '';
      const j = JSON.parse(raw);
      let inclusion = Array.isArray(j?.inclusion) ? j.inclusion.map(x => String(x||'').trim()).filter(Boolean) : [];
      let exclusion = Array.isArray(j?.exclusion) ? j.exclusion.map(x => String(x||'').trim()).filter(Boolean) : [];

      const curInc = linesToArray(incTA.value);
      const curExc = linesToArray(excTA.value);
      incTA.value = arrToText(dedup([...curInc, ...inclusion]));
      excTA.value = arrToText(dedup([...curExc, ...exclusion]));
      ctx.toast('Đã áp dụng JSON vào ô tiêu chí.');
    } catch {
      ctx.toast('JSON không hợp lệ. Hãy kiểm tra lại nội dung.');
    }
  });

  copySugg?.addEventListener('click', () => copyText(sTA.value || ''));
  hideSugg?.addEventListener('click', () => suggBox.classList.add('hidden'));

  // ---- GPT eval
  evalBtn.addEventListener('click', async () => {
    try {
      toggleBusy(evalBtn, true, 'GPT đánh giá');

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
3) Gợi ý tinh chỉnh (dưới dạng danh sách)`.trim();

      const res = await ctx.callGPT(prompt);
      const text = String(res || '').trim();
      if (!text) { ctx.toast('GPT không trả về đánh giá.'); return; }

      eTA.value = text;
      evalBox.classList.remove('hidden');
      ctx.save('criteria.evaluation', text);
      ctx.toast('Đã nhận đánh giá tiêu chí.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá tiêu chí hiện có');
    }
  });

  copyEval?.addEventListener('click', () => copyText(eTA.value || ''));
  hideEval?.addEventListener('click', () => evalBox.classList.add('hidden'));

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
}
