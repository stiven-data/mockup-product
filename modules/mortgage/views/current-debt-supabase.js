(() => {
  const FIELD_LOOKUPS = {
    "principal-balance": {
      key: "mortgage.principal_balance",
      fallbackMetricKeys: ["mortgage_principal_balance"],
    },
    "interest-rate": {
      key: "mortgage.interest_rate",
      fallbackMetricKeys: ["mortgage_interest_rate"],
    },
    "escrow-amount": {
      key: "mortgage.escrow_amount",
      fallbackMetricKeys: ["mortgage_escrow_amount"],
    },
    "monthly-payment-io-only": {
      key: "mortgage.monthly_payment_io_only",
      fallbackMetricKeys: ["mortgage_monthly_payment_io_only"],
    },
    "monthly-payment-with-escrow": {
      key: "mortgage.monthly_payment_with_escrow",
      fallbackMetricKeys: ["mortgage_monthly_payment_with_escrow"],
    },
    "current-interest-due": {
      key: "mortgage.current_interest_due",
      fallbackMetricKeys: ["mortgage_current_interest_due"],
    },
    "current-tax-due": {
      key: "mortgage.current_tax_due",
      fallbackMetricKeys: ["mortgage_current_tax_due"],
    },
    "current-insurance-due": {
      key: "mortgage.current_insurance_due",
      fallbackMetricKeys: ["mortgage_current_insurance_due"],
    },
    "total-due": {
      key: "mortgage.total_due",
      fallbackMetricKeys: ["mortgage_total_due"],
    },
    "ending-escrow-balance": {
      key: "mortgage.ending_escrow_balance",
      fallbackMetricKeys: ["mortgage_ending_escrow_balance"],
    },
  };
  let currentRows = [];

  function getBoundFields() {
    return Array.from(document.querySelectorAll("[data-mortgage-field]"));
  }

  function getMissingDisplay(element) {
    return element.dataset.mortgageMissing || "Missing in Supabase";
  }

  function rememberWorkbookValue(element) {
    if (!Object.prototype.hasOwnProperty.call(element.dataset, "mortgageWorkbookValue")) {
      element.dataset.mortgageWorkbookValue = element.textContent;
    }
    return element.dataset.mortgageWorkbookValue;
  }

  function clearOverlayMetadata(element) {
    delete element.dataset.sourceFile;
    delete element.dataset.sourceContext;
  }

  function restoreWorkbookValue(element) {
    element.textContent = rememberWorkbookValue(element);
    clearOverlayMetadata(element);
  }

  function isSelectedRowField(element) {
    return element.dataset.mortgageScope === "selected-row";
  }

  function isInsideSelectedRow(element) {
    return element.closest(".mortgage-loan-row")?.getAttribute("aria-selected") === "true";
  }

  function applyFieldValue(element, row) {
    rememberWorkbookValue(element);
    element.textContent = row?.value_display || getMissingDisplay(element);

    if (row?.source_file) {
      element.dataset.sourceFile = row.source_file;
    } else {
      delete element.dataset.sourceFile;
    }

    if (row?.source_context) {
      element.dataset.sourceContext = row.source_context;
    } else {
      delete element.dataset.sourceContext;
    }
  }

  function applyOverlay(rows = currentRows) {
    const metricsRuntime = window.ValorisMetrics;
    const fields = getBoundFields();

    for (const field of fields) {
      if (isSelectedRowField(field) && !isInsideSelectedRow(field)) {
        restoreWorkbookValue(field);
        continue;
      }

      const lookup = FIELD_LOOKUPS[field.dataset.mortgageField];
      const row = lookup && metricsRuntime?.getMetricRow
        ? metricsRuntime.getMetricRow(rows, lookup)
        : null;
      applyFieldValue(field, row);
    }
  }

  async function refresh() {
    const metricsRuntime = window.ValorisMetrics;

    if (metricsRuntime?.ensureModuleRows) {
      try {
        currentRows = await metricsRuntime.ensureModuleRows("mortgage");
      } catch (error) {
        currentRows = [];
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    } else if (metricsRuntime?.refreshMetrics) {
      try {
        await metricsRuntime.refreshMetrics();
      } catch (error) {
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    }

    applyOverlay(currentRows);
  }

  const bridge = {
    applyOverlay,
    fieldLookups: FIELD_LOOKUPS,
    refresh,
  };

  window.currentDebtSupabaseBridge = bridge;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refresh, { once: true });
  } else {
    refresh();
  }

  if (window.ValorisMetrics?.subscribe) {
    window.ValorisMetrics.subscribe((event) => {
      if (event.type === "metric:loaded" || event.type === "metric:change") {
        refresh();
      }
    });
  }
})();
