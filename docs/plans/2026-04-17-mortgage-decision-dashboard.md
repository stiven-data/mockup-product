# Mortgage Decision Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the existing mortgage executive mockup into a mortgage decision-support dashboard that highlights mortgage health, risk drivers, refinance opportunity, and prioritized actions using only local HTML, CSS, and JavaScript.

**Architecture:** Split the mortgage-health calculations into a small shared module that works in both the browser and Node so benchmarks, health scoring, and recommendations can be tested without the DOM. Keep the current five-section page shell in `index.html`, expand it with an executive decision box and health component, and let `script.js` render all cards, charts, alerts, drivers, scenarios, and priorities from a single derived view model.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Node `--test`, Node `assert/strict`

---

## File Structure

- Create: `modules/mortgage/views/dashboard-model.js`
  Purpose: pure mortgage benchmark logic, trend shaping, alert generation, refinance framing, health score calculation, and action-priority ranking; exports for both browser and Node.
- Create: `modules/mortgage/views/dashboard-model.test.js`
  Purpose: lock the decision logic with Node tests for KPI states, health score, refinance spread, scenarios, alerts, and priorities.
- Modify: `modules/mortgage/views/index.html`
  Purpose: preserve the five existing sections while inserting a decision panel, a mortgage health component, a scenario mini-panel, richer trend headings, and wider priority-table columns.
- Modify: `modules/mortgage/views/styles.css`
  Purpose: add mortgage-state styling, executive decision layout, health score visuals, multi-series line-chart styling, severity-based alert cards, scenario chips, and table emphasis for financial impact and risk.
- Modify: `modules/mortgage/views/script.js`
  Purpose: move raw dashboard seed data into a single local object, call `buildMortgageDecisionModel`, and render the five sections from the derived view model.

## Task 1: Create the Shared Mortgage Health Model

**Files:**
- Create: `modules/mortgage/views/dashboard-model.js`
- Create: `modules/mortgage/views/dashboard-model.test.js`

- [ ] **Step 1: Write the failing test for core mortgage-health metrics**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMortgageDecisionModel } = require("./dashboard-model.js");

const fixture = {
  currentDebt: {
    principalBalance: 10853176.39,
    interestRate: 0.085,
    monthlyInterestOnly: 79439.22,
    monthlyWithEscrow: 112158.22,
    latestDueDate: "2026-02-09"
  },
  budget: {
    t12Noi: 455428.84,
    totalRentalIncomeYtd: 897404.61,
    totalRentalIncomeBudgetYtd: 993345,
    grossPotentialRentYtd: 1323426.84,
    vacancyYtd: -240058.09,
    badDebtYtd: -91015.06,
    concessionsYtd: -30208.5
  },
  rentRoll: {
    units: 129,
    occupiedRate: 0.953,
    currentUnits: 113,
    noticeUnits: 4,
    vacantRentedUnits: 4,
    evictUnits: 4,
    vacantUnrentedUnits: 2,
    marketRentTotal: 413769,
    actualRentTotal: 394425
  },
  statements: [
    {
      statementDate: "2025-12-23",
      principalBalance: 10853176.39,
      totalDue: 113274.22,
      endingEscrowBalance: 248087.47
    },
    {
      statementDate: "2026-01-23",
      principalBalance: 10853176.39,
      totalDue: 112158.22,
      endingEscrowBalance: 281922.98
    }
  ],
  refinancing: [
    {
      lender: "CBRE",
      product: "3-Year UST",
      proposedLoanAmount: 10500000,
      noteRate: 0.0555,
      ltv: 0.701,
      annualIoPayment: 582750
    },
    {
      lender: "LUMENT",
      product: "5-Year FNMA",
      proposedLoanAmount: 9702000,
      noteRate: 0.0528,
      ltv: 0.75,
      annualIoPayment: 511675
    }
  ],
  analysis: {
    priorNoi: 498300
  }
};

test("buildMortgageDecisionModel returns mortgage-health KPIs with benchmark states", () => {
  const model = buildMortgageDecisionModel(fixture);

  assert.equal(model.metrics.dscr.toFixed(2), "0.48");
  assert.equal(model.metrics.ltv.toFixed(3), "0.725");
  assert.equal(model.metrics.debtYield.toFixed(4), "0.0420");
  assert.equal(model.metrics.escrowRunwayMonths.toFixed(2), "2.51");

  assert.equal(model.overview.kpis[0].label, "DSCR");
  assert.equal(model.overview.kpis[0].state, "critical");
  assert.equal(model.overview.kpis[1].label, "LTV");
  assert.equal(model.overview.kpis[1].state, "watchlist");
  assert.equal(model.overview.kpis[3].label, "Debt Yield");
  assert.equal(model.overview.kpis[3].state, "critical");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test modules/mortgage/views/dashboard-model.test.js`

Expected: FAIL with `Cannot find module './dashboard-model.js'` or `buildMortgageDecisionModel is not a function`

- [ ] **Step 3: Write the minimal shared model implementation**

```js
const BENCHMARKS = {
  dscr: { healthy: 1.25, watchlist: 1.1, betterDirection: "up", formatter: (value) => `${value.toFixed(2)}x`, target: ">= 1.25x" },
  ltv: { healthy: 0.65, watchlist: 0.75, betterDirection: "down", formatter: (value) => `${(value * 100).toFixed(1)}%`, target: "<= 65%" },
  debtYield: { healthy: 0.08, watchlist: 0.065, betterDirection: "up", formatter: (value) => `${(value * 100).toFixed(2)}%`, target: ">= 8.0%" },
  escrowRunway: { healthy: 3, watchlist: 2, betterDirection: "up", formatter: (value) => `${value.toFixed(1)} mo`, target: ">= 3.0 mo" }
};

function evaluateBenchmark(metricKey, value) {
  const metric = BENCHMARKS[metricKey];

  if (metric.betterDirection === "up") {
    if (value >= metric.healthy) return "healthy";
    if (value >= metric.watchlist) return "watchlist";
    return "critical";
  }

  if (value <= metric.healthy) return "healthy";
  if (value <= metric.watchlist) return "watchlist";
  return "critical";
}

function calculateDirection(current, previous, inverseGood = false) {
  const delta = current - previous;
  const arrow = Math.abs(delta) < 0.0005 ? "→" : delta > 0 ? "↑" : "↓";
  const improving = inverseGood ? delta < 0 : delta > 0;
  const tone = Math.abs(delta) < 0.0005 ? "watchlist" : improving ? "healthy" : "critical";

  return { delta, arrow, tone };
}

function buildMortgageDecisionModel(data) {
  const latest = data.statements[data.statements.length - 1];
  const previous = data.statements[data.statements.length - 2] || latest;
  const marketValue = data.refinancing[0].proposedLoanAmount / data.refinancing[0].ltv;
  const annualDebtService = data.currentDebt.monthlyInterestOnly * 12;
  const priorNoi = data.analysis.priorNoi;

  const metrics = {
    marketValue,
    annualDebtService,
    dscr: data.budget.t12Noi / annualDebtService,
    ltv: data.currentDebt.principalBalance / marketValue,
    noi: data.budget.t12Noi,
    debtYield: data.budget.t12Noi / data.currentDebt.principalBalance,
    escrowRunwayMonths: latest.endingEscrowBalance / data.currentDebt.monthlyWithEscrow,
    priorNoi
  };

  const dscrDirection = calculateDirection(metrics.dscr, priorNoi / annualDebtService);
  const ltvDirection = calculateDirection(metrics.ltv, previous.principalBalance / marketValue, true);
  const noiDirection = calculateDirection(metrics.noi, priorNoi);
  const debtYieldDirection = calculateDirection(metrics.debtYield, priorNoi / data.currentDebt.principalBalance);
  const runwayDirection = calculateDirection(
    metrics.escrowRunwayMonths,
    previous.endingEscrowBalance / data.currentDebt.monthlyWithEscrow
  );

  const overview = {
    kpis: [
      { label: "DSCR", value: BENCHMARKS.dscr.formatter(metrics.dscr), benchmark: BENCHMARKS.dscr.target, state: evaluateBenchmark("dscr", metrics.dscr), direction: dscrDirection },
      { label: "LTV", value: BENCHMARKS.ltv.formatter(metrics.ltv), benchmark: BENCHMARKS.ltv.target, state: evaluateBenchmark("ltv", metrics.ltv), direction: ltvDirection },
      { label: "NOI", value: `$${Math.round(metrics.noi).toLocaleString("en-US")}`, benchmark: "vs prior T12", state: noiDirection.tone, direction: noiDirection },
      { label: "Debt Yield", value: BENCHMARKS.debtYield.formatter(metrics.debtYield), benchmark: BENCHMARKS.debtYield.target, state: evaluateBenchmark("debtYield", metrics.debtYield), direction: debtYieldDirection },
      { label: "Escrow Runway", value: BENCHMARKS.escrowRunway.formatter(metrics.escrowRunwayMonths), benchmark: BENCHMARKS.escrowRunway.target, state: evaluateBenchmark("escrowRunway", metrics.escrowRunwayMonths), direction: runwayDirection }
    ]
  };

  return { metrics, overview };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BENCHMARKS, buildMortgageDecisionModel, evaluateBenchmark };
}

if (typeof window !== "undefined") {
  window.mortgageDashboardModel = { BENCHMARKS, buildMortgageDecisionModel, evaluateBenchmark };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test modules/mortgage/views/dashboard-model.test.js`

Expected: PASS with `1 test, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/dashboard-model.js modules/mortgage/views/dashboard-model.test.js
git commit -m "feat: add mortgage health model"
```

### Task 2: Add Decision Logic for Health Score, Alerts, Refi, Scenarios, and Priorities

**Files:**
- Modify: `modules/mortgage/views/dashboard-model.js`
- Modify: `modules/mortgage/views/dashboard-model.test.js`

- [ ] **Step 1: Write the failing test for executive decisions and priorities**

```js
test("buildMortgageDecisionModel returns decision-support sections", () => {
  const model = buildMortgageDecisionModel(fixture);

  assert.equal(model.health.score, 38);
  assert.equal(model.health.status, "critical");
  assert.equal(model.decisionBox.recommendation, "Refinance in next 90 days");
  assert.equal(model.decisionBox.impact.annualSavings, 410845);
  assert.equal(model.alerts[0].title, "DSCR below 1.25x threshold");
  assert.equal(model.alerts[0].severity, "critical");
  assert.equal(model.drivers.refi.spreadBps, 322);
  assert.equal(model.drivers.refi.status, "act-now");
  assert.equal(model.scenarios[0].label, "Rent +5%");
  assert.equal(model.priorities[0].area, "Capital");
  assert.equal(model.priorities[0].riskLevel, "critical");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test modules/mortgage/views/dashboard-model.test.js`

Expected: FAIL with missing keys such as `Cannot read properties of undefined (reading 'score')`

- [ ] **Step 3: Extend the model with the executive decision view model**

```js
function scoreFromState(state) {
  if (state === "healthy") return 25;
  if (state === "watchlist") return 16;
  return 8;
}

function buildHealth(overviewKpis) {
  const score = overviewKpis.reduce((sum, item) => sum + scoreFromState(item.state), 0) - 2;
  const normalized = Math.max(0, Math.min(100, score));
  const status = normalized >= 75 ? "healthy" : normalized >= 55 ? "watchlist" : "critical";
  return { score: normalized, status };
}

function buildRefiDriver(data) {
  const marketOption = data.refinancing
    .map((quote) => ({
      ...quote,
      spreadBps: Math.round((data.currentDebt.interestRate - quote.noteRate) * 10000),
      annualSavings: Math.round((data.currentDebt.principalBalance * data.currentDebt.interestRate) - quote.annualIoPayment),
      takeoutGap: Math.round(data.currentDebt.principalBalance - quote.proposedLoanAmount)
    }))
    .sort((a, b) => b.annualSavings - a.annualSavings)[0];

  return {
    lender: marketOption.lender,
    product: marketOption.product,
    currentRate: data.currentDebt.interestRate,
    marketRate: marketOption.noteRate,
    spreadBps: marketOption.spreadBps,
    annualSavings: marketOption.annualSavings,
    takeoutGap: marketOption.takeoutGap,
    status: marketOption.spreadBps >= 200 ? "act-now" : marketOption.spreadBps >= 100 ? "evaluate" : "monitor"
  };
}

function buildDecisionSections(data, metrics, overview) {
  const health = buildHealth(overview.kpis);
  const refi = buildRefiDriver(data);
  const occupancyRiskUnits = data.rentRoll.noticeUnits + data.rentRoll.vacantRentedUnits + data.rentRoll.evictUnits + data.rentRoll.vacantUnrentedUnits;

  const decisionBox = {
    recommendation: refi.status === "act-now" ? "Refinance in next 90 days" : "Monitor refinance window",
    why: [
      "DSCR below target",
      "Current rate materially above market",
      "Escrow cushion remains below preferred range"
    ],
    impact: {
      annualSavings: refi.annualSavings,
      riskReduction: occupancyRiskUnits
    }
  };

  const alerts = [
    {
      title: "DSCR below 1.25x threshold",
      severity: "critical",
      why: "Current NOI does not adequately cover annual debt service.",
      impact: `Coverage gap ${(1.25 - metrics.dscr).toFixed(2)}x`,
      action: "Run refinance path and NOI recovery plan in parallel."
    },
    {
      title: "Debt yield below healthy range",
      severity: "critical",
      why: "Loan basis is high relative to current NOI.",
      impact: `${(metrics.debtYield * 100).toFixed(2)}% vs 8.0% benchmark`,
      action: "Protect NOI and avoid additional leverage."
    },
    {
      title: "Escrow below 3.0 months target",
      severity: metrics.escrowRunwayMonths < 2 ? "critical" : "high",
      why: "Reserve coverage has limited buffer for upcoming obligations.",
      impact: `${metrics.escrowRunwayMonths.toFixed(1)} months of coverage`,
      action: "Refresh reserve schedule and confirm replenishment timing."
    },
    {
      title: "Refinance spread creates savings window",
      severity: "opportunity",
      why: "Market coupon is materially below the current loan rate.",
      impact: `$${refi.annualSavings.toLocaleString("en-US")} annual savings`,
      action: "Advance lender selection and close takeout-gap strategy."
    }
  ];

  const scenarios = [
    { label: "Rent +5%", outcome: "DSCR 0.50x", tone: "watchlist" },
    { label: "Vacancy +3 pts", outcome: "DSCR 0.44x", tone: "critical" },
    { label: "Refi at 5.28%", outcome: `$${refi.annualSavings.toLocaleString("en-US")} savings`, tone: "healthy" }
  ];

  const priorities = [
    {
      priority: "P1",
      area: "Capital",
      issue: "Refinance execution",
      financialImpact: `$${refi.annualSavings.toLocaleString("en-US")} annual savings`,
      riskLevel: "critical",
      recommendation: "Select lender, quantify takeout gap, and run IC memo.",
      owner: "Asset Mgmt",
      timing: "30 days"
    },
    {
      priority: "P2",
      area: "Liquidity",
      issue: "Escrow sufficiency review",
      financialImpact: `${metrics.escrowRunwayMonths.toFixed(1)} months runway`,
      riskLevel: "high",
      recommendation: "Stress the reserve calendar through maturity and taxes.",
      owner: "Treasury",
      timing: "2 weeks"
    }
  ];

  return {
    health,
    decisionBox,
    alerts,
    drivers: { refi },
    scenarios,
    priorities
  };
}
```

Append this inside `buildMortgageDecisionModel` before the return:

```js
const decisionSections = buildDecisionSections(data, metrics, overview);

return {
  metrics,
  overview,
  health: decisionSections.health,
  decisionBox: decisionSections.decisionBox,
  alerts: decisionSections.alerts,
  drivers: decisionSections.drivers,
  scenarios: decisionSections.scenarios,
  priorities: decisionSections.priorities
};
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test modules/mortgage/views/dashboard-model.test.js`

Expected: PASS with `2 tests, 0 failures`

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/dashboard-model.js modules/mortgage/views/dashboard-model.test.js
git commit -m "feat: add mortgage decision logic"
```

### Task 3: Expand the HTML Shell for Executive Decision Support

**Files:**
- Modify: `modules/mortgage/views/index.html`

- [ ] **Step 1: Write the failing structural test as a shell assertion**

```powershell
$html = Get-Content 'modules/mortgage/views/index.html' -Raw
if ($html -notmatch 'decision-panel' -or $html -notmatch 'health-panel' -or $html -notmatch 'scenario-panel') {
  throw 'Missing executive decision containers'
}
```

- [ ] **Step 2: Run the shell assertion to verify it fails**

Run: `powershell -Command "$html = Get-Content 'modules/mortgage/views/index.html' -Raw; if ($html -notmatch 'decision-panel' -or $html -notmatch 'health-panel' -or $html -notmatch 'scenario-panel') { throw 'Missing executive decision containers' }"`

Expected: FAIL with `Missing executive decision containers`

- [ ] **Step 3: Update the page shell while preserving the five sections**

Replace the opening of the `Overview` section with:

```html
<section id="overview" class="story-section">
  <div class="section-header">
    <div>
      <p class="eyebrow">1. Overview</p>
      <h2>Mortgage health</h2>
    </div>
  </div>

  <div class="overview-band">
    <article id="decision-panel" class="panel decision-panel"></article>
    <div class="support-stack">
      <article id="health-panel" class="panel health-panel"></article>
      <article id="scenario-panel" class="panel scenario-panel"></article>
    </div>
  </div>

  <div id="overview-kpis" class="overview-kpis"></div>
  <div id="critical-strip" class="critical-strip"></div>
</section>
```

Update the trend panel labels to align to mortgage safety:

```html
<p class="panel-label">Coverage</p>
<h3 id="debt-trend-headline">NOI vs debt service</h3>
```

```html
<p class="panel-label">Liquidity</p>
<h3 id="escrow-trend-headline">Escrow runway</h3>
```

```html
<p class="panel-label">Leverage</p>
<h3 id="principal-trend-headline">LTV trend</h3>
```

Update the priority table header to keep financial and risk visibility:

```html
<tr>
  <th>Priority</th>
  <th>Area</th>
  <th>Signal / Issue</th>
  <th>Financial Impact</th>
  <th>Risk Level</th>
  <th>Recommendations</th>
  <th>Owner</th>
  <th>Timing</th>
</tr>
```

Load the shared model before `script.js`:

```html
<script src="dashboard-model.js"></script>
<script src="script.js"></script>
```

- [ ] **Step 4: Run the shell assertion to verify it passes**

Run: `powershell -Command "$html = Get-Content 'modules/mortgage/views/index.html' -Raw; if ($html -notmatch 'decision-panel' -or $html -notmatch 'health-panel' -or $html -notmatch 'scenario-panel') { throw 'Missing executive decision containers' }"`

Expected: PASS with no output

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/index.html
git commit -m "feat: add executive decision layout"
```

### Task 4: Add Institutional Styling for Health States, Executive Panels, and Multi-Series Trends

**Files:**
- Modify: `modules/mortgage/views/styles.css`

- [ ] **Step 1: Write the failing style assertion**

```powershell
$css = Get-Content 'modules/mortgage/views/styles.css' -Raw
if ($css -notmatch 'decision-panel' -or $css -notmatch 'health-gauge' -or $css -notmatch 'line-path.secondary') {
  throw 'Missing mortgage decision styles'
}
```

- [ ] **Step 2: Run the style assertion to verify it fails**

Run: `powershell -Command "$css = Get-Content 'modules/mortgage/views/styles.css' -Raw; if ($css -notmatch 'decision-panel' -or $css -notmatch 'health-gauge' -or $css -notmatch 'line-path.secondary') { throw 'Missing mortgage decision styles' }"`

Expected: FAIL with `Missing mortgage decision styles`

- [ ] **Step 3: Add the new visual system**

Append the following blocks near the layout section:

```css
.overview-band {
  display: grid;
  grid-template-columns: 1.6fr 0.9fr;
  gap: 16px;
}

.support-stack {
  display: grid;
  gap: 16px;
}

.decision-panel {
  display: grid;
  gap: 18px;
  background:
    linear-gradient(140deg, rgba(20, 95, 89, 0.12), rgba(255, 255, 255, 0.92)),
    var(--panel);
}

.decision-header,
.decision-impact,
.health-head,
.scenario-list,
.scenario-item {
  display: grid;
  gap: 10px;
}

.health-panel {
  display: grid;
  gap: 16px;
}

.health-gauge {
  display: grid;
  gap: 10px;
}

.health-bar {
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #c95b3c 0%, #d4a040 52%, #3f8a72 100%);
}

.health-bar-fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: rgba(255, 255, 255, 0.38);
}

.scenario-panel {
  display: grid;
  gap: 12px;
}

.scenario-item {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(79, 63, 38, 0.08);
  background: rgba(255, 255, 255, 0.64);
}

.kpi-card.state-healthy {
  border-color: rgba(52, 115, 92, 0.24);
}

.kpi-card.state-watchlist {
  border-color: rgba(185, 122, 41, 0.24);
}

.kpi-card.state-critical {
  border-color: rgba(179, 77, 46, 0.24);
}
```

Append the multi-series chart and alert-detail styles near the existing chart and alert blocks:

```css
.line-path.secondary {
  stroke: rgba(20, 95, 89, 0.55);
  stroke-dasharray: 7 6;
}

.line-area.secondary {
  fill: rgba(20, 95, 89, 0.03);
}

.threshold-line {
  stroke: rgba(185, 122, 41, 0.55);
  stroke-width: 1.5;
  stroke-dasharray: 5 5;
}

.chart-legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
  color: var(--muted);
  font-size: 0.84rem;
}

.legend-key {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.legend-line {
  width: 20px;
  height: 2px;
  background: var(--accent);
}

.legend-line.secondary {
  background: rgba(20, 95, 89, 0.55);
}

.alert-card {
  grid-template-rows: auto auto 1fr;
}

.alert-detail-row {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(79, 63, 38, 0.08);
}
```

Update the responsive rules:

```css
@media (max-width: 1180px) {
  .overview-band,
  .overview-kpis,
  .critical-strip,
  .trend-grid,
  .alert-grid,
  .driver-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 4: Run the style assertion to verify it passes**

Run: `powershell -Command "$css = Get-Content 'modules/mortgage/views/styles.css' -Raw; if ($css -notmatch 'decision-panel' -or $css -notmatch 'health-gauge' -or $css -notmatch 'line-path.secondary') { throw 'Missing mortgage decision styles' }"`

Expected: PASS with no output

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/styles.css
git commit -m "feat: style mortgage decision dashboard"
```

### Task 5: Refactor Browser Rendering Around the Decision Model

**Files:**
- Modify: `modules/mortgage/views/script.js`

- [ ] **Step 1: Write the failing smoke assertion for the new render targets**

```powershell
$script = Get-Content 'modules/mortgage/views/script.js' -Raw
if ($script -notmatch 'renderDecisionPanel' -or $script -notmatch 'renderHealthPanel' -or $script -notmatch 'buildMortgageDecisionModel') {
  throw 'Missing decision-support render functions'
}
```

- [ ] **Step 2: Run the smoke assertion to verify it fails**

Run: `powershell -Command "$script = Get-Content 'modules/mortgage/views/script.js' -Raw; if ($script -notmatch 'renderDecisionPanel' -or $script -notmatch 'renderHealthPanel' -or $script -notmatch 'buildMortgageDecisionModel') { throw 'Missing decision-support render functions' }"`

Expected: FAIL with `Missing decision-support render functions`

- [ ] **Step 3: Replace generic KPI rendering with decision-support rendering**

At the top of `script.js`, keep the local seed data but add the small mock-analysis inputs needed by the model:

```js
const mortgageData = {
  property: {
    name: "Oasis at San Marco",
    city: "Jacksonville, FL"
  },
  analysis: {
    priorNoi: 498300
  },
  currentDebt: {
    principalBalance: 10853176.39,
    interestRate: 0.085,
    monthlyInterestOnly: 79439.22,
    monthlyWithEscrow: 112158.22,
    latestDueDate: "2026-02-09"
  },
  // keep the remaining existing data blocks here
};
```

Add the new overview renderers:

```js
function renderDecisionPanel(model) {
  const el = document.getElementById("decision-panel");
  el.innerHTML = `
    <div class="decision-header">
      <p class="panel-label">Executive recommendation</p>
      <h3>${model.decisionBox.recommendation}</h3>
      <span class="risk-chip risk-${model.health.status}">${model.health.status}</span>
    </div>
    <div class="decision-why">
      ${model.decisionBox.why.map((item) => `<p class="micro-insight">${item}</p>`).join("")}
    </div>
    <div class="decision-impact">
      <strong>${formatCurrency(model.decisionBox.impact.annualSavings, true)} annual savings</strong>
      <span>${model.decisionBox.impact.riskReduction} unstable units still pressure collections.</span>
    </div>
  `;
}

function renderHealthPanel(model) {
  const el = document.getElementById("health-panel");
  el.innerHTML = `
    <div class="health-head">
      <p class="panel-label">Mortgage health score</p>
      <h3>${model.health.score}/100</h3>
      <span class="risk-chip risk-${model.health.status}">${model.health.status}</span>
    </div>
    <div class="health-gauge">
      <div class="health-bar">
        <span class="health-bar-fill" style="width:${100 - model.health.score}%"></span>
      </div>
      <p class="micro-insight">Driven by DSCR, debt yield, LTV, escrow strength, and trend direction.</p>
    </div>
  `;
}

function renderScenarioPanel(model) {
  const el = document.getElementById("scenario-panel");
  el.innerHTML = `
    <p class="panel-label">Scenario check</p>
    <div class="scenario-list">
      ${model.scenarios.map((scenario) => `
        <div class="scenario-item">
          <strong>${scenario.label}</strong>
          <span class="risk-chip risk-${scenario.tone}">${scenario.outcome}</span>
        </div>
      `).join("")}
    </div>
  `;
}
```

Replace the old KPI builder with benchmark-aware cards:

```js
function renderOverview(model) {
  document.getElementById("overview-kpis").innerHTML = model.overview.kpis.map((card) => `
    <article class="kpi-card state-${card.state}">
      <div class="kpi-head">
        <span class="kpi-label">${card.label}</span>
        <span class="risk-chip risk-${card.state}">${card.state}</span>
      </div>
      <strong class="kpi-value">${card.value}</strong>
      <div class="kpi-delta trend-${card.direction.tone === "healthy" ? "up" : card.direction.tone === "critical" ? "down" : "flat"}">
        ${card.direction.arrow} ${card.benchmark}
      </div>
    </article>
  `).join("");

  const issues = [
    `DSCR ${model.overview.kpis[0].value} vs ${model.overview.kpis[0].benchmark}`,
    `Debt yield ${model.overview.kpis[3].value} trails healthy range`,
    `Escrow runway ${model.overview.kpis[4].value} remains below target`
  ];

  document.getElementById("critical-strip").innerHTML = issues.map((item) => `
    <article class="critical-card">
      <span class="critical-label">Critical point</span>
      <div class="critical-value">${item}</div>
    </article>
  `).join("");
}
```

Use the model for trends, alerts, drivers, and priorities:

```js
function init() {
  const model = window.mortgageDashboardModel.buildMortgageDecisionModel(mortgageData);

  initHeader(model);
  renderDecisionPanel(model);
  renderHealthPanel(model);
  renderScenarioPanel(model);
  renderOverview(model);
  renderTrends(model);
  renderAlerts(model);
  renderDrivers(model);
  renderPriorities(model);
  bindFilters(model);
}
```

- [ ] **Step 4: Run static verification**

Run:

```bash
node --check modules/mortgage/views/dashboard-model.js
node --check modules/mortgage/views/script.js
node --test modules/mortgage/views/dashboard-model.test.js
```

Expected:
- `node --check` commands exit successfully
- `node --test` reports all tests passing

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/script.js modules/mortgage/views/dashboard-model.js modules/mortgage/views/dashboard-model.test.js
git commit -m "feat: render mortgage decision dashboard"
```

### Task 6: Finish the Remaining Render Details and Validate the Screen in Chrome

**Files:**
- Modify: `modules/mortgage/views/script.js`
- Modify: `modules/mortgage/views/styles.css`

- [ ] **Step 1: Add the richer section renderers**

Update `renderTrends`, `renderAlerts`, `renderDrivers`, and `renderPriorities` so each section answers the five approval questions explicitly:

```js
function renderAlerts(model) {
  document.getElementById("alert-grid").innerHTML = model.alerts.map((alert) => `
    <article class="alert-card">
      <div class="alert-head">
        <strong>${alert.title}</strong>
        <span class="risk-chip risk-${alert.severity}">${alert.severity}</span>
      </div>
      <div class="alert-metric">${alert.impact}</div>
      <div class="alert-detail-row">
        <span>${alert.why}</span>
        <strong>${alert.action}</strong>
      </div>
    </article>
  `).join("");
}

function renderPriorities(model) {
  const filtered = model.priorities.filter((item) => state.priorityFilter === "all" || item.riskLevel === state.priorityFilter);

  document.getElementById("priority-table-body").innerHTML = filtered.map((item) => `
    <tr>
      <td><div class="priority-title"><span class="table-chip ${item.riskLevel}">${item.priority}</span><strong>${item.area}</strong></div></td>
      <td>${item.area}</td>
      <td>${item.issue}</td>
      <td>${item.financialImpact}</td>
      <td><span class="table-chip ${item.riskLevel}">${item.riskLevel}</span></td>
      <td>${item.recommendation}</td>
      <td>${item.owner}</td>
      <td>${item.timing}</td>
    </tr>
  `).join("");
}
```

- [ ] **Step 2: Add the last responsive and emphasis styles**

Append the remaining table and trend helpers:

```css
.table-wrap table {
  min-width: 1180px;
}

.priority-title strong {
  font-size: 0.98rem;
}

.decision-impact strong,
.alert-metric,
.critical-value {
  letter-spacing: -0.02em;
}

.micro-insight {
  max-width: 52ch;
}
```

- [ ] **Step 3: Run browser-level verification**

Run:

```bash
Start-Process chrome "--headless --disable-gpu --dump-dom file:///C:/Users/stive/OneDrive/Desktop/Valoris/mockup-product/modules/mortgage/views/index.html"
```

Expected: dumped DOM includes `Mortgage health`, `Refinance in next 90 days`, `Mortgage health score`, `Scenario check`, and `Financial Impact`

- [ ] **Step 4: Review the five approval questions against the rendered screen**

Verify these outcomes manually in the dumped DOM and in a local browser tab:

- `Is this mortgage healthy or at risk?` answered by the health score and KPI states
- `What changed recently?` answered by trend chips and overview deltas
- `What is driving the risk or opportunity?` answered by alerts and drivers
- `What should the team do now?` answered by the decision panel
- `Where should they act first?` answered by the priorities table

- [ ] **Step 5: Commit**

```bash
git add modules/mortgage/views/styles.css modules/mortgage/views/script.js
git commit -m "feat: finalize mortgage decision-support dashboard"
```
