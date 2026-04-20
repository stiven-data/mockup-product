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
  keyContacts: []
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { mortgageStatementData };
}

if (typeof window !== "undefined") {
  window.mortgageStatementData = mortgageStatementData;
}
