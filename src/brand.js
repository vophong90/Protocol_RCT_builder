// src/brand.js
export async function applyBrand() {
  const defaults = {
    name: document.title || 'Wizard RCT',
    primary: '#0ea44b',
    accent:  '#0E7BD0',
    bg:      '#f8fafc',
    fg:      '#0f172a',
    radius:  '16px'
  };

  try {
    const res = await fetch('./public/brand/brand.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('brand.json not found');
    const b = await res.json();

    const brand = {
      ...defaults,
      name:   b.name   ?? defaults.name,
      primary:b.primary?? b.color ?? defaults.primary,
      accent: b.accent ?? defaults.accent,
      bg:     b.bg     ?? defaults.bg,
      fg:     b.fg     ?? defaults.fg,
      radius: b.radius ?? defaults.radius,
    };

    const root = document.documentElement;
    root.style.setProperty('--brand-primary', brand.primary);
    root.style.setProperty('--brand-accent',  brand.accent);
    root.style.setProperty('--brand-bg',      brand.bg);
    root.style.setProperty('--brand-fg',      brand.fg);
    root.style.setProperty('--brand-radius',  brand.radius);

    // theme-color
    const meta = document.querySelector('meta[name="theme-color"]') || (() => {
      const m = document.createElement('meta');
      m.setAttribute('name','theme-color');
      document.head.appendChild(m);
      return m;
    })();
    meta.setAttribute('content', brand.primary);

    // tiêu đề (không bắt buộc)
    if (brand.name) document.title = brand.name;

  } catch {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', defaults.primary);
    root.style.setProperty('--brand-accent',  defaults.accent);
    root.style.setProperty('--brand-bg',      defaults.bg);
    root.style.setProperty('--brand-fg',      defaults.fg);
    root.style.setProperty('--brand-radius',  defaults.radius);
  }
}
