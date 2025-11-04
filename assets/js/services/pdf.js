// services/pdf.js
export async function extractTextFromPDF(file) {
  if (!file || file.type !== "application/pdf") return "";
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(it => it.str);
    fullText += strings.join(" ") + "\n";
  }
  return fullText;
}
