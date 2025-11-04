// src/steps/step11_data_collection.js
// Step 11 – Thu thập dữ liệu (baseline)
// - Đọc biến đã chọn ở Step 10: ctx.get('selectedVariables')
// - Tạo/hiệu chỉnh danh sách mốc thu thập (timepoints)
// - Kéo-thả biến vào từng mốc để xác định nơi thu thập
// - GPT gợi ý lịch thu thập & GPT đánh giá
// - Lưu state vào 'dataCollection' và xuất JSON

export async function mount(root, ctx) {
  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Kế hoạch thu thập dữ liệu</h3>
    <div class="card-subtitle">
      Tạo các <strong>mốc thu thập</strong> (ví dụ: Baseline, Tuần 2, Tuần 4...), sau đó kéo-thả biến vào từng mốc.
    </div>
  </div>

  <div class="card-body" style="display:flex; gap:16px; flex-wrap:wrap;">
    <!-- Cột trái: quản lý mốc -->
    <div style="flex:0 0 320px; min-width:300px; display:grid; gap:12px;">
      <div class="card muted">
        <div class="card-header"><strong>Thêm mốc</strong></div>
        <div class="card-body" style="display:grid; gap:8px;">
          <input id="tp-label" type="text" placeholder="Nhãn mốc (vd: Baseline, Tuần 2)"/>
          <div style="display:flex; gap:8px; align-items:center;">
            <label style="flex:1;">
              <input id="tp-day" type="number" placeholder="Ngày (ví dụ: 0, 14, 28)"/>
            </label>
            <button id="tp-add" class="btn-secondary">Thêm</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
          <strong>Danh sách mốc</strong>
          <span class="muted">Sắp xếp theo ngày</span>
        </div>
        <div id="tp-list" class="card-body" style="display:grid; gap:8px;"></div>
      </div>

      <div class="card">
        <div class="card-header"><strong>Kho biến (từ Step 10)</strong></div>
        <div class="card-body" style="display:grid; gap:10px;">
          <input id="var-filter" type="text" placeholder="Lọc biến..."/>
          <div id="pool" class="droptarget" data-bucket="pool" style="min-height:160px; display:grid; gap:8px;"></div>
          <div class="muted">Kéo biến từ đây sang các mốc để chỉ định nơi thu thập. Thả lại vào kho để bỏ chỉ định.</div>
        </div>
      </div>
    </div>

    <!-- Cột phải: lưới mốc & biến -->
    <div style="flex:1 1 560px; min-width:520px;">
      <div class="card">
        <div class="card-header" style="display:flex; align-items:center; justify-content:space-between;">
          <strong>Bảng thu thập theo mốc</strong>
          <div style="display:flex; gap:8px;">
            <button id="gpt-suggest" class="btn-secondary">GPT gợi ý lịch</button>
            <button id="gpt-eval" class="btn-secondary">GPT đánh giá lịch</button>
          </div>
        </div>
        <div id="grid" class="card-body" style="overflow:auto;"></div>
      </div>
    </div>
  </div>

  <div class="card-footer" style="display:flex; gap:10px; flex-wrap:wrap;">
    <button id="save" class="btn-primary">Lưu</button>
    <button id="export-json" class="btn-secondary">Xuất JSON</button>
  </div>
</div>
`.trim();

  // ---------- State ----------
  // Biến đã chọn ở Step 10
  const sel = normalizeSelected(ctx.get('selectedVariables', {}));
  const varList = buildVariableList(sel); // [{name, group}]
  // Kế hoạch thu thập hiện có
  let dc = normalizeDataCollection(ctx.get('dataCollection', {}));
  // Bản đồ nhanh varName -> group (để hiển thị)
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
  filterEl.addEventListener('input', () => renderPool());
  saveBtn.addEventListener('click', onSave);
  exportBtn.addEventListener('click', onExport);
  suggestBtn.addEventListener('click', onSuggest);
  evalBtn.addEventListener('click', onEvaluate);

  // ======================== Functions ========================

  function renderAll() {
    dc.timepoints.sort((a, b) => (num(a.day) - num(b.day)));
    renderTpList();
    renderPool();
    renderGrid();
  }

  function renderTpList() {
    tpListEl.innerHTML = '';
    if (!dc.timepoints.length) {
      tpListEl.innerHTML = `<div class="muted">Chưa có mốc. Hãy thêm tối thiểu mốc "Baseline (ngày 0)".</div>`;
      return;
    }
    dc.timepoints.forEach(tp => {
      const row = document.createElement('div');
      row.className = 'pill';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      row.style.gap = '8px';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${escapeHtml(tp.label || '')}</strong> <span class="muted">• ngày ${escapeHtml(String(tp.day))}</span>`;
      row.appendChild(left);

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '6px';

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
      poolEl.innerHTML = `<div class="muted">Không có biến phù hợp điều kiện lọc / tất cả đã gán vào mốc.</div>`;
      return;
    }
    poolVars.forEach(v => poolEl.appendChild(renderVarChip(v.name, v.group, 'pool')));
  }

  function renderGrid() {
    // Bảng cột theo mốc, mỗi cột là droptarget chứa danh sách biến dành cho mốc đó
    gridEl.innerHTML = '';
    if (!dc.timepoints.length) {
      gridEl.innerHTML = `<div class="muted">Thêm mốc để bắt đầu lập bảng.</div>`;
      return;
    }

    // Header
    const header = document.createElement('div');
    header.style.display = 'grid';
    header.style.gridTemplateColumns = `repeat(${dc.timepoints.length}, minmax(160px, 1fr))`;
    header.style.gap = '12px';
    header.style.marginBottom = '8px';

    dc.timepoints.forEach(tp => {
      const h = document.createElement('div');
      h.className = 'pill';
      h.innerHTML = `<div style="font-weight:600">${escapeHtml(tp.label)}</div>
                     <div class="muted">Ngày ${escapeHtml(String(tp.day))}</div>`;
      header.appendChild(h);
    });
    gridEl.appendChild(header);

    // Body (các droptarget theo mốc)
    const body = document.createElement('div');
    body.style.display = 'grid';
    body.style.gridTemplateColumns = `repeat(${dc.timepoints.length}, minmax(160px, 1fr))`;
    body.style.gap = '12px';

    dc.timepoints.forEach(tp => {
      const col = document.createElement('div');
      col.className = 'card droptarget';
      col.dataset.bucket = tp.id;
      col.style.minHeight = '140px';

      const inner = document.createElement('div');
      inner.className = 'card-body';
      inner.style.display = 'grid';
      inner.style.gap = '8px';
      inner.style.minHeight = '120px';

      // Drop setup
      setupDropZone(inner, tp.id);

      // Render biến đã gán cho mốc này
      const names = Object.entries(dc.assignments)
        .filter(([vn, arr]) => arr.includes(tp.id))
        .map(([vn]) => vn)
        .sort(alpha);

      if (!names.length) {
        inner.innerHTML = `<div class="muted">Chưa gán biến</div>`;
      } else {
        inner.innerHTML = '';
        names.forEach(name => {
          const group = groupByName.get(name) || '';
          inner.appendChild(renderVarChip(name, group, tp.id, /*removable*/true));
        });
      }

      col.appendChild(inner);
      body.appendChild(col);
    });

    gridEl.appendChild(body);
  }

  function renderVarChip(name, group, bucket, removable = false) {
    const chip = document.createElement('div');
    chip.className = 'pill draggable';
    chip.draggable = true;
    chip.dataset.name = name;
    chip.dataset.bucket = bucket;

    chip.style.display = 'flex';
    chip.style.alignItems = 'center';
    chip.style.justifyContent = 'space-between';
    chip.style.gap = '8px';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';

    const t = document.createElement('div');
    t.style.fontWeight = '600';
    t.textContent = name;
    left.appendChild(t);

    if (group) {
      const sub = document.createElement('div');
      sub.className = 'muted';
      sub.textContent = groupLabel(group);
      left.appendChild(sub);
    }
    chip.appendChild(left);

    if (removable) {
      const btnX = document.createElement('button');
      btnX.type = 'button';
      btnX.className = 'btn-ghost';
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
    zoneEl.addEventListener('dragover', (e) => { e.preventDefault(); zoneEl.classList.add('dropping'); });
    zoneEl.addEventListener('dragleave', () => zoneEl.classList.remove('dropping'));
    zoneEl.addEventListener('drop', (e) => {
      e.preventDefault(); zoneEl.classList.remove('dropping');
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
    // Bỏ gán biến tại mốc này
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
    const pico         = ctx.get('pico', {}) || {};
    const objective    = ctx.get('mainObjective', '') || '';
    const design       = ctx.get('design', {}) || {};
    const interventions= ctx.get('interventions', []) || [];
    const selectedVars = summarizeSelected(sel);

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
    // Áp dụng gợi ý
    const tps = (j.timepoints || []).map(tp => ({
      id: String(tp.id || '').trim() || makeId(tp.label, tp.day),
      label: String(tp.label || '').trim() || 'Mốc',
      day: num(tp.day),
    })).filter(tp => tp.id && !Number.isNaN(tp.day));

    // chỉ giữ biến có trong varList
    const nameset = new Set(varList.map(v => v.name));
    const asg = {};
    Object.entries(j.assignments || {}).forEach(([name, arr]) => {
      if (!nameset.has(name)) return;
      const ids = Array.isArray(arr) ? arr.map(String) : [];
      asg[name] = ids.filter(id => tps.some(tp => tp.id === id));
    });

    if (!tps.length) { ctx.toast('Gợi ý không có mốc hợp lệ.'); return; }

    dc.timepoints  = dedupeTp(tps);
    dc.assignments = asg;
    renderAll();
    ctx.toast('Đã chèn gợi ý lịch thu thập.');
  }

  async function onEvaluate() {
    const pico         = ctx.get('pico', {}) || {};
    const objective    = ctx.get('mainObjective', '') || '';
    const design       = ctx.get('design', {}) || {};
    const interventions= ctx.get('interventions', []) || [];
    const selectedVars = summarizeSelected(sel);

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
    // unique theo name
    const seen = new Set();
    return out.filter(x => {
      if (seen.has(x.name)) return false;
      seen.add(x.name);
      return true;
    }).sort((a,b) => alpha(a.name, b.name));
  }

  function summarizeSelected(sel) {
    const obj = {};
    Object.keys(sel).forEach(k => {
      obj[k] = (sel[k] || []).map(v => v.name).sort(alpha);
    });
    return obj;
  }

  function normalizeSelected(sel) {
    const keys = ['primary','secondary','baseline','confounder','mediator','moderator','safety'];
    const out = {};
    keys.forEach(k => {
      out[k] = Array.isArray(sel?.[k]) ? sel[k].map(v => ({ name: String(v.name||'').trim() })).filter(x => x.name) : [];
    });
    return out;
  }

  function normalizeDataCollection(x) {
    const timepoints = Array.isArray(x?.timepoints) ? x.timepoints.map(tp => ({
      id: String(tp.id || '').trim() || makeId(tp.label, tp.day),
      label: String(tp.label || '').trim() || 'Mốc',
      day: num(tp.day),
    })).filter(tp => tp.id && !Number.isNaN(tp.day)) : [];

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
    switch ((g||'').toLowerCase()) {
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
    const slug = String(label || '').toLowerCase()
      .replace(/[()]/g,'').replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'').replace(/_+/g,'_');
    return `${slug || 'tp'}_d${Number.isNaN(d) ? 'x' : d}`;
    // Dùng '_' để nhất quán với naming cũ (GH Pages cho phép)
  }

  function num(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : NaN;
  }

  function alpha(a, b) {
    if (typeof a === 'object') { a = a?.name ?? ''; }
    if (typeof b === 'object') { b = b?.name ?? ''; }
    a = (a||'').toString().toLowerCase();
    b = (b||'').toString().toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
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
            <button id="dc-fb-close" class="btn-primary">Đóng</button>
          </div>
        </div>
      `;
      document.body.appendChild(dlg);
      dlg.querySelector('#dc-fb-close').addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#dc-fb-text').textContent = text;
  }
}
