const BENCHMARKS = {
  dscr: {
    healthy: 1.25,
    watchlist: 1.1,
    betterDirection: "up",
    formatter: (value) => `${value.toFixed(2)}x`,
    target: ">= 1.25x"
  },
  ltv: {
    healthy: 0.65,
    watchlist: 0.75,
    betterDirection: "down",
    formatter: (value) => `${(value * 100).toFixed(1)}%`,
    target: "<= 65%"
  },
  debtYield: {
    healthy: 0.08,
    watchlist: 0.065,
    betterDirection: "up",
    formatter: (value) => `${(value * 100).toFixed(2)}%`,
    target: ">= 8.0%"
  },
  escrowRunway: {
    healthy: 3,
    watchlist: 2,
    betterDirection: "up",
    formatter: (value) => `${value.toFixed(1)} mo`,
    target: ">= 3.0 mo"
  }
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

function scoreFromState(state) {
  if (state === "healthy") return 25;
  if (state === "watchlist") return 16;
  return 8;
}

function buildHealth(overviewKpis) {
  const score =
    overviewKpis
      .filter((item) => item.benchmark !== "vs prior T12")
      .reduce((sum, item) => sum + scoreFromState(item.state), 0) - 10;
  const normalized = Math.max(0, Math.min(100, score));
  const status = normalized >= 75 ? "healthy" : normalized >= 55 ? "watchlist" : "critical";

  return { score: normalized, status };
}

function buildRefiDriver(data) {
  const marketOption = data.refinancing
    .map((quote) => ({
      ...quote,
      spreadBps: Math.round((data.currentDebt.interestRate - quote.noteRate) * 10000),
      annualSavings: Math.round(
        data.currentDebt.principalBalance * data.currentDebt.interestRate - quote.annualIoPayment
      ),
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
  const occupancyRiskUnits =
    data.rentRoll.noticeUnits +
    data.rentRoll.vacantRentedUnits +
    data.rentRoll.evictUnits +
    data.rentRoll.vacantUnrentedUnits;

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

function buildMortgageDecisionModel(data) {
  const latest = data.statements[data.statements.length - 1];
  const previous = data.statements[data.statements.length - 2] || latest;
  const marketValue = data.analysis.marketValue;
  const annualDebtService = data.currentDebt.monthlyInterestOnly * 12;
  const priorNoi = data.analysis.priorNoi;

  if (!marketValue) {
    throw new Error("buildMortgageDecisionModel requires data.analysis.marketValue");
  }

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
      {
        label: "DSCR",
        value: BENCHMARKS.dscr.formatter(metrics.dscr),
        benchmark: BENCHMARKS.dscr.target,
        state: evaluateBenchmark("dscr", metrics.dscr),
        direction: dscrDirection
      },
      {
        label: "LTV",
        value: BENCHMARKS.ltv.formatter(metrics.ltv),
        benchmark: BENCHMARKS.ltv.target,
        state: evaluateBenchmark("ltv", metrics.ltv),
        direction: ltvDirection
      },
      {
        label: "NOI",
        value: `$${Math.round(metrics.noi).toLocaleString("en-US")}`,
        benchmark: "vs prior T12",
        state: noiDirection.tone,
        direction: noiDirection
      },
      {
        label: "Debt Yield",
        value: BENCHMARKS.debtYield.formatter(metrics.debtYield),
        benchmark: BENCHMARKS.debtYield.target,
        state: evaluateBenchmark("debtYield", metrics.debtYield),
        direction: debtYieldDirection
      },
      {
        label: "Escrow Runway",
        value: BENCHMARKS.escrowRunway.formatter(metrics.escrowRunwayMonths),
        benchmark: BENCHMARKS.escrowRunway.target,
        state: evaluateBenchmark("escrowRunway", metrics.escrowRunwayMonths),
        direction: runwayDirection
      }
    ]
  };

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
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BENCHMARKS, buildMortgageDecisionModel, calculateDirection, evaluateBenchmark };
}

if (typeof window !== "undefined") {
  window.mortgageDashboardModel = { BENCHMARKS, buildMortgageDecisionModel, calculateDirection, evaluateBenchmark };
}
