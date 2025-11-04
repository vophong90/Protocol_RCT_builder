// src/state/storage.js
const KEY = 'rctWizardData';

export function loadData() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  return data;
}

export function updateData(updater) {
  const curr = loadData();
  const next = typeof updater === 'function' ? updater(curr) : { ...curr, ...updater };
  return saveData(next);
}

// Helpers thường dùng trong app gốc (không đổi khóa)
export const getPICO = () => loadData().pico || {};
export const setPICO = (pico) => updateData((d) => ({ ...d, pico }));

export const getInterventions = () => loadData().interventions || [];
export const setInterventions = (arr) => updateData((d) => ({ ...d, interventions: arr }));

export const getSelectedVariables = () => loadData().selectedVariables || {};
export const setSelectedVariables = (obj) => updateData((d) => ({ ...d, selectedVariables: obj }));

export const getMainObjective = () => loadData().mainObjective || '';
export const setMainObjective = (s) => updateData((d) => ({ ...d, mainObjective: s }));
