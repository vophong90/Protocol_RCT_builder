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

  <div class="card-body">
    <table class="table-kv" id="dsg-summary">
      <tbody>
        <tr><td>Thiết kế</td><td id="sum-type">—</td></tr>
        <tr><td>Blinding</td><td id="sum-blind">—</td></tr>
        <tr><td>Tỷ lệ phân bổ</td><td id="sum-alloc">—</td></tr>
        <tr><td>Số nhánh</td><td id="sum-arms">—</td></tr>
      </tbody>
    </table>
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
      <input id="dsg-alloc" class="form-input" type="text" placeholder="1:1" />
      <div id="dsg-alloc-hint" class="muted">Ví dụ: 1:1 (2 nhánh), 2:1 (2 nhánh), 1:1:1 (3 nhánh)</div>
    </label>

    <label>Số nhánh (2–6)
      <input id="dsg-arms" class="form-input" type="number" min="2" max="6" step="1" />
    </label>
  </div>

  <div class="card-body">
    <div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap">
      <div style="font-weight:600">Tên các nhánh can thiệp</div>
      <div>
        <button id="dsg-reset-names" class="btn btn-ghost" type="button">Đặt lại tên mặc định</button>
      </div>
    </div>
    <div id="dsg-armnames" class="grid-2" style="margin-top:.5rem"></div>
  </div>

  <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="dsg-gpt-suggest" class="btn btn-outline" type="button">GPT gợi ý mô tả thiết kế</button>
    <button id="dsg-gpt-eval" class="btn btn-outline" type="button">GPT đánh giá mô tả</button>
  </div>

  <div id="dsg-sugg-box" class="card hidden">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Gợi ý</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="dsg-apply-replace" class="btn btn-primary" type="button">Thay thế toàn bộ</button>
        <button id="dsg-apply-append"  class="btn btn-outline" type="button">Chèn thêm vào cuối</button>
        <button id="dsg-copy-sugg"      class="btn btn-ghost"   type="button">Sao chép</button>
        <button id="dsg-hide-sugg"      class="btn btn-ghost"   type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="dsg-sugg-ta" class="form-textarea" rows="8" placeholder="(GPT) Mô tả thiết kế gợi ý bằng Markdown…"></textarea>
    </div>
  </div>

  <div class="card-body">
    <label>Mô tả thiết kế (tóm tắt)
      <textarea id="dsg-desc" class="form-textarea" rows="7" placeholder="Ví dụ: RCT song song, đôi mù, phân bổ 1:1 giữa nhóm can thiệp và nhóm chứng; thời gian theo dõi ..."></textarea>
    </label>
  </div>

  <div id="dsg-eval-box" class="card hidden">
    <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
      <strong>Kết quả GPT – Đánh giá</strong>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="dsg-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="dsg-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="dsg-eval-ta" class="form-textarea" rows="8" placeholder="(GPT) Nhận xét theo tiêu chí rõ ràng, đủ thành tố, khả thi, rủi ro thiên lệch..."></textarea>
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:12px;flex-wrap:wrap">
    <button id="dsg-save" class="btn btn-primary" type="button">Lưu thiết kế</button>
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
  const ratioHint= rootEl.querySelector('#dsg-alloc-hint');

  const sumType  = rootEl.querySelector('#sum-type');
  const sumBlind = rootEl.querySelector('#sum-blind');
  const sumAlloc = rootEl.querySelector('#sum-alloc');
  const sumArms  = rootEl.querySelector('#sum-arms');

  const suggBox  = rootEl.querySelector('#dsg-sugg-box');
  const sTA      = rootEl.querySelector('#dsg-sugg-ta');
  const applyRep = rootEl.querySelector('#dsg-apply-replace');
  const applyApp = rootEl.querySelector('#dsg-apply-append');
  const copySugg = rootEl.querySelector('#dsg-copy-sugg');
  const hideSugg = rootEl.querySelector('#dsg-hide-sugg');

  const evalBox  = rootEl.querySelector('#dsg-eval-box');
  const eTA      = rootEl.querySelector('#dsg-eval-ta');
  const copyEval = rootEl.querySelector('#dsg-copy-eval');
  const hideEval = rootEl.querySelector('#dsg-hide-eval');

  const btnSuggest   = rootEl.querySelector('#dsg-gpt-suggest');
  const btnEval      = rootEl.querySelector('#dsg-gpt-eval');
  const btnSave      = rootEl.querySelector('#dsg-save');
  const btnResetName = rootEl.querySelector('#dsg-reset-names');

  // ------- Load state -------
  const dsg = ctx.get('design', {}) || {};
  const initType  = dsg.type || 'parallel';
  const initBlind = dsg.blinding || 'none';
  const initAlloc = dsg.allocationRatio || '1:1';
  const initArms  = clampInt(dsg.arms != null ? dsg.arms : 2, 2, 6);
  const initNames = (Array.isArray(dsg.armNames) && dsg.armNames.length >= 2)
    ? dsg.armNames
    : defaultArmNames(initArms, ctx);

  typeEl.value  = initType;
  blindEl.value = initBlind;
  allocEl.value = initAlloc;
  armsEl.value  = String(initArms);
  descEl.value  = dsg.description || '';

  renderArmInputs(initArms, initNames, { force: true });
  updateRatioHint();
  updateSummary();

  const oldEval = ctx.get('design.evaluation', '');
  if (oldEval) { eTA.value = String(oldEval); evalBox.classList.remove('hidden'); }

  // ------- Events -------
  typeEl.addEventListener('change', function () {
    maybeSuggestCrossoverNames();
    updateSummary();
  });
  blindEl.addEventListener('change', updateSummary);

  allocEl.addEventListener('input', function () {
    updateRatioHint();
    updateSummary();
  });

  armsEl.addEventListener('change', function () {
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

  btnResetName.addEventListener('click', function () {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    renderArmInputs(n, defaultArmNames(n, ctx), { force: true });
    ctx.toast('Đã đặt lại tên nhánh mặc định.');
  });

  btnSuggest.addEventListener('click', onSuggest);
  btnEval.addEventListener('click', onEvaluate);

  copySugg.addEventListener('click', function () { copyText(sTA.value || ''); });
  hideSugg.addEventListener('click', function () { suggBox.classList.add('hidden'); });
  copyEval.addEventListener('click', function () { copyText(eTA.value || ''); });
  hideEval.addEventListener('click', function () { evalBox.classList.add('hidden'); });

  btnSave.addEventListener('click', onSave);

  // ------- Handlers -------
  async function onSuggest() {
    try {
      toggleBusy(btnSuggest, true, 'Đang gọi GPT...');
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
        type: curType, blinding: curBlind, allocationRatio: curAlloc, arms: nArms, armNames: armNames
      });
      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();

      if (!md) {
        ctx.toast('GPT không trả về gợi ý.');
      } else {
        suggBox.classList.remove('hidden');
        sTA.value = md;

        applyRep.onclick = function () {
          descEl.value = sTA.value || '';
          ctx.save('design.description', (descEl.value || '').trim());
          ctx.toast('Đã thay thế toàn bộ mô tả thiết kế');
        };
        applyApp.onclick = function () {
          const cur = descEl.value || '';
          const add = sTA.value || '';
          descEl.value = cur ? (cur + '\\n\\n' + add) : add;
          ctx.save('design.description', (descEl.value || '').trim());
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
    const content = (descEl.value || '').trim();
    if (!content) {
      ctx.toast('Chưa có mô tả để đánh giá.');
      return;
    }
    try {
      toggleBusy(btnEval, true, 'Đang đánh giá...');
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
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(btnEval, false, 'GPT đánh giá mô tả');
    }
  }

  function onSave() {
    const nArms  = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const fixed  = ensureRatioLength(nArms, allocEl.value || '1:1');
    if (fixed.changed) {
      allocEl.value = fixed.ratio;
      ctx.toast('Đã hiệu chỉnh tỷ lệ phân bổ để khớp số nhánh.');
    }

    const armNames = padOrTrim(readArmNames(), nArms).map(function (s) { return safeText(s) || ''; });
    const payload = {
      type: typeEl.value,
      blinding: blindEl.value,
      allocationRatio: (allocEl.value || '1:1').trim(),
      arms: nArms,
      armNames: armNames,
      description: (descEl.value || '').trim()
    };

    ctx.save('design', payload);
    ctx.save('interventions', armNames);
    try { localStorage.setItem('num-arms', String(nArms)); } catch (e) {}

    updateSummary();
    ctx.toast('Đã lưu thiết kế & tên nhánh');
  }

  // ------- helpers -------
  function renderArmInputs(n, names, opts) {
    opts = opts || {};
    const keepExisting = !opts.force;
    const current = keepExisting ? readArmNames() : [];
    namesBox.innerHTML = '';
    const base = padOrTrim(keepExisting ? mergeNames(current, names, n) : padOrTrim(names || [], n), n);

    for (let i = 0; i < n; i++) {
      const wrap = document.createElement('div');
      wrap.innerHTML = (
        '<label>Tên nhánh ' + (i + 1) + 
        '<input class="form-input" type="text" data-arm-index="' + i + '" placeholder="' + defaultName(i) + '" />' +
        '</label>'
      );
      const inp = wrap.querySelector('input');
      inp.value = base[i] || '';
      namesBox.appendChild(wrap);
    }
  }

  function mergeNames(oldArr, newArr, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const prev = (oldArr && oldArr[i] ? String(oldArr[i]) : '').trim();
      const nxt  = (newArr && newArr[i] ? String(newArr[i]) : '').trim();
      out.push(prev || nxt || defaultName(i));
    }
    return out;
  }

  function readArmNames() {
    const inputs = namesBox.querySelectorAll('input[data-arm-index]');
    const arr = [];
    for (let i = 0; i < inputs.length; i++) {
      const v = inputs[i].value || '';
      arr.push(v.trim());
    }
    return arr;
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
    if (I) out[0] = 'Nhóm can thiệp (' + I + ')';
    if (C) out[1] = 'Nhóm chứng (' + C + ')';
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
      (names[0] || '').toLowerCase().indexOf('nhóm can thiệp') === 0 &&
      (names[1] || '').toLowerCase().indexOf('nhóm chứng') === 0;
    if (looksDefault) {
      renderArmInputs(2, ['Trình tự ' + I + '->' + C, 'Trình tự ' + C + '->' + I]);
    }
  }

  function clampInt(v, min, max) {
    v = (Number.isFinite(v) ? v : min);
    return Math.min(Math.max(v, min), max);
  }

  function safeText(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function safeShort(s) {
    s = safeText(s);
    return s.length > 40 ? (s.slice(0, 37) + '...') : s;
  }

  function parseRatio(str) {
    const parts = String(str || '').split(':').map(function (s) { return s.trim(); }).filter(Boolean);
    const nums  = parts.map(function (x) { return Number(x); });
    if (nums.length === 0 || nums.some(function (x) { return !Number.isFinite(x) || x <= 0; })) return null;
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
    const sum = arr.reduce(function (a, b) { return a + b; }, 0);
    if (!sum) return null;
    return arr.map(function (x) { return Math.round((x / sum) * 1000) / 10; });
  }

  function updateRatioHint() {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const fixed = ensureRatioLength(n, allocEl.value || '1:1');
    if (fixed.changed) {
      ratioHint.textContent = 'Tỷ lệ hiện không khớp ' + n + ' nhánh \u2192 gợi ý: ' + fixed.ratio;
      return;
    }
    const per = ratioToPercents(allocEl.value || '');
    ratioHint.textContent = per ? ('Tương ứng ≈ ' + per.map(function (x) { return x + '%'; }).join(' : ')) : 'Ví dụ: 1:1 (2 nhánh), 1:1:1 (3 nhánh)';
  }

  function updateSummary() {
    var typeOpt = typeEl.options[typeEl.selectedIndex];
    var blindOpt= blindEl.options[blindEl.selectedIndex];
    sumType.textContent  = typeOpt ? typeOpt.text : '—';
    sumBlind.textContent = blindOpt ? blindOpt.text : '—';
    sumAlloc.textContent = (allocEl.value || '—');
    sumArms.textContent  = (armsEl.value || '—');
  }

  function copyText(t) {
    try { if (navigator.clipboard) { navigator.clipboard.writeText(t); ctx.toast('Đã sao chép.'); } }
    catch (e) { ctx.toast('Không sao chép được.'); }
  }

  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }

  function buildSuggestPrompt(pico, rq, mainObj, subObjs, cur) {
    const list = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\\n')
      : '(chưa có)';
    const names = (cur.armNames && cur.armNames.length) ? cur.armNames.join(', ') : '(chưa có)';
    return (
'Bạn là trợ lý học thuật. Hãy gợi ý **mô tả thiết kế RCT** ngắn gọn (2–4 đoạn), dựa trên PICO, Câu hỏi, Mục tiêu và các lựa chọn hiện có.\\n' +
'Yêu cầu:\\n' +
'- Nêu rõ loại thiết kế (song song/chéo), blinding, tỷ lệ phân bổ, số nhánh và tên các nhánh (theo đầu vào), thời gian theo dõi (nếu suy luận được), khung đánh giá chính.\\n' +
'- Trả về **MARKDOWN** thuần, không thêm tài liệu tham khảo.\\n\\n' +
'Bối cảnh:\\n' +
'P: ' + (pico.p || '(chưa có)') + '\\n' +
'I: ' + (pico.i || '(chưa có)') + '\\n' +
'C: ' + (pico.c || '(chưa có)') + '\\n' +
'O: ' + (pico.o || '(chưa có)') + '\\n' +
'Câu hỏi nghiên cứu: ' + (rq || '(chưa có)') + '\\n' +
'Mục tiêu chính: ' + (mainObj || '(chưa có)') + '\\n' +
'Mục tiêu phụ:\\n' + list + '\\n\\n' +
'Lựa chọn hiện có:\\n' +
'- Loại thiết kế: ' + cur.type + '\\n' +
'- Blinding: ' + cur.blinding + '\\n' +
'- Tỷ lệ phân bổ: ' + cur.allocationRatio + '\\n' +
'- Số nhánh: ' + cur.arms + '\\n' +
'- Tên nhánh: ' + names
    );
  }

  function buildEvaluatePrompt(content, pico, rq, mainObj, subObjs) {
    const list = (Array.isArray(subObjs) && subObjs.length)
      ? subObjs.map(function (s, i) { return (i + 1) + '. ' + s; }).join('\\n')
      : '(chưa có)';
    return (
'Bạn là phản biện khoa học. Hãy **đánh giá mô tả thiết kế RCT** sau theo các tiêu chí:\\n' +
'- Tính phù hợp với PICO/câu hỏi/mục tiêu\\n' +
'- Rõ ràng và đủ các thành tố (loại thiết kế, blinding, allocation, arms, theo dõi, tiêu chí chính)\\n' +
'- Tính khả thi và rủi ro thiên lệch có thể phát sinh\\n' +
'- Gợi ý chỉnh sửa trọng tâm (bullet ngắn gọn)\\n' +
'Trả về **MARKDOWN**.\\n\\n' +
'--- MÔ TẢ CẦN ĐÁNH GIÁ ---\\n' +
content + '\\n\\n' +
'--- THAM CHIẾU BỐI CẢNH ---\\n' +
'P: ' + (pico.p || '(chưa có)') + '\\n' +
'I: ' + (pico.i || '(chưa có)') + '\\n' +
'C: ' + (pico.c || '(chưa có)') + '\\n' +
'O: ' + (pico.o || '(chưa có)') + '\\n' +
'Câu hỏi nghiên cứu: ' + (rq || '(chưa có)') + '\\n' +
'Mục tiêu chính: ' + (mainObj || '(chưa có)') + '\\n' +
'Mục tiêu phụ:\\n' + list
    );
  }
}
