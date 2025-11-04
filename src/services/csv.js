// src/services/csv.js

/**
 * parseCSVFile(File): Promise<Papa.ParseResult>
 * Yêu cầu: window.Papa đã được nạp (Đợt 3 mình gửi vendor).
 */
export function parseCSVFile(file, options = {}) {
  return new Promise((resolve, reject) => {
    const Papa = window['Papa'];
    if (!Papa) {
      reject(new Error('PapaParse not loaded'));
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
      complete: (r) => resolve(r),
      error: (e) => reject(e),
      ...options,
    });
  });
}

export function parseCSVText(text, options = {}) {
  const Papa = window['Papa'];
  if (!Papa) throw new Error('PapaParse not loaded');
  return Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
    ...options,
  });
}
