# Phase 2 — Frontend source (selector + dashboard + Chart.js)


### `index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AUTODOC España — Evaluación de Costes de Vehículos</title>
  <link rel="icon" type="image/svg+xml" href="/assets/logo-light.svg">
  <link rel="stylesheet" href="/static/styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" integrity="sha384-e6nUZLBkQ86NJ6TVVKAeSaK8jWa3NhkYWZFomE39AvDbQWeie9PlQqM3pmYW5d1g" crossorigin="anonymous"></script>
</head>
<body>

  <!-- ═══════════════════ SELECTOR (top) ═══════════════════ -->
  <section id="car-selection-container">
    <div class="header-bar">
      <img src="/assets/logo-light.svg" alt="AUTODOC" class="logo">
      <span class="tagline">Tienda online de recambios coche</span>
    </div>

    <div class="selector-form">
      <h2>Evaluación de Costes — 5 Años</h2>
      <div class="form-row">
        <div class="form-group">
          <label for="select-make">Marca</label>
          <select id="select-make">
            <option value="">Seleccionar marca...</option>
          </select>
        </div>
        <div class="form-group">
          <label for="select-model">Modelo</label>
          <select id="select-model" disabled>
            <option value="">Seleccionar modelo...</option>
          </select>
        </div>
        <div class="form-group">
          <label for="select-engine">Motor</label>
          <select id="select-engine" disabled>
            <option value="">Seleccionar motor...</option>
          </select>
        </div>
      </div>
      <button class="btn-evaluate" id="btn-evaluate" disabled>Buscar</button>
    </div>
  </section>

  <!-- ═══════════════════ DASHBOARD (below selector) ═══════════════════ -->
  <div id="aria-live-region" aria-live="polite" aria-atomic="true" class="sr-only"></div>

  <section id="evaluation-dashboard-root" class="collapsed">
    <div class="dashboard-placeholder" id="dashboard-placeholder">
      Esperando selección de vehículo...
    </div>
    <div id="dashboard-content" style="display:none;">
      <h3 class="dashboard-title" id="dashboard-title"></h3>
      <div class="scores-row">
        <div class="score-card">
          <div class="label">Coste Total 5 Años</div>
          <div class="value highlight" id="val-total-cost">—</div>
        </div>
        <div class="score-card">
          <div class="label">Seguridad</div>
          <div class="value" id="val-safety">—</div>
        </div>
        <div class="score-card">
          <div class="label">Confort</div>
          <div class="value" id="val-comfort">—</div>
        </div>
        <div class="score-card">
          <div class="label">Vibe Score</div>
          <div class="value highlight" id="val-vibe">—</div>
        </div>
      </div>
      <div class="charts-row">
        <div class="chart-container">
          <h3>Costes Acumulados — 5 Años</h3>
          <canvas id="chart-cost"></canvas>
        </div>
        <div class="chart-container">
          <h3>Radar de Fiabilidad</h3>
          <canvas id="chart-radar"></canvas>
        </div>
      </div>
    </div>
  </section>

  <script src="/static/app.js"></script>
</body>
</html>

```


### `app.js`

```javascript
/**
 * Vibe-Auto-Cost — Frontend Application
 * Handles selector cascading, API fetch, and Chart.js rendering.
 */

// --- DOM References ---
const selectMake = document.getElementById('select-make');
const selectModel = document.getElementById('select-model');
const selectEngine = document.getElementById('select-engine');
const btnEvaluate = document.getElementById('btn-evaluate');
const dashboardRoot = document.getElementById('evaluation-dashboard-root');
const dashboardPlaceholder = document.getElementById('dashboard-placeholder');
const dashboardContent = document.getElementById('dashboard-content');

let costChart = null;
let radarChart = null;

// --- Debounce utility ---
function debounce(fn, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// --- Loading indicator helpers ---
function showLoading(selectEl) {
  selectEl.dataset.origHtml = selectEl.innerHTML;
  selectEl.innerHTML = '<option value="">Cargando…</option>';
  selectEl.disabled = true;
  selectEl.classList.add('loading');
}
function hideLoading(selectEl) {
  selectEl.classList.remove('loading');
}

// --- Initialization ---
async function init() {
  try {
    const res = await fetch('/api/brands');
    const data = await res.json();
    data.brands.forEach(brand => {
      const opt = document.createElement('option');
      opt.value = brand;
      opt.textContent = brand;
      selectMake.appendChild(opt);
    });
  } catch (e) {
    console.error('Failed to load brands:', e);
  }
}

// --- Cascading Selectors ---
selectMake.addEventListener('change', debounce(async () => {
  const brand = selectMake.value;
  selectModel.innerHTML = '<option value="">Seleccionar modelo...</option>';
  selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
  selectModel.disabled = true;
  selectEngine.disabled = true;
  btnEvaluate.disabled = true;

  if (!brand) return;

  showLoading(selectModel);
  try {
    const res = await fetch(`/api/models?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();
    selectModel.innerHTML = '<option value="">Seleccionar modelo...</option>';
    data.models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      selectModel.appendChild(opt);
    });
    selectModel.disabled = false;
  } catch (e) {
    console.error('Failed to load models:', e);
    selectModel.innerHTML = '<option value="">Seleccionar modelo...</option>';
  } finally {
    hideLoading(selectModel);
  }
}, 250));

selectModel.addEventListener('change', debounce(async () => {
  const brand = selectMake.value;
  const model = selectModel.value;
  selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
  selectEngine.disabled = true;
  btnEvaluate.disabled = true;

  if (!model) return;

  showLoading(selectEngine);
  try {
    const res = await fetch(`/api/engines?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
    const data = await res.json();
    selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
    data.engines.forEach(eng => {
      const opt = document.createElement('option');
      opt.value = eng;
      opt.textContent = eng;
      selectEngine.appendChild(opt);
    });
    selectEngine.disabled = false;
  } catch (e) {
    console.error('Failed to load engines:', e);
    selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
  } finally {
    hideLoading(selectEngine);
  }
}, 250));

selectEngine.addEventListener('change', () => {
  btnEvaluate.disabled = !selectEngine.value;
});

// --- Evaluate ---
btnEvaluate.addEventListener('click', async () => {
  const make = selectMake.value;
  const model = selectModel.value;
  const engine = selectEngine.value;

  if (!make) return;

  btnEvaluate.disabled = true;
  btnEvaluate.textContent = 'Calculando...';

  // Announce loading state to screen readers
  const ariaRegion = document.getElementById('aria-live-region');
  if (ariaRegion) ariaRegion.textContent = 'Calculando costes del vehículo...';

  try {
    const url = `/api/evaluate?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&engine=${encodeURIComponent(engine)}`;
    const res = await fetch(url);

    if (!res.ok) {
      const err = await res.json();
      alert(`Error: ${err.detail || 'Unknown error'}`);
      return;
    }

    const data = await res.json();
    renderDashboard(data);
    // Announce results to screen readers
    if (ariaRegion) ariaRegion.textContent = `Evaluación completada para ${data.metadata.requested_make} ${data.metadata.requested_model}. Coste total 5 años: €${Math.round(data.financial_projections.total_5_year_cost).toLocaleString()}. Vibe Score: ${data.reliability_scores.overall_vibe_score} de 100.`;
  } catch (e) {
    console.error('Evaluation failed:', e);
    alert('Error de conexión con el servidor.');
  } finally {
    btnEvaluate.disabled = false;
    btnEvaluate.textContent = 'Buscar';
  }
});

// --- Render Dashboard ---
function renderDashboard(data) {
  // Show dashboard
  dashboardPlaceholder.style.display = 'none';
  dashboardContent.style.display = 'block';
  dashboardRoot.classList.remove('collapsed');
  dashboardRoot.classList.add('expanded');

  // Title
  document.getElementById('dashboard-title').textContent =
    `${data.metadata.requested_make} ${data.metadata.requested_model}`;

  // Score cards
  document.getElementById('val-total-cost').textContent =
    `€${data.financial_projections.total_5_year_cost.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`;
  document.getElementById('val-safety').textContent = data.reliability_scores.safety_rating;
  document.getElementById('val-comfort').textContent = data.reliability_scores.comfort_rating;
  document.getElementById('val-vibe').textContent = `${data.reliability_scores.overall_vibe_score}/100`;

  // Render charts
  renderCostChart(data);
  renderRadarChart(data);
}

// --- Chart 1: 5-Year Cumulative Cost (Stacked Bar) ---
function renderCostChart(data) {
  const ctx = document.getElementById('chart-cost').getContext('2d');

  if (costChart) costChart.destroy();

  const labels = data.yearly_breakdown.map(y => `Año ${y.year}`);
  const fuelData = data.yearly_breakdown.map(y => y.cumulative_fuel);
  const maintData = data.yearly_breakdown.map(y => y.cumulative_maintenance);

  costChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Combustible',
          data: fuelData,
          backgroundColor: '#ffd800',
          borderColor: '#ffd800',
          borderWidth: 0,
        },
        {
          label: 'Mantenimiento',
          data: maintData,
          backgroundColor: '#ff8a00',
          borderColor: '#ff8a00',
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 11 } },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: '#94a3b8' },
          grid: { color: '#334155' },
        },
        y: {
          stacked: true,
          ticks: {
            color: '#94a3b8',
            callback: (v) => `€${v.toLocaleString()}`,
          },
          grid: { color: '#334155' },
        },
      },
    },
  });
}

// --- Chart 2: Reliability Radar ---
function renderRadarChart(data) {
  const ctx = document.getElementById('chart-radar').getContext('2d');

  if (radarChart) radarChart.destroy();

  const rd = data.radar_data;

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Seguridad', 'Mantenimiento', 'Maletero', 'Confort'],
      datasets: [
        {
          label: data.metadata.requested_make,
          data: [rd.safety, rd.maintenance, rd.boot_capacity, rd.comfort],
          backgroundColor: 'rgba(255, 216, 0, 0.2)',
          borderColor: '#ffd800',
          borderWidth: 2,
          pointBackgroundColor: '#ffd800',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 11 } },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { color: '#94a3b8', backdropColor: 'transparent' },
          grid: { color: '#334155' },
          angleLines: { color: '#334155' },
          pointLabels: { color: '#ffffff', font: { size: 12 } },
        },
      },
    },
  });
}

// --- Boot ---
init();

```


### `styles.css`

```css
/* Vibe-Auto-Cost — Dark Dashboard Tokens (visual_architecture §1) */
:root {
  --autodoc-dark-bg: #22252a;
  --autodoc-card-bg: #1b1d22;
  --autodoc-brand-yellow: #ffd800;
  --autodoc-brand-orange: #ff8a00;
  --autodoc-text-main: #ffffff;
  --autodoc-text-muted: #94a3b8;
  --autodoc-border-gray: #334155;
}

@font-face {
  font-family: 'Inter';
  src: url('/assets/fonts/Inter-VariableFont_opsz_wght.ttf') format('truetype');
  font-weight: 100 900;
}
@font-face {
  font-family: 'Montserrat';
  src: url('/assets/fonts/Montserrat-VariableFont_wght.ttf') format('truetype');
  font-weight: 100 900;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background-color: var(--autodoc-dark-bg);
  color: var(--autodoc-text-main);
  min-height: 100vh;
}

/* --- Selector Section (top) --- */
#car-selection-container {
  background-color: var(--autodoc-dark-bg);
  padding: 0;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 32px;
  border-bottom: 1px solid var(--autodoc-border-gray);
}

.header-bar img.logo {
  height: 32px;
}

.header-bar .tagline {
  color: var(--autodoc-text-muted);
  font-size: 14px;
}

.selector-form {
  max-width: 900px;
  margin: 40px auto;
  padding: 32px;
  background-color: var(--autodoc-card-bg);
  border-radius: 12px;
  border: 1px solid var(--autodoc-border-gray);
}

.selector-form h2 {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 22px;
  margin-bottom: 24px;
  color: var(--autodoc-brand-yellow);
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  min-width: 180px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: var(--autodoc-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group select {
  width: 100%;
  padding: 10px 14px;
  background-color: var(--autodoc-dark-bg);
  color: var(--autodoc-text-main);
  border: 1px solid var(--autodoc-border-gray);
  border-radius: 4px;
  font-size: 14px;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.form-group select:focus {
  outline: 2px solid var(--autodoc-brand-yellow);
  outline-offset: -1px;
  border-color: var(--autodoc-brand-yellow);
}

.form-group select:hover {
  border-color: var(--autodoc-brand-orange);
}

.btn-evaluate {
  display: block;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  padding: 14px 32px;
  background-color: var(--autodoc-brand-yellow);
  color: #1b1d22;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-evaluate:hover {
  background-color: var(--autodoc-brand-orange);
  color: #ffffff;
}

.btn-evaluate:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Dashboard Section (below selector) --- */
#evaluation-dashboard-root {
  background-color: var(--autodoc-card-bg);
  max-width: 900px;
  margin: 0 auto 40px;
  padding: 32px;
  border-radius: 12px;
  border: 1px solid var(--autodoc-border-gray);
  overflow: hidden;
  transition: max-height 0.5s ease-in-out, opacity 0.4s ease-in-out;
}

#evaluation-dashboard-root.collapsed {
  max-height: 80px;
  opacity: 0.7;
}

#evaluation-dashboard-root.expanded {
  max-height: 2000px;
  opacity: 1;
}

.dashboard-placeholder {
  text-align: center;
  padding: 20px;
  color: var(--autodoc-text-muted);
  font-size: 15px;
}

.dashboard-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: var(--autodoc-brand-yellow);
  margin-bottom: 16px;
}

.scores-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.score-card {
  flex: 1;
  min-width: 140px;
  background-color: var(--autodoc-dark-bg);
  border: 1px solid var(--autodoc-border-gray);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.2s ease-in-out;
}

.score-card:hover {
  border-color: var(--autodoc-brand-orange);
}

.score-card .label {
  font-size: 11px;
  color: var(--autodoc-text-muted);
  text-transform: uppercase;
  margin-bottom: 6px;
}

.score-card .value {
  font-size: 20px;
  font-weight: 700;
  color: var(--autodoc-text-main);
}

.score-card .value.highlight {
  color: var(--autodoc-brand-yellow);
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;
}

.chart-container {
  background-color: var(--autodoc-dark-bg);
  border: 1px solid var(--autodoc-border-gray);
  border-radius: 8px;
  padding: 16px;
}

.chart-container h3 {
  font-size: 13px;
  color: var(--autodoc-text-muted);
  text-transform: uppercase;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
}

.chart-container canvas {
  width: 100% !important;
  max-height: 280px;
}

/* --- Accessibility --- */
/* :focus-visible outlines on interactive elements */
button:focus-visible,
select:focus-visible,
.btn-evaluate:focus-visible {
  outline: 3px solid var(--autodoc-brand-yellow);
  outline-offset: 2px;
}

/* Screen-reader only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Loading spinner for dropdowns */
select.loading {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='7' fill='none' stroke='%23ffd800' stroke-width='2' stroke-dasharray='22' stroke-linecap='round'%3E%3CanimateTransform attributeName='transform' type='rotate' from='0 10 10' to='360 10 10' dur='0.8s' repeatCount='indefinite'/%3E%3C/circle%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px 18px;
}

/* Responsive */
@media (max-width: 768px) {
  .charts-row { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .selector-form, #evaluation-dashboard-root { margin: 20px 16px; padding: 20px; }
}

```

