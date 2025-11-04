// src/steps/step1_question.js
// Step 1 – Câu hỏi nghiên cứu
// Giữ đúng baseline: nhập tay, GPT gợi ý từ PICO/PDF, GPT đánh giá, và Lưu.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Câu hỏi nghiên cứu</h3>
    <div class="card-subtitle">Bạn có thể nhập trực tiếp, hoặc dùng GPT gợi ý từ PICO/PDF.</div>
  </div>

  <div class="card-body">
    <textarea id="rq-text" rows="4" placeholder="Nhập câu hỏi nghiên cứu (một câu, rõ ràng, bám PICO)"></textarea>
  </div>

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input id="rq-pdf" type="file" accept="application/pdf" />
    <button id="rq-gpt" class="btn-outline">GPT gợi ý câu hỏi (từ PICO/PDF)</button>
    <small style="opacity:.8">Tùy chọn: chọn PDF trước khi bấm GPT.</small>
  </div>

  <div class="card-body" id="rq-suggest" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Gợi ý từ GPT:</div>
    <div id="rq-suggest-list" class="list"></div>
  </div>

  <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="rq-eval" class="btn-outline">GPT đánh giá câu hỏi</button>
  </div>

  <div class="card-body" id="rq-eval-out" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Đánh giá:</div>
    <div id="rq-eval-content" class="prose"></div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="rq-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ---- Elements ----
  const rqEl       = rootEl.querySelector('#rq-text');
  const pdfEl      = rootEl.querySelector('#rq-pdf');
  const gptBtn     = rootEl.querySelector('#rq-gpt');
  const saveBtn    = rootEl.querySelector('#rq-save');
  const evalBtn    = rootEl.querySelector('#rq-eval');
  const suggWrap   = rootEl.querySelector('#rq-suggest');
  const suggListEl = rootEl.querySelector('#rq-suggest-list');
  const evalWrap   = rootEl.querySelector('#rq-eval-out');
  const evalOutEl  = rootEl.querySelector('#rq-eval-content');

  // ---- Load state ----
  rqEl.value = ctx.get('researchQuestion', '') || '';
  const evalOld = ctx.get('researchQuestionEval', '');
  if (evalOld) {
    evalWrap.style.display = '';
    evalOutEl.innerHTML = toHtmlSafe(evalOld);
  }

  // ---- Save handler ----
  saveBtn.addEventListener('click', () => {
    ctx.save('researchQuestion', (rqEl.value || '').trim());
    ctx.toast('Đã lưu câu hỏi nghiên cứu');
  });

  // ---- GPT: Gợi ý câu hỏi từ PICO/PDF ----
  gptBtn.addEventListener('click', async () => {
    try {
      gptBtn.disabled = true;
      const prev = gptBtn.textContent;
      gptBtn.textContent = 'Đang gọi GPT...';

      const pico = ctx.get('pico', {}) || {};
      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.error(e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO hiện có.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO (và tài liệu nếu có), hãy đề xuất **3 câu hỏi nghiên cứu** rõ ràng, đúng tinh thần RCT, tiếng Việt, mỗi câu một dòng, ngắn gọn.

YÊU CẦU TRẢ VỀ JSON:
{"candidates":["câu 1","câu 2","câu 3"]}

PICO hiện có:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const suggestions = parseCandidates(raw);
      if (suggestions.length === 0) {
        ctx.toast('GPT không trả về gợi ý hợp lệ. Xem console để kiểm tra.');
        console.warn('GPT raw reply (step1 suggest):', raw);
      } else {
        renderSuggestions(suggestions);
        suggWrap.style.display = '';
        ctx.toast('Đã nhận gợi ý từ GPT');
      }

      gptBtn.textContent = prev;
      gptBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
      gptBtn.disabled = false;
      gptBtn.textContent = 'GPT gợi ý câu hỏi (từ PICO/PDF)';
    }
  });

  // ---- GPT: Đánh giá câu hỏi hiện tại ----
  evalBtn.addEventListener('click', async () => {
    const currentQ = (rqEl.value || '').trim();
    if (!currentQ) {
      ctx.toast('Bạn chưa nhập câu hỏi để đánh giá.');
      return;
    }
    try {
      evalBtn.disabled = true;
      const prev = evalBtn.textContent;
      evalBtn.textContent = 'Đang đánh giá...';

      const pico = ctx.get('pico', {}) || {};
      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy ĐÁNH GIÁ câu hỏi nghiên cứu dưới đây theo các tiêu chí, và TRẢ VỀ MARKDOWN GỌN GÀNG:

- Rõ ràng & tập trung (1–5)
- Bám PICO (1–5)
- Đo lường được (1–5)
- Khả thi & đạo đức (1–5)
- Gợi ý chỉnh sửa (gợi ý 1–3 câu)

Câu hỏi nghiên cứu: "${currentQ}"

PICO tham chiếu:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const md = String(raw || '').trim();
      if (!md) {
        ctx.toast('GPT không trả về nội dung.');
      } else {
        evalWrap.style.display = '';
        // Lưu bản gốc markdown (hoặc text) để giữ định dạng
        ctx.save('researchQuestionEval', md);
        // Hiển thị đơn giản (chấp nhận markdown thô; nếu bạn có markdown renderer thì thay thế)
        evalOutEl.innerHTML = toHtmlSafe(md).replace(/\n/g, '<br/>');
        ctx.toast('Đã cập nhật đánh giá');
      }

      evalBtn.textContent = prev;
      evalBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
      evalBtn.disabled = false;
      evalBtn.textContent = 'GPT đánh giá câu hỏi';
    }
  });

  // ---- Helpers ----
  function parseCandidates(text) {
    // Ưu tiên parse JSON {"candidates":[...]}
    try {
      const j = JSON.parse(String(text));
      const arr = Array.isArray(j?.candidates) ? j.candidates : [];
      return arr.map(x => String(x || '').trim()).filter(Boolean);
    } catch (_) { /* ignore */ }

    // Fallback: tách theo dòng/bullet
    const lines = String(text || '')
      .split(/\r?\n/)
      .map(s => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
      .filter(Boolean);

    // Lấy tối đa 3 dòng có vẻ là câu hỏi
    return lines.slice(0, 3);
  }

  function renderSuggestions(arr) {
    suggListEl.innerHTML = '';
    arr.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.padding = '8px 0';

      const txt = document.createElement('div');
      txt.textContent = s;

      const btn = document.createElement('button');
      btn.className = 'btn-secondary';
      btn.textContent = 'Chọn';
      btn.addEventListener('click', () => {
        rqEl.value = s;
        ctx.save('researchQuestion', (rqEl.value || '').trim());
        ctx.toast('Đã chọn gợi ý làm câu hỏi nghiên cứu');
      });

      item.appendChild(txt);
      item.appendChild(btn);
      suggListEl.appendChild(item);
    });
  }

  function toHtmlSafe(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
