/* =========================
 * Wizard Đề cương RCT – main.js
 * Phụ thuộc: pdfjsLib, Papa (PapaParse), html2canvas, mermaid
 * ========================= */

/* ---------- Cấu hình chung ---------- */
const GPT_ENDPOINT = "https://gpt-api-19xu.onrender.com/gpt.php";
const LS_KEY = "rctWizardData";

/* ---------- Trạng thái toàn cục ---------- */
let currentStep = 0;
let allVariables = [];              // Tập biến chuẩn (CSV hoặc thêm tay)
let selectedVariables = {};         // { roleKey: Array<VarObj> }
const variableRoles = [
  { key: "primary",   name: "Kết cục chính",  required: true,  description: "Biến số chính để đánh giá hiệu quả can thiệp. Bắt buộc có." },
  { key: "secondary", name: "Kết cục phụ",    required: false, description: "Bổ sung để đánh giá thêm các khía cạnh." },
  { key: "baseline",  name: "Biến nền",       required: true,  description: "Đặc điểm ban đầu của người bệnh. Bắt buộc có." },
  { key: "confounder",name: "Biến nhiễu",     required: false, description: "Có thể ảnh hưởng kết quả nếu không kiểm soát." },
  { key: "mediator",  name: "Biến trung gian",required: false, description: "Giải thích cơ chế tác động can thiệp." },
  { key: "moderator", name: "Biến điều biến", required: false, description: "Làm thay đổi mối liên hệ I→O (tương tác)." },
  { key: "safety",    name: "Biến an toàn",   required: false, description: "Biến cố bất lợi/tác dụng phụ." }
];

/* ---------- Tiện ích lưu/khôi phục ---------- */
function loadData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveData() {
  const dat = loadData();

  // B1 PICO
  dat.pico = {
    p: document.getElementById("pico-p")?.value?.trim() || "",
    i: document.getElementById("pico-i")?.value?.trim() || "",
    c: document.getElementById("pico-c")?.value?.trim() || "",
    o: document.getElementById("pico-o")?.value?.trim() || "",
  };

  // B2 Câu hỏi
  dat.question = document.getElementById("question")?.value?.trim() || "";

  // B3 Mục tiêu
  dat.mainObjective = document.getElementById("main-objective")?.value?.trim() || "";
  dat.subObjectives = Array.from(document.querySelectorAll(".sub-objective")).map(i => i.value.trim()).filter(Boolean);

  // B5 Tổng quan – 9 tiểu phần (nếu có)
  const getVal = id => document.getElementById(id)?.value?.trim() || "";
  dat.lit = {
    yhhd_overview: getVal("text-yhhd-overview"),
    epidemiology:  getVal("text-epidemiology"),
    diagnosis:     getVal("text-diagnosis"),
    treatment:     getVal("text-treatment"),
    limitation:    getVal("text-limitation"),
    yhct_overview: getVal("text-yhct-overview"),
    intervention:  getVal("text-intervention"),
    related:       getVal("text-related-studies"),
    newmethods:    getVal("text-new-methods"),
  };

  // B6 Thiết kế
  dat.design = dat.design || {};
  dat.design.type   = document.getElementById("design-type")?.value || "";
  dat.design.random = document.getElementById("randomization")?.value || "";
  dat.design.blind  = document.getElementById("blinding")?.value || "";

  // Extra fields theo loại
  if (dat.design.type === "parallel") {
    dat.design.numArms = Number(document.getElementById("num-arms")?.value || 2);
    dat.design.armNames = (document.getElementById("arm-names")?.value || "").split(",").map(s => s.trim()).filter(Boolean);
  } else if (dat.design.type === "cross-over") {
    dat.design.sequences = (document.getElementById("xo-sequences")?.value || "AB,BA").split(",").map(s => s.trim()).filter(Boolean);
    dat.design.washoutDays = Number(document.getElementById("xo-washout")?.value || 0);
    dat.design.numArms = 2; // ngầm định
  }

  // B7 Cỡ mẫu
  dat.ss = dat.ss || {};
  dat.ss.method = document.getElementById("sample-size-method")?.value || "";
  dat.ss.inputs = readSampleSizeInputs();     // helper ở dưới
  dat.ss.result = dat.ss.result || {};

  // B8 Tiêu chí
  dat.criteria = {
    inclusion: Array.from(document.querySelectorAll(".inclusion-item")).map(i => i.value.trim()).filter(Boolean),
    exclusion: Array.from(document.querySelectorAll(".exclusion-item")).map(i => i.value.trim()).filter(Boolean),
  };

  // B9 Ngẫu nhiên
  dat.random = dat.random || {};
  dat.random.method = document.getElementById("random-method")?.value || "";
  dat.random.detail = document.getElementById("randomization-method")?.value || "";
  dat.random.options = readRandomOptions();

  // B10 Can thiệp
  dat.interventions = readInterventionsFromDOM(dat.design?.numArms || 2);

  // B11 Biến số
  dat.variables = {
    all: allVariables,
    selected: selectedVariables
  };

  // B12 Thu thập
  dat.collect = { desc: document.getElementById("collect-desc")?.value?.trim() || "" };

  // B13 Phân tích
  dat.analysis = { desc: document.getElementById("analysis-desc")?.value?.trim() || "" };

  // B14 Đạo đức
  dat.ethics = { desc: document.getElementById("ethics-desc")?.value?.trim() || "" };

  localStorage.setItem(LS_KEY, JSON.stringify(dat));
}
function hydrateUIFromData() {
  const dat = loadData();

  // PICO
  if (dat.pico) {
    const { p,i,c,o } = dat.pico;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    set("pico-p", p); set("pico-i", i); set("pico-c", c); set("pico-o", o);
  }

  // Question
  if (dat.question) document.getElementById("question") && (document.getElementById("question").value = dat.question);

  // Objectives
  if (dat.mainObjective) document.getElementById("main-objective") && (document.getElementById("main-objective").value = dat.mainObjective);
  if (Array.isArray(dat.subObjectives)) {
    dat.subObjectives.forEach(s => addSubObjective(s));
  }

  // Literature 9 mục
  if (dat.lit) {
    const put = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    put("text-yhhd-overview", dat.lit.yhhd_overview);
    put("text-epidemiology",   dat.lit.epidemiology);
    put("text-diagnosis",      dat.lit.diagnosis);
    put("text-treatment",      dat.lit.treatment);
    put("text-limitation",     dat.lit.limitation);
    put("text-yhct-overview",  dat.lit.yhct_overview);
    put("text-intervention",   dat.lit.intervention);
    put("text-related-studies",dat.lit.related);
    put("text-new-methods",    dat.lit.newmethods);
  }

  // Design
  if (dat.design) {
    const dt = document.getElementById("design-type");
    if (dt) dt.value = dat.design.type || "";
    const rn = document.getElementById("randomization");
    if (rn) rn.value = dat.design.random || "";
    const bl = document.getElementById("blinding");
    if (bl) bl.value = dat.design.blind || "";
    updateDesignFields(); // render extra fields
    if (dat.design.type === "parallel") {
      const num = document.getElementById("num-arms"); if (num) num.value = (dat.design.numArms || 2);
      const names = document.getElementById("arm-names"); if (names) names.value = (dat.design.armNames || []).join(", ");
    } else if (dat.design.type === "cross-over") {
      const seq = document.getElementById("xo-sequences"); if (seq) seq.value = (dat.design.sequences || ["AB","BA"]).join(", ");
      const w   = document.getElementById("xo-washout");  if (w) w.value = dat.design.washoutDays || 0;
    }
  }

  // Sample size
  const sel = document.getElementById("sample-size-method");
  if (sel && dat.ss?.method) {
    sel.value = dat.ss.method;
    renderSampleSizeForm(); // dựng form
    // điền input
    applySampleSizeInputs(dat.ss.inputs || {});
  }

  // Criteria
  dat.criteria?.inclusion?.forEach(s => addInclusionCriterion(s));
  dat.criteria?.exclusion?.forEach(s => addExclusionCriterion(s));

  // Randomization
  if (dat.random) {
    const m = document.getElementById("random-method"); if (m) { m.value = dat.random.method || ""; generateAutoRandomization(); }
    const d = document.getElementById("randomization-method"); if (d) d.value = dat.random.detail || "";
    applyRandomOptions(dat.random.options || {});
  }

  // Interventions
  renderInterventionDescriptions(dat.design?.numArms || 2, dat.interventions);

  // Variables
  if (Array.isArray(dat.variables?.all)) allVariables = dat.variables.all;
  if (dat.variables?.selected) selectedVariables = dat.variables.selected;
  createVariableDragUI();

  // Collect / Analysis / Ethics
  if (dat.collect?.desc) { const el = document.getElementById("collect-desc"); if (el) el.value = dat.collect.desc; }
  if (dat.analysis?.desc){ const el = document.getElementById("analysis-desc"); if (el) el.value = dat.analysis.desc; }
  if (dat.ethics?.desc)  { const el = document.getElementById("ethics-desc");   if (el) el.value = dat.ethics.desc; }
}

/* ---------- Điều hướng bước ---------- */
function goToStep(idx) {
  const steps = document.querySelectorAll(".step");
  const navs  = document.querySelectorAll(".steps-nav button");
  steps.forEach(s => s.classList.remove("active"));
  navs.forEach(n => n.classList.remove("active"));
  steps[idx]?.classList.add("active");
  navs[idx]?.classList.add("active");
  currentStep = idx;

  // Đồng bộ một số view khi vào bước
  const dat = loadData();
  if (idx === 8) { // Bước 9 (ngẫu nhiên)
    const num = dat.design?.numArms || 2;
    const numEl = document.getElementById("num-arms-step9");
    if (numEl) numEl.value = num;
  }
  if (idx === 9) { // Bước 10 can thiệp
    renderInterventionDescriptions(dat.design?.numArms || 2, dat.interventions);
  }
  if (idx === 15) { // Bước 16 sơ đồ
    renderStudyFlowDiagram();
  }
}

/* ---------- Reset ---------- */
function resetWizard() {
  if (!confirm("Xóa toàn bộ dữ liệu đã lưu và bắt đầu lại?")) return;
  localStorage.removeItem(LS_KEY);
  window.location.reload();
}

/* ---------- GPT helpers ---------- */
function parseGPTResponse(raw, ok = true) {
  let data = null; try { data = JSON.parse(raw); } catch {}
  let result = null;

  if (!result && data && typeof data.output_text === "string" && data.output_text.trim()) result = data.output_text.trim();
  if (!result && Array.isArray(data?.output)) {
    const msg = data.output.find(x => x?.type === "message");
    const textPart = msg?.content?.find?.(c => typeof c?.text === "string")?.text;
    if (textPart) result = textPart.trim();
  }
  if (!result && data?.choices?.[0]?.message?.content) result = data.choices[0].message.content.trim();
  if (!result && data?.choices?.[0]?.text)            result = data.choices[0].text.trim();
  if (!result && (data?.error || !ok))                 result = "❌ Lỗi từ server: " + (data?.error?.message || data?.error || raw);
  return result || "GPT không trả về nội dung.";
}
async function gptCall(prompt/*, model*/){
  const res = await fetch(GPT_ENDPOINT, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ action: "chat", prompt /*, model: "gpt-4o-mini"*/ })
  });
  const raw = await res.text();
  return parseGPTResponse(raw, res.ok);
}

/* ---------- PDF helper ---------- */
async function extractTextFromPDF(file) {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let fullText = "";
  for (let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(it => it.str).join(" ") + "\n";
  }
  return fullText;
}

/* =========================
 * B1: PICO
 * ========================= */
async function generatePicoDescription(){
  const p = document.getElementById("pico-p")?.value?.trim();
  const i = document.getElementById("pico-i")?.value?.trim();
  const c = document.getElementById("pico-c")?.value?.trim();
  const o = document.getElementById("pico-o")?.value?.trim();
  const out = document.getElementById("pico-gpt-result");
  const files = Array.from(document.getElementById("pico-file")?.files || []);
  if (!p || !i || !c || !o) return alert("Vui lòng điền đủ P I C O.");
  out && (out.innerText = "⏳ Đang xử lý...");

  let fileText = "";
  for (const f of files) if (f.type === "application/pdf") {
    try { fileText += `--- ${f.name} ---\n${await extractTextFromPDF(f)}\n\n`; } catch {}
  }
  const prompt = (fileText ? `Tài liệu:\n${fileText}\n` : "") +
`Viết đoạn mô tả RCT (5–8 câu) dựa vào:
- P: ${p}
- I: ${i}
- C: ${c}
- O: ${o}`;
  try { out && (out.innerText = await gptCall(prompt)); } catch(e){ out && (out.innerText = "❌ Lỗi: " + e.message); }
}
/* =========================
 * B2: Câu hỏi
 * ========================= */
async function generateResearchQuestionFromGPT(){
  const dat = loadData();
  const { p,i,c,o } = dat.pico || {};
  if (!p || !i || !c || !o) return alert("Điền đủ PICO trước khi gợi ý.");
  const out = document.getElementById("question-gpt-suggestion");
  const files = Array.from(document.getElementById("question-file")?.files || []);
  out && (out.innerText = "⏳ Đang gợi ý...");

  let fileText = "";
  for (const f of files) if (f.type === "application/pdf") {
    try { fileText += `--- ${f.name} ---\n${await extractTextFromPDF(f)}\n\n`; } catch {}
  }
  const prompt = (fileText ? `Tài liệu:\n${fileText}\n` : "") +
`Thông tin PICO:
- P:${p}
- I:${i}
- C:${c}
- O:${o}

Viết 1 câu hỏi nghiên cứu dạng RCT rõ ràng, mạch lạc.`;
  try { out && (out.innerText = await gptCall(prompt)); } catch(e){ out && (out.innerText = "❌ Lỗi: " + e.message); }
}
async function evaluateResearchQuestion(){
  const q = document.getElementById("question")?.value?.trim();
  if (!q) return alert("Nhập câu hỏi để đánh giá.");
  const out = document.getElementById("question-gpt-evaluation");
  out && (out.innerText = "⏳ Đang đánh giá...");
  const prompt = `Đánh giá câu hỏi sau theo FINER và kiểm tra đủ PICO:
"${q}"
Nêu góp ý cải thiện (ngắn gọn).`;
  try { out && (out.innerText = await gptCall(prompt)); } catch(e){ out && (out.innerText = "❌ Lỗi: " + e.message); }
}

/* =========================
 * B3: Mục tiêu
 * ========================= */
function addSubObjective(value=""){
  const wrap = document.getElementById("sub-objectives");
  if (!wrap) return;
  const container = document.createElement("div");
  container.style.display = "flex";
  container.style.gap = "10px";
  container.style.marginTop = "5px";

  const input = document.createElement("input");
  input.type = "text"; input.className="sub-objective";
  input.placeholder="Nhập mục tiêu phụ...";
  input.value = value || "";
  input.oninput = saveData; input.style.flex="1";

  const btn = document.createElement("button");
  btn.innerText="❌"; btn.title="Xóa";
  Object.assign(btn.style,{background:"none",border:"1px solid #ccc",padding:"4px 10px",borderRadius:"6px",cursor:"pointer",color:"red"});
  btn.onclick = () => { container.remove(); saveData(); };

  container.appendChild(input); container.appendChild(btn);
  wrap.appendChild(container);
  saveData();
}
async function generateObjectivesFromGPT(){
  const dat = loadData();
  const { p,i,c,o } = dat.pico || {};
  if (!p || !i || !c || !o) return alert("Cần đủ PICO trước khi gợi ý.");
  const files = Array.from(document.getElementById("objective-file")?.files || []);
  const out = document.getElementById("objective-gpt-suggestion");
  out && (out.innerText = "⏳ Đang gợi ý...");

  let fileText = "";
  for (const f of files) if (f.type==="application/pdf"){
    try{ fileText += `--- ${f.name} ---\n${await extractTextFromPDF(f)}\n\n`; }catch{}
  }
  const prompt = (fileText?`Tài liệu:\n${fileText}\n`:"") +
`P:${p} I:${i} C:${c} O:${o}
Viết 1 mục tiêu chính và 2–4 mục tiêu phụ (SMART, đo lường được) cho RCT này.`;
  try { out && (out.innerText = await gptCall(prompt)); } catch(e){ out && (out.innerText = "❌ Lỗi: " + e.message); }
}
async function evaluateObjectives(){
  const main = document.getElementById("main-objective")?.value?.trim() || "";
  const subs = Array.from(document.querySelectorAll(".sub-objective")).map(i => i.value.trim()).filter(Boolean);
  if (!main) return alert("Nhập mục tiêu chính.");
  const out = document.getElementById("objective-gpt-evaluation");
  out && (out.innerText = "⏳ Đang đánh giá...");
  const text = `Mục tiêu chính:\n- ${main}\n\nMục tiêu phụ:\n` + (subs.map(s => "- "+s).join("\n") || "(chưa nhập)");
  const prompt = `Đánh giá theo FINER và SMART các mục tiêu sau, nêu gợi ý viết lại nếu cần:\n${text}`;
  try { out && (out.innerText = await gptCall(prompt)); } catch(e){ out && (out.innerText = "❌ Lỗi: " + e.message); }
}

/* =========================
 * B4: Mở đầu – CaRS
 * ========================= */
async function generateGPT_Territory(){
  const out = document.getElementById("suggest-territory");
  if (!out) return;
  const dat = loadData();
  const { p,i,c,o } = dat.pico || {};
  if (!p||!i||!c||!o||!dat.mainObjective) return alert("Cần đủ PICO + mục tiêu chính.");
  out.textContent = "⏳ Đang sinh nội dung...";
  let fileText = "";
  const f = document.getElementById("file-territory")?.files?.[0];
  if (f?.type==="application/pdf") { try{ fileText = await extractTextFromPDF(f); }catch{} }
  const prompt = (fileText?`PDF:\n${fileText}\n\n`:"")+
`Thông tin:
P:${p} I:${i} C:${c} O:${o}
Câu hỏi:${dat.question||""}
Mục tiêu chính:${dat.mainObjective}

Viết phần Territory (CaRS) bằng tiếng Việt, logic, có số liệu nếu có.`;
  try { out.textContent = await gptCall(prompt); } catch(e){ out.textContent="❌ Lỗi: "+e.message; }
}
async function evaluateGPT_Territory(){
  const input = document.getElementById("intro-territory")?.value?.trim() || "";
  const out = document.getElementById("eval-territory"); if (!out) return;
  out.innerText="⏳ Đang đánh giá...";
  let fileText=""; const f=document.getElementById("file-territory")?.files?.[0];
  if (f?.type==="application/pdf"){ try{ fileText = await extractTextFromPDF(f);}catch{}}
  const prompt = `Đánh giá đoạn Territory sau về bối cảnh, số liệu, dẫn dắt, logic:\n"${input}"\n${fileText?("Tài liệu:\n"+fileText):""}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ Lỗi: "+e.message; }
}
async function generateGPT_Niche(){
  const out = document.getElementById("suggest-niche"); if (!out) return;
  const terr = document.getElementById("intro-territory")?.value?.trim() || "";
  if (!terr) return alert("Cần có Territory để viết Niche.");
  out.textContent="⏳ Đang sinh nội dung...";
  let fileText=""; const f=document.getElementById("file-niche")?.files?.[0];
  if (f?.type==="application/pdf"){ try{ fileText = await extractTextFromPDF(f);}catch{}}
  const prompt = (fileText?`PDF:\n${fileText}\n\n`:"") + `Territory:\n${terr}\nViết phần Niche (khoảng trống) liên kết hợp lý.`;
  try { out.textContent = await gptCall(prompt); } catch(e){ out.textContent="❌ Lỗi: "+e.message; }
}
async function evaluateGPT_Niche(){
  const input = document.getElementById("intro-niche")?.value?.trim() || "";
  const out = document.getElementById("eval-niche"); if (!out) return;
  out.innerText="⏳ Đang đánh giá...";
  let fileText=""; const f=document.getElementById("file-niche")?.files?.[0];
  if (f?.type==="application/pdf"){ try{ fileText = await extractTextFromPDF(f);}catch{}}
  const prompt = `Đánh giá Niche (khoảng trống) sau: "${input}"\n${fileText?("Tài liệu:\n"+fileText):""}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ Lỗi: "+e.message; }
}
async function generateGPT_Occupy(){
  const out = document.getElementById("suggest-occupy"); if (!out) return;
  const niche = document.getElementById("intro-niche")?.value?.trim() || "";
  const main  = document.getElementById("main-objective")?.value?.trim() || "";
  if (!niche || !main) return alert("Cần Niche + mục tiêu chính.");
  out.textContent="⏳ Đang sinh nội dung...";
  let fileText=""; const f=document.getElementById("file-occupy")?.files?.[0];
  if (f?.type==="application/pdf"){ try{ fileText = await extractTextFromPDF(f);}catch{}}
  const prompt = (fileText?`PDF:\n${fileText}\n\n`:"") + `Niche:\n${niche}\nMục tiêu chính:${main}\nViết phần Occupy: nêu cách nghiên cứu lấp khoảng trống, phương pháp, lý do.`;
  try { out.textContent = await gptCall(prompt); } catch(e){ out.textContent="❌ Lỗi: "+e.message; }
}
async function evaluateGPT_Occupy(){
  const input = document.getElementById("intro-occupy")?.value?.trim() || "";
  const out = document.getElementById("eval-occupy"); if (!out) return;
  out.innerText="⏳ Đang đánh giá...";
  let fileText=""; const f=document.getElementById("file-occupy")?.files?.[0];
  if (f?.type==="application/pdf"){ try{ fileText = await extractTextFromPDF(f);}catch{}}
  const prompt = `Đánh giá Occupy: "${input}"\n${fileText?("Tài liệu:\n"+fileText):""}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ Lỗi: "+e.message; }
}

/* =========================
 * B5: Tổng quan – 9 mục
 * ========================= */
async function _litGen(idOut, prompt){ const el=document.getElementById(idOut); if(!el)return; el.textContent="⏳..."; try{ el.textContent=await gptCall(prompt);}catch(e){el.textContent="❌ "+e.message;} }
async function _litEval(idOut, text, ask){ const el=document.getElementById(idOut); if(!el)return; el.textContent="⏳..."; try{ el.textContent=await gptCall(`${ask}\n---\n${text}`);}catch(e){el.textContent="❌ "+e.message;} }

async function generateGPT_YHHD_Overview(){ 
  const d=loadData(); const {p,i,c,o}=d.pico||{}; 
  const file=document.getElementById("file-yhhd-overview")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Đại cương YHHĐ" cho đề cương RCT.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-yhhd-overview", prompt);
}
async function evaluateGPT_YHHD_Overview(){ const text=document.getElementById("text-yhhd-overview")?.value?.trim()||""; return _litEval("eval-yhhd-overview", text, "Đánh giá Đại cương YHHĐ:"); }

async function generateGPT_Epidemiology(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-epidemiology")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Dịch tễ học & gánh nặng" phù hợp RCT.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-epidemiology", prompt);
}
async function evaluateGPT_Epidemiology(){ const text=document.getElementById("text-epidemiology")?.value?.trim()||""; return _litEval("eval-epidemiology", text, "Đánh giá mục Dịch tễ học:"); }

async function generateGPT_Diagnosis(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-diagnosis")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Chẩn đoán YHHĐ" cho đề cương.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-diagnosis", prompt);
}
async function evaluateGPT_Diagnosis(){ const text=document.getElementById("text-diagnosis")?.value?.trim()||""; return _litEval("eval-diagnosis", text, "Đánh giá mục Chẩn đoán:"); }

async function generateGPT_Treatment(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-treatment")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Điều trị YHHĐ" (ưu tiên guideline).\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-treatment", prompt);
}
async function evaluateGPT_Treatment(){ const text=document.getElementById("text-treatment")?.value?.trim()||""; return _litEval("eval-treatment", text, "Đánh giá mục Điều trị:"); }

async function generateGPT_Limitation(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-limitation")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Hạn chế của YHHĐ" có số liệu RCT/meta.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-limitation", prompt);
}
async function evaluateGPT_Limitation(){ const text=document.getElementById("text-limitation")?.value?.trim()||""; return _litEval("eval-limitation", text, "Đánh giá mục Hạn chế YHHĐ:"); }

async function generateGPT_YHCT_Overview(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-yhct-overview")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Tổng quan YHCT" (chứng danh, cổ văn, liên quan).\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-yhct-overview", prompt);
}
async function evaluateGPT_YHCT_Overview(){ const text=document.getElementById("text-yhct-overview")?.value?.trim()||""; return _litEval("eval-yhct-overview", text, "Đánh giá Tổng quan YHCT:"); }

async function generateGPT_Intervention(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-intervention")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nMô tả các liệu pháp YHCT liên quan và bằng chứng.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-intervention", prompt);
}
async function evaluateGPT_Intervention(){ const text=document.getElementById("text-intervention")?.value?.trim()||""; return _litEval("eval-intervention", text, "Đánh giá mục Liệu pháp YHCT:"); }

async function generateGPT_RelatedStudies(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-related-studies")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Nghiên cứu liên quan trong/ngoài nước", chỉ ra khác biệt với nghiên cứu hiện tại.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-related-studies", prompt);
}
async function evaluateGPT_RelatedStudies(){ const text=document.getElementById("text-related-studies")?.value?.trim()||""; return _litEval("eval-related-studies", text, "Đánh giá Nghiên cứu liên quan:"); }

async function generateGPT_NewMethods(){
  const d=loadData(); const {p,i,c,o}=d.pico||{};
  const file=document.getElementById("file-new-methods")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt=`P:${p} I:${i} C:${c} O:${o}\nViết "Phương pháp mới trong phân tích/dữ liệu" liên quan RCT.\n${t?("Tài liệu:\n"+t):""}`;
  return _litGen("suggest-new-methods", prompt);
}
async function evaluateGPT_NewMethods(){ const text=document.getElementById("text-new-methods")?.value?.trim()||""; return _litEval("eval-new-methods", text, "Đánh giá mục Phương pháp mới:"); }

/* =========================
 * B6: Thiết kế
 * ========================= */
function updateDesignFields(){
  const wrap = document.getElementById("design-extra-fields");
  if (!wrap) return;
  const type = document.getElementById("design-type")?.value || "";
  wrap.innerHTML = "";

  if (type === "parallel") {
    wrap.innerHTML = `
      <label>🔀 Số nhánh:</label>
      <input type="number" id="num-arms" min="2" value="2" oninput="saveData();renderInterventionDescriptions(parseInt(this.value||2));">
      <label>🏷️ Tên nhánh (phân tách dấu phẩy):</label>
      <input type="text" id="arm-names" placeholder="Ví dụ: Điện châm, Laser châm" oninput="saveData();renderInterventionDescriptions();">
    `;
  } else if (type === "cross-over") {
    wrap.innerHTML = `
      <label>🔁 Chuỗi can thiệp:</label>
      <input type="text" id="xo-sequences" value="AB,BA" oninput="saveData()">
      <label>⏳ Thời gian washout (ngày):</label>
      <input type="number" id="xo-washout" min="0" value="0" oninput="saveData()">
    `;
  }
  saveData();
}
async function generateGPT_Design(){
  const out = document.getElementById("suggest-design"); if(!out)return;
  out.textContent="⏳ Đang gợi ý...";
  const dat = loadData();
  const file = document.getElementById("file-design")?.files?.[0];
  let t=""; if(file?.type==="application/pdf"){ try{t=await extractTextFromPDF(file);}catch{} }
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}Thiết kế mong muốn: ${dat.design?.type||"(chưa chọn)"}; phân bổ:${dat.design?.random||"(chưa)"}; làm mù:${dat.design?.blind||"(chưa)"}.\nGợi ý thiết kế chi tiết phù hợp.`;
  try { out.textContent = await gptCall(prompt); } catch(e){ out.textContent="❌ "+e.message; }
}
async function evaluateGPT_Design(){
  const out = document.getElementById("eval-design"); if(!out)return;
  out.textContent="⏳ Đang đánh giá...";
  const dat = loadData();
  const prompt = `Đánh giá thiết kế sau: type=${dat.design?.type}, random=${dat.design?.random}, blinding=${dat.design?.blind}, arms=${dat.design?.numArms||2}, sequences=${(dat.design?.sequences||[]).join(",")}, washout=${dat.design?.washoutDays||0}. Góp ý cải thiện.`;
  try { out.textContent = await gptCall(prompt); } catch(e){ out.textContent="❌ "+e.message; }
}

/* =========================
 * B7: Cỡ mẫu
 * ========================= */
function renderSampleSizeForm(){
  const m = document.getElementById("sample-size-method")?.value || "";
  const box = document.getElementById("sample-size-form");
  const formula = document.getElementById("sample-size-formula");
  const ref = document.getElementById("sample-size-reference");
  if (!box) return;

  const common = `
    <label>α (two-sided):</label><input type="number" id="ss-alpha" step="0.001" value="0.05" oninput="saveData()">
    <label>Power (1-β):</label><input type="number" id="ss-power" step="0.001" value="0.80" oninput="saveData()">
    <label>Tỷ lệ mất mẫu (%):</label><input type="number" id="ss-dropout" step="0.1" value="10" oninput="saveData()">
  `;

  if (m === "means" || m==="crossover_means" || m==="noninferiority_means"){
    box.innerHTML = `
      ${common}
      <label>Độ lệch chuẩn (SD):</label><input type="number" id="ss-sd" step="0.0001" value="10" oninput="saveData()">
      <label>Hiệu số kỳ vọng (Δ = |μ1-μ2|):</label><input type="number" id="ss-delta" step="0.0001" value="5" oninput="saveData()">
      <label>Tỷ lệ n2/n1:</label><input type="number" id="ss-ratio" step="0.01" value="1" oninput="saveData()">
    `;
    formula.innerText = "Cỡ mẫu so sánh 2 trung bình: n mỗi nhóm ≈ 2*(Zα/2+Zβ)^2 * SD^2 / Δ^2 (điều chỉnh tỷ lệ n2/n1 nếu cần).";
    ref.innerText = "Tham chiếu: Chow, Shao & Wang (2018) – Các công thức cỡ mẫu chuẩn.";
  } else if (m === "proportions" || m==="noninferiority_prop" || m==="crossover_props"){
    box.innerHTML = `
      ${common}
      <label>p1 (tỷ lệ nhóm 1):</label><input type="number" id="ss-p1" step="0.0001" value="0.5" oninput="saveData()">
      <label>p2 (tỷ lệ nhóm 2):</label><input type="number" id="ss-p2" step="0.0001" value="0.35" oninput="saveData()">
      <label>Biên không thua kém (nếu NI):</label><input type="number" id="ss-margin" step="0.0001" value="0" oninput="saveData()">
      <label>Tỷ lệ n2/n1:</label><input type="number" id="ss-ratio" step="0.01" value="1" oninput="saveData()">
    `;
    formula.innerText = "Cỡ mẫu so sánh 2 tỷ lệ: n mỗi nhóm ≈ (Zα/2√(p̄(1-p̄))+Zβ√(p1(1-p1)+p2(1-p2)))^2 / (p1-p2-δ)^2.";
    ref.innerText = "Tham chiếu: Chow (2018) – chương 3,4.";
  } else if (m === "anova") {
    box.innerHTML = `
      ${common}
      <label>Số nhóm (k):</label><input type="number" id="ss-k" min="3" value="3" oninput="saveData()">
      <label>f (Cohen's f):</label><input type="number" id="ss-f" step="0.01" value="0.25" oninput="saveData()">
    `;
    formula.innerText = "ANOVA: N tổng ≈ ( (Zα + Zβ)^2 * (k-1) ) / (k * f^2 ).";
    ref.innerText = "Tham chiếu: Chow (2018) – ANOVA.";
  } else if (m === "chisq") {
    box.innerHTML = `${common}<p>Vui lòng xác định số ô bảng, tỷ lệ kỳ vọng… (hiện tại chỉ hiển thị placeholders).</p>`;
    formula.innerText = "Chi-square: phụ thuộc số ô & tỷ lệ; cần thông số chi tiết.";
    ref.innerText = "Tham chiếu: Chow (2018).";
  } else if (m === "survival") {
    box.innerHTML = `${common}<p>Log-rank: cần hazard ratio, tỷ lệ sự kiện, thời gian theo dõi… (placeholder).</p>`;
    formula.innerText = "Log-rank: N biến theo HR & sự kiện.";
    ref.innerText = "Tham chiếu: Chow (2018).";
  } else if (m === "ancova") {
    box.innerHTML = `${common}<p>ANCOVA/Repeated measures: cần ρ, số lần đo, SD-within… (placeholder).</p>`;
    formula.innerText = "ANCOVA: Điều chỉnh theo hiệp phương sai; cần thêm tham số.";
    ref.innerText = "Tham chiếu: Chow (2018).";
  } else {
    box.innerHTML = `<p>Chọn công thức ở trên để hiển thị form.</p>`;
    formula.innerText = ""; ref.innerText="";
  }
}
function readSampleSizeInputs(){
  const g = id => document.getElementById(id);
  const val = id => Number(g(id)?.value || 0);
  const method = document.getElementById("sample-size-method")?.value || "";
  const inputs = {
    alpha: val("ss-alpha"), power: val("ss-power"), dropout: val("ss-dropout"),
    sd: val("ss-sd"), delta: val("ss-delta"), ratio: val("ss-ratio"),
    p1: val("ss-p1"), p2: val("ss-p2"), margin: val("ss-margin"),
    k: val("ss-k"), f: val("ss-f")
  };
  return { method, ...inputs };
}
function applySampleSizeInputs(inp){
  const set = (id,v)=>{ const el=document.getElementById(id); if(el && v!=null && !Number.isNaN(v)) el.value = v; };
  set("ss-alpha",inp.alpha); set("ss-power",inp.power); set("ss-dropout",inp.dropout);
  set("ss-sd",inp.sd); set("ss-delta",inp.delta); set("ss-ratio",inp.ratio);
  set("ss-p1",inp.p1); set("ss-p2",inp.p2); set("ss-margin",inp.margin);
  set("ss-k",inp.k); set("ss-f",inp.f);
}
function Z(q){ // xấp xỉ nghịch đảo chuẩn
  // Beasley-Springer-Moro approx
  const a=[2.50662823884,-18.61500062529,41.39119773534,-25.44106049637];
  const b=[-8.47351093090,23.08336743743,-21.06224101826,3.13082909833];
  const c=[0.3374754822726147,0.9761690190917186,0.1607979714918209,0.0276438810333863,0.0038405729373609,0.0003951896511919,0.0000321767881768,0.0000002888167364,0.0000003960315187];
  if (q<0||q>1) return NaN;
  if (q===0.5) return 0;
  let x=q-0.5, r;
  if (Math.abs(x)<0.42){
    r = x*x;
    return x*(((a[3]*r+a[2])*r+a[1])*r+a[0]) / ((((b[3]*r+b[2])*r+b[1])*r+b[0])*r+1);
  }
  r = q; if (x>0) r=1-q;
  r = Math.log(-Math.log(r));
  let z = c[0]+r*(c[1]+r*(c[2]+r*(c[3]+r*(c[4]+r*(c[5]+r*(c[6]+r*(c[7]+r*c[8]))))))));
  return (x<0)? -z : z;
}
function calculateSampleSize(){
  const dat = loadData();
  const inp = readSampleSizeInputs();
  const resBox = document.getElementById("sample-size-result");
  const adjBox = document.getElementById("sample-size-adjusted");
  if (resBox) resBox.innerText = ""; if (adjBox) adjBox.innerText = "";

  const zalpha = Z(1 - (inp.alpha||0.05)/2);
  const zbeta  = Z(inp.power||0.8);
  let n1=0, n2=0, total=0;

  if (inp.method==="means" || inp.method==="crossover_means" || inp.method==="noninferiority_means"){
    const sd=inp.sd||1, delta=Math.abs(inp.delta||1), ratio=inp.ratio||1;
    const common = 2*Math.pow(zalpha+zbeta,2)*sd*sd/(delta*delta);
    // Điều chỉnh ratio n2/n1: n1 = common*(1+1/ratio)/2; n2 = n1*ratio
    n1 = Math.ceil(common*(1+1/ratio)/2);
    n2 = Math.ceil(n1*ratio);
    total = n1+n2;
  } else if (inp.method==="proportions" || inp.method==="noninferiority_prop" || inp.method==="crossover_props"){
    const p1=inp.p1, p2=inp.p2, delta=(p1-p2)-(inp.margin||0);
    const pbar=(p1+p2)/2;
    const numerator = Math.pow(zalpha*Math.sqrt(pbar*(1-pbar)) + zbeta*Math.sqrt(p1*(1-p1)+p2*(1-p2)),2);
    const denom = Math.pow(delta||0.000001,2);
    const base = numerator/denom;
    const ratio=inp.ratio||1;
    n1 = Math.ceil(base*(1+1/ratio)/2);
    n2 = Math.ceil(n1*ratio);
    total = n1+n2;
  } else if (inp.method==="anova"){
    const k=inp.k||3, f=inp.f||0.25;
    const z = Math.pow(Z(1-inp.alpha)+Z(inp.power),2);
    total = Math.ceil( (z*(k-1)) / (k*Math.pow(f,2)) );
  } else {
    if (resBox) resBox.innerText = "⚠️ Chưa hỗ trợ tính tự động cho công thức này. Vui lòng nhập tay theo công thức tham chiếu.";
    saveData(); return;
  }

  const dropout = (inp.dropout||0)/100;
  const totalAdj = Math.ceil(total / (1 - dropout));

  if (resBox) resBox.innerText = `Cỡ mẫu ước tính: Nhánh 1 = ${n1}, Nhánh 2 = ${n2}, Tổng = ${total}`;
  if (adjBox) adjBox.innerText = `Sau khi cộng hao hụt ${inp.dropout}% → Tổng cần tuyển ≈ ${totalAdj}`;
  const d = loadData(); d.ss.result = { n1, n2, total, totalAdj }; localStorage.setItem(LS_KEY, JSON.stringify(d));
}
async function generateSampleSizeSuggestion(){
  const out = document.getElementById("suggest-sample-size"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const inp = readSampleSizeInputs();
  const prompt = `Gợi ý cách tính cỡ mẫu cho "${inp.method}" với tham số hiện có: ${JSON.stringify(inp)}. Viết ngắn gọn, minh bạch theo công thức chuẩn.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function evaluateSampleSize(){
  const out = document.getElementById("eval-sample-size"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const d = loadData();
  const prompt = `Đánh giá cỡ mẫu đã tính: ${JSON.stringify(d.ss||{})}. Nhận xét giả định, đề xuất nhạy cảm với Δ/SD.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B8: Tiêu chí chọn/loại
 * ========================= */
function addInclusionCriterion(val=""){
  const host = document.getElementById("inclusion-criteria"); if(!host) return;
  const input = document.createElement("input"); input.type="text"; input.className="inclusion-item"; input.placeholder="Tiêu chí chọn..."; input.value=val; input.oninput=saveData;
  const btn = document.createElement("button"); btn.innerText="❌"; btn.onclick=()=>{ input.remove(); saveData(); };
  host.appendChild(input); host.appendChild(btn); host.appendChild(document.createElement("br"));
  saveData();
}
function addExclusionCriterion(val=""){
  const host = document.getElementById("exclusion-criteria"); if(!host) return;
  const input = document.createElement("input"); input.type="text"; input.className="exclusion-item"; input.placeholder="Tiêu chí loại..."; input.value=val; input.oninput=saveData;
  const btn = document.createElement("button"); btn.innerText="❌"; btn.onclick=()=>{ input.remove(); saveData(); };
  host.appendChild(input); host.appendChild(btn); host.appendChild(document.createElement("br"));
  saveData();
}
async function generateCriteriaFromGPT(){
  const out = document.getElementById("criteria-gpt-suggestion"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const dat = loadData();
  const file = document.getElementById("file-criteria")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}PICO:${JSON.stringify(dat.pico)}.\nGợi ý bộ tiêu chí chọn & loại phù hợp RCT.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function evaluateCriteria(){
  const out = document.getElementById("criteria-gpt-evaluation"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const dat = loadData();
  const prompt = `Đánh giá tiêu chí hiện tại:\nChọn:${(dat.criteria?.inclusion||[]).join("; ")}\nLoại:${(dat.criteria?.exclusion||[]).join("; ")}\nGóp ý ngắn gọn.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B9: Ngẫu nhiên
 * ========================= */
function generateAutoRandomization(){
  const host = document.getElementById("random-options"); if(!host) return;
  host.innerHTML = "";
  const method = document.getElementById("random-method")?.value || "";

  if (method === "block") {
    host.innerHTML = `
      <label>Kích thước khối:</label><input type="number" id="rand-block-size" value="4" oninput="saveData()">
      <label>Ngẫu nhiên hóa theo trung tâm? (yes/no)</label><input type="text" id="rand-center" value="no" oninput="saveData()">
    `;
  } else if (method === "stratified") {
    const baseVars = (selectedVariables?.baseline || []).map(v => v.name);
    host.innerHTML = `
      <label>Biến phân tầng (chọn từ biến nền):</label>
      <input id="rand-strata" placeholder="Nhập tên biến, ví dụ: tuổi; giới">
      <small>Gợi ý từ biến nền: ${baseVars.join(", ") || "(chưa chọn biến nền)"}</small>
    `;
    document.getElementById("rand-strata").oninput = saveData;
  } else if (method === "minimization") {
    host.innerHTML = `
      <label>Yếu tố cân bằng (danh sách):</label><input id="rand-factors" placeholder="Ví dụ: tuổi nhóm; giới; K-L độ" oninput="saveData()">
      <label>Hệ số ưu tiên p (0.5–1):</label><input type="number" id="rand-p" step="0.01" value="0.8" oninput="saveData()">
    `;
  } else {
    host.innerHTML = `<p>Chọn phương pháp để hiển thị tùy chọn.</p>`;
  }
  saveData();
}
function readRandomOptions(){
  const m = document.getElementById("random-method")?.value || "";
  if (m==="block"){
    return { blockSize: Number(document.getElementById("rand-block-size")?.value || 4),
             byCenter: (document.getElementById("rand-center")?.value || "no") };
  } else if (m==="stratified"){
    return { strata: (document.getElementById("rand-strata")?.value || "").split(";").map(s=>s.trim()).filter(Boolean) };
  } else if (m==="minimization"){
    return { factors: (document.getElementById("rand-factors")?.value || "").split(";").map(s=>s.trim()).filter(Boolean),
             p: Number(document.getElementById("rand-p")?.value || 0.8) };
  }
  return {};
}
function applyRandomOptions(opt){
  if (document.getElementById("random-method")?.value === "block"){
    const a=document.getElementById("rand-block-size"); if(a) a.value = opt.blockSize ?? 4;
    const b=document.getElementById("rand-center"); if(b) b.value = opt.byCenter ?? "no";
  } else if (document.getElementById("random-method")?.value === "stratified"){
    const s=document.getElementById("rand-strata"); if(s) s.value = (opt.strata||[]).join("; ");
  } else if (document.getElementById("rand-factors")){
    document.getElementById("rand-factors").value = (opt.factors||[]).join("; ");
    const p=document.getElementById("rand-p"); if(p) p.value = opt.p ?? 0.8;
  }
}
async function generateRandomizationSuggestion(){
  const out = document.getElementById("randomization-gpt-suggestion"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const dat = loadData();
  const file = document.getElementById("file-randomization")?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}PICO:${JSON.stringify(dat.pico)}; Thiết kế:${JSON.stringify(dat.design)}.\nGợi ý mô tả ngẫu nhiên hóa theo phương pháp: ${dat.random?.method||"(chưa chọn)"}; với tùy chọn: ${JSON.stringify(dat.random?.options||{})}.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function evaluateRandomization(){
  const out = document.getElementById("randomization-gpt-evaluation"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const dat = loadData();
  const prompt = `Đánh giá mô tả ngẫu nhiên hóa:\n${dat.random?.detail||"(chưa có mô tả)"}\nPhương pháp:${dat.random?.method}; options:${JSON.stringify(dat.random?.options||{})}.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B10: Can thiệp
 * ========================= */
function renderInterventionDescriptions(numArms=2, existing){
  const host = document.getElementById("intervention-descriptions"); if(!host) return;
  const dat = loadData();
  const names = (dat.design?.armNames && dat.design.armNames.length===numArms) ? dat.design.armNames : Array.from({length:numArms}, (_,k)=>`Nhánh ${k+1}`);
  host.innerHTML = "";
  for (let idx=0; idx<numArms; idx++){
    const ex = existing?.[idx] || {};
    const block = document.createElement("div");
    block.className="collection-block";
    block.innerHTML = `
      <label>🏷️ Tên nhóm ${idx+1}:</label><input type="text" id="iv-name-${idx}" value="${ex.name || names[idx] || ""}" oninput="saveData()">
      <label>📃 Mô tả can thiệp:</label><textarea id="iv-desc-${idx}" rows="4" oninput="saveData()">${ex.desc||""}</textarea>
      <label>💊 Liều/Liệu trình:</label><input id="iv-dose-${idx}" oninput="saveData()" value="${ex.dose||""}">
      <label>⏱️ Tần suất & Thời gian:</label><input id="iv-time-${idx}" oninput="saveData()" value="${ex.time||""}">
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <input type="file" id="iv-file-${idx}" accept=".pdf">
        <button onclick="gptInterventionSuggest(${idx})">🧠 GPT gợi ý</button>
        <button onclick="gptInterventionEvaluate(${idx})">🧐 GPT đánh giá</button>
      </div>
      <div id="iv-suggest-${idx}" class="gpt-suggest"></div>
      <div id="iv-eval-${idx}" class="gpt-eval"></div>
    `;
    host.appendChild(block);
  }
}
function readInterventionsFromDOM(numArms){
  const arr = [];
  for (let idx=0; idx<numArms; idx++){
    const name = document.getElementById(`iv-name-${idx}`)?.value || "";
    const desc = document.getElementById(`iv-desc-${idx}`)?.value || "";
    const dose = document.getElementById(`iv-dose-${idx}`)?.value || "";
    const time = document.getElementById(`iv-time-${idx}`)?.value || "";
    arr.push({ name, desc, dose, time });
  }
  return arr;
}
async function gptInterventionSuggest(idx){
  const out = document.getElementById(`iv-suggest-${idx}`); if(!out) return;
  out.innerText="⏳ ...";
  const dat = loadData();
  const f = document.getElementById(`iv-file-${idx}`)?.files?.[0]; let t=""; if (f?.type==="application/pdf"){ try{ t=await extractTextFromPDF(f);}catch{} }
  const iv = dat.interventions?.[idx] || {};
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}PICO:${JSON.stringify(dat.pico)}; Thiết kế:${dat.design?.type}; Nhánh:${iv.name||("Nhánh "+(idx+1))}.\nGợi ý mô tả can thiệp (thành phần, liều, tần suất, thời gian, tuân thủ, an toàn).`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function gptInterventionEvaluate(idx){
  const out = document.getElementById(`iv-eval-${idx}`); if(!out) return;
  out.innerText="⏳ ...";
  const dat = loadData(); const iv = dat.interventions?.[idx] || {};
  const prompt = `Đánh giá mô tả can thiệp nhánh ${iv.name||("Nhánh "+(idx+1))}:\n${iv.desc||"(chưa có mô tả)"}\nNhận xét tính rõ ràng, khả thi, an toàn; đề xuất bổ sung.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B11: Biến số – kéo thả
 * ========================= */
function createVariableDragUI(){
  const container = document.getElementById("variable-groups"); if (!container) return;
  container.innerHTML = "";
  variableRoles.forEach(role => {
    const availableList = (allVariables || []).filter(v => v.role === role.key);
    const selectedList  = selectedVariables[role.key] || [];

    const block = document.createElement("div"); block.className="variable-group";
    const heading = document.createElement("h4"); heading.textContent = role.name; block.appendChild(heading);
    const desc = document.createElement("div"); desc.className="description"; desc.textContent=role.description; block.appendChild(desc);

    const wrap = document.createElement("div"); wrap.className="variable-lists";

    const availableUl = document.createElement("ul"); availableUl.className="variable-list variable-available"; availableUl.dataset.role = role.key;
    availableUl.ondrop = drop; availableUl.ondragover = allowDrop;
    availableList.forEach(v => availableUl.appendChild(makeVarLi(v)));

    const selectedUl = document.createElement("ul"); selectedUl.className="variable-list variable-selected"; selectedUl.dataset.role = role.key;
    selectedUl.ondrop = drop; selectedUl.ondragover = allowDrop;
    selectedList.forEach(v => selectedUl.appendChild(makeVarLi(v,true)));

    wrap.appendChild(availableUl); wrap.appendChild(selectedUl); block.appendChild(wrap);

    // Khu vực GPT
    const pdfLabel = document.createElement("label"); pdfLabel.innerText = "📂 Tải tài liệu PDF hỗ trợ:"; block.appendChild(pdfLabel);
    const fileInput = document.createElement("input"); fileInput.type="file"; fileInput.id = `file-variable-${role.key}`; fileInput.accept=".pdf"; block.appendChild(fileInput);
    block.appendChild(document.createElement("br"));

    const btnRow = document.createElement("div"); btnRow.style.display="flex"; btnRow.style.gap="10px"; btnRow.style.marginTop="8px";
    const sBtn = document.createElement("button"); sBtn.innerText="🧠 GPT gợi ý biến"; sBtn.onclick=()=>suggestVariablesForRole(role.key);
    const eBtn = document.createElement("button"); eBtn.innerText="🧐 GPT đánh giá biến"; eBtn.onclick=()=>evaluateVariablesForRole(role.key);
    btnRow.appendChild(sBtn); btnRow.appendChild(eBtn); block.appendChild(btnRow);

    const suggestDiv = document.createElement("div"); suggestDiv.id=`suggest-variable-${role.key}`; suggestDiv.className="gpt-suggest"; block.appendChild(suggestDiv);
    const evalDiv = document.createElement("div"); evalDiv.id=`eval-variable-${role.key}`; evalDiv.className="gpt-eval"; block.appendChild(evalDiv);

    container.appendChild(block);
  });

  // Lắng nghe input CSV
  const varFile = document.getElementById("variable-file");
  if (varFile && !varFile._bound) {
    varFile.addEventListener("change", onVariableCSV);
    varFile._bound = true;
  }
}
function makeVarLi(v, selected=false){
  const li = document.createElement("li");
  li.draggable = true; li.ondragstart = drag;
  li.dataset.name=v.name||""; li.dataset.role=v.role||""; li.dataset.type=v.type||"";
  li.dataset.unit=v.unit||""; li.dataset.time=v.time||""; li.dataset.measure=v.measure||"";
  li.dataset.definition=v.definition||""; li.dataset.source=v.source||""; li.dataset.format=v.format||"";
  li.dataset.range=v.range||""; li.dataset.mcid=v.mcid_or_cutoff||"";
  const span = document.createElement("span"); span.textContent = `${v.name} (${v.type||""})`; li.appendChild(span);
  li.title = [
    `Tên: ${v.name}`, `Vai trò: ${v.role}`, `Kiểu: ${v.type}`, `Đơn vị: ${v.unit}`, `Thời điểm: ${v.time}`,
    `Đo lường: ${v.measure}`, `Định nghĩa: ${v.definition}`, `Nguồn: ${v.source}`, `Định dạng: ${v.format}`, `Khoảng: ${v.range}`, `MCID/Ngưỡng: ${v.mcid_or_cutoff}`
  ].join("\n");
  if (selected){
    const btn = document.createElement("button"); btn.innerText="🗑";
    Object.assign(btn.style,{position:"absolute",top:"4px",right:"6px",background:"none",border:"none",color:"red",cursor:"pointer",fontSize:"16px"});
    btn.onclick = (e)=>removeVariable(e, v.name, v.role);
    li.appendChild(btn);
  }
  return li;
}
function allowDrop(e){ e.preventDefault(); }
function drag(e){
  e.dataTransfer.setData("fromList", e.target.parentElement.classList.contains("variable-selected") ? "selected" : "available");
  e.dataTransfer.setData("role", e.target.dataset.role);
  e.dataTransfer.setData("name", e.target.dataset.name);
}
function drop(e){
  e.preventDefault();
  const role = e.dataTransfer.getData("role");
  const name = e.dataTransfer.getData("name");
  if (!role || !name) return;
  const v = (allVariables||[]).find(x => x.name===name && x.role===role) || selectedVariables[role]?.find(x=>x.name===name);
  if (!v) return;
  const targetList = e.target.closest(".variable-list"); if(!targetList) return;

  if ([...targetList.querySelectorAll("li")].some(el=>el.dataset.name===name)) return;
  targetList.appendChild(makeVarLi(v, targetList.classList.contains("variable-selected")));

  // Nếu di chuyển từ available sang selected, xóa bản in source
  const from = e.dataTransfer.getData("fromList");
  if (from==="available"){
    const fromList = document.querySelector(`.variable-available[data-role="${role}"]`);
    const item = [...(fromList?.querySelectorAll("li")||[])].find(el=>el.dataset.name===name);
    item && item.remove();
  }
  // Cập nhật selectedVariables
  selectedVariables[role] = [...document.querySelectorAll(`.variable-selected[data-role="${role}"] li`)].map(el => ({
    name: el.dataset.name, role: el.dataset.role, type: el.dataset.type||"", unit: el.dataset.unit||"", time: el.dataset.time||"",
    measure: el.dataset.measure||"", definition: el.dataset.definition||"", source: el.dataset.source||"", format: el.dataset.format||"",
    range: el.dataset.range||"", mcid_or_cutoff: el.dataset.mcid||""
  }));
  saveData();
}
function removeVariable(e, name, role){
  e?.stopPropagation();
  const selList = document.querySelector(`.variable-selected[data-role="${role}"]`);
  const li = [...(selList?.querySelectorAll("li")||[])].find(el=>el.dataset.name===name);
  if (li) li.remove();
  // trả về available
  const v = selectedVariables[role]?.find(x=>x.name===name);
  if (v){
    const avail = document.querySelector(`.variable-available[data-role="${role}"]`);
    avail && avail.appendChild(makeVarLi(v,false));
  }
  selectedVariables[role] = (selectedVariables[role]||[]).filter(x=>x.name!==name);
  saveData();
}
async function onVariableCSV(e){
  const file = e.target.files[0]; if(!file) return;
  const text = await file.text();
  const result = Papa.parse(text.trim(), { header:true, skipEmptyLines:true });
  allVariables = result.data.map(row => ({
    name: row.name?.trim() || "", role: row.role?.trim() || "", type: row.type?.trim() || "",
    unit: row.unit||"", time: row.time||"", measure: row.measure||"", definition: row.definition||"",
    source: row.source||"", format: row.format||"", range: row.range||"", mcid_or_cutoff: row.mcid_or_cutoff||""
  }));
  createVariableDragUI();
  saveData();
}
function addNewVariable(){
  const g=id=>document.getElementById(id);
  const v = {
    name: g("new-name")?.value?.trim()||"",
    role: g("new-role")?.value||"",
    type: g("new-type")?.value||"",
    unit: g("new-unit")?.value||"",
    time: g("new-time")?.value||"",
    measure: g("new-measure")?.value||"",
    definition: g("new-definition")?.value||"",
    source: g("new-source")?.value||"",
    format: g("new-format")?.value||"",
    range: g("new-range")?.value||"",
    mcid_or_cutoff: g("new-mcid")?.value||""
  };
  if (!v.name || !v.role) return alert("Tên biến và Vai trò là bắt buộc.");
  allVariables.push(v);
  createVariableDragUI();
  saveData();
  alert("✅ Đã thêm biến vào danh sách.");
}
function exportVariables(){
  const dat = loadData();
  const arr = [...(dat.variables?.all||[])];
  const header = ["name","role","type","unit","time","measure","definition","source","format","range","mcid_or_cutoff"];
  const rows = [header.join(",")].concat(arr.map(v => header.map(h => (String(v[h]??"")).replace(/,/g,";")).join(",")));
  const blob = new Blob([rows.join("\n")], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "variables_updated.csv"; a.click();
  URL.revokeObjectURL(url);
}
async function suggestVariablesForRole(roleKey){
  const out = document.getElementById(`suggest-variable-${roleKey}`); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const dat = loadData();
  const file = document.getElementById(`file-variable-${roleKey}`)?.files?.[0]; let t=""; if(file?.type==="application/pdf"){try{t=await extractTextFromPDF(file);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}PICO:${JSON.stringify(dat.pico)}; Mục tiêu chính:${dat.mainObjective||""}.\nGợi ý danh sách biến cho nhóm "${roleKey}" (tên biến + cách đo + thời điểm).`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ "+e.message; }
}
async function evaluateVariablesForRole(roleKey){
  const out = document.getElementById(`eval-variable-${roleKey}`); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const vars = (selectedVariables[roleKey]||[]).map(v=>v.name).join(", ");
  const prompt = `Đánh giá biến đã chọn cho nhóm "${roleKey}": ${vars||"(chưa chọn)"}.\nNhận xét đủ/thiếu, đo lường, thời điểm.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ "+e.message; }
}

/* =========================
 * B12: Thu thập dữ liệu
 * ========================= */
async function generateCollectSuggestion(){
  const out = document.getElementById("suggest-collect"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const dat = loadData();
  const f = document.getElementById("file-collect-pdf")?.files?.[0]; let t=""; if(f?.type==="application/pdf"){try{t=await extractTextFromPDF(f);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}PICO:${JSON.stringify(dat.pico)}; Biến chính:${(dat.variables?.selected?.primary||[]).map(x=>x.name).join(", ")}.\nGợi ý kế hoạch thu thập (thời điểm, công cụ, đảm bảo chất lượng).`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function evaluateCollectDescription(){
  const out = document.getElementById("eval-collect"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const txt = document.getElementById("collect-desc")?.value?.trim() || "";
  const prompt = `Đánh giá mô tả thu thập dữ liệu sau, chỉ ra điểm cần bổ sung:\n${txt}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B13: Phân tích số liệu
 * ========================= */
async function generateAnalysisPlan(){
  const out = document.getElementById("suggest-analysis"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const d = loadData();
  const f = document.getElementById("file-analysis-pdf")?.files?.[0]; let t=""; if(f?.type==="application/pdf"){try{t=await extractTextFromPDF(f);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}Thiết kế:${d.design?.type}; Nhánh:${d.design?.numArms||2}; Biến chính:${(d.variables?.selected?.primary||[]).map(x=>x.name).join(", ")}.\nGợi ý chiến lược phân tích như một SAP ngắn.`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ "+e.message; }
}
async function evaluateAnalysisPlan(){
  const out = document.getElementById("eval-analysis"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const txt = document.getElementById("analysis-desc")?.value?.trim() || "";
  const prompt = `Đánh giá kế hoạch phân tích sau (ITT/PP, xử lý thiếu số liệu, kiểm định, hiệu chỉnh đa biến...):\n${txt}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ "+e.message; }
}

/* =========================
 * B14: Đạo đức
 * ========================= */
async function generateEthicsSection(){
  const out = document.getElementById("suggest-ethics"); if(!out) return;
  out.innerText="⏳ Đang gợi ý...";
  const d = loadData();
  const f = document.getElementById("file-ethics-pdf")?.files?.[0]; let t=""; if(f?.type==="application/pdf"){try{t=await extractTextFromPDF(f);}catch{}}
  const prompt = `${t?("Tài liệu:\n"+t+"\n"):""}Viết mục Đạo đức nghiên cứu phù hợp RCT (Helsinki, đồng thuận, bảo mật, SAE/AE, dừng sớm...). Bối cảnh:${JSON.stringify(d.pico||{})}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}
async function evaluateEthicsSection(){
  const out = document.getElementById("eval-ethics"); if(!out) return;
  out.innerText="⏳ Đang đánh giá...";
  const txt = document.getElementById("ethics-desc")?.value?.trim() || "";
  const prompt = `Đánh giá mục đạo đức sau, góp ý bổ sung:\n${txt}`;
  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText="❌ "+e.message; }
}

/* =========================
 * B15: Check logic tổng thể
 * ========================= */
async function checkLogic(){
  const out = document.getElementById("logic-check-result"); if(!out) return;
  out.innerText="⏳ Đang kiểm tra...";
  const d = loadData();

  const selected = d.variables?.selected || {};
  const variableList = Object.entries(selected).flatMap(([role, vars]) => (vars||[]).map(v => `${v.name} (${role})`)).join(", ");

  const ivs = (d.interventions||[]).map((x,idx)=>`- ${x.name||("Nhánh "+(idx+1))}: ${x.desc||"(chưa mô tả)"}`).join("\n");

  const prompt = `
Bạn là chuyên gia đánh giá đề cương RCT. Hãy kiểm tra tính nhất quán và logic giữa các phần sau:

- P: ${d.pico?.p || ""}
- I: ${d.pico?.i || ""}
- C: ${d.pico?.c || ""}
- O: ${d.pico?.o || ""}
- Câu hỏi nghiên cứu: ${d.question || ""}
- Mục tiêu chính: ${d.mainObjective || ""}
- Mục tiêu phụ: ${(d.subObjectives||[]).join("; ")}
- Thiết kế: ${d.design?.type || ""}, phân bổ: ${d.design?.random || ""}, làm mù: ${d.design?.blind || ""}
- Can thiệp:
${ivs || "(chưa nhập)"}
- Biến số đã chọn: ${variableList || "(chưa chọn)"}
- Kế hoạch phân tích: ${d.analysis?.desc || "(chưa nhập)"}
- Đạo đức: ${d.ethics?.desc || "(chưa nhập)"}

Yêu cầu:
1) Chỉ ra mâu thuẫn/thiếu sót (nếu có) và gợi ý khắc phục theo từng mục.
2) Đánh giá xem mục tiêu chính có tương thích biến chính & phân tích không.
3) Cảnh báo các rủi ro về bias, feasibility, safety.
  `.trim();

  try { out.innerText = await gptCall(prompt); } catch(e){ out.innerText = "❌ "+e.message; }
}

/* =========================
 * B16: Sơ đồ nghiên cứu (Mermaid)
 * ========================= */
function renderStudyFlowDiagram(){
  const d = loadData();
  const type = d.design?.type || "parallel";
  const numArms = d.design?.numArms || 2;
  const arms = (d.design?.armNames && d.design.armNames.length===numArms) ? d.design.armNames : Array.from({length:numArms}, (_,k)=>`Nhánh ${k+1}`);

  let g = `flowchart TD
    A[Đánh giá đủ tiêu chí] --> B{Tiêu chí chọn/loại}
    B -- Đủ tiêu chí --> R[Ngẫu nhiên hoá]
    B -- Không đủ --> EX[Loại]
  `;
  if (type === "parallel"){
    arms.forEach((name,idx)=>{
      g += `\n  R --> A${idx}[${name}]`;
      g += `\n  A${idx} --> F${idx}[Theo dõi]`;
      g += `\n  F${idx} --> AN${idx}[Phân tích]`;
    });
  } else {
    g += `\n  R --> S1[Chuỗi: ${(d.design?.sequences||["AB","BA"]).join(", ")}]`;
    g += `\n  S1 --> W[Washout ${d.design?.washoutDays||0} ngày] --> AN[Phân tích]`;
  }

  const pre = document.getElementById("studyflow-mermaid"); if (!pre) return;
  pre.textContent = g;

  // Render
  if (window.mermaid?.run) {
    window.mermaid.run({ querySelector: "#studyflow-mermaid" });
  } else if (window.mermaid?.init) {
    window.mermaid.init(undefined, pre);
  }
}
async function downloadMermaidPNG(){
  const node = document.getElementById("studyflow-mermaid"); if (!node) return;
  const canvas = await html2canvas(node);
  const url = canvas.toDataURL("image/png");
  const a = document.createElement("a"); a.href = url; a.download = "study_flow.png"; a.click();
}

/* ---------- Liên kết sự kiện chung ---------- */
document.addEventListener("DOMContentLoaded", () => {
  hydrateUIFromData();
  goToStep(0); // mở bước 1
  // Lưu tự động khi rời input/textarea/select
  document.body.addEventListener("input", (e) => {
    const t = e.target;
    if (["INPUT","TEXTAREA","SELECT"].includes(t.tagName)) saveData();
  });
});

/* ---------- Xuất các hàm ra phạm vi global để HTML gọi ---------- */
// ===== Expose public API for inline handlers =====
function exposeToWindow(obj) {
  Object.entries(obj).forEach(([k, v]) => { if (typeof v === 'function') window[k] = v; });
}

// Liệt kê đúng các hàm đang được HTML gọi:
exposeToWindow({
  // điều hướng
  goToStep,

  // lưu/xóa
  saveData, resetWizard,

  // PICO
  generatePicoDescription,

  // Câu hỏi
  generateResearchQuestionFromGPT, evaluateResearchQuestion,

  // Mục tiêu
  addSubObjective, generateObjectivesFromGPT, evaluateObjectives,

  // Mở đầu (CaRS)
  generateGPT_Territory,  evaluateGPT_Territory,
  generateGPT_Niche,      evaluateGPT_Niche,
  generateGPT_Occupy,     evaluateGPT_Occupy,

  // Tổng quan (9 mục)
  generateGPT_YHHD_Overview,  evaluateGPT_YHHD_Overview,
  generateGPT_Epidemiology,   evaluateGPT_Epidemiology,
  generateGPT_Diagnosis,      evaluateGPT_Diagnosis,
  generateGPT_Treatment,      evaluateGPT_Treatment,
  generateGPT_Limitation,     evaluateGPT_Limitation,
  generateGPT_YHCT_Overview,  evaluateGPT_YHCT_Overview,
  generateGPT_Intervention,   evaluateGPT_Intervention,
  generateGPT_RelatedStudies, evaluateGPT_RelatedStudies,
  generateGPT_NewMethods,     evaluateGPT_NewMethods,

  // Thiết kế + sơ đồ
  updateDesignFields, renderStudyFlowDiagram,
  generateGPT_Design, evaluateGPT_Design,

  // Cỡ mẫu
  renderSampleSizeForm, calculateSampleSize,
  generateSampleSizeSuggestion, evaluateSampleSize,

  // Tiêu chí
  addInclusionCriterion, addExclusionCriterion,
  generateCriteriaFromGPT, evaluateCriteria,

  // Ngẫu nhiên
  generateAutoRandomization, generateRandomizationSuggestion, evaluateRandomization,

  // Biến số
  addNewVariable, exportVariables,

  // Thu thập
  generateCollectSuggestion, evaluateCollectDescription,

  // Phân tích
  generateAnalysisPlan, evaluateAnalysisPlan,

  // Đạo đức
  generateEthicsSection, evaluateEthicsSection,

  // Check logic + xuất hình
  checkLogic, downloadMermaidPNG
});
