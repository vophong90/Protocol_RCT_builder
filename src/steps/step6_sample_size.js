// src/steps/step6_sample_size.js
// Step 6 – Cỡ mẫu (baseline)
// Công thức minh bạch, không dùng GPT để tính. Có bù rớt mẫu và cảnh báo nhập sai.
// Lưu kết quả vào state.sampleSize { method, inputs, result }.
// Bổ sung: GPT gợi ý chọn công thức theo Mục tiêu + Thiết kế; GPT đánh giá giả định so với y văn.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Cỡ mẫu</h3>
    <div class="card-subtitle">
      Chọn công thức và nhập giả định. Hệ thống tính theo công thức minh bạch, có tuỳ chọn bù rớt mẫu.
    </div>
  </div>

  <style>
    .hidden { display: none !important; }
    .inline-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    table.ss-kv { width:100%; border-collapse:collapse; }
    table.ss-kv td { border:1px solid var(--border); padding:.45rem .6rem; vertical-align:top; }
    table.ss-kv td:first-child { width:38%; color:#374151; font-weight:600; }
  </style>

  <!-- Hàng chọn tham số chung -->
  <div class="card-body grid-3">
    <label>Phương pháp
      <select id="ss-method">
        <option value="means">So sánh trung bình 2 nhóm (t-test)</option>
        <option value="proportions">So sánh tỷ lệ 2 nhóm</option>
        <option value="ni_proportions">Non-inferiority (tỷ lệ)</option>
        <option value="crossover">Cross-over (trung bình, σ<sub>w</sub>)</option>
        <option value="anova">ANOVA (k nhóm, hiệu ứng f)</option>
        <option value="chisq">Chi-square (hiệu ứng w)</option>
        <option value="ancova">ANCOVA (2 nhóm, điều chỉnh theo R²)</option>
      </select>
    </label>

    <label>Alpha (mức ý nghĩa)
      <input id="ss-alpha" type="number" step="0.0001" min="0.0001" max="0.2" value="0.05" />
    </label>

    <label>Power
      <input id="ss-power" type="number" step="0.01" min="0.5" max="0.99" value="0.8" />
    </label>
  </div>

  <!-- Khối input tuỳ theo phương pháp -->
  <div class="card-body" id="ss-opts"></div>

  <!-- Rớt mẫu + số nhánh -->
  <div class="card-body grid-3">
    <label>% rớt mẫu dự kiến
      <input id="ss-drop" type="number" min="0" max="90" step="1" value="0" />
    </label>

    <label>Số nhánh (k, nếu cần)
      <input id="ss-arms" type="number" min="2" max="10" step="1" />
    </label>

    <div class="muted">
      Nếu đã chọn thiết kế ở Bước 5, số nhánh sẽ tự gợi ý theo đó.
    </div>
  </div>

  <!-- Cụm nút GPT -->
  <div class="card-body inline-row">
    <button id="ss-gpt-suggest" class="btn btn-primary" type="button">GPT gợi ý công thức</button>
    <button id="ss-gpt-eval"    class="btn btn-primary" type="button">GPT đánh giá giả định</button>
  </div>

  <!-- Hộp kết quả GPT gợi ý -->
  <div id="ss-sugg-box" class="card hidden">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
      <strong>Kết quả GPT – Gợi ý công thức</strong>
      <div class="inline-row">
        <button id="ss-apply-method" class="btn btn-primary"  type="button">Áp dụng phương pháp gợi ý</button>
        <button id="ss-copy-sugg"    class="btn btn-ghost"     type="button">Sao chép</button>
        <button id="ss-hide-sugg"    class="btn btn-ghost"     type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="ss-sugg-ta" rows="8" placeholder="(GPT) Lý do chọn công thức, tham số cần nhập, cảnh báo thiên lệch…"></textarea>
      <div class="muted">Mẹo: Kiểm tra từ khoá trong gợi ý (ANOVA/ANCOVA/t-test/proportions/NI/cross-over…) rồi bấm “Áp dụng”.</div>
    </div>
  </div>

  <!-- Hộp kết quả GPT đánh giá -->
  <div id="ss-eval-box" class="card hidden">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
      <strong>Kết quả GPT – Đánh giá giả định</strong>
      <div class="inline-row">
        <button id="ss-copy-eval" class="btn btn-ghost" type="button">Sao chép</button>
        <button id="ss-hide-eval" class="btn btn-ghost" type="button">Ẩn</button>
      </div>
    </div>
    <div class="card-body">
      <textarea id="ss-eval-ta" rows="8" placeholder="(GPT) Đối chiếu y văn: SD/tỷ lệ nền/biên NI/hiệu ứng f,w,R²… có hợp lý không? Tham khảo & khuyến nghị."></textarea>
    </div>
  </div>

  <!-- Tính & Lưu -->
  <div class="card-footer">
    <button id="ss-calc" class="btn btn-primary"  type="button">Tính cỡ mẫu</button>
    <button id="ss-save" class="btn btn-secondary" type="button">Lưu vào đề cương</button>
  </div>

  <!-- Output kết quả -->
  <div class="card-body hidden" id="ss-out">
    <div style="font-weight:700;margin-bottom:.5rem">Kết quả:</div>
    <div id="ss-out-html"></div>
  </div>
</div>
`.trim();

  // ---- elements
  const methodEl = rootEl.querySelector('#ss-method');
  const alphaEl  = rootEl.querySelector('#ss-alpha');
  const powerEl  = rootEl.querySelector('#ss-power');
  const dropEl   = rootEl.querySelector('#ss-drop');
  const armsEl   = rootEl.querySelector('#ss-arms');
  const optsBox  = rootEl.querySelector('#ss-opts');

  const btnCalc  = rootEl.querySelector('#ss-calc');
  const btnSave  = rootEl.querySelector('#ss-save');
  const outWrap  = rootEl.querySelector('#ss-out');
  const outHtml  = rootEl.querySelector('#ss-out-html');

  // GPT nodes
  const btnSugg  = rootEl.querySelector('#ss-gpt-suggest');
  const btnEval  = rootEl.querySelector('#ss-gpt-eval');

  const suggBox  = rootEl.querySelector('#ss-sugg-box');
  const sTA      = rootEl.querySelector('#ss-sugg-ta');
  const applyMethodBtn = rootEl.querySelector('#ss-apply-method');
  const copySugg = rootEl.querySelector('#ss-copy-sugg');
  const hideSugg = rootEl.querySelector('#ss-hide-sugg');

  const evalBox  = rootEl.querySelector('#ss-eval-box');
  const eTA      = rootEl.querySelector('#ss-eval-ta');
  const copyEval = rootEl.querySelector('#ss-copy-eval');
  const hideEval = rootEl.querySelector('#ss-hide-eval');

  // ---- init arms from design/localStorage
  const design = ctx.get('design', {}) || {};
  let kFromDesign = parseInt(design?.arms ?? 2, 10);
  if (!Number.isFinite(kFromDesign) || kFromDesign < 2) {
    try {
      const lsn = parseInt(localStorage.getItem('num-arms') || '2', 10);
      if (Number.isFinite(lsn) && lsn >= 2) kFromDesign = lsn;
    } catch {}
  }
  armsEl.value = String(kFromDesign || 2);

  // ---- restore previous inputs
  const saved = ctx.get('sampleSize', null);
  if (saved && saved.inputs) {
    try {
      methodEl.value = saved.method || methodEl.value;
      alphaEl.value  = String(saved.inputs.alpha ?? alphaEl.value);
      powerEl.value  = String(saved.inputs.power ?? powerEl.value);
      dropEl.value   = String(saved.inputs.dropout ?? dropEl.value);
      armsEl.value   = String(saved.inputs.k ?? armsEl.value);
    } catch {}
  }

  // Render input panel per method
  function renderMethodInputs() {
    const m = methodEl.value;
    let html = '';
    if (m === 'means') {
      html = `
      <div class="grid-3">
        <label>Độ lệch chuẩn chung (σ)
          <input id="m-sd" type="number" min="0.0001" step="0.0001" placeholder="ví dụ 12.0" />
        </label>
        <label>Hiệu số cần phát hiện (Δ = |μ1−μ2|)
          <input id="m-delta" type="number" min="0.0001" step="0.0001" placeholder="ví dụ 6.0" />
        </label>
        <label>Hai phía?
          <select id="m-sided">
            <option value="two">Two-sided</option>
            <option value="one">One-sided</option>
          </select>
        </label>
      </div>`;
    } else if (m === 'proportions') {
      html = `
      <div class="grid-3">
        <label>p1
          <input id="p-p1" type="number" min="0.0001" max="0.9999" step="0.0001" placeholder="0.30" />
        </label>
        <label>p2
          <input id="p-p2" type="number" min="0.0001" max="0.9999" step="0.0001" placeholder="0.50" />
        </label>
        <label>Hai phía?
          <select id="p-sided">
            <option value="two">Two-sided</option>
            <option value="one">One-sided</option>
          </select>
        </label>
      </div>`;
    } else if (m === 'ni_proportions') {
      html = `
      <div class="grid-3">
        <label>p<sub>new</sub>
          <input id="ni-p1" type="number" min="0.0001" max="0.9999" step="0.0001" placeholder="0.60" />
        </label>
        <label>p<sub>ctrl</sub>
          <input id="ni-p2" type="number" min="0.0001" max="0.9999" step="0.0001" placeholder="0.60" />
        </label>
        <label>Biên không thua kém (δ, tuyệt đối)
          <input id="ni-delta" type="number" min="0.0001" max="0.5" step="0.0001" placeholder="0.10" />
        </label>
        <div class="muted">Kiểm định một phía (one-sided).</div>
      </div>`;
    } else if (m === 'crossover') {
      html = `
      <div class="grid-3">
        <label>SD within-subject (σ<sub>w</sub>)
          <input id="x-sdw" type="number" min="0.0001" step="0.0001" placeholder="ví dụ 8.0" />
        </label>
        <label>Hiệu số cần phát hiện (Δ)
          <input id="x-delta" type="number" min="0.0001" step="0.0001" placeholder="ví dụ 4.0" />
        </label>
        <label>Hai phía?
          <select id="x-sided">
            <option value="two">Two-sided</option>
            <option value="one">One-sided</option>
          </select>
        </label>
      </div>
      <div class="muted">Kết quả là số <b>đối tượng</b> (tổng) cho cross-over 2 kỳ.</div>`;
    } else if (m === 'anova') {
      html = `
      <div class="grid-3">
        <label>Hiệu ứng f (Cohen's f)
          <input id="a-f" type="number" min="0.01" max="2" step="0.01" placeholder="0.25 (vừa)" />
        </label>
        <label>Số nhóm k
          <input id="a-k" type="number" min="3" max="10" step="1" />
        </label>
        <div class="muted">Xấp xỉ theo f. Trả về n/nhóm và tổng N ≈ k·n.</div>
      </div>`;
    } else if (m === 'chisq') {
      html = `
      <div class="grid-3">
        <label>Hiệu ứng w (Cohen's w)
          <input id="c-w" type="number" min="0.01" max="1.5" step="0.01" placeholder="0.3 (vừa)" />
        </label>
        <div></div><div class="muted">Tổng N ≈ ((Z<sub>α</sub>+Z<sub>β</sub>)²)/w².</div>
      </div>`;
    } else if (m === 'ancova') {
      html = `
      <div class="grid-3">
        <label>SD (σ, chưa điều chỉnh)
          <input id="ac-sd" type="number" min="0.0001" step="0.0001" placeholder="12.0" />
        </label>
        <label>Hiệu số Δ
          <input id="ac-delta" type="number" min="0.0001" step="0.0001" placeholder="6.0" />
        </label>
        <label>R² (giải thích bởi covariate)
          <input id="ac-r2" type="number" min="0" max="0.9" step="0.01" placeholder="0.3" />
        </label>
        <label>Hai phía?
          <select id="ac-sided">
            <option value="two">Two-sided</option>
            <option value="one">One-sided</option>
          </select>
        </label>
        <div class="muted">Điều chỉnh: nhân (1 − R²) vào cỡ mẫu của bài toán so sánh trung bình 2 nhóm.</div>
      </div>`;
    }
    optsBox.innerHTML = html.trim();

    // Prefill using saved
    if (saved && saved.method === m && saved.inputs) {
      const ip = saved.inputs;
      setIf('#m-sd', ip.sd);
      setIf('#m-delta', ip.delta);
      setIf('#m-sided', ip.sided);

      setIf('#p-p1', ip.p1);
      setIf('#p-p2', ip.p2);
      setIf('#p-sided', ip.sided);

      setIf('#ni-p1', ip.p1);
      setIf('#ni-p2', ip.p2);
      setIf('#ni-delta', ip.margin);

      setIf('#x-sdw', ip.sd_within);
      setIf('#x-delta', ip.delta);
      setIf('#x-sided', ip.sided);

      setIf('#a-f', ip.f);
      setIf('#a-k', ip.k);

      setIf('#c-w', ip.w);

      setIf('#ac-sd', ip.sd);
      setIf('#ac-delta', ip.delta);
      setIf('#ac-r2', ip.r2);
      setIf('#ac-sided', ip.sided);
    } else {
      // sensible defaults from design arms
      if (m === 'anova') setIf('#a-k', parseInt(armsEl.value || '3', 10));
    }
  }

  function setIf(sel, v) {
    const node = optsBox.querySelector(sel);
    if (node && (v ?? '') !== '') node.value = String(v);
  }

  methodEl.addEventListener('change', renderMethodInputs);
  renderMethodInputs();

  // ===== GPT Handlers =====
  btnSugg.addEventListener('click', onSuggest);
  btnEval.addEventListener('click', onEvaluate);
  copySugg?.addEventListener('click', () => copyText(sTA.value || ''));
  hideSugg?.addEventListener('click', () => suggBox.classList.add('hidden'));
  copyEval?.addEventListener('click', () => copyText(eTA.value || ''));
  hideEval?.addEventListener('click', () => evalBox.classList.add('hidden'));
  applyMethodBtn?.addEventListener('click', () => {
    const txt = (sTA.value || '').toLowerCase();
    const m = detectMethodFromText(txt);
    if (m) {
      methodEl.value = m;
      renderMethodInputs();
      ctx.toast(`Đã áp dụng phương pháp: ${labelOfMethod(m)}`);
    } else {
      ctx.toast('Không nhận diện được phương pháp trong gợi ý.');
    }
  });

  async function onSuggest() {
    try {
      toggleBusy(btnSugg, true, 'Đang gọi GPT…');
      const dsg = ctx.get('design', {}) || {};
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const rq = ctx.get('researchQuestion', '') || '';
      const pico = ctx.get('pico', {}) || {};

      const prompt = buildSuggestPrompt({ dsg, mainObj, subObjs, rq, pico });
      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();
      if (!md) {
        ctx.toast('GPT không trả về gợi ý.');
        return;
      }
      sTA.value = md;
      suggBox.classList.remove('hidden');
      ctx.toast('Đã nhận gợi ý công thức.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT gợi ý.');
    } finally {
      toggleBusy(btnSugg, false, 'GPT gợi ý công thức');
    }
  }

  async function onEvaluate() {
    try {
      toggleBusy(btnEval, true, 'Đang đánh giá…');

      const snapshot = captureCurrentInputs(); // lấy method + inputs hiện tại
      const dsg = ctx.get('design', {}) || {};
      const mainObj = ctx.get('mainObjective', '') || '';
      const subObjs = Array.isArray(ctx.get('subObjectives', [])) ? ctx.get('subObjectives') : [];
      const rq = ctx.get('researchQuestion', '') || '';
      const pico = ctx.get('pico', {}) || '';

      const prompt = buildEvaluatePrompt({ snapshot, dsg, mainObj, subObjs, rq, pico });
      const raw = await ctx.callGPT(prompt);
      const md  = String(raw || '').trim();
      if (!md) {
        ctx.toast('GPT không trả về đánh giá.');
        return;
      }
      eTA.value = md;
      evalBox.classList.remove('hidden');
      ctx.save('sampleSize.evaluation', md);
      ctx.toast('Đã nhận đánh giá giả định.');
    } catch (e) {
      console.error(e);
      ctx.toast('Lỗi khi gọi GPT đánh giá.');
    } finally {
      toggleBusy(btnEval, false, 'GPT đánh giá giả định');
    }
  }

  // ===== Compute & Save =====
  btnCalc.addEventListener('click', () => {
    const res = compute();
    if (!res.ok) {
      ctx.toast(res.msg || 'Không tính được cỡ mẫu. Kiểm tra dữ liệu vào.');
      return;
    }
    outWrap.classList.remove('hidden');
    outHtml.innerHTML = res.html;
  });

  btnSave.addEventListener('click', () => {
    const res = compute();
    if (!res.ok) {
      ctx.toast(res.msg || 'Không thể lưu vì dữ liệu chưa hợp lệ.');
      return;
    }
    ctx.save('sampleSize', {
      method: res.method,
      inputs: res.inputs,
      result: res.result,
      reportedAt: new Date().toISOString(),
    });
    ctx.toast('Đã lưu cỡ mẫu vào đề cương');
  });

  // -------- core compute
  function compute() {
    const method = methodEl.value;
    const alpha  = num(alphaEl.value);
    const power  = num(powerEl.value);
    const dropout = clamp(num(dropEl.value), 0, 90);
    const kInput = clampInt(parseInt(armsEl.value || '2', 10), 2, 10);

    if (!(alpha > 0 && alpha < 0.2))   return bad('Alpha không hợp lệ.');
    if (!(power > 0.5 && power < 0.999)) return bad('Power không hợp lệ.');

    const twoSided = (selId) => {
      const s = optsBox.querySelector(selId);
      return (s && s.value === 'two');
    };
    const Z = (p) => zQuantile(p); // quantile chuẩn

    let inputs = { alpha, power, dropout, k: kInput };
    let nPerGroup = NaN, nTotal = NaN, detail = '';

    if (method === 'means') {
      const sd = pos(optsBox, '#m-sd');
      const delta = pos(optsBox, '#m-delta');
      const two = twoSided('#m-sided');

      if (!sd || !delta) return bad('Thiếu SD hoặc Δ.');
      const zAlpha = two ? Z(1 - alpha / 2) : Z(1 - alpha);
      const zBeta  = Z(power);
      // n mỗi nhóm = 2 * (zA + zB)^2 * sd^2 / delta^2
      nPerGroup = 2 * sq(zAlpha + zBeta) * sq(sd) / sq(delta);
      nPerGroup = Math.ceil(nPerGroup);
      nTotal = 2 * nPerGroup;

      detail = `n/nhóm = 2·(z<sub>α${two?'/2':''}</sub> + z<sub>β</sub>)² · σ² / Δ²`;
      inputs = { ...inputs, sd, delta, sided: two ? 'two' : 'one' };
    }
    else if (method === 'proportions') {
      const p1 = prop(optsBox, '#p-p1');
      const p2 = prop(optsBox, '#p-p2');
      const two = twoSided('#p-sided');
      if (!isProp(p1) || !isProp(p2) || p1 === p2) return bad('p1/p2 không hợp lệ hoặc Δ=0.');
      const zAlpha = two ? Z(1 - alpha / 2) : Z(1 - alpha);
      const zBeta  = Z(power);
      const pbar   = (p1 + p2) / 2;
      const nume   = zAlpha * Math.sqrt(2 * pbar * (1 - pbar)) + zBeta * Math.sqrt(p1*(1-p1) + p2*(1-p2));
      nPerGroup = sq(nume) / sq(p1 - p2);
      nPerGroup = Math.ceil(nPerGroup);
      nTotal = 2 * nPerGroup;

      detail = `n/nhóm = [ z<sub>α${two?'/2':''}</sub>√(2 p̄(1−p̄)) + z<sub>β</sub>√(p₁(1−p₁)+p₂(1−p₂)) ]² / (p₁−p₂)²`;
      inputs = { ...inputs, p1, p2, sided: two ? 'two' : 'one' };
    }
    else if (method === 'ni_proportions') {
      const p1 = prop(optsBox, '#ni-p1');
      const p2 = prop(optsBox, '#ni-p2');
      const delta = prop(optsBox, '#ni-delta');
      if (!isProp(p1) || !isProp(p2) || !(delta > 0 && delta < 0.5)) return bad('Giá trị p1/p2/δ không hợp lệ.');

      const zAlpha = Z(1 - alpha);    // one-sided
      const zBeta  = Z(power);
      const nume   = zAlpha * Math.sqrt(2 * p2 * (1 - p2)) + zBeta * Math.sqrt(p1*(1-p1) + p2*(1-p2));
      const denom  = sq( (p1 - p2) + delta );
      if (denom <= 0) return bad('Hiệu số + δ ≤ 0, không xác định.');
      nPerGroup = Math.ceil( sq(nume) / denom );
      nTotal = 2 * nPerGroup;

      detail = `n/nhóm ≈ [ z<sub>α</sub>√(2p<sub>ctrl</sub>(1−p<sub>ctrl</sub>)) + z<sub>β</sub>√(p<sub>new</sub>(1−p<sub>new</sub>)+p<sub>ctrl</sub>(1−p<sub>ctrl</sub>)) ]² / ( (p<sub>new</sub>−p<sub>ctrl</sub>)+δ )²`;
      inputs = { ...inputs, p1, p2, margin: delta };
    }
    else if (method === 'crossover') {
      const sdw = pos(optsBox, '#x-sdw');
      const delta = pos(optsBox, '#x-delta');
      const two = twoSided('#x-sided');
      if (!sdw || !delta) return bad('Thiếu SD within hoặc Δ.');
      const zAlpha = two ? Z(1 - alpha / 2) : Z(1 - alpha);
      const zBeta  = Z(power);
      // Tổng số đối tượng: (zA + zB)^2 * 2 * sdw^2 / delta^2
      nTotal = Math.ceil( sq(zAlpha + zBeta) * 2 * sq(sdw) / sq(delta) );
      nPerGroup = Math.ceil(nTotal / 2); // 2 sequence

      detail = `N(tổng) = (z<sub>α${two?'/2':''}</sub>+z<sub>β</sub>)² · 2·σ<sub>w</sub>² / Δ²`;
      inputs = { ...inputs, sd_within: sdw, delta, sided: two ? 'two' : 'one' };
    }
    else if (method === 'anova') {
      const f = pos(optsBox, '#a-f');
      let k = clampInt(pos(optsBox, '#a-k'), 3, 10);
      if (!f) return bad('Thiếu hiệu ứng f.');
      if (!k) k = kInput;

      const zAlpha = Z(1 - alpha);
      const zBeta  = Z(power);
      let N = Math.ceil( sq(zAlpha + zBeta) / sq(f) + (k - 1) );
      nPerGroup = Math.ceil(N / k);
      nTotal = nPerGroup * k;

      detail = `Xấp xỉ: N ≈ (z<sub>α</sub>+z<sub>β</sub>)² / f² + (k−1), n/nhóm ≈ N/k`;
      inputs = { ...inputs, f, k };
    }
    else if (method === 'chisq') {
      const w = pos(optsBox, '#c-w');
      if (!w) return bad('Thiếu hiệu ứng w.');
      const zAlpha = Z(1 - alpha);
      const zBeta  = Z(power);
      nTotal = Math.ceil( sq(zAlpha + zBeta) / sq(w) );
      nPerGroup = null;

      detail = `Xấp xỉ: N ≈ (z<sub>α</sub>+z<sub>β</sub>)² / w²`;
      inputs = { ...inputs, w };
    }
    else if (method === 'ancova') {
      const sd = pos(optsBox, '#ac-sd');
      const delta = pos(optsBox, '#ac-delta');
      const r2 = clamp(num(optsBox.querySelector('#ac-r2')?.value), 0, 0.9);
      const two = twoSided('#ac-sided');
      if (!sd || !delta) return bad('Thiếu SD hoặc Δ.');
      const zAlpha = two ? Z(1 - alpha / 2) : Z(1 - alpha);
      const zBeta  = Z(power);

      let nBase = 2 * sq(zAlpha + zBeta) * sq(sd) / sq(delta);
      nPerGroup = Math.ceil(nBase * (1 - r2));
      nTotal = 2 * nPerGroup;

      detail = `ANCOVA (xấp xỉ): n/nhóm = [2·(z<sub>α${two?'/2':''}</sub>+z<sub>β</sub>)²·σ²/Δ²] · (1 − R²)`;
      inputs = { ...inputs, sd, delta, r2, sided: two ? 'two' : 'one' };
    }

    // Bù rớt mẫu
    let nPerGroupAdj = nPerGroup, nTotalAdj = nTotal;
    if (Number.isFinite(dropout) && dropout > 0) {
      const factor = 1 / (1 - dropout / 100);
      if (Number.isFinite(nPerGroupAdj)) nPerGroupAdj = Math.ceil(nPerGroupAdj * factor);
      if (Number.isFinite(nTotalAdj))    nTotalAdj    = Math.ceil(nTotalAdj * factor);
    }

    const html = renderResult(method, inputs, { nPerGroup, nTotal, nPerGroupAdj, nTotalAdj }, detail);
    return ok(method, inputs, { nPerGroup, nTotal, nPerGroupAdj, nTotalAdj }, html);
  }

  function renderResult(method, inputs, res, detail) {
    const rows = [];
    rows.push(`<tr><td>Phương pháp</td><td><code>${labelOfMethod(method)}</code></td></tr>`);
    rows.push(`<tr><td>Alpha</td><td>${fmt(inputs.alpha)}</td></tr>`);
    rows.push(`<tr><td>Power</td><td>${fmt(inputs.power)}</td></tr>`);
    if ('k' in inputs && inputs.k) rows.push(`<tr><td>Số nhánh k</td><td>${inputs.k}</td></tr>`);

    // echo method-specific
    const echo = (k, v) => rows.push(`<tr><td>${k}</td><td>${v}</td></tr>`);
    if (method === 'means') {
      echo('σ', fmt(inputs.sd));
      echo('Δ', fmt(inputs.delta));
      echo('Sided', inputs.sided);
    } else if (method === 'proportions') {
      echo('p1', fmt(inputs.p1));
      echo('p2', fmt(inputs.p2));
      echo('Sided', inputs.sided);
    } else if (method === 'ni_proportions') {
      echo('p_new', fmt(inputs.p1));
      echo('p_ctrl', fmt(inputs.p2));
      echo('δ (biên NI)', fmt(inputs.margin));
    } else if (method === 'crossover') {
      echo('σ_w', fmt(inputs.sd_within));
      echo('Δ', fmt(inputs.delta));
      echo('Sided', inputs.sided);
    } else if (method === 'anova') {
      echo('f (Cohen)', fmt(inputs.f));
      echo('k', inputs.k);
    } else if (method === 'chisq') {
      echo('w (Cohen)', fmt(inputs.w));
    } else if (method === 'ancova') {
      echo('σ', fmt(inputs.sd));
      echo('Δ', fmt(inputs.delta));
      echo('R²', fmt(inputs.r2));
      echo('Sided', fmt(inputs.sided));
    }

    rows.push(`<tr><td>% rớt mẫu</td><td>${fmt(inputs.dropout)}%</td></tr>`);
    if (Number.isFinite(res.nPerGroup)) rows.push(`<tr><td>n mỗi nhóm (chưa bù)</td><td><b>${res.nPerGroup}</b></td></tr>`);
    if (Number.isFinite(res.nTotal))    rows.push(`<tr><td>Tổng N (chưa bù)</td><td><b>${res.nTotal}</b></td></tr>`);
    if (Number.isFinite(res.nPerGroupAdj)) rows.push(`<tr><td>n mỗi nhóm (đã bù)</td><td><b>${res.nPerGroupAdj}</b></td></tr>`);
    if (Number.isFinite(res.nTotalAdj))    rows.push(`<tr><td>Tổng N (đã bù)</td><td><b>${res.nTotalAdj}</b></td></tr>`);

    return `
      <div class="muted" style="margin-bottom:.5rem">Công thức dùng: ${detail}</div>
      <table class="ss-kv"><tbody>${rows.join('')}</tbody></table>
    `.trim();
  }

  // ---- helpers
  function ok(method, inputs, result, html) { return { ok: true, method, inputs, result, html }; }
  function bad(msg) { return { ok: false, msg }; }
  function num(v) { const x = parseFloat(String(v).replace(',', '.')); return Number.isFinite(x) ? x : NaN; }
  function pos(parent, sel) {
    const v = parent.querySelector(sel)?.value;
    const x = num(v);
    return (Number.isFinite(x) && x > 0) ? x : NaN;
  }
  function prop(parent, sel) { return num(parent.querySelector(sel)?.value); }
  function isProp(p) { return Number.isFinite(p) && p > 0 && p < 1; }
  function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
  function clampInt(x, a, b) { if (!Number.isFinite(x)) return a; return Math.min(Math.max(Math.round(x), a), b); }
  function sq(x) { return x * x; }
  function fmt(x) { if (x == null) return '—'; if (!Number.isFinite(x)) return String(x); return (Math.abs(x) >= 1000 || x % 1 === 0) ? String(x) : String(+x.toFixed(4)); }
  function copyText(t) {
    try { navigator.clipboard?.writeText(t); ctx.toast('Đã sao chép.'); }
    catch { ctx.toast('Không sao chép được.'); }
  }
  function toggleBusy(btn, busy, label) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.dataset.prev = btn.textContent || ''; btn.textContent = 'Đang xử lý...'; }
    else { btn.disabled = false; btn.textContent = label || btn.dataset.prev || ''; }
  }
  function labelOfMethod(m) {
    return ({
      means: 'So sánh trung bình 2 nhóm (t-test)',
      proportions: 'So sánh tỷ lệ 2 nhóm',
      ni_proportions: 'Non-inferiority (tỷ lệ)',
      crossover: 'Cross-over (2 kỳ, σw)',
      anova: 'ANOVA (k nhóm, f)',
      chisq: 'Chi-square (w)',
      ancova: 'ANCOVA (2 nhóm, R²)',
    }[m] || m);
  }

  function captureCurrentInputs() {
    const method = methodEl.value;
    const alpha  = num(alphaEl.value);
    const power  = num(powerEl.value);
    const dropout = clamp(num(dropEl.value), 0, 90);
    const k      = clampInt(parseInt(armsEl.value || '2', 10), 2, 10);
    const inputs = { alpha, power, dropout, k };

    if (method === 'means') {
      inputs.sd = pos(optsBox, '#m-sd');
      inputs.delta = pos(optsBox, '#m-delta');
      inputs.sided = optsBox.querySelector('#m-sided')?.value || 'two';
    } else if (method === 'proportions') {
      inputs.p1 = prop(optsBox, '#p-p1');
      inputs.p2 = prop(optsBox, '#p-p2');
      inputs.sided = optsBox.querySelector('#p-sided')?.value || 'two';
    } else if (method === 'ni_proportions') {
      inputs.p1 = prop(optsBox, '#ni-p1');
      inputs.p2 = prop(optsBox, '#ni-p2');
      inputs.margin = prop(optsBox, '#ni-delta');
    } else if (method === 'crossover') {
      inputs.sd_within = pos(optsBox, '#x-sdw');
      inputs.delta = pos(optsBox, '#x-delta');
      inputs.sided = optsBox.querySelector('#x-sided')?.value || 'two';
    } else if (method === 'anova') {
      inputs.f = pos(optsBox, '#a-f');
      inputs.k = clampInt(pos(optsBox, '#a-k'), 3, 10) || inputs.k;
    } else if (method === 'chisq') {
      inputs.w = pos(optsBox, '#c-w');
    } else if (method === 'ancova') {
      inputs.sd = pos(optsBox, '#ac-sd');
      inputs.delta = pos(optsBox, '#ac-delta');
      inputs.r2 = clamp(num(optsBox.querySelector('#ac-r2')?.value), 0, 0.9);
      inputs.sided = optsBox.querySelector('#ac-sided')?.value || 'two';
    }
    return { method, inputs };
  }

  function detectMethodFromText(txt) {
    // heuristics: tìm từ khoá trong gợi ý của GPT
    if (/\bcross[- ]?over\b|chéo/i.test(txt)) return 'crossover';
    if (/\bancova\b/i.test(txt)) return 'ancova';
    if (/\banova\b/i.test(txt)) return 'anova';
    if (/\bnon[- ]?inferior/i.test(txt) || /không thua kém/i.test(txt)) return 'ni_proportions';
    if (/\bchi[- ]?square\b|chi[- ]?squared\b|\bw\b\)?\s*\(cohen/i.test(txt)) return 'chisq';
    if (/\bproportion/i.test(txt) || /tỷ lệ/i.test(txt)) return 'proportions';
    if (/\bt[- ]?test\b|trung bình|means/i.test(txt)) return 'means';
    return null;
  }

  function buildSuggestPrompt({ dsg, mainObj, subObjs, rq, pico }) {
    // Yêu cầu GPT: đề xuất công thức phù hợp, chỉ ra biến cần & cách ước lượng từ y văn
    return (
`Bạn là chuyên gia phương pháp RCT. Dựa vào thông tin sau, hãy **gợi ý công thức cỡ mẫu phù hợp** và giải thích ngắn gọn vì sao:
- Loại thiết kế: ${dsg?.type || '(chưa chọn)'}; blinding: ${dsg?.blinding || '(?)'}; số nhánh: ${dsg?.arms || '(?)'}; allocation: ${dsg?.allocationRatio || '(?)'}
- Tên nhánh: ${(Array.isArray(dsg?.armNames) && dsg.armNames.length) ? dsg.armNames.join(', ') : '(chưa có)'}
- Câu hỏi nghiên cứu: ${rq || '(chưa có)'}
- Mục tiêu chính: ${mainObj || '(chưa có)'}
- Mục tiêu phụ: ${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=> (i+1)+'. '+s).join(' | ') : '(chưa có)'}
- PICO: P=${pico?.p||'(?)'}, I=${pico?.i||'(?)'}, C=${pico?.c||'(?)'}, O=${pico?.o||'(?)'}

Hãy trả về Markdown với cấu trúc:
1) **Phương pháp đề xuất** (ví dụ: t-test hai nhóm, proportions, non-inferiority, cross-over, ANOVA, ANCOVA…)
2) **Khi nào dùng** (rõ tiêu chí phù hợp theo mục tiêu/kết cục)
3) **Các tham số cần nhập** (SD/Δ; p1/p2; biên NI; f/w; σw; R²…) và gợi ý cách ước lượng từ y văn hoặc dữ liệu thí điểm
4) **Cảnh báo thiên lệch/giả định quan trọng**
5) (Tuỳ chọn) Gợi ý phương pháp thay thế nếu điều kiện thay đổi

Lưu ý: Viết ngắn gọn, rõ ràng. Không tính cỡ mẫu giúp; chỉ định hướng chọn **phương pháp** và tham số cần.`);
  }

  function buildEvaluatePrompt({ snapshot, dsg, mainObj, subObjs, rq, pico }) {
    // Yêu cầu GPT: đối chiếu tham số nhập với bối cảnh y văn, liệt kê phạm vi hợp lý & trích dẫn gợi ý
    return (
`Bạn là phản biện phương pháp lâm sàng. Hãy **đánh giá tính hợp lý của các giả định cỡ mẫu** bên dưới so với y văn gần đây, và đưa khuyến nghị điều chỉnh nếu cần.
- Phương pháp hiện tại: ${labelOfMethod(snapshot?.method || '(?)')}
- Tham số: ${JSON.stringify(snapshot?.inputs || {})}
- Thiết kế: ${dsg?.type || '(?)'}; blinding: ${dsg?.blinding || '(?)'}; arms: ${dsg?.arms || '(?)'}; allocation: ${dsg?.allocationRatio || '(?)'}
- PICO: P=${pico?.p||'(?)'}, I=${pico?.i||'(?)'}, C=${pico?.c||'(?)'}, O=${pico?.o||'(?)'}
- Câu hỏi: ${rq || '(chưa có)'}
- Mục tiêu chính: ${mainObj || '(chưa có)'}
- Mục tiêu phụ: ${Array.isArray(subObjs) && subObjs.length ? subObjs.map((s,i)=> (i+1)+'. '+s).join(' | ') : '(chưa có)'}

Trả về Markdown gồm:
- **Đối chiếu y văn**: phạm vi hợp lý của từng tham số (SD, Δ, p nền, biên NI, f/w, σw, R²…) theo các nghiên cứu tương tự
- **Nhận định**: các giả định hiện tại quá lạc quan/bi quan ở điểm nào? tác động tới n?
- **Khuyến nghị**: điều chỉnh tham số & thực hiện pilot nếu cần; ghi chú về điều chỉnh alpha/power khi nhiều tiêu chí
- **Tài liệu gợi ý**: liệt kê vài nguồn (tên tác giả/năm hoặc guideline) để người dùng tra cứu thêm (không cần URL).`);
  }

  // Chuẩn ngược xấp xỉ (Acklam)
  function zQuantile(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a1=-3.969683028665376e+01,a2=2.209460984245205e+02,a3=-2.759285104469687e+02,a4=1.383577518672690e+02,a5=-3.066479806614716e+01,a6=2.506628277459239e+00;
    const b1=-5.447609879822406e+01,b2=1.615858368580409e+02,b3=-1.556989798598866e+02,b4=6.680131188771972e+01,b5=-1.328068155288572e+01;
    const c1=-7.784894002430293e-03,c2=-3.223964580411365e-01,c3=-2.400758277161838e+00,c4=-2.549732539343734e+00,c5=4.374664141464968e+00,c6=2.938163982698783e+00;
    const d1=7.784695709041462e-03,d2=3.224671290700398e-01,d3=2.445134137142996e+00,d4=3.754408661907416e+00;
    const plow=0.02425, phigh=1-plow;
    let q, r, x;
    if (p < plow) {
      q = Math.sqrt(-2*Math.log(p));
      x = (((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
    } else if (phigh < p) {
      q = Math.sqrt(-2*Math.log(1-p));
      x = -(((((c1*q+c2)*q+c3)*q+c4)*q+c5)*q+c6) / ((((d1*q+d2)*q+d3)*q+d4)*q+1);
    } else {
      q = p-0.5; r = q*q;
      x = (((((a1*r+a2)*r+a3)*r+a4)*r+a5)*r+a6)*q / (((((b1*r+b2)*r+b3)*r+b4)*r+b5)*r+1);
    }
    return x;
  }
}
