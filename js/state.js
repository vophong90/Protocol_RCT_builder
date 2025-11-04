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
      armInputs.forEach((
