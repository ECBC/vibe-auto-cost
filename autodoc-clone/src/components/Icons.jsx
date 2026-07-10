// Inline SVG icon set (approximations of autodoc.es icon-sprite-bw.svg)
// All icons render at the requested size; color via currentColor.

const props = (cls) => ({ className: cls, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' });

export const IconPlus = (p) => (
  <svg {...props(p.className)}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconCar = (p) => (
  <svg {...props(p.className)}><path d="M3 13l2-6h14l2 6M3 13h18v5H3z" /><circle cx="7" cy="18" r="1.5" fill="currentColor" /><circle cx="17" cy="18" r="1.5" fill="currentColor" /></svg>
);
export const IconGarage = (p) => (
  <svg {...props(p.className)}><path d="M3 12l9-6 9 6v9H3z" /><rect x="6" y="14" width="12" height="7" /></svg>
);
export const IconComparison = (p) => (
  <svg {...props(p.className)}><path d="M3 12h6M15 12h6M3 6h4M11 6h10M3 18h8M15 18h6" /></svg>
);
export const IconUser = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-7 8-7s8 3 8 7" /></svg>
);
export const IconSearch = (p) => (
  <svg {...props(p.className)}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg>
);
export const IconCart = (p) => (
  <svg {...props(p.className)}><path d="M3 4h2l2 12h12l2-9H6" /><circle cx="8" cy="20" r="1.5" fill="currentColor" /><circle cx="18" cy="20" r="1.5" fill="currentColor" /></svg>
);
export const IconChevronDown = (p) => (
  <svg {...props(p.className)}><path d="M6 9l6 6 6-6" /></svg>
);
export const IconRefresh = (p) => (
  <svg {...props(p.className)}><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" /></svg>
);

// Category nav icons (simple geometric approximations matching sprite-bw.svg style)
export const IconTruck = (p) => (
  <svg {...props(p.className)}><rect x="2" y="7" width="12" height="9" /><path d="M14 10h4l3 3v3h-7" /><circle cx="6" cy="18" r="1.6" fill="currentColor" /><circle cx="18" cy="18" r="1.6" fill="currentColor" /></svg>
);
export const IconMoto = (p) => (
  <svg {...props(p.className)}><circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M9 17h6M6 14l3-7h4l3 7" /></svg>
);
export const IconTyres = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>
);
export const IconRims = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M12 3l3 6-3 3-3-3zM12 21l-3-6 3-3 3 3zM3 12l6-3 3 3-3 3zM21 12l-6 3-3-3 3-3z" /></svg>
);
export const IconTools = (p) => (
  <svg {...props(p.className)}><path d="M14 6a4 4 0 00-4 5l-6 6 2 2 6-6a4 4 0 005-4l-3 3-2-2z" /></svg>
);
export const IconMisc = (p) => (
  <svg {...props(p.className)}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h2M11 10h6M7 14h10" /></svg>
);
export const IconOil = (p) => (
  <svg {...props(p.className)}><path d="M12 3c-2 4-4 6-4 10a4 4 0 008 0c0-4-2-6-4-10z" /></svg>
);
export const IconFilters = (p) => (
  <svg {...props(p.className)}><rect x="4" y="4" width="16" height="16" rx="8" /><path d="M8 12h8" /></svg>
);
export const IconBrakes = (p) => (
  <svg {...props(p.className)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 5v3M12 16v3M5 12h3M16 12h3" /></svg>
);

export const IconArrowLeft = (p) => (
  <svg {...props(p.className)}><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconArrowRight = (p) => (
  <svg {...props(p.className)}><path d="M9 6l6 6-6 6" /></svg>
);
