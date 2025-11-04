// /assets/js/api-client.js
// Client gọi PHP endpoint, thêm retry nhẹ để bền hơn
(function (w) {
  const CHECK_LOGIC_ENDPOINT = '/php/check-logic.php'; // giữ nguyên
  const DEFAULT_TIMEOUT_MS   = 90_000;

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
    const text = await res.text().catch(() => '');
    let data = null;
    try { data = JSON.parse(text); } catch { /* noop */ }

    if (!res.ok) {
      const msg = data?.error || text || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.responseJSON = data;
      throw err;
    }
    return data;
  }

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function postJSONWithRetry(url, body, { signal, retries = 2, backoffMs = 1200 } = {}) {
    let attempt = 0, lastErr = null;
    while (attempt <= retries) {
      try {
        return await postJSON(url, body, { signal });
      } catch (e) {
        lastErr = e;
        const status = e?.status || 0;
        // Retry cho 429/5xx
        if (attempt < retries && (status === 429 || (status >= 500 && status <= 599))) {
          await sleep(backoffMs * Math.pow(2, attempt));
          attempt++;
          continue;
        }
        throw e;
      }
    }
    throw lastErr || new Error('Unknown error');
  }

  const API = {
    async checkLogic(prompt, opts = {}) {
      const controller = new AbortController();
      const t = opts.timeoutMs || DEFAULT_TIMEOUT_MS;

      try {
        const res = await Promise.race([
          postJSONWithRetry(CHECK_LOGIC_ENDPOINT, { prompt }, { signal: controller.signal }),
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
