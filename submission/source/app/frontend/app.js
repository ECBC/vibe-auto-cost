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
selectMake.addEventListener('change', async () => {
  const brand = selectMake.value;
  selectModel.innerHTML = '<option value="">Seleccionar modelo...</option>';
  selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
  selectModel.disabled = true;
  selectEngine.disabled = true;
  btnEvaluate.disabled = true;

  if (!brand) return;

  try {
    const res = await fetch(`/api/models?brand=${encodeURIComponent(brand)}`);
    const data = await res.json();
    data.models.forEach(model => {
      const opt = document.createElement('option');
      opt.value = model;
      opt.textContent = model;
      selectModel.appendChild(opt);
    });
    selectModel.disabled = false;
  } catch (e) {
    console.error('Failed to load models:', e);
  }
});

selectModel.addEventListener('change', async () => {
  const brand = selectMake.value;
  const model = selectModel.value;
  selectEngine.innerHTML = '<option value="">Seleccionar motor...</option>';
  selectEngine.disabled = true;
  btnEvaluate.disabled = true;

  if (!model) return;

  try {
    const res = await fetch(`/api/engines?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
    const data = await res.json();
    data.engines.forEach(eng => {
      const opt = document.createElement('option');
      opt.value = eng;
      opt.textContent = eng;
      selectEngine.appendChild(opt);
    });
    selectEngine.disabled = false;
  } catch (e) {
    console.error('Failed to load engines:', e);
  }
});

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
