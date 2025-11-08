// Step 2 – Mục tiêu nghiên cứu (main + subs)
// Cần ctx: get/save/toast, extractTextFromPDF(file)
// và binding GPT theo step: ctx.callStepGPT(key, prompt) (có fallback sang ctx.callGPT)

export async function mount(rootEl, ctx) {
  // rootEl CHÍNH LÀ .card → không lồng .card mới
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Mục tiêu nghiên cứu</h3>
      <div class="card-subtitle">
        Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.
      </div>
    </div>

    <!-- Mục tiêu chính -->
    <div class="card-body">
      <label>Mục tiêu chính
        <textarea id="obj-main" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
      </label>
    </div>

    <!-- Mục tiêu phụ -->
    <div class="card-body">
      <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
      <div class="control-row" style="gap:8px">
        <input id="obj-sub-input" type="text" placeholder="Nhập mục tiêu phụ..." />
        <button id="obj-sub-add" class="btn btn-secondary" type="button">Thêm</button>
      </div>
      <div id="obj-sub-list" style="margin-top:.5rem"></div>
    </div>

    <!-- File + 2 nút GPT -->
    <div class="card-body control-row row-spaced">
      <input id="obj-pdf" type="file" accept="application/pdf" />
      <span id="obj-fname" class="muted">Chưa chọn tệp PDF</span>

      <div class="inline-row" style="gap:8px">
        <button id="obj-gpt"  class="btn btn-primary"  type="button">GPT gợi ý mục tiêu</button>
        <button id="obj-eval" class="btn btn-secondary" type="button">GPT đánh giá mục tiêu</button>
      </div>
    </div>

    <!-- Kết quả GPT – GỢI Ý -->
    <div id="obj-suggest-wrap" class="card-body" style="display:none">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <strong>Kết quả GPT – Gợi ý</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="obj-apply" class="btn btn-primary" type="button">Chèn vào ô</button>
          <button id="obj-copy-suggest" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-suggest" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="obj-suggest-ta" rows="8" placeholder='{"main":"...","subs":["...","..."]}'></textarea>
      <div class="muted" style="margin-top:.35rem">Nếu GPT trả Markdown có ```json hoặc dấu gạch đầu dòng, ứng dụng vẫn tự gỡ và parse JSON.</div>
    </div>

    <!-- Kết quả GPT – ĐÁNH GIÁ -->
    <div id="obj-eval-wrap" class="card-body" style="display:none">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
        <strong>Kết quả GPT – Đánh giá</strong>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button id="obj-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
          <button id="obj-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
        </div>
      </div>
      <textarea id="obj-eval-ta" rows="9" placeholder="Nhận xét theo SMART, bám PICO…"></textarea>
    </div>

    <div class="card-footer">
      <button id="obj-save" class="btn btn-primary" type="button">Lưu</button>
    </div>
  `.trim();

  // ===== Elements =====
  const mainEl     = rootEl.querySelector('#obj-main');

  const subInputEl = rootEl.querySelector('#obj-sub-input');
  const subAddBtn  = rootEl.querySelector('#obj-sub-add');
  const subListEl  = rootEl.querySelector('#obj-sub-list');

  const pdfEl      = rootEl.querySelector('#obj-pdf');
  const fnameChip  = rootEl.querySelector('#obj-fname');

  const saveBtn    = rootEl.querySelector('#obj-save');
  const gptBtn     = rootEl.querySelector('#obj-gpt');
  const evalBtn    = rootEl.querySelector('#obj-eval');

  const sWrap  = rootEl.querySelector('#obj-suggest-wrap');
  const sTA    = rootEl.querySelector('#obj-suggest-ta');
  const sApply = rootEl.querySelector('#obj-apply');
  const sCopy  = rootEl.querySelector('#obj-copy-suggest');
  const sHide  = rootEl.querySelector('#obj-hide-suggest');

  const eWrap  = rootEl.querySelector('#obj-eval-wrap');
  const eTA    = rootEl.querySelector('#obj-eval-ta');
  const eCopy  = rootEl.querySelector('#obj-copy-eval');
  const eHide  = rootEl.querySelector('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) { eTA.value = String(oldEval); eWrap.style.display = ''; }

  // ===== Sub objectives =====
  subAddBtn.addEventListener('click', () => {
    const v = (subInputEl.value || '').trim();
    if (!v) return;
    subObjectives.push(v);
    subInputEl.value = '';
    renderSubList();
  });

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives) || subObjectives.length === 0) {
      subListEl.innerHTML = '<div class="muted">Chưa có mục tiêu phụ.</div>';
      return;
    }
    subObjectives.forEach((txt, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.style.padding = '8px 0';
      row.style.borderBottom = '1px dashed var(--border)';

      const t = document.createElement('div');
      t.textContent = txt;

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.gap = '8px';

      const up = document.createElement('button');
      up.className = 'btn btn-ghost';
      up.textContent = '↑';
      up.title = 'Lên';
      up.onclick = () => {
        if (idx > 0) { [subObjectives[idx-1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx-1]]; renderSubList(); }
      };

      const down = document.createElement('button');
      down.className = 'btn btn-ghost';
      down.textContent = '↓';
      down.title = 'Xuống';
      down.onclick = () => {
        if (idx < subObjectives.length - 1) { [subObjectives[idx+1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx+1]]; renderSubList(); }
      };

      const del = document.createElement('button');
      del.className = 'btn btn-ghost';
      del.textContent = 'Xóa';
      del.onclick = () => { subObjectives.splice(idx, 1); renderSubList(); };

      controls.append(up, down, del);
      row.append(t, controls);
      subListEl.appendChild(row);
    });
  }

  // ===== Save =====
  saveBtn.addEventListener('click', () => {
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
    ctx.toast('Đã lưu mục tiêu');
  });

  // ===== File UI =====
  pdfEl.addEventListener('change', () => {
    const f = pdfEl.files?.[0];
    fnameChip.textContent = f ? (f.name || 'Đã chọn 1 tệp') : 'Chưa chọn tệp PDF';
  });

  // ===== GPT Suggest =====
  gptBtn.addEventListener('click', onSuggest);

  async function onSuggest() {
    try {
      toggleBusy(gptBtn, true, 'Đang gợi ý...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      let pdfText = '';
      const f = pdfEl?.files?.[0];
      if (f) {
        try {
          pdfText = await ctx.extractTextFromPDF(f);
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cắt bớt]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      const prompt = `
Bạn là trợ lý xây dựng đề cương RCT. Dựa trên PICO, câu hỏi nghiên cứu và (nếu có) tài liệu PDF,
hãy đề xuất MỘT mục tiêu chính và 2–5 mục tiêu phụ.

CHỈ TRẢ VỀ ĐÚNG 1 JSON HỢP LỆ, KHÔNG THÊM BẤT KỲ KÝ TỰ NÀO TRƯỚC/SAU, KHÔNG DÙNG \`\`\`json\`\`\`, KHÔNG BULLET:
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

      const raw = await callAI('step2.suggest', prompt, ctx);
      const parsed = parseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        const lines = [];
        if (parsed.main) lines.push('Mục tiêu chính: ' + parsed.main);
        (parsed.subs || []).forEach(x => lines.push('- ' + x));
        sTA.value = lines.join('\n');
        sWrap.style.display = '';
        ctx.toast('Đã nhận gợi ý từ GPT.');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT.');
    } finally {
      toggleBusy(gptBtn, false, 'GPT gợi ý mục tiêu');
    }
  }

  // Áp dụng gợi ý
  sApply.addEventListener('click', () => {
    const obj = parseObjectives(sTA.value);
    if (!obj) { ctx.toast('Không nhận diện được gợi ý hợp lệ.'); return; }
    if (obj.main) mainEl.value = obj.main;
    if (Array.isArray(obj.subs)) subObjectives = obj.subs.slice();
    renderSubList();
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', subObjectives);
    ctx.toast('Đã chèn gợi ý vào các ô.');
  });
  sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  sHide.addEventListener('click', () => (sWrap.style.display = 'none'));

  // ===== GPT Evaluate =====
  evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) { ctx.toast('Chưa có mục tiêu để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const prompt = `
Bạn là chuyên gia phương pháp RCT. Hãy đánh giá bộ mục tiêu sau theo tiêu chí SMART và bám PICO.
Trả lời gạch đầu dòng ngắn gọn (không trả JSON).

Mục tiêu chính:
${main || '(chưa có)'}

Mục tiêu phụ:
${subs.length ? subs.map((s,i)=> (i+1)+'. '+s).join('\n') : '(chưa có)'}

Tham chiếu PICO:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}

Câu hỏi nghiên cứu:
${rq || '(chưa có)'}
`.trim();

      const raw = await callAI('step2.evaluate', prompt, ctx);
      const text = String(raw || '').trim();
      eTA.value = text;
      eWrap.style.display = '';
      ctx.save('objectivesEval', eTA.value);
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá mục tiêu');
    }
  }

  eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  eHide.addEventListener('click', () => (eWrap.style.display = 'none'));

  // ===== Helpers =====

  // Parser “chống đạn”: gỡ ```json và gạch đầu dòng rồi parse JSON
  function parseObjectives(text) {
    const s = String(text || '').trim();
    if (!s) return null;

    const jsonCandidate = extractJsonCandidate(s);

    if (jsonCandidate) {
      try {
        const j = JSON.parse(jsonCandidate);
        const main = String(j?.main || '').trim();
        const subs = Array.isArray(j?.subs) ? j.subs.map(x => String(x || '').trim()).filter(Boolean) : [];
        if (main || subs.length) return { main, subs };
      } catch { /* tiếp tục fallback */ }
    }

    // Fallback: tách theo dòng “tự do”
    const L = s
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, '').trim())
      .filter(Boolean);

    if (L.length === 0) return null;

    let main = '';
    const subs = [];
    for (let i = 0; i < L.length; i++) {
      const ln = L[i];
      const m = ln.match(/^mục\s*tiêu\s*chính\s*:\s*(.+)$/iu);
      if (m) { main = m[1].trim(); continue; }
      if (!main) main = ln; else subs.push(ln);
    }
    return { main, subs };
  }

  // Lấy phần JSON dù bị bọc ```json hoặc có bullet ở đầu dòng
  function extractJsonCandidate(s) {
    const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) return stripBullets(fenced[1]);
    const i1 = s.indexOf('{');
    const i2 = s.lastIndexOf('}');
    if (i1 >= 0 && i2 > i1) {
      const raw = s.slice(i1, i2 + 1);
      return stripBullets(raw);
    }
    return '';
  }

  function stripBullets(raw) {
    return raw
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*[-*•]\s?/, ''))
      .join('\n')
      .trim();
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

  // Gọi GPT theo binding từng step; nếu server trả moderation JSON thì fallback callGPT
  async function callAI(bindingKey, prompt, ctx_) {
    if (typeof ctx_.callStepGPT === 'function') {
      try {
        const r = await ctx_.callStepGPT(bindingKey, prompt);
        const str = String(r ?? '');
        const looksModeration =
          /^\s*\{/.test(str) &&
          (/"id"\s*:\s*"modr-/i.test(str) || /"model"\s*:\s*".*moderation/i.test(str) || /"results"\s*:\s*\[/i.test(str));
        if (!looksModeration) return str;
        console.warn('[step2] Backend trả moderation; fallback callGPT.', str);
        if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
        throw new Error('Moderation response & no fallback.');
      } catch (e) {
        if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
        throw e;
      }
    }
    if (typeof ctx_.callGPT === 'function') return await ctx_.callGPT(prompt);
    throw new Error('Chưa cấu hình GPT cho step2.');
  }
}
