// services/gpt.js
export const GPT_ENDPOINT = "https://gpt-api-19xu.onrender.com/gpt.php";

export function parseGPTResponse(raw, ok = true) {
  let data = null;
  try { data = JSON.parse(raw); } catch {}
  let result = null;

  if (!result && data && typeof data.output_text === "string" && data.output_text.trim()) result = data.output_text.trim();
  if (!result && Array.isArray(data?.output)) {
    const msg = data.output.find(x => x?.type === "message");
    const textPart = msg?.content?.find?.(c => typeof c?.text === "string")?.text;
    if (textPart) result = textPart.trim();
  }
  if (!result && data?.choices?.[0]?.message?.content) result = data.choices[0].message.content.trim();
  if (!result && data?.choices?.[0]?.text) result = data.choices[0].text.trim();
  if (!result && (data?.error || !ok)) result = "❌ Lỗi từ server: " + (data?.error?.message || data?.error || raw);

  return result || "GPT không trả về nội dung.";
}

export async function gptCall(prompt/*, model = "gpt-4o-mini" */) {
  try {
    const res = await fetch(GPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "chat", prompt /*, model */ })
    });
    const raw = await res.text();
    return parseGPTResponse(raw, res.ok);
  } catch (e) {
    return "❌ Lỗi gọi GPT: " + (e?.message || String(e));
  }
}
