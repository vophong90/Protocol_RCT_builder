const ENDPOINT = 'https://gpt-api-19xu.onrender.com/gpt.php';

export async function askGPT(prompt){
  const payload = { action:'chat', prompt };
  let res, text;
  try{
    res = await fetch(ENDPOINT, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
    text = await res.text();
  }catch(e){
    const form = new URLSearchParams(); form.set('action','chat'); form.set('prompt', prompt);
    res = await fetch(ENDPOINT, { method:'POST', body: form });
    text = await res.text();
  }
  try{
    const j = JSON.parse(text);
    return j?.output_text ?? j?.content ?? j?.data ?? j?.message ?? text;
  }catch{ return text; }
}
export const parseGPTResponse = (raw) => (raw ?? '').toString();
