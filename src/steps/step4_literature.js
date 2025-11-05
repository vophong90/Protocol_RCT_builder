// src/steps/step4_literature.js
// Step 4 – Tổng quan tài liệu (9 tiểu mục)

export async function mount(rootEl, ctx) {
  const sections = [
    { slug: 'yhhd-overview',       title: 'Đại cương YHHĐ của tình trạng/bệnh trong nghiên cứu' },
    { slug: 'dich-te-ganh-nang',   title: 'Dịch tễ học và gánh nặng bệnh tật' },
    { slug: 'chan-doan-yhhd',      title: 'Chẩn đoán YHHĐ' },
    { slug: 'dieu-tri-yhhd',       title: 'Điều trị YHHĐ' },
    { slug: 'han-che-yhhd',        title: 'Hạn chế của YHHĐ trong quản lý tình trạng/bệnh' },
    { slug: 'yhct-overview',       title: 'Đại cương YHCT của tình trạng/bệnh trong nghiên cứu' },
    { slug: 'lieu-phap-can-thiep', title: 'Liệu pháp can thiệp trong nghiên cứu (mô tả tổng quan)' },
    { slug: 'nghien-cuu-tuong-tu', title: 'Các nghiên cứu cùng loại trong và ngoài nước' },
    { slug: 'pp-moi-phan-tich',    title: 'Các phương pháp mới trong phân tích/đánh giá số liệu' },
  ];

  rootEl.innerHTML = `
<div id="lit-card" class="card">
  <div class="card-header">
    <h3 class="card-title">Tổng quan tài liệu</h3>
    <div class="card-subtitle">
      9 tiểu mục. Mỗi mục có thể tải PDF riêng để GPT trích lược trước khi gợi ý nội dung.
      Nội dung lưu tại <code>literature.sections[slug]</code>.
    </div>
  </div>

  <style>
    /* ===== Chỉ áp dụng trong Step 4 ===== */
    #lit-card .toolbar { display: grid; gap: 10px; padding: 12px 16px; }
    @media (min-width: 860px) {
      #lit-card .toolbar { grid-template-columns: 1fr auto auto auto; align-items: center; }
    }
    #lit-card .search { display:flex; gap:8px; align-items:center; }
    #lit-card .search input {
      width: 100%;
      font: 500 14.5px/1.4 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      border: 1px solid var(--border); border-radius: 10px; padding: .55rem .7rem; background: #fff;
    }

    #lit-card .chipbar { display:flex; gap:8px; overflow:auto; padding: 6px 16px 12px; }
    #lit-card .chipbar .chip {
      border:1px solid var(--border); background:#fff; border-radius:999px; padding:.35rem .7rem;
      font: 600 13.5px/1 Inter, ui-sans-serif; white-space: nowrap; cursor:pointer;
    }
    #lit-card .chipbar .chip:hover { background:#f9fafb; }

    #lit-card .grid { display:grid; gap:12px; padding: 4px 16px 16px; }
    @media (min-width: 1024px) { #lit-card .grid { grid-template-columns: 1fr 1fr; } }

    /* Accordion */
    #lit-card details.section { border:1px solid var(--border); border-radius: 12px; background: #fff; }
    #lit-card details.section[open] { box-shadow: 0 1px 0 rgba(16,24,40,.02), 0 1px 2px rgba(16,24,40,.06); }
    #lit-card details > summary {
      list-style:none; padding: 12px 14px; border-bottom:1px solid var(--border);
      display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer;
    }
    #lit-card details > summary::-webkit-details-marker { display:none; }
    #lit-card .sum-left { display:flex; align-items:center; gap:10px; }
    #lit-card .caret { transition: transform .2s ease; }
    #lit-card details[open] .caret { transform: rotate(90deg); }
    #lit-card .sum-title { font-weight: 600; color:#111827; }

    /* Body blocks */
    #lit-card .blk { padding: 12px 14px; }
    #lit-card .row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:space-between; }
    #lit-card .file-wrap { flex:1; min-width: 260px; max-width: 560px; }
    #lit-card input[type="file"] {
      width: 100%; border:1px solid var(--border); border-radius:10px; padding:.5rem .6rem; background:#fff;
      font: 500 14.5px/1 Inter, ui-sans-serif;
    }
    #lit-card input[type="file"]::file-selector-button {
      margin-right:.6rem; border:1px solid var(--border); background:#fff; padding:.5rem .85rem; border-radius:8px;
      cursor:pointer; font-weight:600;
    }
    #lit-card input[type="file"]::file-selector-button:hover { background:#f9fafb; }
    #lit-card .file-note { color: var(--muted); font-size: .85rem; margin-top: 4px; }

    /* Textareas */
    #lit-card .form-textarea {
      width: 100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff; border: 1px solid var(--border); border-radius: 12px;
      padding: .9rem 1rem; outline: 0; min-height: 120px; resize: vertical;
      transition: border-color .15s ease, box-shadow .15s ease, background-color .15s ease;
    }
    #lit-card .form-textarea::placeholder { color: #9aa3af; }

    /* GPT result areas */
    #lit-card .result-area {
      width:100%; min-height:170px; max-height:42vh; resize:vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      font-size:14px; line-height:1.55; white-space: pre-wrap;
      padding:.85rem 1rem; border:1px solid var(--border); border-radius:12px; background:#fff;
    }
    #lit-card .result-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    #lit-card .btn-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }

    /* Hide helper */
    .hidden { display:none !important; }
  </style>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="search">
      <input id="lit-filter" placeholder="Tìm nhanh theo tiêu đề tiểu mục…" />
    </div>
    <button id="lit-expand"   class="btn btn-secondary" type="button">Mở tất cả</button>
    <button id="lit-collapse" class="btn btn-secondary" type="button">Thu tất cả</button>
    <button id="lit-save-all" class="btn btn-primary"   type="button">Lưu tất cả</button>
  </div>

  <!-- Nav chips -->
  <div id="lit-nav" class="chipbar"></div>

  <!-- Grid of sections -->
  <div id="lit-grid" class="grid"></div>
</div>
`.trim();

  // Render chips + grid
  const nav = rootEl.querySelector('#lit-nav');
  const grid = rootEl.querySelector('#lit-grid');
  const filterEl = rootEl.querySelector('#lit-filter');
  const expandBtn = rootEl.querySelector('#lit-expand');
  const collapseBtn = rootEl.querySelector('#lit-collapse');
  const saveAllBtn = rootEl.querySelector('#lit-save-all');

  sections.forEach(sec => {
    // nav chip
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = shortTitle(sec.title);
    chip.addEventListener('click', () => focusSection(sec.slug));
    nav.appendChild(chip);

    // accordion card
    grid.appendChild(renderSection(sec, ctx));
  });

  // Filter titles
  filterEl.addEventListener('input', () => {
    const q = (filterEl.value || '').toLowerCase().trim();
    sections.forEach(sec => {
      const el = rootEl.querySelector(`#sec-${sec.slug}`);
      const match = noTone(sec.title).toLowerCase().includes(q) || sec.title.toLowerCase().includes(q);
      el.style.display = (q && !match) ? 'none' : '';
    });
  });

  // Expand / Collapse all
  expandBtn.addEventListener('click', () => {
    sections.forEach(sec => rootEl.querySelector(`#sec-${sec.slug}`).open = true);
  });
  collapseBtn.addEventListener('click', () => {
    sections.forEach(sec => rootEl.querySelector(`#sec-${sec.slug}`).open = false);
  });

  // Save all (current textareas)
  saveAllBtn.addEventListener('click', () => {
    sections.forEach(sec => {
      const textEl = rootEl.querySelector(`#txt-${sec.slug}`);
      if (textEl) ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
    });
    ctx.toast('Đã lưu tất cả tiểu mục.');
  });

  // ====== Render one section (accordion) ======
  function renderSection(sec, ctx) {
    const det = document.createElement('details');
    det.className = 'section';
    det.id = `sec-${sec.slug}`;
    det.open = false; // mặc định đóng cho gọn

    det.innerHTML = `
      <summary>
        <div class="sum-left">
          <svg class="caret" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
          <div class="sum-title">${toHtmlSafe(sec.title)}</div>
        </div>
      </summary>

      <!-- Row: file + GPT buttons -->
      <div class="blk row">
        <div class="file-wrap">
          <input id="pdf-${sec.slug}" type="file" accept="application/pdf" />
          <div id="fname-${sec.slug}" class="file-note">Chưa chọn tệp PDF</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
          <button id="gpt-${sec.slug}"  class="btn btn-primary"   type="button">GPT gợi ý nội dung</button>
          <button id="eval-${sec.slug}" class="btn btn-secondary" type="button">GPT đánh giá mục này</button>
        </div>
      </div>

      <!-- GPT suggest -->
      <div id="sugg-box-${sec.slug}" class="blk hidden">
        <div class="result-head">
          <strong>Kết quả GPT – Gợi ý</strong>
          <div class="btn-row">
            <button id="apply-replace-${sec.slug}" class="btn btn-primary"   type="button">Thay thế toàn bộ</button>
            <button id="apply-append-${sec.slug}"  class="btn btn-secondary" type="button">Chèn thêm vào cuối</button>
            <button id="copy-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Sao chép</button>
            <button id="hide-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Ẩn</button>
          </div>
        </div>
        <textarea id="sugg-ta-${sec.slug}" class="result-area" rows="10" placeholder="Gợi ý từ GPT (Markdown)…"></textarea>
      </div>

      <!-- Main content -->
      <div class="blk">
        <label style="font-weight:600;display:block;margin-bottom:.35rem">Nội dung ${toHtmlSafe(sec.title)}</label>
        <textarea id="txt-${sec.slug}" class="form-textarea" rows="10" placeholder="Viết/hiệu chỉnh nội dung ở đây (Markdown được hỗ trợ)"></textarea>
      </div>

      <!-- GPT evaluate -->
      <div id="eval-box-${sec.slug}" class="blk hidden">
        <div class="result-head">
          <strong>Kết quả GPT – Đánh giá</strong>
          <div class="btn-row">
            <button id="copy-eval-${sec.slug}" class="btn btn-ghost" type="button">Sao chép</button>
            <button id="hide-eval-${sec.slug}" class="btn btn-ghost" type="button">Ẩn</button>
          </div>
        </div>
        <textarea id="eval-ta-${sec.slug}" class="result-area" rows="10" placeholder="Đánh giá của GPT (bullet/markdown)…"></textarea>
      </div>

      <div class="blk" style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="save-${sec.slug}" class="btn btn-primary" type="button">Lưu mục này</button>
      </div>
    `.trim();

    // Elements
    const pdfEl     = det.querySelector(`#pdf-${sec.slug}`);
    const fnameEl   = det.querySelector(`#fname-${sec.slug}`);
    const gptBtn    = det.querySelector(`#gpt-${sec.slug}`);
    const evalBtn   = det.querySelector(`#eval-${sec.slug}`);
    const saveBtn   = det.querySelector(`#save-${sec.slug}`);

    const textEl    = det.querySelector(`#txt-${sec.slug}`);

    const suggBox   = det.querySelector(`#sugg-box-${sec.slug}`);
    const suggTA    = det.querySelector(`#sugg-ta-${sec.slug}`);
    const applyRep  = det.querySelector(`#apply-replace-${sec.slug}`);
    const applyApp  = det.querySelector(`#apply-append-${sec.slug}`);
    const copySugg  = det.querySelector(`#copy-sugg-${sec.slug}`);
    const hideSugg  = det.querySelector(`#hide-sugg-${sec.slug}`);

    const evalBox   = det.querySelector(`#eval-box-${sec.slug}`);
    const evalTA    = det.querySelector(`#eval-ta-${sec.slug}`);
    const copyEval  = det.querySelector(`#copy-eval-${sec.slug}`);
    const hideEval  = det.querySelector(`#hide-eval-${sec.slug}`);

    // Load state
    textEl.value = ctx.get(`literature.sections.${sec.slug}`, '') || '';
    const initEval = ctx.get(`literatureEval.${sec.slug}`, '');
    if (initEval) { evalTA.value = String(initEval); evalBox.classList.remove('hidden'); }

    // File name note
    pdfEl.addEventListener('change', () => {
      const f = pdfEl.files?.[0];
      fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
    });

    // Save
    saveBtn.addEventListener('click', () => {
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast(`Đã lưu: ${sec.title}`);
    });

    // GPT suggest
    gptBtn.addEventListener('click', async () => {
      try {
        toggleBusy(gptBtn, true, 'Đang gợi ý...');
        const pico    = ctx.get('pico', {}) || {};
        const rq      = ctx.get('researchQuestion', '') || '';
        const mainObj = ctx.get('mainObjective', '') || '';
        const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

        let pdfText = '';
        const f = pdfEl?.files?.[0];
        if (f) {
          try {
            pdfText = await ctx.extractTextFromPDF(f);
            if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\\n...[cắt bớt]';
          } catch (e) {
            console.error(e);
            ctx.toast('Không đọc được PDF của mục này, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
          }
        }

        const prompt = buildSuggestPrompt(sec.title, pico, rq, mainObj, subObjs, pdfText);
        const raw = await ctx.callGPT(prompt);
        const md  = String(raw || '').trim();

        if (!md) {
          ctx.toast('GPT không trả về gợi ý.');
        } else {
          suggTA.value = md;
          suggBox.classList.remove('hidden');
          det.open = true;
        }
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
      } finally {
        toggleBusy(gptBtn, false, 'GPT gợi ý nội dung');
      }
    });

    // Apply suggestion
    applyRep.addEventListener('click', () => {
      textEl.value = suggTA.value || '';
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã thay thế toàn bộ nội dung bằng gợi ý');
    });
    applyApp.addEventListener('click', () => {
      const cur = textEl.value || '';
      const add = suggTA.value || '';
      textEl.value = cur ? \`\${cur}\\n\\n\${add}\` : add;
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã chèn thêm gợi ý vào cuối');
    });
    copySugg.addEventListener('click', () => copyText(suggTA.value || ''));
    hideSugg.addEventListener('click', () => suggBox.classList.add('hidden'));

    // GPT evaluate
    evalBtn.addEventListener('click', async () => {
      const content = (textEl.value || '').trim();
      if (!content) return ctx.toast('Chưa có nội dung để đánh giá.');
      try {
        toggleBusy(evalBtn, true, 'Đang đánh giá...');
        const pico    = ctx.get('pico', {}) || {};
        const rq      = ctx.get('researchQuestion', '') || '';
        const mainObj = ctx.get('mainObjective', '') || '';
        const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

        const prompt = buildEvaluatePrompt(sec.title, content, pico, rq, mainObj, subObjs);
        const raw = await ctx.callGPT(prompt);
        const md  = String(raw || '').trim();

        if (!md) {
          ctx.toast('GPT không trả về đánh giá.');
        } else {
          evalTA.value = md;
          evalBox.classList.remove('hidden');
          ctx.save(`literatureEval.${sec.slug}`, md);
          ctx.toast('Đã cập nhật đánh giá');
          det.open = true;
        }
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT đánh giá.');
      } finally {
        toggleBusy(evalBtn, false, 'GPT đánh giá mục này');
      }
    });

    copyEval.addEventListener('click', () => copyText(evalTA.value || ''));
    hideEval.addEventListener('click', () => evalBox.classList.add('hidden'));

    return det;
  }

  // ===== Prompt builders =====
  function buildSuggestPrompt(title, pico, rq, mainObj, subObjs, pdfText) {
    return `
Bạn là trợ lý học thuật, hãy soạn **mục tổng quan: "${title}"** cho đề cương RCT, dựa trên PICO, Câu hỏi nghiên cứu, Mục tiêu, và trích lược PDF (nếu có).
- Văn phong khoa học, mạch lạc, dễ đọc, **2–5 đoạn ngắn**.
- Hạn chế phỏng đoán ngoài bối cảnh; tránh tham chiếu không chắc chắn.
- Trả về **MARKDOWN** thuần.

Ngữ cảnh:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
Câu hỏi nghiên cứu: ${rq || '(chưa có)'}
Mục tiêu chính: ${mainObj || '(chưa có)'}
Mục tiêu phụ:
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=>\`\${i+1}. \${s}\`).join('\\n') : '(chưa có)'}

Trích lược PDF (nếu có):
${pdfText || '(không có)'}
`.trim();
  }

  function buildEvaluatePrompt(title, content, pico, rq, mainObj, subObjs) {
    return `
Bạn là phản biện khoa học. Hãy **đánh giá mục tổng quan "${title}"** dưới đây theo các tiêu chí:
- Tính bao quát/đầy đủ tiểu mục
- Liên kết logic với PICO, câu hỏi, mục tiêu
- Tính cập nhật (nếu có thể), rõ ràng, không tự mâu thuẫn
- Gợi ý chỉnh sửa ngắn gọn, ưu tiên gợi ý có thể hành động ngay
Trả về **MARKDOWN** (bullet ngắn gọn).

--- NỘI DUNG CẦN ĐÁNH GIÁ ---
${content}

--- THAM CHIẾU BỐI CẢNH ---
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
Câu hỏi nghiên cứu: ${rq || '(chưa có)'}
Mục tiêu chính: ${mainObj || '(chưa có)'}
Mục tiêu phụ:
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=>\`\${i+1}. \${s}\`).join('\\n') : '(chưa có)'}
`.trim();
  }

  // ===== Helpers =====
  function focusSection(slug) {
    const el = rootEl.querySelector(`#sec-${slug}`);
    if (!el) return;
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function shortTitle(t) {
    // rút gọn chip cho gọn thanh nav
    const map = {
      'Đại cương YHHĐ của tình trạng/bệnh trong nghiên cứu': 'YHHĐ – Đại cương',
      'Dịch tễ học và gánh nặng bệnh tật': 'Dịch tễ & gánh nặng',
      'Chẩn đoán YHHĐ': 'Chẩn đoán YHHĐ',
      'Điều trị YHHĐ': 'Điều trị YHHĐ',
      'Hạn chế của YHHĐ trong quản lý tình trạng/bệnh': 'Hạn chế YHHĐ',
      'Đại cương YHCT của tình trạng/bệnh trong nghiên cứu': 'YHCT – Đại cương',
      'Liệu pháp can thiệp trong nghiên cứu (mô tả tổng quan)': 'Liệu pháp can thiệp',
      'Các nghiên cứu cùng loại trong và ngoài nước': 'Nghiên cứu tương tự',
      'Các phương pháp mới trong phân tích/đánh giá số liệu': 'PP phân tích mới',
    };
    return map[t] || t;
  }

  function toHtmlSafe(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
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
  function noTone(str) {
    return String(str)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }
}
