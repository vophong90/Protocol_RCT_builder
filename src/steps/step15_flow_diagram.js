// src/steps/step15_flow_diagram.js
// Step 15 – Sơ đồ nghiên cứu (CONSORT) bằng Mermaid
// - Đọc arms từ state (interventions)
// - Cho phép nhập số liệu theo từng nhánh
// - Generate Mermaid code, Render, Lưu state, Copy, Xuất PNG
//
// Yêu cầu vendor đã sẵn từ window (được truyền qua ctx.vendor):
//   ctx.vendor.mermaid, ctx.vendor.html2canvas
//
// State keys dùng:
//   - 'interventions' (mảng nhánh can thiệp, mỗi item có name/label)
//   - 'consort' (sẽ lưu số liệu form nhập ở bước này)
//   - 'flowDiagram' { mermaid: string, updated_at: iso }

export async function mount(root, ctx) {
  const mermaid = ctx?.vendor?.mermaid;
  const html2canvas = ctx?.vendor?.html2canvas;

  const armsRaw = Array.isArray(ctx.get('interventions', [])) ? ctx.get('interventions', []) : [];
  const arms = normalizeArms(armsRaw);
  const consortSaved = ctx.get('consort', null);

  root.innerHTML = `
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Sơ đồ nghiên cứu (CONSORT)</h3>
    <div class="card-subtitle">
      Tạo sơ đồ CONSORT từ các nhánh can thiệp đã khai báo. Bạn có thể nhập số liệu (n) theo từng nhánh để hiển thị trên sơ đồ.
    </div>
  </div>

  <div class="card-body" style="display:grid; gap:16px;">
    <div class="muted">
      <strong>Nhánh hiện có:</strong>
      <div id="arm-summary" style="margin-top:4px;"></div>
    </div>

    <div class="grid-2" style="align-items:start;">
      <!-- LEFT: FORM -->
      <div id="consort-form" class="card muted" style="padding:12px;">
        <div style="font-weight:600; margin-bottom:8px;">Thông số chung</div>
        <div class="grid-2" style="gap:8px;">
          <label>Đánh giá đủ điều kiện (Assessed)
            <input id="assessed" type="number" min="0" placeholder="n" />
          </label>
          <label>Loại trừ (Excluded)
            <input id="excluded" type="number" min="0" placeholder="n" />
          </label>
        </div>
        <label>Lý do loại trừ (tóm tắt, mỗi lý do cách nhau bằng dấu chấm phẩy ;)
          <textarea id="excluded_reasons" rows="2" placeholder="Không phù hợp tiêu chí; Từ chối tham gia; ..."></textarea>
        </label>
        <div class="grid-2" style="gap:8px; margin-top:6px;">
          <label>Ngẫu nhiên hoá (Randomized)
            <input id="randomized" type="number" min="0" placeholder="(tuỳ chọn, sẽ tự tính = tổng Allocated nếu để trống)" />
          </label>
          <label>Tên sơ đồ (tuỳ chọn)
            <input id="diagram_title" type="text" placeholder="RCT Flow / CONSORT diagram" />
          </label>
        </div>

        <hr style="margin:12px 0; border:none; border-top:1px solid #e5e7eb;" />

        <div style="font-weight:600; margin-bottom:6px;">Theo từng nhánh</div>
        <div id="arms-form" style="display:grid; gap:12px;"></div>
      </div>

      <!-- RIGHT: Mermaid + Controls -->
      <div class="card" style="padding:12px;">
        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:8px;">
          <button id="gen-btn" class="btn-primary">Generate Mermaid</button>
          <button id="render-btn" class="btn-secondary">Render</button>
          <button id="save-btn" class="btn-secondary">Lưu</button>
          <button id="copy-btn" class="btn-secondary">Sao chép code</button>
          <button id="png-btn" class="btn-secondary">Xuất PNG</button>
        </div>

        <label>
          <div style="font-weight:600; margin-bottom:6px;">Mermaid code</div>
          <textarea id="mm-code" rows="12" placeholder="Mermaid code sẽ sinh ở đây..."></textarea>
        </label>

        <div id="consort-diagram-wrap" style="margin-top:12px; overflow:auto;">
          <div id="consort-diagram" class="muted" style="border:1px dashed #d1d5db; padding:12px; border-radius:12px; min-height:180px;">
            <em>Chưa có sơ đồ. Nhấn "Generate Mermaid" rồi "Render".</em>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`.trim();

  // ====== Render summary & inputs ======
  const armSummaryEl = root.querySelector('#arm-summary');
  armSummaryEl.textContent = arms.length
    ? arms.map((a, i) => `Nhánh ${i + 1}: ${a}`).join(' | ')
    : 'Chưa có nhánh (sẽ tạo mặc định 1 nhánh).';

  const formWrap = root.querySelector('#arms-form');
  const common = {
    assessed: root.querySelector('#assessed'),
    excluded: root.querySelector('#excluded'),
    excluded_reasons: root.querySelector('#excluded_reasons'),
    randomized: root.querySelector('#randomized'),
    diagram_title: root.querySelector('#diagram_title'),
  };

  // Prefill from saved state if exists
  const pre = consortSaved || defaultConsort(arms);
  fillCommon(common, pre);
  renderArmsForm(formWrap, arms, pre);

  // ====== Hook buttons ======
  const mmEl = root.querySelector('#mm-code');
  const genBtn = root.querySelector('#gen-btn');
  const renderBtn = root.querySelector('#render-btn');
  const saveBtn = root.querySelector('#save-btn');
  const copyBtn = root.querySelector('#copy-btn');
  const pngBtn = root.querySelector('#png-btn');
  const diagramWrap = root.querySelector('#consort-diagram');

  // If previously saved diagram code, show it
  const savedDiagram = ctx.get('flowDiagram', null);
  if (savedDiagram?.mermaid) {
    mmEl.value = savedDiagram.mermaid;
    // Try render silently
    tryRender(mmEl.value);
  }

  genBtn.addEventListener('click', () => {
    const consort = collectConsort(formWrap, common, arms);
    const code = buildMermaid(consort);
    mmEl.value = code;
    ctx.toast('Đã sinh Mermaid code.');
  });

  renderBtn.addEventListener('click', () => {
    const code = (mmEl.value || '').trim();
    tryRender(code);
  });

  saveBtn.addEventListener('click', () => {
    const consort = collectConsort(formWrap, common, arms);
    const code = (mmEl.value || '').trim();
    ctx.save('consort', consort);
    ctx.save('flowDiagram', { mermaid: code, updated_at: new Date().toISOString() });
    ctx.toast('Đã lưu sơ đồ và số liệu CONSORT.');
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mmEl.value || '');
      ctx.toast('Đã sao chép Mermaid code.');
    } catch {
      ctx.toast('Không thể sao chép.');
    }
  });

  pngBtn.addEventListener('click', async () => {
    if (!html2canvas) {
      ctx.toast('Thiếu html2canvas.');
      return;
    }
    const wrap = root.querySelector('#consort-diagram-wrap');
    try {
      const canvas = await html2canvas(wrap, { useCORS: true, backgroundColor: null, scale: 2 });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `consort_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { a.remove(); }, 0);
    } catch (e) {
      console.error(e);
      ctx.toast('Xuất PNG thất bại.');
    }
  });

  // ====== helpers ======
  function tryRender(code) {
    if (!code) { ctx.toast('Chưa có Mermaid code để render.'); return; }
    if (!mermaid) { ctx.toast('Thiếu Mermaid.'); return; }
    try {
      // Mermaid v10+ khuyên dùng render()
      const id = 'consort_' + Date.now();
      mermaid.render(id, code).then(({ svg }) => {
        diagramWrap.innerHTML = svg;
      }).catch(err => {
        console.error(err);
        diagramWrap.innerHTML = `<div style="color:#b91c1c">Mermaid parse error. Kiểm tra code.</div>`;
      });
    } catch (e) {
      console.error(e);
      diagramWrap.innerHTML = `<div style="color:#b91c1c">Không render được sơ đồ.</div>`;
    }
  }

  function fillCommon(dom, data) {
    if (dom.assessed) dom.assessed.value = numOrEmpty(data.assessed);
    if (dom.excluded) dom.excluded.value = numOrEmpty(data.excluded);
    if (dom.excluded_reasons) dom.excluded_reasons.value = data.excluded_reasons || '';
    if (dom.randomized) dom.randomized.value = numOrEmpty(data.randomized);
    if (dom.diagram_title) dom.diagram_title.value = data.diagram_title || '';
  }

  function renderArmsForm(container, armNames, data) {
    container.innerHTML = '';
    const arr = data.arms && data.arms.length ? data.arms : armNames.map(n => emptyArm(n));
    arr.forEach((a, idx) => {
      const block = document.createElement('div');
      block.className = 'card';
      block.style.padding = '10px';
      block.innerHTML = `
        <div style="font-weight:600; margin-bottom:6px;">Nhánh ${idx + 1}: <span>${escapeHtml(a.name)}</span></div>
        <div class="grid-3" style="gap:8px;">
          <label>Allocated<input data-k="allocated" type="number" min="0" placeholder="n" value="${numOrEmpty(a.allocated)}"></label>
          <label>Received<input data-k="received" type="number" min="0" placeholder="n" value="${numOrEmpty(a.received)}"></label>
          <label>Không nhận can thiệp<input data-k="not_received" type="number" min="0" placeholder="n" value="${numOrEmpty(a.not_received)}"></label>
        </div>
        <label>Lý do không nhận can thiệp
          <input data-k="not_received_reasons" type="text" placeholder="Lý do..." value="${escapeAttr(a.not_received_reasons || '')}">
        </label>
        <div class="grid-3" style="gap:8px; margin-top:6px;">
          <label>Mất theo dõi<input data-k="lost" type="number" min="0" placeholder="n" value="${numOrEmpty(a.lost)}"></label>
          <label>Ngừng can thiệp<input data-k="discontinued" type="number" min="0" placeholder="n" value="${numOrEmpty(a.discontinued)}"></label>
          <label>Được phân tích<input data-k="analyzed" type="number" min="0" placeholder="n" value="${numOrEmpty(a.analyzed)}"></label>
        </div>
        <label>Loại khỏi phân tích
          <input data-k="excluded_from_analysis" type="number" min="0" placeholder="n" value="${numOrEmpty(a.excluded_from_analysis)}">
        </label>
      `.trim();
      // attach dataset index for collecting later
      block.dataset.armIndex = String(idx);
      container.appendChild(block);
    });
  }

  function collectConsort(container, dom, armNames) {
    const obj = {
      diagram_title: (dom.diagram_title?.value || '').trim(),
      assessed: toInt(dom.assessed?.value),
      excluded: toInt(dom.excluded?.value),
      excluded_reasons: (dom.excluded_reasons?.value || '').trim(),
      randomized: toInt(dom.randomized?.value),
      arms: [],
    };

    const blocks = [...container.children];
    blocks.forEach((blk, i) => {
      const name = armNames[i] || `Arm ${i + 1}`;
      const inputs = blk.querySelectorAll('input[data-k]');
      const arm = emptyArm(name);
      inputs.forEach(inp => {
        const k = inp.getAttribute('data-k');
        if (!k) return;
        if (k.endsWith('_reasons')) {
          arm[k] = (inp.value || '').trim();
        } else {
          arm[k] = toInt(inp.value);
        }
      });
      obj.arms.push(arm);
    });

    // randomized fallback if empty
    if (!isFiniteNumber(obj.randomized)) {
      const totalAlloc = obj.arms.reduce((s, a) => s + (a.allocated || 0), 0);
      obj.randomized = totalAlloc || undefined;
    }
    return obj;
  }

  function buildMermaid(consort) {
    // Mermaid flowchart TB
    // Node ids must be unique
    const id = () => 'N' + Math.random().toString(36).slice(2, 8);
    const ids = {
      title: id(),
      assessed: id(),
      excluded: id(),
      random: id(),
    };

    const lines = [];
    lines.push('flowchart TB');

    // optional title as comment box
    if (consort.diagram_title) {
      lines.push(`%% ${escapeMermaid(consort.diagram_title)}`);
    }

    const assessedTxt = `Assessed for eligibility (n=${safeN(consort.assessed)})`;
    lines.push(`${ids.assessed}["${assessedTxt}"]`);

    // Excluded branch
    const exclN = safeN(consort.excluded);
    if (isFiniteNumber(consort.excluded)) {
      const exclId = ids.excluded;
      const reasons = (consort.excluded_reasons || '').trim();
      const reasonTxt = reasons ? `\\nReasons: ${escapeMermaid(reasons)}` : '';
      lines.push(`${exclId}["Excluded (n=${exclN})${reasonTxt}"]`);
      lines.push(`${ids.assessed} --> ${exclId}`);
    }

    // Randomized
    const randN = safeN(consort.randomized);
    lines.push(`${ids.random}["Randomized (n=${randN})"]`);
    lines.push(`${ids.assessed} --> ${ids.random}`);

    // Arms
    consort.arms.forEach((a, i) => {
      const base = {
        alloc: id(),
        recv: id(),
        nrecv: id(),
        lost: id(),
        disc: id(),
        analyzed: id(),
        exclA: id(),
      };
      const label = escapeMermaid(a.name || `Arm ${i + 1}`);

      // Allocation
      lines.push(`${base.alloc}["Allocated to ${label} (n=${safeN(a.allocated)})"]`);
      lines.push(`${ids.random} --> ${base.alloc}`);

      // Received / Not received
      lines.push(`${base.recv}["Received allocated intervention (n=${safeN(a.received)})"]`);
      lines.push(`${base.nrecv}["Did not receive allocated intervention (n=${safeN(a.not_received)})${fmtReasons(a.not_received_reasons)}"]`);
      lines.push(`${base.alloc} --> ${base.recv}`);
      lines.push(`${base.alloc} --> ${base.nrecv}`);

      // Follow-up
      lines.push(`${base.lost}["Lost to follow-up (n=${safeN(a.lost)})"]`);
      lines.push(`${base.disc}["Discontinued intervention (n=${safeN(a.discontinued)})"]`);
      lines.push(`${base.recv} --> ${base.lost}`);
      lines.push(`${base.recv} --> ${base.disc}`);

      // Analysis
      lines.push(`${base.analyzed}["Analyzed (n=${safeN(a.analyzed)})"]`);
      lines.push(`${base.recv} --> ${base.analyzed}`);

      if (isFiniteNumber(a.excluded_from_analysis)) {
        lines.push(`${base.exclA}["Excluded from analysis (n=${safeN(a.excluded_from_analysis)})"]`);
        lines.push(`${base.analyzed} --> ${base.exclA}`);
      }
    });

    return lines.join('\n');
  }

  // ===== small utils =====
  function normalizeArms(arr) {
    if (!arr || !arr.length) return ['Nhánh 1'];
    return arr.map(x => {
      if (typeof x === 'string') return x || 'Arm';
      const n = x?.name || x?.label || x?.arm || '';
      return String(n || 'Arm').trim() || 'Arm';
    });
  }
  function emptyArm(name) {
    return {
      name: name || 'Arm',
      allocated: undefined,
      received: undefined,
      not_received: undefined,
      not_received_reasons: '',
      lost: undefined,
      discontinued: undefined,
      analyzed: undefined,
      excluded_from_analysis: undefined,
    };
  }
  function defaultConsort(armNames) {
    return {
      diagram_title: '',
      assessed: undefined,
      excluded: undefined,
      excluded_reasons: '',
      randomized: undefined,
      arms: armNames.map(n => emptyArm(n)),
    };
  }
  function toInt(v) {
    const n = parseInt(String(v || '').trim(), 10);
    return Number.isFinite(n) ? n : undefined;
  }
  function isFiniteNumber(x) {
    return typeof x === 'number' && Number.isFinite(x);
  }
  function numOrEmpty(x) { return isFiniteNumber(x) ? String(x) : ''; }
  function safeN(x) { return isFiniteNumber(x) ? x : 0; }
  function fmtReasons(s) {
    const t = (s || '').trim();
    return t ? `\\nReasons: ${escapeMermaid(t)}` : '';
  }
  function escapeMermaid(s) {
    return String(s).replace(/"/g, '\\"');
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }
}
