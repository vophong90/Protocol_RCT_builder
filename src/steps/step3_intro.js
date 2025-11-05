// src/steps/step3_intro.js
// Step 3 – Mở đầu (CaRS: Territory, Niche, Occupy)
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card" id="intro-card">
  <div class="card-header">
    <h3 class="card-title">Mở đầu (CaRS)</h3>
    <div class="card-subtitle">
      Trình bày theo mô hình CaRS: <strong>Territory</strong> (bối cảnh/tầm quan trọng),
      <strong>Niche</strong> (khoảng trống), <strong>Occupy</strong> (cách nghiên cứu lấp khoảng trống).
    </div>
  </div>

  <style>
    #intro-card .form-textarea{
      width:100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background:#fff; border:1px solid var(--border); border-radius:12px; padding:.9rem 1rem; resize:vertical;
    }
    #intro-card .hidden{ display:none !important; }
    #intro-card .grid-2{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    @media (max-width: 900px){ #intro-card .grid-2{ grid-template-columns: 1fr; } }
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
  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <div style="flex:1;min-width:280px">
      <input id="intro-pdf" type="file" accept="application/pdf" />
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
      <button id="intro-gpt"  class="btn-primary" type="button">GPT gợi ý CaRS</button>
      <button id="intro-eval" class="btn-primary" type="button">GPT đánh giá CaRS</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="intro-suggest-box" class="card hidden" style="margin-top:12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="intro-apply" class="btn-primary" type="button">Chèn vào 3 ô</button>
        <button id="intro-copy-suggest" class="btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-suggest" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-suggest-ta" class="form-textarea" rows="10" placeholder="Territory: …&#10;&#10;Niche: …&#10;&#10;Occupy: …"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="intro-eval-box" class="card hidden" style="margin-top:12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;gap:8px">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px;align-items:center">
        <button id="intro-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-eval-ta" class="form-textarea" rows="10" placeholder="Nhận xét mạch lạc CaRS (bullet ngắn theo tiêu chí)…"></textarea>
    </div>
  </div>

  <div class="card-footer">
    <button id="intro-save" class="btn-primary" type="button">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const terrEl   = rootEl.querySelector('#intro-territory');
  const nicheEl  = rootEl.querySelector('#intro-niche');
  const occupyEl = rootEl.querySelector('#intro-occupy');

  const pdfEl    = rootEl.querySelector('#intro-pdf');
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

  // ===== GPT: Gợi ý CaRS =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainOb = ctx.get('mainObjective', '') || '';
      const subObsArr = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const subListStr = (subObsArr && subObsArr.length)
        ? subObsArr.map((s,i)=> (i+1) + '. ' + s).join('\n')
        : '(chua co)';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\n...[cat bot]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
        }
      }

      // Dùng chuỗi ASCII để tránh ký tự vô hình
      const prompt =
        'Ban la tro ly hoc thuat soan phan Mo dau (CaRS) cho de cuong RCT. Dua vao PICO, cau hoi nghien cuu, muc tieu (va trich luoc PDF neu co), hay de xuat bo 3 doan ngan gon:\n' +
        '- "territory": boi canh va tam quan trong (5–7 cau)\n' +
        '- "niche": khoang trong, han che cua bang chung hien co (4–6 cau)\n' +
        '- "occupy": cach nghien cuu nay lap khoang trong (muc tieu/gia thuyet/thiet ke/diem moi) (5–8 cau)\n\n' +
        'YEU CAU TRA VE JSON THUAN:\n' +
        '{"territory":"...","niche":"...","occupy":"..."}\n\n' +
        'PICO:\n' +
        'P: ' + (pico.p || '(chua co)') + '\n' +
        'I: ' + (pico.i || '(chua co)') + '\n' +
        'C: ' + (pico.c || '(chua co)') + '\n' +
        'O: ' + (pico.o || '(chua co)') + '\n\n' +
        'Cau hoi nghien cuu:\n' + (rq || '(chua co)') + '\n\n' +
        'Muc tieu:\n' +
        '- Chinh: ' + (mainOb || '(chua co)') + '\n' +
        '- Phu:\n' + subListStr + '\n\n' +
        'Trich luoc PDF (neu co):\n' + (pdfText || '(khong co)');

      const raw = await ctx.callGPT(prompt);
      const parsed = parseCaRS(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về CaRS hợp lệ.');
        console.warn('GPT raw reply (step3 suggest):', raw);
      } else {
        const out = [];
        if (parsed.territory) out.push('Territory: ' + parsed.territory);
        if (parsed.niche)     out.push('Niche: ' + parsed.niche);
        if (parsed.occupy)    out.push('Occupy: ' + parsed.occupy);
        sTA.value = out.join('\n\n');
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
      const subObsArr = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const subListStr = (subObsArr && subObsArr.length)
        ? subObsArr.map((s,i)=> (i+1) + '. ' + s).join('\n')
        : '(chua co)';

      const prompt =
        'Ban la bien tap vien hoc thuat. Hay DANH GIA mach lac CaRS (Territory–Niche–Occupy) duoi day theo cac tieu chi: logic, lien ket voi PICO va muc tieu, tinh co dong – ro rang, va goi y chinh sua cu the. Tra ve gach dau dong ngan gon (khong tra JSON).\n\n' +
        'Territory:\n' + (territory || '(chua co)') + '\n' +
        'Niche:\n' + (niche || '(chua co)') + '\n' +
        'Occupy:\n' + (occupy || '(chua co)') + '\n\n' +
        'Tham chieu:\n' +
        'P: ' + (pico.p || '(chua co)') + '\n' +
        'I: ' + (pico.i || '(chua co)') + '\n' +
        'C: ' + (pico.c || '(chua co)') + '\n' +
        'O: ' + (pico.o || '(chua co)') + '\n' +
        'Cau hoi: ' + (rq || '(chua co)') + '\n' +
        'Muc tieu chinh: ' + (mainOb || '(chua co)') + '\n' +
        'Muc tieu phu:\n' + subListStr;

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
    // Ưu tiên JSON {"territory": "...", "niche":"...", "occupy":"..."}
    try {
      const j = JSON.parse(String(text));
      const t = String(j && j.territory || '').trim();
      const n = String(j && j.niche || '').trim();
      const o = String(j && j.occupy || '').trim();
      if (!t && !n && !o) return null;
      return { territory: t, niche: n, occupy: o };
    } catch (_) {
      // Fallback: đọc từ textarea theo nhãn
      const s = String(text || '');
      return {
        territory: pickSection(s, /territory\\s*:\\s*/i),
        niche:     pickSection(s, /niche\\s*:\\s*/i),
        occupy:    pickSection(s, /occupy\\s*:\\s*/i),
      };
    }
  }
  function pickSection(s, rx) {
    const m = s.match(rx); if (!m) return '';
    const start = m.index + m[0].length;
    const rest  = s.slice(start);
    const next  = rest.search(/(?:territory|niche|occupy)\\s*:/i);
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
