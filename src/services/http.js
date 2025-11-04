// src/services/http.js
const ENDPOINT = 'https://gpt-api-19xu.onrender.com/gpt.php';

/**
 * Gọi GPT endpoint custom của bạn.
 * Trả về chuỗi đã gỡ code-fence/ngoặc kép nếu có.
 */
export async function gptChat(prompt, extra = {}) {
  const body = { action: 'chat', prompt, ...extra };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  return parseGPTResponse(raw);
}

export function parseGPTResponse(raw) {
  if (raw == null) return '';
  let t = String(raw).trim();
  // Bỏ code-fence
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  }
  // Bỏ ngoặc kép bao quanh
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1);
  }
  return t;
}
