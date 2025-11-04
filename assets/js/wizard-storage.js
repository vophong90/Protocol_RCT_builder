// /assets/js/wizard-storage.js
// Thu thập dữ liệu từ localStorage + DOM, chuẩn hoá với Utils
(function (w) {
  const U = (w.App && w.App.Utils) || { normalizeStr: x => x || '', dedupeStable: x=>x, summarizeList: x=>String(x||'') };

  const Storage = {
    _safeParse(json, fallback) {
      try { return JSON.parse(json || ''); } catch { return fallback; }
    },

    loadWizardData() {
      const saved = Storage._safeParse(localStorage.getItem('rctWizardData'), {});
      const pico  = {
        p: U.normalizeStr(saved?.pico?.p || saved?.pico?.P),
        i: U.normalizeStr(saved?.pico?.i || saved?.pico?.I),
        c: U.normalizeStr(saved?.pico?.c || saved?.pico?.C),
        o: U.normalizeStr(saved?.pico?.o || saved?.pico?.O),
      };

      const objective    = U.normalizeStr(saved?.mainObjective);
      const interventions = Array.isArray(saved?.interventions) ? saved.interventions : [];
      const numArms      = U.normalizeStr(localStorage.getItem('num-arms') || 'Không xác định');

      // selectedVariables có thể là biến global
      const selected = (w.selectedVariables && typeof w.selectedVariables === 'object') ? w.selectedVariables : {};

      // Chuẩn hoá danh sách biến: "Tên (vai trò)"
      const variableArr = Object.entries(selected).flatMap(([role, vars]) => {
        if (!Array.isArray(vars)) return [];
        return vars
          .map(v => U.normalizeStr(v?.name))
          .filter(Boolean)
          .map(name => `${name} (${role})`);
      });

      const variableList = U.summarizeList(U.dedupeStable(variableArr), 80);

      // DOM fields
      const analysis = U.collapseWsKeepNl(document.getElementById('analysis-desc')?.value || '');
      const ethics   = U.collapseWsKeepNl(document.getElementById('ethics-desc')?.value || '');

      return {
        pico,
        objective,
        interventions,
        numArms,
        selected,       // giữ để tuỳ nghi dùng sau này
        variableList,
        analysis,
        ethics,
        _meta: {
          variableCount: variableArr.length,
          interventionsCount: interventions.length,
        }
      };
    },
  };

  w.App = w.App || {};
  w.App.Storage = Storage;
})(window);
