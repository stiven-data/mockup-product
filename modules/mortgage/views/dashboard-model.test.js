const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMortgageDecisionModel, buildStatementDashboardModel } = require("./dashboard-model.js");

const fixture = {
  asset: {
    name: "Oasis at San Marco",
    location: "Jacksonville, FL"
  },
  metadata: {
    loanAmount: null,
    loanTerm: null,
    startDate: null,
    maturityDate: null,
    dueDate: null
  },
  servicer: {
    name: null,
    role: null,
    email: null,
    phone: null,
    contact: null
  },
  keyContacts: [],
  statements: [
    { statementDate: "2024-03-09", principalBalance: 10130000, interestPaid: null, taxes: 66224.54, insurance: 57173.96, otherEscrow: 602715.14, totalDue: 101665.26, sourceFile: "CBRE March 2024 Statement.pdf / Manual" },
    { statementDate: "2024-04-01", principalBalance: 10130000, interestPaid: null, taxes: 66224.54, insurance: 57173.96, otherEscrow: 518574.22, totalDue: 101665.26, sourceFile: "CBRE April Statement 2024.pdf" },
    { statementDate: "2024-04-24", principalBalance: 10130000, interestPaid: null, taxes: 79469.45, insurance: 76231.95, otherEscrow: 518394.76, totalDue: 104057.07, sourceFile: "CBRE May Statement 2024.pdf" },
    { statementDate: "2024-05-23", principalBalance: 10130000, interestPaid: null, taxes: 92714.36, insurance: 95289.94, otherEscrow: 518675.08, totalDue: 106448.87, sourceFile: "CBRE June Statement 2024.pdf" },
    { statementDate: "2024-06-24", principalBalance: 10130000, interestPaid: null, taxes: 105959.27, insurance: 114347.93, otherEscrow: 518973.82, totalDue: 104057.07, sourceFile: "2024.06- June Statement.pdf / CBRE June Statement 2024.pdf" },
    { statementDate: "2024-07-24", principalBalance: 10130000, interestPaid: null, taxes: 119204.18, insurance: 133405.92, otherEscrow: 519258.83, totalDue: 106448.87, sourceFile: "2024.07 - July Statement.pdf / CBRE July Statement 2024.pdf" },
    { statementDate: "2024-08-23", principalBalance: 10143176.39, interestPaid: null, taxes: 132449.09, insurance: 152463.91, otherEscrow: 327076.83, totalDue: 106578.43, sourceFile: "2024.08 - August Statement.pdf / CBRE August Statement 2024.pdf" },
    { statementDate: "2024-09-24", principalBalance: 10143064.86, interestPaid: null, taxes: 145694, insurance: 171521.9, otherEscrow: 327254.13, totalDue: 104149.61, sourceFile: "2024.09 - September Statement.pdf / CBRE September Statement 2024.pdf" },
    { statementDate: "2024-10-24", principalBalance: 10143064.86, interestPaid: null, taxes: 158938.91, insurance: 190579.89, otherEscrow: 327425.8, totalDue: 106544.5, sourceFile: "2024.10 - October Statement.pdf / CBRE October Statement 2024.pdf" },
    { statementDate: "2024-11-22", principalBalance: 10143064.86, interestPaid: null, taxes: 15303.08, insurance: 209637.88, otherEscrow: 327594.97, totalDue: 104149.61, sourceFile: "2024.11 - November Statement.pdf / CBRE November Statement 2024.pdf" },
    { statementDate: "2024-12-23", principalBalance: 10143064.86, interestPaid: null, taxes: 28547.99, insurance: 228695.87, otherEscrow: 253514.48, totalDue: 32302.9, sourceFile: "2024.12 - December Statement.pdf / 2025-01- January Statement.pdf" },
    { statementDate: "2025-02-21", principalBalance: 10401402.81, interestPaid: null, taxes: 57481.71, insurance: 70144.87, otherEscrow: 209686.31, totalDue: 103758.76, sourceFile: "2025-02-February Statement.pdf" },
    { statementDate: "2025-03-24", principalBalance: 10401402.81, interestPaid: null, taxes: 73170.17, insurance: 88291.41, otherEscrow: 165403.71, totalDue: 109967.49, sourceFile: "2025-03- March Statement.pdf" },
    { statementDate: "2025-04-22", principalBalance: 10401402.81, interestPaid: null, taxes: 88858.63, insurance: 106437.95, otherEscrow: 163018.54, totalDue: 107511.6, sourceFile: "2025-04-  April Statement.pdf" },
    { statementDate: "2025-05-23", principalBalance: 10764854.41, interestPaid: null, taxes: 104547.09, insurance: 64627.13, otherEscrow: 163101.66, totalDue: 112799.38, sourceFile: "2025-05-May Statement.pdf" },
    { statementDate: "2025-06-26", principalBalance: 10764854.41, interestPaid: null, taxes: 120235.55, insurance: 82773.67, otherEscrow: 163187.54, totalDue: 110086.05, sourceFile: "2025-06-June Statement.pdf" },
    { statementDate: "2025-07-24", principalBalance: 10853176.39, interestPaid: null, taxes: 135924.01, insurance: 100920.21, otherEscrow: 163007.64, totalDue: 113545.32, sourceFile: "2025-07- July Statement.pdf" },
    { statementDate: "2025-08-25", principalBalance: 10853176.39, interestPaid: null, taxes: 151612.47, insurance: 119066.75, otherEscrow: 123222.64, totalDue: 113274.22, sourceFile: "2025-08-August Statement.pdf" },
    { statementDate: "2025-09-24", principalBalance: 10853176.39, interestPaid: null, taxes: 167300.93, insurance: 137213.29, otherEscrow: 83957.11, totalDue: 110711.67, sourceFile: "2025-09 - September Statement.pdf" },
    { statementDate: "2025-10-23", principalBalance: 10853176.39, interestPaid: null, taxes: 182989.39, insurance: 155359.83, otherEscrow: 83997.82, totalDue: 113274.22, sourceFile: "2025-10-October Statement.pdf" },
    { statementDate: "2025-11-21", principalBalance: 10853176.39, interestPaid: null, taxes: 39714.34, insurance: 173506.37, otherEscrow: 1031.27, totalDue: 110711.67, sourceFile: "2025-11- November Statement.pdf" },
    { statementDate: "2025-12-23", principalBalance: 10853176.39, interestPaid: null, taxes: 55402.8, insurance: 191652.91, otherEscrow: 1031.76, totalDue: 113274.22, sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf" },
    { statementDate: "2026-01-23", principalBalance: 10853176.39, interestPaid: null, taxes: 71091.26, insurance: 209799.45, otherEscrow: 1032.27, totalDue: 112158.22, sourceFile: "2026-02- February Statement.pdf" }
  ]
};

test("buildStatementDashboardModel exposes approved chart series semantics", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.deepEqual(
    model.strategic.chart.series.map((series) => ({ label: series.label, key: series.key, state: series.state })),
    [
      { label: "Interest", key: "interestPaid", state: "missing" },
      { label: "Taxes", key: "taxes", state: "available" },
      { label: "Insurance", key: "insurance", state: "available" }
    ]
  );

  assert.equal(model.strategic.chart.points.length, 12);
  assert.equal(model.strategic.chart.points[0].statementDate, "2025-02-21");
  assert.equal(model.strategic.chart.points[11].statementDate, "2026-01-23");
  assert.equal(model.strategic.chart.points[11].interestPaid, null);
  assert.equal(model.strategic.chart.points[11].taxes, 71091.26);
  assert.equal(model.strategic.chart.points[11].insurance, 209799.45);
  assert.equal(model.strategic.chart.points[11].otherEscrow, 1032.27);
});

test("buildStatementDashboardModel surfaces the approved overview and card contract", () => {
  const model = buildStatementDashboardModel(fixture);
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
  assert.equal(model.strategic.servicerCard.fields.length, 5);
  assert.equal(model.strategic.keyContactsCard.fields.length, 5);
  assert.equal(model.operational.tableRows.length, 23);
  assert.equal(model.operational.tableRows[0].statementDate, "2026-01-23");
  assert.equal(model.operational.selectedStatement.statementDate, "2026-01-23");
  assert.equal(model.operational.sidebar.latestSource, "2026-02- February Statement.pdf");
});

test("buildStatementDashboardModel keeps other escrow distinct from the residual component", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.equal(model.strategic.loanOverview.find((item) => item.label === "Other escrow").value, "$1,032.27");
  assert.equal(model.operational.tableRows[0].otherEscrow, 1032.27);
});

test("buildStatementDashboardModel handles empty statements safely", () => {
  const model = buildStatementDashboardModel({ metadata: {}, servicer: {}, keyContacts: [], statements: [] });

  assert.equal(model.strategic.chart.points.length, 0);
  assert.equal(model.strategic.chart.series[0].state, "missing");
  assert.equal(model.operational.tableRows.length, 0);
  assert.equal(model.operational.selectedStatement, null);
  assert.equal(model.operational.sidebar.latestSource, null);
  assert.equal(model.strategic.loanOverview.find((item) => item.label === "Statement date").state, "missing");
});

test("buildStatementDashboardModel exposes approved high level gap summary", () => {
  const model = buildStatementDashboardModel(fixture);

  assert.deepEqual(model.operational.gapSummary, [
    "Loan amount",
    "Loan term",
    "Start date",
    "Maturity date",
    "Due date",
    "Servicer",
    "Key contacts"
  ]);
  assert.equal(model.strategic.latestInsight.secondary, "7 fields remain unavailable in statements.");
});

test("buildStatementDashboardModel supports selected statement detail and navigation", () => {
  const model = buildStatementDashboardModel(fixture, { selectedStatementDate: "2025-09-24" });

  assert.equal(model.operational.selectedStatement.statementDate, "2025-09-24");
  assert.equal(model.operational.detailRows.find((item) => item.label === "Statement date").value, "2025-09-24");
  assert.equal(model.navigation.operationalHref, "operational_view.html?statementDate=2025-09-24");
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
