const test = require("node:test");
const assert = require("node:assert/strict");
const { mortgageStatementData } = require("./statement-data.js");
const {
  buildMortgageDecisionModel,
  buildStatementDashboardModel
} = require("./dashboard-model.js");

test("buildStatementDashboardModel exposes approved chart series semantics", () => {
  const model = buildStatementDashboardModel(mortgageStatementData);

  assert.deepEqual(
    model.strategic.chart.series.map((series) => ({ label: series.label, key: series.key, state: series.state })),
    [
      { label: "Interest", key: "interest", state: "missing" },
      { label: "Taxes", key: "taxEscrow", state: "available" },
      { label: "Insurance", key: "insuranceEscrow", state: "available" }
    ]
  );

  assert.equal(model.strategic.chart.points.length, 12);
  assert.equal(model.strategic.chart.points[0].statementDate, "2025-02-21");
  assert.equal(model.strategic.chart.points[11].statementDate, "2026-01-23");
  assert.equal(model.strategic.chart.points[11].taxEscrow, 71091.26);
  assert.equal(model.strategic.chart.points[11].insuranceEscrow, 209799.45);
  assert.equal(model.strategic.chart.points[11].otherEscrow, 1032.27);
  assert.equal(model.strategic.chart.points[11].interest, undefined);
});

test("buildStatementDashboardModel surfaces the approved overview and card contract", () => {
  const model = buildStatementDashboardModel(mortgageStatementData);
  const overview = Object.fromEntries(model.strategic.loanOverview.map((item) => [item.label, item]));

  assert.equal(overview["Outstanding balance"].state, "available");
  assert.equal(overview["Interest amount"].state, "missing");
  assert.equal(overview["Tax escrow"].state, "available");
  assert.equal(overview["Insurance escrow"].state, "available");
  assert.equal(overview["Other escrow"].state, "available");
  assert.equal(overview["Statement date"].state, "available");
  assert.equal(overview["Due date"].state, "missing");
  assert.equal(overview["Monthly total due"].state, "available");
  assert.equal(overview["Loan amount"].state, "missing");

  assert.equal(model.strategic.servicerCard.state, "missing");
  assert.equal(model.strategic.keyContactsCard.state, "missing");
  assert.equal(model.strategic.servicerCard.fields.find((field) => field.key === "name").state, "missing");
  assert.equal(model.strategic.keyContactsCard.fields.length, 5);
  assert.equal(model.operational.tableRows.length, 23);
  assert.equal(model.operational.tableRows[0].statementDate, "2026-01-23");
  assert.equal(model.operational.selectedStatement.statementDate, "2026-01-23");
  assert.equal(model.operational.sidebar.latestSource, "2026-02- February Statement.pdf");
});

test("buildStatementDashboardModel keeps other escrow distinct from ending escrow", () => {
  const model = buildStatementDashboardModel(mortgageStatementData);

  assert.equal(model.strategic.loanOverview.find((item) => item.label === "Other escrow").value, "$1,032.27");
  assert.equal(model.operational.tableRows[0].otherEscrow, 1032.27);
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

test("buildStatementDashboardModel exposes approved component-based latest insight", () => {
  const model = buildStatementDashboardModel(mortgageStatementData);

  assert.match(model.strategic.latestInsight.primary, /insurance escrow/i);
  assert.equal(model.strategic.latestInsight.secondary, "16 fields remain unavailable in statements.");
});

test("buildMortgageDecisionModel returns a browser-safe compatibility shell", () => {
  const model = buildMortgageDecisionModel(mortgageStatementData);

  assert.equal(model.header.status, "statement-only");
  assert.equal(model.decisionBox.recommendation, "Statement dashboard compatibility bridge");
  assert.equal(Array.isArray(model.overview.kpis), true);
  assert.equal(Array.isArray(model.trends.coverage.series), true);
  assert.equal(Array.isArray(model.alerts), true);
  assert.equal(Array.isArray(model.drivers.refiOptions), true);
  assert.equal(model.drivers.refiOptions.length, 0);
  assert.equal(Array.isArray(model.priorities), true);
});
