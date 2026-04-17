const test = require("node:test");
const assert = require("node:assert/strict");
const { buildMortgageDecisionModel, calculateDirection, evaluateBenchmark } = require("./dashboard-model.js");

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
    marketValue: 14970243.296551725,
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

test("evaluateBenchmark uses inclusive threshold boundaries", () => {
  assert.equal(evaluateBenchmark("dscr", 1.25), "healthy");
  assert.equal(evaluateBenchmark("dscr", 1.1), "watchlist");
  assert.equal(evaluateBenchmark("dscr", 1.0999), "critical");
  assert.equal(evaluateBenchmark("ltv", 0.65), "healthy");
  assert.equal(evaluateBenchmark("ltv", 0.75), "watchlist");
  assert.equal(evaluateBenchmark("ltv", 0.7501), "critical");
});

test("calculateDirection reports flat and directional movement", () => {
  assert.deepEqual(calculateDirection(10, 10), {
    delta: 0,
    arrow: "→",
    tone: "watchlist"
  });

  assert.deepEqual(calculateDirection(11, 10), {
    delta: 1,
    arrow: "↑",
    tone: "healthy"
  });

  assert.deepEqual(calculateDirection(9, 10, true), {
    delta: -1,
    arrow: "↓",
    tone: "healthy"
  });
});
