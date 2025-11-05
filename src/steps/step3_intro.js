// src/steps/step3_intro.js
// Step 3 – Mở đầu (CaRS: Territory, Niche, Occupy)
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div id="intro-card" class="card">
  <div class="card-header">
    <h3 class="card-title">Mở đầu (CaRS)</h3>
    <div class="card-subtitle">
      Trình bày theo mô hình CaRS: <strong>Territory</strong> (bối cảnh/tầm quan trọng),
      <strong>Niche</strong> (khoảng trống), <strong>Occupy</strong> (cách nghiên cứu lấp khoảng trống).
    </div>
  </div>

  <style>
    /* ===== Chỉ áp dụng trong card này ===== */
    #intro-card .card-title { font-weight: 600; }
    #intro-card label { font-weight: 500; color: #111827; }

    /* Textarea chuẩn (đồng bộ Step 0–2) */
    #intro-card .form-textarea {
      width: 100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .9rem 1rem;
      outline: 0;
      transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
      min-height: 110px; resize: vertical;
    }
    #intro-card .form-textarea::placeholder { color: #9aa3af; }

    /* File input + tên file */
    #intro-card .filebar { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
    #intro-card .file-wrap { flex:1; min-width: 280px; max-width: 560px; }
    #intro-card input[type="file"] {
      width: 100%;
      font: 500 14.5px/1 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .5rem .6rem;
      background: #fff;
    }
    #intro-card input[type="file"]::file-selector-button {
      margin-right: .6rem;
      border: 1px solid var(--border);
      background: #fff;
      padding: .5rem .85rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }
    #intro-card input[type="file"]::file-selector-button:hover { background: #f9fafb; }
    #intro-card .file-note { color: var(--muted); font-size: .85rem; margin-top: 4px; }

    /* Khung kết quả GPT */
    #intro-card .section { margin-top: 12px; }
    #intro-card .result-area {
      width:100%; min-height:170px; max-height:42vh; resize:vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size:14px; line-height:1.55;
      padding:.85rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
      white-space: pre-wrap;
    }
    #intro-card .result-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #intro-card .btn-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

    /* Nút đồng bộ */
    #intro-card .btn { min-height: 38px; }

    /* Ẩn/hiện */
    .hidden { display: none !important; }
  </style>

  <div class="card-body grid-2">
    <label>Territory (Bối cảnh – tầm quan trọng)
      <textarea id="intro-territory" class="form-textarea" rows="6" placeholder="Nêu bối cảnh, tầm quan trọng, quy mô vấn đề, gánh nặng..."></textarea>
    </label>
    <label>Niche (Khoảng trống – vấn đề chưa giải quyết)
      <textarea id="intro-niche" class="form-textarea" rows="6" placeholder="Xác định lỗ hổng bằng chứng, hạn chế của nghiên cứu trước..."></textarea>
    </label>
    <label style="grid-column:1 / -1">Occupy (Cách nghiên cứu này sẽ lấp khoảng trống)
      <textarea id="intro-occupy" class="form-textarea" rows="6" placeholder="Mục tiêu/giả thuyết/chọn thiết kế – tại sao, cái gì mới, mong đợi đóng góp..."></textarea>
    </label>
  </div>

  <!-- File + nút GPT -->
  <div class="card-body filebar">
    <div class="file-wrap">
      <input id="intro-pdf" type="file" accept="application/pdf" />
      <div id="intro-fname" class="file-note">Chưa chọn tệp PDF</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button id="intro-gpt"  class="btn btn-primary"   type="button">GPT gợi ý CaRS</button>
      <button id="intro-eval" class="btn btn-secondary" type="button">GPT đánh giá CaRS</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="intro-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <button id="intro-apply" class="btn btn-primary" type="button">Chèn vào 3 ô</button>
        <button id="intro-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-suggest-ta" class="result-area" rows="10" placeholder="Territory: …&#10;&#10;Niche: …&#10;&#10;Occupy: …"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="intro-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="intro-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-eval-ta" class="result-area" rows="10" placeholder="Nhận xét mạch lạc CaRS (bullet ngắn theo tiêu chí)…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="intro-save" class="btn btn-primary" type="button">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const terrEl   = rootEl.querySelector('#intro-territory');
  const nicheEl  = rootEl.querySelector('#intro-niche');
  const occupyEl = rootEl.querySelector('#intro-occupy');

  const pdfEl    = rootEl.querySelector('#intro-pdf');
  const fnameEl  = rootEl.querySelector('#intro-fname');
  const gptBtn   = rootEl.querySelector('#intro-gpt');
  const evalBtn  = rootEl.querySelector('#intro-eval');

  const sBox   = rootEl.querySelector('#intro-suggest-box');
  const sTA    = rootEl.querySelector('#intro-suggest-ta');
  const sApply = rootEl.querySelector('#intro-apply');
  const sCopy  = rootEl.querySelector('#intro-copy-suggest');
  const sHide  = rootEl.querySelector('#intro-hide-suggest');

  const eBox   = rootEl.querySelector('#intro-eval-box');
  const eTA    = rootEl.querySelector('#intro-eval-ta');
  const eCopy  = rootEl.querySelector('#intro-copy-eval');
  const eHide  = rootEl.querySelector('#intro-hide-eval');

  const saveBtn = rootEl.querySelector('#intro-save');

  // ===== Load state =====
  const intro = ctx.get('intro', {}) || {};
  terrEl.value   = intro.territory || '';
  nicheEl.value  = intro.niche || '';
  occupyEl.value = intro.occupy || '';

  const oldEval = ctx.get('introEval', '');
  if (oldEval) { eTA.value = String(oldEval); eBox.classList.remove('hidden'); }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.toast('Đã lưu phần Mở đầu (CaRS)');
  });

  // Hiển thị tên tệp PDF
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  // ===== GPT: Gợi ý CaRS =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainOb = ctx.get('mainObjective', '') || '';
      const subObs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
        }
      }

      const prompt = `
Bạn là trợ lý học thuật soạn phần Mở đầu (CaRS) cho đề cương RCT. Dựa vào PICO, câu hỏi nghiên cứu, mục tiêu (và trích lược PDF nếu có), hãy đề xuất bộ 3 đoạn ngắn gọn:

- "territory": bối cảnh và tầm quan trọng (5–7 câu)
- "niche": khoảng trống, hạn chế của bằng chứng hiện có (4–6 câu)
- "occupy": cách nghiên cứu này lấp khoảng trống (mục tiêu/giả thuyết/thiết kế/điểm mới) (5–8 câu)

YÊU CẦU TRẢ VỀ **JSON THUẦN**:
{"territory":"...","niche":"...","occupy":"..."}

PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}

Mục tiêu:
- Chính: ${mainOb || '(chưa có)'}
- Phụ:
${subObs && subObs.length ? subObs.map((s,i)=>\`\${i+1}. \${s}\`).join('\\n') : '(chưa có)'}

Trích lược PDF (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const parsed = parseCaRS(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về CaRS hợp lệ.');
        console.warn('GPT raw reply (step3 suggest):', raw);
      } else {
        sTA.value = [
          parsed.territory ? \`Territory: \${parsed.territory}\` : '',
          parsed.niche     ? \`Niche: \${parsed.niche}\`         : '',
          parsed.occupy    ? \`Occupy: \${parsed.occupy}\`       : '',
        ].filter(Boolean).join('\\n\\n');
        sBox.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý CaRS.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý CaRS');
    }
  }

  // Áp dụng nội dung từ ô gợi ý vào 3 ô
  sApply.addEventListener('click', () => {
    const obj = parseCaRS(sTA.value);
    if (!obj) { ctx.toast('Không nhận diện được định dạng CaRS trong ô gợi ý.'); return; }
    if (obj.territory) terrEl.value = obj.territory;
    if (obj.niche)     nicheEl.value = obj.niche;
    if (obj.occupy)    occupyEl.value = obj.occupy;
    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.toast('Đã chèn gợi ý vào 3 ô.');
  });
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  // ===== GPT: Đánh giá CaRS =====
  evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const territory = (terrEl.value || '').trim();
    const niche     = (nicheEl.value || '').trim();
    const occupy    = (occupyEl.value || '').trim();
    if (!territory && !niche && !occupy) { ctx.toast('Chưa có nội dung CaRS để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainOb = ctx.get('mainObjective', '') || '';
      const subObs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const prompt = `
Bạn là biên tập viên học thuật. Hãy **đánh giá mạch lạc CaRS** (Territory–Niche–Occupy) dưới đây theo các tiêu chí: logic, liên kết với PICO và mục tiêu, tính cô đọng – rõ ràng, và gợi ý chỉnh sửa cụ thể. Trả về gạch đầu dòng ngắn gọn (không trả JSON).

Territory:
${territory || '(chưa có)'}
Niche:
${niche || '(chưa có)'}
Occupy:
${occupy || '(chưa có)'}

Tham chiếu:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
Câu hỏi: ${rq || '(chưa có)'}
Mục tiêu chính: ${mainOb || '(chưa có)'}
Mục tiêu phụ:
${subObs && subObs.length ? subObs.map((s,i)=>\`\${i+1}. \${s}\`).join('\\n') : '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const text = String(raw || '').trim();
      eTA.value = text;
      eBox.classList.remove('hidden');
      ctx.save('introEval', eTA.value);
      ctx.toast('Đã nhận đánh giá CaRS.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá CaRS');
    }
  }

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Helpers =====
  function parseCaRS(text) {
    const raw = String(text || '');
    // Ưu tiên code-fence ```json
    const fenced = raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const candidate = fenced ? fenced[1] : raw;

    // JSON {"territory":"...","niche":"...","occupy":"..."}
    try {
      const j = JSON.parse(candidate);
      const t = String(j?.territory || '').trim();
      const n = String(j?.niche || '').trim();
      const o = String(j?.occupy || '').trim();
      if (!t && !n && !o) return null;
      return { territory: t, niche: n, occupy: o };
    } catch { /* ignore */ }

    // Fallback: quét theo nhãn Territory/Niche/Occupy
    const s = candidate;
    return {
      territory: pickSection(s, /territory\\s*:\\s*/i),
      niche:     pickSection(s, /niche\\s*:\\s*/i),
      occupy:    pickSection(s, /occupy\\s*:\\s*/i),
    };
  }

  function pickSection(s, rx) {
    const m = s.match(rx);
    if (!m) return '';
    const start = m.index + m[0].length;
    const rest  = s.slice(start);
    const next  = rest.search(/(?:^|\\n)\\s*(territory|niche|occupy)\\s*:/i);
    return (next >= 0 ? rest.slice(0, next) : rest).trim();
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
