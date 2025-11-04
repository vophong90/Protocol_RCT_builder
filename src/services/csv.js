// src/services/csv.js
// PapaParse được load global từ vendor
export function parseCSV(file, options = {}) {
  return new Promise((resolve, reject) => {
    if (!window.Papa) return reject(new Error('PapaParse not found'));
    window.Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      ...options,
      complete: (res) => resolve(res),
      error: (err) => reject(err),
    });
  });
}
