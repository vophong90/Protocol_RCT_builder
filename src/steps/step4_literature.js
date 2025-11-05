// src/steps/step4_literature.js
// Step 4 – Tong quan tai lieu (9 tieu muc)

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
<div class="card" id="lit-card">
  <div class="card-header">
    <h3 class="card-title">Tổng quan tài liệu</h3>
    <div class="card-subtitle">
      9 tiểu mục. Mỗi mục có thể tải PDF riêng để GPT trích lược trước khi gợi ý nội dung.
      Nội dung được lưu vào <code>literature.sections[slug]</code>.
    </div>
  </div>
  <style>
    #lit-card .grid-2 { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
    @media (max-width: 900px){ #lit-card .grid-2{ grid-template-columns: 1fr; } }
    #lit-card .form-textarea {
      width:100%; font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background:#fff; border:1px solid var(--border); border-radius:12px; padding:.9rem 1rem; resize:vertical;
    }
    #lit-card .hidden { display:none !important; }
    #lit-card .section-card { margin-bottom: 14px; }
  </style>
  <div class="card-body" id="lit-wrap"></div>
</div>
`.trim();

  const wrap = rootEl.querySelector('#lit-wrap');
  sections.forEach(sec => wrap.appendChild(renderSectionCard(sec, ctx)));

  function renderSectionCard(sec, ctx) {
    const card = document.createElement('div');
    card.className = 'card section-card';
    card.innerHTML = `
  <div class="card-header">
    <h4 class="card-title">${toHtmlSafe(sec.title)}</h4>
  </div>

  <!-- File + nut GPT -->
  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">
    <div style="flex:1;min-width:280px">
      <input id="pdf-${sec.slug}" type="file" accept="application/pdf" />
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="gpt-${sec.slug}"  class="btn-primary" type="button">GPT gợi ý nội dung</button>
      <button id="eval-${sec.slug}" class="btn-outline" type="button">GPT đánh giá mục này</button>
    </div>
  </div>

  <!-- KET QUA GPT – GOI Y -->
  <div id="sugg-box-${sec.slug}" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px">
        <button id="apply-replace-${sec.slug}" class="btn-primary"  type="button">Thay thế toàn bộ</button>
        <button id="apply-append-${sec.slug}"  class="btn-secondary" type="button">Chèn thêm vào cuối</button>
        <button id="copy-sugg-${sec.slug}"     class="btn-ghost"     type="button">Sao chép</button>
        <button id="hide-sugg-${sec.slug}"     class="btn-ghost"     type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="sugg-ta-${sec.slug}" class="form-textarea" rows="10" placeholder="Gợi ý từ GPT (Markdown)…"></textarea>
    </div>
  </div>

  <!-- O nhap noi dung chinh -->
  <div class="card-body">
    <label>Nội dung ${toHtmlSafe(sec.title)}
      <textarea id="txt-${sec.slug}" class="form-textarea" rows="10" placeholder="Viết/hiệu chỉnh nội dung ở đây (Markdown được hỗ trợ)"></textarea>
    </label>
  </div>

  <!-- KET QUA GPT – DANH GIA -->
  <div id="eval-box-${sec.slug}" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px">
        <button id="copy-eval-${sec.slug}" class="btn-ghost" type="button">Sao chép</button>
        <button id="hide-eval-${sec.slug}" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="eval-ta-${sec.slug}" class="form-textarea" rows="10" placeholder="Đánh giá của GPT (bullet/markdown)…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="save-${sec.slug}" class="btn-primary" type="button">Lưu mục này</button>
  </div>
`.trim();

    // Elements
    const pdfEl     = card.querySelector(`#pdf-${sec.slug}`);
    const gptBtn    = card.querySelector(`#gpt-${sec.slug}`);
    const evalBtn   = card.querySelector(`#eval-${sec.slug}`);
    const saveBtn   = card.querySelector(`#save-${sec.slug}`);

    const textEl    = card.querySelector(`#txt-${sec.slug}`);

    const suggBox   = card.querySelector(`#sugg-box-${sec.slug}`);
    const suggTA    = card.querySelector(`#sugg-ta-${sec.slug}`);
    const applyRep  = card.querySelector(`#apply-replace-${sec.slug}`);
    const applyApp  = card.querySelector(`#apply-append-${sec.slug}`);
    const copySugg  = card.querySelector(`#copy-sugg-${sec.slug}`);
    const hideSugg  = card.querySelector(`#hide-sugg-${sec.slug}`);

    const evalBox   = card.querySelector(`#eval-box-${sec.slug}`);
    const evalTA    = card.querySelector(`#eval-ta-${sec.slug}`);
    const copyEval  = card.querySelector(`#copy-eval-${sec.slug}`);
    const hideEval  = card.querySelector(`#hide-eval-${sec.slug}`);

    // Load state
    textEl.value = ctx.get(`literature.sections.${sec.slug}`, '') || '';
    const initEval = ctx.get(`literatureEval.${sec.slug}`, '');
    if (initEval) { evalTA.value = String(initEval); evalBox.classList.remove('hidden'); }

    // Save
    saveBtn.addEventListener('click', () => {
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast(`Đã lưu: ${sec.title}`);
    });

    // GPT goi y
    gptBtn.addEventListener('click', async () => {
      try {
        toggleBusy(gptBtn, true, 'Đang gợi ý...');
        const pico = ctx.get('pico', {}) || {};
        const rq   = ctx.get('researchQuestion', '') || '';
        const mainObj = ctx.get('mainObjective', '') || '';
        const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

        let pdfText = '';
        const f = pdfEl && pdfEl.files && pdfEl.files[0];
        if (f) {
          try {
            pdfText = await ctx.extractTextFromPDF(f);
            if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\n...[cat bot]';
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
        }
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
      } finally {
        toggleBusy(gptBtn, false, 'GPT gợi ý nội dung');
      }
    });

    // Ap dung goi y
    applyRep.addEventListener('click', () => {
      textEl.value = suggTA.value || '';
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã thay thế toàn bộ nội dung bằng gợi ý');
    });
    applyApp.addEventListener('click', () => {
      const cur = textEl.value || '';
      const add = suggTA.value || '';
      textEl.value = cur ? (cur + '\n\n' + add) : add;
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã chèn thêm gợi ý vào cuối');
    });
    copySugg.addEventListener('click', () => copyText(suggTA.value || ''));
    hideSugg.addEventListener('click', () => suggBox.classList.add('hidden'));

    // GPT danh gia
    evalBtn.addEventListener('click', async () => {
      const content = (textEl.value || '').trim();
      if (!content) return ctx.toast('Chưa có nội dung để đánh giá.');
      try {
        toggleBusy(evalBtn, true, 'Đang đánh giá...');
        const pico = ctx.get('pico', {}) || {};
        const rq   = ctx.get('researchQuestion', '') || '';
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

    return card;
  }

  // ----- Prompt builders (ASCII-only, no backticks) -----
  function buildSuggestPrompt(title, pico, rq, mainObj, subObjs, pdfText) {
    const subsStr = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\n')
      : '(chua co)';
    return (
      'Ban la tro ly hoc thuat, hay soan muc tong quan: "' + (title || '') + '" cho de cuong RCT, dua tren PICO, Cau hoi nghien cuu, Muc tieu, va trich luoc PDF (neu co).\n' +
      '- Van phong khoa hoc, mach lac, de doc, 2-5 doan ngan.\n' +
      '- Han che phong doan ngoai boi canh; tranh tham chieu khong chac chan.\n' +
      '- Tra ve MARKDOWN thuan.\n\n' +
      'Ngu canh:\n' +
      'P: ' + (pico && pico.p || '(chua co)') + '\n' +
      'I: ' + (pico && pico.i || '(chua co)') + '\n' +
      'C: ' + (pico && pico.c || '(chua co)') + '\n' +
      'O: ' + (pico && pico.o || '(chua co)') + '\n' +
      'Cau hoi nghien cuu: ' + (rq || '(chua co)') + '\n' +
      'Muc tieu chinh: ' + (mainObj || '(chua co)') + '\n' +
      'Muc tieu phu:\n' + subsStr + '\n\n' +
      'Trich luoc PDF (neu co):\n' + (pdfText || '(khong co)')
    );
  }

  function buildEvaluatePrompt(title, content, pico, rq, mainObj, subObjs) {
    const subsStr = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\n')
      : '(chua co)';
    return (
      'Ban la phan bien khoa hoc. Hay DANH GIA muc tong quan "' + (title || '') + '" duoi day theo cac tieu chi:\n' +
      '- Tinh bao quat/ day du tieu muc\n' +
      '- Lien ket logic voi PICO, cau hoi, muc tieu\n' +
      '- Tinh cap nhat (neu co), ro rang, khong tu mau thuan\n' +
      '- Goi y chinh sua ngan gon, uu tien co the hanh dong ngay\n' +
      'Tra ve MARKDOWN (bullet ngan gon).\n\n' +
      '--- NOI DUNG CAN DANH GIA ---\n' + (content || '') + '\n\n' +
      '--- THAM CHIEU BOI CANH ---\n' +
      'P: ' + (pico && pico.p || '(chua co)') + '\n' +
      'I: ' + (pico && pico.i || '(chua co)') + '\n' +
      'C: ' + (pico && pico.c || '(chua co)') + '\n' +
      'O: ' + (pico && pico.o || '(chua co)') + '\n' +
      'Cau hoi nghien cuu: ' + (rq || '(chua co)') + '\n' +
      'Muc tieu chinh: ' + (mainObj || '(chua co)') + '\n' +
      'Muc tieu phu:\n' + subsStr
    );
  }

  // ----- utils -----
  function toHtmlSafe(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
  function copyText(t) {
    try { navigator.clipboard && navigator.clipboard.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }
  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }
}
