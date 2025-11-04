// src/steps/step6_sample_size.js
// Step 6 – Cỡ mẫu (baseline)
// Công thức minh bạch, không dùng GPT để tính. Có bù rớt mẫu và cảnh báo nhập sai.
// Lưu kết quả vào state.sampleSize { method, inputs, result }.

export async function mount(rootEl, ctx) {
  rootEl.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Cỡ mẫu</h3>
    <div class="card-subtitle">
      Chọn công thức và nhập giả định. Hệ thống tính theo công thức minh bạch, sau đó có thể bù rớt mẫu.
    </div>
  </div>

  <div class="card-body grid-3">
    <label>Phương pháp
      <select id="ss-method">
        <option value="means">So sánh trung bình 2 nhóm (t-test)</option>
        <option value="proportions">So sánh tỷ lệ 2 nhóm</option>
        <option value="ni_proportions">Non-inferiority (tỷ lệ)</option>
        <option value="crossover">Cross-over (trung bình, SD within)</option>
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

  <div class="card-body" id="ss-opts">
    <!-- dynamic inputs per method -->
  </div>

  <div class="card-body grid-3">
    <label>% rớt mẫu dự kiến
      <input id="ss-drop" type="number" min="0" max="90" step="1" value="0" />
    </label>

    <label>Số nhánh (k, nếu cần)
      <input id="ss-arms" type="number" min="2" max="10" step="1" />
    </label>

    <div class="muted">
      Gợi ý: nếu bạn đã chọn thiết kế ở Bước 5, số nhánh sẽ được lấy từ đó.
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="ss-calc" class="btn-primary">Tính cỡ mẫu</button>
    <button id="ss-save" class="btn-secondary">Lưu vào đề cương</button>
  </div>

  <div class="card-body" id="ss-out" style="display:none">
    <div style="font-weight:600;margin-bottom:.5rem">Kết quả:</div>
    <div id="ss-out-html" class="prose"></div>
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
        <div class="muted">Kiểm định một phía (one-sided) theo baseline.</div>
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
      <div class="muted">Kết quả là số <b>đối tượng</b> (tổng) cần cho thiết kế cross-over 2 kỳ.</div>`;
    } else if (m === 'anova') {
      html = `
      <div class="grid-3">
        <label>Hiệu ứng f (Cohen's f)
          <input id="a-f" type="number" min="0.01" max="2" step="0.01" placeholder="0.25 (vừa)" />
        </label>
        <label>Số nhóm k
          <input id="a-k" type="number" min="3" max="10" step="1" />
        </label>
        <div class="muted">Cỡ mẫu xấp xỉ theo f. Trả về n mỗi nhóm và tổng N ≈ k·n.</div>
      </div>`;
    } else if (m === 'chisq') {
      html = `
      <div class="grid-3">
        <label>Hiệu ứng w (Cohen's w)
          <input id="c-w" type="number" min="0.01" max="1.5" step="0.01" placeholder="0.3 (vừa)" />
        </label>
        <div></div><div class="muted">Cỡ mẫu tổng N ≈ ((Z<sub>α</sub>+Z<sub>β</sub>)²)/w² (xấp xỉ).</div>
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
        <div class="muted">Điều chỉnh bằng nhân tố (1 − R²) lên cỡ mẫu của bài toán so sánh trung bình 2 nhóm.</div>
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

  btnCalc.addEventListener('click', () => {
    const res = compute();
    if (!res.ok) {
      ctx.toast(res.msg || 'Không tính được cỡ mẫu. Kiểm tra dữ liệu vào.');
      return;
    }
    outWrap.style.display = '';
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

    if (!(alpha > 0 && alpha < 0.2)) return bad('Alpha không hợp lệ.');
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
      // n mỗi nhóm (equal allocation): 2 * (zA + zB)^2 * sd^2 / delta^2
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

      // One-sided non-inferiority (xấp xỉ): denominator = ( (p1 - p2) + δ )^2
      const zAlpha = Z(1 - alpha);    // one-sided
      const zBeta  = Z(power);
      const nume   = zAlpha * Math.sqrt(2 * p2 * (1 - p2)) + zBeta * Math.sqrt(p1*(1-p1) + p2*(1-p2));
      const denom  = sq( (p1 - p2) + delta );
      if (denom <= 0) return bad('Hiệu số + δ ≤ 0, không xác định.');
      nPerGroup = sq(nume) / denom;
      nPerGroup = Math.ceil(nPerGroup);
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
      nTotal = sq(zAlpha + zBeta) * 2 * sq(sdw) / sq(delta);
      nTotal = Math.ceil(nTotal);
      nPerGroup = Math.ceil(nTotal / 2); // 2 sequence

      detail = `N(tổng) = (z<sub>α${two?'/2':''}</sub>+z<sub>β</sub>)² · 2·σ<sub>w</sub>² / Δ²`;
      inputs = { ...inputs, sd_within: sdw, delta, sided: two ? 'two' : 'one' };
    }
    else if (method === 'anova') {
      const f = pos(optsBox, '#a-f');
      let k = clampInt(pos(optsBox, '#a-k'), 3, 10);
      if (!f) return bad('Thiếu hiệu ứng f.');
      if (!k) k = kInput;

      const zAlpha = Z(1 - alpha); // xấp xỉ một phía cho F
      const zBeta  = Z(power);
      // Xấp xỉ: N ≈ (zAlpha + zBeta)^2 / f^2 + (k - 1)
      let N = sq(zAlpha + zBeta) / sq(f) + (k - 1);
      N = Math.ceil(N);
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
      // N ≈ (zAlpha + zBeta)^2 / w^2
      nTotal = sq(zAlpha + zBeta) / sq(w);
      nTotal = Math.ceil(nTotal);
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

      // Bước 1: n 2 nhóm (means) = 2*(zA+zB)^2*sd^2/delta^2
      let nBase = 2 * sq(zAlpha + zBeta) * sq(sd) / sq(delta);
      // Bước 2: điều chỉnh theo (1 - R^2): n_adj = nBase * (1 - r2)
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
    rows.push(`<tr><td>Phương pháp</td><td><code>${method}</code></td></tr>`);
    rows.push(`<tr><td>Alpha</td><td>${fmt(inputs.alpha)}</td></tr>`);
    rows.push(`<tr><td>Power</td><td>${fmt(inputs.power)}</td></tr>`);
    if ('k' in inputs && inputs.k) rows.push(`<tr><td>Số nhánh k</td><td>${inputs.k}</td></tr>`);

    // method-specific echo
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
      echo('Sided', inputs.sided);
    }

    rows.push(`<tr><td>% rớt mẫu</td><td>${fmt(inputs.dropout)}%</td></tr>`);
    if (Number.isFinite(res.nPerGroup)) rows.push(`<tr><td>n mỗi nhóm (chưa bù)</td><td><b>${res.nPerGroup}</b></td></tr>`);
    if (Number.isFinite(res.nTotal))    rows.push(`<tr><td>Tổng N (chưa bù)</td><td><b>${res.nTotal}</b></td></tr>`);
    if (Number.isFinite(res.nPerGroupAdj)) rows.push(`<tr><td>n mỗi nhóm (đã bù)</td><td><b>${res.nPerGroupAdj}</b></td></tr>`);
    if (Number.isFinite(res.nTotalAdj))    rows.push(`<tr><td>Tổng N (đã bù)</td><td><b>${res.nTotalAdj}</b></td></tr>`);

    return `
      <div class="muted" style="margin-bottom:.5rem">Công thức dùng: ${detail}</div>
      <table class="table-kv">
        <tbody>${rows.join('')}</tbody>
      </table>
    `.trim();
  }

  // ---- helpers
  function ok(method, inputs, result, html) {
    return { ok: true, method, inputs, result, html };
  }
  function bad(msg) {
    return { ok: false, msg };
  }
  function num(v) {
    const x = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(x) ? x : NaN;
  }
  function pos(parent, sel) {
    const v = parent.querySelector(sel)?.value;
    const x = num(v);
    return (Number.isFinite(x) && x > 0) ? x : NaN;
  }
  function prop(parent, sel) {
    const x = num(parent.querySelector(sel)?.value);
    return x;
  }
  function isProp(p) { return Number.isFinite(p) && p > 0 && p < 1; }
  function clamp(x, a, b) { return Math.min(Math.max(x, a), b); }
  function clampInt(x, a, b) {
    if (!Number.isFinite(x)) return a;
    return Math.min(Math.max(Math.round(x), a), b);
  }
  function sq(x) { return x * x; }
  function fmt(x) {
    if (x == null) return '—';
    if (!Number.isFinite(x)) return String(x);
    return (Math.abs(x) >= 1000 || x % 1 === 0) ? String(x) : String(+x.toFixed(4));
  }

  // Chuẩn ngược xấp xỉ (Acklam)
  function zQuantile(p) {
    // clamp
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a1 = -3.969683028665376e+01;
    const a2 =  2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 =  1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 =  2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 =  1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 =  6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03;
    const c2 = -3.223964580411365e-01;
    const c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00;
    const c5 =  4.374664141464968e+00;
    const c6 =  2.938163982698783e+00;

    const d1 =  7.784695709041462e-03;
    const d2 =  3.224671290700398e-01;
    const d3 =  2.445134137142996e+00;
    const d4 =  3.754408661907416e+00;

    const plow  = 0.02425;
    const phigh = 1 - plow;
    let q, r, x;

    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      x = (((((c1*q + c2)*q + c3)*q + c4)*q + c5)*q + c6) /
          ((((d1*q + d2)*q + d3)*q + d4)*q + 1);
    } else if (phigh < p) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x = -(((((c1*q + c2)*q + c3)*q + c4)*q + c5)*q + c6) /
            ((((d1*q + d2)*q + d3)*q + d4)*q + 1);
    } else {
      q = p - 0.5;
      r = q * q;
      x = (((((a1*r + a2)*r + a3)*r + a4)*r + a5)*r + a6)*q /
          (((((b1*r + b2)*r + b3)*r + b4)*r + b5)*r + 1);
    }
    return x;
  }
}
