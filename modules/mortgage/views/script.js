const mortgageData = {
  property: {
    name: "Oasis at San Marco",
    city: "Jacksonville, FL"
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
    concessionsYtd: -30208.5
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

function buildMetrics() {
  const statements = mortgageData.statements;
  const latest = statements[statements.length - 1];
  const previous = statements[statements.length - 2];
  const first = statements[0];
  const last12 = statements.slice(-12);
  const escrowSeries = statements.map((row) => row.endingEscrowBalance).filter(Boolean);
  const escrowPeak = Math.max(...escrowSeries);
  const incomeGap = mortgageData.budget.totalRentalIncomeYtd - mortgageData.budget.totalRentalIncomeBudgetYtd;
  const marketGap = mortgageData.rentRoll.actualRentTotal - mortgageData.rentRoll.marketRentTotal;
  const unstableUnits = mortgageData.rentRoll.noticeUnits + mortgageData.rentRoll.vacantRentedUnits + mortgageData.rentRoll.evictUnits + mortgageData.rentRoll.vacantUnrentedUnits;
  const notesTotal = mortgageData.promissoryNotes.reduce((sum, note) => sum + note.principalAmount, 0);
  const refinanceOptions = mortgageData.refinancing.map((quote) => {
    const monthlyCost = quote.annualIoPayment
      ? quote.annualIoPayment / 12
      : (quote.proposedLoanAmount * quote.noteRate) / 12;

    return {
      ...quote,
      monthlyCost,
      monthlySavings: mortgageData.currentDebt.monthlyInterestOnly - monthlyCost,
      takeoutGap: mortgageData.currentDebt.principalBalance - quote.proposedLoanAmount
    };
  }).sort((a, b) => b.monthlySavings - a.monthlySavings);

  return {
    latest,
    previous,
    first,
    last12,
    escrowPeak,
    incomeGap,
    marketGap,
    unstableUnits,
    notesTotal,
    refinanceOptions,
    principalGrowth: latest.principalBalance - first.principalBalance
  };
}

function buildKpis(metrics) {
  const dueDelta = metrics.latest.totalDue - metrics.previous.totalDue;
  const escrowDelta = metrics.latest.endingEscrowBalance - metrics.previous.endingEscrowBalance;
  const occupancyDelta = mortgageData.rentRoll.occupiedRate - 0.95;
  const incomeDelta = metrics.incomeGap;

  const cards = [
    {
      label: "Current balance",
      value: formatCurrency(mortgageData.currentDebt.principalBalance),
      delta: `${arrowFor(metrics.principalGrowth)} ${formatCurrency(metrics.principalGrowth, true)} vs start`,
      className: trendClass(metrics.principalGrowth, true)
    },
    {
      label: "Monthly due",
      value: formatCurrency(metrics.latest.totalDue, true),
      delta: `${arrowFor(dueDelta)} ${formatCurrency(Math.abs(dueDelta), true)} vs prior`,
      className: trendClass(dueDelta, true)
    },
    {
      label: "YTD income vs budget",
      value: formatCurrency(Math.abs(incomeDelta), true),
      delta: `${arrowFor(incomeDelta)} ${formatPercent(Math.abs(incomeDelta) / mortgageData.budget.totalRentalIncomeBudgetYtd, 1)} off plan`,
      className: trendClass(incomeDelta)
    },
    {
      label: "Occupancy",
      value: formatPercent(mortgageData.rentRoll.occupiedRate, 1),
      delta: `${arrowFor(occupancyDelta)} ${metrics.unstableUnits} unstable units`,
      className: trendClass(occupancyDelta)
    }
  ];

  document.getElementById("overview-kpis").innerHTML = cards.map((card) => `
    <article class="kpi-card">
      <div class="kpi-head">
        <span class="kpi-label">${card.label}</span>
      </div>
      <strong class="kpi-value">${card.value}</strong>
      <div class="kpi-delta ${card.className}">${card.delta}</div>
    </article>
  `).join("");

  const criticalCards = [
    {
      label: "Critical point",
      value: `${metrics.unstableUnits} units`,
      foot: "Lease-status friction"
    },
    {
      label: "Risk",
      value: formatCurrency(Math.abs(mortgageData.budget.vacancyYtd), true),
      foot: "Vacancy drag leads"
    },
    {
      label: "Opportunity",
      value: formatCurrency(metrics.refinanceOptions[0].monthlySavings, true),
      foot: "Best monthly savings"
    }
  ];

  document.getElementById("critical-strip").innerHTML = criticalCards.map((card) => `
    <article class="critical-card">
      <div class="critical-head">
        <span class="critical-label">${card.label}</span>
      </div>
      <div class="critical-value">${card.value}</div>
      <p class="critical-foot">${card.foot}</p>
    </article>
  `).join("");
}

function renderChart(containerId, series, formatter, classResolver) {
  const container = document.getElementById(containerId);
  const maxValue = Math.max(...series.map((item) => item.value || 0), 1);

  container.innerHTML = series.map((item) => `
    <div class="chart-bar ${classResolver ? classResolver(item) : ""}">
      <div class="chart-bar-value">${formatter(item.value)}</div>
      <div class="chart-bar-column" style="height:${Math.max(36, (item.value / maxValue) * 170)}px"></div>
      <div class="chart-bar-label">${item.label}</div>
    </div>
  `).join("");
}

function renderTrends(metrics) {
  const debtDelta = metrics.latest.totalDue - metrics.previous.totalDue;
  const escrowDelta = metrics.latest.endingEscrowBalance - metrics.previous.endingEscrowBalance;
  const principalDelta = metrics.principalGrowth;

  const debtChip = document.getElementById("debt-trend-chip");
  debtChip.innerHTML = `${arrowFor(debtDelta)} ${formatCurrency(Math.abs(debtDelta), true)}`;
  debtChip.classList.add(compareChipClass(debtDelta, true));
  document.getElementById("debt-trend-headline").textContent = formatCurrency(metrics.latest.totalDue, true);
  renderChart(
    "debt-trend-chart",
    metrics.last12.map((row) => ({ label: compactMonth(row.statementDate), value: row.totalDue })),
    (value) => formatCurrency(value),
    (item) => item.value > metrics.latest.totalDue ? "warn" : ""
  );
  document.getElementById("debt-trend-insight").textContent = "Carry remains elevated vs trailing baseline.";

  const escrowChip = document.getElementById("escrow-trend-chip");
  escrowChip.innerHTML = `${arrowFor(escrowDelta)} ${formatCurrency(Math.abs(escrowDelta), true)}`;
  escrowChip.classList.add(compareChipClass(escrowDelta));
  document.getElementById("escrow-trend-headline").textContent = formatCurrency(metrics.latest.endingEscrowBalance, true);
  renderChart(
    "escrow-trend-chart",
    metrics.last12.map((row) => ({ label: compactMonth(row.statementDate), value: row.endingEscrowBalance || 0 })),
    (value) => formatCurrency(value),
    (item) => item.value < metrics.escrowPeak * 0.45 ? "danger" : item.value < metrics.escrowPeak * 0.65 ? "warn" : ""
  );
  document.getElementById("escrow-trend-insight").textContent = "Escrow still sits well below prior peak.";

  const principalChip = document.getElementById("principal-trend-chip");
  principalChip.innerHTML = `${arrowFor(principalDelta)} ${formatCurrency(Math.abs(principalDelta), true)}`;
  principalChip.classList.add(compareChipClass(principalDelta, true));
  document.getElementById("principal-trend-headline").textContent = formatCurrency(metrics.latest.principalBalance, true);
  renderChart(
    "principal-trend-chart",
    mortgageData.statements.map((row, index) => {
      const previous = mortgageData.statements[index - 1];
      const drawEvent = previous ? Math.abs(row.principalBalance - previous.principalBalance) > 1000 : false;
      return {
        label: compactMonth(row.statementDate),
        value: row.principalBalance,
        drawEvent
      };
    }),
    (value) => formatCurrency(value),
    (item) => item.drawEvent ? "warn" : ""
  );
  document.getElementById("principal-trend-insight").textContent = "Draws lifted leverage without amortization.";
}

function renderAlerts(metrics) {
  const alerts = [
    {
      severity: "critical",
      title: "Income shortfall",
      metric: `${arrowFor(metrics.incomeGap)} ${formatCurrency(Math.abs(metrics.incomeGap), true)}`,
      foot: "YTD below budget"
    },
    {
      severity: "high",
      title: "Vacancy drag",
      metric: `${arrowFor(mortgageData.budget.vacancyYtd)} ${formatCurrency(Math.abs(mortgageData.budget.vacancyYtd), true)}`,
      foot: "Largest revenue leak"
    },
    {
      severity: "high",
      title: "Collections stress",
      metric: `${arrowFor(mortgageData.budget.badDebtYtd)} ${formatCurrency(Math.abs(mortgageData.budget.badDebtYtd), true)}`,
      foot: "Bad debt still elevated"
    },
    {
      severity: "opportunity",
      title: "Refi window",
      metric: `${arrowFor(metrics.refinanceOptions[0].monthlySavings)} ${formatCurrency(metrics.refinanceOptions[0].monthlySavings, true)}`,
      foot: "Best monthly savings"
    }
  ];

  document.getElementById("alert-grid").innerHTML = alerts.map((alert) => `
    <article class="alert-card">
      <div class="alert-head">
        <strong>${alert.title}</strong>
        <span class="risk-chip risk-${alert.severity}">${alert.severity}</span>
      </div>
      <div class="alert-metric">${alert.metric}</div>
      <p class="alert-foot">${alert.foot}</p>
    </article>
  `).join("");
}

function renderDrivers(metrics) {
  const grossPotential = mortgageData.budget.grossPotentialRentYtd;
  const leakageDrivers = [
    { label: "Vacancy", value: Math.abs(mortgageData.budget.vacancyYtd), className: "danger" },
    { label: "Bad debt", value: Math.abs(mortgageData.budget.badDebtYtd), className: "warn" },
    { label: "Concessions", value: Math.abs(mortgageData.budget.concessionsYtd), className: "" }
  ].sort((a, b) => b.value - a.value);

  document.getElementById("leakage-list").innerHTML = leakageDrivers.map((item) => `
    <div class="rank-item">
      <div class="rank-head">
        <strong>${item.label}</strong>
        <span>${formatCurrency(item.value, true)} · ${formatPercent(item.value / grossPotential, 1)}</span>
      </div>
      <div class="meter">
        <div class="meter-fill ${item.className}" style="width:${(item.value / leakageDrivers[0].value) * 100}%"></div>
      </div>
    </div>
  `).join("");
  document.getElementById("leakage-insight").textContent = "Vacancy and bad debt are the core underwriting pressure points.";

  const statuses = [
    { label: "Current", key: "current", value: mortgageData.rentRoll.currentUnits },
    { label: "Notice", key: "notice", value: mortgageData.rentRoll.noticeUnits },
    { label: "Vacant-Rented", key: "vacant-rented", value: mortgageData.rentRoll.vacantRentedUnits },
    { label: "Evict", key: "evict", value: mortgageData.rentRoll.evictUnits },
    { label: "Vacant-Unrented", key: "vacant-unrented", value: mortgageData.rentRoll.vacantUnrentedUnits }
  ];

  document.getElementById("status-segment-bar").innerHTML = statuses.map((status) => `
    <span class="segment-piece ${status.key}" style="width:${(status.value / mortgageData.rentRoll.units) * 100}%"></span>
  `).join("");

  document.getElementById("status-legend").innerHTML = statuses.map((status) => `
    <div class="legend-item">
      <div class="legend-label">
        <span class="legend-swatch ${status.key}"></span>
        <strong>${status.label}</strong>
      </div>
      <span>${status.value}</span>
    </div>
  `).join("");
  document.getElementById("status-insight").textContent = `${metrics.unstableUnits} units sit outside the stable current bucket.`;

  document.getElementById("capital-options").innerHTML = metrics.refinanceOptions.map((quote, index) => `
    <div class="option-card">
      <div class="option-head">
        <strong>${quote.lender} · ${quote.product}</strong>
        <span class="risk-chip ${index === 0 ? "risk-opportunity" : "risk-medium"}">${index === 0 ? "best" : "alt"}</span>
      </div>
      <div class="option-metrics">
        <span>Rate ${formatPercent(quote.noteRate, 2)} · LTV ${formatPercent(quote.ltv, 1)}</span>
        <span>Savings ${formatCurrency(quote.monthlySavings, true)} · Gap ${formatCurrency(Math.abs(quote.takeoutGap), true)}</span>
      </div>
    </div>
  `).join("");
  document.getElementById("capital-insight").textContent = "Lower rate available; takeout gap remains the main constraint.";
}

function buildPriorities(metrics) {
  return [
    {
      severity: "critical",
      title: "Close refinance path",
      area: "Capital",
      signal: `${formatCurrency(Math.abs(metrics.refinanceOptions[0].takeoutGap), true)} takeout gap`,
      action: "Choose lender path and solve funding gap.",
      owner: "Asset Mgmt",
      timing: "30 days"
    },
    {
      severity: "critical",
      title: "Stabilize collections",
      area: "Collections",
      signal: `${formatCurrency(Math.abs(mortgageData.budget.badDebtYtd), true)} bad debt`,
      action: "Escalate delinquency review and recovery plan.",
      owner: "Ops + AM",
      timing: "Immediate"
    },
    {
      severity: "high",
      title: "Reduce vacancy leakage",
      area: "Leasing",
      signal: `${formatCurrency(Math.abs(mortgageData.budget.vacancyYtd), true)} vacancy drag`,
      action: "Prioritize notice and vacant turns.",
      owner: "Regional Ops",
      timing: "2 weeks"
    },
    {
      severity: "high",
      title: "Recheck escrow adequacy",
      area: "Liquidity",
      signal: `${formatCurrency(metrics.latest.endingEscrowBalance, true)} current escrow`,
      action: "Refresh tax and insurance reserve forecast.",
      owner: "Treasury",
      timing: "This month"
    },
    {
      severity: "opportunity",
      title: "Use rate relief",
      area: "Strategy",
      signal: `${formatCurrency(metrics.refinanceOptions[0].monthlySavings, true)} best monthly savings`,
      action: "Pair refi case with operating plan reset.",
      owner: "Asset Mgmt",
      timing: "Q plan"
    }
  ];
}

function renderPriorities(metrics) {
  const priorities = buildPriorities(metrics);
  const filtered = priorities.filter((item) => state.priorityFilter === "all" || item.severity === state.priorityFilter);

  document.getElementById("priority-table-body").innerHTML = filtered.map((item) => `
    <tr>
      <td>
        <div class="priority-title">
          <span class="table-chip ${item.severity}">${item.severity}</span>
          <strong>${item.title}</strong>
        </div>
      </td>
      <td>${item.area}</td>
      <td>${item.signal}</td>
      <td>${item.action}</td>
      <td>${item.owner}</td>
      <td>${item.timing}</td>
    </tr>
  `).join("");
}

function bindFilters(metrics) {
  document.querySelectorAll(".filter-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.priorityFilter = button.dataset.filter;
      document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.filter === state.priorityFilter);
      });
      renderPriorities(metrics);
    });
  });
}

function initHeader(metrics) {
  document.getElementById("portfolio-status").textContent = "Watchlist";
  document.getElementById("latest-cycle").textContent = formatDate(mortgageData.currentDebt.latestDueDate);
}

function init() {
  const metrics = buildMetrics();
  initHeader(metrics);
  buildKpis(metrics);
  renderTrends(metrics);
  renderAlerts(metrics);
  renderDrivers(metrics);
  renderPriorities(metrics);
  bindFilters(metrics);

  console.info("Mortgage executive dashboard ready", {
    asset: mortgageData.property.name,
    latestDue: metrics.latest.totalDue
  });
}

init();
