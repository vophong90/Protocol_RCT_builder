// src/services/pdf.js
// Yêu cầu pdfjsLib đã có từ vendor <script> (pdf.min.js) và đã set workerSrc trong index.html
export async function extractTextFromPDF(file) {
  if (!window.pdfjsLib) throw new Error('pdfjsLib not found. Ensure vendor scripts are loaded.');
  const pdfjsLib = window.pdfjsLib;

  const buf = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: buf });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const strings = content.items.map((i) => i.str).filter(Boolean);
    fullText += strings.join(' ') + '\n';
  }
  return fullText.trim();
}
