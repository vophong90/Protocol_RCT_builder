// src/steps/step3_intro.js
// Step 3 – Mở đầu (CaRS: Territory, Niche, Occupy)
// Yêu cầu ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Mở đầu (CaRS)</h3>
    <div class="card-subtitle">
      Trình bày theo mô hình CaRS: <strong>Territory</strong> (bối cảnh/tầm quan trọng),
      <strong>Niche</strong> (khoảng trống), <strong>Occupy</strong> (cách nghiên cứu lấp khoảng trống).
    </div>
  </div>

  <style>
    .intro-textarea{
      width:100%; font:inherit; line-height:1.55;
      padding:.9rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
    }
    .action-bar{display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap}
    .left-tools,.right-tools{display:flex; gap:8px; align-items:center; flex-wrap:wrap}
    .section{margin:0 16px 12px}
    .result-head{display:flex; align-items:center; justify-content:space-between; gap:8px}
    .btn-row{display:flex; gap:8px; align-items:center}
    .result-area{
      width:100%; min-height:180px; max-height:42vh; resize:vertical;
      font:inherit; line-height:1.55; padding:.85rem 1rem;
      border:1px solid var(--border); border-radius:12px; background:#fff;
    }
  </style>

  <div class="card-body grid-2">
    <label>Territory (Bối cảnh – tầm quan trọng)
      <textarea id="intro-territory" class="intro-textarea" rows="6" placeholder="Nêu bối cảnh, tầm quan trọng, quy mô vấn đề, gánh nặng..."></textarea>
    </label>
    <label>Niche (Khoảng trống – vấn đề chưa giải quyết)
      <textarea id="intro-niche" class="intro-textarea" rows="6" placeholder="Xác định lỗ hổng bằng chứng, hạn chế của nghiên cứu trước..."></textarea>
    </label>
    <label style="grid-column:1 / -1">Occupy (Cách nghiên cứu này sẽ lấp khoảng trống)
      <textarea id="intro-occupy" class="intro-textarea" rows="6" placeholder="Mục tiêu/giả thuyết/chọn thiết kế – tại sao, cái gì mới, mong đợi đóng góp..."></textarea>
    </label>
  </div>

  <!-- Giữ nguyên file input (KHÔNG can thiệp giao diện) -->
  <div class="card-body action-bar">
    <div class="left-tools">
      <input id="intro-pdf" type="file" accept="application/pdf" />
    </div>
    <div class="right-tools">
      <button id="intro-gpt"  class="btn-primary" type="button">GPT gợi ý CaRS</button>
      <button id="intro-eval" class="btn-outline" type="button">GPT đánh giá CaRS</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý (ô text riêng) -->
  <div id="intro-suggest-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div class="btn-row">
        <button id="intro-apply" class="btn-primary" type="button">Chèn vào 3 ô</button>
        <button id="intro-copy-suggest" class="btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-suggest" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-suggest-ta" class="result-area" placeholder="Territory: …&#10;&#10;Niche: …&#10;&#10;Occupy: …"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ (ô text riêng) -->
  <div id="intro-eval-box" class="card section hidden">
    <div class="card-header result-head">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div class="btn-row">
        <button id="intro-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="intro-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="intro-eval-ta" class="result-area" placeholder="Nhận xét mạch lạc CaRS (bullet ngắn theo tiêu chí)…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="intro-save" class="btn-primary">Lưu</button>
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
          parsed.territory ? `Territory: ${parsed.territory}` : '',
          parsed.niche     ? `Niche: ${parsed.niche}`         : '',
          parsed.occupy    ? `Occupy: ${parsed.occupy}`       : '',
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

  // Áp dụng nội dung từ ô gợi ý vào 3 ô Territory/Niche/Occupy
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
    // Ưu tiên JSON {"territory": "...", "niche":"...", "occupy":"..."}
    try {
      const j = JSON.parse(String(text));
      const t = String(j?.territory || '').trim();
      const n = String(j?.niche || '').trim();
      const o = String(j?.occupy || '').trim();
      if (!t && !n && !o) return null;
      return { territory: t, niche: n, occupy: o };
    } catch (_) {
      // Fallback: đọc từ ô textarea theo nhãn
      const s = String(text || '');
      return {
        territory: pickSection(s, /territory\s*:\s*/i),
        niche:     pickSection(s, /niche\s*:\s*/i),
        occupy:    pickSection(s, /occupy\s*:\s*/i),
      };
    }
  }
  function pickSection(s, rx) {
    const m = s.match(rx); if (!m) return '';
    const start = m.index + m[0].length;
    const rest  = s.slice(start);
    const next  = rest.search(/(?:territory|niche|occupy)\s*:/i);
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
