const mortgageStatementData = {
  asset: {
    name: "Oasis at San Marco",
    location: "Jacksonville, FL"
  },
  statements: [
    { statementDate: "2025-01-23", principalBalance: 10401402.81, interestPaid: 73676.33, taxes: 41800.12, insurance: 53410.44, otherEscrow: 919.27, totalDue: 169806.16, sourceFile: "2025-01-01 - Statement.pdf" },
    { statementDate: "2025-02-21", principalBalance: 10401402.81, interestPaid: 73676.33, taxes: 57481.71, insurance: 70144.87, otherEscrow: 209686.31, totalDue: 411989.22, sourceFile: "2025-02-01 - Statement.pdf" },
    { statementDate: "2025-03-24", principalBalance: 10401402.81, interestPaid: 73676.33, taxes: 73170.17, insurance: 88291.41, otherEscrow: 165403.71, totalDue: 400541.62, sourceFile: "2025-03-01 - Statement.pdf" },
    { statementDate: "2025-04-22", principalBalance: 10401402.81, interestPaid: 73676.33, taxes: 88858.63, insurance: 106437.95, otherEscrow: 163018.54, totalDue: 431991.45, sourceFile: "2025-04-01 - Statement.pdf" },
    { statementDate: "2025-05-23", principalBalance: 10764854.41, interestPaid: 76251.05, taxes: 104547.09, insurance: 64627.13, otherEscrow: 163101.66, totalDue: 408526.93, sourceFile: "2025-05-01 - Statement.pdf" },
    { statementDate: "2025-06-26", principalBalance: 10764854.41, interestPaid: 76251.05, taxes: 120235.55, insurance: 82773.67, otherEscrow: 163187.54, totalDue: 442447.81, sourceFile: "2025-06-01 - Statement.pdf" },
    { statementDate: "2025-07-24", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 135924.01, insurance: 100920.21, otherEscrow: 163007.64, totalDue: 476728.52, sourceFile: "2025-07-01 - Statement.pdf" },
    { statementDate: "2025-08-25", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 151612.47, insurance: 119066.75, otherEscrow: 123222.64, totalDue: 470778.52, sourceFile: "2025-08-01 - Statement.pdf" },
    { statementDate: "2025-09-24", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 167300.93, insurance: 137213.29, otherEscrow: 83957.11, totalDue: 465347.99, sourceFile: "2025-09-01 - Statement.pdf" },
    { statementDate: "2025-10-23", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 182989.39, insurance: 155359.83, otherEscrow: 83997.82, totalDue: 499223.70, sourceFile: "2025-10-01 - Statement.pdf" },
    { statementDate: "2025-11-21", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 39714.34, insurance: 173506.37, otherEscrow: 1031.27, totalDue: 291128.64, sourceFile: "2025-11-01 - Statement.pdf" },
    { statementDate: "2025-12-23", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 55402.80, insurance: 191652.91, otherEscrow: 1031.76, totalDue: 324964.13, sourceFile: "2025-12-01 - Statement.pdf" },
    { statementDate: "2026-01-23", principalBalance: 10853176.39, interestPaid: 76876.66, taxes: 71091.26, insurance: 209799.45, otherEscrow: 1032.27, totalDue: 358799.64, sourceFile: "2026-01-01 - Statement.pdf" }
  ],
  metadata: {
    loanAmount: null,
    loanTerm: null,
    startDate: null,
    maturityDate: null,
    dueDate: null
  },
  servicer: {
    name: null,
    phone: null,
    email: null
  },
  keyContacts: []
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { mortgageStatementData };
}

if (typeof window !== "undefined") {
  window.mortgageStatementData = mortgageStatementData;
}
