// js/state.js
;(function () {
  const STORAGE_KEY = 'rctWizardData';

  // ===== Default shape giữ nguyên logic cũ =====
  const defaults = {
    stepIndex: 0,
    pico: { p: '', i: '', c: '', o: '' },
    question: '',
    mainObjective: '',
    subObjectives: [],

    design: {
      type: '',              // parallel | cross-over | ''
      randomization: '',     // hiển thị phần Thiết kế
      blinding: '',
      parallel: {
        weeks: '',
        numArms: 2,
        arms: [
          { name: 'Nhóm 1' },
          { name: 'Nhóm 2' },
        ],
      },
      crossover: {
        phase1: '',
        g1p1: '',
        g2p1: '',
        washout: '',
        phase2: '',
        g1p2: '',
        g2p2: '',
      },
    },

    sample: {
      method: '', // sample-size-method
    },

    criteria: {
      inclusion: [], // mỗi phần tử là string (tiêu chí)
      exclusion: [],
    },

    randomization: {
      method: '',     // step 9 select
      text: '',       // textarea mô tả
      options: {},    // tùy chọn sinh động (block size/ strat factors...)
      numArms: null,  // hiển thị ở step 9 (readonly)
    },

    interventions: {
      // Mảng mô tả theo arm (tên + mô tả)
      // [{ armIndex: 0, name: 'Nhóm 1', description: '...' }, ...]
      descriptions: [],
    },

    variables: {
      all: [],        // CSV đã load (giữ nguyên cấu trúc trong app cũ)
      selected: {},   // selectedVariables theo role
    },

    collect: { desc: '' },   // Bước 12
    analysis: { desc: '' },  // Bước 13
    ethics: { desc: '' },    // Bước 14
  };

  // ===== Utils ngắn gọn =====
  const $ = (id) => document.getElementById(id);
  const getVal = (id) => ($(id) ? $(id).value : '');
  const setVal = (id, v) => { if ($(id)) $(id).value = v ?? ''; };
  const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

  function load() {
    const cur = safeParse(localStorage.getItem(STORAGE_KEY)) || {};
    // Merge nông, tránh mất key
    return deepMerge(structuredClone(defaults), cur);
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function deepMerge(base, patch) {
    if (Array.isArray(base) || Array.isArray(patch)) return patch ?? base;
    if (typeof base === 'object' && typeof patch === 'object') {
      for (const k of Object.keys(patch)) {
        base[k] = deepMerge(base[k], patch[k]);
      }
      return base;
    }
    return patch ?? base;
  }

  // ====== Thu thập dữ liệu từ UI vào state ======
  function snapshotFromUI() {
    const state = load();

    // --- PICO
    state.pico.p = getVal('pico-p').trim();
    state.pico.i = getVal('pico-i').trim();
    state.pico.c = getVal('pico-c').trim();
    state.pico.o = getVal('pico-o').trim();

    // --- Câu hỏi
    state.question = getVal('question').trim();

    // --- Mục tiêu
    state.mainObjective = getVal('main-objective').trim();
    state.subObjectives = Array.from(document.querySelectorAll('.sub-objective'))
      .map((el) => el.value.trim())
      .filter(Boolean);

    // --- Thiết kế
    const type = getVal('design-type');
    state.design.type = type;
    state.design.randomization = getVal('randomization');
    state.design.blinding = getVal('blinding');

    if (type === 'parallel') {
      const weeks = getVal('intervention-weeks');
      const numArms = parseInt(getVal('num-arms') || '2', 10) || 2;
      state.design.parallel.weeks = weeks;
      state.design.parallel.numArms = numArms;
      // đồng bộ biến cũ num-arms để code legacy đang dùng (checkLogic)
      localStorage.setItem('num-arms', String(numArms));

      // đọc tên nhóm từ DOM nếu đã render
      const armInputs = document.querySelectorAll('[data-arm-name]');
      const arms = [];
      armInputs.forEach((inp, idx) => {
        arms.push({ name: (inp.value || `Nhóm ${idx + 1}`).trim() });
      });
      if (arms.length) state.design.parallel.arms = arms;
    }

    if (type === 'cross-over') {
      state.design.crossover.phase1 = getVal('crossover-phase1');
      state.design.crossover.g1p1 = getVal('crossover-g1-phase1');
      state.design.crossover.g2p1 = getVal('crossover-g2-phase1');
      state.design.crossover.washout = getVal('crossover-washout');
      state.design.crossover.phase2 = getVal('crossover-phase2');
      state.design.crossover.g1p2 = getVal('crossover-g1-phase2');
      state.design.crossover.g2p2 = getVal('crossover-g2-phase2');
    }

    // --- Cỡ mẫu
    state.sample.method = getVal('sample-size-method');

    // --- Bước 8/9: ngẫu nhiên
    const nStep9 = $('num-arms-step9');
    if (nStep9) state.randomization.numArms = nStep9.value;
    state.randomization.method = getVal('random-method');
    const randomText = $('randomization-method') ? $('randomization-method').value : '';
    state.randomization.text = randomText;

    // options động (nếu module khác có serialize riêng thì sẽ ghi đè sau)
    // ở đây chỉ giữ tối thiểu
    // state.randomization.options = { ...state.randomization.options };

    // --- Bước 10: mô tả can thiệp
    // Lấy từ #intervention-descriptions nếu có (textarea[data-arm-index])
    const descWrap = $('intervention-descriptions');
    if (descWrap) {
      const items = Array.from(descWrap.querySelectorAll('textarea[data-arm-index]'));
      state.interventions.descriptions = items.map((ta) => ({
        armIndex: Number(ta.dataset.armIndex || '0'),
        name: ta.dataset.armName || '',
        description: ta.value || '',
      }));
    }

    // --- Biến số
    // giữ nguyên cách dùng biến toàn cục cũ để tương thích
    const globalAll = (window.allVariables || []);
    const globalSel = (window.selectedVariables || {});
    state.variables.all = globalAll;
    state.variables.selected = globalSel;

    // --- Thu thập / Phân tích / Đạo đức
    state.collect.desc = getVal('collect-desc');
    state.analysis.desc = getVal('analysis-desc');
    state.ethics.desc = getVal('ethics-desc');

    return state;
  }

  // ====== Đổ state vào UI (hydrate) ======
  function hydrateUI() {
    const s = load();

    // --- PICO
    setVal('pico-p', s.pico.p);
    setVal('pico-i', s.pico.i);
    setVal('pico-c', s.pico.c);
    setVal('pico-o', s.pico.o);

    // --- Câu hỏi
    setVal('question', s.question);

    // --- Mục tiêu chính/phụ
    setVal('main-objective', s.mainObjective);
    const subWrap = $('sub-objectives');
    if (subWrap) {
      subWrap.innerHTML = '';
      s.subObjectives.forEach((txt) => {
        // tạo lại giống addSubObjective() cũ để không phụ thuộc file khác
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '10px';
        row.style.marginTop = '5px';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sub-objective';
        input.placeholder = 'Nhập mục tiêu phụ...';
        input.value = txt;
        input.oninput = window.saveData;
        input.style.flex = '1';

        const btn = document.createElement('button');
        btn.innerText = '❌';
        btn.title = 'Xóa mục tiêu này';
        btn.style.background = 'none';
        btn.style.border = '1px solid #ccc';
        btn.style.padding = '4px 10px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.color = 'red';
        btn.onclick = () => {
          row.remove();
          window.saveData();
        };

        row.appendChild(input);
        row.appendChild(btn);
        subWrap.appendChild(row);
      });
    }

    // --- Thiết kế
    setVal('design-type', s.design.type);
    setVal('randomization', s.design.randomization);
    setVal('blinding', s.design.blinding);

    // Gọi hàm dựng UI động nếu có (đã tách ở file step-design.js)
    if (typeof window.updateDesignFields === 'function') {
      window.updateDesignFields();
    }

    if (s.design.type === 'parallel') {
      setVal('intervention-weeks', s.design.parallel.weeks);
      setVal('num-arms', String(s.design.parallel.numArms || 2));
      // đồng bộ biến legacy
      localStorage.setItem('num-arms', String(s.design.parallel.numArms || 2));

      // render arms nếu có hàm, rồi gán tên
      if (typeof window.renderArms === 'function') {
        window.renderArms(false);
      }
      const nameInputs = document.querySelectorAll('[data-arm-name]');
      s.design.parallel.arms.forEach((a, idx) => {
        const inp = nameInputs[idx];
        if (inp) inp.value = a.name || `Nhóm ${idx + 1}`;
      });
    }

    if (s.design.type === 'cross-over') {
      setVal('crossover-phase1', s.design.crossover.phase1);
      setVal('crossover-g1-phase1', s.design.crossover.g1p1);
      setVal('crossover-g2-phase1', s.design.crossover.g2p1);
      setVal('crossover-washout', s.design.crossover.washout);
      setVal('crossover-phase2', s.design.crossover.phase2);
      setVal('crossover-g1-phase2', s.design.crossover.g1p2);
      setVal('crossover-g2-phase2', s.design.crossover.g2p2);
    }

    // --- Cỡ mẫu
    setVal('sample-size-method', s.sample.method);
    if (typeof window.renderSampleSizeForm === 'function') {
      window.renderSampleSizeForm();
    }

    // --- Ngẫu nhiên (step 9)
    if ($('num-arms-step9')) $('num-arms-step9').value = s.randomization.numArms ?? (s.design?.parallel?.numArms || '');
    setVal('random-method', s.randomization.method);
    if ($('randomization-method')) $('randomization-method').value = s.randomization.text || '';

    // --- Can thiệp (step 10)
    // Nếu module step 10 đã dựng UI, ta chỉ gán lại nội dung sau
    const descWrap = $('intervention-descriptions');
    if (descWrap && s.interventions.descriptions?.length) {
      // Chỉ gán nếu đã có sẵn textarea data-arm-index
      s.interventions.descriptions.forEach((it) => {
        const ta = descWrap.querySelector(`textarea[data-arm-index="${it.armIndex}"]`);
        if (ta) {
          if (it.name) ta.dataset.armName = it.name;
          ta.value = it.description || '';
        }
      });
    }

    // --- Biến số (giữ biến toàn cục để code cũ chạy)
    window.allVariables = Array.isArray(s.variables.all) ? s.variables.all : [];
    window.selectedVariables = s.variables.selected || {};

    // Nếu có UI kéo-thả biến đã tách file, gọi dựng lại
    if (typeof window.createVariableDragUI === 'function') {
      window.createVariableDragUI();
    }

    // --- Thu thập / Phân tích / Đạo đức
    setVal('collect-desc', s.collect.desc);
    setVal('analysis-desc', s.analysis.desc);
    setVal('ethics-desc', s.ethics.desc);
  }

  // ====== Điều hướng bước ======
  function setStepActive(idx) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((el, i) => {
      el.classList.toggle('active', i === idx);
    });

    const navs = document.querySelectorAll('.steps-nav button');
    navs.forEach((b, i) => {
      b.classList.toggle('active', i === idx);
    });
  }

  function goToStep(idx) {
    const s = load();
    const steps = document.querySelectorAll('.step');
    if (idx < 0 || idx >= steps.length) idx = 0;
    s.stepIndex = idx;
    save(s);
    setStepActive(idx);

    // nếu có vẽ sơ đồ (step 16) thì cập nhật
    if (idx === 15 && typeof window.renderStudyFlowDiagram === 'function') {
      window.renderStudyFlowDiagram();
    }
  }

  // ====== Public API: saveData/reset/hydrate ======
  function saveData() {
    const s = snapshotFromUI();
    save(s);
  }

  function resetWizard() {
    localStorage.removeItem(STORAGE_KEY);
    // legacy key để code cũ đọc
    localStorage.removeItem('num-arms');
    // giữ selectedVariables về rỗng
    window.allVariables = [];
    window.selectedVariables = {};
    hydrateUI();
    goToStep(0);
    alert('✅ Đã xóa toàn bộ dữ liệu và đưa wizard về trạng thái ban đầu.');
  }

  function getAppData() {
    return load();
  }

  // ====== Khởi động ======
  document.addEventListener('DOMContentLoaded', () => {
    // đảm bảo biến toàn cục tồn tại
    if (!window.allVariables) window.allVariables = [];
    if (!window.selectedVariables) window.selectedVariables = {};

    hydrateUI();

    const s = load();
    setStepActive(s.stepIndex || 0);
  });

  // ====== Gắn vào window để HTML cũ có thể gọi ======
  window.saveData = saveData;
  window.goToStep = goToStep;
  window.resetWizard = resetWizard;
  window.getAppData = getAppData;
})();
