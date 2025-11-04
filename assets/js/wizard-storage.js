// /assets/js/wizard-storage.js
// Thu thập dữ liệu từ localStorage + DOM, không đổi hành vi
(function (w) {
  const Storage = {
    _safeParse(json, fallback) {
      try { return JSON.parse(json || ''); } catch { return fallback; }
    },

    loadWizardData() {
      const saved = Storage._safeParse(localStorage.getItem('rctWizardData'), {});
      const pico  = saved.pico || {};
      const objective = saved.mainObjective || '';
      const interventions = saved.interventions || [];
      const numArms = (localStorage.getItem('num-arms') || 'Không xác định');

      // selectedVariables có thể là biến global có sẵn
      const selected = (w.selectedVariables && typeof w.selectedVariables === 'object')
        ? w.selectedVariables
        : {};

      // DOM fields (nếu không tồn tại thì để rỗng)
      const analysis = (document.getElementById('analysis-desc')?.value || '').trim();
      const ethics   = (document.getElementById('ethics-desc')?.value || '').trim();

      // Biến danh sách biến đã chọn thành chuỗi "Tên (vai trò)"
      const variableList = Object.entries(selected).flatMap(([role, vars]) => {
        if (!Array.isArray(vars)) return [];
        return vars.map(v => `${v.name} (${role})`);
      }).join(', ');

      return {
        pico,
        objective,
        interventions,
        numArms,
        selected,        // để dùng khi cần
        variableList,
        analysis,
        ethics,
      };
    },
  };

  w.App = w.App || {};
  w.App.Storage = Storage;
})(window);
