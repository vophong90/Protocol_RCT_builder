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

  // ---------- STEP 5 ----------
'step5.suggest': {
  endpoint: ENDPOINT,                     // 'https://gpt-api-19xu.onrender.com/gpt.php'
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // step5 chỉ cần Markdown văn bản → không ép JSON
  bodyBuilder: (prompt) =>
    buildJsonBody(prompt, {
      step: 'step5.suggest',
      response_format: 'text'
    }),
  parse: parseResponsesAPI,               // dùng chung parser đã có ở trên
},

'step5.evaluate': {
  endpoint: ENDPOINT,
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  bodyBuilder: (prompt) =>
    buildJsonBody(prompt, {
      step: 'step5.evaluate',
      response_format: 'text'
    }),
  parse: parseResponsesAPI,
},

  // ---------- STEP 6 ----------
  'step6.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // gợi ý công thức/logic, trả Markdown
    bodyBuilder: (prompt) => JSON.stringify({
      action: 'chat',
      step: 'step6.suggest',
      model: DEFAULT_MODEL,       // 'gpt-4o-mini' hoặc 'gpt-5' nếu server có quyền
      prompt
    }),
    parse: parseResponsesAPI,     // đã định nghĩa phía trên file
  },

  'step6.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // đánh giá giả định, trả Markdown
    bodyBuilder: (prompt) => JSON.stringify({
      action: 'chat',
      step: 'step6.evaluate',
      model: DEFAULT_MODEL,
      prompt
    }),
    parse: parseResponsesAPI,
  },

    // ---------- STEP 7 ----------
  'step7.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Gợi ý tiêu chí vào/loại + kèm TLTK AMA 11th → trả về text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step7.suggest',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step7.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Đánh giá tiêu chí hiện có + TLTK AMA 11th → text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step7.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

    // ---------- STEP 8 ----------
  'step8.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Gợi ý đoạn mô tả quy trình ngẫu nhiên hoá + TLTK AMA 11th → text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step8.suggest',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step8.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Dự phòng: nếu sau này anh muốn GPT đánh giá/nhận xét đoạn mô tả randomization
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step8.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  // src/config/ai-bindings.js

  // ---------- STEP 9 ----------
  'step9.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step9.suggest',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step9.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step9.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

    // ---------- STEP 10 ----------
  'step10.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step10.suggest',   // trùng với bindingKey trong callStepGPT
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step10.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step10.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

    // ---------- STEP 11 ----------
  'step11.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Gợi ý đoạn mô tả quy trình thu thập dữ liệu → trả về text thường (markdown cũng được)
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step11.suggest',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step11.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Đánh giá đoạn mô tả quy trình thu thập → text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step11.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },
  
    // ---------- STEP 12 ----------
  'step12.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Gợi ý kế hoạch phân tích → cần JSON sạch để parse thành { primary, secondary, exploratory }
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step12.suggest',
        response_format: 'json',
        require_json: '1',   // ép backend buộc trả JSON hợp lệ
      }),
    parse: parseResponsesAPI,   // trả về chuỗi JSON, step12 tự JSON.parse
  },

  'step12.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Đánh giá kế hoạch phân tích → text thường (gạch đầu dòng)
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step12.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

    // ---------- STEP 13 ----------
  'step13.suggest': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // GPT viết phần Đạo đức hoàn chỉnh → text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step13.suggest',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  'step13.evaluate': {
    endpoint: ENDPOINT,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // GPT phản biện/đánh giá phần Đạo đức → text thường
    bodyBuilder: (prompt) =>
      buildJsonBody(prompt, {
        step: 'step13.evaluate',
        response_format: 'text',
      }),
    parse: parseResponsesAPI,
  },

  
};
