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

  return { metrics, overview };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { BENCHMARKS, buildMortgageDecisionModel, evaluateBenchmark };
}

if (typeof window !== "undefined") {
  window.mortgageDashboardModel = { BENCHMARKS, buildMortgageDecisionModel, evaluateBenchmark };
}
