# Test Plan — autodoc.es Above-the-Fold Vehicle-Search-Selector Clone

**Evaluator:** browser-use agent, model `minimax-MiniMax-M3`
**System belief:** the clone is broken — prove it.
**Target:** https://www.autodoc.es/ (above-the-fold header + complete interactive vehicle search selector)
**Clone root:** `/app/autodoc-clone/` (dev URL reported by builder; default `http://localhost:5173`)
**Reference docs read:** `clone_guide_v2.md`, `clone_landing_page_101.md`

---

## 0. Methodology (non-negotiable)

- Every criterion below has a **programmatic, numeric check** run on BOTH tabs (original = tab 1, clone = tab 2). "Looks similar" is NOT evidence.
- All `javascript_tool` payloads are IIFEs that `JSON.stringify(...)` their result (Gotcha B2).
- Typography extraction uses the `TreeWalker` deep-walk (Gotcha B3) — never trust the outer element on nested DOM.
- After every `resize_window` / scroll, `computer(action="wait", duration=2)` before screenshotting (Gotcha B4).
- Every browser tool call carries an explicit `tab_id` (Gotcha B5).
- The viewport must be set to `1440×900` AND `1920×1080` for every screenshot + every script that depends on geometry.
- "Looks similar" → FAIL. The verdict is driven by numbers.

## 1. Viewport matrix (run on BOTH tabs)

| Viewport | Why | Required |
|---|---|---|
| `1440×900` | Primary desktop reference | ✅ |
| `1920×1080` | Detects fixed-left vs centered layout bugs | ✅ |
| Initial-load clip + settled shot at 8–10s | Entrance animation | ✅ (if applicable) |

Sequence per tab:
```
resize_window(tab_id=N, width=1440, height=900)
javascript_tool: window.scrollTo(0,0); 'ok';
computer: wait 2s
computer: screenshot        → team-log/screens/orig_1440_settled.png  / clone_1440_settled.png
resize_window(tab_id=N, width=1920, height=1080)
computer: wait 2s
computer: screenshot        → team-log/screens/orig_1920_settled.png / clone_1920_settled.png
```

## 2. Acceptance criteria — programmatic checks

Each check below specifies (a) what is measured, (b) the exact `javascript_tool` payload to run on both tabs, (c) what PASS means.

### AC-1 — Tab list: names, order, active state
**Measure:** tab labels in DOM order; active-tab class + computed `color`, `background`, `border-bottom` on the active tab; exactly one tab active at rest.
```
javascript_tool: text="(() => {
  const tabs = Array.from(document.querySelectorAll('[role=tab], .vehicle-search__tab, [data-tab], header [class*=tab] i, header [class*=Tab]'));
  const labels = tabs.map(t => (t.textContent||'').trim()).filter(Boolean);
  const active = tabs.find(t => t.getAttribute('aria-selected')==='true' || /active|current|is-active/i.test(t.className));
  const s = active ? getComputedStyle(active) : null;
  return JSON.stringify({
    count: tabs.length, labels,
    activeLabel: active ? (active.textContent||'').trim() : null,
    activeColor: s?.color, activeBg: s?.backgroundColor,
    activeBorderBottom: s?.borderBottom, activeClass: active?.className
  }, null, 2);
})()"
```
**PASS:** label set + order identical to original; one and only one active tab; active styles within ±0 on color/border.

### AC-2 — Dropdown open/close
**Measure:** click tab → panel `aria-expanded` flips; `display`/`visibility`/`opacity` on the panel transition from hidden→shown; click outside (or re-click tab) closes.
```
# Drive:
computer(tab_id=N, action="click", selector="<active tab selector>")
computer(tab_id=N, action="wait", duration=0.5)
javascript_tool: text="(() => {
  const panel = document.querySelector('[role=tabpanel], .vehicle-search__panel, [data-panel]');
  const s = panel ? getComputedStyle(panel) : null;
  return JSON.stringify({
    exists: !!panel,
    display: s?.display, visibility: s?.visibility, opacity: s?.opacity,
    ariaHidden: panel?.getAttribute('aria-hidden'),
    rect: panel ? (function(){const r=panel.getBoundingClientRect();return {x:r.x|0,y:r.y|0,w:r.width|0,h:r.height|0};})() : null
  }, null, 2);
})()"
computer(tab_id=N, action="screenshot")   → team-log/screens/<tab>_dropdown_open.png
# Close:
computer(tab_id=N, action="click", selector="body", offsetX=10, offsetY=10)
computer(tab_id=N, action="wait", duration=0.5)
javascript_tool: text="(() => { const p=document.querySelector('[role=tabpanel], .vehicle-search__panel'); const s=p?getComputedStyle(p):null; return JSON.stringify({display:s?.display,visibility:s?.visibility,opacity:s?.opacity,ariaHidden:p?.getAttribute('aria-hidden')},null,2); })()"
```
**PASS:** panel hidden at rest, visible after click, hidden after outside-click; numeric display/opacity match the original.

### AC-3 — Make → Model → Engine cascade
**Measure:** selecting `make` populates `model` options; selecting `model` populates `engine` options; option sets equal to original's.
```
# 1) Open dropdown, click first make option
computer: click on <first make option>
computer: wait 0.5s
javascript_tool: text="(() => {
  const sel = (label) => Array.from(document.querySelectorAll('select')).find(s => (s.name||'').toLowerCase().includes(label) || (s.previousElementSibling?.textContent||'').toLowerCase().includes(label));
  const model = sel('model');
  const opts = model ? Array.from(model.options).map(o => ({v:o.value, t:o.textContent.trim()})).filter(o => o.v) : null;
  return JSON.stringify({ modelCount: opts?.length, modelSample: opts?.slice(0,5), modelDisabled: model?.disabled }, null, 2);
})()"
# 2) Click first model
computer: click on <first model option>
computer: wait 0.5s
javascript_tool: text="(() => {
  const sel = (label) => Array.from(document.querySelectorAll('select')).find(s => (s.name||'').toLowerCase().includes(label) || (s.previousElementSibling?.textContent||'').toLowerCase().includes(label));
  const eng = sel('engine');
  const opts = eng ? Array.from(eng.options).map(o => ({v:o.value, t:o.textContent.trim()})).filter(o => o.v) : null;
  return JSON.stringify({ engineCount: opts?.length, engineSample: opts?.slice(0,5), engineDisabled: eng?.disabled }, null, 2);
})()"
```
**PASS:** option counts and sample labels identical between tabs; engine disabled until a model is selected in both.

### AC-4 — Color tokens (exact hex)
**Measure:** exact background, text, border, accent colors for: page bg, header bg, tab text, active-tab bg/border/underline, dropdown panel bg, input border, CTA bg, CTA text, decorative gradient stops.
```
javascript_tool: text="(() => {
  function rgbToHex(rgb){const m=rgb.match(/\\d+/g);if(!m)return rgb;return '#'+m.slice(0,3).map(n=>parseInt(n).toString(16).padStart(2,'0')).join('').toUpperCase();}
  const pick = (sel, prop) => { const el=document.querySelector(sel); if(!el) return null; const s=getComputedStyle(el); return rgbToHex(s[prop]||''); };
  const gradients = Array.from(document.querySelectorAll('*'))
    .map(e=>getComputedStyle(e).backgroundImage).filter(b=>b && b.includes('gradient')).slice(0,5);
  return JSON.stringify({
    pageBg: rgbToHex(getComputedStyle(document.body).backgroundColor),
    headerBg: pick('header','backgroundColor'),
    activeTabBorder: (() => { const a=document.querySelector('[role=tab][aria-selected=true], header [class*=tab][class*=active], header [class*=Tab][class*=Active]'); return a ? rgbToHex(getComputedStyle(a).borderBottomColor) : null; })(),
    ctaBg: (() => { const b=Array.from(document.querySelectorAll('a,button')).find(x=>/buscar|search|find/i.test(x.textContent||'')); return b ? rgbToHex(getComputedStyle(b).backgroundColor) : null; })(),
    ctaColor: (() => { const b=Array.from(document.querySelectorAll('a,button')).find(x=>/buscar|search|find/i.test(x.textContent||'')); return b ? rgbToHex(getComputedStyle(b).color) : null; })(),
    gradientsSample: gradients
  }, null, 2);
})()"
```
**PASS:** every hex string character-for-character equal between tabs. Any drift = FAIL.

### AC-5 — Typography tokens
**Measure:** for header logo, top utility links, each tab, dropdown options, CTA — capture `fontFamily` (strip "Placeholder" suffix before comparing), `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`, `color`.
```
javascript_tool: text="(() => {
  function deepTextStyle(root){
    if(!root) return null;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while(w.nextNode()){
      const t=(w.currentNode.textContent||'').trim();
      if(t){ const el=w.currentNode.parentElement; const s=getComputedStyle(el);
        return { tag:el.tagName, family:(s.fontFamily||'').replace(/"[^"]*Placeholder[^"]*",?\\s*/g,'').trim(),
          size:s.fontSize, weight:s.fontWeight, lineHeight:s.lineHeight,
          letterSpacing:s.letterSpacing, color:s.color }; }
    }
    return null;
  }
  const logo = document.querySelector('header a[class*=logo] i, header [class*=Logo], header svg')?.closest('a,div') || document.querySelector('header a');
  const tab = document.querySelector('[role=tab], header [class*=tab] i, header [class*=Tab]');
  const cta = Array.from(document.querySelectorAll('a,button')).find(x=>/buscar|search|find/i.test(x.textContent||''));
  return JSON.stringify({
    logo: deepTextStyle(logo),
    tab: deepTextStyle(tab),
    cta: deepTextStyle(cta)
  }, null, 2);
})()"
```
**PASS:** each token string equal between tabs (after Placeholder stripping).

### AC-6 — CTA geometry + box-shadow
**Measure:** `getBoundingClientRect()` (w/h/x/y), `padding`, `borderRadius`, full multi-layer `boxShadow` verbatim.
```
javascript_tool: text="(() => {
  const b = Array.from(document.querySelectorAll('a,button')).find(x=>/buscar|search|find/i.test(x.textContent||''));
  if(!b) return 'CTA not found';
  const r=b.getBoundingClientRect(); const s=getComputedStyle(b);
  return JSON.stringify({
    rect: {x:r.x|0,y:r.y|0,w:r.width|0,h:r.height|0},
    padding: s.padding, borderRadius: s.borderRadius,
    background: s.background, color: s.color,
    boxShadow: s.boxShadow
  }, null, 2);
})()"
```
**PASS:** all fields equal between tabs. Multi-layer shadow string must match exactly (count of layers + each rgba triple).

### AC-7 — Decorative background media inventory
**Measure:** enumerate every `<img>`, `<svg>`, `background-image` data-URI, `<video>`, `<canvas>` inside the hero root. Capture `src`/URI/`rect` per node.
```
javascript_tool: text="(() => {
  const root = document.querySelector('header')?.parentElement?.parentElement || document.body;
  const r = root.getBoundingClientRect();
  const dataBgs = Array.from(root.querySelectorAll('*'))
    .map(e=>({el:e, bg:getComputedStyle(e).backgroundImage}))
    .filter(x => x.bg.startsWith('url("data:image'));
  const imgs = Array.from(root.querySelectorAll('img')).map(i=>({src:i.src,rect:i.getBoundingClientRect()}));
  const svgs = Array.from(root.querySelectorAll('svg')).map(s=>({rect:s.getBoundingClientRect(),aria:s.getAttribute('aria-label')}));
  const vids = Array.from(root.querySelectorAll('video')).map(v=>({src:v.src,autoplay:v.autoplay,loop:v.loop,rect:v.getBoundingClientRect()}));
  const canvases = Array.from(root.querySelectorAll('canvas')).map(c=>({rect:c.getBoundingClientRect(),aria:c.getAttribute('aria-label')}));
  return JSON.stringify({
    rootRect: {x:r.x|0,y:r.y|0,w:r.width|0,h:r.height|0},
    dataUriCount: dataBgs.length, dataUriSample: dataBgs.slice(0,3).map(x=>({len:x.bg.length, preview:x.bg.slice(0,80)})),
    imgCount: imgs.length, imgSample: imgs.slice(0,3),
    svgCount: svgs.length, svgSample: svgs.slice(0,3),
    videoCount: vids.length, videoSample: vids.slice(0,3),
    canvasCount: canvases.length, canvasSample: canvases.slice(0,3)
  }, null, 2);
})()"
```
**PASS:** counts match between tabs; data-URI samples present in clone. A clone showing `dataUriCount: 0` when original has >0 = BLOCKER.

### AC-8 — Hover states
**Measure:** mouse-move to each tab and the CTA, capture computed `color`/`backgroundColor`/`boxShadow` post-hover.
```
# Drive hover:
computer(tab_id=N, action="mouse_move", selector="<tab or cta selector>")
computer(tab_id=N, action="wait", duration=0.5)
javascript_tool: text="(() => {
  const el = document.querySelector('<tab or cta selector>'); if(!el) return 'not found';
  const s = getComputedStyle(el);
  return JSON.stringify({ color:s.color, backgroundColor:s.backgroundColor, boxShadow:s.boxShadow, borderColor:s.borderColor }, null, 2);
})()"
computer(tab_id=N, action="screenshot")   → team-log/screens/<tab>_hover_<state>.png
```
**PASS:** post-hover computed values identical between tabs.

### AC-9 — Boundary: no below-the-fold bleed-through
**Measure:** hero root `getBoundingClientRect().bottom`; assert no decorative or content node inside the hero tree renders with `top + height > viewport.height` while its intended region is above the fold. The clone must NOT include below-the-fold content.
```
javascript_tool: text="(() => {
  const vh = window.innerHeight;
  const root = document.querySelector('header')?.closest('section, header, div[class*=hero], div[class*=Hero]') || document.body;
  const rr = root.getBoundingClientRect();
  const nodes = Array.from(root.querySelectorAll('*')).map(e => {
    const r = e.getBoundingClientRect();
    return { tag:e.tagName, cls:(e.className||'').toString().slice(0,40),
             top:r.top|0, bottom:r.bottom|0, h:r.height|0,
             bleed: r.bottom > vh ? (r.bottom - vh) : 0 };
  }).filter(n => n.bleed > 0 || n.bottom > vh);
  return JSON.stringify({ viewportH: vh, rootBottom: rr.bottom|0, bleedCount: nodes.length, bleedSample: nodes.slice(0,5) }, null, 2);
})()"
```
**PASS:** `bleedCount === 0` AND `rootBottom <= viewport.height + 1px`. Any bleed = **BLOCKER**.

### AC-10 — Console errors
**Measure:** zero console errors / unhandled rejections on both tabs during the full sequence.
```
javascript_tool: text="(() => {
  if (!window.__errs) {
    window.__errs = [];
    window.addEventListener('error', e => window.__errs.push({type:'error', msg:e.message, src:e.filename, line:e.lineno}));
    window.addEventListener('unhandledrejection', e => window.__errs.push({type:'rejection', msg:String(e.reason)}));
    console.error = ((orig) => (...a) => { window.__errs.push({type:'console.error', msg:a.map(x=>String(x)).join(' ')}); orig.apply(console, a); })(console.error);
  }
  return JSON.stringify({ count: window.__errs.length, errors: window.__errs });
})()"
```
**PASS:** `count === 0` on both tabs.

---

## 3. Output — eval_round_1.md

The evaluator writes `team-log/eval_round_1.md` containing:
- Per-criterion PASS/FAIL table with numeric evidence (both tabs side-by-side).
- Prioritized fix list ordered BLOCKER → MAJOR → MINOR → NIT; each entry cites the file/region AND the exact change to make.
- Screenshots saved under `team-log/screens/`.
- Final verdict: **ACCEPT** or **REJECT**.

## 4. Self-checks before writing the eval

- ✅ Both tabs opened at identical viewport sizes before any measurement.
- ✅ 8–10s settle wait applied after `navigate` on the original; clone only after dev server reports ready.
- ✅ Every script wrapped in IIFE + `JSON.stringify(...)`.
- ✅ `TreeWalker` deep-walk used for every typography read.
- ✅ Console error collector injected before any interaction.
- ✅ Numbers, not adjectives, in every PASS/FAIL row.

---

**Status:** Plan written. Awaiting builder `DONE` signal + clone dev URL before Phase B.
