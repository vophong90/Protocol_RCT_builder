// js/steps/step-design.js
;(function () {
  // ===== Utils =====
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id) ? $(id).value : '');
  const setVal = (id, v) => { if ($(id)) $(id).value = v ?? ''; };
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // ====== Hiển thị ẩn/hiện block theo loại thiết kế ======
  function updateDesignFields() {
    const type = val('design-type');

    // Các khối wrapper cần tồn tại trong HTML:
    // - parallel-fields   (tuần can thiệp, số nhóm, tên nhóm...)
    // - crossover-fields  (phase1/phase2, washout, g1/g2 ...)
    const parallelWrap  = $('parallel-fields');
    const crossoverWrap = $('crossover-fields');

    if (parallelWrap)  parallelWrap.style.display  = (type === 'parallel') ? '' : 'none';
    if (crossoverWrap) crossoverWrap.style.display = (type === 'cross-over') ? '' : 'none';

    if (type === 'parallel') {
      // khi chuyển sang parallel, đảm bảo có ít nhất 2 nhóm
      const nInput = $('num-arms');
      let n = Math.max(2, parseInt(nInput?.value || '2', 10) || 2);
      if (nInput) nInput.value = String(n);
      // đồng bộ legacy key mà file 2 có đọc
      localStorage.setItem('num-arms', String(n));
      // vẽ lại tên nhóm
      renderArms(true);
      // đồng bộ bước 9 + khung bước 10
      syncNumArmsToStep9AndStep10();
    } else if (type === 'cross-over') {
      // cross-over không dùng num-arms; nhưng nếu trước đó có để legacy thì giữ nguyên,
      // không xóa để tránh ảnh hưởng code cũ — chỉ ẩn giao diện.
      // Gọi save để lưu type + các input cross-over
      window.saveData && window.saveData();
    }
  }

  // ====== Vẽ input tên các nhóm can thiệp (parallel) ======
  // recreate = true sẽ dựng lại từ đầu theo số nhóm hiện tại
  function renderArms(recreate = true) {
    const container = $('arm-names'); // container để render input tên nhóm
    if (!container) return;

    const n = Math.max(2, parseInt(val('num-arms') || '2', 10) || 2);
    // lấy state hiện có để giữ tên nhóm đã lưu
    const state = (typeof window.getAppData === 'function') ? window.getAppData() : null;
    const savedArms = state?.design?.parallel?.arms || [];

    if (recreate) container.innerHTML = '';

    // đảm bảo đúng số lượng input
    const current = container.querySelectorAll('input[data-arm-name]');
    const diff = n - current.length;

    // Thêm bớt cho khớp số lượng
    if (diff > 0) {
      for (let i = current.length; i < n; i++) {
        container.appendChild(makeArmInput(i, savedArms[i]?.name || `Nhóm ${i + 1}`));
      }
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) {
        const last = container.querySelector('div[data-arm-row]:last-child');
        last && last.remove();
      }
    }

    // Đồng bộ lại nhãn “Nhóm 1…n” nếu trống
    const inputs = container.querySelectorAll('input[data-arm-name]');
    inputs.forEach((inp, i) => {
      if (!inp.value.trim()) inp.value = savedArms[i]?.name || `Nhóm ${i + 1}`;
    });

    // Khi đổi tên nhóm → lưu + đồng bộ Bước 10
    inputs.forEach((inp, i) => {
      on(inp, 'input', () => {
        window.saveData && window.saveData();
        updateStep10ArmNames();
      });
    });

    // Đồng bộ số nhóm sang Bước 9 và khối Bước 10
    syncNumArmsToStep9AndStep10();
    // Lưu state
    window.saveData && window.saveData();
  }

  // Tạo một dòng input tên nhóm
  function makeArmInput(index, value) {
    const row = document.createElement('div');
    row.dataset.armRow = '1';
    row.style.display = 'grid';
    row.style.gridTemplateColumns = 'auto 1fr';
    row.style.gap = '8px';
    row.style.marginTop = index === 0 ? '0' : '6px';

    const label = document.createElement('div');
    label.textContent = `Nhóm ${index + 1}`;

    const input = document.createElement('input');
    input.type = 'text';
    input.setAttribute('data-arm-name', '1');
    input.setAttribute('data-arm-index', String(index));
    input.placeholder = `Nhập tên nhóm ${index + 1}`;
    input.value = value || `Nhóm ${index + 1}`;
    input.style.width = '100%';

    row.appendChild(label);
    row.appendChild(input);
    return row;
  }

  // ====== Đồng bộ số nhóm sang Step 9 và dựng khối Step 10 nếu có ======
  function syncNumArmsToStep9AndStep10() {
    const n = Math.max(2, parseInt(val('num-arms') || '2', 10) || 2);

    // Step 9
    if ($('num-arms-step9')) $('num-arms-step9').value = String(n);

    // Step 10 (mô tả can thiệp) — nếu container tồn tại, ta đảm bảo số textarea khớp số nhóm
    ensureInterventionTextareas(n);
  }

  // Dựng/điều chỉnh textareas mô tả can thiệp theo số nhóm
  function ensureInterventionTextareas(n) {
    const wrap = $('intervention-descriptions');
    if (!wrap) return;

    // Lấy tên nhóm hiện tại để dán nhãn
    const armInputs = Array.from(document.querySelectorAll('input[data-arm-name]'));
    const armNames = armInputs.length
      ? armInputs.map((i, idx) => i.value?.trim() || `Nhóm ${idx + 1}`)
      : Array.from({ length: n }, (_, i) => `Nhóm ${i + 1}`);

    // Lấy dữ liệu cũ (nếu có) để không mất nội dung đang gõ
    const oldAreas = Array.from(wrap.querySelectorAll('textarea[data-arm-index]'));
    const oldMap = new Map(oldAreas.map((ta) => [Number(ta.dataset.armIndex), ta.value]));

    // Xóa và dựng lại đầy đủ
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const block = document.createElement('div');
      block.style.marginTop = i === 0 ? '0' : '12px';

      const label = document.createElement('div');
      label.style.fontWeight = '600';
      label.style.marginBottom = '4px';
      label.textContent = armNames[i];

      const ta = document.createElement('textarea');
      ta.rows = 3;
      ta.style.width = '100%';
      ta.placeholder = `Mô tả can thiệp cho ${armNames[i]}...`;
      ta.setAttribute('data-arm-index', String(i));
      ta.setAttribute('data-arm-name', armNames[i]);
      // hồi phục nội dung cũ nếu có
      ta.value = oldMap.get(i) || '';
      on(ta, 'input', () => window.saveData && window.saveData());

      block.appendChild(label);
      block.appendChild(ta);
      wrap.appendChild(block);
    }

    // Lưu
    window.saveData && window.saveData();
  }

  // Khi đổi tên nhóm (ở Bước 6) → cập nhật nhãn và data-arm-name ở Bước 10
  function updateStep10ArmNames() {
    const wrap = $('intervention-descriptions');
    if (!wrap) return;
    const armInputs = Array.from(document.querySelectorAll('input[data-arm-name]'));
    const textareas = Array.from(wrap.querySelectorAll('textarea[data-arm-index]'));

    textareas.forEach((ta) => {
      const idx = Number(ta.dataset.armIndex || '0');
      const name = armInputs[idx]?.value?.trim() || `Nhóm ${idx + 1}`;
      ta.dataset.armName = name;
      // cập nhật nhãn hiển thị (div ngay trước textarea)
      const labelDiv = ta.previousElementSibling;
      if (labelDiv) labelDiv.textContent = name;
    });

    window.saveData && window.saveData();
  }

  // ====== Gắn sự kiện giao diện (num-arms, weeks, randomization, blinding…) ======
  function attachDesignEvents() {
    const typeSel = $('design-type');
    const numArms = $('num-arms');
    const weeks   = $('intervention-weeks');
    const randSel = $('randomization');
    const blindSel= $('blinding');

    on(typeSel, 'change', () => {
      updateDesignFields();
      window.saveData && window.saveData();
    });

    on(numArms, 'change', () => {
      // ràng buộc min 2, max 10 (có thể nới nếu cần)
      let n = parseInt(numArms.value || '2', 10) || 2;
      if (n < 2) n = 2;
      if (n > 10) n = 10;
      numArms.value = String(n);

      // đồng bộ legacy key (file 2 có đọc)
      localStorage.setItem('num-arms', String(n));

      renderArms(true);
      syncNumArmsToStep9AndStep10();
      window.saveData && window.saveData();
    });

    on(weeks, 'input', () => {
      window.saveData && window.saveData();
    });

    on(randSel, 'change', () => {
      window.saveData && window.saveData();
    });

    on(blindSel, 'change', () => {
      window.saveData && window.saveData();
    });

    // Cross-over inputs
    [
      'crossover-phase1',
      'crossover-g1-phase1',
      'crossover-g2-phase1',
      'crossover-washout',
      'crossover-phase2',
      'crossover-g1-phase2',
      'crossover-g2-phase2',
    ].forEach((id) => {
      const el = $(id);
      on(el, 'input', () => window.saveData && window.saveData());
      on(el, 'change', () => window.saveData && window.saveData());
    });
  }

  // ====== Khởi tạo khi DOM sẵn sàng ======
  document.addEventListener('DOMContentLoaded', () => {
    // dựng giao diện theo state đã lưu (file 2 sẽ gọi updateDesignFields nếu có)
    attachDesignEvents();
    updateDesignFields();

    // Nếu đang ở thiết kế song song, đảm bảo khung can thiệp step 10 khớp
    const type = val('design-type');
    if (type === 'parallel') {
      renderArms(false); // nhẹ nhàng: chỉ điền tên nếu inputs đã có
      syncNumArmsToStep9AndStep10();
    }
  });

  // ====== Public APIs (để file 2 gọi) ======
  window.updateDesignFields = updateDesignFields;
  window.renderArms = renderArms;
})();
