const mortgageData = {
  property: {
    name: "Oasis at San Marco",
    city: "Jacksonville, FL"
  },
  analysis: {
    marketValue: 14970243.296551725,
    priorNoi: 498300
  },
  currentDebt: {
    principalBalance: 10853176.39,
    interestRate: 0.085,
    monthlyInterestOnly: 79439.22,
    monthlyWithEscrow: 112158.22,
    latestDueDate: "2026-02-09"
  },
  rentRoll: {
    asOf: "2025-09-30",
    units: 129,
    occupiedRate: 0.953,
    currentUnits: 113,
    vacantRentedUnits: 4,
    noticeUnits: 4,
    evictUnits: 4,
    vacantUnrentedUnits: 2,
    marketRentTotal: 413769,
    actualRentTotal: 394425
  },
  budget: {
    totalRentalIncomeYtd: 897404.61,
    totalRentalIncomeBudgetYtd: 993345,
    grossPotentialRentYtd: 1323426.84,
    vacancyYtd: -240058.09,
    badDebtYtd: -91015.06,
    concessionsYtd: -30208.5,
    t12Noi: 455428.84
  },
  statements: [
    { statementDate: "2024-03-09", principalBalance: 10130000, totalDue: 101665.26, endingEscrowBalance: null, sourceFile: "CBRE March 2024 Statement.pdf / Manual" },
    { statementDate: "2024-04-01", principalBalance: 10130000, totalDue: 101665.26, endingEscrowBalance: 641972.72, sourceFile: "CBRE April Statement 2024.pdf" },
    { statementDate: "2024-04-24", principalBalance: 10130000, totalDue: 104057.07, endingEscrowBalance: 674096.16, sourceFile: "CBRE May Statement 2024.pdf" },
    { statementDate: "2024-05-23", principalBalance: 10130000, totalDue: 106448.87, endingEscrowBalance: 706679.38, sourceFile: "CBRE June Statement 2024.pdf" },
    { statementDate: "2024-06-24", principalBalance: 10130000, totalDue: 104057.07, endingEscrowBalance: 739281.02, sourceFile: "2024.06- June Statement.pdf / CBRE June Statement 2024.pdf" },
    { statementDate: "2024-07-24", principalBalance: 10130000, totalDue: 106448.87, endingEscrowBalance: 771868.93, sourceFile: "2024.07 - July Statement.pdf / CBRE July Statement 2024.pdf" },
    { statementDate: "2024-08-23", principalBalance: 10143176.39, totalDue: 106578.43, endingEscrowBalance: 611989.83, sourceFile: "2024.08 - August Statement.pdf / CBRE August Statement 2024.pdf" },
    { statementDate: "2024-09-24", principalBalance: 10143064.86, totalDue: 104149.61, endingEscrowBalance: 644470.03, sourceFile: "2024.09 - September Statement.pdf / CBRE September Statement 2024.pdf" },
    { statementDate: "2024-10-24", principalBalance: 10143064.86, totalDue: 106544.5, endingEscrowBalance: 676944.6, sourceFile: "2024.10 - October Statement.pdf / CBRE October Statement 2024.pdf" },
    { statementDate: "2024-11-22", principalBalance: 10143064.86, totalDue: 104149.61, endingEscrowBalance: 552535.93, sourceFile: "2024.11 - November Statement.pdf / CBRE November Statement 2024.pdf" },
    { statementDate: "2024-12-23", principalBalance: 10143064.86, totalDue: 32302.9, endingEscrowBalance: 510758.34, sourceFile: "2024.12 - December Statement.pdf / 2025-01- January Statement.pdf" },
    { statementDate: "2025-02-21", principalBalance: 10401402.81, totalDue: 103758.76, endingEscrowBalance: 337312.89, sourceFile: "2025-02-February Statement.pdf" },
    { statementDate: "2025-03-24", principalBalance: 10401402.81, totalDue: 109967.49, endingEscrowBalance: 326865.29, sourceFile: "2025-03- March Statement.pdf" },
    { statementDate: "2025-04-22", principalBalance: 10401402.81, totalDue: 107511.6, endingEscrowBalance: 358315.12, sourceFile: "2025-04-  April Statement.pdf" },
    { statementDate: "2025-05-23", principalBalance: 10764854.41, totalDue: 112799.38, endingEscrowBalance: 332275.88, sourceFile: "2025-05-May Statement.pdf" },
    { statementDate: "2025-06-26", principalBalance: 10764854.41, totalDue: 110086.05, endingEscrowBalance: 366196.76, sourceFile: "2025-06-June Statement.pdf" },
    { statementDate: "2025-07-24", principalBalance: 10853176.39, totalDue: 113545.32, endingEscrowBalance: 399851.86, sourceFile: "2025-07- July Statement.pdf" },
    { statementDate: "2025-08-25", principalBalance: 10853176.39, totalDue: 113274.22, endingEscrowBalance: 393901.86, sourceFile: "2025-08-August Statement.pdf" },
    { statementDate: "2025-09-24", principalBalance: 10853176.39, totalDue: 110711.67, endingEscrowBalance: 388471.33, sourceFile: "2025-09 - September Statement.pdf" },
    { statementDate: "2025-10-23", principalBalance: 10853176.39, totalDue: 113274.22, endingEscrowBalance: 422347.04, sourceFile: "2025-10-October Statement.pdf" },
    { statementDate: "2025-11-21", principalBalance: 10853176.39, totalDue: 110711.67, endingEscrowBalance: 214251.98, sourceFile: "2025-11- November Statement.pdf" },
    { statementDate: "2025-12-23", principalBalance: 10853176.39, totalDue: 113274.22, endingEscrowBalance: 248087.47, sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf" },
    { statementDate: "2026-01-23", principalBalance: 10853176.39, totalDue: 112158.22, endingEscrowBalance: 281922.98, sourceFile: "2026-02- February Statement.pdf" }
  ],
  promissoryNotes: [
    { lender: "Bliss Group, LLC", principalAmount: 13500 },
    { lender: "CRRE, LLC", principalAmount: 12000 },
    { lender: "Severn Consulting Solutions, LLC", principalAmount: 20000 },
    { lender: "Jayant Patel", principalAmount: 20000 },
    { lender: "ETC Custodian FBO Paul Landman IRA", principalAmount: 5000 },
    { lender: "Virendra \"Vinnie\" Patel", principalAmount: 50000 }
  ],
  refinancing: [
    { lender: "CBRE", product: "3-Year UST", proposedLoanAmount: 10500000, noteRate: 0.0555, ltv: 0.701 },
    { lender: "LUMENT", product: "5-Year FNMA", proposedLoanAmount: 9702000, noteRate: 0.0528, ltv: 0.75, annualIoPayment: 511675 },
    { lender: "LUMENT", product: "7-Year FNMA", proposedLoanAmount: 9607000, noteRate: 0.0536, ltv: 0.75, annualIoPayment: 515031 },
    { lender: "LUMENT", product: "10-Year FNMA", proposedLoanAmount: 9436000, noteRate: 0.0552, ltv: 0.75, annualIoPayment: 521150 }
  ]
};

const state = {
  priorityFilter: "all"
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const currencyExact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function formatCurrency(value, exact = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }
  return exact ? currencyExact.format(value) : currency.format(value);
}

function formatPercent(value, digits = 1) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function compactMonth(value) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit"
  });
}

function capitalizeLabel(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function arrowFor(delta) {
  if (Math.abs(delta) < 0.005) {
    return "&rarr;";
  }
  return delta > 0 ? "&uarr;" : "&darr;";
}

function trendClass(delta, inverseGood = false) {
  if (Math.abs(delta) < 0.005) {
    return "trend-flat";
  }
  const improving = inverseGood ? delta < 0 : delta > 0;
  return improving ? "trend-up" : "trend-down";
}

function compareChipClass(delta, inverseGood = false) {
  if (Math.abs(delta) < 1) {
    return "flat";
  }
  const improving = inverseGood ? delta < 0 : delta > 0;
  return improving ? "good" : "bad";
}

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

function buildLineChartMarkup(series, options = {}) {
  const width = 520;
  const height = options.compact ? 200 : 240;
  const padding = { top: 22, right: 18, bottom: 34, left: 18 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = series.map((item) => item.value || 0);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const getX = (index) => padding.left + ((chartWidth / Math.max(series.length - 1, 1)) * index);
  const getY = (value) => padding.top + ((maxValue - value) / range) * chartHeight;
  const points = series.map((item, index) => ({
    ...item,
    x: getX(index),
    y: getY(item.value || 0)
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`;
  const variantClass = options.variant || "";
  const gridMarkup = Array.from({ length: 4 }, (_, index) => {
    const y = padding.top + (chartHeight / 3) * index;
    return `<line class="line-grid" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>`;
  }).join("");
  const pointsMarkup = points.map((point) => `
    <circle class="line-point ${variantClass} ${point.anomaly ? "anomaly" : ""}" cx="${point.x}" cy="${point.y}" r="${point.anomaly ? 5 : 4}"></circle>
  `).join("");
  const labelsMarkup = points
    .filter((_, index) => index === 0 || index === points.length - 1 || index % 3 === 0)
    .map((point) => `<text class="line-label" x="${point.x}" y="${height - 12}" text-anchor="middle">${point.label}</text>`)
    .join("");

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      ${gridMarkup}
      <path class="line-area ${variantClass}" d="${areaPath}"></path>
      <path class="line-path ${variantClass}" d="${path}"></path>
      ${pointsMarkup}
      ${labelsMarkup}
    </svg>
  `;
}

function renderLineChart(containerId, series, options = {}) {
  const container = document.getElementById(containerId);
  container.innerHTML = buildLineChartMarkup(series, options);
}

function buildDashboardViewModel(model) {
  const statements = mortgageData.statements;
  const latest = statements[statements.length - 1];
  const previous = statements[statements.length - 2];
  const first = statements[0];
  const last12 = statements.slice(-12);
  const escrowSeries = statements.map((row) => row.endingEscrowBalance).filter(Boolean);
  const escrowPeak = Math.max(...escrowSeries);
  const dscrCard = model.overview.kpis[0];
  const ltvCard = model.overview.kpis[1];
  const escrowCard = model.overview.kpis[4];
  const escrowDelta = latest.endingEscrowBalance - previous.endingEscrowBalance;
  const principalDelta = latest.principalBalance - first.principalBalance;
  const budget = mortgageData.budget;
  const rentRoll = mortgageData.rentRoll;
  const refiDriver = model.drivers.refi;
  const leakageDrivers = [
    { label: "Vacancy", value: Math.abs(budget.vacancyYtd), className: "danger" },
    { label: "Bad debt", value: Math.abs(budget.badDebtYtd), className: "warn" },
    { label: "Concessions", value: Math.abs(budget.concessionsYtd), className: "" }
  ].sort((a, b) => b.value - a.value);
  const statuses = [
    { label: "Current", key: "current", value: rentRoll.currentUnits },
    { label: "Notice", key: "notice", value: rentRoll.noticeUnits },
    { label: "Vacant-Rented", key: "vacant-rented", value: rentRoll.vacantRentedUnits },
    { label: "Evict", key: "evict", value: rentRoll.evictUnits },
    { label: "Vacant-Unrented", key: "vacant-unrented", value: rentRoll.vacantUnrentedUnits }
  ];
  const refiOptions = mortgageData.refinancing.map((quote) => {
    const annualIoPayment = quote.annualIoPayment || (quote.proposedLoanAmount * quote.noteRate);

    return {
      lender: quote.lender,
      product: quote.product,
      noteRate: quote.noteRate,
      ltv: quote.ltv,
      monthlySavings: mortgageData.currentDebt.monthlyInterestOnly - (annualIoPayment / 12),
      takeoutGap: mortgageData.currentDebt.principalBalance - quote.proposedLoanAmount,
      isBestOption: refiDriver.available && quote.lender === refiDriver.lender && quote.product === refiDriver.product
    };
  });

  return {
    header: {
      status: capitalizeLabel(model.health.status),
      latestCycle: formatDate(mortgageData.currentDebt.latestDueDate)
    },
    trends: {
      coverage: {
        card: dscrCard,
        series: last12.map((row) => ({
          label: compactMonth(row.statementDate),
          value: row.totalDue,
          anomaly: row.totalDue >= 113000 || row.totalDue <= 104000
        })),
        insight: `${dscrCard.value} coverage remains below ${dscrCard.benchmark}; monthly debt service still peaks above ${formatCurrency(latest.totalDue, true)}.`
      },
      escrow: {
        card: escrowCard,
        series: last12.map((row) => ({
          label: compactMonth(row.statementDate),
          value: row.endingEscrowBalance || 0,
          anomaly: (row.endingEscrowBalance || 0) < escrowPeak * 0.45
        })),
        insight: `${escrowCard.value} of runway leaves limited reserve buffer even after a ${formatCurrency(Math.abs(escrowDelta), true)} sequential move.`
      },
      leverage: {
        card: ltvCard,
        series: statements.map((row, index) => {
          const prior = statements[index - 1];

          return {
            label: compactMonth(row.statementDate),
            value: row.principalBalance,
            anomaly: prior ? Math.abs(row.principalBalance - prior.principalBalance) > 1000 : false
          };
        }),
        insight: `${ltvCard.value} leverage sits above the ${ltvCard.benchmark} target, with principal still up ${formatCurrency(principalDelta, true)} from the starting balance.`
      }
    },
    drivers: {
      leakageDrivers,
      grossPotentialRent: budget.grossPotentialRentYtd,
      leakageInsight: `${formatCurrency(model.metrics.noi, true)} T12 NOI is still weighed down by vacancy and bad debt leakage.`,
      statuses,
      totalUnits: rentRoll.units,
      statusInsight: `${model.decisionBox.impact.riskReduction} units sit outside the stable current bucket.`,
      refiOptions,
      capitalInsight: refiDriver.available
        ? `${formatCurrency(refiDriver.annualSavings, true)} annual savings is available, but the ${formatCurrency(Math.abs(refiDriver.takeoutGap), true)} takeout gap remains the gating item.`
        : "Lower-rate execution cannot be underwritten until fresh lender quotes are available."
    },
    priorities: model.priorities
  };
}

function renderTrends(viewModel) {
  const { coverage, escrow, leverage } = viewModel.trends;

  const debtChip = document.getElementById("debt-trend-chip");
  debtChip.className = `compare-chip ${compareChipClass(coverage.card.direction.delta)}`;
  debtChip.innerHTML = `${coverage.card.direction.arrow} ${coverage.card.benchmark}`;
  document.getElementById("debt-trend-headline").textContent = `${coverage.card.label} ${coverage.card.value}`;
  renderLineChart("debt-trend-chart", coverage.series, { variant: "warn" });
  document.getElementById("debt-trend-insight").textContent = coverage.insight;

  const escrowChip = document.getElementById("escrow-trend-chip");
  escrowChip.className = `compare-chip ${compareChipClass(escrow.card.direction.delta)}`;
  escrowChip.innerHTML = `${escrow.card.direction.arrow} ${escrow.card.benchmark}`;
  document.getElementById("escrow-trend-headline").textContent = `${escrow.card.label} ${escrow.card.value}`;
  renderLineChart("escrow-trend-chart", escrow.series, { variant: "danger" });
  document.getElementById("escrow-trend-insight").textContent = escrow.insight;

  const principalChip = document.getElementById("principal-trend-chip");
  principalChip.className = `compare-chip ${compareChipClass(leverage.card.direction.delta, true)}`;
  principalChip.innerHTML = `${leverage.card.direction.arrow} ${leverage.card.benchmark}`;
  document.getElementById("principal-trend-headline").textContent = `${leverage.card.label} ${leverage.card.value}`;
  renderLineChart("principal-trend-chart", leverage.series, {
    variant: "danger",
    compact: true
  });
  document.getElementById("principal-trend-insight").textContent = leverage.insight;
}

function renderAlerts(model) {
  document.getElementById("alert-grid").innerHTML = model.alerts.map((alert) => `
    <article class="alert-card">
      <div class="alert-head">
        <strong>${alert.title}</strong>
        <span class="risk-chip risk-${alert.severity}">${capitalizeLabel(alert.severity)}</span>
      </div>
      <div class="alert-metric">${alert.impact}</div>
      <p class="alert-foot">${alert.action}</p>
    </article>
  `).join("");
}

function renderDrivers(viewModel) {
  document.getElementById("leakage-list").innerHTML = viewModel.drivers.leakageDrivers.map((item) => `
    <div class="rank-item">
      <div class="rank-head">
        <strong>${item.label}</strong>
        <span>${formatCurrency(item.value, true)} &middot; ${formatPercent(item.value / viewModel.drivers.grossPotentialRent, 1)}</span>
      </div>
      <div class="meter">
        <div class="meter-fill ${item.className}" style="width:${(item.value / viewModel.drivers.leakageDrivers[0].value) * 100}%"></div>
      </div>
    </div>
  `).join("");
  document.getElementById("leakage-insight").textContent = viewModel.drivers.leakageInsight;

  document.getElementById("status-segment-bar").innerHTML = viewModel.drivers.statuses.map((status) => `
    <span class="segment-piece ${status.key}" style="width:${(status.value / viewModel.drivers.totalUnits) * 100}%"></span>
  `).join("");

  document.getElementById("status-legend").innerHTML = viewModel.drivers.statuses.map((status) => `
    <div class="legend-item">
      <div class="legend-label">
        <span class="legend-swatch ${status.key}"></span>
        <strong>${status.label}</strong>
      </div>
      <span>${status.value}</span>
    </div>
  `).join("");
  document.getElementById("status-insight").textContent = viewModel.drivers.statusInsight;

  document.getElementById("capital-options").innerHTML = viewModel.drivers.refiOptions.map((quote) => `
    <div class="option-card">
      <div class="option-head">
        <strong>${quote.lender} &middot; ${quote.product}</strong>
        <span class="risk-chip ${quote.isBestOption ? "risk-opportunity" : "risk-medium"}">${quote.isBestOption ? "best" : "alt"}</span>
      </div>
      <div class="option-metrics">
        <span>Rate ${formatPercent(quote.noteRate, 2)} &middot; LTV ${formatPercent(quote.ltv, 1)}</span>
        <span>Savings ${formatCurrency(quote.monthlySavings, true)} &middot; Gap ${formatCurrency(Math.abs(quote.takeoutGap), true)}</span>
      </div>
    </div>
  `).join("");
  document.getElementById("capital-insight").textContent = viewModel.drivers.capitalInsight;
}

function renderPriorities(viewModel) {
  const filtered = viewModel.priorities.filter((item) => state.priorityFilter === "all" || item.riskLevel === state.priorityFilter);

  document.getElementById("priority-table-body").innerHTML = filtered.map((item) => `
    <tr>
      <td>
        <div class="priority-title">
          <span class="table-chip ${item.riskLevel}">${item.priority}</span>
          <strong>${item.priority}</strong>
        </div>
      </td>
      <td>${item.area}</td>
      <td>${item.issue}</td>
      <td>${item.financialImpact}</td>
      <td><span class="risk-chip risk-${item.riskLevel}">${item.riskLevel}</span></td>
      <td>${item.recommendation}</td>
      <td>${item.owner}</td>
      <td>${item.timing}</td>
    </tr>
  `).join("");
}

function bindFilters(viewModel) {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.priorityFilter = button.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.filter === state.priorityFilter);
      });
      renderPriorities(viewModel);
    });
  });
}

function initHeader(viewModel) {
  document.getElementById("portfolio-status").textContent = viewModel.header.status;
  document.getElementById("latest-cycle").textContent = viewModel.header.latestCycle;
}

function init() {
  const model = window.mortgageDashboardModel.buildMortgageDecisionModel(mortgageData);
  const viewModel = buildDashboardViewModel(model);

  initHeader(viewModel);
  renderDecisionPanel(model);
  renderHealthPanel(model);
  renderScenarioPanel(model);
  renderOverview(model);
  renderTrends(viewModel);
  renderAlerts(model);
  renderDrivers(viewModel);
  renderPriorities(viewModel);
  bindFilters(viewModel);

  console.info("Mortgage executive dashboard ready", {
    asset: mortgageData.property.name,
    latestDue: mortgageData.currentDebt.monthlyWithEscrow,
    recommendation: model.decisionBox.recommendation
  });
}

init();
