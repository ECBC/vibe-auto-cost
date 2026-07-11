# 2026-07 Contract

## Project: autodoc-hero-clone

### Workers
- builder: minimax-MiniMax-M3 (browser-use)
- evaluator: minimax-MiniMax-M3 (browser-use)

---

## Task: Clone autodoc.es above-the-fold vehicle search selector

### User Goal (verbatim)
> Clone the main above-the-fold header section of https://www.autodoc.es/, specifically isolating the complete interactive vehicle search selector component (the multi-tab interface for selecting Passenger Cars, Trucks, Motorcycles, etc., by make, model, and engine). Save the full component inside './autodoc-clone'. It must be functionally and visually identical down to the pixel level, replicating all layout structures, dynamic dropdown behaviors, fonts, exact color tokens, hover states, animations, and any embedded media or layout effects.

### Scope
- **IN:** Above-the-fold header section ONLY — site header/nav (with logo, top utility links/cart) + the interactive vehicle search selector hero (tabs + make/model/engine dropdowns + search button + decorative background/media).
- **OUT:** Below-the-fold sections (promo strip, category tiles, footer, newsletter, app banners). Do NOT clone.

### Deliverables
- `./autodoc-clone/` — full project (Vite + React + Tailwind)
- `npm run dev` must serve a working selector
- `npm run build` must succeed
- Extracted design tokens sheet at `clone-web/team-log/tokens.md`
- Builder plan: `clone-web/team-log/builder_plan.md`
- Evaluator plan: `clone-web/team-log/test_plan.md`
- Final contract: `clone-web/team-log/contract.md`
- Each eval round: `clone-web/team-log/eval_round_N.md`

### Acceptance criteria (Builder MUST hit, Evaluator MUST verify)
1. Selector renders at viewport 1440×900 (and 1920×1080 to verify centering) with pixel parity vs autodoc.es on first paint (after settle).
2. All category tabs are present in the correct order (e.g. Passenger Cars, Trucks, Motorcycles, …) and the active tab is visually distinguished with the same color/state.
3. Tabs are keyboard-/click-switchable; switching tabs re-renders the active panel.
4. Each active panel exposes the exact dropdowns the original does: at minimum **Make / Model / Engine** for the Passenger Cars tab (or whichever the original shows). When a Make is selected, the Model dropdown is populated; when Model is selected, Engine dropdown is populated (stubs/placeholders for missing data are acceptable as long as the UX flow matches).
5. Search submit button label, icon, and styling match the original.
6. Colors, font-family, font-size, font-weight, letter-spacing, line-height, border-radius, paddings, gaps for every selector element are extracted from the live site (via `javascript_tool` + `getComputedStyle`) — NOT eyeballed.
7. Dropdown panels open on click and close on outside-click / ESC, matching the original behavior. The open dropdown's `box-shadow`, `border-radius`, and option hover state must match.
8. Header/nav above the selector is present with logo + top utility links/cart at correct positions.
9. Background media under the selector (image/video/gradient) is reproduced; if a heavy WebGL/video asset exists, capture as a self-hosted `.mp4`/`.webm` or screenshot fallback.
10. Hover states on tabs, dropdowns, options, and CTA buttons implemented and observable in the screenshot.
11. Decorative separator / accent elements (orange or other brand accents) match the original tokens.
12. Selection within one tab persists visually (e.g. the chosen Make/Model shows in the chip area).
13. Responsive: doesn't break at 1280px and 1440px desktop width (mobile is OUT of scope unless trivially required).
14. Console clean, fonts load without FOUT, no external requests leak to autodoc.es.
15. The component is **isolatable** — opening `./autodoc-clone/` and the dev/preview URL must show ONLY the above-the-fold header + selector (not the full landing page sections).

### Validation commands
- `cd ./autodoc-clone && npm install && npm run build` → must exit 0
- `cd ./autodoc-clone && npm run dev` → must serve on a port; evaluator opens it and the live site at `https://www.autodoc.es/` and compares screenshots.
- No new files outside `./autodoc-clone/` and `clone-web/team-log/`.

### Rules
- Two browser-use workers (minimax-MiniMax-M3 each), separate sessions, adversarial roles.
- Builder does NOT self-evaluate. After compile/render success it reports files; Evaluator runs `eval_round_1.md`.
- Use `javascript_tool` for surgical CSS extraction (follow sniper script patterns in `clone_landing_page_101.md`).
- Trust the live site as source of truth. If tokens disagree with eyeballed estimates, the live DOM wins.

### Status
- DONE 2026-07-10 — eval_round_2 verdict ACCEPT (all 6 BLOCKERs fixed at numeric level). Clone builds clean (npm run build exit 0), isolated above-the-fold, 0 console errors, 0 autodoc.es requests. Builder + evaluator workers stopped.

### Environment note (resolved)
- AdaL `--agent-mode browser-use` has no bundled Playwright in this container, so the broken `navigate`/`computer`/`javascript_tool` tools are unavailable. Supervisor installed Playwright + Chromium + system deps locally. Workers drive a real headless Chromium via `node` + Playwright scripts (run through `bash`) with `NODE_PATH=/app/node_modules`. Verified: real Chromium clears the autodoc.es Cloudflare challenge (title correct, `justAMoment=false`, live selector DOM reachable). This satisfies the guide's browser-use intent (screenshots, getComputedStyle extraction, side-by-side compare) via scripted Playwright.

### Build refinements (required, from fidelity words)
- AC-9/animation: the Slick banner carousel must AUTO-ADVANCE (autoplay) with functional dots + prev/next arrows — not a static image. "animations... and any embedded media or layout effects" are in scope.
- AC-6: no "assumed" tokens. Selector-card border color, step-number badge bg/text, and any other guessed values must be extracted from the live DOM via getComputedStyle before coding.
- AC-2: re-extract the full dark sub-nav item list + order from the live DOM after full JS settle (the "Limpieza y Cuidado" item was missing from the first DOM dump). Tab order must match the live site exactly.

