const api = window.statementDashboardModel;
const source = window.mortgageStatementData;
const model = api.buildStatementDashboardModel(source);

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMoney(value) {
  return money.format(value);
}

function formatStateLabel(state) {
  if (state === "available") {
    return "Available";
  }

  if (state === "partial") {
    return "Partial";
  }

  return "Gap in statements";
}

function buildOperationalHref(statementDate) {
  return `operational_view.html?statementDate=${encodeURIComponent(statementDate)}`;
}

function renderHeader() {
  const latestPoint = model.strategic.chart.points[model.strategic.chart.points.length - 1];
  const property = source.asset || {};

  document.getElementById("property-name").textContent = property.name || "Mortgage statement dashboard";
  document.getElementById("property-subtitle").textContent = `${property.location || "Location unavailable"} | Statement-only view`;
  document.getElementById("statement-window").textContent = `${model.strategic.chart.points.length} statements`;
  document.getElementById("latest-cycle").textContent = latestPoint
    ? api.formatStatementDate(latestPoint.statementDate)
    : "No statements available";
  document.getElementById("detail-cta").href = model.strategic.cta.href;
  document.getElementById("detail-cta").textContent = model.strategic.cta.label;
}

function renderLegend() {
  const legend = document.getElementById("chart-legend");

  legend.innerHTML = model.strategic.chart.series.map((series) => {
    const toneClass = series.state === "missing" ? "gap" : `series-${series.key}`;

    return `
      <span class="chart-legend-item ${toneClass}">
        <span class="chart-legend-swatch ${series.state === "missing" ? "missing" : series.key}"></span>
        <span>${escapeHtml(series.label)}</span>
        <span class="chart-legend-state">${formatStateLabel(series.state)}</span>
      </span>
    `;
  }).join("");
}

function buildChartPath(points, key, xFor, yFor) {
  let started = false;

  return points.reduce((path, point, index) => {
    const value = point[key];

    if (value === null || value === undefined || Number.isNaN(value)) {
      return path;
    }

    const command = started ? "L" : "M";
    started = true;
    return `${path}${path ? " " : ""}${command} ${xFor(index).toFixed(2)} ${yFor(value).toFixed(2)}`;
  }, "");
}

function renderChart() {
  const container = document.getElementById("strategic-chart");
  const timeline = document.getElementById("statement-timeline");
  const points = model.strategic.chart.points;
  const series = model.strategic.chart.series.filter((item) => item.state === "available");

  if (points.length === 0 || series.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <strong>No statement data available</strong>
        <p>There are no statement-backed metrics to plot yet.</p>
      </div>
    `;
    timeline.innerHTML = "";
    return;
  }

  const width = 920;
  const height = 320;
  const padding = { top: 24, right: 20, bottom: 40, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const xFor = (index) => padding.left + (chartWidth * index) / Math.max(points.length - 1, 1);

  const values = series.flatMap((item) => points
    .map((point) => point[item.key])
    .filter((value) => typeof value === "number" && Number.isFinite(value)));
  const maxValue = Math.max(...values, 1);
  const minValue = 0;
  const range = Math.max(maxValue - minValue, 1);
  const yFor = (value) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  const gridLines = Array.from({ length: 4 }, (_, index) => {
    const y = padding.top + (chartHeight / 3) * index;
    return `<line class="chart-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
  }).join("");

  const seriesMarkup = series.map((item) => {
    const path = buildChartPath(points, item.key, xFor, yFor);
    return `
      <path class="chart-path ${item.key}" d="${path}"></path>
      ${points.map((point, index) => {
        const value = point[item.key];
        if (value === null || value === undefined || Number.isNaN(value)) {
          return "";
        }
        return `
          <circle class="chart-point ${item.key}" cx="${xFor(index)}" cy="${yFor(value)}" r="4.5"></circle>
        `;
      }).join("")}
    `;
  }).join("");

  const pointLabels = points.map((point, index) => `
    <a class="timeline-point ${index === points.length - 1 ? "is-active" : ""}" href="${buildOperationalHref(point.statementDate)}">
      <span class="timeline-month">${escapeHtml(point.label)}</span>
      <span class="timeline-date">${escapeHtml(api.formatStatementDate(point.statementDate))}</span>
    </a>
  `).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="Monthly statement component chart">
      ${gridLines}
      ${seriesMarkup}
      ${points.map((point, index) => `
        <text class="chart-label" x="${xFor(index)}" y="${height - 14}" text-anchor="middle">${escapeHtml(point.label)}</text>
      `).join("")}
    </svg>
  `;

  timeline.innerHTML = pointLabels;
}

function renderOverview() {
  const grid = document.getElementById("loan-overview-grid");

  grid.innerHTML = model.strategic.loanOverview.map((item) => `
    <article class="overview-card ${item.state === "missing" ? "is-missing" : ""}">
      <span class="overview-label">${escapeHtml(item.label)}</span>
      <strong class="overview-value">${escapeHtml(item.value)}</strong>
    </article>
  `).join("");
}

function renderFieldList(elementId, section) {
  const container = document.getElementById(elementId);
  const note =
    section.state === "missing"
      ? "These fields are not present in the available statements."
      : section.state === "partial"
        ? "Only some of these fields appear in the available statements."
        : "These fields are available in the current statements.";

  container.innerHTML = section.fields.map((field) => `
    <article class="field-row ${field.state === "missing" ? "is-missing" : ""}">
      <div>
        <span class="field-label">${escapeHtml(field.label)}</span>
        <strong class="field-value">${escapeHtml(field.value)}</strong>
      </div>
      <span class="field-state">${formatStateLabel(field.state)}</span>
    </article>
  `).join("") + `<p class="card-note">${note}</p>`;
}

function renderSideCards() {
  const servicer = model.strategic.servicerCard;
  const contacts = model.strategic.keyContactsCard;

  document.getElementById("servicer-state").textContent = formatStateLabel(servicer.state);
  document.getElementById("servicer-state").className = `risk-chip ${servicer.state === "available" ? "risk-opportunity" : "risk-watchlist"}`;

  document.getElementById("contacts-state").textContent = formatStateLabel(contacts.state);
  document.getElementById("contacts-state").className = `risk-chip ${contacts.state === "available" ? "risk-opportunity" : "risk-watchlist"}`;

  renderFieldList("servicer-card", servicer);
  renderFieldList("contacts-card", contacts);
}

function renderInsights() {
  document.getElementById("insight-primary").textContent = model.strategic.latestInsight.primary;
  document.getElementById("insight-secondary").textContent = model.strategic.latestInsight.secondary;
}

renderHeader();
renderLegend();
renderChart();
renderOverview();
renderSideCards();
renderInsights();
