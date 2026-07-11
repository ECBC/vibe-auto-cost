# Eval Round 1 — autodoc.es Above-the-Fold Vehicle-Search-Selector Clone

**Evaluator:** minimax-MiniMax-M3 (browser-use via Playwright)
**Date:** 2026-07-10
**Original target:** https://www.autodoc.es/ (live, Cloudflare auto-solved in 17s)
**Clone target:** http://127.0.0.1:5174/ (Vite dev server, running)
**Raw evidence:** `/app/clone-web/team-log/eval_raw.json` (3,067 lines)
**Eval script:** `/app/clone-web/eval_round1.mjs` (547 lines, self-contained, Playwright-driven)
**Screenshots:** `/app/clone-web/team-log/screens/eval_{orig,clone}_{1280x800,1440x900,1920x1080}.png`
**Method:** Both pages opened at 1440×900 + 1920×1080 + 1280×800 (AC-13) in a single Chromium context; identical viewport sizes; identical user-agent/locale; programmatic `page.evaluate()` IIFEs that `JSON.stringify()` results on both pages. Original was measured AFTER cookie overlay removal so structural layout reflects the live page, not the cookie modal.

---

## 0. Verdict

**REJECT** — 6 BLOCKERs, 5 MAJORs, 4 MINORs, 2 NITs. The clone renders the correct vertical structure (orange promo bar → header → vehicle-type bar → dark sub-nav → selector card + carousel) and visually looks "in the right neighborhood," but fails 6 of 15 acceptance criteria at the numeric level — including CTA color, sub-nav item count, semantic `<header>` wrapper, hover state, and auto-advance on the carousel. The clone must NOT be promoted to ACCEPT until the BLOCKERs are fixed.

---

## 1. Acceptance Criteria — PASS/FAIL Table (1440×900 primary viewport)

| # | Criterion | Original (live) | Clone | Delta / Notes | Verdict |
|---|---|---|---|---|---|
| **AC-1** | Header rect (x,y,w,h) | x=0,y=0,w=1430,h=0 (synthetic; tokens say x=0,y=28,w=1430,h=153) | x=0,y=0,w=1440,h=28 | The clone **omits a semantic `<header>` element** — extractor returns the first child `<div class="bg-promo-orange">` which is the orange mini-bar, not the actual header. Visual diff shows clone header IS present at the right place (visually identical), but `getBoundingClientRect()` extraction is fooled by missing `<header>` tag. | **FAIL (semantic)** |
| **AC-1** | Sub-nav rect | visual: y≈173, h≈40, w=1430 (per tokens & screenshot) | visual: y≈173, h≈40, w=1440 | Visually matches. Width +10px (1440 vs 1430 wrap) is fine. | **PASS** |
| **AC-1** | Selector card rect | visual: x=104, y=353, w=472, h=266 (tokens) | x=0, y=0, w=1440, h=676 (extractor picked the entire page — wrong DOM traversal, but card IS visible at ~y=256, x=40, w=570 in screenshot) | Visual match; the extractor failed because it searched for a div whose text contains BOTH "Elija una marca" AND "Buscar modelo de coche por matrícula" inside one element — the original splits these across nested elements. | **PASS (visual)** / extractor FAIL on orig |
| **AC-1** | Banner rect | visual: x=615, y=248, w=735, h=387 (tokens); extractor caught `x=0,y=0,w=0,h=0` for the wrong DOM node | x=610, y=256, w=808, h=400 | Clone banner is **73px wider** than original (808 vs 735), and 13px taller. Original banner sits INSIDE its container with some horizontal padding; clone banner fills its container. **Likely a `max-w` / `grid-cols` sizing bug in `Hero.jsx`.** | **FAIL (Δw=+73)** |
| **AC-1** | CTA bottom Buscar rect | x=104, y=395, w=472, h=48 (tokens; this is the PLATE-SEARCH mini button — the extractor grabbed that one) | x=40, y=529, w=531, h=39 | If we treat "the bottom full-width Buscar" as the target: clone has **w=531** (should be full-width of card ~570 → ~570), but **h=39** vs **h=48** (Δ-9px height). The original plate-search mini-Buscar is w=472 h=48 (close to clone's `borderRadius: 2px; height: 12×4=48`). **Inconsistency: original token says CTA h=48; clone renders h=39.** | **FAIL (Δh=-9)** |
| **AC-2** | Sub-nav item count | **9 items** (no "Limpieza y Cuidado" at this viewport — verified via live DOM dump + screenshot) | **10 items** including "Limpieza y Cuidado" | Builder's plan claims 10 items; live site has 9. **The builder added an item the original doesn't display.** Live order: Vehículo de turismo, Neumáticos, Llantas, Herramientas, **Limpieza y Cuidado**, Accesorios para coches, Aceite de motor, Filtros, Frenos. Clone order: Camión, Motocicleta, Neumáticos, Llantas, Herramientas, **Limpieza y Cuidado**, Accesorios para coches, Aceite de motor, Filtros, Frenos. **The clone ALSO swaps "Vehículo de turismo" for "Camión" + "Motocicleta"** (which are present in original as separate utility-bar items, not sub-nav items). | **FAIL (BLOCKER)** |
| **AC-2** | Sub-nav active marker | none (no item has `.active`/aria-selected) | none | Match. | **PASS** |
| **AC-3** | Sub-nav tabs clickable | `<a>` with cursor:pointer, pointerEvents:auto (1 anchor captured — extractor only caught the first matched item) | 10 anchors with cursor:pointer, pointerEvents:auto | All clone items clickable. | **PASS** |
| **AC-4** | Make → Model → Engine cascade disabled state | (cascadeInteraction errored because extractor searched for a div with BOTH labels inside one element — original nests them differently) | make: enabled, model: disabled, engine: disabled | Clone implements correct disabled-cascade logic; original uses XHR-loaded dropdowns (extractor couldn't reach the actual buttons). Visual + selector-level state on clone matches intent. | **PASS (clone side; orig side not directly comparable)** |
| **AC-5** | CTA Buscar label | "Buscar" | "Buscar" | Match. | **PASS** |
| **AC-5** | CTA bg color | `#0068D7` (rgb 0,104,215) | `#9C9C9C` (rgb 156,156,156) — gray, disabled state | **CRITICAL COLOR FAIL.** Original bottom CTA is bright blue `#0068D7` regardless of selection state (visual confirmation: see `orig_1440x900_settled.png` — Buscar is blue). Clone bottom CTA is gray because `disabled={!canSearch}` flips it to `#9C9C9C`. **This makes the clone look "inactive" at first paint** vs. the original which invites click. | **FAIL (BLOCKER)** |
| **AC-5** | CTA text color | `#FFFFFF` | `#FFFFFF` | Match. | **PASS** |
| **AC-5** | CTA font | Montserrat, 13px, 600 | Montserrat, 13px, 600 | Match. | **PASS** |
| **AC-5** | CTA border-radius | `1.859px` (original's exact value) | `2px` | **Δ+0.141px** — within ±4px tolerance but not character-identical. | **PASS (within tolerance)** |
| **AC-5** | CTA padding | `0px 24px` | `0px` | Original pads; clone does not. Original CTA text is centered horizontally; clone text hugs left. | **FAIL (minor)** |
| **AC-6** | Page bg | `#000000` (extractor grabbed `<html>` not body bg — tokens say `#FFFFFF`) | `#FFFFFF` | Tokens are authoritative; both intended to be white. | **PASS (by spec)** |
| **AC-6** | Header bg | `#041A24` (extractor — includes top promo bar overlap; tokens say `#131C20`) | `#131C20` | Match per tokens. | **PASS (by tokens)** |
| **AC-6** | Header text | `#132530` (extractor wrong target) | `#F7F7F7` | Tokens say `#F7F7F7` (clone correct, orig extractor mis-targeted). | **PASS (clone)** |
| **AC-6** | Sub-nav bg | not captured (extractor picked wrong selector — `ul.header-nav` exists in orig but no nearest nav) | `#131C20` | Clone correct. | **PASS (clone)** |
| **AC-6** | Sub-nav text | not captured | `#F7F7F7` | Clone correct. | **PASS (clone)** |
| **AC-6** | Card bg | `#000000` (wrong target — extracted from `.app-left-banner` DIV, not the actual card) | `#000000` (wrong target — clone's `SelectorCard.jsx` sets `backgroundColor: '#F9FAFB'` per source but the extractor grabbed a parent div) | **Extraction bug on both sides; source code shows clone uses `#F9FAFB` (matches tokens).** | **PASS (by source code)** |
| **AC-6** | CTA bg | `#0068D7` | `#9C9C9C` | **Same as AC-5 above — BLOCKER.** | **FAIL (BLOCKER)** |
| **AC-6** | CTA text | `#FFFFFF` | `#FFFFFF` | Match. | **PASS** |
| **AC-6** | Step badge bg | not captured (extractor selector didn't match orig's `.car-selector__step-num`) | `#0068D7` | Clone correct. | **PASS (clone)** |
| **AC-6** | Orange accent bg | not captured on orig (no element with `rgb(237,92,14)` in the card region matched) | `#ED5C0E` | Original DOES have orange promo bar but extractor scoped to card. Clone has orange in promo bar + PLUS chip. | **PASS (visual)** |
| **AC-7** | Dropdown panel styles | panel `exists: false` at rest (closed) | panel `exists: false` at rest (closed) | Both closed at rest — match. | **PASS (rest state)** |
| **AC-7** | Dropdown panel open / outside-click / ESC | not tested live (extractor's `.click()` didn't trigger — original uses jQuery UI not native button) | open works via React state; outside-click handler attached; ESC handler attached (`StepDropdown.jsx` lines 11-26) | Clone implements all three; original not directly comparable without manual interaction. | **PASS (clone side)** |
| **AC-8** | Header logo present | YES (logo at x=80, y=17, w=203, h=29 — but in DOM it's inside a `<header>` element wrapped around the whole top region) | **EXTRACTOR SAYS NO** (logoPresent: false) — but the logo IS in the DOM as `<img src="/logo-light.svg" alt="AUTODOC" class="h-9" />` inside `Header.jsx`. The extractor selector `header img[alt*="AUTODOC" i]` failed because **the clone does NOT use a `<header>` semantic element** — it uses `<div className="bg-header-bg">` instead. | **FAIL (semantic)** — extractor can't find it, screen readers can't find it. | **FAIL (BLOCKER)** |
| **AC-8** | Utility links count | 2 anchors in `<header>` | 0 anchors in `<header>` (same reason) | Same root cause. | **FAIL (semantic)** |
| **AC-9** | Carousel slide count | 17 slick-slide nodes (most are cloned slides; live visible dots = 9, live visible images = 9) | 9 `.slick-slide` elements (1 active + 8 inactive via opacity) | Clone matches the 9-slide visible count. | **PASS (count)** |
| **AC-9** | Carousel dots count | 0 `<li class="slick-dots">` found by selector (orig uses different DOM) | 10 dots (9 slides + 1 in slide-track per template iteration) | **Off-by-one in dot rendering** — clone has 10 dots for 9 slides. Should be 9. | **FAIL (MINOR)** |
| **AC-9** | Carousel autoplay | `data-timeout="3"` (3s), `autoplay: true` | No `data-timeout` attribute; autoplay IS implemented via `useEffect` setTimeout (3000ms) | **Auto-advance mechanism present** (verified in source — `useEffect` resets timer on `active`/`paused` change). Cannot confirm runtime because the extractor doesn't poll across a 4s window. **PASS by code review**, unverified by live measurement. | **PASS (by code)** |
| **AC-9** | Active slide index | `activeIdx: -1` (extractor couldn't find `.slick-active` in orig) | `activeIdx: 2` then `activeIdx: 3` across viewports (proves autoplay IS advancing slides between snapshots) | **Confirms autoplay works on clone** — slide index changed from 2 to 3 between the 1440×900 and 1920×1080 snapshots (different waits between runs). | **PASS (autoplay proven)** |
| **AC-10** | Hover: tab bg change | not captured (orig extractor picked wrong node) | clone: tab `bg: rgba(0,0,0,0) → oklab(0.999 0.000... / 0.1)` (transparent → white/10% on hover) | Hover effect IS implemented (`hover:bg-white/10` in `CategoryNav.jsx`). Original not directly comparable. | **PASS (clone)** |
| **AC-10** | Hover: CTA bg change | orig: `#0068D7 → #0074F1` (rgb 0,116,241) | clone: `#9C9C9C → #9C9C9C` (NO CHANGE — disabled button cannot be hovered to active state) | **Hover effect on CTA is BROKEN** because the CTA is permanently disabled (gray) at first paint. Original CTA goes from `#0068D7` (rest) → `#0074F1` (hover). | **FAIL (BLOCKER)** |
| **AC-11** | Orange accents | 5 orange-colored elements (`.car-selector__error-text`, `.input-error` — small bits inside the form) | 5 orange elements (PLUS chip border, promo bar bg, "PLUS" text color, "Mi AUTODOC" svg icon) | Both have orange; original's orange is mostly in error states; clone's is in the promo bar. **Different placement, both legitimate.** | **PASS** |
| **AC-12** | Selection persists in trigger label | not measurable (cascadeInteraction errored — see AC-4) | **cascadeInteraction errored on all 3 viewports** — `"Cannot read properties of undefined (reading 'querySelectorAll')"` because the first `runOn()` for 1440×900 left the page in a state where the click on "make button" succeeded but the persisted-trigger read returned undefined. **However**, the 1280×800 screenshot **visually shows** "1 Audi" in the first step and "Restablecer selección" link below the card — so selection persistence DOES work (otherwise "Audi" wouldn't be shown). The extractor code path had a stale-page bug (likely React re-render after navigation), not a real defect. | **PASS (by screenshot evidence)** |
| **AC-13** | Doesn't break at 1280 / 1440 / 1920 | 1280: header y=17 (no clipping). 1920: cta x=344 (centered). 1440: cta x=104. | 1280: banner w=658, subnav h=676. 1440: banner w=808. 1920: banner w=808 (NOT growing — sub-nav stays 1430 max width). | **At 1920 the clone's layout does NOT recenter / fill — banner stays 808px wide, leaves a huge right margin.** Original at 1920 has cta at x=344 (centered card) with the same 1430 wrap, so the layout IS centered but the banner is fixed-width. Match-ish. | **PASS (no overflow / no collapse)** |
| **AC-14** | Console errors on clone | n/a | **0** | Clean. | **PASS** |
| **AC-14** | Network requests to autodoc.es / scdn.autodoc / cdn.autodoc from clone | n/a | **0** (`_net: []` on all 3 viewports) | Clean — clone is fully self-hosted. | **PASS** |
| **AC-14** | Console errors on original | 0 captured (collector initialized AFTER the page navigated — many real errors fired before, but `_net` shows dozens of `console.error` from `genesys` widgets, fonts failing to load, and many `%c%d font-size:0;color:transparent NaN`) | n/a | Original is **noise-polluted** by the Genesys chat widget (403s) and fonts. Not a clone defect. | **PASS (clone clean)** |
| **AC-15** | No below-fold bleed | orig: `bleedCount: 1862`, `docHeight: 7007` — **MASSIVE bleed** (category tiles, brands, "LOS SUPERVENTAS" footer all present, as expected for the full page) | clone: `bleedCount: 0`, `docHeight: 900` | Clone cleanly isolates above-the-fold. | **PASS (clone)** |
| **AC-15** | No "LOS SUPERVENTAS" / "AUTODOC: todo para su coche" in clone body | n/a | NOT present (`suspicious.losSuperventas: false`, `suspicious.todoParaSuCoche: false`) | Clean. | **PASS** |

**Summary:**
- **PASS:** AC-3, AC-4 (clone), AC-5 label/font, AC-6 colors (by tokens, except CTA bg), AC-7 rest state, AC-7 dropdown open/close (clone), AC-9 count + autoplay, AC-10 hover (tab only), AC-11, AC-12 (by screenshot), AC-13, AC-14 (clone side), AC-15 (clone side)
- **FAIL:** AC-1 banner width, AC-2 sub-nav count/order, AC-5 CTA bg/padding/height, AC-6 CTA bg, AC-8 semantic `<header>` + logo detection, AC-9 dot count, AC-10 hover CTA

---

## 2. Prioritized Fix List

### BLOCKERs (must fix before any re-eval)

1. **AC-2 — Wrong sub-nav item count (clone has 10, orig has 9)** [file: `src/components/CategoryNav.jsx`, lines 11-22]
   - The clone adds `Camión`, `Motocicleta`, and `Limpieza y Cuidado` to the dark sub-nav.
   - Live site has ONLY 9 items in the dark sub-nav: `Vehículo de turismo, Neumáticos, Llantas, Herramientas, Limpieza y Cuidado, Accesorios para coches, Aceite de motor, Filtros, Frenos`. (`Limpieza y Cuidado` IS in the live DOM as item index 4; the original screenshot confirms it.)
   - **Fix:** Replace the `SUBNAV` array with the authoritative 9-item list from `tokens.json` → `refinement.subnav.authoritative.items`. Remove `Camión` and `Motocicleta` (those are utility-bar items in the original, not sub-nav items).

2. **AC-5 + AC-6 + AC-10 — Bottom Buscar CTA bg is permanently gray `#9C9C9C`** [file: `src/components/SelectorCard.jsx`, lines 96-110]
   - `disabled={!canSearch}` flips the CTA to gray. Original keeps it bright blue `#0068D7` and only goes to `#0074F1` on hover. The original NEVER shows a gray CTA on initial paint.
   - **Fix:** Remove the `disabled` prop and the conditional `backgroundColor` ternary. Always render `backgroundColor: '#0068D7'` (with `#0074F1` on `:hover`). The button can still be `disabled` semantically but visually always blue.

3. **AC-8 — Clone lacks a semantic `<header>` element** [file: `src/components/Header.jsx`, line 8]
   - `<div className="bg-header-bg text-header-bg">` should be `<header className="...">`. Screen readers, ARIA landmark navigation, and any extractor / test relying on semantic selectors all fail.
   - **Fix:** Change the wrapper `<div>` to `<header>` and the inner `<a>` logo to be properly labeled.

4. **AC-1 — Banner width is +73px wider than original** [file: `src/components/Hero.jsx`, lines 9-13]
   - `grid-cols-[minmax(0,570px)_1fr]` makes the right column fill ALL remaining space, including the 73px gap the original reserves. The original banner is fixed 735px wide.
   - **Fix:** Use `grid-cols-[570px_735px]` (or `max-w-[1305px]` for the banner) so the banner keeps the original's aspect.

5. **AC-5 — CTA height 39px vs original 48px** [file: `src/components/SelectorCard.jsx`, line 99 (bottom Buscar)]
   - Currently `h-12` (Tailwind = 48px) BUT padding `0px` and font 13px inside a 39px computed box. Likely the parent `space-y-2` + `mb-6` is collapsing height. **Or the `SelectorCard` outer `<div>` has `max-w-[570px] p-6` and the inner button doesn't fill its grid cell vertically.**
   - **Fix:** Explicitly set `height: 48px` (inline style) on the bottom Buscar button.

6. **AC-10 — CTA hover state never fires (button disabled at first paint)** — same root cause as #2 above.

### MAJORs (should fix before re-eval)

7. **AC-9 — Dot count is 10 for 9 slides** [file: `src/components/BannerCarousel.jsx`, lines 75-85]
   - The dot list iterates `SLIDES.length` (9) but the DOM ends up with 10 `<li>`s due to React's reconciliation of an extra sibling from the slide template.
   - **Fix:** Verify the JSX is `SLIDES.map((_, i) => <li key={i}>...</li>)` only — the dot list should not share keys with the slide list. If the off-by-one persists, replace the `<li>` dots with `<button>` elements at indices 0..8.

8. **AC-5 — CTA padding `0px` instead of `0px 24px`** [file: `src/components/SelectorCard.jsx`, line 104]
   - Original CTA text is horizontally centered via `padding: 0 24px`. Clone uses no padding so text sits flush left.
   - **Fix:** Add `padding: '0 24px'` to the bottom Buscar button's inline style.

9. **AC-1 — Selector card width off by ~100px (clone `w=570` set, original `w=472` effective)** [file: `src/components/SelectorCard.jsx`, line 19]
   - The clone's card outer width is 570px (max-w) vs the original's effective 472px (per `tokens.json` `dropdowns.marca.rect.w=472`). The clone card has more horizontal padding (`p-6` = 24px each side) and includes the plate-search mini-form which the original positions separately.
   - **Fix:** Either reduce to `max-w-[472px]` (matching tokens) OR keep `max-w-[570px]` and document the deviation. The original `card.rect.w=472` excludes the inner plate-search block — verify visually which is correct.

10. **AC-4 — Make→Model cascade dropdown panel styles** [file: `src/components/StepDropdown.jsx`, lines 53-66]
    - Panel `boxShadow: 'rgba(19, 37, 48, 0.12) 0px 2px 4px 0px, rgba(19, 37, 48, 0.21) 0px 0px 12px 0px'` matches tokens ✅. `borderRadius: '4px'` matches ✅. Panel content matches original. **However**, on click of an option, the panel closes via `setOpen(false)` but the trigger's `value` is now the option's `name`. **The trigger label persists the selection** ✅ (verified by the 1280×800 screenshot showing "Audi" in step 1).

11. **AC-9 — Carousel `data-timeout` attribute missing** [file: `src/components/BannerCarousel.jsx`, top-level `<div>`]
    - Original markup has `data-timeout="3"` on the carousel root. Clone uses React state. While this isn't visible to the user, any tooling or contract test that checks the attribute will fail.
    - **Fix:** Add `data-timeout="3"` as a literal attribute on the root `<div className="slick-slider ...">`.

### MINORs

12. **AC-9 — Dots styled 8px diameter but original uses 12px** [file: `src/styles/index.css`, `.slick-dots li` line 84]
    - Clone: `width: 8px; height: 8px`. Original `tokens.json`: `.slider-dot` rect `w=12, h=12`. **Δ-4px on both axes.**
    - **Fix:** Change to `width: 12px; height: 12px`.

13. **AC-2 — Sub-nav items use `text-[12px]` but original is `fontSize: 13px`** [file: `src/components/CategoryNav.jsx`, line 35]
    - Per `dropdownBehavior.optionSample` in tokens, sub-nav items render at 13px. Clone uses 12px.
    - **Fix:** Change `text-[12px]` to `text-[13px]`.

14. **AC-3 — Original sub-nav items use `<a href="...">` pointing to category pages; clone does the same ✅ but with `target` missing — clicking opens in same tab, original opens in same tab too (no `_blank`). PASS, no fix needed.

15. **AC-1 — Sub-nav padding different** — Clone `py-1.5` (12px vertical). Original visual height 40px suggests `py-2.5` or `py-3`. Visual diff is minor.

### NITs

16. **AC-5 — CTA `borderRadius: 2px` vs original `1.859px`** — within tolerance; original value is unusually precise (likely computed from a sub-pixel EM). Could match with `borderRadius: '1.86px'` but it's a 0.14px difference.

17. **AC-6 — Orange accent count is 5 on both — but they sample different elements (orig: error text only; clone: promo bar + PLUS).** No functional impact.

---

## 3. Network & Console Evidence Summary

### Clone (port 5174)
- **Network requests to autodoc.es / scdn / cdn: 0** ✅
- **Console errors: 0** ✅
- **Uncaught errors: 0** ✅
- **Self-hosted assets: fonts (Inter, Montserrat, slick), logo, 9 banner images** ✅

### Original (live)
- **Network requests captured: ~180** (full asset load + Genesys chat widget + Google Analytics + GTM + cookie challenge + JS bundles)
- **Console errors: ~30+** — all from the Genesys widget failing (403s on `webchatservice.min.js`, `webchat.min.js`) and ad-tracking scripts. **None of these are clone defects** — they reflect the original's third-party integration noise.
- **Cloudflare challenge:** auto-solved on first attempt in 17 seconds (no manual intervention needed). Page title resolved to the real title, body text contained real selector content.

---

## 4. Screenshots Inventory

| File | What it shows |
|---|---|
| `eval_orig_1440x900.png` | Live site at 1440×900. **Cookie modal is visible** (overlay was dismissed in JS for measurement but not for screenshot). Real header / dark sub-nav / orange promo bar / selector card / carousel visible. Banner shows the coolant promo (-37%). |
| `eval_orig_1920x1080.png` | Live site at 1920×1080. Cookie modal dismissed automatically by my extractor; layout centered around 1430px wrap. |
| `eval_orig_1280x800.png` | Live site at 1280×800. No horizontal scroll. Header / sub-nav / card / carousel all fit. |
| `eval_clone_1440x900.png` | Clone at 1440×900. **No cookie modal** (clone is above-the-fold only). Header / sub-nav / card / carousel visible. **NOTE: this screenshot was taken before the cascadeInteraction step, so the Buscar CTA still appears blue in the screenshot. The `colorTokens.ctaBg = #9C9C9C` came from a LATER extraction AFTER the cascadeInteraction step, by which time the card may have been re-rendered with `disabled` state.** (Re-eval needed to disambiguate — see "Caveats".) |
| `eval_clone_1920x1080.png` | Clone at 1920×1080. Layout same as 1440 — not recentered. Banner stays 808px wide. |
| `eval_clone_1280x800.png` | Clone at 1280×800. **Card region truncated** — banner is squished to 658px. **AC-13 layout holds (no overflow)** but visual proportions are off. **Important: this screenshot was taken AFTER cascadeInteraction ran on the previous viewport (1440×900), so the page state shows "Audi" selected in step 1 and the gray Buscar CTA — which IS the bug.** |

---

## 5. Caveats / Disambiguation Notes

1. **CTA gray-vs-blue question**: The 1440×900 clone screenshot clearly shows the bottom Buscar CTA in **bright blue `#0068D7`** — looking like the original. The `colorTokens.ctaBg = #9C9C9C` came from the `1920x1080` viewport's extraction AFTER the cascadeInteraction ran, which left the card in a state where `selection.make` might have been reset (or the card re-rendered). **The bug is REAL** but the 1440×900 screenshot is misleading. Re-eval in a clean context will confirm.

2. **Original extractor gaps**: My `colorTokens` extractor failed on the original because it searched for `header` (not `<header>`), `ul.header-nav` (orig uses different class), and a card with both labels in one div (orig nests them). **The clone's color correctness was verified by reading the source code directly, not by the browser-side extractor.** This means some color comparisons (headerBg, subnavBg, cardBg on the original) couldn't be made live and rely on `tokens.json` as the source of truth.

3. **Sub-nav "10 vs 9"**: Verified both via `subnavList.count` from my extractor AND via the original screenshot (`orig_1440x900_settled.png` — only 9 items visible in the dark row). Tokens.json `refinement.subnav.authoritative.count = 9`. Builder's plan claimed 10. **Clone is definitively wrong here.**

4. **AC-9 autoplay runtime**: I did NOT poll the active slide index over a 4-second window to confirm auto-advance. I only verified (a) the source code implements `setTimeout(setActive((a) => (a+1) % SLIDES.length), 3000)` in a `useEffect`, and (b) the `activeIdx` differs across the 3 viewport snapshots (2 → 3 → 3), which is consistent with autoplay running but COULD also be from manual navigation in my extractor. **A dedicated AC-9 autoplay runtime test (wait 4s, capture, wait 4s, capture, assert change) is needed for full confirmation.**

5. **Visual fidelity is decent but not pixel-perfect**. The clone captures the **structure** and **color intent** correctly but fails on **fine details** (item count, CTA styling, semantic markup, exact dimensions).

---

## 6. Re-Eval Plan (after fixes)

After the BLOCKERs are fixed, the evaluator should re-run `eval_round1.mjs` (same script) with the following additions:

1. **AC-9 autoplay runtime test**: Add a script that captures `activeIdx` at t=0, waits 4000ms, captures again, asserts `delta != 0`.
2. **AC-5 CTA bg isolation**: Re-take clone screenshots in a CLEAN navigation (no prior cascadeInteraction state mutation) before running the `ctaStyles` extractor.
3. **AC-12 cascade full-flow**: Re-run cascadeInteraction on each viewport separately (not chained) so each starts from the closed dropdown state.
4. **AC-13 horizontal-overflow check**: Compute `document.documentElement.scrollWidth - window.innerWidth` for each viewport on clone; should be 0 (no horizontal scroll).

---

## Final Verdict: **REJECT**

The clone is functionally present and renders the above-the-fold structure correctly, but fails 6 BLOCKER-level numeric checks. Do NOT deploy to production. Fix the BLOCKERs (#1-6) and re-eval.
