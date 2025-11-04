// src/utils/dom.js
export const qs  = (sel, el = document) => el.querySelector(sel);
export const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/** Ủy quyền sự kiện: delegate(root, '.btn', 'click', (e, el)=>{}) */
export function delegate(root, selector, event, handler) {
  root.addEventListener(event, (e) => {
    const t = e.target.closest(selector);
    if (t && root.contains(t)) handler(e, t);
  });
}
