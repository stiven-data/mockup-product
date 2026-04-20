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
    interestRate: 0.085,
    latestDueDate: "2026-02-09",
    servicer: "CBRE Loan Services, Inc."
  },
  statements: [
    { statementDate: "2025-09-24", principalBalance: 10853176.39, totalDue: 110711.67, endingEscrowBalance: 388471.33, sourceFile: "2025-09 - September Statement.pdf" },
    { statementDate: "2025-07-24", principalBalance: 10853176.39, totalDue: 113545.32, endingEscrowBalance: 399851.86, sourceFile: "2025-07- July Statement.pdf" },
    { statementDate: "2025-08-25", principalBalance: 10853176.39, totalDue: 113274.22, endingEscrowBalance: 393901.86, sourceFile: "2025-08-August Statement.pdf" },
    { statementDate: "2025-12-23", principalBalance: 10853176.39, totalDue: 113274.22, endingEscrowBalance: 248087.47, sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf" },
    { statementDate: "2026-01-23", principalBalance: 10853176.39, totalDue: 112158.22, endingEscrowBalance: 281922.98, sourceFile: "2026-02- February Statement.pdf" }
  ]
};

test("buildStatementDashboardModel returns available-or-missing statement coverage", () => {
  const model = buildStatementDashboardModel(fixture);
  const loanOverview = Object.fromEntries(model.strategic.loanOverview.map((item) => [item.label, item]));

  assert.equal(model.strategic.chart.series.length, 3);
  assert.equal(model.strategic.chart.points.length, 5);
  assert.equal(model.strategic.chart.points[0].label, "Jul 25");
  assert.equal(model.strategic.chart.points[4].label, "Jan 26");
  assert.equal(model.strategic.chart.points[4].totalDue, 112158.22);

  assert.equal(loanOverview["Statement date"].state, "available");
  assert.equal(loanOverview["Statement date"].value, "2026-01-23");
  assert.equal(loanOverview["Due date"].state, "available");
  assert.equal(loanOverview["Monthly total due"].state, "available");
  assert.equal(loanOverview["Other escrow"].state, "available");
  assert.equal(loanOverview["Interest rate"].state, "available");
  assert.equal(loanOverview["Loan amount"].state, "missing");

  assert.equal(model.strategic.servicer.fields.find((field) => field.key === "name").state, "available");
  assert.equal(model.strategic.servicer.fields.find((field) => field.key === "role").state, "missing");
  assert.equal(model.strategic.servicer.fields.find((field) => field.key === "email").state, "missing");
  assert.equal(model.strategic.servicer.fields.find((field) => field.key === "phone").state, "missing");
  assert.equal(model.strategic.servicer.fields.find((field) => field.key === "contact").state, "missing");
  assert.equal(model.strategic.keyContacts.fields.every((field) => field.state === "missing"), true);
});

test("buildStatementDashboardModel handles empty statements safely", () => {
  const model = buildStatementDashboardModel({ statements: [] });

  assert.equal(model.strategic.chart.points.length, 0);
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
