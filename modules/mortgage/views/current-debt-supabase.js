(() => {
  const FIELD_LOOKUPS = {
    "principal-balance": {
      metricKey: "mortgage_principal_balance",
    },
    "interest-rate": {
      metricKey: "mortgage_interest_rate",
    },
    "escrow-amount": {
      metricKey: "mortgage_escrow_amount",
    },
    "monthly-payment-io-only": {
      metricKey: "mortgage_monthly_payment_io_only",
    },
    "monthly-payment-with-escrow": {
      metricKey: "mortgage_monthly_payment_with_escrow",
    },
    "current-interest-due": {
      metricKey: "mortgage_current_interest_due",
    },
    "current-tax-due": {
      metricKey: "mortgage_current_tax_due",
    },
    "current-insurance-due": {
      metricKey: "mortgage_current_insurance_due",
    },
    "total-due": {
      metricKey: "mortgage_total_due",
    },
    "ending-escrow-balance": {
      metricKey: "mortgage_ending_escrow_balance",
    },
  };
  let currentRows = [];

  function getCachedMortgageRows(metricsRuntime = window.ValorisMetrics) {
    if (!metricsRuntime?.getRows) {
      return currentRows;
    }

    return metricsRuntime.getRows().filter((row) => row?.module === "mortgage");
  }

  function resolveMetricRow(metricsRuntime, rows, lookup) {
    if (!lookup) {
      return null;
    }

    if (metricsRuntime?.getMetricRow) {
      return metricsRuntime.getMetricRow(rows, lookup);
    }

    if (metricsRuntime?.getRow) {
      return metricsRuntime.getRow(lookup.metricKey) || null;
    }

    return null;
  }

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
      const row = resolveMetricRow(metricsRuntime, rows, lookup);
      applyFieldValue(field, row);
    }
  }

  async function refresh() {
    const metricsRuntime = window.ValorisMetrics;

    if (metricsRuntime?.ensureModuleRows) {
      try {
        currentRows = await metricsRuntime.ensureModuleRows("mortgage");
      } catch (error) {
        currentRows = getCachedMortgageRows(metricsRuntime);
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    } else if (metricsRuntime?.refreshMetrics) {
      try {
        await metricsRuntime.refreshMetrics();
        currentRows = getCachedMortgageRows(metricsRuntime);
      } catch (error) {
        currentRows = getCachedMortgageRows(metricsRuntime);
        console.warn("[mortgage] Supabase overlay refresh failed.", error);
      }
    } else {
      currentRows = getCachedMortgageRows(metricsRuntime);
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
        currentRows = getCachedMortgageRows(window.ValorisMetrics);
        applyOverlay(currentRows);
      }
    });
  }
})();
