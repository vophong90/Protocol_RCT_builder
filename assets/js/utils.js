// /assets/js/utils.js
// Tiện ích dùng chung: làm sạch chuỗi, ràng buộc chiều dài, loại trùng, tóm tắt danh sách
(function (w) {
  const Utils = {
    normalizeStr(v) {
      if (v == null) return '';
      let s = String(v);
      // Giữ xuống dòng, gom các khoảng trắng liên tiếp
      s = s.replace(/[ \t\f\v\r]+/g, ' ');
      // Loại ký tự điều khiển không cần thiết (trừ \n)
      s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      return s.trim();
    },

    collapseWsKeepNl(v) {
      if (!v) return '';
      // Giữ \n, gom các khoảng trắng; chuẩn hoá \r\n -> \n
      return String(v)
        .replace(/\r\n/g, '\n')
        .replace(/[ \t\f\v\r]+/g, ' ')
        .replace(/[ ]*\n[ ]*/g, '\n')
        .trim();
    },

    dedupeStable(arr) {
      const seen = new Set();
      const out = [];
      for (const x of arr || []) {
        if (!seen.has(x)) { seen.add(x); out.push(x); }
      }
      return out;
    },

    summarizeList(arr, limitCount = 50) {
      const a = Array.isArray(arr) ? arr : [];
      if (a.length <= limitCount) return a.join(', ');
      const shown = a.slice(0, limitCount).join(', ');
      const more = a.length - limitCount;
      return `${shown} … (+${more} mục nữa)`;
    },

    clampLen(s, maxLen) {
      const str = String(s || '');
      if (str.length <= maxLen) return str;
      return str.slice(0, maxLen - 20) + ` …[cắt bớt ${str.length - maxLen} ký tự]`;
    },

    isElTextareaOrInput(el) {
      if (!el || !el.tagName) return false;
      const t = el.tagName.toUpperCase();
      return t === 'TEXTAREA' || (t === 'INPUT' && /text|search|hidden/i.test(el.type || 'text'));
    },
  };

  w.App = w.App || {};
  w.App.Utils = Utils;
})(window);
