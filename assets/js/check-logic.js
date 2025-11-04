// /assets/js/check-logic.js
// Điều phối: gom dữ liệu -> build prompt -> gọi PHP -> hiển thị kết quả
(function (w) {
  function $(id) { return document.getElementById(id); }

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
      text = `❗ Lỗi kết nối: ${e.message || e}`;
    }

    // 4) Hiển thị
    if (outEl) {
      if (outEl.tagName === 'TEXTAREA' || outEl.tagName === 'INPUT') {
        outEl.value = text;
      } else {
        outEl.textContent = text;
      }
    }

    return text;
  }

  function bindCheckLogicButton(btnId = 'btn-check-logic', outputId = 'logic-result') {
    const btn = $(btnId);
    if (!btn) return;
    const out = $(outputId) || $( 'logic-output');

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

  // Tự động bind nếu tìm thấy nút & ô output phổ biến
  document.addEventListener('DOMContentLoaded', () => {
    bindCheckLogicButton('btn-check-logic', 'logic-result');
  });

  // Expose global để gọi thủ công khi cần
  w.runCheckLogic = runCheckLogic;
  w.bindCheckLogicButton = bindCheckLogicButton;
})(window);
