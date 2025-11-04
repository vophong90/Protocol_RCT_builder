// src/steps/step4_literature.js
// Step 4 – Tổng quan tài liệu (9 tiểu mục), mỗi mục có:
// - Upload PDF riêng (tùy chọn)
// - GPT gợi ý nội dung (dựa vào PICO + Câu hỏi + Mục tiêu + PDF trích lược)
// - GPT đánh giá nội dung đã viết
// - Lưu vào state: literature.sections[slug]; đánh giá: literatureEval[slug]

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
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Tổng quan tài liệu</h3>
    <div class="card-subtitle">
      9 tiểu mục. Mỗi mục có thể tải PDF riêng để GPT trích lược trước khi gợi ý nội dung.
      Nội dung được lưu vào <code>literature.sections[slug]</code>.
    </div>
  </div>
  <div class="card-body" id="lit-wrap"></div>
</div>
`.trim();

  const wrap = rootEl.querySelector('#lit-wrap');

  // Render từng mục
  for (const sec of sections) {
    wrap.appendChild(renderSectionCard(sec, ctx));
  }

  function renderSectionCard(sec, ctx) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '14px';
    card.innerHTML = `
  <div class="card-header">
    <h4 class="card-title">${toHtmlSafe(sec.title)}</h4>
  </div>

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input id="pdf-${sec.slug}" type="file" accept="application/pdf" />
    <button id="gpt-${sec.slug}" class="btn-outline">GPT gợi ý (kết hợp PICO/Question/Objectives/PDF)</button>
    <small style="opacity:.8">Chọn PDF (tuỳ chọn) rồi bấm GPT để gợi ý.</small>
  </div>

  <div class="card-body" id="sugg-wrap-${sec.slug}" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Gợi ý từ GPT:</div>
    <div id="sugg-${sec.slug}" class="prose"></div>
    <div style="margin-top:.75rem;display:flex;gap:8px;flex-wrap:wrap">
      <button id="apply-replace-${sec.slug}" class="btn-secondary">Thay thế toàn bộ</button>
      <button id="apply-append-${sec.slug}"  class="btn-secondary">Chèn thêm vào cuối</button>
    </div>
  </div>

  <div class="card-body">
    <label>Nội dung ${toHtmlSafe(sec.title)}
      <textarea id="txt-${sec.slug}" rows="10" placeholder="Viết/hiệu chỉnh nội dung ở đây (Markdown được hỗ trợ)"></textarea>
    </label>
  </div>

  <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="eval-${sec.slug}" class="btn-outline">GPT đánh giá mục này</button>
  </div>

  <div class="card-body" id="eval-wrap-${sec.slug}" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Đánh giá:</div>
    <div id="eval-${sec.slug}-out" class="prose"></div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="save-${sec.slug}" class="btn-primary">Lưu mục này</button>
  </div>
`.trim();

    // Elements
    const pdfEl      = card.querySelector(`#pdf-${sec.slug}`);
    const gptBtn     = card.querySelector(`#gpt-${sec.slug}`);
    const suggWrap   = card.querySelector(`#sugg-wrap-${sec.slug}`);
    const suggBox    = card.querySelector(`#sugg-${sec.slug}`);
    const applyRep   = card.querySelector(`#apply-replace-${sec.slug}`);
    const applyApp   = card.querySelector(`#apply-append-${sec.slug}`);
    const textEl     = card.querySelector(`#txt-${sec.slug}`);
    const evalBtn    = card.querySelector(`#eval-${sec.slug}`);
    const evalWrap   = card.querySelector(`#eval-wrap-${sec.slug}`);
    const evalOutEl  = card.querySelector(`#eval-${sec.slug}-out`);
    const saveBtn    = card.querySelector(`#save-${sec.slug}`);

    // Load state
    const initText = ctx.get(`literature.sections.${sec.slug}`, '') || '';
    textEl.value = initText;

    const initEval = ctx.get(`literatureEval.${sec.slug}`, '');
    if (initEval) {
      evalWrap.style.display = '';
      evalOutEl.innerHTML = toHtmlSafe(initEval).replace(/\n/g,'<br/>');
    }

    // Save
    saveBtn.addEventListener('click', () => {
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast(`Đã lưu: ${sec.title}`);
    });

    // GPT gợi ý
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
            ctx.toast('Không đọc được PDF của mục này, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
          }
        }

        const prompt = buildSuggestPrompt(sec.title, pico, rq, mainObj, subObjs, pdfText);
        const raw = await ctx.callGPT(prompt);
        const md  = String(raw || '').trim();

        if (!md) {
          ctx.toast('GPT không trả về gợi ý.');
        } else {
          suggWrap.style.display = '';
          // preview (không tự động thay thế để bạn kiểm soát)
          suggBox.innerHTML = toHtmlSafe(md).replace(/\n/g,'<br/>');

          // Gán handler áp dụng
          applyRep.onclick = () => {
            textEl.value = md;
            ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
            ctx.toast('Đã thay thế toàn bộ nội dung bằng gợi ý');
          };
          applyApp.onclick = () => {
            const cur = textEl.value || '';
            textEl.value = cur ? `${cur}\n\n${md}` : md;
            ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
            ctx.toast('Đã chèn thêm gợi ý vào cuối');
          };
        }

        gptBtn.textContent = prev;
        gptBtn.disabled = false;
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
        gptBtn.disabled = false;
        gptBtn.textContent = 'GPT gợi ý (kết hợp PICO/Question/Objectives/PDF)';
      }
    });

    // GPT đánh giá
    evalBtn.addEventListener('click', async () => {
      const content = (textEl.value || '').trim();
      if (!content) {
        ctx.toast('Chưa có nội dung để đánh giá.');
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

        const prompt = buildEvaluatePrompt(sec.title, content, pico, rq, mainObj, subObjs);
        const raw = await ctx.callGPT(prompt);
        const md  = String(raw || '').trim();

        if (!md) {
          ctx.toast('GPT không trả về đánh giá.');
        } else {
          evalWrap.style.display = '';
          evalOutEl.innerHTML = toHtmlSafe(md).replace(/\n/g,'<br/>');
          ctx.save(`literatureEval.${sec.slug}`, md);
          ctx.toast('Đã cập nhật đánh giá');
        }

        evalBtn.textContent = prev;
        evalBtn.disabled = false;
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT đánh giá.');
        evalBtn.disabled = false;
        evalBtn.textContent = 'GPT đánh giá mục này';
      }
    });

    return card;
  }

  // ----- Prompt builders -----
  function buildSuggestPrompt(title, pico, rq, mainObj, subObjs, pdfText) {
    return `
Bạn là trợ lý học thuật, hãy soạn **mục tổng quan: "${title}"** cho đề cương RCT, dựa trên PICO, Câu hỏi nghiên cứu, Mục tiêu, và trích lược PDF (nếu có).
- Văn phong khoa học, mạch lạc, dễ đọc, 2–5 đoạn ngắn.
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
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=>`${i+1}. ${s}`).join('\n') : '(chưa có)'}

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
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=>`${i+1}. ${s}`).join('\n') : '(chưa có)'}
`.trim();
  }

  // ----- utils -----
  function toHtmlSafe(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
}
