// src/utils/dom.js
export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export const on = (el, evt, handler, opts) => el?.addEventListener(evt, handler, opts);
export const off = (el, evt, handler, opts) => el?.removeEventListener(evt, handler, opts);

export const delegate = (root, evt, selector, handler) => {
  on(root, evt, (e) => {
    const matched = e.target.closest(selector);
    if (matched && root.contains(matched)) handler(e, matched);
  });
};

export const show = (el) => { if (el) el.classList.add('active'); };
export const hide = (el) => { if (el) el.classList.remove('active'); };
