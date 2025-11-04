// src/services/exportImage.js
// html2canvas ở global
export async function exportElementToPNG(el, filename = 'diagram.png') {
  if (!window.html2canvas) throw new Error('html2canvas not found');
  const canvas = await window.html2canvas(el, { useCORS: true, scale: 2 });
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
}
