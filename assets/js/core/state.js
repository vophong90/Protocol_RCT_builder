// core/state.js
const STORAGE_KEY = "rctWizardData";

export function getState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
  catch { return {}; }
}

export function setState(patch) {
  const cur = getState();
  const next = { ...cur, ...patch };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

/** Giữ nguyên tên hàm để compatibility với onclick cũ */
export function saveData() {
  const pico = {
    p: document.getElementById("pico-p")?.value?.trim() || "",
    i: document.getElementById("pico-i")?.value?.trim() || "",
    c: document.getElementById("pico-c")?.value?.trim() || "",
    o: document.getElementById("pico-o")?.value?.trim() || "",
  };
  const mainObjective = document.getElementById("main-objective")?.value?.trim() || "";
  const question = document.getElementById("question")?.value?.trim() || "";
  const analysis = document.getElementById("analysis-desc")?.value || "";
  const ethics = document.getElementById("ethics-desc")?.value || "";

  setState({ pico, mainObjective, question, analysis, ethics });
}

export function loadData() {
  const s = getState();
  if (s?.pico) {
    const { p, i, c, o } = s.pico;
    if (document.getElementById("pico-p")) document.getElementById("pico-p").value = p || "";
    if (document.getElementById("pico-i")) document.getElementById("pico-i").value = i || "";
    if (document.getElementById("pico-c")) document.getElementById("pico-c").value = c || "";
    if (document.getElementById("pico-o")) document.getElementById("pico-o").value = o || "";
  }
  if (document.getElementById("main-objective")) document.getElementById("main-objective").value = s?.mainObjective || "";
  if (document.getElementById("question")) document.getElementById("question").value = s?.question || "";
  if (document.getElementById("analysis-desc")) document.getElementById("analysis-desc").value = s?.analysis || "";
  if (document.getElementById("ethics-desc")) document.getElementById("ethics-desc").value = s?.ethics || "";
}

export function resetWizard() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}
