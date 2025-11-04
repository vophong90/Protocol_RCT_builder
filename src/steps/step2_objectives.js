// src/steps/step2_objectives.js
// Step 2 – Mục tiêu nghiên cứu
// Baseline logic: nhập thủ công, GPT gợi ý (từ PICO + Research Question + PDF tùy chọn),
// quản lý mục tiêu phụ, GPT đánh giá, và Lưu.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Mục tiêu nghiên cứu</h3>
    <div class="card-subtitle">Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.</div>
  </div>

  <div class="card-body">
    <label>
      Mục tiêu chính
      <textarea id="obj-main" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
    </label>
  </div>

  <div class="card-body">
    <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:.5rem">
      <input id="obj-sub-input" type="text" placeholder="Nhập mục tiêu phụ..." style="flex:1;min-width:260px" />
      <button id="obj-sub-add" class="btn-secondary">Thêm</button>
    </div>
    <div id="obj-sub-list" class="list"></div>
  </div>

  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
    <input id="obj-pdf" type="file" accept="application/pdf" />
    <button id="obj-gpt" class="btn-outline">GPT gợi ý (từ PICO/Question/PDF)</button>
    <small style="opacity:.8">Tùy chọn: chọn PDF trước khi bấm GPT.</small>
  </div>

  <div class="card-body" id="obj-suggest" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Gợi ý từ GPT:</div>
    <div id="obj-suggest-content" class="prose"></div>
    <div style="margin-top:.75rem">
      <button id="obj-use-suggest" class="btn-secondary">Dùng gợi ý này</button>
    </div>
  </div>

  <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="obj-eval" class="btn-outline">GPT đánh giá mục tiêu</button>
  </div>

  <div class="card-body" id="obj-eval-wrap" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Đánh giá:</div>
    <div id="obj-eval-content" class="prose"></div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="obj-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ---------- Elements ----------
  const mainEl     = rootEl.querySelector('#obj-main');
  const subInputEl = rootEl.querySelector('#obj-sub-input');
  const subAddBtn  = rootEl.querySelector('#obj-sub-add');
  const subListEl  = rootEl.querySelector('#obj-sub-list');

  const pdfEl      = rootEl.querySelector('#obj-pdf');
  const gptBtn     = rootEl.querySelector('#obj-gpt');
  const suggWrap   = rootEl.querySelector('#obj-suggest');
  const suggBox    = rootEl.querySelector('#obj-suggest-content');
  const suggUseBtn = rootEl.querySelector('#obj-use-suggest');

  const evalBtn    = rootEl.querySelector('#obj-eval');
  const evalWrap   = rootEl.querySelector('#obj-eval-wrap');
  const evalOutEl  = rootEl.querySelector('#obj-eval-content');

  const saveBtn    = rootEl.querySelector('#obj-save');

  // ---------- Load state ----------
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives', []) : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) {
    evalWrap.style.display = '';
    evalOutEl.innerHTML = toHtmlSafe(oldEval).replace(/\n/g, '<br/>');
  }

  // ---------- Sub objectives handlers ----------
  subAddBtn.addEventListener('click', () => {
    const v = (subInputEl.value || '').trim();
    if (!v) return;
    subObjectives.push(v);
    subInputEl.value = '';
    renderSubList();
  });

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives)) subObjectives = [];
    if (subObjectives.length === 0) {
      subListEl.innerHTML = `<div style="opacity:.7">Chưa có mục tiêu phụ.</div>`;
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.padding = '8px 0';

      const t = document.createElement('div');
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';

      const upBtn = document.createElement('button');
      upBtn.className = 'btn-ghost';
      upBtn.textContent = '↑';
      upBtn.title = 'Lên';
      upBtn.addEventListener('click', () => {
        if (idx > 0) {
          const temp = subObjectives[idx - 1];
          subObjectives[idx - 1] = subObjectives[idx];
          subObjectives[idx] = temp;
          renderSubList();
        }
      });

      const downBtn = document.createElement('button');
      downBtn.className = 'btn-ghost';
      downBtn.textContent = '↓';
      downBtn.title = 'Xuống';
      downBtn.addEventListener('click', () => {
        if (idx < subObjectives.length - 1) {
          const temp = subObjectives[idx + 1];
          subObjectives[idx + 1] = subObjectives[idx];
          subObjectives[idx] = temp;
          renderSubList();
        }
      });

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.textContent = 'Xóa';
      delBtn.addEventListener('click', () => {
        subObjectives.splice(idx, 1);
        renderSubList();
      });

      controls.appendChild(upBtn);
      controls.appendChild(downBtn);
      controls.appendChild(delBtn);

      item.appendChild(t);
      item.appendChild(controls);
      subListEl.appendChild(item);
    });
  }

  // ---------- Save ----------
  saveBtn.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu');
  });

  // ---------- GPT suggest (from PICO + ResearchQuestion + optional PDF) ----------
  gptBtn.addEventListener('click', async () => {
    try {
      gptBtn.disabled = true;
      const prev = gptBtn.textContent;
      gptBtn.textContent = 'Đang gọi GPT...';

      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.error(e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO, câu hỏi nghiên cứu, và (nếu có) tài liệu PDF, hãy đề xuất **một mục tiêu chính** và **2–5 mục tiêu phụ**.

YÊU CẦU TRẢ VỀ JSON THUẦN:
{"main":"...","subs":["...","..."]}

PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}

Trích lược tài liệu (nếu có):
${pdfText || '(không có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const parsed = tryParseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ. Xem console để kiểm tra.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        renderSuggest(parsed);
        suggWrap.style.display = '';
        ctx.toast('Đã nhận gợi ý từ GPT');
      }

      gptBtn.textContent = prev;
      gptBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
      gptBtn.disabled = false;
      gptBtn.textContent = 'GPT gợi ý (từ PICO/Question/PDF)';
    }
  });

  function tryParseObjectives(text) {
    try {
      const j = JSON.parse(String(text));
      const main = String(j?.main || '').trim();
      const subs = Array.isArray(j?.subs) ? j.subs.map(s => String(s || '').trim()).filter(Boolean) : [];
      if (!main && subs.length === 0) return null;
      return { main, subs };
    } catch (_e) {
      // Fallback: tách theo dòng (dòng đầu là main, các dòng sau là subs)
      const lines = String(text || '')
        .split(/\r?\n/)
        .map(s => s.replace(/^\s*[-*\d.)]+\s*/, '').trim())
        .filter(Boolean);
      if (lines.length === 0) return null;
      const main = lines[0];
      const subs = lines.slice(1).slice(0, 5);
      return { main, subs };
    }
  }

  function renderSuggest(obj) {
    const main = obj.main ? `<p><strong>Mục tiêu chính:</strong> ${toHtmlSafe(obj.main)}</p>` : '';
    const subs = (obj.subs || []).length
      ? `<div><strong>Mục tiêu phụ:</strong><ul style="padding-left:1.25rem;margin:.25rem 0">${obj.subs.map(x => `<li>${toHtmlSafe(x)}</li>`).join('')}</ul></div>`
      : '';
    suggBox.innerHTML = main + subs;

    // Gắn sự kiện “Dùng gợi ý này”
    suggUseBtn.onclick = () => {
      if (obj.main) mainEl.value = obj.main;
      if (Array.isArray(obj.subs) && obj.subs.length) subObjectives = obj.subs.slice();
      renderSubList();
      ctx.save('mainObjective', (mainEl.value || '').trim());
      ctx.save('subObjectives', subObjectives);
      ctx.toast('Đã áp dụng gợi ý mục tiêu');
    };
  }

  // ---------- GPT evaluate ----------
  evalBtn.addEventListener('click', async () => {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) {
      ctx.toast('Chưa có mục tiêu để đánh giá.');
      return;
    }
    try {
      evalBtn.disabled = true;
      const prev = evalBtn.textContent;
      evalBtn.textContent = 'Đang đánh giá...';

      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đánh giá bộ mục tiêu sau theo tiêu chí SMART và bám PICO.
Trả về MARKDOWN ngắn gọn, có bullet và gợi ý chỉnh sửa nếu cần.

Mục tiêu chính:
${main || '(chưa có)'}

Mục tiêu phụ:
${subs.length ? subs.map((s,i)=>`${i+1}. ${s}`).join('\n') : '(chưa có)'}

Tham chiếu PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}
`.trim();

      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();
      if (!md) {
        ctx.toast('GPT không trả về nội dung đánh giá.');
      } else {
        evalWrap.style.display = '';
        ctx.save('objectivesEval', md);
        evalOutEl.innerHTML = toHtmlSafe(md).replace(/\n/g, '<br/>');
        ctx.toast('Đã cập nhật đánh giá');
      }

      evalBtn.textContent = prev;
      evalBtn.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
      evalBtn.disabled = false;
      evalBtn.textContent = 'GPT đánh giá mục tiêu';
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
