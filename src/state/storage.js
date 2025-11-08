// Trung tâm state + persist localStorage
const LS_KEY = 'rctWizardData';
let state = load();
export const getState = () => state;
export const saveState = (patch) => { state = deepMerge(state, patch || {}); persist(); return state; };
export const setAt = (path, value) => { setDeep(state, path, value); persist(); return state; };

function load(){ try{ const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : {}; }catch{ return {}; } }
function persist(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch{} }

function setDeep(obj, path, value){
  const parts = Array.isArray(path) ? path : String(path).split('.');
  let cur = obj; for (let i=0;i<parts.length-1;i++){ const k = parts[i]; cur[k] = cur[k] ?? {}; cur = cur[k]; }
  cur[parts[parts.length-1]] = value;
}
function deepMerge(t, s){
  if (Array.isArray(s)) return s.slice();
  if (s && typeof s === 'object'){ const o = { ...(t||{}) }; for (const k of Object.keys(s)){ o[k] = deepMerge(o[k], s[k]); } return o; }
  return s;
}
