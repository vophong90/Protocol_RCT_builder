// src/services/pdf.js
async function fileToArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsArrayBuffer(file);
  });
}

/**
 * extractTextFromPDF(fileOrUrl)
 * - fileOrUrl: File | string (URL)
 * Yêu cầu: window.pdfjsLib đã được nạp (Đợt 3 mình gửi vendor).
 */
export async function extractTextFromPDF(fileOrUrl) {
  const pdfjs = window['pdfjsLib'];
  if (!pdfjs) throw new Error('pdfjsLib not loaded');

  // worker từ vendor (đúng với layout GH Pages)
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = './vendor/pdfjs/pdf.worker.min.js';
  }

  const loadingTask =
    typeof fileOrUrl === 'string'
      ? pdfjs.getDocument(fileOrUrl)
      : pdfjs.getDocument({ data: await fileToArrayBuffer(fileOrUrl) });

  const pdf = await loadingTask.promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it) => (typeof it.str === 'string' ? it.str : ''))
        .join(' ') + '\n';
  }
  return text;
}
