const mortgageStatementData = {
  asset: {
    name: "Oasis at San Marco",
    location: "Jacksonville, FL"
  },
  statements: [
    { statementDate: "2024-03-09", principalBalance: 10130000, taxEscrow: 66224.54, insuranceEscrow: 57173.96, otherEscrow: 602715.14, totalDue: 101665.26, sourceFile: "CBRE March 2024 Statement.pdf / Manual" },
    { statementDate: "2024-04-01", principalBalance: 10130000, taxEscrow: 66224.54, insuranceEscrow: 57173.96, otherEscrow: 518574.22, totalDue: 101665.26, sourceFile: "CBRE April Statement 2024.pdf" },
    { statementDate: "2024-04-24", principalBalance: 10130000, taxEscrow: 79469.45, insuranceEscrow: 76231.95, otherEscrow: 518394.76, totalDue: 104057.07, sourceFile: "CBRE May Statement 2024.pdf" },
    { statementDate: "2024-05-23", principalBalance: 10130000, taxEscrow: 92714.36, insuranceEscrow: 95289.94, otherEscrow: 518675.08, totalDue: 106448.87, sourceFile: "CBRE June Statement 2024.pdf" },
    { statementDate: "2024-06-24", principalBalance: 10130000, taxEscrow: 105959.27, insuranceEscrow: 114347.93, otherEscrow: 518973.82, totalDue: 104057.07, sourceFile: "2024.06- June Statement.pdf / CBRE June Statement 2024.pdf" },
    { statementDate: "2024-07-24", principalBalance: 10130000, taxEscrow: 119204.18, insuranceEscrow: 133405.92, otherEscrow: 519258.83, totalDue: 106448.87, sourceFile: "2024.07 - July Statement.pdf / CBRE July Statement 2024.pdf" },
    { statementDate: "2024-08-23", principalBalance: 10143176.39, taxEscrow: 132449.09, insuranceEscrow: 152463.91, otherEscrow: 327076.83, totalDue: 106578.43, sourceFile: "2024.08 - August Statement.pdf / CBRE August Statement 2024.pdf" },
    { statementDate: "2024-09-24", principalBalance: 10143064.86, taxEscrow: 145694.0, insuranceEscrow: 171521.9, otherEscrow: 327254.13, totalDue: 104149.61, sourceFile: "2024.09 - September Statement.pdf / CBRE September Statement 2024.pdf" },
    { statementDate: "2024-10-24", principalBalance: 10143064.86, taxEscrow: 158938.91, insuranceEscrow: 190579.89, otherEscrow: 327425.8, totalDue: 106544.5, sourceFile: "2024.10 - October Statement.pdf / CBRE October Statement 2024.pdf" },
    { statementDate: "2024-11-22", principalBalance: 10143064.86, taxEscrow: 15303.08, insuranceEscrow: 209637.88, otherEscrow: 327594.97, totalDue: 104149.61, sourceFile: "2024.11 - November Statement.pdf / CBRE November Statement 2024.pdf" },
    { statementDate: "2024-12-23", principalBalance: 10143064.86, taxEscrow: 28547.99, insuranceEscrow: 228695.87, otherEscrow: 253514.48, totalDue: 32302.9, sourceFile: "2024.12 - December Statement.pdf / 2025-01- January Statement.pdf" },
    { statementDate: "2025-02-21", principalBalance: 10401402.81, taxEscrow: 57481.71, insuranceEscrow: 70144.87, otherEscrow: 209686.31, totalDue: 103758.76, sourceFile: "2025-02-February Statement.pdf" },
    { statementDate: "2025-03-24", principalBalance: 10401402.81, taxEscrow: 73170.17, insuranceEscrow: 88291.41, otherEscrow: 165403.71, totalDue: 109967.49, sourceFile: "2025-03- March Statement.pdf" },
    { statementDate: "2025-04-22", principalBalance: 10401402.81, taxEscrow: 88858.63, insuranceEscrow: 106437.95, otherEscrow: 163018.54, totalDue: 107511.6, sourceFile: "2025-04-  April Statement.pdf" },
    { statementDate: "2025-05-23", principalBalance: 10764854.41, taxEscrow: 104547.09, insuranceEscrow: 64627.13, otherEscrow: 163101.66, totalDue: 112799.38, sourceFile: "2025-05-May Statement.pdf" },
    { statementDate: "2025-06-26", principalBalance: 10764854.41, taxEscrow: 120235.55, insuranceEscrow: 82773.67, otherEscrow: 163187.54, totalDue: 110086.05, sourceFile: "2025-06-June Statement.pdf" },
    { statementDate: "2025-07-24", principalBalance: 10853176.39, taxEscrow: 135924.01, insuranceEscrow: 100920.21, otherEscrow: 163007.64, totalDue: 113545.32, sourceFile: "2025-07- July Statement.pdf" },
    { statementDate: "2025-08-25", principalBalance: 10853176.39, taxEscrow: 151612.47, insuranceEscrow: 119066.75, otherEscrow: 123222.64, totalDue: 113274.22, sourceFile: "2025-08-August Statement.pdf" },
    { statementDate: "2025-09-24", principalBalance: 10853176.39, taxEscrow: 167300.93, insuranceEscrow: 137213.29, otherEscrow: 83957.11, totalDue: 110711.67, sourceFile: "2025-09 - September Statement.pdf" },
    { statementDate: "2025-10-23", principalBalance: 10853176.39, taxEscrow: 182989.39, insuranceEscrow: 155359.83, otherEscrow: 83997.82, totalDue: 113274.22, sourceFile: "2025-10-October Statement.pdf" },
    { statementDate: "2025-11-21", principalBalance: 10853176.39, taxEscrow: 39714.34, insuranceEscrow: 173506.37, otherEscrow: 1031.27, totalDue: 110711.67, sourceFile: "2025-11- November Statement.pdf" },
    { statementDate: "2025-12-23", principalBalance: 10853176.39, taxEscrow: 55402.8, insuranceEscrow: 191652.91, otherEscrow: 1031.76, totalDue: 113274.22, sourceFile: "2025-12-  December Statement.pdf / 2026-01- January Statement.pdf" },
    { statementDate: "2026-01-23", principalBalance: 10853176.39, taxEscrow: 71091.26, insuranceEscrow: 209799.45, otherEscrow: 1032.27, totalDue: 112158.22, sourceFile: "2026-02- February Statement.pdf" }
  ],
  keyContacts: []
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { mortgageStatementData };
}

if (typeof window !== "undefined") {
  window.mortgageStatementData = mortgageStatementData;
}
