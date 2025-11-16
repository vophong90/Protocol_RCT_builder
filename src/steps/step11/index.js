// src/steps/step11_data_collection.js
// Step 11 – Thu thập dữ liệu
// - Đọc biến đã chọn ở Step 10: ctx.get('selectedVariables')
// - Tạo/hiệu chỉnh danh sách mốc thu thập (timepoints)
// - Kéo-thả biến vào từng mốc để xác định nơi thu thập
// - GPT gợi ý & đánh giá lịch thu thập
// - Lưu state vào 'dataCollection' và xuất JSON

export async function mount(root, ctx) {
  // Scope CSS riêng cho step11
  root.closest('.step')?.setAttribute('data-scope', 'step11');

  root.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Kế hoạch thu thập dữ liệu</h3>
        <div class="card-subtitle">
          Tạo các <strong>mốc thu thập</strong> (ví dụ: Baseline, Tuần 2, Tuần 4...), sau đó kéo-thả biến vào từng mốc.
        </div>
      </div>

      <div class="card-body">
        <div class="muted small">
          Gợi ý: luôn có mốc <strong>Baseline (ngày 0)</strong>, sau đó là các mốc theo lịch tái khám hoặc các thời điểm đo chính.
        </div>

        <div class="dc-layout">
          <!-- Cột trái: quản lý mốc + kho biến -->
          <div class="dc-left">
            <div class="card card-nested muted">
              <div class="card-header">
                <strong>Thêm mốc</strong>
              </div>
              <div class="card-body grid-1">
                <input id="tp-label" type="text" placeholder="Nhãn mốc (vd: Baseline, Tuần 2)" />
                <div class="inline-row dc-inline-row">
                  <label class="dc-label-inline">
                    <span>Ngày</span>
                    <input id="tp-day" type="number" placeholder="0, 14, 28..." />
                  </label>
                  <button id="tp-add" class="btn btn-secondary">Thêm</button>
                </div>
              </div>
            </div>

            <div class="card card-nested">
              <div class="card-header dc-list-header">
                <strong>Danh sách mốc</strong>
                <span class="muted tiny">Sắp xếp theo ngày</span>
              </div>
              <div id="tp-list" class="card-body dc-tplist"></div>
            </div>

            <div class="card card-nested">
              <div class="card-header">
                <strong>Kho biến (từ Step 10)</strong>
              </div>
              <div class="card-body grid-1">
                <input id="var-filter" type="text" placeholder="Lọc theo tên biến hoặc nhóm..." />
                <div id="pool" class="droptarget dc-pool" data-bucket="pool"></div>
                <div class="muted tiny">
                  Kéo biến từ đây sang các mốc để chỉ định nơi thu thập. Thả lại vào kho để bỏ chỉ định.
                </div>
              </div>
            </div>
          </div>

          <!-- Cột phải: lưới mốc & biến -->
          <div class="dc-right">
            <div class="card card-nested">
              <div class="card-header dc-grid-header">
                <strong>Bảng thu thập theo mốc</strong>
                <div class="dc-grid-actions">
                  <button id="gpt-suggest" class="btn btn-secondary">GPT gợi ý lịch</button>
                  <button id="gpt-eval" class="btn btn-secondary">GPT đánh giá lịch</button>
                </div>
              </div>
              <div id="grid" class="card-body dc-grid-body"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <button id="save" class="btn btn-primary">Lưu</button>
        <button id="export-json" class="btn btn-secondary">Xuất JSON</button>
      </div>
    </div>
  `.trim();

  // ---------- State ----------
  const sel = normalizeSelected(ctx.get('selectedVariables', {})); // từ Step 10
  const varList = buildVariableList(sel); // [{name, group}]
  let dc = normalizeDataCollection(ctx.get('dataCollection', {}));

  const groupByName = new Map(varList.map(v => [v.name, v.group]));

  // ---------- DOM ----------
  const poolEl     = root.querySelector('#pool');
  const filterEl   = root.querySelector('#var-filter');
  const tpLabelEl  = root.querySelector('#tp-label');
  const tpDayEl    = root.querySelector('#tp-day');
  const tpAddBtn   = root.querySelector('#tp-add');
  const tpListEl   = root.querySelector('#tp-list');
  const gridEl     = root.querySelector('#grid');
  const saveBtn    = root.querySelector('#save');
  const exportBtn  = root.querySelector('#export-json');
  const suggestBtn = root.querySelector('#gpt-suggest');
  const evalBtn    = root.querySelector('#gpt-eval');

  // Drop zone cho kho biến
  setupDropZone(poolEl, 'pool');

  // ---------- Render lần đầu ----------
  renderAll();

  // ---------- Events ----------
  tpAddBtn.addEventListener('click', onAddTimepoint);
  filterEl.addEventListener('input', renderPool);
  saveBtn.addEventListener('click', onSave);
  exportBtn.addEventListener('click', onExport);
  suggestBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  // ======================== Functions ========================

  function renderAll() {
    dc.timepoints.sort((a, b) => num(a.day) - num(b.day));
    renderTpList();
    renderPool();
    renderGrid();
  }

  function renderTpList() {
    tpListEl.innerHTML = '';
    if (!dc.timepoints.length) {
      tpListEl.innerHTML = `<div class="muted tiny">Chưa có mốc. Hãy thêm tối thiểu mốc "Baseline (ngày 0)".</div>`;
      return;
    }
    dc.timepoints.forEach(tp => {
      const row = document.createElement('div');
      row.className = 'pill dc-tp-pill';

      const left = document.createElement('div');
      left.className = 'dc-tp-pill-left';
      left.innerHTML = `<strong>${escapeHtml(tp.label || '')}</strong> <span class="muted tiny">• ngày ${escapeHtml(String(tp.day))}</span>`;
      row.appendChild(left);

      const right = document.createElement('div');
      right.className = 'dc-tp-pill-right';

      const upBtn = document.createElement('button');
      upBtn.className = 'btn-ghost';
      upBtn.title = 'Lên';
      upBtn.textContent = '↑';
      upBtn.addEventListener('click', () => moveTp(tp.id, -1));

      const dnBtn = document.createElement('button');
      dnBtn.className = 'btn-ghost';
      dnBtn.title = 'Xuống';
      dnBtn.textContent = '↓';
      dnBtn.addEventListener('click', () => moveTp(tp.id, +1));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.title = 'Xóa mốc';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => deleteTp(tp.id));

      right.appendChild(upBtn);
      right.appendChild(dnBtn);
      right.appendChild(delBtn);
      row.appendChild(right);

      tpListEl.appendChild(row);
    });
  }

  function renderPool() {
    const q = (filterEl.value || '').trim().toLowerCase();
    const inAnyTp = new Set(Object.values(dc.assignments).flat());
    const poolVars = varList
      .filter(v => !inAnyTp.has(v.name))
      .filter(v => !q || v.name.toLowerCase().includes(q) || v.group.toLowerCase().includes(q));

    poolEl.innerHTML = '';
    if (!poolVars.length) {
      poolEl.innerHTML = `<div class="muted tiny">Không có biến phù hợp điều kiện lọc / tất cả đã gán vào mốc.</div>`;
      return;
    }
    poolVars.forEach(v => poolEl.appendChild(renderVarChip(v.name, v.group, 'pool')));
  }

  function renderGrid() {
    gridEl.innerHTML = '';
    if (!dc.timepoints.length) {
      gridEl.innerHTML = `<div class="muted tiny">Thêm mốc để bắt đầu lập bảng.</div>`;
      return;
    }

    // Header
    const header = document.createElement('div');
    header.className = 'dc-grid-header-row';
    header.style.gridTemplateColumns = `repeat(${dc.timepoints.length}, minmax(160px, 1fr))`;

    dc.timepoints.forEach(tp => {
      const h = document.createElement('div');
      h.className = 'pill dc-grid-header-pill';
      h.innerHTML = `
        <div class="dc-grid-header-label">${escapeHtml(tp.label)}</div>
        <div class="muted tiny">Ngày ${escapeHtml(String(tp.day))}</div>
      `;
      header.appendChild(h);
    });
    gridEl.appendChild(header);

    // Body (các droptarget theo mốc)
    const body = document.createElement('div');
    body.className = 'dc-grid-body-row';
    body.style.gridTemplateColumns = `repeat(${dc.timepoints.length}, minmax(160px, 1fr))`;

    dc.timepoints.forEach(tp => {
      const col = document.createElement('div');
      col.className = 'card droptarget dc-grid-col';
      col.dataset.bucket = tp.id;

      const inner = document.createElement('div');
      inner.className = 'card-body dc-grid-inner';

      // Drop setup
      setupDropZone(inner, tp.id);

      // Render biến đã gán cho mốc này
      const names = Object.entries(dc.assignments)
        .filter(([vn, arr]) => arr.includes(tp.id))
        .map(([vn]) => vn)
        .sort(alpha);

      if (!names.length) {
        inner.innerHTML = `<div class="muted tiny">Chưa gán biến</div>`;
      } else {
        inner.innerHTML = '';
        names.forEach(name => {
          const group = groupByName.get(name) || '';
          inner.appendChild(renderVarChip(name, group, tp.id, true));
        });
      }

      col.appendChild(inner);
      body.appendChild(col);
    });

    gridEl.appendChild(body);
  }

  function renderVarChip(name, group, bucket, removable = false) {
    const chip = document.createElement('div');
    chip.className = 'pill draggable dc-var-chip';
    chip.draggable = true;
    chip.dataset.name = name;
    chip.dataset.bucket = bucket;

    const left = document.createElement('div');
    left.className = 'dc-var-chip-left';

    const t = document.createElement('div');
    t.className = 'dc-var-chip-title';
    t.textContent = name;
    left.appendChild(t);

    if (group) {
      const sub = document.createElement('div');
      sub.className = 'muted tiny';
      sub.textContent = groupLabel(group);
      left.appendChild(sub);
    }
    chip.appendChild(left);

    if (removable) {
      const btnX = document.createElement('button');
      btnX.type = 'button';
      btnX.className = 'btn-ghost dc-var-chip-remove';
      btnX.textContent = '✕';
      btnX.title = 'Bỏ khỏi mốc';
      btnX.addEventListener('click', () => {
        unassign(name, bucket);
        renderAll();
      });
      chip.appendChild(btnX);
    }

    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ name, from: bucket }));
    });

    return chip;
  }

  function setupDropZone(zoneEl, bucket) {
    zoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      zoneEl.classList.add('dropping');
    });
    zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('dropping'));
    zoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      zoneEl.classList.remove('dropping');
      const data = safeParse(e.dataTransfer.getData('text/plain'));
      if (!data?.name) return;

      if (bucket === 'pool') {
        // Bỏ tất cả gán
        dc.assignments[data.name] = [];
      } else {
        // Gán vào mốc đích (duy trì các mốc khác)
        const arr = new Set(dc.assignments[data.name] || []);
        arr.add(bucket);
        dc.assignments[data.name] = [...arr];
      }
      renderAll();
    });
  }

  // ----- CRUD mốc -----
  function onAddTimepoint() {
    const label = (tpLabelEl.value || '').trim();
    const day   = num(tpDayEl.value);
    if (!label || Number.isNaN(day)) {
      ctx.toast('Nhập nhãn mốc và số ngày hợp lệ.');
      return;
    }
    const id = makeId(label, day);
    if (dc.timepoints.some(x => x.id === id)) {
      ctx.toast('Mốc này đã tồn tại.');
      return;
    }
    dc.timepoints.push({ id, label, day });
    tpLabelEl.value = '';
    tpDayEl.value = '';
    renderAll();
  }

  function deleteTp(id) {
    dc.timepoints = dc.timepoints.filter(tp => tp.id !== id);
    Object.keys(dc.assignments).forEach(k => {
      dc.assignments[k] = (dc.assignments[k] || []).filter(x => x !== id);
    });
    renderAll();
  }

  function moveTp(id, dir) {
    const idx = dc.timepoints.findIndex(x => x.id === id);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= dc.timepoints.length) return;
    const [it] = dc.timepoints.splice(idx, 1);
    dc.timepoints.splice(j, 0, it);
    renderAll();
  }

  function unassign(varName, tpId) {
    dc.assignments[varName] = (dc.assignments[varName] || []).filter(x => x !== tpId);
  }

  // ----- Save / Export -----
  function onSave() {
    ctx.save('dataCollection', dc);
    ctx.toast('Đã lưu kế hoạch thu thập.');
  }

  function onExport() {
    ctx.downloadJSON('data_collection.json', dc);
  }

  // ----- GPT -----
  async function onSuggest() {
    const pico          = ctx.get('pico', {}) || {};
    const objective     = ctx.get('mainObjective', '') || '';
    const design        = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || [];
    const selectedVars  = summarizeSelected(sel);

    const prompt = `
Bạn là chuyên gia thiết kế RCT. Hãy **gợi ý lịch thu thập dữ liệu** dựa vào PICO, mục tiêu, thiết kế và danh mục biến hiện có.
Yêu cầu trả về **JSON đúng định dạng**:
{
  "timepoints": [
    {"id":"baseline_d0","label":"Baseline","day":0},
    {"id":"w2_d14","label":"Tuần 2","day":14},
    ...
  ],
  "assignments": {
    "VAS đau": ["baseline_d0","w2_d14","w4_d28","w8_d56"],
    "WOMAC":   ["baseline_d0","w4_d28","w8_d56"],
    ...
  }
}

Nguyên tắc:
- always có "Baseline" (day = 0).
- Kết cục chính: tần suất đủ để kiểm tra thay đổi theo thời gian, phù hợp khoảng theo dõi thường dùng cho lĩnh vực tương ứng.
- Biến an toàn (AE/SAE): nên ghi nhận tại mọi mốc sau can thiệp.
- Không bịa thêm biến mới ngoài danh mục đã có; chỉ lập lịch cho biến hiện có (nếu cần đặt tên alias, giữ nguyên tên gốc).

Bối cảnh:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Mục tiêu chính: ${objective}
Thiết kế: ${jsonSafe(design)}
Can thiệp: ${jsonSafe(interventions)}

Danh mục biến (theo nhóm):
${JSON.stringify(selectedVars, null, 2).slice(0, 4000)}
`.trim();

    ctx.toast('Đang gợi ý lịch thu thập từ GPT...');
    const raw = await ctx.callGPT(prompt);
    const j = safeParse(raw);
    if (!j || !Array.isArray(j.timepoints) || typeof j.assignments !== 'object') {
      ctx.toast('GPT không trả về JSON hợp lệ.');
      return;
    }

    const tps = (j.timepoints || []).map(tp => ({
      id: String(tp.id || '').trim() || makeId(tp.label, tp.day),
      label: String(tp.label || '').trim() || 'Mốc',
      day: num(tp.day),
    })).filter(tp => tp.id && !Number.isNaN(tp.day));

    const nameset = new Set(varList.map(v => v.name));
    const asg = {};
    Object.entries(j.assignments || {}).forEach(([name, arr]) => {
      if (!nameset.has(name)) return;
      const ids = Array.isArray(arr) ? arr.map(String) : [];
      asg[name] = ids.filter(id => tps.some(tp => tp.id === id));
    });

    if (!tps.length) {
      ctx.toast('Gợi ý không có mốc hợp lệ.');
      return;
    }

    dc.timepoints  = dedupeTp(tps);
    dc.assignments = asg;
    renderAll();
    ctx.toast('Đã chèn gợi ý lịch thu thập.');
  }

  async function onEvaluate() {
    const pico          = ctx.get('pico', {}) || {};
    const objective     = ctx.get('mainObjective', '') || '';
    const design        = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || [];
    const selectedVars  = summarizeSelected(sel);

    const payload = {
      timepoints: dc.timepoints,
      assignments: dc.assignments,
      variables: selectedVars,
    };

    const prompt = `
Bạn là phản biện phương pháp. Hãy **đánh giá lịch thu thập dữ liệu** sau:
- Tính hợp lý khoảng thời gian giữa các mốc
- Tần suất đo lường cho kết cục chính/phụ
- Sự nhất quán với PICO/mục tiêu/thiết kế
- Gợi ý điều chỉnh ngắn gọn theo gạch đầu dòng

Ngữ cảnh:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Mục tiêu: ${objective}
Thiết kế: ${jsonSafe(design)}
Can thiệp: ${jsonSafe(interventions)}

Dữ liệu hiện tại (JSON):
${JSON.stringify(payload, null, 2).slice(0, 4000)}
`.trim();

    ctx.toast('Đang đánh giá lịch thu thập...');
    const fb = await ctx.callGPT(prompt);
    showFeedbackDialog(fb || 'Không nhận được phản hồi.');
  }

  // ===================== Helpers: data ======================
  function buildVariableList(sel) {
    const out = [];
    Object.entries(sel).forEach(([group, arr]) => {
      (arr || []).forEach(v => {
        const name = (v && v.name) ? String(v.name).trim() : '';
        if (!name) return;
        out.push({ name, group });
      });
    });
    const seen = new Set();
    return out
      .filter(x => {
        if (seen.has(x.name)) return false;
        seen.add(x.name);
        return true;
      })
      .sort((a, b) => alpha(a.name, b.name));
  }

  function summarizeSelected(sel) {
    const obj = {};
    Object.keys(sel).forEach(k => {
      obj[k] = (sel[k] || []).map(v => v.name).sort(alpha);
    });
    return obj;
  }

  function normalizeSelected(sel) {
    const keys = ['primary', 'secondary', 'baseline', 'confounder', 'mediator', 'moderator', 'safety'];
    const out = {};
    keys.forEach(k => {
      out[k] = Array.isArray(sel?.[k])
        ? sel[k].map(v => ({ name: String(v.name || '').trim() })).filter(x => x.name)
        : [];
    });
    return out;
  }

  function normalizeDataCollection(x) {
    const timepoints = Array.isArray(x?.timepoints)
      ? x.timepoints
          .map(tp => ({
            id: String(tp.id || '').trim() || makeId(tp.label, tp.day),
            label: String(tp.label || '').trim() || 'Mốc',
            day: num(tp.day),
          }))
          .filter(tp => tp.id && !Number.isNaN(tp.day))
      : [];

    const assignments = {};
    if (x && typeof x.assignments === 'object') {
      Object.entries(x.assignments).forEach(([name, arr]) => {
        if (!name) return;
        assignments[name] = Array.isArray(arr) ? arr.map(String) : [];
      });
    }
    return { timepoints, assignments };
  }

  function dedupeTp(arr) {
    const seen = new Set();
    const out = [];
    arr.forEach(tp => {
      if (seen.has(tp.id)) return;
      seen.add(tp.id);
      out.push(tp);
    });
    return out;
  }

  // ===================== Helpers: misc/UI =====================
  function groupLabel(g) {
    switch ((g || '').toLowerCase()) {
      case 'primary': return 'Kết cục chính';
      case 'secondary': return 'Kết cục phụ';
      case 'baseline': return 'Biến nền';
      case 'confounder': return 'Nhiễu';
      case 'mediator': return 'Trung gian';
      case 'moderator': return 'Điều biến';
      case 'safety': return 'An toàn';
      default: return g;
    }
  }

  function makeId(label, day) {
    const d = num(day);
    const slug = String(label || '')
      .toLowerCase()
      .replace(/[()]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_');
    return `${slug || 'tp'}_d${Number.isNaN(d) ? 'x' : d}`;
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function alpha(a, b) {
    if (typeof a === 'object') a = a?.name ?? '';
    if (typeof b === 'object') b = b?.name ?? '';
    a = (a || '').toString().toLowerCase();
    b = (b || '').toString().toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function safeParse(s) {
    try { return JSON.parse(s); } catch { return null; }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showFeedbackDialog(text) {
    const id = 'dc-fb-dialog';
    let dlg = document.getElementById(id);
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = id;
      dlg.style.position = 'fixed';
      dlg.style.inset = '0';
      dlg.style.background = 'rgba(0,0,0,.4)';
      dlg.style.zIndex = '60';
      dlg.style.display = 'flex';
      dlg.style.alignItems = 'center';
      dlg.style.justifyContent = 'center';
      dlg.innerHTML = `
        <div style="background:#fff; max-width:720px; width:90vw; padding:18px; border-radius:12px; box-shadow:0 20px 60px rgba(0,0,0,.24)">
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá lịch thu thập</div>
          <div id="dc-fb-text" style="white-space:pre-wrap; line-height:1.4; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button id="dc-fb-close" class="btn btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelector('#dc-fb-close').addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#dc-fb-text').textContent = text;
  }
}
