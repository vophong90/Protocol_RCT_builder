// src/steps/step8/index.js
// Step 8 – Ngẫu nhiên hoá (baseline)

export const id = 8;
export const title = "Ngẫu nhiên hoá";
export const subtitle =
  "Chọn phương pháp, đặt tỷ lệ, (tuỳ) block size/strata, đặt seed để tái lập; sinh chuỗi phân bổ và lưu lại.";
export const css = "./public/css/steps/step8.css";

export async function mount(root, ctx) {
  // scope CSS riêng cho step 8
  root.closest(".step")?.setAttribute("data-scope", "step8");

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Ngẫu nhiên hoá</h3>
        <div class="card-subtitle">
          Chọn phương pháp, đặt tỷ lệ, (tuỳ) block size/strata, đặt seed để tái lập; sinh chuỗi phân bổ và lưu lại.
        </div>
      </div>

      <!-- Phương pháp & seed -->
      <div class="card-body grid-2">
        <div>
          <label>Phương pháp
            <select id="rand-method">
              <option value="simple">Simple randomization</option>
              <option value="block">Block randomization</option>
              <option value="stratified">Stratified randomization</option>
            </select>
          </label>
        </div>
        <div>
          <label>Seed (số nguyên)
            <input id="rand-seed" type="number" placeholder="Ví dụ: 2025" />
          </label>
        </div>
      </div>

      <!-- Arms & tỷ lệ -->
      <div class="card-body">
        <div class="rand-section-title">Nhánh can thiệp &amp; Tỷ lệ</div>
        <div id="arm-rows" class="grid-3"></div>
      </div>

      <!-- Block sizes -->
      <div class="card-body grid-3 hidden" id="block-row">
        <label>Block sizes (nếu block) – ngăn cách bởi dấu phẩy
          <input id="rand-blocksizes" type="text" placeholder="vd: 4,6,8" />
        </label>
        <div class="muted">
          * Mỗi block size cần chia hết tổng tỷ lệ (vd 1:1 → block = 2,4,6,...)
        </div>
        <div></div>
      </div>

      <!-- Strata -->
      <div class="card-body hidden" id="strata-row">
        <label>Danh sách tầng (mỗi dòng 1 tầng, tuỳ chọn)
          <textarea id="rand-strata" rows="4"
            placeholder="Nam - &lt;65&#10;Nam - ≥65&#10;Nữ - &lt;65&#10;Nữ - ≥65"></textarea>
        </label>
      </div>

      <!-- Tổng N -->
      <div class="card-body grid-3">
        <label>Tổng N cần sinh (nếu trống sẽ lấy từ bước cỡ mẫu)
          <input id="rand-totalN" type="number" min="1" placeholder="vd: 120" />
        </label>
        <div class="muted">
          Nếu có N theo nhánh ở bước cỡ mẫu, hệ thống sẽ ưu tiên phân bổ theo tỷ lệ tương ứng.
        </div>
        <div></div>
      </div>

      <!-- Che giấu phân bổ -->
      <div class="card-body">
        <label>Ghi chú che giấu phân bổ (allocation concealment)
          <textarea id="rand-conceal" rows="3"
            placeholder="Ví dụ: Sử dụng phong bì mờ, niêm phong, đánh số thứ tự; chuỗi nắm giữ bởi điều phối độc lập..."></textarea>
        </label>
      </div>

      <!-- Nút hành động -->
      <div class="card-footer">
        <button id="rand-suggest" class="btn btn-secondary">GPT gợi ý cấu hình</button>
        <button id="rand-generate" class="btn btn-primary">Tạo chuỗi phân bổ</button>
        <button id="rand-download" class="btn btn-secondary">Tải CSV</button>
        <button id="rand-save" class="btn btn-secondary">Lưu</button>
      </div>

      <!-- Preview chuỗi -->
      <div class="card-body hidden" id="rand-out">
        <div class="rand-section-title">Preview chuỗi phân bổ</div>
        <div class="muted rand-summary" id="rand-summary"></div>
        <div class="table-wrap">
          <table class="table" id="rand-table">
            <thead>
              <tr><th>#</th><th>Tầng</th><th>Nhánh</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `.trim();

  // ---------- Elements
  const methodSel   = root.querySelector('#rand-method');
  const seedInput   = root.querySelector('#rand-seed');
  const armRows     = root.querySelector('#arm-rows');
  const blockRow    = root.querySelector('#block-row');
  const blockSizesI = root.querySelector('#rand-blocksizes');
  const strataRow   = root.querySelector('#strata-row');
  const strataTA    = root.querySelector('#rand-strata');
  const totalNInput = root.querySelector('#rand-totalN');
  const concealTA   = root.querySelector('#rand-conceal');

  const suggestBtn  = root.querySelector('#rand-suggest');
  const genBtn      = root.querySelector('#rand-generate');
  const dlBtn       = root.querySelector('#rand-download');
  const saveBtn     = root.querySelector('#rand-save');

  const outWrap     = root.querySelector('#rand-out');
  const outTblBody  = root.querySelector('#rand-table tbody');
  const outSummary  = root.querySelector('#rand-summary');

  // ---------- Restore design/arms & sample size
  const design = ctx.get('design', {}) || {};
  const arms   = Array.isArray(design.arms) && design.arms.length
    ? design.arms
        .map(a => (typeof a === 'string' ? a : (a?.name ?? '')))
        .filter(Boolean)
    : ['Arm A', 'Arm B'];

  const ss = ctx.get('sampleSize', {}) || {};
  const perArmN = (ss.perArm && typeof ss.perArm === 'object') ? ss.perArm : null;
  const totalN0 = (typeof ss.total === 'number' && ss.total > 0)
    ? ss.total
    : (perArmN ? Object.values(perArmN).reduce((a,b)=>a+(+b||0),0) : 0);

  if (totalN0 > 0) totalNInput.placeholder = `gợi ý từ cỡ mẫu: ${totalN0}`;

  // ---------- Restore randomization state
  const st = ctx.get('randomization', {}) || {};
  if (st.method) methodSel.value = st.method;
  if (typeof st.seed === 'number') seedInput.value = String(st.seed);
  if (Array.isArray(st.blockSizes)) blockSizesI.value = st.blockSizes.join(',');
  if (Array.isArray(st.strata)) strataTA.value = st.strata.join('\n');
  if (typeof st.totalN === 'number' && st.totalN > 0) totalNInput.value = String(st.totalN);
  concealTA.value = st.concealment || '';

  const ratio = normalizeRatio(st.ratio, arms);
  renderArmRatioRows(armRows, arms, ratio);

  toggleAdvancedRows(methodSel.value);

  if (Array.isArray(st.sequence) && st.sequence.length) {
    renderPreview(st.sequence);
  }

  // ---------- Events
  methodSel.addEventListener('change', () => {
    toggleAdvancedRows(methodSel.value);
  });

  suggestBtn.addEventListener('click', async () => {
    const pico = ctx.get('pico', {}) || {};
    const rq   = ctx.get('researchQuestion', '') || '';
    const obj  = ctx.get('mainObjective', '') || '';

    const rr = readRatioFromUI(arms);
    const nSuggest = parseInt(totalNInput.value || totalN0 || '0', 10) || undefined;

    const prompt = `
Bạn là điều phối viên RCT. Hãy GỢI Ý cấu hình ngẫu nhiên hoá (JSON, không kèm giải thích) dựa vào:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Thiết kế: ${JSON.stringify(design)}
Câu hỏi: ${rq}
Mục tiêu chính: ${obj}
Nhánh: ${JSON.stringify(arms)}
Tỷ lệ hiện tại: ${JSON.stringify(rr)}
Tổng N (nếu có): ${nSuggest ?? 'chưa xác định'}

YÊU CẦU JSON:
{
  "method": "simple|block|stratified",
  "ratio": {"Arm A":1, "Arm B":1, "...":1},
  "blockSizes": [4,6],
  "strata": ["Nam<65","Nam≥65"],
  "seed": 2025
}
    `.trim();

    ctx.toast('Đang xin gợi ý từ GPT...');
    const raw = await ctx.callGPT(prompt);
    let cfg = null;
    try {
      cfg = JSON.parse(raw);
    } catch {
      cfg = null;
    }
    if (!cfg || !cfg.ratio) {
      ctx.toast('GPT không trả JSON hợp lệ. Bạn chỉnh tay nhé.');
      return;
    }

    if (cfg.method) {
      methodSel.value = ['simple','block','stratified'].includes(cfg.method)
        ? cfg.method
        : 'simple';
    }
    if (cfg.seed != null && !Number.isNaN(+cfg.seed)) {
      seedInput.value = String(parseInt(cfg.seed,10));
    }
    const ratio2 = normalizeRatio(cfg.ratio, arms);
    renderArmRatioRows(armRows, arms, ratio2);

    if (Array.isArray(cfg.blockSizes)) {
      blockSizesI.value = cfg.blockSizes.join(',');
    }
    if (Array.isArray(cfg.strata)) {
      strataTA.value = cfg.strata.join('\n');
    }
    toggleAdvancedRows(methodSel.value);
    ctx.toast('Đã áp dụng gợi ý cấu hình.');
  });

  genBtn.addEventListener('click', () => {
    const method = methodSel.value;
    const seed   = parseInt(seedInput.value || '0', 10) || 0;
    const rr     = readRatioFromUI(arms);
    const N      = parseInt(totalNInput.value || totalN0 || '0', 10);

    if (!N || N <= 0) {
      ctx.toast('Chưa có tổng N hợp lệ.');
      return;
    }

    let seq = [];
    if (method === 'simple') {
      seq = genSimple(arms, rr, N, seed);
    } else if (method === 'block') {
      const bs = parseBlockSizes(blockSizesI.value);
      if (!bs.length) {
        ctx.toast('Vui lòng nhập block sizes hợp lệ.');
        return;
      }
      if (!bs.every(b => b % sumRatio(rr) === 0)) {
        ctx.toast('Mỗi block size phải chia hết tổng tỷ lệ.');
        return;
      }
      seq = genBlock(arms, rr, N, seed, bs);
    } else {
      const strata = parseStrata(strataTA.value);
      if (!strata.length) strata.push('All');
      const bs = parseBlockSizes(blockSizesI.value);
      if (bs.length && !bs.every(b => b % sumRatio(rr) === 0)) {
        ctx.toast('Mỗi block size phải chia hết tổng tỷ lệ.');
        return;
      }
      seq = genStratified(arms, rr, N, seed, strata, bs);
    }

    renderPreview(seq);
    ctx.toast('Đã tạo chuỗi phân bổ.');
  });

  dlBtn.addEventListener('click', () => {
    const seq = readPreview();
    if (!seq.length) {
      ctx.toast('Chưa có chuỗi để tải.');
      return;
    }
    const csv = toCSV(seq);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: 'randomization_sequence.csv'
    });
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 0);
  });

  saveBtn.addEventListener('click', () => {
    const method = methodSel.value;
    const seed   = parseInt(seedInput.value || '0', 10) || 0;
    const rr     = readRatioFromUI(arms);
    const N      = parseInt(totalNInput.value || totalN0 || '0', 10);
    const bs     = parseBlockSizes(blockSizesI.value);
    const strata = parseStrata(strataTA.value);
    const seq    = readPreview();

    ctx.save('randomization', {
      method,
      ratio: rr,
      totalN: N,
      blockSizes: bs.length ? bs : undefined,
      seed,
      strata: strata.length ? strata : undefined,
      concealment: (concealTA.value || '').trim(),
      sequence: seq,
      savedAt: new Date().toISOString()
    });
    ctx.toast('Đã lưu cấu hình & chuỗi ngẫu nhiên hoá.');
  });

  // ---------- UI helpers
  function renderArmRatioRows(container, armList, ratioObj) {
    container.innerHTML = '';
    armList.forEach((name) => {
      const div = document.createElement('div');
      div.innerHTML = `
        <label>${escapeHtml(name)}
          <input data-arm="${escapeHtml(name)}" class="arm-ratio" type="number" min="1" step="1" value="${ratioObj[name] ?? 1}">
        </label>
      `;
      container.appendChild(div.firstElementChild);
    });
  }

  function toggleAdvancedRows(method) {
    const showBlock = method === 'block' || method === 'stratified';
    blockRow.classList.toggle('hidden', !showBlock);
    strataRow.classList.toggle('hidden', method !== 'stratified');
  }

  function readRatioFromUI(armList) {
    const inputs = root.querySelectorAll('.arm-ratio');
    const rr = {};
    inputs.forEach(i => {
      const a = i.getAttribute('data-arm');
      rr[a] = Math.max(1, parseInt(i.value || '1', 10));
    });
    armList.forEach(a => { if (!(a in rr)) rr[a] = 1; });
    return rr;
  }

  function renderPreview(seq) {
    outTblBody.innerHTML = '';
    seq.forEach((row, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(row.stratum || '')}</td>
        <td>${escapeHtml(row.arm)}</td>`;
      outTblBody.appendChild(tr);
    });
    outWrap.classList.remove('hidden');
    const counts = {};
    seq.forEach(r => { counts[r.arm] = (counts[r.arm] || 0) + 1; });
    const parts = Object.keys(counts).map(k => `${k}: ${counts[k]}`).join(' • ');
    outSummary.textContent = `Tổng: ${seq.length} | ${parts}`;
  }

  function readPreview() {
    const rows = Array.from(outTblBody.querySelectorAll('tr'));
    return rows.map((tr, i) => {
      const tds = tr.querySelectorAll('td');
      return {
        index: i + 1,
        stratum: tds[1]?.textContent || '',
        arm: tds[2]?.textContent || ''
      };
    });
  }

  // ---------- Logic helpers
  function parseBlockSizes(s) {
    return String(s || '')
      .split(',')
      .map(x => parseInt(x.trim(),10))
      .filter(x => x && x > 0);
  }

  function parseStrata(s) {
    return String(s || '')
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  function normalizeRatio(ratioObj, armList) {
    const out = {};
    armList.forEach(a => {
      out[a] = Math.max(
        1,
        parseInt((ratioObj && ratioObj[a]) || '1', 10)
      );
    });
    return out;
  }

  function sumRatio(rr) {
    return Object.values(rr).reduce((a,b)=>a+(+b||0),0);
  }

  // Seeded RNG (LCG)
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function next() {
      s = (1664525 * s + 1013904223) >>> 0;
      return s / 2**32;
    };
  }

  function shuffle(arr, rand) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function genSimple(arms, rr, N, seed) {
    const rand = rng(seed);
    const bag = [];
    arms.forEach(a => { for (let i=0;i<rr[a];i++) bag.push(a); });
    const out = [];
    for (let i=0;i<N; i++) {
      const pick = bag[Math.floor(rand() * bag.length)];
      out.push({ index: i+1, stratum: '', arm: pick });
    }
    return out;
  }

  function genBlock(arms, rr, N, seed, blockSizes) {
    const rand = rng(seed);
    const R = sumRatio(rr);
    const unit = [];
    arms.forEach(a => { for (let i=0;i<rr[a];i++) unit.push(a); });

    const out = [];
    while (out.length < N) {
      const bsize = blockSizes[Math.floor(rand() * blockSizes.length)];
      const mult = Math.max(1, Math.floor(bsize / R));
      let block = [];
      for (let m=0; m<mult; m++) block = block.concat(unit);
      shuffle(block, rand);
      block.forEach(a => {
        if (out.length < N) out.push({ index: out.length+1, stratum:'', arm:a });
      });
    }
    return out;
  }

  function genStratified(arms, rr, N, seed, strata, blockSizes) {
    const eachN = Math.floor(N / strata.length);
    const remainder = N % strata.length;

    const out = [];
    strata.forEach((sName, si) => {
      const nThis = eachN + (si < remainder ? 1 : 0);
      let seq = [];
      if (blockSizes && blockSizes.length) {
        seq = genBlock(arms, rr, nThis, (seed + si + 1) | 0, blockSizes);
      } else {
        seq = genSimple(arms, rr, nThis, (seed + si + 1) | 0);
      }
      seq.forEach(r => {
        r.stratum = sName;
        r.index = out.length + 1;
        out.push(r);
      });
    });
    return out;
  }

  function toCSV(rows) {
    const header = ['index','stratum','arm'];
    const lines = [header.join(',')];
    rows.forEach(r => {
      const idx = r.index ?? '';
      const st  = (r.stratum ?? '').replace(/"/g,'""');
      const arm = (r.arm ?? '').replace(/"/g,'""');
      lines.push([idx, `"${st}"`, `"${arm}"`].join(','));
    });
    return lines.join('\n');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }
}
