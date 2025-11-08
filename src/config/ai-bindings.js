// src/config/ai-bindings.js
// Các binding gọi tới PHP: gửi JSON body, ép action="chat" để tránh moderation.
// Bạn có thể đổi model thành "gpt-5" nếu account của server có quyền, hoặc giữ "gpt-4o-mini" cho an toàn.

const ENDPOINT = 'https://gpt-api-19xu.onrender.com/gpt.php';
const DEFAULT_MODEL = 'gpt-4o-mini'; // đổi thành 'gpt-5' nếu server bạn có quyền

function buildJsonBody(prompt, extra = {}) {
  return JSON.stringify({
    action: 'chat',
    model: DEFAULT_MODEL,
    prompt,
    ...extra, // nếu muốn truyền step, response_format…
  });
}

async function parseResponsesAPI(res) {
  const text = await res.text();
  // Thử JSON trước
  try {
    const j = JSON.parse(text);

    // Nếu lỡ trả moderation từ server (phòng xa)
    if (
      (typeof j?.id === 'string' && /^modr-/i.test(j.id)) ||
      (typeof j?.model === 'string' && /moderation/i.test(j.model)) ||
      Array.isArray(j?.results)
    ) {
      // Trả raw để phía step có thể fallback nếu cần
      return text;
    }

    // Các shape thường gặp của Responses API
    if (typeof j.output_text === 'string' && j.output_text.trim()) return j.output_text;

    if (Array.isArray(j.output) && j.output.length) {
      // j.output[0].content[].text
      const first = j.output[0];
      if (Array.isArray(first?.content)) {
        const merged = first.content.map(c => c?.text || '').join('');
        if (merged.trim()) return merged;
      }
    }

    // Một số triển khai trả { response: { output_text } }
    if (j?.response?.output_text) return j.response.output_text;

    // Phòng trường hợp backend dùng kiểu Chat cũ
    if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content;

    // fallback: trả string JSON thô
    return text;
  } catch {
    // Không phải JSON → trả text thô
    return text;
  }
}

// ==== Nhớ merge với aiBindings hiện tại của bạn (đừng xoá key khác nếu có) ====
export const aiBindings = {
  // ---------- STEP 0 ----------
  'step0.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step0.suggest', response_format: 'json', require_json: '1' }),
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
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step1.suggest', response_format: 'json', require_json: '1' }),
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
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step2.suggest', response_format: 'json', require_json: '1' }),
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
    // ép JSON + gợi ý server trả JSON sạch (CaRS + references)
    bodyBuilder: (prompt) => buildJsonBody(prompt, {
      step: 'step3.suggest',
      response_format: 'json',
      require_json: '1'
    }),
    parse: parseResponsesAPI,
  },
  'step3.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) => buildJsonBody(prompt, { step: 'step3.evaluate' }),
    parse: parseResponsesAPI,
  },
};

// ---------- STEP 4 ----------
'step4.suggest': {
  endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  bodyBuilder: (prompt) => JSON.stringify({
    action: 'chat',
    step: 'step4.suggest',
    model: 'gpt-4o-mini', // hoặc 'gpt-5' nếu server bạn có quyền
    prompt
  }),
  parse: async (res) => {
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      if (
        (typeof j?.id === 'string' && /^modr-/i.test(j.id)) ||
        (typeof j?.model === 'string' && /moderation/i.test(j.model)) ||
        Array.isArray(j?.results)
      ) return txt; // để layer trên fallback
      if (typeof j.output_text === 'string' && j.output_text.trim()) return j.output_text;
      if (Array.isArray(j.output) && j.output.length) {
        const first = j.output[0];
        if (Array.isArray(first?.content)) return first.content.map(c => c?.text || '').join('');
      }
      if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content;
      return txt;
    } catch { return txt; }
  },
},
'step4.evaluate': {
  endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  bodyBuilder: (prompt) => JSON.stringify({
    action: 'chat',
    step: 'step4.evaluate',
    model: 'gpt-4o-mini',
    prompt
  }),
  parse: async (res) => {
    const txt = await res.text();
    try {
      const j = JSON.parse(txt);
      if (
        (typeof j?.id === 'string' && /^modr-/i.test(j.id)) ||
        (typeof j?.model === 'string' && /moderation/i.test(j.model)) ||
        Array.isArray(j?.results)
      ) return txt;
      if (typeof j.output_text === 'string' && j.output_text.trim()) return j.output_text;
      if (Array.isArray(j.output) && j.output.length) {
        const first = j.output[0];
        if (Array.isArray(first?.content)) return first.content.map(c => c?.text || '').join('');
      }
      if (j?.choices?.[0]?.message?.content) return j.choices[0].message.content;
      return txt;
    } catch { return txt; }
  },
},
