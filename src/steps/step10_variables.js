// src/steps/step10_variables.js
// Step 10 – Biến số (baseline)
// - Đọc CSV qua PapaParse -> allVariables: [{name,type,unit,note}]
// - Quản lý selectedVariables: primary, secondary, baseline, confounder, mediator, moderator, safety
// - Kéo-thả giữa kho biến và các nhóm; nút xóa trả về kho
// - GPT gợi ý cấu hình nhóm biến từ PICO + Mục tiêu + Thiết kế/Can thiệp
// - GPT đánh giá bộ biến hiện tại
// - Lưu state & xuất JSON

export async function mount(root, ctx) {
  const Papa = ctx.vendor?.Papa || window.Papa;

  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Biến số nghiên cứu</h3>
    <div class="card-subtitle">
      Tải CSV danh sách biến, sau đó kéo-thả để phân nhóm (kết cục chính/phụ, nền, nhiễu...).
      CSV gợi ý cột: <code>name,type,unit,note</code>.
    </div>
  </div>

  <div class="card-body" style="display:flex;gap:16px;flex-wrap:wrap">
    <!-- Panel trái: CSV & Kho biến -->
    <div style="flex:1 1 340px; min-width:320px;">
      <div class="card muted" style="margin-bottom:12px;">
        <div class="card-header"><strong>Tải CSV biến</strong></div>
        <div class="card-body" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <input id="var-csv" type="file" accept=".csv,text/csv" />
          <button id="var-load" class="btn-secondary" type="button">Nạp CSV</button>
          <button id="var-export" class="btn-secondary" type="button">Xuất JSON</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <strong>Kho biến</strong>
          <input id="var-filter" type="text" placeholder="Lọc..." style="max-width:180px;" />
        </div>
        <div id="pool" class="card-body droptarget" data-bucket="pool" style="min-height:160px; display:grid; gap:8px;"></div>
      </div>
    </div>

    <!-- Panel phải: nhóm biến -->
    <div style="flex:2 1 520px; min-width:420px; display:grid; gap:12px;">
      ${renderBucketsHTML()}
    </div>
  </div>

  <div class="card-footer" style="display:flex;gap:10px;flex-wrap:wrap">
    <button id="var-gpt-suggest" class="btn-secondary" type="button">GPT gợi ý nhóm biến</button>
    <button id="var-gpt-eval" class="btn-secondary" type="button">GPT đánh giá bộ biến</button>
    <button id="var-save" class="btn-primary" type="button">Lưu</button>
  </div>
</div>
`.trim();

  // ---------- State ----------
  let allVars = normalizeAll(ctx.get('allVariables', []));
  let selected = normalizeSelected(ctx.get('selectedVariables', {}));

  // ---------- DOM ----------
  const poolEl    = root.querySelector('#pool');
  const filterEl  = root.querySelector('#var-filter');
  const csvInput  = root.querySelector('#var-csv');
  const btnLoad   = root.querySelector('#var-load');
  const btnExport = root.querySelector('#var-export');
  const btnSave   = root.querySelector('#var-save');
  const btnSuggest= root.querySelector('#var-gpt-suggest');
  const btnEval   = root.querySelector('#var-gpt-eval');

  const bucketEls = {
    primary:    root.querySelector('#bucket-primary .bucket-body'),
    secondary:  root.querySelector('#bucket-secondary .bucket-body'),
    baseline:   root.querySelector('#bucket-baseline .bucket-body'),
    confounder: root.querySelector('#bucket-confounder .bucket-body'),
    mediator:   root.querySelector('#bucket-mediator .bucket-body'),
    moderator:  root.querySelector('#bucket-moderator .bucket-body'),
    safety:     root.querySelector('#bucket-safety .bucket-body'),
  };

  // ---------- Render lần đầu ----------
  renderAll();

  // ---------- Wire events (có guard) ----------
  filterEl?.addEventListener('input', renderPool);
  btnLoad?.addEventListener('click', onLoadCsv);
  btnExport?.addEventListener('click', onExport);
  btnSave?.addEventListener('click', onSave);
  btnSuggest?.addEventListener('click', onSuggest);
  btnEval?.addEventListener('click', onEvaluate);

  setupDropZone(poolEl, 'pool');
  Object.entries(bucketEls).forEach(([k, el]) => setupDropZone(el, k));

  // ========================= Functions =========================
  function renderAll() {
    renderPool();
    renderBucketsUI();
  }

  function renderPool() {
    const q = (filterEl?.value || '').trim().toLowerCase();
    const pool = getPool();
    const list = q
      ? pool.filter(v => (v.name || '').toLowerCase().includes(q)
                      || (v.unit || '').toLowerCase().includes(q)
                      || (v.type || '').toLowerCase().includes(q)
                      || (v.note || '').toLowerCase().includes(q))
      : pool;

    if (!poolEl) return;
    poolEl.innerHTML = '';
    list.forEach(v => poolEl.appendChild(renderVarChip(v, 'pool')));
    if (!list.length) poolEl.innerHTML = `<div class="muted">Không có biến phù hợp bộ lọc.</div>`;
  }

  function renderBucketsUI() {
    Object.entries(bucketEls).forEach(([k, el]) => {
      if (!el) return;
      const arr = selected[k] || [];
      el.innerHTML = arr.length
        ? ''
        : `<div class="muted">Chưa chọn</div>`;
      arr.forEach(v => el.appendChild(renderVarChip(v, k, true)));
    });
  }

  function renderVarChip(v, bucket, withRemove = false) {
    const chip = document.createElement('div');
    chip.className = 'pill draggable';
    chip.draggable = true;
    chip.dataset.name = v.name;
    chip.dataset.bucket = bucket;
    chip.style.display = 'flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '8px';
    chip.style.justifyContent = 'space-between';

    const left = document.createElement('div');
    left.style.display = 'flex';
    left.style.flexDirection = 'column';

    const title = document.createElement('div');
    title.style.fontWeight = '600';
    title.textContent = v.name;
    left.appendChild(title);

    const meta = [];
    if (v.type) meta.push(v.type);
    if (v.unit) meta.push(`đv: ${v.unit}`);
    if (v.note) meta.push(v.note);
    if (meta.length) {
      const sub = document.createElement('div');
      sub.className = 'muted';
      sub.textContent = meta.join(' • ');
      left.appendChild(sub);
    }

    chip.appendChild(left);

    if (withRemove) {
      const btnX = document.createElement('button');
      btnX.type = 'button';
      btnX.className = 'btn-ghost';
      btnX.textContent = '✕';
      btnX.title = 'Bỏ khỏi nhóm';
      btnX.addEventListener('click', () => {
        removeFromSelected(v.name);
        renderAll();
      });
      chip.appendChild(btnX);
    }

    chip.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ name: v.name, from: bucket }));
    });

    return chip;
  }

  function setupDropZone(zoneEl, bucketName) {
    if (!zoneEl) return; // guard tránh addEventListener trên null
    zoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      zoneEl.classList.add('dropping');
    });
    zoneEl.addEventListener('dragleave', () => {
      zoneEl.classList.remove('dropping');
    });
    zoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      zoneEl.classList.remove('dropping');
      const data = safeParse(e.dataTransfer.getData('text/plain'));
      if (!data?.name) return;

      if (bucketName === 'pool') {
        removeFromSelected(data.name);
      } else {
        const item = getVarByName(data.name);
        if (!item) return;
        addToSelected(bucketName, item);
      }
      renderAll();
    });
  }

  function onExport() {
    ctx.downloadJSON('variables.json', {
      allVariables: allVars,
      selectedVariables: selected,
    });
  }

  async function onLoadCsv() {
    if (!Papa) { ctx.toast('Không tìm thấy PapaParse.'); return; }
    const f = csvInput?.files?.[0];
    if (!f) { ctx.toast('Chọn file CSV trước đã.'); return; }

    try {
      const text = await f.text();
      const res = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' });
      const mapped = (res.data || []).map(row => ({
        name: (row.name || row.Name || row.tên || row['Tên biến'] || '').toString().trim(),
        type: (row.type || row.Type || row.loai || row['Loại'] || '').toString().trim() || undefined,
        unit: (row.unit || row.Unit || row.đơnvị || row['Đơn vị'] || '').toString().trim() || undefined,
        note: (row.note || row.ghi_chu || row['Ghi chú'] || '').toString().trim() || undefined,
      })).filter(x => x.name);

      const existing = new Set(allVars.map(v => v.name));
      const merged = [...allVars];
      mapped.forEach(v => { if (!existing.has(v.name)) { merged.push(v); existing.add(v.name); } });
      allVars = merged;

      ctx.toast(`Đã nạp ${mapped.length} biến (gộp trùng theo tên).`);
      renderAll();
    } catch (e) {
      console.error(e);
      ctx.toast('Không đọc được CSV.');
    }
  }

  function onSave() {
    ctx.save('allVariables', allVars);
    ctx.save('selectedVariables', selected);
    ctx.toast('Đã lưu bộ biến.');
  }

  async function onSuggest() {
    const pico = ctx.get('pico', {}) || {};
    const objective = ctx.get('mainObjective', '') || '';
    const design = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || [];

    const currentNames = {
      all: allVars.map(v => v.name),
      selected: Object.fromEntries(
        Object.entries(selected).map(([k, arr]) => [k, (arr || []).map(v => v.name)])
      ),
    };

    const prompt = `
Bạn là chuyên gia phương pháp luận lâm sàng. Hãy đề xuất **danh mục biến** cho RCT, phân nhóm:
- primary, secondary, baseline, confounder, mediator, moderator, safety
Trả về đúng JSON theo mẫu.
Ngữ cảnh:
PICO:
- P: ${pico.p || ''}
- I: ${pico.i || ''}
- C: ${pico.c || ''}
- O: ${pico.o || ''}

Mục tiêu chính: ${objective}
Thiết kế: ${jsonSafe(design)}
Can thiệp: ${jsonSafe(interventions)}
Kho biến hiện có (tên): ${JSON.stringify(currentNames.all).slice(0,1500)}
Lựa chọn hiện tại: ${JSON.stringify(currentNames.selected).slice(0,1500)}
`.trim();

    ctx.toast('Đang gợi ý nhóm biến từ GPT...');
    const raw = await ctx.callGPT(prompt);
    const j = safeParse(raw);
    if (!j || typeof j !== 'object') { ctx.toast('GPT không trả về JSON hợp lệ.'); return; }

    const buckets = ['primary','secondary','baseline','confounder','mediator','moderator','safety'];
    const byName = new Map(allVars.map(v => [v.name, v]));
    const nextSelected = cloneSelectedBlank();

    buckets.forEach(b => {
      const arr = Array.isArray(j[b]) ? j[b] : [];
      nextSelected[b] = arr.map(x => normVar(x)).filter(v => !!v.name);
      nextSelected[b].forEach(v => {
        if (!byName.has(v.name)) { allVars.push(v); byName.set(v.name, v); }
      });
    });

    selected = nextSelected;
    renderAll();
    ctx.toast('Đã chèn gợi ý nhóm biến.');
  }

  async function onEvaluate() {
    const pico = ctx.get('pico', {}) || {};
    const objective = ctx.get('mainObjective', '') || '';
    const design = ctx.get('design', {}) || {};
    const interventions = ctx.get('interventions', []) || [];

    const payload = {
      primary:     selected.primary?.map(v => viewVar(v)) ?? [],
      secondary:   selected.secondary?.map(v => viewVar(v)) ?? [],
      baseline:    selected.baseline?.map(v => viewVar(v)) ?? [],
      confounder:  selected.confounder?.map(v => viewVar(v)) ?? [],
      mediator:    selected.mediator?.map(v => viewVar(v)) ?? [],
      moderator:   selected.moderator?.map(v => viewVar(v)) ?? [],
      safety:      selected.safety?.map(v => viewVar(v)) ?? [],
    };

    const prompt = `
Bạn là phản biện phương pháp cho RCT. Hãy **đánh giá bộ biến** hiện tại:
- Phù hợp với PICO/mục tiêu/thiết kế?
- Biến quan trọng còn thiếu? Biến thừa/trùng?
- Gợi ý chỉnh sửa ngắn gọn theo gạch đầu dòng.
Ngữ cảnh:
P: ${pico.p || ''} | I: ${pico.i || ''} | C: ${pico.c || ''} | O: ${pico.o || ''}
Mục tiêu: ${objective}
Thiết kế: ${jsonSafe(design)}
Can thiệp: ${jsonSafe(interventions)}
Bộ biến hiện tại (JSON):
${JSON.stringify(payload, null, 2).slice(0, 4000)}
`.trim();

    ctx.toast('Đang đánh giá bộ biến...');
    const fb = await ctx.callGPT(prompt);
    showFeedbackDialog(fb || 'Không nhận được phản hồi.');
  }

  // ====================== Helpers: data ======================
  function normalizeAll(arr) {
    const out = Array.isArray(arr) ? arr : [];
    const seen = new Set();
    return out.map(v => normVar(v)).filter(v => v.name && !dupe(v.name));
    function dupe(name) {
      const k = name.trim();
      if (seen.has(k)) return true;
      seen.add(k); return false;
    }
  }
  function normalizeSelected(sel) {
    const buckets = cloneSelectedBlank();
    if (sel && typeof sel === 'object') {
      Object.keys(buckets).forEach(k => {
        buckets[k] = (Array.isArray(sel[k]) ? sel[k] : []).map(v => normVar(v)).filter(x => x.name);
      });
    }
    return buckets;
  }
  function cloneSelectedBlank() {
    return { primary:[], secondary:[], baseline:[], confounder:[], mediator:[], moderator:[], safety:[] };
  }
  function normVar(v) {
    if (!v || typeof v !== 'object') {
      const s = (v ?? '').toString().trim();
      return s ? { name: s } : { name: '' };
    }
    return {
      name: (v.name ?? '').toString().trim(),
      type: cleanStr(v.type),
      unit: cleanStr(v.unit),
      note: cleanStr(v.note),
    };
  }
  function cleanStr(x){ const s=(x??'').toString().trim(); return s || undefined; }

  function getPool() {
    const inBuckets = new Set(Object.values(selected).flat().map(v => v.name));
    return allVars.filter(v => !inBuckets.has(v.name));
  }
  function getVarByName(name){ return allVars.find(v => v.name === name); }
  function addToSelected(bucket, item) {
    const arr = selected[bucket] || [];
    if (!arr.some(x => x.name === item.name)) selected[bucket] = [...arr, item];
    Object.keys(selected).forEach(k => { if (k !== bucket) selected[k] = selected[k].filter(x => x.name !== item.name); });
  }
  function removeFromSelected(name) {
    Object.keys(selected).forEach(k => { selected[k] = selected[k].filter(x => x.name !== name); });
  }

  // ====================== Helpers: UI ======================
  function viewVar(v){ return { name:v.name, type:v.type, unit:v.unit, note:v.note }; }

  function showFeedbackDialog(text) {
    const id = 'vars-fb-dialog';
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
          <div style="font-weight:700; margin-bottom:8px;">Đánh giá bộ biến</div>
          <div id="vars-fb-text" style="white-space:pre-wrap; line-height:1.4; max-height:60vh; overflow:auto;"></div>
          <div style="display:flex; justify-content:flex-end; margin-top:12px;">
            <button id="vars-fb-close" class="btn-primary" type="button">Đóng</button>
          </div>
        </div>`;
      document.body.appendChild(dlg);
      dlg.querySelector('#vars-fb-close')?.addEventListener('click', () => dlg.remove());
    }
    dlg.querySelector('#vars-fb-text').textContent = text;
  }

  // ====================== Helpers: misc ======================
  function safeParse(s){ try{ return JSON.parse(s); }catch{ return null; } }
  function jsonSafe(x){ try{ return JSON.stringify(x).slice(0,2000); }catch{ return String(x); } }
}

// ---------- Markup helpers (ngoài mount) ----------
function renderBucketsHTML() {
  return `
    ${renderBucketBox('Kết cục chính (Primary)',   'primary',    'Kết cục chính duy nhất hoặc rất ít')}
    ${renderBucketBox('Kết cục phụ (Secondary)',   'secondary',  'Các kết cục bổ sung')}
    ${renderBucketBox('Biến nền (Baseline)',       'baseline',   'Đặc điểm ban đầu, mô tả dân số')}
    ${renderBucketBox('Nhiễu (Confounder)',        'confounder', 'Yếu tố gây nhiễu cần điều chỉnh')}
    ${renderBucketBox('Trung gian (Mediator)',     'mediator',   'Nếu phù hợp với giả thuyết')}
    ${renderBucketBox('Điều biến (Moderator)',     'moderator',  'Nếu phù hợp với giả thuyết')}
    ${renderBucketBox('An toàn (Safety)',          'safety',     'Biến cố bất lợi, AE/SAE')}
  `;
}
function renderBucketBox(title, key, hint='') {
  return `
    <div id="bucket-${key}" class="card">
      <div class="card-header">
        <strong>${title}</strong>
        ${hint ? `<div class="muted" style="font-weight:400">${hint}</div>` : ''}
      </div>
      <div class="card-body bucket-body droptarget" data-bucket="${key}" style="min-height:100px; display:grid; gap:8px;"></div>
    </div>
  `;
}
