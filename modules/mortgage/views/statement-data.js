const mortgageStatementData = {
  asset: {
    name: "Oasis at San Marco",
    location: "Jacksonville, FL"
  },
  currentDebt: {
    servicer: "CBRE Loan Services, Inc.",
    interestRate: 0.085,
    latestDueDate: "2026-02-09"
  },
  statements: [
    {
      statementDate: "2025-07-24",
      principalBalance: 10853176.39,
      taxEscrow: 135924.01,
      insuranceEscrow: 100920.21,
      otherEscrow: 399851.86,
      totalDue: 113545.32,
      sourceFile: "2025-07- July Statement.pdf"
    },
    {
      statementDate: "2025-08-25",
      principalBalance: 10853176.39,
      taxEscrow: 151612.47,
      insuranceEscrow: 119066.75,
      otherEscrow: 393901.86,
      totalDue: 113274.22,
      sourceFile: "2025-08-August Statement.pdf"
    },
    {
      statementDate: "2025-09-24",
      principalBalance: 10853176.39,
      taxEscrow: 167300.93,
      insuranceEscrow: 137213.29,
      otherEscrow: 388471.33,
      totalDue: 110711.67,
      sourceFile: "2025-09 - September Statement.pdf"
    },
    {
      statementDate: "2025-12-23",
      principalBalance: 10853176.39,
      taxEscrow: 55402.8,
      insuranceEscrow: 191652.91,
      otherEscrow: 248087.47,
      totalDue: 113274.22,
      sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf"
    },
    {
      statementDate: "2026-01-23",
      principalBalance: 10853176.39,
      taxEscrow: 71091.26,
      insuranceEscrow: 209799.45,
      otherEscrow: 281922.98,
      totalDue: 112158.22,
      sourceFile: "2026-02- February Statement.pdf"
    }
  ],
  keyContacts: []
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { mortgageStatementData };
}

if (typeof window !== "undefined") {
  window.mortgageStatementData = mortgageStatementData;
}
