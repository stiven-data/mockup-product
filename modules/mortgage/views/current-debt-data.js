// Workbook-backed data snapshot for the mortgage Current Debt view.
// Primary source sheet: "Current Debt"
// Supporting validation sheet: "Monthly Statement" (last non-empty row = 24)
// All displayed values below were copied from:
// mockup-product/modules/mortgage/data/06 - Debt & Financing/07 - Mortgage Database/2026 - 04 - 01 Debt - Financing Database.xlsx

window.currentDebtWorkbookData = {
  label: "Current Debt",
  propertyName: "Park at Pottsburg (Oasis at San Marco)",
  location: "Jacksonville, FL",
  sourceWorkbook:
    "../data/06 - Debt & Financing/07 - Mortgage Database/2026 - 04 - 01 Debt - Financing Database.xlsx",
  sourceNote:
    "CBRE Loan Services Monthly Statement, January 2026, Loan #01-0718075",
  sheetMapping: {
    title: "Current Debt!A1",
    summaryHeaders: "Current Debt!A3:H3",
    summaryRows: "Current Debt!A4:H4",
    details: "Current Debt!A7:B12",
    statementCrossCheck: "Monthly Statement!A24:AC24",
  },
  loans: [
    {
      lender: "The Bancorp Bank, N.A.",
      servicer: "CBRE Loan Services, Inc.",
      loanNumber: "01-0718075",
      principalBalance: 10853176.39,
      interestRate: 0.085,
      loanType: "Interest-Only",
      monthlyPaymentIoOnly: 79439.22,
      monthlyPaymentWithEscrow: 112158.22,
      details: {
        propertyAddress: "4800 Atlantic Blvd., Jacksonville, FL 32207",
        borrowerEntity: "Red Raider 45, LLC",
        maturityDate: "N/A \u2014 see original loan documents",
        remainingTerm: "N/A \u2014 see original loan documents",
        escrowAmount: "$32,719.00 / mo (taxes + insurance impound)",
        statementDate: "January 2026",
      },
      statementSnapshot: {
        statementDate: "2026-01-23",
        dueDate: "2026-02-09",
        currentInterestDue: 79439.22,
        currentTaxDue: 14572.46,
        currentInsuranceDue: 18146.54,
        totalDue: 112158.22,
        endingEscrowBalance: 281922.98,
        sourceFile: "2026-02- February Statement.pdf",
      },
    },
  ],
};
