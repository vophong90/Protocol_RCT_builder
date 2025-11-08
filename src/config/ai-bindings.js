// src/config/ai-bindings.js
// Gọi tới PHP Responses API. Ép action="chat" (tránh moderation).
const ENDPOINT = 'https://gpt-api-19xu.onrender.com/gpt.php';
const DEFAULT_MODEL = 'gpt-4o-mini'; // đổi 'gpt-5' nếu server có quyền

function buildJsonBody(prompt, extra = {}) {
  return JSON.stringify({
    action: 'chat',
    model: DEFAULT_MODEL,
    prompt,
    ...extra,
  });
}

async function parseResponsesAPI(res) {
  const text = await res.text();
  try {
    const j = JSON.parse(text);

    // Nếu lỡ trả Moderation → trả raw để layer trên xử lý
    if (
      (typeof j?.id === 'string' && /^modr-/i.test(j.id)) ||
      (typeof j?.model === 'string' && /moderation/i.test(j.model)) ||
      Array.isArray(j?.results)
    ) {
      return text;
    }

    // Các shape thường gặp của Responses API
    if (typeof j.output_text === 'string' && j.output_text.trim()) return j.output_text;

    if (Array.isArray(j.output) && j.output.length) {
      const first = j.output[0];
      if (Array.isArray(first?.content)) {
        const merged = first.content
          .map(c => (c?.text?.value ?? c?.text ?? ''))
          .join('');
        if (merged.trim()) return merged;
      }
    }

    // Một số backend trả { response: { output_text } }
    if (j?.response?.output_text) return j.response.output_text;

    // Phòng trường hợp dùng Chat Completions cũ
    if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content;

    return text; // fallback
  } catch {
    return text; // không phải JSON → trả thô
  }
}

// ===== Toàn bộ binding nằm trong cùng 1 object =====
export const aiBindings = {
  // ---------- STEP 0 ----------
  'step0.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, { step: 'step0.suggest', response_format: 'json', require_json: '1' }),
    parse: parseResponsesAPI,
  },
  'step0.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step0.evaluate' }),
    parse: parseResponsesAPI,
  },

  // ---------- STEP 1 ----------
  'step1.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, { step: 'step1.suggest', response_format: 'json', require_json: '1' }),
    parse: parseResponsesAPI,
  },
  'step1.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step1.evaluate' }),
    parse: parseResponsesAPI,
  },

  // ---------- STEP 2 ----------
  'step2.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, { step: 'step2.suggest', response_format: 'json', require_json: '1' }),
    parse: parseResponsesAPI,
  },
  'step2.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step2.evaluate' }),
    parse: parseResponsesAPI,
  },

  // ---------- STEP 3 ----------
  'step3.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // ép JSON sạch (CaRS + references)
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, { step: 'step3.suggest', response_format: 'json', require_json: '1' }),
    parse: parseResponsesAPI,
  },
  'step3.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step3.evaluate' }),
    parse: parseResponsesAPI,
  },

  // ---------- STEP 4 ----------
  'step4.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, { step: 'step4.suggest', response_format: 'json', require_json: '1' }),
    parse: parseResponsesAPI,
  },
  'step4.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step4.evaluate' }),
    parse: parseResponsesAPI,
  },
};
