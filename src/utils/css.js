// Nạp CSS theo href và đảm bảo chỉ nạp 1 lần
const loaded = new Set();
export function ensureCSS(href){
  if (loaded.has(href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
  loaded.add(href);
}
