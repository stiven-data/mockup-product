(() => {
  const FIELD_TO_METRIC_KEY = {
    "principal-balance": "mortgage_principal_balance",
    "interest-rate": "mortgage_interest_rate",
    "escrow-amount": "mortgage_escrow_amount",
    "monthly-payment-io-only": "mortgage_monthly_payment_io_only",
    "monthly-payment-with-escrow": "mortgage_monthly_payment_with_escrow",
    "current-interest-due": "mortgage_current_interest_due",
    "current-tax-due": "mortgage_current_tax_due",
    "current-insurance-due": "mortgage_current_insurance_due",
    "total-due": "mortgage_total_due",
    "ending-escrow-balance": "mortgage_ending_escrow_balance",
  };

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

  function applyOverlay() {
    const metricsRuntime = window.ValorisMetrics;
    const fields = getBoundFields();

    for (const field of fields) {
      if (isSelectedRowField(field) && !isInsideSelectedRow(field)) {
        restoreWorkbookValue(field);
        continue;
      }

      const metricKey = FIELD_TO_METRIC_KEY[field.dataset.mortgageField];
      const row = metricKey && metricsRuntime?.getRow ? metricsRuntime.getRow(metricKey) : null;
      applyFieldValue(field, row);
    }
  }

  async function refresh() {
    const metricsRuntime = window.ValorisMetrics;
    const metricKeys = [...new Set(Object.values(FIELD_TO_METRIC_KEY))];

    if (metricsRuntime?.ensureMetricRows) {
      try {
        await metricsRuntime.ensureMetricRows(metricKeys);
      } catch (error) {
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    } else if (metricsRuntime?.refreshMetrics) {
      try {
        await metricsRuntime.refreshMetrics();
      } catch (error) {
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    }

    applyOverlay();
  }

  const bridge = {
    applyOverlay,
    fieldToMetricKey: FIELD_TO_METRIC_KEY,
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
        applyOverlay();
      }
    });
  }
})();
