# Autodoc Visual Integration & Analytical Dashboard Architecture 101

> **TL;DR:** Meticulous design constraints ensuring the new dynamic evaluation view slots seamlessly into the existing `autodoc.es` visual design tokens. 
> **Core Objective:** Build a clean, responsive layout injection directly below the vehicle search component that visualizes financial metrics and reliability radar charts using approved UI toolsets without style regression.

---

## 1. Preservation of Autodoc Design Tokens

The new analytical elements must look native to the Autodoc brand. The Builder agent must explicitly reference and apply these visual styles when generating layout containers.

### Approved Color Palette
```css
:root {
  --autodoc-dark-bg: #22252a;       /* Main header container background */
  --autodoc-card-bg: #1b1d22;       /* Inset selector backgrounds */
  --autodoc-brand-yellow: #ffd800;  /* Primary CTA and accent highlights */
  --autodoc-brand-orange: #ff8a00;  /* Interactive hover transitions */
  --autodoc-text-main: #ffffff;     /* Dominant readability color */
  --autodoc-text-muted: #94a3b8;    /* Explanatory captions / units */
  --autodoc-border-gray: #334155;   /* Component dividing lines */
}
```

### Interactive & State Mechanics
* **Dropdown Alignment:** Dropdowns generated to switch metrics must match Autodoc's custom styling: border-radius of `4px`, clear down-arrow vector assets, and an active state outline utilizing `--autodoc-brand-yellow`.
* **Hover States:** Any actionable interactive card or tab injected into the evaluation zone must use smooth transitions (`transition: all 0.2s ease-in-out`) shifting from dark gray borders to high-contrast orange tokens.

---

## 2. Component Mutation & Injection Strategy

The application layout must not break or trigger complete page refreshes when a user hits the "Search" or "Evaluate Cost" trigger action.

### Mutation Lifecycle Sequence
1.  **Initial Load:** The cloned vehicle selector header sits prominently above the fold. The calculation dashboard area below is hidden or sits in a sleek, neutral "Waiting for Selection" state.
2.  **Trigger Event:** The user selects a valid Make/Model/Engine combination and clicks the primary action button.
3.  **State Transformation:** The application container intercepts the event, triggers the local logical execution pipeline, and smoothly scales open (`animate-presence` or height transitions) the analytical dashboard directly beneath the main form block.

---

## 3. Analytical Charts & Data Visualization Layout

To maintain high desktop and mobile compliance without blowing up the package bundle sizes, the agent is restricted to using **Chart.js** or **ApexCharts** sourced via a secure local installation or official CDN.

### Element 1: The Lifetime Cost Matrix (Line/Bar Chart)
* **Visual Layout:** A grouped chart mapping costs over a 5-year x-axis progression.
* **Data Splits:** Stacked bars or dual lines cleanly distinguishing **Fuel Cost Projections** from **Maintenance Projections**.
* **Styling:** Chart backgrounds must be completely transparent. Line paths or bar fills must utilize the brand colors (`--autodoc-brand-yellow` for fuel, `--autodoc-brand-orange` for maintenance).

### Element 2: The Reliability Radar Matrix
* **Visual Layout:** A clean geometric radar graph demonstrating the vehicle attributes parsed from the UCI dataset (`safety`, `maint`, `lug_boot`, `comfort`).
* **Styling:** Fill opacity set to `0.2` using the primary brand accent color, with grid lines utilizing the muted gray token (`--autodoc-border-gray`) to prevent high-contrast background noise from obscuring chart data.

---

## 4. Adversarial Evaluator Snippets (Visual Verification Codes)

The **Evaluator Worker** will run autonomous evaluation scripts directly on the generated application to ensure pixel-perfect fidelity and absolute compliance with layout constraints.

### Test Script: Layout Proportionality & Color Token Verification
```javascript
(() => {
  const checkResults = { passed: true, anomalies: [] };
  
  // Verify dashboard container exists and is positioned below the search matrix
  const selectorBox = document.querySelector('.search-form, .selector-wrapper, #car-selection-container');
  const dashboardBox = document.querySelector('#evaluation-dashboard-root');
  
  if (!selectorBox || !dashboardBox) {
    checkResults.passed = false;
    checkResults.anomalies.push("Missing core layout components.");
    return JSON.stringify(checkResults);
  }
  
  const selectorRect = selectorBox.getBoundingClientRect();
  const dashboardRect = dashboardBox.getBoundingClientRect();
  
  if (dashboardRect.top < selectorRect.bottom) {
    checkResults.passed = false;
    checkResults.anomalies.push("Dashboard overlapping or rendering above the selector block.");
  }
  
  // Verify color integrity of injected component texts
  const computedDashboardStyle = window.getComputedStyle(dashboardBox);
  const bgHex = computedDashboardStyle.backgroundColor;
  
  // Ensure background elements don't drop to raw white or unstyled system colors
  if (bgHex === 'rgb(255, 255, 255)' || bgHex === 'rgba(0, 0, 0, 0)') {
    checkResults.passed = false;
    checkResults.anomalies.push("Injected dashboard is missing explicit brand dark background tokens.");
  }

  return JSON.stringify(checkResults, null, 2);
})();
```