// src/steps/step3_intro.js
// Step 3 – Mở đầu (CaRS: Territory, Niche, Occupy)
// Giữ đúng baseline: 3 ô nhập (territory/niche/occupy), GPT gợi ý từ PICO + ResearchQuestion + Objectives + PDF (tuỳ chọn),
// GPT đánh giá, Lưu state.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Mở đầu (CaRS)</h3>
    <div class="card-subtitle">Trình bày theo mô hình CaRS: <strong>Territory</strong> (bối cảnh/tầm quan trọng), <strong>Niche</strong> (khoảng trống), <strong>Occupy</strong> (cách nghiên cứu lấp khoảng trống).</div>
  </div>

  <div class="card-body grid-2">
    <label>Territory (Bối cảnh – tầm quan trọng)
      <textarea id="intro-territory" rows="6" placeholder="Nêu bối cảnh, tầm quan trọng, quy mô vấn đề, gánh nặng..."></textarea>
    </label>
    <label>Niche (Khoảng trống – vấn đề chưa giải quyết)
      <textarea id="intro-niche" rows="6" placeholder="Xác định lỗ hổng bằng chứng, hạn chế của nghiên cứu trước..."></textarea>
    </label>
    <label style="grid-column:1 / -1">Occupy (Cách nghiên cứu này sẽ lấp khoảng trống)
      <textarea id="intro-occupy" rows="6" placeholder="Mục tiêu/giả thuyết/chọn thiết kế – tại sao, cái gì mới, mong đợi đóng góp..."></textarea>
    </label>
  </div>

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input id="intro-pdf" type="file" accept="application/pdf" />
    <button id="intro-gpt" class="btn-outline">GPT gợi ý (từ PICO/Question/Objectives/PDF)</button>
    <small style="opacity:.8">Tuỳ chọn: chọn PDF trước khi bấm GPT.</small>
  </div>

  <div class="card-body" id="intro-suggest" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Gợi ý từ GPT:</div>
    <div id="intro-suggest-content" class="prose"></div>
    <div style="margin-top:.75rem;display:flex;gap:8px;flex-wrap:wrap">
      <button id="intro-use-suggest" class="btn-secondary">Dùng toàn bộ gợi ý</button>
      <button id="intro-apply-partial" class="btn-secondary">Chỉ chèn phần đang trống</button>
    </div>
  </div>

  <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="intro-eval" class="btn-outline">GPT đánh giá mạch lạc CaRS</button>
  </div>

  <div class="card-body" id="intro-eval-wrap" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Đánh giá:</div>
    <div id="intro-eval-content" class="prose"></div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="intro-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ---------- Elements ----------
  const terrEl   = rootEl.querySelector('#intro-territory');
  const nicheEl  = rootEl.querySelector('#intro-niche');
  const occupyEl = rootEl.querySelector('#intro-occupy');

  const pdfEl      = rootEl.querySelector('#intro-pdf');
  const gptBtn     = rootEl.querySelector('#intro-gpt');
  const suggWrap   = rootEl.querySelector('#intro-suggest');
  const suggBox    = rootEl.querySelector('#intro-suggest-content');
  const useAllBtn  = rootEl.querySelector('#intro-use-suggest');
  const usePartBtn = rootEl.querySelector('#intro-apply-partial');

  const evalBtn    = rootEl.querySelector('#intro-eval');
  const evalWrap   = rootEl.querySelector('#intro-eval-wrap');
  const evalOutEl  = rootEl.querySelector('#intro-eval-content');

  const saveBtn    = rootEl.querySelector('#intro-save');

  // ---------- Load state ----------
  const intro = ctx.get('intro', {}) || {};
  terrEl.value   = intro.territory || '';
  nicheEl.value  = intro.niche || '';
  occupyEl.value = intro.occupy || '';

  const oldEval = ctx.get('introEval', '');
  if (oldEval) {
    evalWrap.style.display = '';
    evalOutEl.innerHTML = toHtmlSafe(oldEval).replace(/\n/g, '<br/>');
  }

  // ---------- Save ----------
  saveBtn.addEventListener('click', () => {
    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.toast('Đã lưu phần Mở đầu (CaRS)');
  });

  // ---------- GPT suggest ----------
  gptBtn.addEventListener('click', async () => {
    try {
      gptBtn.disabled = true;
      const prev = gptBtn.textContent;
      gptBtn.textContent = 'Đang gọi GPT...';

      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\n...[cắt bớt]';
        } catch (e) {
          console.error(e);
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
- Chính: ${mainObj || '(chưa có)'}
- Phụ:
${subObjs && subObjs.length ? subObjs.map((s,i)=>`${i+1}. ${s}`).join('\n') : '(chưa có)'}

Trích lược PDF (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const parsed = tryParseCaRS(raw);
      if (!parsed) {
        ctx.toast('GPT không trả về CaRS hợp lệ. Xem console.');
        console.warn('GPT raw reply (step3 suggest):', raw);
      } else {
        renderSuggest(parsed);
        suggWrap.style.display = '';
        ctx.toast('Đã nhận gợi ý CaRS');
      }

      gptBtn.textContent = prev;
      gptBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
      gptBtn.disabled = false;
      gptBtn.textContent = 'GPT gợi ý (từ PICO/Question/Objectives/PDF)';
    }
  });

  function tryParseCaRS(text) {
    // Ưu tiên JSON
    try {
      const j = JSON.parse(String(text));
      const t = String(j?.territory || '').trim();
      const n = String(j?.niche || '').trim();
      const o = String(j?.occupy || '').trim();
      if (!t && !n && !o) return null;
      return { territory: t, niche: n, occupy: o };
    } catch (_e) {
      // Fallback: dò theo nhãn
      const s = String(text || '');
      const t = pickSection(s, /territory[:\-\s]/i);
      const n = pickSection(s, /niche[:\-\s]/i);
      const o = pickSection(s, /occupy[:\-\s]/i);
      if (!t && !n && !o) return null;
      return { territory: t, niche: n, occupy: o };
    }
  }

  function pickSection(s, rex) {
    // Lấy đoạn sau nhãn đến nhãn kế tiếp hoặc hết chuỗi
    const m = s.match(rex);
    if (!m) return '';
    const start = m.index + m[0].length;
    const rest = s.slice(start);
    const next = rest.search(/(?:territory|niche|occupy)[:\-\s]/i);
    const seg = next >= 0 ? rest.slice(0, next) : rest;
    return seg.trim();
  }

  function renderSuggest(obj) {
    const T = obj.territory ? `<p><strong>Territory:</strong><br>${toHtmlSafe(obj.territory).replace(/\n/g,'<br/>')}</p>` : '';
    const N = obj.niche     ? `<p><strong>Niche:</strong><br>${toHtmlSafe(obj.niche).replace(/\n/g,'<br/>')}</p>`       : '';
    const O = obj.occupy    ? `<p><strong>Occupy:</strong><br>${toHtmlSafe(obj.occupy).replace(/\n/g,'<br/>')}</p>`     : '';
    suggBox.innerHTML = T + N + O;

    useAllBtn.onclick = () => {
      if (obj.territory) terrEl.value = obj.territory;
      if (obj.niche)     nicheEl.value = obj.niche;
      if (obj.occupy)    occupyEl.value = obj.occupy;
      ctx.save('intro', {
        territory: (terrEl.value || '').trim(),
        niche:     (nicheEl.value || '').trim(),
        occupy:    (occupyEl.value || '').trim(),
      });
      ctx.toast('Đã áp dụng toàn bộ gợi ý CaRS');
    };

    usePartBtn.onclick = () => {
      if (!terrEl.value && obj.territory) terrEl.value = obj.territory;
      if (!nicheEl.value && obj.niche)     nicheEl.value = obj.niche;
      if (!occupyEl.value && obj.occupy)   occupyEl.value = obj.occupy;
      ctx.save('intro', {
        territory: (terrEl.value || '').trim(),
        niche:     (nicheEl.value || '').trim(),
        occupy:    (occupyEl.value || '').trim(),
      });
      ctx.toast('Đã chèn gợi ý vào phần đang trống');
    };
  }

  // ---------- GPT evaluate ----------
  evalBtn.addEventListener('click', async () => {
    const territory = (terrEl.value || '').trim();
    const niche     = (nicheEl.value || '').trim();
    const occupy    = (occupyEl.value || '').trim();

    if (!territory && !niche && !occupy) {
      ctx.toast('Chưa có nội dung CaRS để đánh giá.');
      return;
    }

    try {
      evalBtn.disabled = true;
      const prev = evalBtn.textContent;
      evalBtn.textContent = 'Đang đánh giá...';

      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const prompt = `
Bạn là biên tập viên học thuật. Hãy **đánh giá mạch lạc CaRS** (Territory–Niche–Occupy) dưới đây theo các tiêu chí: logic, liên kết với PICO và mục tiêu, tính cô đọng – rõ ràng, và gợi ý chỉnh sửa cụ thể. Trả về **MARKDOWN ngắn gọn** (bullet ngắn + đề xuất chỉnh).

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
Mục tiêu chính: ${mainObj || '(chưa có)'}
Mục tiêu phụ:
${subObjs && subObjs.length ? subObjs.map((s,i)=>`${i+1}. ${s}`).join('\n') : '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();

      if (!md) {
        ctx.toast('GPT không trả về nội dung đánh giá.');
      } else {
        evalWrap.style.display = '';
        ctx.save('introEval', md);
        evalOutEl.innerHTML = toHtmlSafe(md).replace(/\n/g, '<br/>');
        ctx.toast('Đã cập nhật đánh giá CaRS');
      }

      evalBtn.textContent = prev;
      evalBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
      evalBtn.disabled = false;
      evalBtn.textContent = 'GPT đánh giá mạch lạc CaRS';
    }
  });

  // ---------- util ----------
  function toHtmlSafe(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
}
