let fallbackStatementData = null;

if (typeof module !== "undefined" && module.exports) {
  ({ mortgageStatementData: fallbackStatementData } = require("./statement-data.js"));
}

const CONTACT_FIELD_DEFS = [
  { key: "name", label: "Name" },
  { key: "role", label: "Role" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "contact", label: "Contact" }
];

function safeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isMissing(value) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

function formatMoney(value) {
  if (isMissing(value)) {
    return "Not available in statements";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value, digits = 2) {
  if (isMissing(value)) {
    return "Not available in statements";
  }

  return `${(value * 100).toFixed(digits)}%`;
}

function formatStatementMonth(value) {
  if (!value) {
    return "Not available in statements";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit"
  }).format(new Date(`${value}T00:00:00`));
}

function formatStatementDate(value) {
  if (!value) {
    return "Not available in statements";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function sortStatements(statements) {
  return safeArray(statements)
    .filter((statement) => statement && statement.statementDate)
    .slice()
    .sort((a, b) => a.statementDate.localeCompare(b.statementDate));
}

function latestStatement(statements) {
  const ordered = sortStatements(statements);
  return ordered[ordered.length - 1] || null;
}

function buildField(label, value, formatter = (input) => input) {
  if (isMissing(value)) {
    return { label, value: "Not available in statements", state: "missing" };
  }

  return { label, value: formatter(value), state: "available" };
}

function buildFieldSet(source = {}) {
  const resolved = safeObject(source);

  return CONTACT_FIELD_DEFS.map((field) => ({
    key: field.key,
    ...buildField(field.label, resolved[field.key])
  }));
}

function buildChartSeries(latest) {
  const hasTaxes = !isMissing(latest?.taxes);
  const hasInsurance = !isMissing(latest?.insurance);

  return [
    {
      key: "interestPaid",
      label: "Interest",
      state: "missing"
    },
    {
      key: "taxes",
      label: "Taxes",
      state: hasTaxes ? "available" : "missing"
    },
    {
      key: "insurance",
      label: "Insurance",
      state: hasInsurance ? "available" : "missing"
    }
  ];
}

function buildServicerSection(data) {
  const servicerSource = safeObject(data.servicer);

  const fields = buildFieldSet({
    name: servicerSource.name,
    role: servicerSource.role,
    email: servicerSource.email,
    phone: servicerSource.phone,
    contact: servicerSource.contact
  });

  return {
    state: fields.every((field) => field.state === "available")
      ? "available"
      : fields.some((field) => field.state === "available")
        ? "partial"
        : "missing",
    fields
  };
}

function buildKeyContactsSection(data) {
  const contacts = safeArray(data.keyContacts);

  if (contacts.length === 0) {
    return {
      state: "missing",
      fields: buildFieldSet()
    };
  }

  const firstContact = safeObject(contacts[0]);
  const fields = buildFieldSet(firstContact);

  return {
    state: fields.every((field) => field.state === "available")
      ? "available"
      : fields.some((field) => field.state === "available")
        ? "partial"
        : "missing",
    fields
  };
}

function buildLoanOverview(data, latest) {
  const metadata = safeObject(data.metadata);

  return [
    buildField("Outstanding balance", latest?.principalBalance, formatMoney),
    buildField("Interest amount", null, formatMoney),
    buildField("Interest rate", metadata.interestRate, formatPercent),
    buildField("Tax escrow", latest?.taxes, formatMoney),
    buildField("Insurance escrow", latest?.insurance, formatMoney),
    buildField("Other escrow", latest?.otherEscrow, formatMoney),
    buildField("Statement date", latest?.statementDate, (value) => value),
    buildField("Due date", metadata.dueDate, (value) => value),
    buildField("Monthly total due", latest?.totalDue, formatMoney),
    buildField("Loan amount", metadata.loanAmount, formatMoney),
    buildField("Loan term", metadata.loanTerm, (value) => value),
    buildField("Start date", metadata.startDate, (value) => value),
    buildField("Maturity date", metadata.maturityDate, (value) => value)
  ];
}

function buildDetailRows(selected, data) {
  const metadata = safeObject(data.metadata);

  return [
    buildField("Outstanding balance", selected?.principalBalance, formatMoney),
    buildField("Interest amount", null, formatMoney),
    buildField("Tax escrow", selected?.taxes, formatMoney),
    buildField("Insurance escrow", selected?.insurance, formatMoney),
    buildField("Other escrow", selected?.otherEscrow, formatMoney),
    buildField("Statement date", selected?.statementDate, (value) => value),
    buildField("Due date", metadata.dueDate, (value) => value),
    buildField("Monthly total due", selected?.totalDue, formatMoney),
    buildField("Source file", selected?.sourceFile, (value) => value)
  ];
}

function buildGapSummary(data) {
  const metadata = safeObject(data.metadata);
  const servicer = safeObject(data.servicer);
  const keyContacts = safeArray(data.keyContacts);

  const gaps = [];

  if (isMissing(metadata.loanAmount)) gaps.push("Loan amount");
  if (isMissing(metadata.loanTerm)) gaps.push("Loan term");
  if (isMissing(metadata.startDate)) gaps.push("Start date");
  if (isMissing(metadata.maturityDate)) gaps.push("Maturity date");
  if (isMissing(metadata.dueDate)) gaps.push("Due date");
  if (isMissing(servicer.name) && isMissing(servicer.role) && isMissing(servicer.email) && isMissing(servicer.phone) && isMissing(servicer.contact)) {
    gaps.push("Servicer");
  }
  if (keyContacts.length === 0) gaps.push("Key contacts");

  return gaps;
}

function buildLatestInsight(latest, gapSummary) {
  if (!latest) {
    return {
      primary: "No statements are available in the current source set.",
      secondary: "Statement fields remain unavailable until statement data is loaded."
    };
  }

  const components = [
    { label: "Tax escrow", value: latest.taxes },
    { label: "Insurance escrow", value: latest.insurance },
    { label: "Other escrow", value: latest.otherEscrow }
  ]
    .filter((component) => typeof component.value === "number" && Number.isFinite(component.value))
    .sort((a, b) => b.value - a.value);

  const leadingComponent = components[0];

  return {
    primary: leadingComponent
      ? `${leadingComponent.label} is the largest supported component in the latest statement.`
      : "Latest statement values are limited to the supported escrow components present in the source data.",
    secondary: `${gapSummary.length} high-level gaps remain unavailable in statements.`
  };
}

function buildStatementDashboardModel(data = fallbackStatementData, options = {}) {
  const source = safeObject(data);
  const ordered = sortStatements(source.statements);
  const latest = latestStatement(ordered);
  const selectedStatementDate = options.selectedStatementDate || latest?.statementDate || null;
  const selected = ordered.find((row) => row.statementDate === selectedStatementDate) || latest;
  const loanOverview = buildLoanOverview(source, latest);
  const servicerCard = buildServicerSection(source);
  const keyContactsCard = buildKeyContactsSection(source);
  const gapSummary = buildGapSummary(source);

  return {
    strategic: {
      chart: {
        points: latestWindow(ordered, 12).map((row) => ({
          label: formatStatementMonth(row.statementDate),
          statementDate: row.statementDate,
          principalBalance: row.principalBalance,
          interestPaid: row.interestPaid,
          totalDue: row.totalDue,
          taxes: row.taxes,
          insurance: row.insurance,
          otherEscrow: row.otherEscrow
        })),
        series: buildChartSeries(latest)
      },
      loanOverview,
      servicerCard,
      keyContactsCard,
      latestInsight: buildLatestInsight(latest, gapSummary),
      cta: {
        label: "View operational detail",
        href: latest ? `operational_view.html?statementDate=${latest.statementDate}` : "operational_view.html"
      }
    },
    operational: {
      tableRows: ordered
        .slice()
        .sort((a, b) => b.statementDate.localeCompare(a.statementDate))
        .map((row) => ({
          statementDate: row.statementDate,
          principalBalance: row.principalBalance,
          interestPaid: row.interestPaid,
          taxes: row.taxes,
          insurance: row.insurance,
          otherEscrow: row.otherEscrow,
          totalDue: row.totalDue,
          sourceLabel: row.sourceFile || "Not available in statements"
        })),
      selectedStatement: selected || null,
      detailRows: buildDetailRows(selected, source),
      sidebar: {
        available: loanOverview.filter((item) => item.state === "available").map((item) => item.label),
        missing: gapSummary,
        latestSource: latest?.sourceFile || null
      },
      gapSummary
    },
    navigation: {
      operationalHref: selected ? `operational_view.html?statementDate=${selected.statementDate}` : "operational_view.html",
      strategicHref: "index.html"
    }
  };
}

function buildLegacyCompatibilityModel(statementModel) {
  const points = statementModel.strategic.chart.points;

  return {
    header: {
      status: points.length > 0 ? "statement-only" : "missing",
      latestCycle: points.length > 0 ? formatStatementDate(points[points.length - 1].statementDate) : "No statements available"
    },
    metrics: {
      marketValue: 0,
      annualDebtService: 0,
      dscr: 0,
      ltv: 0,
      noi: 0,
      debtYield: 0,
      escrowRunwayMonths: 0,
      priorNoi: 0
    },
    overview: {
      kpis: [],
      kpiMap: {},
      criticalPoints: []
    },
    trends: {
      coverage: {
        cardKey: "statement-total-due",
        headline: "Monthly total due",
        chipLabel: "Statement only",
        chipTone: "watchlist",
        series: points.map((point) => ({
          label: point.label,
          value: point.totalDue || 0,
          anomaly: false
        })),
        insight: "Statement-only compatibility bridge."
      },
      escrow: {
        cardKey: "statement-escrow",
        headline: "Other escrow",
        chipLabel: "Statement only",
        chipTone: "watchlist",
        series: points.map((point) => ({
          label: point.label,
          value: point.otherEscrow || 0,
          anomaly: false
        })),
        insight: "Escrow values are sourced only from the available statements."
      },
      leverage: {
        cardKey: "statement-principal",
        headline: "Principal balance",
        chipLabel: "Statement only",
        chipTone: "watchlist",
        series: points.map((point) => ({
          label: point.label,
          value: point.principalBalance || 0,
          anomaly: false
        })),
        insight: "Principal balance is sourced only from the available statements."
      }
    },
    health: {
      score: 0,
      status: "watchlist"
    },
    decisionBox: {
      recommendation: "Statement dashboard compatibility bridge",
      why: ["Legacy refinance logic is temporarily bridged to statement-only data."],
      impact: {
        annualSavings: 0,
        riskReduction: 0
      }
    },
    alerts: [],
    drivers: {
      refi: {
        status: "unavailable",
        available: false
      },
      leakageDrivers: [],
      leakageInsight: "Statement-only compatibility bridge.",
      statusSegments: [],
      statusInsight: "Statement-only compatibility bridge.",
      refiOptions: [],
      capitalInsight: "Statement-only compatibility bridge."
    },
    scenarios: [],
    priorities: []
  };
}

function latestWindow(statements, size = 12) {
  const ordered = sortStatements(statements);
  return ordered.slice(Math.max(ordered.length - size, 0));
}

function buildMortgageDecisionModel(data = fallbackStatementData, options = {}) {
  return buildLegacyCompatibilityModel(buildStatementDashboardModel(data, options));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildMortgageDecisionModel,
    buildStatementDashboardModel,
    buildLegacyCompatibilityModel,
    buildDetailRows,
    buildField,
    buildGapSummary,
    buildLatestInsight,
    buildKeyContactsSection,
    buildLoanOverview,
    buildServicerSection,
    formatMoney,
    formatPercent,
    formatStatementDate,
    formatStatementMonth,
    latestStatement,
    latestWindow,
    sortStatements
  };
}

if (typeof window !== "undefined") {
  window.statementDashboardModel = {
    buildStatementDashboardModel,
    buildLegacyCompatibilityModel,
    buildDetailRows,
    buildField,
    buildGapSummary,
    buildLatestInsight,
    buildKeyContactsSection,
    buildLoanOverview,
    buildServicerSection,
    formatMoney,
    formatPercent,
    formatStatementDate,
    formatStatementMonth,
    latestStatement,
    latestWindow,
    sortStatements
  };

  window.mortgageDashboardModel = {
    buildMortgageDecisionModel,
    buildStatementDashboardModel
  };
}
