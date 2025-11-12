// Step 4 – Tổng quan tài liệu (9 tiểu mục) + TLTK AMA 11th
// Yêu cầu ctx: get/save/toast, extractTextFromPDF(file)
// và hàm gọi GPT theo binding từng step: ctx.callStepGPT(key, prompt) (có fallback)

export const id = 4;
export const title = "Tổng quan";
export const subtitle = "Trình bày bối cảnh và tình hình nghiên cứu";
export const css = "./public/css/steps/step4.css";

export async function mount(rootEl, ctx) {
  const card = rootEl.closest('.card') || rootEl;
  card.closest('.step')?.setAttribute('data-scope', 'step4');

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

  // rootEl CHÍNH LÀ .card → không lồng .card nữa
  card.innerHTML = `
    <style>
      /* Ẩn phần text tên tệp, chỉ hiển thị nút Choose file trong step4 */
      [data-scope="step4"] input[type="file"].file-btn-only{ font-size:0; }
      [data-scope="step4"] input[type="file"].file-btn-only::file-selector-button{ font-size:14px; }
      [data-scope="step4"] input[type="file"].file-btn-only::-webkit-file-upload-button{ font-size:14px; }
    </style>

    <div class="card-header">
      <h3 class="card-title">Tổng quan tài liệu</h3>
      <div class="card-subtitle">
        9 tiểu mục. Mỗi mục có thể tải PDF riêng để GPT trích lược trước khi gợi ý nội dung.
      </div>
    </div>
    <div class="card-body" id="lit-wrap"></div>
  `.trim();

  const wrap = card.querySelector('#lit-wrap');
  sections.forEach(sec => wrap.appendChild(renderSectionBlock(sec)));

  // ---------------- Section renderer ----------------
  function renderSectionBlock(sec) {
    const block = document.createElement('div');
    block.innerHTML = `
      <div class="card" style="border-color:var(--border)">
        <div class="card-body">
          <h4 style="font-weight:700;margin:0 0 .5rem">${safeHtml(sec.title)}</h4>

          <!-- File + 2 nút GPT -->
          <div class="control-row" style="margin:.25rem 0 0">
            <input id="pdf-${sec.slug}" class="file-btn-only" type="file" accept="application/pdf" />
            <div class="inline-row" style="gap:8px">
              <button id="gpt-${sec.slug}"  class="btn btn-primary" type="button">GPT gợi ý nội dung + TLTK</button>
              <button id="eval-${sec.slug}" class="btn btn-secondary" type="button">GPT đánh giá mục này</button>
            </div>
          </div>
        </div>

        <!-- Gợi ý của GPT -->
        <div id="sugg-wrap-${sec.slug}" class="card-body" style="display:none">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <strong>Kết quả GPT – Gợi ý</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <button id="apply-replace-${sec.slug}" class="btn btn-primary"  type="button">Thay thế toàn bộ</button>
              <button id="apply-append-${sec.slug}"  class="btn btn-secondary" type="button">Chèn thêm vào cuối</button>
              <button id="copy-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Sao chép</button>
              <button id="hide-sugg-${sec.slug}"     class="btn btn-ghost"     type="button">Ẩn</button>
            </div>
          </div>
          <textarea id="sugg-ta-${sec.slug}" rows="12" placeholder="Markdown + TLTK AMA 11th…"></textarea>
          <div class="muted" style="margin-top:.35rem">
            Gợi ý đã ghép sẵn phần “Tài liệu tham khảo” (AMA 11th) ở cuối.
          </div>
        </div>

        <!-- Nội dung người dùng -->
        <div class="card-body">
          <label>Nội dung ${safeHtml(sec.title)}
            <textarea id="txt-${sec.slug}" rows="12" placeholder="Viết/hiệu chỉnh nội dung (Markdown)…"></textarea>
          </label>
        </div>

        <!-- Đánh giá -->
        <div id="eval-wrap-${sec.slug}" class="card-body" style="display:none">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <strong>Kết quả GPT – Đánh giá</strong>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button id="copy-eval-${sec.slug}" class="btn btn-ghost" type="button">Sao chép</button>
              <button id="hide-eval-${sec.slug}" class="btn btn-ghost" type="button">Ẩn</button>
            </div>
          </div>
          <textarea id="eval-ta-${sec.slug}" rows="10" placeholder="Đánh giá/bổ sung (Markdown)…"></textarea>
        </div>

        <div class="card-footer" style="display:flex;gap:10px;flex-wrap:wrap">
          <button id="save-${sec.slug}" class="btn btn-primary" type="button">Lưu mục này</button>
        </div>
      </div>
    `.trim();

    // -------- Bind elements --------
    const pdfEl    = block.querySelector(`#pdf-${sec.slug}`);
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

    // -------- Load state --------
    textEl.value = ctx.get(`literature.sections.${sec.slug}`, '') || '';
    const initEval = ctx.get(`literatureEval.${sec.slug}`, '');
    if (initEval) { evalTA.value = String(initEval); evalWrap.style.display = ''; }

    // (Không hiển thị tên tệp, không cần listener đổi tên tệp)

    // -------- Save --------
    saveBtn.addEventListener('click', () => {
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast(`Đã lưu: ${sec.title}`);
    });

    // -------- GPT suggest (content + AMA refs) --------
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
            if (pdfText.length > 9000) pdfText = pdfText.slice(0, 9000) + '\\n...[cắt bớt]';
          } catch (e) {
            console.warn('PDF read error:', e);
            ctx.toast('Không đọc được PDF của mục này, sẽ chỉ dùng PICO/Câu hỏi/Mục tiêu.');
          }
        }

        const prompt = buildSuggestPrompt(sec.title, pico, rq, mainObj, subObjs, pdfText);
        const raw = await callAI('step4.suggest', prompt, ctx);
        const mergedMarkdown = toMarkdownWithRefs(raw);

        if (!mergedMarkdown) {
          ctx.toast('GPT không trả về gợi ý hợp lệ.');
        } else {
          suggTA.value = mergedMarkdown;
          suggWrap.style.display = '';
          ctx.toast('Đã nhận gợi ý + TLTK AMA.');
        }
      } catch (e) {
        console.error(e);
        ctx.toast('Lỗi khi gọi GPT gợi ý.');
      } finally {
        toggleBusy(gptBtn, false, 'GPT gợi ý nội dung + TLTK');
      }
    });

    // -------- Apply suggestion --------
    applyRep.addEventListener('click', () => {
      textEl.value = suggTA.value || '';
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã thay thế toàn bộ nội dung bằng gợi ý.');
    });
    applyApp.addEventListener('click', () => {
      const cur = textEl.value || '';
      const add = suggTA.value || '';
      textEl.value = cur ? (cur + '\\n\\n' + add) : add;
      ctx.save(`literature.sections.${sec.slug}`, (textEl.value || '').trim());
      ctx.toast('Đã chèn thêm gợi ý vào cuối.');
    });
    copySugg.addEventListener('click', () => copyText(suggTA.value || ''));
    hideSugg.addEventListener('click', () => (suggWrap.style.display = 'none'));

    // -------- GPT evaluate --------
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
        const raw = await callAI('step4.evaluate', prompt, ctx);
        const md  = String(raw || '').trim();

        if (!md) {
          ctx.toast('GPT không trả về đánh giá.');
        } else {
          evalTA.value = md;
          evalWrap.style.display = '';
          ctx.save(`literatureEval.${sec.slug}`, md);
          ctx.toast('Đã cập nhật đánh giá.');
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

  // ---------------- Prompt builders ----------------

  // Trả JSON: { "content_md": "...", "references": ["AMA 1", "AMA 2", ...] }
  function buildSuggestPrompt(title, pico, rq, mainObj, subObjs, pdfText) {
    const subsStr = Array.isArray(subObjs) && subObjs.length
      ? subObjs.map((s,i)=> (i+1)+'. '+s).join('\n')
      : '(chua co)';

    // ASCII-only để tránh vỡ JSON; yêu cầu AMA 11th và in-text [1], [2] tương ứng
    return (
'Ban la tro ly hoc thuat. Hay soan muc tong quan: "' + (title || '') + '" cho de cuong RCT, dua tren PICO, Cau hoi nghien cuu, Muc tieu va trich luoc PDF (neu co).\n' +
'YEU CAU NOI DUNG:\n' +
'- Viet tieng Viet, 2-5 doan van dai, Markdown thuần.\n' +
'- Chen cac chi dan trong van ban bang so [1], [2], ... tuong ung danh muc tai lieu.\n' +
'- Tranh khang dinh vuot ngoai thong tin cung cap; uu tien tong quan can thiet cho muc nay.\n' +
'\n' +
'YEU CAU TRA VE DANG JSON HOP LE (chi JSON, khong giai thich):\n' +
'{"content_md":"...","references":["TLTK AMA 11th #1","TLTK AMA 11th #2"]}\n' +
'\n' +
'Ghi chu ve TLTK:\n' +
'- Bat buoc dinh dang AMA 11th: Tac gia. Tua bai. Tap chi. Nam;Tap(So):Trang-trang. doi:...\n' +
'- Thu tu danh muc phu hop thu tu [1], [2], ... trong noi dung.\n' +
'- Neu khong chac chan thong tin, su dung cau truc [tham khao can xac minh] thay vi bia dat.\n' +
'\n' +
'Ngu canh:\n' +
'P: ' + (pico?.p || '(chua co)') + '\n' +
'I: ' + (pico?.i || '(chua co)') + '\n' +
'C: ' + (pico?.c || '(chua co)') + '\n' +
'O: ' + (pico?.o || '(chua co)') + '\n' +
'Cau hoi nghien cuu: ' + (rq || '(chua co)') + '\n' +
'Muc tieu chinh: ' + (mainObj || '(chua co)') + '\n' +
'Muc tieu phu:\n' + subsStr + '\n' +
'\n' +
'Trich luoc PDF (neu co):\n' + (pdfText || '(khong co)')
    );
  }

  function buildEvaluatePrompt(title, content, pico, rq, mainObj, subObjs) {
    const subsStr = Array.isArray(subObjs) && subObjs.length
      ? subObjs.map((s,i)=> (i+1)+'. '+s).join('\n')
      : '(chua co)';

    return (
'Ban la phan bien khoa hoc. Danh gia muc tong quan "' + (title || '') + '" duoi day theo tieu chi:\n' +
'- Bao quat dung trong tam muc (khong lan sang tieu muc khac)\n' +
'- Cap nhat/khach quan; lien ket voi PICO, cau hoi, muc tieu\n' +
'- Tinh ro rang, mach lac, dung chuan hoc thuat\n' +
'- Goi y chinh sua co the hanh dong ngay (bullet ngan)\n' +
'Tra ve Markdown (khong JSON).\n' +
'\n' +
'--- NOI DUNG CAN DANH GIA ---\n' + (content || '') + '\n' +
'\n' +
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

  // ---------------- Helpers ----------------
  function safeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }

  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  // Phân tích trả lời của GPT:
  // - Nếu là JSON {content_md, references[]} → ghép thành Markdown + “Tài liệu tham khảo”
  // - Nếu không phải JSON, trả y nguyên (nhưng vẫn ổn vì GPT có thể đã chèn TLTK ở cuối)
  function toMarkdownWithRefs(raw) {
    const s = String(raw ?? '').trim();
    if (!s) return '';

    const fenced = s.match(/```(?:json)?\\s*([\\s\\S]*?)```/i);
    const jsonLike = fenced ? fenced[1] : (s.startsWith('{') ? s : '');

    if (jsonLike) {
      try {
        const j = JSON.parse(jsonLike);
        const body = String(j?.content_md || '').trim();
        const refs = Array.isArray(j?.references) ? j.references.map(x => String(x || '').trim()).filter(Boolean) : [];
        if (!body && refs.length === 0) return s;

        const mdRefs = refs.length
          ? '\\n\\n### Tài liệu tham khảo (AMA 11th)\\n' + refs.map((r,i)=> \`\${i+1}. \${r}\`).join('\\n')
          : '';
        return (body || '') + mdRefs;
      } catch {
        // không phải JSON hợp lệ → rơi xuống trả s
      }
    }
    return s;
  }

  // Gọi GPT theo binding từng step; fallback ctx.callGPT nếu backend lệch route
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') {
      try {
        const r = await ctx_.callStepGPT(bindingKey, prompt);
        const str = String(r ?? '');
        const looksModeration =
          /^\\s*\\{/.test(str) &&
          (/"id"\\s*:\\s*"modr-/i.test(str) || /"model"\\s*:\\s*".*moderation/i.test(str) || /"results"\\s*:\\s*\\[/i.test(str));
        if (!looksModeration) return str;
        console.warn('Backend trả moderation; fallback callGPT.', str);
        if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
        throw new Error('Moderation response & no fallback.');
      } catch (e) {
        if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
        throw e;
      }
    }
    if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
    throw new Error('Chưa cấu hình GPT cho step4.');
  }
}
