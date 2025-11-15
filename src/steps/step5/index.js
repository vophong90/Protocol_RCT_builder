// src/steps/step5/index.js
// Step 5 – Thiết kế nghiên cứu (module tách UI/logic, dùng per-step GPT binding)

export const id = 5;
export const title = "Thiết kế nghiên cứu";
export const subtitle = "";
export const css = "./public/css/steps/step5.css"; // nhớ tạo/chỉnh file CSS (ở dưới)

export async function mount(rootEl, ctx) {
  // Gắn scope để CSS chỉ áp cho step này
  rootEl.closest('.step')?.setAttribute('data-scope', 'step5');

  // ---- UI ----
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Thiết kế nghiên cứu</h3>
      <div class="card-subtitle">
        Chọn loại thiết kế, mức blinding, tỷ lệ phân bổ và số nhánh. Tên nhánh sẽ được dùng lại ở Bước 10.
      </div>
    </div>

    <div id="dsg">
      <!-- Tóm tắt -->
      <div class="card-body">
        <div class="inline-row" id="dsg-summary">
          <span class="pill" id="sum-type">Thiết kế: —</span>
          <span class="pill" id="sum-blind">Blinding: —</span>
          <span class="pill" id="sum-alloc">Tỷ lệ: —</span>
          <span class="pill" id="sum-arms">Số nhánh: —</span>
      </div></div>

      <!-- Tham số chính -->
      <div class="card-body grid-2">
        <label>Loại thiết kế
          <select id="dsg-type" class="form-input">
            <option value="parallel">Song song (parallel)</option>
            <option value="crossover">Chéo (cross-over)</option>
          </select>
        </label>

        <label>Blinding
          <select id="dsg-blinding" class="form-input">
            <option value="none">Không làm mù</option>
            <option value="single">Mù đơn (single-blind)</option>
            <option value="double">Mù đôi (double-blind)</option>
          </select>
        </label>

        <label>Tỷ lệ phân bổ (allocation ratio)
          <input id="dsg-alloc" class="form-input" type="text" placeholder="1:1" />
        </label>

        <label>Số nhánh (2–6)
          <input id="dsg-arms" class="form-input" type="number" min="2" max="6" step="1" />
        </label>

        <div id="dsg-alloc-hint" class="muted full-span">
          Ví dụ: 1:1 (2 nhánh), 2:1 (2 nhánh), 1:1:1 (3 nhánh)
        </div>
      </div>

      <!-- Tên nhánh -->
      <div class="card-body">
        <div class="inline-row" style="justify-content:space-between">
          <div style="font-weight:700">Tên các nhánh can thiệp</div>
          <div class="inline-row">
            <button id="dsg-reset-names" class="btn btn-ghost" type="button">Đặt lại tên mặc định</button>
          </div>
        </div>
        <div id="dsg-armnames" class="grid-2" style="margin-top:.5rem"></div>
      </div>

      <!-- Nút GPT (2 nút cùng kích thước) -->
      <div class="card-body btn-row">
        <button id="dsg-gpt-suggest" class="btn btn-primary" type="button">GPT gợi ý mô tả thiết kế</button>
        <button id="dsg-gpt-eval"    class="btn btn-primary" type="button">GPT đánh giá mô tả</button>
      </div>

      <!-- Mô tả do người dùng soạn (ĐƯA LÊN TRƯỚC) -->
      <div class="card-body">
        <label>Mô tả thiết kế (tóm tắt)
          <textarea id="dsg-desc" class="form-input" rows="7" placeholder="Ví dụ: RCT song song, đôi mù, phân bổ 1:1 giữa nhóm can thiệp và nhóm chứng; thời gian theo dõi …"></textarea>
        </label>
      </div>

      <!-- Kết quả GPT – Gợi ý (ĐỨNG SAU MÔ TẢ) -->
      <div id="dsg-sugg-box" class="card hidden">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <strong>Kết quả GPT – Gợi ý</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="dsg-apply-replace" class="btn btn-primary"  type="button">Thay thế toàn bộ</button>
            <button id="dsg-apply-append"  class="btn btn-secondary" type="button">Chèn thêm vào cuối</button>
            <button id="dsg-copy-sugg"     class="btn btn-ghost"     type="button">Sao chép</button>
            <button id="dsg-hide-sugg"     class="btn btn-ghost"     type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="dsg-sugg-ta" class="form-input" rows="8" placeholder="(GPT) Mô tả thiết kế gợi ý bằng Markdown…"></textarea>
          <div class="muted">Nội dung do GPT sinh dựa trên PICO, Câu hỏi &amp; Mục tiêu.</div>
        </div>
      </div>

      <!-- Kết quả GPT – Đánh giá (ĐỨNG SAU GỢI Ý) -->
      <div id="dsg-eval-box" class="card hidden">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <strong>Kết quả GPT – Đánh giá</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="dsg-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
            <button id="dsg-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="dsg-eval-ta" class="form-input" rows="8" placeholder="(GPT) Nhận xét: rõ ràng, đủ thành tố, khả thi, thiên lệch…"></textarea>
        </div>
      </div>

      <div class="card-footer">
        <button id="dsg-save" class="btn btn-primary" type="button">Lưu thiết kế</button>
      </div>
    </div>
  `.trim();

  // ------- Elements -------
  const $ = (sel) => rootEl.querySelector(sel);

  const typeEl   = $('#dsg-type');
  const blindEl  = $('#dsg-blinding');
  const allocEl  = $('#dsg-alloc');
  const armsEl   = $('#dsg-arms');
  const namesBox = $('#dsg-armnames');
  const descEl   = $('#dsg-desc');
  const ratioHint= $('#dsg-alloc-hint');

  const sumType  = $('#sum-type');
  const sumBlind = $('#sum-blind');
  const sumAlloc = $('#sum-alloc');
  const sumArms  = $('#sum-arms');

  const suggBox  = $('#dsg-sugg-box');
  const sTA      = $('#dsg-sugg-ta');
  const applyRep = $('#dsg-apply-replace');
  const applyApp = $('#dsg-apply-append');
  const copySugg = $('#dsg-copy-sugg');
  const hideSugg = $('#dsg-hide-sugg');

  const evalBox  = $('#dsg-eval-box');
  const eTA      = $('#dsg-eval-ta');
  const copyEval = $('#dsg-copy-eval');
  const hideEval = $('#dsg-hide-eval');

  const btnSuggest   = $('#dsg-gpt-suggest');
  const btnEval      = $('#dsg-gpt-eval');
  const btnSave      = $('#dsg-save');
  const btnResetName = $('#dsg-reset-names');

  // ------- Load state -------
  const dsgState = ctx.get('design', {}) || {};
  const initType  = dsgState.type || 'parallel';
  const initBlind = dsgState.blinding || 'none';
  const initAlloc = dsgState.allocationRatio || '1:1';
  const initArms  = clampInt(dsgState.arms ?? 2, 2, 6);
  const initNames = Array.isArray(dsgState.armNames) && dsgState.armNames.length >= 2
    ? dsgState.armNames
    : defaultArmNames(initArms, ctx);

  typeEl.value  = initType;
  blindEl.value = initBlind;
  allocEl.value = initAlloc;
  armsEl.value  = String(initArms);
  descEl.value  = dsgState.description || '';

  renderArmInputs(initArms, initNames, { force: true });
  updateRatioHint();
  updateSummary();
  maybeSuggestCrossoverNames();

  const oldEval = dsgState.evaluation || '';
  if (oldEval) {
    eTA.value = String(oldEval);
    evalBox.classList.remove('hidden');
  }

  // ------- Events -------
  typeEl.addEventListener('change', () => { maybeSuggestCrossoverNames(); updateSummary(); });
  blindEl.addEventListener('change', updateSummary);
  allocEl.addEventListener('input', () => { updateRatioHint(); updateSummary(); });

  armsEl.addEventListener('change', () => {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    armsEl.value = String(n);
    const fixed = ensureRatioLength(n, allocEl.value || '1:1');
    if (fixed.changed) {
      allocEl.value = fixed.ratio;
      ctx.toast('Đã hiệu chỉnh tỷ lệ phân bổ để khớp số nhánh.');
    }
    const curNames = readArmNames();
    renderArmInputs(n, curNames);
    maybeSuggestCrossoverNames();
    updateRatioHint();
    updateSummary();
  });

  btnResetName?.addEventListener('click', () => {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    renderArmInputs(n, defaultArmNames(n, ctx), { force: true });
    ctx.toast('Đã đặt lại tên nhánh mặc định.');
  });

  btnSuggest.addEventListener('click', onSuggest);
  btnEval.addEventListener('click', onEvaluate);

  copySugg?.addEventListener('click', () => copyText(sTA.value || ''));
  hideSugg?.addEventListener('click', () => suggBox.classList.add('hidden'));
  copyEval?.addEventListener('click', () => copyText(eTA.value || ''));
  hideEval?.addEventListener('click', () => evalBox.classList.add('hidden'));

  btnSave.addEventListener('click', onSave);

  // ------- GPT handlers (per-step binding) -------
  async function onSuggest() {
    if (typeof ctx.callStepGPT !== 'function') {
      ctx.toast('Chưa cấu hình GPT binding (ctx.callStepGPT).');
      return;
    }
    try {
      toggleBusy(btnSuggest, true, 'Đang gọi GPT...');
      const pico    = ctx.get('pico', {}) || {};
      const rq      = ctx.get('researchQuestion', '') || '';
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const curType  = typeEl.value;
      const curBlind = blindEl.value;
      const curAlloc = safeText(allocEl.value || '1:1');
      const nArms    = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
      const armNames = readArmNames();

      const prompt = buildSuggestPrompt(pico, rq, mainObj, subObjs, {
        type: curType,
        blinding: curBlind,
        allocationRatio: curAlloc,
        arms: nArms,
        armNames
      });

      const md = String(await ctx.callStepGPT('step5.suggest', prompt) || '').trim();
      if (!md) {
        ctx.toast('GPT không trả về gợi ý.');
      } else {
        sTA.value = md;
        suggBox.classList.remove('hidden');
        applyRep.onclick = () => {
          descEl.value = sTA.value || '';
          const cur = ctx.get('design', {}) || {};
          ctx.save('design', { ...cur, description: (descEl.value || '').trim() });
          ctx.toast('Đã thay thế toàn bộ mô tả thiết kế');
        };
        applyApp.onclick = () => {
          const curStr = descEl.value || '';
          const addStr = sTA.value || '';
          descEl.value = curStr ? (curStr + '\n\n' + addStr) : addStr;
          const cur = ctx.get('design', {}) || {};
          ctx.save('design', { ...cur, description: (descEl.value || '').trim() });
          ctx.toast('Đã chèn thêm gợi ý vào cuối');
        };
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
    } finally {
      toggleBusy(btnSuggest, false, 'GPT gợi ý mô tả thiết kế');
    }
  }

  async function onEvaluate() {
    if (typeof ctx.callStepGPT !== 'function') {
      ctx.toast('Chưa cấu hình GPT binding (ctx.callStepGPT).');
      return;
    }
    const content = (descEl.value || '').trim();
    if (!content) {
      ctx.toast('Chưa có mô tả để đánh giá.');
      return;
    }
    try {
      toggleBusy(btnEval, true, 'Đang đánh giá...');
      const pico    = ctx.get('pico', {}) || {};
      const rq      = ctx.get('researchQuestion', '') || '';
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];

      const prompt = buildEvaluatePrompt(content, pico, rq, mainObj, subObjs);
      const md = String(await ctx.callStepGPT('step5.evaluate', prompt) || '').trim();

      if (!md) {
        ctx.toast('GPT không trả về đánh giá.');
      } else {
        eTA.value = md;
        evalBox.classList.remove('hidden');
        const cur = ctx.get('design', {}) || {};
        ctx.save('design', {
          ...cur,
          evaluation: md,
          lastEvaluatedAt: new Date().toISOString()
        });
        ctx.toast('Đã cập nhật đánh giá');
      }
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(btnEval, false, 'GPT đánh giá mô tả');
    }
  }

  // ------- Save -------
  function onSave() {
    const nArms  = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const fixed  = ensureRatioLength(nArms, allocEl.value || '1:1');
    if (fixed.changed) {
      allocEl.value = fixed.ratio;
      ctx.toast('Đã hiệu chỉnh tỷ lệ phân bổ để khớp số nhánh.');
    }

    const armNames = padOrTrim(readArmNames(), nArms).map(s => safeText(s) || '');
    const payload = {
      type: typeEl.value,
      blinding: blindEl.value,
      allocationRatio: (allocEl.value || '1:1').trim(),
      arms: nArms,
      armNames,
      description: (descEl.value || '').trim(),
    };

    ctx.save('design', { ...(ctx.get('design', {}) || {}), ...payload });
    ctx.save('interventions', armNames); // Step 10 dùng lại
    try { localStorage.setItem('num-arms', String(nArms)); } catch {}

    updateSummary();
    ctx.toast('Đã lưu thiết kế & tên nhánh');
  }

  // ------- Helpers (không đổi) -------
  function renderArmInputs(n, names, opts = {}) {
    const keepExisting = !opts.force;
    const current = keepExisting ? readArmNames() : [];
    namesBox.innerHTML = '';
    const base = padOrTrim(
      keepExisting ? mergeNames(current, names, n) : padOrTrim(names || [], n),
      n
    );

    for (let i = 0; i < n; i++) {
      const wrap = document.createElement('div');
      wrap.innerHTML = `
        <label>Tên nhánh ${i + 1}
          <input class="form-input" type="text" data-arm-index="${i}" placeholder="${defaultName(i)}" />
        </label>
      `.trim();
      const inp = wrap.querySelector('input');
      inp.value = base[i] || '';
      namesBox.appendChild(wrap);
    }
  }

  function mergeNames(oldArr, newArr, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const prev = ((oldArr && oldArr[i]) || '').trim();
      const nxt  = ((newArr && newArr[i]) || '').trim();
      out.push(prev || nxt || defaultName(i));
    }
    return out;
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
    return 'Nhánh ' + (i + 1);
  }

  function defaultArmNames(n, ctx_) {
    const out = [];
    const pico = ctx_.get('pico', {}) || {};
    const I = safeShort(pico.i);
    const C = safeShort(pico.c);
    for (let i = 0; i < n; i++) out.push(defaultName(i));
    if (I) out[0] = `Nhóm can thiệp (${I})`;
    if (C) out[1] = `Nhóm chứng (${C})`;
    return out;
  }

  function maybeSuggestCrossoverNames() {
    const t = typeEl.value;
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    if (t !== 'crossover' || n !== 2) return;
    const pico = ctx.get('pico', {}) || {};
    const I = safeShort(pico.i);
    const C = safeShort(pico.c);
    if (!I || !C) return;

    const names = readArmNames();
    const looksDefault =
      (names[0] || '').toLowerCase().startsWith('nhóm can thiệp') &&
      (names[1] || '').toLowerCase().startsWith('nhóm chứng');
    if (looksDefault) {
      renderArmInputs(2, [`Trình tự ${I}→${C}`, `Trình tự ${C}→${I}`]);
    }
  }

  function clampInt(v, min, max) {
    v = Number.isFinite(v) ? v : min;
    return Math.min(Math.max(v, min), max);
  }
  function safeText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }
  function safeShort(s) {
    s = safeText(s);
    return s.length > 40 ? (s.slice(0, 37) + '…') : s;
  }
  function parseRatio(str) {
    const parts = String(str || '').split(':').map(s => s.trim()).filter(Boolean);
    const nums  = parts.map(x => Number(x));
    if (nums.length === 0 || nums.some(x => !Number.isFinite(x) || x <= 0)) return null;
    return nums;
  }
  function ensureRatioLength(n, ratioStr) {
    const arr = parseRatio(ratioStr);
    if (!arr) return { changed: true, ratio: new Array(n).fill(1).join(':') };
    if (arr.length === n) return { changed: false, ratio: ratioStr };
    return { changed: true, ratio: new Array(n).fill(1).join(':') };
  }
  function ratioToPercents(str) {
    const arr = parseRatio(str);
    if (!arr) return null;
    const sum = arr.reduce((a,b) => a + b, 0);
    if (!sum) return null;
    return arr.map(x => Math.round((x / sum) * 1000) / 10);
  }
  function updateRatioHint() {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const fixed = ensureRatioLength(n, allocEl.value || '1:1');
    if (fixed.changed) {
      ratioHint.textContent = `Tỷ lệ hiện không khớp ${n} nhánh → gợi ý: ${fixed.ratio}`;
      return;
    }
    const per = ratioToPercents(allocEl.value || '');
    ratioHint.textContent = per
      ? ('Tương ứng ≈ ' + per.map(x => x + '%').join(' : '))
      : 'Ví dụ: 1:1 (2 nhánh), 1:1:1 (3 nhánh)';
  }
  function updateSummary() {
    const typeTxt  = typeEl.options[typeEl.selectedIndex]?.text || '—';
    const blindTxt = blindEl.options[blindEl.selectedIndex]?.text || '—';
    sumType.textContent  = 'Thiết kế: ' + typeTxt;
    sumBlind.textContent = 'Blinding: ' + blindTxt;
    sumAlloc.textContent = 'Tỷ lệ: ' + (allocEl.value || '—');
    sumArms.textContent  = 'Số nhánh: ' + (armsEl.value || '—');
  }
  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }
  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) {
      btn.disabled = true;
      btn.dataset.prev = btn.textContent || '';
      btn.textContent = 'Đang xử lý...';
    } else {
      btn.disabled = false;
      btn.textContent = label || btn.dataset.prev || '';
    }
  }

  // ----- Prompt builders -----
  function buildSuggestPrompt(pico, rq, mainObj, subObjs, cur) {
    const sub = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map((s,i)=> `${i+1}. ${s}`).join('\n')
      : '(chưa có)';
    return [
      'Bạn là trợ lý học thuật. Hãy gợi ý mô tả thiết kế RCT ngắn gọn (2–4 đoạn), dựa trên PICO, Câu hỏi, Mục tiêu và các lựa chọn hiện có.',
      'Yêu cầu:',
      '- Nêu rõ loại thiết kế (song song/chéo), blinding, tỷ lệ phân bổ, số nhánh và tên các nhánh (theo đầu vào), thời gian theo dõi (nếu suy luận được), khung đánh giá chính.',
      '- Trả về MARKDOWN thuần, không thêm tài liệu tham khảo.',
      '',
      'Bối cảnh:',
      `P: ${pico.p || '(chưa có)'}`,
      `I: ${pico.i || '(chưa có)'}`,
      `C: ${pico.c || '(chưa có)'}`,
      `O: ${pico.o || '(chưa có)'}`,
      `Câu hỏi nghiên cứu: ${rq || '(chưa có)'}`,
      `Mục tiêu chính: ${mainObj || '(chưa có)'}`,
      'Mục tiêu phụ:',
      sub,
      '',
      'Lựa chọn hiện có:',
      `- Loại thiết kế: ${cur.type}`,
      `- Blinding: ${cur.blinding}`,
      `- Tỷ lệ phân bổ: ${cur.allocationRatio}`,
      `- Số nhánh: ${cur.arms}`,
      `- Tên nhánh: ${(cur.armNames && cur.armNames.length) ? cur.armNames.join(', ') : '(chưa có)'}`
    ].join('\n');
  }

  function buildEvaluatePrompt(content, pico, rq, mainObj, subObjs) {
    const sub = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map((s,i)=> `${i+1}. ${s}`).join('\n')
      : '(chưa có)';
    return [
      'Bạn là phản biện khoa học. Hãy đánh giá mô tả thiết kế RCT sau theo các tiêu chí:',
      '- Tính phù hợp với PICO/câu hỏi/mục tiêu',
      '- Rõ ràng và đủ các thành tố (loại thiết kế, blinding, allocation, arms, theo dõi, tiêu chí chính)',
      '- Tính khả thi và rủi ro thiên lệch có thể phát sinh',
      '- Gợi ý chỉnh sửa trọng tâm (bullet ngắn gọn)',
      'Trả về MARKDOWN.',
      '',
      '--- MÔ TẢ CẦN ĐÁNH GIÁ ---',
      content,
      '',
      '--- THAM CHIẾU BỐI CẢNH ---',
      `P: ${pico.p || '(chưa có)'}`,
      `I: ${pico.i || '(chưa có)'}`,
      `C: ${pico.c || '(chưa có)'}`,
      `O: ${pico.o || '(chưa có)'}`,
      `Câu hỏi nghiên cứu: ${rq || '(chưa có)'}`,
      `Mục tiêu chính: ${mainObj || '(chưa có)'}`,
      'Mục tiêu phụ:',
      sub
    ].join('\n');
  }
}
