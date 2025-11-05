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

  <style>
    /* Chỉ phạm vi Step 5 */
    .mini-hint{ font-size:.85rem; color:var(--muted); margin-top:4px }
    .inline-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap }
    .summary-pill{
      display:inline-flex; gap:8px; align-items:center;
      border:1px solid var(--border); background:#fff; border-radius:999px;
      padding:.35rem .7rem; font-weight:600;
    }
    .form-input{ width:100%; border:1px solid var(--border); border-radius:10px; padding:.5rem .7rem; background:#fff }
  </style>

  <!-- Tóm tắt nhanh tự cập nhật -->
  <div class="card-body">
    <div class="inline-row" id="dsg-summary">
      <span class="summary-pill" id="sum-type">Thiết kế: —</span>
      <span class="summary-pill" id="sum-blind">Blinding: —</span>
      <span class="summary-pill" id="sum-alloc">Tỷ lệ: —</span>
      <span class="summary-pill" id="sum-arms">Số nhánh: —</span>
    </div>
  </div>

  <div class="card-body grid-2">
    <label>Loại thiết kế
      <select id="dsg-type" class="form-input">
        <option value="parallel">Song song (parallel)</option>
        <option value="crossover">Chéo (cross-over)</option>
      </select>
    </label>

    <label>Blinding
      <select id="dsg-blinding" class="form-input">
        <option value="none">Không che giấu</option>
        <option value="single">Đơn mù (single-blind)</option>
        <option value="double">Đôi mù (double-blind)</option>
      </select>
    </label>

    <label>Tỷ lệ phân bổ (allocation ratio)
      <input id="dsg-alloc" class="form-input" type="text" placeholder="1:1" />
      <div id="dsg-alloc-hint" class="mini-hint">Ví dụ: 1:1 (2 nhánh), 2:1 (2 nhánh), 1:1:1 (3 nhánh)</div>
    </label>

    <label>Số nhánh (2–6)
      <input id="dsg-arms" class="form-input" type="number" min="2" max="6" step="1" />
    </label>
  </div>

  <div class="card-body">
    <div class="inline-row" style="justify-content:space-between">
      <div style="font-weight:600">Tên các nhánh can thiệp</div>
      <div class="inline-row">
        <button id="dsg-reset-names" class="btn-ghost" type="button">Đặt lại tên mặc định</button>
      </div>
    </div>
    <div id="dsg-armnames" class="grid-2" style="margin-top:.5rem"></div>
  </div>

  <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="dsg-gpt-suggest" class="btn-outline">GPT gợi ý mô tả thiết kế</button>
    <button id="dsg-gpt-eval" class="btn-outline">GPT đánh giá mô tả</button>
  </div>

  <!-- Kết quả GPT – GỢI Ý -->
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

  <!-- Kết quả GPT – ĐÁNH GIÁ -->
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

  const ratioHint= rootEl.querySelector('#dsg-alloc-hint');

  // Summary pills
  const sumType  = rootEl.querySelector('#sum-type');
  const sumBlind = rootEl.querySelector('#sum-blind');
  const sumAlloc = rootEl.querySelector('#sum-alloc');
  const sumArms  = rootEl.querySelector('#sum-arms');

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

  const btnSuggest   = rootEl.querySelector('#dsg-gpt-suggest');
  const btnEval      = rootEl.querySelector('#dsg-gpt-eval');
  const btnSave      = rootEl.querySelector('#dsg-save');
  const btnResetName = rootEl.querySelector('#dsg-reset-names');

  // ------- Load state -------
  const dsg = ctx.get('design', {}) || {};
  const initType  = dsg.type || 'parallel';
  const initBlind = dsg.blinding || 'none';
  const initAlloc = dsg.allocationRatio || '1:1';
  const initArms  = clampInt(dsg.arms ?? 2, 2, 6);
  const initNames = Array.isArray(dsg.armNames) && dsg.armNames.length >= 2
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

  // Load đánh giá cũ nếu có
  const oldEval = ctx.get('design.evaluation', '');
  if (oldEval) { eTA.value = String(oldEval); evalBox.classList.remove('hidden'); }

  // ------- Events -------
  typeEl.addEventListener('change', () => {
    maybeSuggestCrossoverNames();
    updateSummary();
  });
  blindEl.addEventListener('change', updateSummary);

  allocEl.addEventListener('input', () => {
    updateRatioHint();
    updateSummary();
  });

  armsEl.addEventListener('change', () => {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    armsEl.value = String(n);
    // Cập nhật ratio nếu không khớp chiều dài
    const fixed = ensureRatioLength(n, allocEl.value || '1:1');
    if (fixed.changed) {
      allocEl.value = fixed.ratio;
      ctx.toast('Đã hiệu chỉnh tỷ lệ phân bổ để khớp số nhánh.');
    }
    // Giữ tên đã nhập, chỉ điền phần trống
    const curNames = readArmNames();
    renderArmInputs(n, curNames);
    maybeSuggestCrossoverNames();
    updateRatioHint();
    updateSummary();
  });

  btnResetName.addEventListener('click', () => {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    renderArmInputs(n, defaultArmNames(n, ctx), { force: true });
    ctx.toast('Đã đặt lại tên nhánh mặc định.');
  });

  btnSuggest.addEventListener('click', onSuggest);
  btnEval.addEventListener('click', onEvaluate);

  // copy / hide GPT boxes
  copySugg?.addEventListener('click', () => copyText(sTA.value || ''));
  hideSugg?.addEventListener('click', () => suggBox.classList.add('hidden'));
  copyEval?.addEventListener('click', () => copyText(eTA.value || ''));
  hideEval?.addEventListener('click', () => evalBox.classList.add('hidden'));

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
    // Kiểm tra ratio khớp số nhánh
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

    ctx.save('design', payload);
    ctx.save('interventions', armNames); // Step 10 dùng lại baseline
    try { localStorage.setItem('num-arms', String(nArms)); } catch {}

    updateSummary();
    ctx.toast('Đã lưu thiết kế & tên nhánh');
  }

  // ------- helpers -------
  function renderArmInputs(n, names, opts = {}) {
    const keepExisting = !opts.force;
    const current = keepExisting ? readArmNames() : [];
    namesBox.innerHTML = '';
    const base = padOrTrim(keepExisting ? mergeNames(current, names, n) : padOrTrim(names || [], n), n);

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
    // Giữ tên cũ nếu có; chỉ điền phần trống bằng newArr hoặc mặc định
    const out = [];
    for (let i = 0; i < n; i++) {
      const prev = (oldArr && oldArr[i] || '').trim();
      const nxt  = (newArr && newArr[i] || '').trim();
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
    return `Nhánh ${i + 1}`;
  }

  function defaultArmNames(n, ctx_) {
    const out = [];
    const pico = ctx_.get('pico', {}) || {};
    const I = safeShort(pico.i);
    const C = safeShort(pico.c);
    for (let i = 0; i < n; i++) out.push(defaultName(i));
    // Nếu có I/C thì tinh chỉnh tên 2 nhánh đầu
    if (I) out[0] = `Nhóm can thiệp (${I})`;
    if (C) out[1] = `Nhóm chứng (${C})`;
    return out;
  }

  function maybeSuggestCrossoverNames() {
    const t = typeEl.value;
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    if (t !== 'crossover' || n !== 2) return; // chỉ gợi ý khi 2 nhánh
    const pico = ctx.get('pico', {}) || {};
    const I = safeShort(pico.i);
    const C = safeShort(pico.c);
    if (!I || !C) return;

    const names = readArmNames();
    // Nếu đang là mặc định thì gợi ý tên theo trình tự
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
    return s.length > 40 ? s.slice(0, 37) + '…' : s;
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
    // tự căn cho đủ n phần bằng 1
    return { changed: true, ratio: new Array(n).fill(1).join(':') };
  }

  function ratioToPercents(str) {
    const arr = parseRatio(str);
    if (!arr) return null;
    const sum = arr.reduce((a,b) => a + b, 0);
    if (!sum) return null;
    return arr.map(x => Math.round((x / sum) * 1000) / 10); // 1 chữ số thập phân
  }

  function updateRatioHint() {
    const n = clampInt(parseInt(armsEl.value || '2', 10), 2, 6);
    const fixed = ensureRatioLength(n, allocEl.value || '1:1');
    if (fixed.changed) {
      ratioHint.textContent = 'Tỷ lệ hiện không khớp ' + n + ' nhánh → gợi ý: ' + fixed.ratio;
      return;
    }
    const per = ratioToPercents(allocEl.value || '');
    ratioHint.textContent = per ? ('Tương ứng ≈ ' + per.map(x => x + '%').join(' : ')) : 'Ví dụ: 1:1 (2 nhánh), 1:1:1 (3 nhánh)';
  }

  function updateSummary() {
    sumType.textContent  = `Thiết kế: ${typeEl.options[typeEl.selectedIndex]?.text || '—'}`;
    sumBlind.textContent = `Blinding: ${blindEl.options[blindEl.selectedIndex]?.text || '—'}`;
    sumAlloc.textContent = `Tỷ lệ: ${(allocEl.value || '—')}`;
    sumArms.textContent  = `Số nhánh: ${armsEl.value || '—'}`;
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

  /* ===== Prompts: ASCII-only, nối chuỗi để tránh lỗi token ===== */
  function buildSuggestPrompt(pico, rq, mainObj, subObjs, cur) {
    const subs = Array.isArray(subObjs) && subObjs.length
      ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\\n')
      : '(chua co)';
    return (
      'Ban la tro ly hoc thuat. Hay goi y mo ta thiet ke RCT ngan gon (2-4 doan), dua tren PICO, Cau hoi, Muc tieu va cac lua chon hien co.\\n' +
      'Yeu cau:\\n' +
      '- Neu ro loai thiet ke (song song/cheo), blinding, ty le phan bo, so nhanh va ten cac nhanh (theo dau vao), thoi gian theo doi (neu suy luan duoc), khung danh gia chinh.\\n' +
      '- Tra ve MARKDOWN thuan, khong them tai lieu tham khao.\\n\\n' +
      'Boi canh:\\n' +
      'P: ' + (pico && pico.p || '(chua co)') + '\\n' +
      'I: ' + (pico && pico.i || '(chua co)') + '\\n' +
      'C: ' + (pico && pico.c || '(chua co)') + '\\n' +
      'O: ' + (pico && pico.o || '(chua co)') + '\\n' +
      'Cau hoi nghien cuu: ' + (rq || '(chua co)') + '\\n' +
      'Muc tieu chinh: ' + (mainObj || '(chua co)') + '\\n' +
      'Muc tieu phu:\\n' + subs + '\\n\\n' +
      'Lua chon hien co:\\n' +
      '- Loai thiet ke: ' + (cur.type || '') + '\\n' +
      '- Blinding: ' + (cur.blinding || '') + '\\n' +
      '- Ty le phan bo: ' + (cur.allocationRatio || '') + '\\n' +
      '- So nhanh: ' + (cur.arms != null ? String(cur.arms) : '') + '\\n' +
      '- Ten nhanh: ' + ((cur.armNames && cur.armNames.length) ? cur.armNames.join(', ') : '(chua co)')
    );
  }

  function buildEvaluatePrompt(content, pico, rq, mainObj, subObjs) {
    const subs = Array.isArray(subObjs) && subObjs.length
      ? subObjs.map((s,i)=> (i+1) + '. ' + s).join('\\n')
      : '(chua co)';
    return (
      'Ban la phan bien khoa hoc. Hay DANH GIA mo ta thiet ke RCT sau theo cac tieu chi:\\n' +
      '- Tinh phu hop voi PICO/cau hoi/muc tieu\\n' +
      '- Ro rang va du cac thanh to (loai thiet ke, blinding, allocation, arms, theo doi, tieu chi chinh)\\n' +
      '- Tinh kha thi va rui ro thien lech co the phat sinh\\n' +
      '- Goi y chinh sua trong tam (bullet ngan gon)\\n' +
      'Tra ve MARKDOWN.\\n\\n' +
      '--- MO TA CAN DANH GIA ---\\n' +
      (content || '') + '\\n\\n' +
      '--- THAM CHIEU BOI CANH ---\\n' +
      'P: ' + (pico && pico.p || '(chua co)') + '\\n' +
      'I: ' + (pico && pico.i || '(chua co)') + '\\n' +
      'C: ' + (pico && pico.c || '(chua co)') + '\\n' +
      'O: ' + (pico && pico.o || '(chua co)') + '\\n' +
      'Cau hoi nghien cuu: ' + (rq || '(chua co)') + '\\n' +
      'Muc tieu chinh: ' + (mainObj || '(chua co)') + '\\n' +
      'Muc tieu phu:\\n' + subs
    );
  }
}
