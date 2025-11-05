// src/steps/step4_literature.js
// Step 4 – Tổng quan tài liệu (9 tiểu mục)
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

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

  // rootEl CHÍNH LÀ .card trong index → không tạo thêm .card mới
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Tổng quan tài liệu</h3>
      <div class="card-subtitle">
        9 tiểu mục. Mỗi mục có thể tải PDF riêng để GPT trích lược trước khi gợi ý nội dung.
        Nội dung được lưu vào <code>literature.sections[slug]</code>.
      </div>
    </div>
    <div class="card-body" id="lit-wrap"></div>
  `.trim();

  const wrap = rootEl.querySelector('#lit-wrap');
  sections.forEach(sec => wrap.appendChild(renderSectionBlock(sec)));

  function renderSectionBlock(sec) {
    const block = document.createElement('div');
    block.innerHTML = `
      <div class="card-body">
        <h4 style="font-weight:600;margin-bottom:.5rem">${toHtmlSafe(sec.title)}</h4>

        <!-- File + 2 nút GPT -->
        <div class="control-row row-spaced" style="margin-bottom:.5rem">
          <input id="pdf-${sec.slug}" type="file" accept="application/pdf" />
          <span id="fname-${sec.slug}" class="muted">Chưa chọn tệp PDF</span>

          <button id="gpt-${sec.slug}"  class="btn btn-primary" type="button">GPT gợi ý nội dung</button>
          <button id="eval-${sec.slug}" class="btn btn-primary" type="button">GPT đánh giá mục này</button>
        </div>

        <!-- Kết quả GPT – GỢI Ý -->
        <div id="sugg-wrap-${sec.slug}" class="card-body" style="display:none">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <strong>Kết quả GPT – Gợi ý</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="apply-replace-${sec.slug}" class="btn btn-primary"  type="button">Thay thế toàn bộ</button>
              <button id="apply-append-${sec.slug}"  class="btn btn-secondary" type="button">Chèn thêm vào cuối</button>
              <button id="copy-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Sao chép</button>
              <button id="hide-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Ẩn</button>
            </div>
          </div>
          <textarea id="sugg-ta-${sec.slug}" rows="10" placeholder="Gợi ý từ GPT (Markdown)…"></textarea>
        </div>

        <!-- Ô nhập nội dung chính -->
        <div class="card-body">
          <label>Nội dung ${toHtmlSafe(sec.title)}
            <textarea id="txt-${sec.slug}" rows="10" placeholder="Viết/hiệu chỉnh nội dung ở đây (Markdown được hỗ trợ)"></textarea>
          </label>
        </div>

        <!-- Kết quả GPT – ĐÁNH GIÁ -->
        <div id="eval-wrap-${sec.slug}" class="card-body" style="display:none">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <strong>Kết quả GPT – Đánh giá</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="copy-eval-${sec.slug}" class="btn btn-ghost" type="button">Sao chép</button>
              <button id="hide-eval-${sec.slug}" class="btn btn-ghost" type="button">Ẩn</button>
            </div>
          </div>
          <textarea id="eval-ta-${sec.slug}" rows="10" placeholder="Đánh giá của GPT (bullet/markdown)…"></textarea>
        </div>

        <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
          <button id="save-${sec.slug}" class="btn btn-primary" type="button">Lưu mục này</button>
        </div>
      </div>
    `.trim();

    // Elements
    const pdfEl    = block.querySelector(`#pdf-${sec.slug}`);
    const fnameEl  = block.querySelector(`#fname-${sec.slug}`);
    const gptBtn   = block.querySelector(`#gpt-${sec.slug}`);
    const evalBtn  = block.querySelector(`#eval-${sec.slug}`);
    const saveBtn  = block.querySelector(`#save-${sec.slug}`);

    const textEl   = block.querySelector(`#txt-${sec.slug}`);

    const suggWrap = block.querySelector(`#sugg-wrap-${sec.slug}`);
    const suggTA   = block.querySelector(`#sugg-ta-${sec.slug}`);
    const applyRep = block.querySelector(`#apply-replace-${sec.slug}`);
    const applyApp = block.querySelector(`#apply-append-${sec.slug}`);
    const copySugg = block.querySelector(`#copy-sugg-${sec.slug}`);
    const hideSugg = block.querySelector(`#hide-sugg-${sec.slug}`);

    const evalWrap = block.querySelector(`#eval-wrap-${sec.slug}`);
    const evalTA   = block.querySelector(`#eval-ta-${sec.slug}`);
    const copyEval = block.querySelector(`#copy-eval-${sec.slug}`);
    const hideEval = block.querySelector(`#hide-eval-${sec.slug}`);

    // Load state
    textEl.value = ctx.get(`literature.sections.${sec.slug}`, '') || '';
    const initEval = ctx.get(`literatureEval.${sec.slug}`, '');
    if (initEval) { evalTA.value = String(initEval); evalWrap.style.display = ''; }

    // File UI
    pdfEl.addEventListener('change', () => {
      const f = pdfEl.files?.[0];
      fnameEl.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
    });

    // Save
    saveBtn.addEventListener('click', () => {
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast(`Đã lưu: ${sec.title}`);
    });

    // GPT gợi ý
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
            if (pdfText.length > 8000) pdfText = pdfText.slice(0, 8000) + '\n...[cắt bớt]';
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
          suggWrap.style.display = '';
        }
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
      } finally {
        toggleBusy(gptBtn, false, 'GPT gợi ý nội dung');
      }
    });

    // Áp dụng gợi ý
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
    hideSugg.addEventListener('click', () => (suggWrap.style.display = 'none'));

    // GPT đánh giá
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
          evalWrap.style.display = '';
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
    hideEval.addEventListener('click', () => (evalWrap.style.display = 'none'));

    return block;
  }

  // ----- Prompt builders (ASCII-only, không backticks) -----
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
      'P: ' + (pico?.p || '(chua co)') + '\n' +
      'I: ' + (pico?.i || '(chua co)') + '\n' +
      'C: ' + (pico?.c || '(chua co)') + '\n' +
      'O: ' + (pico?.o || '(chua co)') + '\n' +
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
      'P: ' + (pico?.p || '(chua co)') + '\n' +
      'I: ' + (pico?.i || '(chua co)') + '\n' +
      'C: ' + (pico?.c || '(chua co)') + '\n' +
      'O: ' + (pico?.o || '(chua co)') + '\n' +
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
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }
  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }
}
