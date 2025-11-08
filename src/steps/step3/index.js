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
        <textarea id="intro-territory" rows="6" placeholder="Nêu bối cảnh, gánh nặng, quy mô vấn đề… Dùng đánh số trích dẫn [1], [2]…"></textarea>
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
        <textarea id="intro-refs" rows="6" placeholder="1) Tác giả… Tiêu đề… Tạp chí. Năm;Tập(Số):trang. DOI/PMID/URL&#10;2) …"></textarea>
      </label>
      <div class="muted">Gợi ý: mỗi mục một dòng, đánh số 1), 2)…</div>
    </div>

    <!-- File + 2 nút GPT -->
    <div class="card-body">
      <div class="inline-row" style="gap:12px; flex-wrap:wrap;">
        <input id="intro-pdf" type="file" accept="application/pdf" />
      </div>
      <div class="btn-row" style="margin-top:8px;">
        <button id="intro-gpt"  class="btn btn-primary" type="button">GPT gợi ý CaRS</button>
        <button id="intro-eval" class="btn btn-secondary" type="button">GPT đánh giá CaRS</button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý (một khối văn bản có cả TLTK) -->
    <div id="intro-suggest-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="intro-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="intro-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="intro-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="intro-suggest-ta" rows="16" placeholder="Territory: …&#10;&#10;Niche: …&#10;&#10;Occupy: …&#10;&#10;TLTK:&#10;1) …&#10;2) …"></textarea>
      <div class="muted">Đầu ra gồm 3 phần CaRS (có [1], [2]…) và khối <strong>TLTK</strong> ngay bên dưới.</div>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ (có TLTK ở cuối trong cùng khối) -->
    <div id="intro-eval-wrap" class="card-body hidden">
      <div class="inline-row" style="justify-content:space-between; gap:8px; flex-wrap:wrap; margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div class="inline-row" style="gap:8px; flex-wrap:wrap;">
          <button id="intro-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="intro-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="intro-eval-ta" rows="16" placeholder="[Đánh giá + bản CaRS đề xuất (có trích dẫn) + TLTK …]"></textarea>
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

  const gptBtn   = $('#intro-gpt');
  const evalBtn  = $('#intro-eval');
  const saveBtn  = $('#intro-save');

  const sWrap    = $('#intro-suggest-wrap');
  const sTA      = $('#intro-suggest-ta');
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

  // ===== File UI ===== (không chip; chỉ tooltip)
  pdfEl.addEventListener('change', () => {
    pdfEl.title = pdfEl.files?.[0]?.name || '';
  });

  // ===== GPT: Gợi ý CaRS + TLTK (trong cùng khối) =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'GPT gợi ý CaRS');
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
          if (pdfText.length > 10000) pdfText = pdfText.slice(0, 10000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
        }
      }

      const today = new Date().toISOString().slice(0,10);

      const prompt = `
Bạn là trợ lý học thuật soạn phần Mở đầu (CaRS) cho đề cương RCT. Hãy viết 3 phần **Territory – Niche – Occupy** với văn phong bài báo khoa học và **tối thiểu ~2 trang A4** (≥1200 từ cho toàn bộ CaRS).

YÊU CẦU NGHIÊM VỀ NGUỒN:
- Mọi trích dẫn phải **CÓ THẬT**. KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên bài báo hoặc tác giả.
- Chỉ liệt kê tối đa 10 tài liệu bạn **chắc chắn ≥90%** là có thật. Ưu tiên nguồn từ PDF đính kèm (nếu có).
- Mỗi tài liệu phải có: Tác giả chính, năm, tiêu đề, tạp chí/sách, và **DOI hoặc PMID hoặc URL chính thức**.
- Nếu không tìm thấy nguồn phù hợp, viết đúng câu: **"Không tìm thấy nguồn phù hợp để trích dẫn."**

ĐỊNH DẠNG TRẢ LỜI — TRẢ VỀ ĐÚNG **MỘT KHỐI VĂN BẢN** (KHÔNG JSON, KHÔNG giải thích thêm):
Territory:
[đoạn dài, 9–14 câu, có chèn [1], [2]…]
  
Niche:
[đoạn dài, 7–12 câu, có chèn [x]…]
  
Occupy:
[đoạn dài, 9–15 câu, nêu mục tiêu/thiết kế/điểm mới, có chèn [x]…]
  
TLTK:
1) Tác giả… (năm). Tiêu đề. Tạp chí… DOI/PMID/URL
2) …
(hoặc: "Không tìm thấy nguồn phù hợp để trích dẫn.")

Ngày soạn: ${today}

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
      const text = unwrapToText(raw);
      const pretty = String(text || '').trim();

      if (!/^\s*Territory\s*:/i.test(pretty) || !/TLTK\s*:/i.test(pretty)) {
        ctx.toast('GPT không trả về đúng định dạng yêu cầu.');
        console.warn('GPT raw reply (step3 suggest):', raw);
      } else {
        sTA.value = pretty;
        sWrap.classList.remove('hidden');
        ctx.toast('Đã nhận gợi ý CaRS.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý CaRS');
    }
  }

  // Áp dụng nội dung từ ô gợi ý: tách Territory/Niche/Occupy + TLTK
  sApply.addEventListener('click', () => {
    const { territory, niche, occupy, refs } = splitCarsAndRefs(sTA.value || '');
    if (territory) terrEl.value = territory;
    if (niche)     nicheEl.value = niche;
    if (occupy)    occupyEl.value = occupy;
    if (refs.length) refsEl.value = refs.join('\n');

    ctx.save('intro', {
      territory: (terrEl.value || '').trim(),
      niche:     (nicheEl.value || '').trim(),
      occupy:    (occupyEl.value || '').trim(),
    });
    ctx.save('introReferences', (refsEl.value || '').trim());
    ctx.toast('Đã chèn CaRS + TLTK vào các ô.');
  });

  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => sWrap.classList.add('hidden'));

  // ===== GPT: Đánh giá CaRS (kèm bản đề xuất có TLTK) =====
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
Bạn là biên tập viên học thuật. Hãy:
A) **ĐÁNH GIÁ** CaRS hiện có (gạch đầu dòng ngắn gọn): logic giữa 3 phần, liên hệ PICO/câu hỏi/mục tiêu, mức độ cập nhật bằng chứng, chất lượng trích dẫn.
B) **VIẾT LẠI CaRS ĐỀ XUẤT** (Territory – Niche – Occupy) theo văn phong học thuật, độ dài mục tiêu toàn khối ≥1200 từ, có chèn trích dẫn [1], [2]… và **TLTK CÓ THẬT** ở cuối.

NGUYÊN TẮC NGUỒN:
- KHÔNG bịa DOI/PMID/URL, KHÔNG bịa tên bài báo hoặc tác giả.
- Tối đa 10 nguồn, chắc chắn ≥90% là có thật; ưu tiên trích từ PDF đính kèm.
- Nếu không có nguồn phù hợp, ghi đúng câu: "Không tìm thấy nguồn phù hợp để trích dẫn."

ĐỊNH DẠNG TRẢ LỜI — MỘT KHỐI VĂN BẢN:
Đánh giá:
- …
- …

CaRS đề xuất
Territory:
[đoạn dài … có [1], [2]…]

Niche:
[đoạn dài …]

Occupy:
[đoạn dài …]

TLTK:
1) …
2) …
(hoặc: "Không tìm thấy nguồn phù hợp để trích dẫn.")

CaRS hiện có để tham chiếu:
Territory:
${territory || '(chưa có)'}
Niche:
${niche || '(chưa có)'}
Occupy:
${occupy || '(chưa có)'}

PICO:
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
      const text = unwrapToText(raw);
      eTA.value = String(text || '').trim();
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
  function splitCarsAndRefs(block) {
    const s = String(block || '');
    const t = pickSection(s, /territory\s*:/i);
    const n = pickSection(s, /niche\s*:/i);
    const o = pickSection(s, /occupy\s*:/i);
    const refs = pickRefs(s);
    return { territory: t, niche: n, occupy: o, refs };
  }
  function pickSection(s, rx) {
    const m = s.match(rx); if (!m) return '';
    const start = m.index + m[0].length;
    const rest  = s.slice(start);
    const next  = rest.search(/(?:\n\s*)?(?:territory|niche|occupy|tltk)\s*:/i);
    return (next >= 0 ? rest.slice(0, next) : rest).trim();
  }
  function pickRefs(s) {
    const m = s.match(/tltk\s*:\s*([\s\S]+)$/i);
    if (!m) return [];
    return m[1]
      .split(/\r?\n/)
      .map(x => x.replace(/^\s*(?:\d+[.)]|\d+\))\s*/, '').trim())
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

  // ==== Unwrap utils (Responses API / Moderation) ====
  function unwrapToText(maybe) {
    if (maybe == null) return '';
    if (typeof maybe === 'string') return maybe;
    try {
      if (maybe.output_text) return String(maybe.output_text);
      if (Array.isArray(maybe.output)) {
        const parts = [];
        for (const blk of maybe.output) {
          if (Array.isArray(blk.content)) {
            for (const c of blk.content) {
              if (c?.type === 'output_text' && c?.text?.value) parts.push(String(c.text.value));
              else if (c?.type === 'text' && c?.text) parts.push(String(c.text));
            }
          }
        }
        if (parts.length) return parts.join('\n').trim();
      }
    } catch {}
    try { return JSON.stringify(maybe); } catch { return String(maybe); }
  }

  // Gọi GPT theo binding per-step; kèm fallback & phát hiện moderation
  async function callAI(bindingKey, prompt, ctx_) {
    let r;
    if (typeof ctx_.callStepGPT === 'function') {
      r = await ctx_.callStepGPT(bindingKey, prompt);
      const s = String(r ?? '');
      const looksModeration =
        /^\s*\{/.test(s) &&
        (/"id"\s*:\s*"modr-/i.test(s) || /"model"\s*:\s*".*moderation/i.test(s) || /"results"\s*:\s*\[/i.test(s));
      if (looksModeration && typeof ctx_.callGPT === 'function') {
        r = await ctx_.callGPT(prompt);
      }
    } else if (typeof ctx_.callGPT === 'function') {
      r = await ctx_.callGPT(prompt);
    } else {
      throw new Error('Chưa cấu hình GPT binding cho step 3');
    }
    return r;
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
