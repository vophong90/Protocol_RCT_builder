// src/steps/step5_design.js
// Step 5 – Thiết kế nghiên cứu (tương thích index.html mới)

export async function mount(rootEl, ctx) {
  // rootEl là .card → render trực tiếp
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Thiết kế nghiên cứu</h3>
      <div class="card-subtitle">
        Chọn loại thiết kế, mức blinding, tỷ lệ phân bổ và số nhánh. Tên nhánh sẽ được dùng lại ở Bước 10.
      </div>
    </div>

    <style>
      /* ===== Scoped vào #dsg để không ảnh hưởng step khác ===== */
      #dsg .hidden{display:none !important;}

      /* Pills tóm tắt */
      #dsg .pill{
        display:inline-flex; align-items:center; padding:.25rem .6rem;
        border-radius:999px; background:var(--muted); color:#fff;
        font:600 12.5px/1.1 Inter,ui-sans-serif; border:0;
      }

      /* Grid 2 cột riêng cho step này (không phá vỡ .grid-2 toàn cục) */
      #dsg .grid-2{
        display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr);
        gap:12px 16px; align-items:start;
      }
      #dsg .grid-2 > *{ min-width:0; }

      /* Bỏ margin-top mặc định của .card-body > * để không lệch hàng trong lưới */
      #dsg .card-body.grid-2 > *{ margin-top:0 !important; }

      /* Ô trải 2 cột khi cần */
      #dsg .full-span{ grid-column:1 / -1; }

      /* Nhãn & control */
      #dsg .grid-2 > label{
        display:flex; flex-direction:column; gap:6px; line-height:1.2;
      }
      #dsg .form-input{
        box-sizing:border-box; width:100%;
        font:500 15px/1.4 Inter,ui-sans-serif,-apple-system,"Segoe UI",Roboto,Helvetica,Arial;
        background:#fff; border:1px solid var(--border); border-radius:10px;
        padding:.6rem .75rem; outline:0;
      }
      #dsg input.form-input, #dsg select.form-input{ height:44px; }
      #dsg textarea.form-input{ resize:vertical; min-height:112px; }

      /* Hàng ngang linh hoạt */
      #dsg .inline-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

      /* Responsive */
      @media (max-width:900px){ #dsg .grid-2{ grid-template-columns:1fr; } }
    </style>

    <div id="dsg">
      <!-- Tóm tắt nhanh -->
      <div class="card-body">
        <div class="inline-row" id="dsg-summary">
          <span class="pill" id="sum-type">Thiết kế: —</span>
          <span class="pill" id="sum-blind">Blinding: —</span>
          <span class="pill" id="sum-alloc">Tỷ lệ: —</span>
          <span class="pill" id="sum-arms">Số nhánh: —</span>
        </div>
      </div>

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
            <button id="dsg-reset-names" class="btn-ghost" type="button">Đặt lại tên mặc định</button>
          </div>
        </div>
        <div id="dsg-armnames" class="grid-2" style="margin-top:.5rem"></div>
      </div>

      <!-- Nút GPT -->
      <div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <button id="dsg-gpt-suggest" class="btn-primary" type="button">GPT gợi ý mô tả thiết kế</button>
        <button id="dsg-gpt-eval"    class="btn-primary" type="button">GPT đánh giá mô tả</button>
      </div>

      <!-- Kết quả GPT – Gợi ý -->
      <div id="dsg-sugg-box" class="card hidden" style="margin:0 16px 12px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <strong>Kết quả GPT – Gợi ý</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="dsg-apply-replace" class="btn-primary"  type="button">Thay thế toàn bộ</button>
            <button id="dsg-apply-append"  class="btn-secondary" type="button">Chèn thêm vào cuối</button>
            <button id="dsg-copy-sugg"     class="btn-ghost"     type="button">Sao chép</button>
            <button id="dsg-hide-sugg"     class="btn-ghost"     type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="dsg-sugg-ta" class="form-input" rows="8" placeholder="(GPT) Mô tả thiết kế gợi ý bằng Markdown…"></textarea>
          <div class="muted">Nội dung do GPT sinh dựa trên PICO, Câu hỏi &amp; Mục tiêu.</div>
        </div>
      </div>

      <!-- Mô tả do người dùng soạn -->
      <div class="card-body">
        <label>Mô tả thiết kế (tóm tắt)
          <textarea id="dsg-desc" class="form-input" rows="7" placeholder="Ví dụ: RCT song song, đôi mù, phân bổ 1:1 giữa nhóm can thiệp và nhóm chứng; thời gian theo dõi …"></textarea>
        </label>
      </div>

      <!-- Kết quả GPT – Đánh giá -->
      <div id="dsg-eval-box" class="card hidden" style="margin:0 16px 12px">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <strong>Kết quả GPT – Đánh giá</strong>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button id="dsg-copy-eval" class="btn-ghost" type="button">Sao chép</button>
            <button id="dsg-hide-eval" class="btn-ghost" type="button">Ẩn</button>
          </div>
        </div>
        <div class="card-body">
          <textarea id="dsg-eval-ta" class="form-input" rows="8" placeholder="(GPT) Nhận xét: rõ ràng, đủ thành tố, khả thi, thiên lệch…"></textarea>
        </div>
      </div>

      <div class="card-footer">
        <button id="dsg-save" class="btn-primary" type="button">Lưu thiết kế</button>
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

  btnResetName.addEventListener('click', () => {
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

  // ------- Handlers -------
  async function onSuggest() {
    try {
      toggleBusy(btnSuggest, true, 'Đang gọi GPT...');
      const pico    = ctx.get('pico',
