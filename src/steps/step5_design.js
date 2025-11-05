// src/steps/step5_design.js
// Step 5 – Thiết kế nghiên cứu (parallel/crossover + blinding + allocation + arms)
// Lưu vào state.design và state.interventions (tên nhánh) để Step 10 tái sử dụng.
// Đồng thời set localStorage 'num-arms' theo baseline.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Thiết kế nghiên cứu</h3>
    <div class="card-subtitle">
      Chọn loại thiết kế, mức blinding, tỷ lệ phân bổ và số nhánh can thiệp. Tên nhánh sẽ được sử dụng lại ở Bước 10.
    </div>
  </div>

  <div class="card-body grid-2">
    <label>Loại thiết kế
      <select id="dsg-type">
        <option value="parallel">Song song (parallel)</option>
        <option value="crossover">Chéo (cross-over)</option>
      </select>
    </label>

    <label>Blinding
      <select id="dsg-blinding">
        <option value="none">Không che giấu</option>
        <option value="single">Đơn mù (single-blind)</option>
        <option value="double">Đôi mù (double-blind)</option>
      </select>
    </label>

    <label>Tỷ lệ phân bổ (allocation ratio)
      <input id="dsg-alloc" type="text" placeholder="1:1" />
    </label>

    <label>Số nhánh (2–6)
      <input id="dsg-arms" type="number" min="2" max="6" step="1" />
    </label>
  </div>

  <div class="card-body">
    <div style="font-weight:600;margin-bottom:8px">Tên các nhánh can thiệp</div>
    <div id="dsg-armnames" class="grid-2"></div>
  </div>

  <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="dsg-gpt-suggest" class="btn-outline">GPT gợi ý mô tả thiết kế</button>
    <button id="dsg-gpt-eval" class="btn-outline">GPT đánh giá mô tả</button>
  </div>

  <!-- Kết quả GPT – GỢI Ý (textarea brand) -->
  <div id="dsg-sugg-box" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="dsg-apply-replace" class="btn-primary" type="button">Thay thế toàn bộ</button>
        <button id="dsg-apply-append"  class="btn-outline" type="button">Chèn thêm vào cuối</button>
        <button id="dsg-copy-sugg"      class="btn-ghost"   type="button">Sao chép</button>
        <button id="dsg-hide-sugg"      class="btn-ghost"   type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="dsg-sugg-ta" class="form-textarea" rows="8" placeholder="(GPT) Mô tả thiết kế gợi ý bằng Markdown…"></textarea>
    </div>
  </div>

  <div class="card-body">
    <label>Mô tả thiết kế (tóm tắt)
      <textarea id="dsg-desc" class="form-textarea" rows="7" placeholder="Ví dụ: RCT song song, đôi mù, phân bổ 1:1 giữa nhóm can thiệp và nhóm chứng; thời gian theo dõi …"></textarea>
    </label>
  </div>

  <!-- Kết quả GPT – ĐÁNH GIÁ (textarea brand) -->
  <div id="dsg-eval-box" class="card hidden" style="margin:0 16px 12px">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="dsg-copy-eval" class="btn-ghost" type="button">Sao chép</button>
        <button id="dsg-hide-eval" class="btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="dsg-eval-ta" class="form-textarea" rows="8" placeholder="(GPT) Nhận xét theo tiêu chí rõ ràng, đủ thành tố, khả thi, rủi ro thiên lệch…"></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="dsg-save" class="btn-primary">Lưu thiết kế</button>
  </div>
</div>
`.trim();

  // ------- Elements -------
  const typeEl   = rootEl.querySelector('#dsg-type');
  const blindEl  = rootEl.querySelector('#dsg-blinding');
  const allocEl  = rootEl.querySelector('#dsg-alloc');
  const armsEl   = rootEl.querySelector('#dsg-arms');
  const namesBox = rootEl.querySelector('#dsg-armnames');
  const descEl   = rootEl.querySelector('#dsg-desc');

  // GPT gợi ý (textarea)
  const suggBox  = rootEl.querySelector('#dsg-sugg-box');
  const sTA      = rootEl.querySelector('#dsg-sugg-ta');
  const applyRep = rootEl.querySelector('#dsg-apply-replace');
  const applyApp = rootEl.querySelector('#dsg-apply-append');
  const copySugg = rootEl.querySelector('#dsg-copy-sugg');
  const hideSugg = rootEl.querySelector('#dsg-hide-sugg');

  // GPT đánh giá (textarea)
  const evalBox  = rootEl.querySelector('#dsg-eval-box');
  const eTA      = rootEl.querySelector('#dsg-eval-ta');
  const copyEval = rootEl.querySelector('#dsg-copy-eval');
  const hideEval = rootEl.querySelector('#dsg-hide-eval');

  const btnSuggest = rootEl.querySelector('#dsg-gpt-suggest');
  const btnEval    = rootEl.querySelector('#dsg-gpt-eval');
  const btnSave    = rootEl.querySelector('#dsg-save');

  // ------- Load state -------
  const dsg = ctx.get('design', {}) || {};
  const initType  = dsg.type || 'parallel';
  const initBlind = dsg.blinding || 'none';
  const initAlloc = dsg.allocationRatio || '1:1';
  const initArms  = clampInt(dsg.arms ?? 2, 2, 6);
  const initNames = Array.isArray(dsg.armNames) && dsg.armNames.length >= 2
    ? dsg.armNames
    : defaultArmNames(initArms);

  typeEl.value  = initType;
  blindEl.value = initBlind;
  allocEl.value = initAlloc;
  armsEl.value  = String(initArms);
  descEl.value  = dsg.description || '';

  renderArmInputs(initArms, initNames);

  // ------- Events -------
  armsEl.addEventListener('change', () => {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    armsEl.value = String(n);
    const curNames = readArmNames();
    const next = (curNames.length === n)
      ? curNames
      : padOrTrim(curNames.length ? curNames : defaultArmNames(n), n);
    renderArmInputs(n, next);
  });

  btnSuggest.addEventListener('click', async () => {
    try {
      btnSuggest.disabled = true;
      const prev = btnSuggest.textContent;
      btnSuggest.textContent = 'Đang gọi GPT...';

      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainObj= ctx.get('mainObjective', '') || '';
      const subObjs= Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const curType  = typeEl.value;
      const curBlind = blindEl.value;
      const curAlloc = safeText(allocEl.value || '1:1');
      const nArms    = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
      const armNames = readArmNames();

      const prompt = buildSuggestPrompt(pico, rq, mainObj, subObjs, {
        type: curType, blinding: curBlind, allocationRatio: curAlloc, arms: nArms, armNames
      });
      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();

      if (!md) {
        ctx.toast('GPT không trả về gợi ý.');
      } else {
        suggBox.classList.remove('hidden');
        sTA.value = md;

        applyRep.onclick = () => {
          descEl.value = sTA.value || '';
          ctx.save('design.description', (descEl.value || '').trim());
          ctx.toast('Đã thay thế toàn bộ mô tả thiết kế');
        };
        applyApp.onclick = () => {
          const cur = descEl.value || '';
          const add = sTA.value || '';
          descEl.value = cur ? `${cur}\n\n${add}` : add;
          ctx.save('design.description', (descEl.value || '').trim());
          ctx.toast('Đã chèn thêm gợi ý vào cuối');
        };
      }

      btnSuggest.textContent = prev;
      btnSuggest.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
      btnSuggest.disabled = false;
      btnSuggest.textContent = 'GPT gợi ý mô tả thiết kế';
    }
  });

  btnEval.addEventListener('click', async () => {
    const content = (descEl.value || '').trim();
    if (!content) {
      ctx.toast('Chưa có mô tả để đánh giá.');
      return;
    }
    try {
      btnEval.disabled = true;
      const prev = btnEval.textContent;
      btnEval.textContent = 'Đang đánh giá...';

      const pico   = ctx.get('pico', {}) || {};
      const rq     = ctx.get('researchQuestion', '') || '';
      const mainObj= ctx.get('mainObjective', '') || '';
      const subObjs= Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const prompt = buildEvaluatePrompt(content, pico, rq, mainObj, subObjs);
      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();

      if (!md) {
        ctx.toast('GPT không trả về đánh giá.');
      } else {
        evalBox.classList.remove('hidden');
        eTA.value = md;
        ctx.save('design.evaluation', md);
        ctx.toast('Đã cập nhật đánh giá');
      }

      btnEval.textContent = prev;
      btnEval.disabled = false;
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
      btnEval.disabled = false;
      btnEval.textContent = 'GPT đánh giá mô tả';
    }
  });

  // copy / hide for GPT boxes
  copySugg?.addEventListener('click', () => copyText(sTA.value || ''));
  hideSugg?.addEventListener('click', () => suggBox.classList.add('hidden'));
  copyEval?.addEventListener('click', () => copyText(eTA.value || ''));
  hideEval?.addEventListener('click', () => evalBox.classList.add('hidden'));

  btnSave.addEventListener('click', () => {
    const nArms = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const armNames = padOrTrim(readArmNames(), nArms).map(s => safeText(s) || '');

    const payload = {
      type: typeEl.value,
      blinding: blindEl.value,
      allocationRatio: (allocEl.value || '1:1').trim(),
      arms: nArms,
      armNames,
      description: (descEl.value || '').trim(),
    };

    ctx.save('design', payload);
    ctx.save('interventions', armNames); // Step 10 dùng lại baseline
    try { localStorage.setItem('num-arms', String(nArms)); } catch {}

    ctx.toast('Đã lưu thiết kế & tên nhánh');
  });

  // ------- helpers -------
  function renderArmInputs(n, names) {
    namesBox.innerHTML = '';
    const list = padOrTrim(names || [], n);
    for (let i = 0; i < n; i++) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <label>Tên nhánh ${i + 1}
          <input type="text" data-arm-index="${i}" placeholder="${i === 0 ? 'Nhóm can thiệp' : i === 1 ? 'Nhóm chứng' : 'Nhánh ' + (i + 1)}" />
        </label>
      `.trim();
      const inp = wrap.querySelector('input');
      inp.value = list[i] || '';
      namesBox.appendChild(wrap);
    }
  }

  function readArmNames() {
    return Array.from(namesBox.querySelectorAll('input[data-arm-index]'))
      .map(inp => (inp.value || '').trim());
  }

  function padOrTrim(arr, n) {
    const out = (arr || []).slice(0, n);
    while (out.length < n) out.push(defaultName(out.length));
    return out;
  }

  function defaultName(i) {
    if (i === 0) return 'Nhóm can thiệp';
    if (i === 1) return 'Nhóm chứng';
    return `Nhánh ${i + 1}`;
  }
  function defaultArmNames(n) {
    const out = [];
    for (let i = 0; i < n; i++) out.push(defaultName(i));
    return out;
  }

  function clampInt(v, min, max) {
    v = Number.isFinite(v) ? v : min;
    return Math.min(Math.max(v, min), max);
  }

  function safeText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }

  function buildSuggestPrompt(pico, rq, mainObj, subObjs, cur) {
    return `
Bạn là trợ lý học thuật. Hãy gợi ý **mô tả thiết kế RCT** ngắn gọn (2–4 đoạn), dựa trên PICO, Câu hỏi, Mục tiêu và các lựa chọn hiện có.
Yêu cầu:
- Nêu rõ loại thiết kế (song song/chéo), blinding, tỷ lệ phân bổ, số nhánh và tên các nhánh (theo đầu vào), thời gian theo dõi (nếu suy luận được), khung đánh giá chính.
- Trả về **MARKDOWN** thuần, không thêm tài liệu tham khảo.

Bối cảnh:
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
Câu hỏi nghiên cứu: ${rq || '(chưa có)'}
Mục tiêu chính: ${mainObj || '(chưa có)'}
Mục tiêu phụ:
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\n') : '(chưa có)'}

Lựa chọn hiện có:
- Loại thiết kế: ${cur.type}
- Blinding: ${cur.blinding}
- Tỷ lệ phân bổ: ${cur.allocationRatio}
- Số nhánh: ${cur.arms}
- Tên nhánh: ${cur.armNames && cur.armNames.length ? cur.armNames.join(', ') : '(chưa có)'}
`.trim();
  }

  function buildEvaluatePrompt(content, pico, rq, mainObj, subObjs) {
    return `
Bạn là phản biện khoa học. Hãy **đánh giá mô tả thiết kế RCT** sau theo các tiêu chí:
- Tính phù hợp với PICO/câu hỏi/mục tiêu
- Rõ ràng và đủ các thành tố (loại thiết kế, blinding, allocation, arms, theo dõi, tiêu chí chính)
- Tính khả thi và rủi ro thiên lệch có thể phát sinh
- Gợi ý chỉnh sửa trọng tâm (bullet ngắn gọn)
Trả về **MARKDOWN**.

--- MÔ TẢ CẦN ĐÁNH GIÁ ---
${content}

--- THAM CHIẾU BỐI CẢNH ---
P: ${pico.p || '(chưa có)'}
I: ${pico.i || '(chưa có)'}
C: ${pico.c || '(chưa có)'}
O: ${pico.o || '(chưa có)'}
Câu hỏi nghiên cứu: ${rq || '(chưa có)'}
Mục tiêu chính: ${mainObj || '(chưa có)'}
Mục tiêu phụ:
${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\n') : '(chưa có)'}
`.trim();
  }
}
