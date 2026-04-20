let fallbackStatementData = null;

if (typeof module !== "undefined" && module.exports) {
  ({ mortgageStatementData: fallbackStatementData } = require("./statement-data.js"));
}

function formatMoney(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not available in statements";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatStatementMonth(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit"
  }).format(new Date(`${value}T00:00:00`));
}

function sortStatements(statements) {
  return [...statements].sort((a, b) => a.statementDate.localeCompare(b.statementDate));
}

function latestWindow(statements, size = 12) {
  const ordered = sortStatements(statements);
  return ordered.slice(Math.max(ordered.length - size, 0));
}

function buildField(label, value) {
  if (value === null || value === undefined) {
    return { label, value: "Not available in statements", state: "missing" };
  }

  const formattedValue = typeof value === "number" ? formatMoney(value) : value;

  return { label, value: formattedValue, state: "available" };
}

function buildGapSummary(data) {
  const gaps = [];

  if (data.metadata.loanAmount === null) gaps.push("Loan amount");
  if (data.metadata.loanTerm === null) gaps.push("Loan term");
  if (data.metadata.startDate === null) gaps.push("Start date");
  if (data.metadata.maturityDate === null) gaps.push("Maturity date");
  if (data.servicer.name === null) gaps.push("Servicer");
  if (data.keyContacts.length === 0) gaps.push("Key contacts");
  if (data.metadata.dueDate === null) gaps.push("Due date");

  return gaps;
}

function buildDetailRows(selected) {
  return [
    { label: "Statement date", value: selected.statementDate },
    { label: "Source file", value: selected.sourceFile },
    { label: "Outstanding balance", value: formatMoney(selected.principalBalance) },
    { label: "Interest", value: formatMoney(selected.interestPaid) },
    { label: "Taxes", value: formatMoney(selected.taxes) },
    { label: "Insurance", value: formatMoney(selected.insurance) },
    { label: "Other escrow", value: formatMoney(selected.otherEscrow) },
    { label: "Total due", value: formatMoney(selected.totalDue) }
  ];
}

function buildSidebar(data) {
  return {
    available: [
      "Statement date",
      "Outstanding balance",
      "Interest",
      "Taxes",
      "Insurance",
      "Other escrow",
      "Total due",
      "Source file"
    ],
    missing: buildGapSummary(data),
    latestSource: data.statements[data.statements.length - 1].sourceFile
  };
}

function buildLatestInsight(latest, gapSummary) {
  const components = [
    { label: "Interest", value: latest.interestPaid },
    { label: "Taxes", value: latest.taxes },
    { label: "Insurance", value: latest.insurance }
  ].sort((a, b) => b.value - a.value);

  return {
    primary: `${components[0].label} is the largest tracked component in the latest statement.`,
    secondary: `${gapSummary.length} summary fields remain unavailable in statements.`
  };
}

function buildStatementDashboardModel(data = fallbackStatementData, options = {}) {
  if (!data || !Array.isArray(data.statements)) {
    throw new Error("buildStatementDashboardModel requires statement data");
  }

  const ordered = sortStatements(data.statements);
  const latest = ordered[ordered.length - 1];
  const selectedStatementDate = options.selectedStatementDate || latest.statementDate;
  const selected = ordered.find((row) => row.statementDate === selectedStatementDate) || latest;
  const strategicWindow = latestWindow(ordered, 12);
  const gapSummary = buildGapSummary(data);

  return {
    strategic: {
      chart: {
        points: strategicWindow.map((row) => ({
          label: formatStatementMonth(row.statementDate),
          statementDate: row.statementDate,
          interestPaid: row.interestPaid,
          taxes: row.taxes,
          insurance: row.insurance
        })),
        series: [
          { key: "interestPaid", label: "Interest" },
          { key: "taxes", label: "Taxes" },
          { key: "insurance", label: "Insurance" }
        ]
      },
      loanOverview: [
        buildField("Outstanding balance", latest.principalBalance),
        buildField("Interest amount", latest.interestPaid),
        buildField("Taxes", latest.taxes),
        buildField("Insurance", latest.insurance),
        buildField("Loan amount", data.metadata.loanAmount),
        buildField("Loan term", data.metadata.loanTerm),
        buildField("Start date", data.metadata.startDate),
        buildField("Maturity date", data.metadata.maturityDate)
      ],
      servicerCard: {
        state: data.servicer.name ? "available" : "missing",
        name: data.servicer.name || "Not available in statements",
        phone: data.servicer.phone || "Not available in statements",
        email: data.servicer.email || "Not available in statements"
      },
      keyContactsCard: {
        state: data.keyContacts.length > 0 ? "available" : "missing",
        contacts: data.keyContacts.length > 0 ? data.keyContacts : []
      },
      latestInsight: buildLatestInsight(latest, gapSummary),
      cta: {
        label: "View operational detail",
        href: `operational_view.html?statementDate=${latest.statementDate}`
      }
    },
    operational: {
      tableRows: [...ordered]
        .sort((a, b) => b.statementDate.localeCompare(a.statementDate))
        .map((row) => ({
          ...row,
          sourceLabel: row.sourceFile
        })),
      selectedStatement: selected,
      detailRows: buildDetailRows(selected),
      sidebar: buildSidebar(data),
      gapSummary
    },
    navigation: {
      operationalHref: `operational_view.html?statementDate=${selected.statementDate}`,
      strategicHref: "index.html"
    }
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    buildStatementDashboardModel,
    buildDetailRows,
    buildField,
    buildGapSummary,
    buildLatestInsight,
    buildSidebar,
    formatMoney,
    formatStatementMonth,
    latestWindow,
    sortStatements
  };
}

if (typeof window !== "undefined") {
  window.statementDashboardModel = {
    buildStatementDashboardModel,
    buildDetailRows,
    buildField,
    buildGapSummary,
    buildLatestInsight,
    buildSidebar,
    formatMoney,
    formatStatementMonth,
    latestWindow,
    sortStatements
  };
}
