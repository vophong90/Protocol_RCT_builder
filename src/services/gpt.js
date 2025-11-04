// src/services/gpt.js
const ENDPOINT = 'https://gpt-api-19xu.onrender.com/gpt.php';

export async function askGPT(prompt) {
  const body = JSON.stringify({ action: 'chat', prompt });
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
  } catch (e) {
    // Fallback thử form-encoded (một số PHP endpoint thích kiểu này)
    const form = new URLSearchParams();
    form.set('action', 'chat'); form.set('prompt', prompt);
    res = await fetch(ENDPOINT, { method: 'POST', body: form });
  }

  const text = await res.text();
  try {
    const j = JSON.parse(text);
    // Nếu server của bạn trả JSON theo kiểu {content: "..."} hoặc {data: "..."}
    return j?.content ?? j?.data ?? j?.message ?? text;
  } catch {
    return text; // trả thẳng nếu không phải JSON
  }
}

// Giữ tên hàm parse nếu app gốc có dùng
export function parseGPTResponse(raw) {
  // App gốc có thể đã làm sạch markdown/code fence; ở đây giữ tối giản (không thay đổi nội dung)
  return (raw ?? '').toString();
}
