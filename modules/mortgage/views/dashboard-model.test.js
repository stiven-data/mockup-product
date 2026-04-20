const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildMortgageDecisionModel,
  buildStatementDashboardModel
} = require("./dashboard-model.js");

const fixture = {
  asset: {
    name: "Oasis at San Marco",
    location: "Jacksonville, FL"
  },
  currentDebt: {
    servicer: "CBRE Loan Services, Inc.",
    interestRate: 0.085,
    latestDueDate: "2026-02-09"
  },
  statements: [
    {
      statementDate: "2025-09-24",
      principalBalance: 10853176.39,
      taxEscrow: 167300.93,
      insuranceEscrow: 137213.29,
      otherEscrow: 388471.33,
      totalDue: 110711.67,
      sourceFile: "2025-09 - September Statement.pdf"
    },
    {
      statementDate: "2025-07-24",
      principalBalance: 10853176.39,
      taxEscrow: 135924.01,
      insuranceEscrow: 100920.21,
      otherEscrow: 399851.86,
      totalDue: 113545.32,
      sourceFile: "2025-07- July Statement.pdf"
    },
    {
      statementDate: "2025-08-25",
      principalBalance: 10853176.39,
      taxEscrow: 151612.47,
      insuranceEscrow: 119066.75,
      otherEscrow: 393901.86,
      totalDue: 113274.22,
      sourceFile: "2025-08-August Statement.pdf"
    },
    {
      statementDate: "2025-12-23",
      principalBalance: 10853176.39,
      taxEscrow: 55402.8,
      insuranceEscrow: 191652.91,
      otherEscrow: 248087.47,
      totalDue: 113274.22,
      sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf"
    },
    {
      statementDate: "2026-01-23",
      principalBalance: 10853176.39,
      taxEscrow: 71091.26,
      insuranceEscrow: 209799.45,
      otherEscrow: 281922.98,
      totalDue: 112158.22,
      sourceFile: "2026-02- February Statement.pdf"
    }
  ]
};

test("buildStatementDashboardModel exposes approved chart series semantics", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.deepEqual(
    model.strategic.chart.series.map((series) => ({ label: series.label, key: series.key, state: series.state })),
    [
      { label: "Interest", key: "interest", state: "missing" },
      { label: "Taxes", key: "taxEscrow", state: "available" },
      { label: "Insurance", key: "insuranceEscrow", state: "available" }
    ]
  );

  assert.equal(model.strategic.chart.points[0].taxEscrow, 135924.01);
  assert.equal(model.strategic.chart.points[0].insuranceEscrow, 100920.21);
  assert.equal(model.strategic.chart.points[0].otherEscrow, 399851.86);
  assert.equal(model.strategic.chart.points[0].interest, undefined);
});

test("buildStatementDashboardModel surfaces supported overview and detail fields", () => {
  const model = buildStatementDashboardModel(fixture);
  const overview = Object.fromEntries(model.strategic.loanOverview.map((item) => [item.label, item]));
  const detail = Object.fromEntries(model.operational.detailRows.map((item) => [item.label, item]));

  assert.equal(overview["Outstanding balance"].state, "available");
  assert.equal(overview["Interest amount"].state, "missing");
  assert.equal(overview["Tax escrow"].state, "available");
  assert.equal(overview["Insurance escrow"].state, "available");
  assert.equal(overview["Other escrow"].state, "available");
  assert.equal(overview["Statement date"].state, "available");
  assert.equal(overview["Due date"].state, "available");
  assert.equal(overview["Monthly total due"].state, "available");
  assert.equal(overview["Loan amount"].state, "missing");

  assert.equal(detail["Statement date"].value, "2026-01-23");
  assert.equal(detail["Due date"].state, "available");
  assert.equal(detail["Monthly total due"].state, "available");
  assert.equal(detail["Tax escrow"].state, "available");
  assert.equal(detail["Insurance escrow"].state, "available");
  assert.equal(detail["Other escrow"].state, "available");
});

test("buildStatementDashboardModel keeps other escrow distinct from ending escrow", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.equal(model.strategic.loanOverview.find((item) => item.label === "Other escrow").value, "$281,922.98");
  assert.equal(model.operational.tableRows[0].otherEscrow, 281922.98);
  assert.equal(model.operational.tableRows[0].endingEscrowBalance, undefined);
});

test("buildStatementDashboardModel handles empty statements safely", () => {
  const model = buildStatementDashboardModel({ statements: [] });

  assert.equal(model.strategic.chart.points.length, 0);
  assert.equal(model.strategic.chart.series[0].state, "missing");
  assert.equal(model.operational.tableRows.length, 0);
  assert.equal(model.operational.selectedStatement, null);
  assert.equal(model.operational.sidebar.latestSource, null);
  assert.equal(model.strategic.loanOverview.find((item) => item.label === "Statement date").state, "missing");
});

test("buildStatementDashboardModel uses the latest sorted statement for sidebar source", () => {
  const model = buildStatementDashboardModel(fixture, { selectedStatementDate: "2025-08-25" });

  assert.equal(model.operational.tableRows[0].statementDate, "2026-01-23");
  assert.equal(model.operational.sidebar.latestSource, "2026-02- February Statement.pdf");
  assert.equal(model.operational.selectedStatement.statementDate, "2025-08-25");
  assert.equal(model.navigation.operationalHref, "operational_view.html?statementDate=2025-08-25");
});

test("buildStatementDashboardModel exposes approved component-based latest insight", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.match(model.strategic.latestInsight.primary, /escrow/i);
  assert.equal(model.strategic.latestInsight.secondary, "14 fields remain unavailable in statements.");
});

test("buildMortgageDecisionModel returns a browser-safe compatibility shell", () => {
  const model = buildMortgageDecisionModel(fixture);

  assert.equal(model.header.status, "statement-only");
  assert.equal(model.decisionBox.recommendation, "Statement dashboard compatibility bridge");
  assert.equal(Array.isArray(model.overview.kpis), true);
  assert.equal(Array.isArray(model.trends.coverage.series), true);
  assert.equal(Array.isArray(model.alerts), true);
  assert.equal(Array.isArray(model.drivers.refiOptions), true);
  assert.equal(model.drivers.refiOptions.length, 0);
  assert.equal(Array.isArray(model.priorities), true);
});
