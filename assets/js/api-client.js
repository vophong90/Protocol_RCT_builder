// /assets/js/api-client.js
// Client gọi PHP endpoint. Không đổi hành vi đầu-cuối (vẫn gửi prompt, nhận text).
(function (w) {
  const CHECK_LOGIC_ENDPOINT = '/php/check-logic.php'; // đổi nếu bạn đặt nơi khác

  function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));
  }

  async function postJSON(url, body, { signal } = {}) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;charset=utf-8' },
      body: JSON.stringify(body),
      signal
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
    }
    return res.json();
  }

  const API = {
    async checkLogic(prompt, opts = {}) {
      const controller = new AbortController();
      const t = opts.timeoutMs || 90_000;

      try {
        const res = await Promise.race([
          postJSON(CHECK_LOGIC_ENDPOINT, { prompt }, { signal: controller.signal }),
          timeout(t)
        ]);
        return res; // { ok: boolean, content?: string, error?: string }
      } finally {
        controller.abort();
      }
    }
  };

  w.App = w.App || {};
  w.App.API = API;
})(window);
