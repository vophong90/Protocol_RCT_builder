// src/steps/step3/index.js
// Step 3 – Mở đầu (CaRS: Territory, Niche, Occupy) + References (AMA 11th)
// Yêu cầu ctx: get/save/toast, callStepGPT(bindingKey,prompt) hoặc callGPT(prompt), extractTextFromPDF(file)

export const id = 3;
export const title = "Mở đầu (CaRS)";
export const subtitle = "Trình bày Territory – Niche – Occupy, kèm trích dẫn theo AMA 11th";
export const css = "./public/css/steps/step3.css";

export async function mount(rootEl, ctx) {
  // Scope CSS riêng
  rootEl.closest('.step')?.setAttribute('data-scope', 'step3');

  // ---- UI ----
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Mở đầu (CaRS)</h3>
      <div class="card-subtitle">
        Trình bày theo CaRS: <strong>Territory</strong> (bối cảnh), <strong>Niche</strong> (khoảng trống), <strong>Occupy</strong> (cách nghiên cứu lấp khoảng trống).
        Kết quả GPT sẽ kèm <strong>trích dẫn và danh mục TLTK theo AMA 11th</strong>.
      </div>
    </div>

    <div class="card-body grid-2">
      <label>Territory (Bối cảnh – tầm quan trọng)
        <textarea id="intro-territory" rows="6" placeholder="Nêu bối cảnh, gánh nặng, quy mô vấn đề… Có thể chèn đánh số trích dẫn [1], [2]…"></textarea>
      </label>
      <label>Niche (Khoảng trống bằng chứng)
        <textarea id="intro-niche" rows="6" placeholder="Lỗ hổng tri thức, hạn chế nghiên cứu trước, tranh luận còn tồn tại…"></textarea>
      </label>
      <label class="full-span">Occupy (Cách nghiên cứu lấp khoảng trống)
        <textarea id="intro-occupy" rows="6" placeholder="Mục tiêu/giả thuyết, thiết kế, điểm mới, đóng góp kỳ vọng…"></textarea>
      </label>
    </div>

    <!-- References (AMA 11th) -->
    <div class="card-body">
      <label>Tài liệu tham khảo (AMA 11th)
        <textarea id="intro-refs" rows="6" placeholder="1. Tác giả. Tựa bài… Tên tạp chí. Năm;Tập(Số):trang. doi:...&#10;2. …"></textarea>
      </label>
      <div class="muted">Gợi ý: mỗi mục 1 dòng, đánh số 1., 2., 3.…</div>
    </div>

    <!-- File + 2 nút GPT -->
    <div class="card-body">
      <div class="inline-row" style="gap:12px; flex-wrap:wrap;">
        <input id="intro-pdf" type="file" accept="application/pdf" />
        <span id="intro-fname" class="muted">Chưa chọn tệp PDF</span>
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button id="intro-gpt"  class="btn btn-primary" type="button">GPT gợi ý CaRS + TLTK</button>
        <button id="intro-eval" class="btn btn-primary" type="button">GPT đánh giá CaRS</button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý -->
    <div id="intro-suggest-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="intro-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="intro-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="intro-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="intro-suggest-ta" rows="9" placeholder="Territory: …&#10;&#10;Niche: …&#10;&#10;Occupy: …"></textarea>
      <textarea id="intro-suggest-refs" rows="6" style="margin-top:8px" placeholder="1. … (AMA 11th)&#10;2. …"></textarea>
      <div class="muted">Đầu ra gồm 3 đoạn CaRS (có đánh số trích dẫn [1], [2]…) và danh mục TLTK theo AMA 11th.</div>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ -->
    <div id="intro-eval-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="intro-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="intro-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="intro-eval-ta" rows="10" placeholder="Nhận xét mạch lạc CaRS, liên kết PICO, gợi ý chỉnh sửa…"></textarea>
    </div>

    <div class="card-footer">
      <button id="intro-save" class="btn btn-primary" type="button">Lưu</button>
    </div>
  `.trim();

  // ===== Elements =====
  const $ = (sel) => rootEl.querySelector(sel);

  const terrEl   = $('#intro-territory');
  const nicheEl  = $('#intro-niche');
  const occupyEl = $('#intro-occupy');
  const refsEl   = $('#intro-refs');

  const pdfEl    = $('#intro-pdf');
  const fnameEl  = $('#intro-fname');

  const gptBtn   = $('#intro-gpt');
  const evalBtn  = $('#intro-eval');
  const saveBtn  = $('#intro-save');

  const sWrap    = $('#intro-suggest-wrap');
  const sTA      = $('#intro-suggest-ta');
  const sRefsTA  = $('#intro-suggest-refs');
  const sApply   = $('#intro-apply');
  const sCopy    = $('#intro-copy-suggest');
  const sHide    = $('#intro-hide-suggest');

  const eWrap    = $('#intro-eval-wrap');
  const eTA      = $('#intro-eval-ta');
  const eCopy    = $('#intro-copy-eval');
  const eHide    = $('#intro-hide-eval');

  // ===== Load state =====
  const intro = ctx.get('intro', {}) || {};
  terrEl.value   = intro.territory || '';
  nicheEl.value  = intro.niche || '';
  occupyEl.value = intro.occupy || '';
  refsEl.value   = ctx.get('introReferences', '') || '';

  const oldEval = ctx.get('introEval', '');
  if (oldEval) { eTA.value = String(oldEval); eWrap.classList.remove('hidden'); }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.save('introReferences', (refsEl.value || '').trim());
    ctx.toast('Đã lưu phần Mở đầu (CaRS) & TLTK');
  });

  // ===== File UI =====
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  // ===== GPT: Gợi ý CaRS + References =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'GPT gợi ý CaRS + TLTK');
      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainOb = ctx.get('mainObjective', '') || '';
      const subs   = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const subListStr = subs.length ? subs.map((s,i)=> `${i+1}. ${s}`).join('\n') : '(chưa có)';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = typeof ctx.extractTextFromPDF === 'function'
            ? await ctx.extractTextFromPDF(f)
            : await fallbackExtractTextFromPDF(f);
          if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
        }
      }

      const prompt = `
Bạn là trợ lý học thuật soạn phần Mở đầu (CaRS) cho đề cương RCT. Hãy viết 3 đoạn văn và kèm danh mục tài liệu tham khảo theo **AMA 11th**.

YÊU CẦU:
1) Trả về đúng **JSON** hợp lệ có khóa:
{
  "territory": "…đoạn văn có đánh số trích dẫn [1], [2]…",
  "niche": "…đoạn văn có đánh số trích dẫn [3], [4]…",
  "occupy": "…đoạn văn có đánh số trích dẫn [x]…",
  "references": [
    "1. Tên tác giả. Tựa bài… Tên tạp chí. Năm;Tập(Số):trang. doi:…",
    "2. …"
  ]
}
2) Văn bản tiếng Việt, mạch lạc (Territory 5–7 câu; Niche 4–6 câu; Occupy 5–8 câu).
3) **Bắt buộc** dùng đánh số trích dẫn dạng [1], [2]… trùng khớp thứ tự trong danh mục "references".
4) Mục "references" phải theo **AMA 11th** (đủ tác giả/bài/tạp chí/năm;tập(số):trang; DOI hoặc PMID nếu có).
5) Không thêm bình luận ngoài JSON.

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
${subListStr}

Trích lược PDF (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await callAI('step3.suggest', prompt, ctx);
      const parsed = parseSuggest(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về CaRS/References hợp lệ.');
        console.warn('GPT raw reply (step3 suggest):', raw);
      } else {
        sTA.value    = formatCaRSPreview(parsed);
        sRefsTA.value = (parsed.references || []).join('\n');
        sWrap.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý CaRS + TLTK.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý CaRS + TLTK');
    }
  }

  // Áp dụng nội dung từ ô gợi ý
  sApply.addEventListener('click', () => {
    const obj = parseSuggestFromPreview(sTA.value, sRefsTA.value);
    terrEl.value   = obj.territory || terrEl.value;
    nicheEl.value  = obj.niche     || nicheEl.value;
    occupyEl.value = obj.occupy    || occupyEl.value;
    refsEl.value   = (obj.references || []).join('\n') || refsEl.value;

    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.save('introReferences', (refsEl.value || '').trim());
    ctx.toast('Đã chèn gợi ý vào 3 ô + TLTK.');
  });

  sCopy.addEventListener('click', () => copyText(`${sTA.value}\n\n${sRefsTA.value}`));
  sHide.addEventListener('click', () => sWrap.classList.add('hidden'));

  // ===== GPT: Đánh giá CaRS =====
  evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const territory = (terrEl.value || '').trim();
    const niche     = (nicheEl.value || '').trim();
    const occupy    = (occupyEl.value || '').trim();
    if (!territory && !niche && !occupy) { ctx.toast('Chưa có nội dung CaRS để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'GPT đánh giá CaRS');
      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainOb = ctx.get('mainObjective', '') || '';
      const subs   = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const subListStr = subs.length ? subs.map((s,i)=> `${i+1}. ${s}`).join('\n') : '(chưa có)';

      const prompt = `
Bạn là biên tập viên học thuật. Hãy ĐÁNH GIÁ mạch lạc CaRS (Territory–Niche–Occupy) dưới đây theo các tiêu chí:
- Logic & liên kết giữa 3 đoạn
- Liên hệ PICO / câu hỏi / mục tiêu
- Sử dụng trích dẫn (đánh số) có hợp lý không (không cần kiểm tra thật nguồn)
- Gợi ý chỉnh sửa trọng tâm (bullet)

Trả lời tiếng Việt, gạch đầu dòng ngắn gọn (không trả JSON).

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
${subListStr}
`.trim();

      const raw = await callAI('step3.evaluate', prompt, ctx);
      const text = String(raw || '').trim();
      eTA.value = text;
      eWrap.classList.remove('hidden');
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
  eHide.addEventListener('click', () => eWrap.classList.add('hidden'));

  // ===== Helpers =====
  function formatCaRSPreview(obj) {
    const parts = [];
    if (obj.territory) parts.push('Territory: ' + obj.territory);
    if (obj.niche)     parts.push('Niche: ' + obj.niche);
    if (obj.occupy)    parts.push('Occupy: ' + obj.occupy);
    return parts.join('\n\n');
  }

  function parseSuggest(rawText) {
    // Ưu tiên JSON {"territory","niche","occupy","references":[...]}
    try {
      const j = JSON.parse(String(rawText));
      const t = String(j?.territory || '').trim();
      const n = String(j?.niche || '').trim();
      const o = String(j?.occupy || '').trim();
      const refs = Array.isArray(j?.references) ? j.references.map(r => String(r || '').trim()).filter(Boolean) : [];
      if (!t && !n && !o && refs.length === 0) return null;
      return { territory: t, niche: n, occupy: o, references: refs };
    } catch {
      // Fallback: tách theo nhãn + khối References (không khuyến khích)
      const s = String(rawText || '');
      const obj = {
        territory: pickSection(s, /territory\s*:\s*/i),
        niche:     pickSection(s, /niche\s*:\s*/i),
        occupy:    pickSection(s, /occupy\s*:\s*/i),
        references: pickReferences(s),
      };
      if (!(obj.territory || obj.niche || obj.occupy || (obj.references||[]).length)) return null;
      return obj;
    }
  }

  function parseSuggestFromPreview(carsBlock, refsBlock) {
    const obj = {
      territory: pickSection(carsBlock, /territory\s*:\s*/i),
      niche:     pickSection(carsBlock, /niche\s*:\s*/i),
      occupy:    pickSection(carsBlock, /occupy\s*:\s*/i),
      references: String(refsBlock || '')
        .split(/\r?\n/)
        .map(s => s.trim())
        .filter(Boolean),
    };
    return obj;
  }

  function pickSection(s, rx) {
    const m = s.match(rx); if (!m) return '';
    const start = m.index + m[0].length;
    const rest  = s.slice(start);
    const next  = rest.search(/(?:territory|niche|occupy)\s*:/i);
    return (next >= 0 ? rest.slice(0, next) : rest).trim();
  }

  function pickReferences(s) {
    const m = s.match(/references?\s*:\s*([\s\S]+)$/i);
    if (!m) return [];
    return m[1]
      .split(/\r?\n/)
      .map(x => x.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean);
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

  // Gọi GPT theo binding per-step; fallback dùng ctx.callGPT
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') return ctx_.callStepGPT(bindingKey, prompt);
    if (typeof ctx_.callGPT === 'function') return ctx_.callGPT(prompt);
    throw new Error('Chưa cấu hình GPT binding cho step 3');
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
      out += content.items.map(it => it.str).join(' ') + '\n';
    }
    return out.trim();
  }
}
