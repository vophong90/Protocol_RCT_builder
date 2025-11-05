// src/steps/step2_objectives.js
// Step 2 – Mục tiêu nghiên cứu
// Cần ctx: get/save/toast, callGPT(prompt), extractTextFromPDF(file)

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div id="obj-card" class="card">
  <div class="card-header">
    <h3 class="card-title">Mục tiêu nghiên cứu</h3>
    <div class="card-subtitle">Đặt mục tiêu chính và các mục tiêu phụ; có thể nhờ GPT gợi ý từ PICO/Câu hỏi/PDF.</div>
  </div>

  <style>
    #obj-card .form-textarea {
      width: 100%;
      font: 500 15.5px/1.6 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: .9rem 1rem;
      outline: 0;
      min-height: 100px;
      resize: vertical;
    }
    #obj-card .form-input {
      width: 100%;
      font: 500 15px/1.4 Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, Helvetica, Arial;
      background: #fff;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: .6rem .75rem;
      outline: 0;
    }
    #obj-card .list-item {
      border-bottom: 1px dashed var(--border);
    }
    #obj-card .hidden { display: none !important; }
  </style>

  <!-- Mục tiêu chính -->
  <div class="card-body">
    <label>
      Mục tiêu chính
      <textarea id="obj-main" class="form-textarea" rows="3" placeholder="Nhập mục tiêu chính, bám PICO và câu hỏi nghiên cứu"></textarea>
    </label>
  </div>

  <!-- Mục tiêu phụ -->
  <div class="card-body">
    <div style="font-weight:600;margin-bottom:.5rem">Mục tiêu phụ</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:.5rem">
      <input id="obj-sub-input" type="text" class="form-input" placeholder="Nhập mục tiêu phụ..." style="flex:1;min-width:260px"/>
      <button id="obj-sub-add" class="btn-secondary" type="button">Thêm</button>
    </div>
    <div id="obj-sub-list" class="list"></div>
  </div>

  <!-- File + nút GPT -->
  <div class="card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between">
    <div style="flex:1;min-width:280px">
      <input id="obj-pdf" type="file" accept="application/pdf" />
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="obj-gpt"  class="btn-primary" type="button">GPT gợi ý mục tiêu</button>
      <button id="obj-eval" class="btn-primary" type="button">GPT đánh giá mục tiêu</button>
    </div>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
  <div id="obj-suggest-box" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px">
        <button id="obj-apply" class="btn-primary" type="button">Chèn vào ô</button>
        <button id="obj-copy-suggest" class="btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-suggest" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-suggest-ta" class="form-textarea" rows="8" placeholder="Mục tiêu chính: …&#10;- Mục tiêu phụ 1&#10;- Mục tiêu phụ 2"></textarea>
    </div>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
  <div id="obj-eval-box" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px">
        <button id="obj-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="obj-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="obj-eval-ta" class="form-textarea" rows="8" placeholder="Nhận xét theo SMART, bám PICO…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="obj-save" class="btn-primary">Lưu</button>
  </div>
</div>
`.trim();

  // ===== Elements =====
  const mainEl     = rootEl.querySelector('#obj-main');

  const subInputEl = rootEl.querySelector('#obj-sub-input');
  const subAddBtn  = rootEl.querySelector('#obj-sub-add');
  const subListEl  = rootEl.querySelector('#obj-sub-list');

  const pdfEl      = rootEl.querySelector('#obj-pdf');
  const saveBtn    = rootEl.querySelector('#obj-save');
  const gptBtn     = rootEl.querySelector('#obj-gpt');
  const evalBtn    = rootEl.querySelector('#obj-eval');

  const sBox   = rootEl.querySelector('#obj-suggest-box');
  const sTA    = rootEl.querySelector('#obj-suggest-ta');
  const sApply = rootEl.querySelector('#obj-apply');
  const sCopy  = rootEl.querySelector('#obj-copy-suggest');
  const sHide  = rootEl.querySelector('#obj-hide-suggest');

  const eBox   = rootEl.querySelector('#obj-eval-box');
  const eTA    = rootEl.querySelector('#obj-eval-ta');
  const eCopy  = rootEl.querySelector('#obj-copy-eval');
  const eHide  = rootEl.querySelector('#obj-hide-eval');

  // ===== Load state =====
  mainEl.value = ctx.get('mainObjective', '') || '';
  let subObjectives = Array.isArray(ctx.get('subObjectives', []))
    ? ctx.get('subObjectives')
    : [];
  renderSubList();

  const oldEval = ctx.get('objectivesEval', '');
  if (oldEval) { eTA.value = String(oldEval); eBox.classList.remove('hidden'); }

  // ===== Sub objectives =====
  if (subAddBtn) {
    subAddBtn.addEventListener('click', () => {
      const v = (subInputEl.value || '').trim();
      if (!v) return;
      subObjectives.push(v);
      subInputEl.value = '';
      renderSubList();
    });
  }

  function renderSubList() {
    subListEl.innerHTML = '';
    if (!Array.isArray(subObjectives) || subObjectives.length === 0) {
      subListEl.innerHTML = '<div style="opacity:.7">Chưa có mục tiêu phụ.</div>';
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
      upBtn.onclick = () => {
        if (idx > 0) { [subObjectives[idx-1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx-1]]; renderSubList(); }
      };

      const downBtn = document.createElement('button');
      downBtn.className = 'btn-ghost';
      downBtn.textContent = '↓';
      downBtn.title = 'Xuống';
      downBtn.onclick = () => {
        if (idx < subObjectives.length - 1) { [subObjectives[idx+1], subObjectives[idx]] = [subObjectives[idx], subObjectives[idx+1]]; renderSubList(); }
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.textContent = 'Xóa';
      delBtn.onclick = () => { subObjectives.splice(idx, 1); renderSubList(); };

      controls.append(upBtn, downBtn, delBtn);
      item.append(t, controls);
      subListEl.appendChild(item);
    });
  }

  // ===== Save =====
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      ctx.save('mainObjective', (mainEl.value || '').trim());
      ctx.save('subObjectives', Array.isArray(subObjectives) ? subObjectives : []);
      ctx.toast('Đã lưu mục tiêu');
    });
  }

  // ===== GPT Suggest =====
  if (gptBtn) gptBtn.addEventListener('click', onSuggest);

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
          if (pdfText.length > 6000) pdfText = pdfText.slice(0, 6000) + '\n...[cat bot]';
        } catch (e) {
          console.warn('PDF read error:', e);
          ctx.toast('Không đọc được PDF, sẽ chỉ dùng PICO và câu hỏi.');
        }
      }

      // dùng ASCII thuần trong phần marker "[cat bot]" để tránh token lạ
      const prompt = (
        'Ban la tro ly xay dung de cuong RCT. Dua tren PICO, cau hoi nghien cuu, va (neu co) tai lieu PDF, ' +
        'hay de xuat mot muc tieu chinh va 2-5 muc tieu phu.\n\n' +
        'YEU CAU TRA VE JSON THUAN:\n' +
        '{"main":"...","subs":["...","..."]}\n\n' +
        'PICO:\n' +
        'P: ' + (pico.p || '(chua co)') + '\n' +
        'I: ' + (pico.i || '(chua co)') + '\n' +
        'C: ' + (pico.c || '(chua co)') + '\n' +
        'O: ' + (pico.o || '(chua co)') + '\n\n' +
        'Cau hoi nghien cuu:\n' +
        (rq || '(chua co)') + '\n\n' +
        'Trich luoc tai lieu (neu co):\n' +
        (pdfText || '(khong co)')
      );

      const raw = await ctx.callGPT(prompt);
      const parsed = parseObjectives(raw);

      if (!parsed) {
        ctx.toast('GPT không trả về gợi ý hợp lệ.');
        console.warn('GPT raw reply (step2 suggest):', raw);
      } else {
        const lines = [];
        if (parsed.main) lines.push('Muc tieu chinh: ' + parsed.main);
        (parsed.subs || []).forEach(x => lines.push('- ' + x));
        sTA.value = lines.join('\n');
        sBox.classList.remove('hidden');
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
  if (sApply) sApply.addEventListener('click', () => {
    const obj = parseObjectives(sTA.value);
    if (!obj) { ctx.toast('Không nhận diện được gợi ý hợp lệ.'); return; }
    if (obj.main) mainEl.value = obj.main;
    if (Array.isArray(obj.subs)) subObjectives = obj.subs.slice();
    renderSubList();
    ctx.save('mainObjective', (mainEl.value || '').trim());
    ctx.save('subObjectives', subObjectives);
    ctx.toast('Đã chèn gợi ý vào các ô.');
  });
  if (sCopy) sCopy.addEventListener('click', () => copyText(sTA.value || ''));
  if (sHide) sHide.addEventListener('click', () => sBox.classList.add('hidden'));

  // ===== GPT Evaluate =====
  if (evalBtn) evalBtn.addEventListener('click', onEvaluate);

  async function onEvaluate() {
    const main = (mainEl.value || '').trim();
    const subs = Array.isArray(subObjectives) ? subObjectives : [];
    if (!main && subs.length === 0) { ctx.toast('Chưa có mục tiêu để đánh giá.'); return; }

    try {
      toggleBusy(evalBtn, true, 'Đang đánh giá...');
      const pico = ctx.get('pico', {}) || {};
      const rq   = ctx.get('researchQuestion', '') || '';

      const prompt = (
        'Ban la chuyen gia phuong phap RCT. Hay danh gia bo muc tieu sau theo tieu chi SMART va bam PICO. ' +
        'Tra ve gach dau dong ngan gon (khong tra JSON).\n\n' +
        'Muc tieu chinh:\n' +
        (main || '(chua co)') + '\n\n' +
        'Muc tieu phu:\n' +
        (subs.length ? subs.map((s,i)=> (i+1) + '. ' + s).join('\n') : '(chua co)') + '\n\n' +
        'Tham chieu PICO:\n' +
        'P: ' + (pico.p || '(chua co)') + '\n' +
        'I: ' + (pico.i || '(chua co)') + '\n' +
        'C: ' + (pico.c || '(chua co)') + '\n' +
        'O: ' + (pico.o || '(chua co)') + '\n\n' +
        'Cau hoi nghien cuu:\n' +
        (rq || '(chua co)')
      );

      const raw = await ctx.callGPT(prompt);
      const text = String(raw || '').trim();
      eTA.value = text;
      eBox.classList.remove('hidden');
      ctx.save('objectivesEval', eTA.value);
      ctx.toast('Đã nhận đánh giá từ GPT.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi đánh giá bằng GPT.');
    } finally {
      toggleBusy(evalBtn, false, 'GPT đánh giá mục tiêu');
    }
  }

  if (eCopy) eCopy.addEventListener('click', () => copyText(eTA.value || ''));
  if (eHide) eHide.addEventListener('click', () => eBox.classList.add('hidden'));

  // ===== Helpers =====
  function parseObjectives(text) {
    try {
      const j = JSON.parse(String(text));
      const main = String(j && j.main || '').trim();
      const subs = Array.isArray(j && j.subs) ? j.subs.map(s => String(s || '').trim()).filter(Boolean) : [];
      if (!main && subs.length === 0) return null;
      return { main, subs };
    } catch (_) {
      // fallback: tách theo dòng, nhận "Muc tieu chinh:" hoặc dòng đầu là chính
      const L = String(text || '')
        .split(/\r?\n/)
        .map(s => s.replace(/^\s*(?:\d+[.)]|[-*•])\s*/u, '').trim())
        .filter(Boolean);
      if (L.length === 0) return null;
      let main = '';
      const subs = [];
      for (let i = 0; i < L.length; i++) {
        const ln = L[i];
        const m = ln.match(/^m[uú]c\s*t[iê]u\s*ch[ií]nh\s*:\s*(.+)$/iu);
        if (m) { main = m[1].trim(); continue; }
        if (!main) main = ln; else subs.push(ln);
      }
      return { main, subs };
    }
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
