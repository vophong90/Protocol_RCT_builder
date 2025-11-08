// src/config/ai-bindings.js
export const aiBindings = {
  // Step 0 — PICO: GPT gợi ý
'step0.suggest': {
  endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
  method: 'POST',
  mode: 'cors',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  bodyBuilder: (prompt) => new URLSearchParams({ prompt }),
  parse: async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      return (
        j.text ??
        j.reply ??
        j.content ??
        j.data ??
        j.choices?.[0]?.message?.content ??
        JSON.stringify(j)
      );
    }
    return await res.text();
  },
},

// Step 0 — PICO: GPT đánh giá
'step0.evaluate': {
  endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
  method: 'POST',
  mode: 'cors',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  bodyBuilder: (prompt) => new URLSearchParams({ prompt }),
  parse: async (res) => {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const j = await res.json();
      return (
        j.text ??
        j.reply ??
        j.content ??
        j.data ??
        j.choices?.[0]?.message?.content ??
        JSON.stringify(j)
      );
    }
    return await res.text();
  },
},
  
  // Step 5 — gợi ý mô tả thiết kế
  'step5.suggest': {
    endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    bodyBuilder: (prompt) => new URLSearchParams({ prompt }),
    parse: async (res) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        return (
          j.text ??
          j.reply ??
          j.content ??
          j.data ??
          j.choices?.[0]?.message?.content ??
          JSON.stringify(j)
        );
      }
      return await res.text();
    },
  },

  // Step 5 — đánh giá mô tả
  'step5.evaluate': {
    endpoint: 'https://gpt-api-19xu.onrender.com/gpt.php',
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    bodyBuilder: (prompt) => new URLSearchParams({ prompt }),
    parse: async (res) => {
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const j = await res.json();
        return (
          j.text ??
          j.reply ??
          j.content ??
          j.data ??
          j.choices?.[0]?.message?.content ??
          JSON.stringify(j)
        );
      }
      return await res.text();
    },
  },
};
