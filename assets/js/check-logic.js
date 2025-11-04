// /assets/js/check-logic.js
// Điều phối: gom dữ liệu -> build prompt -> gọi PHP -> hiển thị kết quả
(function (w) {
  const U = (w.App && w.App.Utils) || { isElTextareaOrInput: ()=>false };

  function $(id) { return document.getElementById(id); }

  function setOutput(el, text) {
    if (!el) return;
    const t = String(text || '').trim();
    if (U.isElTextareaOrInput(el)) el.value = t;
    else el.textContent = t;
  }

  async function runCheckLogic(options = {}) {
    const outEl =
      (options.outputEl instanceof HTMLElement ? options.outputEl : null) ||
      $(options.outputId || 'logic-result') ||
      $(options.outputIdAlt || 'logic-output') ||
      null;

    // 1) Thu thập dữ liệu
    const ctx = w.App.Storage.loadWizardData();

    // 2) Build prompt
    const prompt = w.App.Prompt.buildLogicPrompt(ctx);

    // 3) Gọi API PHP
    let text = '';
    try {
      const res = await w.App.API.checkLogic(prompt, { timeoutMs: 90_000 });
      if (res && res.ok) {
        text = (res.content || '').trim();
      } else {
        text = `❗ Lỗi xử lý: ${(res && res.error) ? res.error : 'Không xác định'}`;
      }
    } catch (e) {
      const msg = e?.message || String(e);
      const status = (e && typeof e.status === 'number') ? ` (HTTP ${e.status})` : '';
      text = `❗ Lỗi kết nối${status}: ${msg}`;
    }

    // 4) Hiển thị
    setOutput(outEl, text);
    return text;
  }

  function bindCheckLogicButton(btnId = 'btn-check-logic', outputId = 'logic-result') {
    const btn = $(btnId);
    if (!btn) return;
    const out = $(outputId) || $('logic-output');

    btn.addEventListener('click', async () => {
      btn.disabled = true;
      const old = btn.textContent;
      btn.textContent = 'Đang kiểm tra…';
      try {
        await runCheckLogic({ outputEl: out });
      } finally {
        btn.disabled = false;
        btn.textContent = old || 'Kiểm tra logic';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindCheckLogicButton('btn-check-logic', 'logic-result');
  });

  // Expose
  w.runCheckLogic = runCheckLogic;
  w.bindCheckLogicButton = bindCheckLogicButton;
})(window);
