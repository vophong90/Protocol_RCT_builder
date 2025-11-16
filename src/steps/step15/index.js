// src/steps/step15/index.js
// Step 15 – Sơ đồ tiến hành nghiên cứu (flow nghiên cứu, không phải CONSORT)

// State / vendor:
//  - ctx.vendor.mermaid, ctx.vendor.html2canvas
//  - ctx.get('pico'), ctx.get('design'), ctx.get('interventions'), ctx.get('dataCollection')
//  - ctx.get / ctx.save('studyFlow'), ctx.save('flowDiagram')

export async function mount(rootEl, ctx) {
  const mermaid = ctx?.vendor?.mermaid;
  const html2canvas = ctx?.vendor?.html2canvas;

  // Scope CSS riêng cho step15
  rootEl.closest('.step')?.setAttribute('data-scope', 'step15');

  // ===== Lấy bối cảnh =====
  const pico = ctx.get('pico', {}) || {};
  const design = ctx.get('design', {}) || {};
  const dataCollection = ctx.get('dataCollection', {}) || {};

  const rawArms = Array.isArray(ctx.get('interventions', []))
    ? ctx.get('interventions', [])
    : [];
  const armNames = normalizeArms(rawArms);

  const saved = ctx.get('studyFlow', null);
  const state = saved || defaultFlowState(armNames);

  // ===== UI =====
  rootEl.innerHTML = `
    <div class="card-header">
      <h3 class="card-title">Sơ đồ tiến hành nghiên cứu</h3>
      <div class="card-subtitle">
        Sơ đồ hoá các bước chính của nghiên cứu (tuyển chọn, khám ban đầu, phân nhóm, can thiệp từng nhóm,
        theo dõi – đánh giá, xử lý số liệu).
      </div>
    </div>

    <div class="card-body">
      <div class="flow-context-box">
        <div class="flow-context-title">Tóm tắt bối cảnh:</div>
        <div id="flow-context" class="flow-context-text"></div>
      </div>

      <label>
        <span>Tiêu đề sơ đồ (tuỳ chọn)</span>
        <input
          id="flow-title"
          type="text"
          placeholder="Ví dụ: Quy trình tiến hành thử nghiệm RCT thoái hoá khớp gối"
          value="${escapeAttr(state.title || '')}"
        />
      </label>

      <div class="flow-section-title">Các bước chung</div>

      <label>
        <span>1. Tuyển chọn / Sàng lọc</span>
        <textarea id="flow-screen" rows="2"
          placeholder="BN thoả tiêu chuẩn vào/loại; giải thích nghiên cứu, xin đồng thuận...">${escapeHtml(
            state.steps.screen || ''
          )}</textarea>
      </label>

      <label>
        <span>2. Khám ban đầu &amp; đo lường (Baseline)</span>
        <textarea id="flow-baseline" rows="2"
          placeholder="Khám lâm sàng, cận lâm sàng, đo VAS, WOMAC, test chức năng...">${escapeHtml(
            state.steps.baseline || ''
          )}</textarea>
      </label>

      <label>
        <span>3. Phân nhóm ngẫu nhiên</span>
        <textarea id="flow-random" rows="2"
          placeholder="Mô tả cách ngẫu nhiên hoá, che giấu phân nhóm (nếu có)...">${escapeHtml(
            state.steps.randomize || ''
          )}</textarea>
      </label>

      <label>
        <span>4. Theo dõi &amp; đánh giá theo mốc thời gian</span>
        <textarea id="flow-follow" rows="3"
          placeholder="Ví dụ: Đánh giá VAS, WOMAC, test chức năng tại tuần 0, 2, 4, 8...">${escapeHtml(
            state.steps.followup || ''
          )}</textarea>
      </label>

      <label>
        <span>5. Xử lý số liệu &amp; kết luận</span>
        <textarea id="flow-analysis" rows="2"
          placeholder="Mô tả ngắn gọn xử lý số liệu, phân tích chính, kết thúc nghiên cứu...">${escapeHtml(
            state.steps.analysis || ''
          )}</textarea>
      </label>

      <div class="flow-section-title">Mô tả theo từng nhóm can thiệp</div>
      <div id="flow-arms" class="flow-arms-list"></div>

      <div class="flow-section-title">Mermaid &amp; sơ đồ</div>

      <div class="btn-row">
        <button id="flow-gen" class="btn btn-primary" type="button">Generate Mermaid</button>
        <button id="flow-render" class="btn btn-secondary" type="button">Render</button>
      </div>
      <div class="btn-row">
        <button id="flow-copy" class="btn btn-secondary" type="button">Sao chép code</button>
        <button id="flow-png" class="btn btn-secondary" type="button">Xuất PNG</button>
      </div>

      <label>
        <span>Mermaid code</span>
        <textarea id="flow-mm" rows="10"
          placeholder="Mermaid flowchart sẽ được sinh ở đây..."></textarea>
      </label>

      <div id="flow-diagram-wrap" class="flow-diagram-wrap">
        <div id="flow-diagram" class="flow-diagram-placeholder">
          <em>Chưa có sơ đồ. Nhập mô tả, nhấn “Generate Mermaid” rồi “Render”.</em>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <button id="flow-save" class="btn btn-primary" type="button">
        Lưu sơ đồ &amp; mô tả tiến hành nghiên cứu
      </button>
    </div>
  `.trim();

  // ===== Tóm tắt bối cảnh =====
  const ctxEl = rootEl.querySelector('#flow-context');
  ctxEl.textContent = buildContextSummary(pico, design, armNames, dataCollection);

  // ===== Render mô tả từng nhóm =====
  const armsContainer = rootEl.querySelector('#flow-arms');
  renderArmsForm(armsContainer, armNames, state.arms || []);

  // Refs form
  const titleEl = rootEl.querySelector('#flow-title');
  const screenEl = rootEl.querySelector('#flow-screen');
  const baselineEl = rootEl.querySelector('#flow-baseline');
  const randomEl = rootEl.querySelector('#flow-random');
  const followEl = rootEl.querySelector('#flow-follow');
  const analysisEl = rootEl.querySelector('#flow-analysis');

  const mmEl = rootEl.querySelector('#flow-mm');
  const genBtn = rootEl.querySelector('#flow-gen');
  const renderBtn = rootEl.querySelector('#flow-render');
  const copyBtn = rootEl.querySelector('#flow-copy');
  const pngBtn = rootEl.querySelector('#flow-png');
  const saveBtn = rootEl.querySelector('#flow-save');
  const diagramEl = rootEl.querySelector('#flow-diagram');

  // Nạp lại code cũ (nếu có)
  const savedDiagram = ctx.get('flowDiagram', null);
  if (savedDiagram?.mermaid) {
    mmEl.value = savedDiagram.mermaid;
    tryRender(savedDiagram.mermaid);
  }

  // ===== Events =====
  genBtn.addEventListener('click', () => {
    const flow = collectFlow();
    const code = buildMermaidFlow(flow);
    mmEl.value = code;
    ctx.toast('Đã sinh Mermaid flowchart.');
  });

  renderBtn.addEventListener('click', () => {
    const code = (mmEl.value || '').trim();
    tryRender(code);
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
    const wrap = rootEl.querySelector('#flow-diagram-wrap');
    try {
      const canvas = await html2canvas(wrap, {
        useCORS: true,
        backgroundColor: null,
        scale: 2,
      });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_flow_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 0);
    } catch (e) {
      console.error(e);
      ctx.toast('Xuất PNG thất bại.');
    }
  });

  saveBtn.addEventListener('click', () => {
    const flow = collectFlow();
    ctx.save('studyFlow', flow);
    ctx.save('flowDiagram', {
      mermaid: (mmEl.value || '').trim(),
      updated_at: new Date().toISOString(),
    });
    ctx.toast('Đã lưu sơ đồ tiến hành nghiên cứu.');
  });

  // ===== Helper – gom dữ liệu =====
  function collectFlow() {
    const armsDesc = [];
    const blocks = armsContainer.querySelectorAll('[data-arm-idx]');
    blocks.forEach((blk, idx) => {
      const name =
        blk.querySelector('.flow-arm-name')?.textContent?.trim() ||
        armNames[idx] ||
        `Nhóm ${idx + 1}`;
      const desc = blk.querySelector('textarea')?.value || '';
      armsDesc.push({ name, description: desc });
    });

    return {
      title: (titleEl.value || '').trim(),
      steps: {
        screen: (screenEl.value || '').trim(),
        baseline: (baselineEl.value || '').trim(),
        randomize: (randomEl.value || '').trim(),
        followup: (followEl.value || '').trim(),
        analysis: (analysisEl.value || '').trim(),
      },
      arms: armsDesc,
    };
  }

  function tryRender(code) {
    if (!code) {
      ctx.toast('Chưa có Mermaid code để render.');
      return;
    }
    if (!mermaid) {
      ctx.toast('Thiếu Mermaid.');
      return;
    }
    try {
      const id = 'studyflow_' + Date.now();
      mermaid
        .render(id, code)
        .then(({ svg }) => {
          diagramEl.innerHTML = svg;
        })
        .catch((err) => {
          console.error(err);
          diagramEl.innerHTML =
            '<div class="flow-error">Mermaid parse error. Kiểm tra code.</div>';
        });
    } catch (e) {
      console.error(e);
      diagramEl.innerHTML =
        '<div class="flow-error">Không render được sơ đồ.</div>';
    }
  }

  function renderArmsForm(container, names, armsState) {
    container.innerHTML = '';
    const list =
      armsState && armsState.length
        ? armsState
        : names.map((n) => ({ name: n, description: '' }));

    list.forEach((arm, idx) => {
      const block = document.createElement('div');
      block.className = 'flow-arm-block';
      block.dataset.armIdx = String(idx);
      block.innerHTML = `
        <div class="flow-arm-title">
          Nhóm ${idx + 1}: <span class="flow-arm-name">${escapeHtml(
            arm.name
          )}</span>
        </div>
        <textarea rows="3"
          placeholder="Mô tả can thiệp &amp; mốc đánh giá cho nhóm này (ví dụ: Điện châm 3 lần/tuần trong 4 tuần; đo VAS, WOMAC tại tuần 0, 2, 4, 8...)">${escapeHtml(
            arm.description || ''
          )}</textarea>
      `.trim();
      container.appendChild(block);
    });
  }
}

/* ===== Utils & default state ===== */

function normalizeArms(arr) {
  if (!arr || !arr.length) return ['Nhóm chứng', 'Nhóm can thiệp'];
  return arr.map((x, i) => {
    if (typeof x === 'string') return x || `Nhóm ${i + 1}`;
    const n = x?.name || x?.label || x?.arm || '';
    const name = String(n || '').trim();
    return name || `Nhóm ${i + 1}`;
  });
}

function defaultFlowState(arms) {
  return {
    title: '',
    steps: {
      screen: '',
      baseline: '',
      randomize: '',
      followup: '',
      analysis: '',
    },
    arms: arms.map((n) => ({ name: n, description: '' })),
  };
}

function buildContextSummary(pico, design, armNames, dataCollection) {
  const lines = [];
  lines.push('PICO:');
  lines.push(`- P: ${pico.p || ''}`);
  lines.push(`- I: ${pico.i || ''}`);
  lines.push(`- C: ${pico.c || ''}`);
  lines.push(`- O: ${pico.o || ''}`);
  lines.push('');
  lines.push(`Số nhóm can thiệp: ${armNames.length}`);
  lines.push(
    `Nhánh: ${armNames.length ? armNames.join(' | ') : '(chưa khai báo)'}`
  );
  lines.push('');
  lines.push(`Thiết kế (rút gọn): ${jsonSafe(design)}`);
  lines.push('');
  lines.push('Lịch thu thập (tóm tắt):');
  const dc = jsonSafe(dataCollection);
  lines.push(dc || '(chưa thiết lập)');
  return lines.join('\n');
}

function buildMermaidFlow(flow) {
  const lines = [];
  lines.push('flowchart TB');

  if (flow.title) {
    lines.push(`%% ${escapeMermaid(flow.title)}`);
  }

  const S1 = 'S1';
  const S2 = 'S2';
  const S3 = 'S3';
  const S4 = 'S4';
  const S5 = 'S5';

  const text1 = `Tuyển chọn / Sàng lọc\\n${escapeMermaid(flow.steps.screen || '')}`;
  const text2 = `Khám ban đầu & đo lường\\n${escapeMermaid(
    flow.steps.baseline || ''
  )}`;
  const text3 = `Phân nhóm ngẫu nhiên\\n${escapeMermaid(
    flow.steps.randomize || ''
  )}`;
  const text4 = `Theo dõi & đánh giá\\n${escapeMermaid(
    flow.steps.followup || ''
  )}`;
  const text5 = `Xử lý số liệu & kết luận\\n${escapeMermaid(
    flow.steps.analysis || ''
  )}`;

  lines.push(`${S1}["${text1}"]`);
  lines.push(`${S2}["${text2}"]`);
  lines.push(`${S3}["${text3}"]`);
  lines.push(`${S4}["${text4}"]`);
  lines.push(`${S5}["${text5}"]`);

  lines.push(`${S1} --> ${S2}`);
  lines.push(`${S2} --> ${S3}`);

  (flow.arms || []).forEach((arm, idx) => {
    const id = `A${idx + 1}`;
    const label =
      `${arm.name || 'Nhóm ' + (idx + 1)}\\n` +
      escapeMermaid(arm.description || '');
    lines.push(`${id}["${label}"]`);
    lines.push(`${S3} --> ${id}`);
    lines.push(`${id} --> ${S4}`);
  });

  lines.push(`${S4} --> ${S5}`);

  return lines.join('\n');
}

function escapeMermaid(s) {
  return String(s || '').replace(/"/g, '\\"');
}

function jsonSafe(obj) {
  try {
    const s = JSON.stringify(obj);
    return s === '{}' ? '—' : s;
  } catch {
    return '';
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s) {
  return String(s || '').replace(/"/g, '&quot;');
}
