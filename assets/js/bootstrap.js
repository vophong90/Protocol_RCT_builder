// bootstrap.js
import { loadData, saveData, resetWizard } from "./core/state.js";
import { bootNav, goToStep } from "./ui/nav.js";
import { extractTextFromPDF } from "./services/pdf.js";
import { parseGPTResponse, gptCall } from "./services/gpt.js";
import { bootVariables, createVariableDragUI, getSelectedVariables } from "./features/variables.js";
import { checkLogic } from "./features/logic.js";

// Expose các hàm dùng trong onclick cũ (compatibility)
window.goToStep = goToStep;
window.saveData = saveData;
window.resetWizard = resetWizard;

// Helper GPT/PDF dùng chung
window.parseGPTResponse = parseGPTResponse;
window.gptCall = gptCall;
window.extractTextFromPDF = extractTextFromPDF;

// Biến số (Bước 11)
window.createVariableDragUI = createVariableDragUI;
window.getSelectedVariables = getSelectedVariables;

// Check logic (Bước 15)
window.checkLogic = checkLogic;

// Stubs an toàn cho các hàm chưa tách (đỡ crash nếu HTML gọi tới)
["generateAutoRandomization","evaluateRandomization","renderStudyFlowDiagram","downloadMermaidPNG","updateDesignFields","renderArms","addSubObjective"].forEach(fn => {
  if (!window[fn]) window[fn] = () => alert(`⚠️ ${fn}() chưa được triển khai trong bản tách mô-đun.`);
});

document.addEventListener("DOMContentLoaded", () => {
  loadData();
  bootNav();
  bootVariables();
});
