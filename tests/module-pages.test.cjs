const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

const mortgageBridgePath = path.join(
  __dirname,
  "..",
  "modules/mortgage/views/current-debt-supabase.js",
);
const mortgageBridgeSource = fs.readFileSync(mortgageBridgePath, "utf8");

function createMortgageField({
  field,
  textContent,
  mortgageMissing = "Missing in Supabase",
  mortgageScope,
  closestRow = null,
}) {
  const dataset = {
    mortgageField: field,
    mortgageMissing,
  };
  if (mortgageScope) {
    dataset.mortgageScope = mortgageScope;
  }

  return {
    dataset,
    textContent,
    closest(selector) {
      assert.equal(selector, ".mortgage-loan-row");
      return closestRow;
    },
  };
}

function createLoanRow(isSelected) {
  return {
    getAttribute(name) {
      assert.equal(name, "aria-selected");
      return isSelected ? "true" : "false";
    },
  };
}

async function loadMortgageBridge({ elements, rowsByKey }) {
  const documentEvents = new Map();
  const subscriptions = [];
  let refreshCalls = 0;

  const document = {
    readyState: "complete",
    addEventListener(type, handler) {
      documentEvents.set(type, handler);
    },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-mortgage-field]");
      return elements;
    },
  };

  const window = {
    ValorisMetrics: {
      getRow(metricKey) {
        return rowsByKey.get(metricKey) || null;
      },
      async refreshMetrics() {
        refreshCalls += 1;
      },
      subscribe(listener) {
        subscriptions.push(listener);
        return () => {};
      },
    },
  };
  window.window = window;

  const context = vm.createContext({
    console: {
      warn() {},
    },
    document,
    window,
  });

  new vm.Script(mortgageBridgeSource, {
    filename: mortgageBridgePath,
  }).runInContext(context);

  await new Promise((resolve) => setImmediate(resolve));

  return {
    bridge: window.currentDebtSupabaseBridge,
    refreshCalls,
    subscriptions,
    window,
  };
}

const INSURANCE_METRICS = [
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_001", value_numeric: 99619, value_display: "$99,619", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_002", value_numeric: 209799, value_display: "$209,799", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_003", value_numeric: 10486, value_display: "$10,486", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_004", value_numeric: 15216508, value_display: "$15,216,508", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_005", value_numeric: 13542295, value_display: "$13,542,295", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_006", value_numeric: 40144, value_display: "$40,144", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_007", value_numeric: 15275.2, value_display: "$15,275.20", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_008", value_numeric: 15275, value_display: "$15,275", binding: "data" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_009", value_numeric: 13230, value_display: "$13,230", binding: "data" },
  { metric_key: "insurance_monthly_insurance_trend_mar_25", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_apr_25", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_may_25", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_jun_25", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_jul_25", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_aug_25", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_sep_25", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_oct_25", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_nov_25", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_dec_25", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_jan_26", value_numeric: 8500, value_display: "$8,500.00", binding: "trend" },
  { metric_key: "insurance_monthly_insurance_trend_feb_26", value_numeric: 8500, value_display: "$8,500.00", binding: "trend" },
];

const INSURANCE_TREND_LEGACY_KEYS = {
  insurance_monthly_insurance_trend_mar_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010",
  insurance_monthly_insurance_trend_apr_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_011",
  insurance_monthly_insurance_trend_may_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_012",
  insurance_monthly_insurance_trend_jun_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_013",
  insurance_monthly_insurance_trend_jul_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_014",
  insurance_monthly_insurance_trend_aug_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_015",
  insurance_monthly_insurance_trend_sep_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_016",
  insurance_monthly_insurance_trend_oct_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_017",
  insurance_monthly_insurance_trend_nov_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_018",
  insurance_monthly_insurance_trend_dec_25: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_019",
  insurance_monthly_insurance_trend_jan_26: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_020",
  insurance_monthly_insurance_trend_feb_26: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_021",
};

test("taxes page loads the shared metrics runtime and contains metric bindings", () => {
  const html = read("modules/taxes/views/index.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /data-metric-key=/);
});

test("gp page loads the shared metrics runtime and binds manual count fields", () => {
  const html = read("modules/Gp/views/gp mockups.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /gp_total_gp_sponsors/);
  assert.match(html, /gp_k1_partners_in_manager_entity/);
  assert.match(html, /gp_source_k1_year/);
  assert.doesNotMatch(html, /data-semantic-identifier=/);
  assert.doesNotMatch(html, /data-fallback-metric-keys=/);
});

test("insurance page loads the shared metrics runtime and binds insurance metrics", () => {
  const html = read("modules/insurance/views/insurance_command_center_oasis_trusted.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /data-metric-key="insurance_modules_insurance_views_insurance_command_center_oasis_trusted_001"/);
  assert.match(html, /window\.ValorisMetrics/);
  assert.match(html, /Missing in Supabase/);
  assert.match(html, /metricKey: "insurance_monthly_insurance_trend_mar_25"/);
  assert.match(html, /ensureModuleRows\("insurance"\)/);
  assert.match(html, /getMetricValue\(rows, \{/);
  assert.doesNotMatch(html, /fallbackMetricKeys:/);
  assert.doesNotMatch(html, /insurance_expense_[a-z]{3}_[0-9]{4}/);
  assert.doesNotMatch(html, /fallbackDisplay/);
  assert.match(html, /function escapeHtml\(value\)/);
  assert.ok(html.indexOf("supabase-data.js") < html.indexOf("const insuranceTrendData"));
});

test("insurance metric bindings stay aligned with seeded outputs", () => {
  const html = read("modules/insurance/views/insurance_command_center_oasis_trusted.html");
  const csv = read("supabase/ingestion_data.csv");
  const sql = read("supabase/seed_ingestion_data.sql");

  for (const metric of INSURANCE_METRICS) {
    const escapedDisplay = metric.value_display
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const htmlPattern = metric.binding === "data"
      ? new RegExp(
          `data-metric-key="${metric.metric_key}"[^>]*>${escapedDisplay}<`,
        )
      : new RegExp(`metricKey: "${metric.metric_key}"`);

    assert.match(html, htmlPattern);

    if (metric.binding === "data") {
      const csvPattern = new RegExp(
        `^insurance,${metric.metric_key},.*?,${metric.value_numeric},"?${escapedDisplay}"?,currency,USD,`,
        "m",
      );
      const sqlPattern = new RegExp(
        `'insurance', '${metric.metric_key}'.*?, ${metric.value_numeric}, '${escapedDisplay}', 'currency'`,
      );

      assert.match(csv, csvPattern);
      assert.match(sql, sqlPattern);
    }
  }
});

test("seed artifacts include improved ingestion_data metadata columns", () => {
  const csv = read("supabase/ingestion_data.csv");
  const sql = read("supabase/seed_ingestion_data.sql");
  const schema = read("supabase/schema.sql");
  const metadataOnly = read("supabase/setup_metadata_only.sql");

  assert.match(
    csv,
    /^module,metric_key,legacy_metric_key,label,display_label,search_label,value_numeric,/
  );
  assert.match(
    sql,
    /insert into ingestion_data \(\s+module,\s+metric_key,\s+legacy_metric_key,\s+label,\s+display_label,\s+search_label,/m
  );
  assert.match(schema, /add column if not exists display_label text;/);
  assert.match(schema, /add column if not exists search_label text;/);
  assert.match(schema, /add column if not exists ui_context text;/);
  assert.match(metadataOnly, /on conflict \(metric_key\) do update set/);
  assert.doesNotMatch(metadataOnly, /value_numeric = excluded\.value_numeric/);
  assert.doesNotMatch(metadataOnly, /value_display = excluded\.value_display/);
  assert.doesNotMatch(metadataOnly, /source_context = excluded\.source_context/);
});

test("seeded display labels avoid noisy html/table fragments", () => {
  const csv = read("supabase/ingestion_data.csv");
  assert.doesNotMatch(csv, /display_label[^\n]*Yes N\/A N\/A/);
  assert.doesNotMatch(csv, /,[^,\n]*<th scope=/);
  assert.doesNotMatch(csv, /,[^,\n]*<tbody aria-label=/);
});

test("mortgage page loads the shared runtime and mortgage overlay bridge", () => {
  const html = read("modules/mortgage/views/index.html");

  assert.match(html, /supabase-data\.js/);
  assert.match(html, /current-debt-supabase\.js/);
  assert.match(html, /"principal-balance"/);
  assert.match(html, /"interest-rate"/);
  assert.match(html, /"escrow-amount"/);
  assert.match(html, /"monthly-payment-io-only"/);
  assert.match(html, /"monthly-payment-with-escrow"/);
  assert.match(html, /"current-interest-due"/);
  assert.match(html, /"current-tax-due"/);
  assert.match(html, /"current-insurance-due"/);
  assert.match(html, /"total-due"/);
  assert.match(html, /"ending-escrow-balance"/);
  assert.match(html, /data-mortgage-field="\$\{escapeHtml\(field\)\}"/);
  assert.match(html, /data-mortgage-scope="\$\{escapeHtml\(scope\)\}"/);
  assert.match(html, /"selected-row"/);
  assert.match(html, /Missing in Supabase/);
  assert.match(html, /window\.currentDebtSupabaseBridge/);
});

test("mortgage bridge only overlays selected-row duplicates and keeps other workbook cells intact", async () => {
  const selectedRow = createLoanRow(true);
  const unselectedRow = createLoanRow(false);
  const topCardField = createMortgageField({
    field: "principal-balance",
    textContent: "$10,853,176.39",
  });
  const selectedTableField = createMortgageField({
    field: "principal-balance",
    textContent: "$10,853,176.39",
    mortgageScope: "selected-row",
    closestRow: selectedRow,
  });
  const unselectedTableField = createMortgageField({
    field: "principal-balance",
    textContent: "$9,999,999.99",
    mortgageScope: "selected-row",
    closestRow: unselectedRow,
  });

  const runtime = await loadMortgageBridge({
    elements: [topCardField, selectedTableField, unselectedTableField],
    rowsByKey: new Map([
      [
        "mortgage_principal_balance",
        {
          metric_key: "mortgage_principal_balance",
          value_display: "$11,000,000.00",
        },
      ],
    ]),
  });

  assert.equal(runtime.refreshCalls, 1);
  assert.equal(topCardField.textContent, "$11,000,000.00");
  assert.equal(selectedTableField.textContent, "$11,000,000.00");
  assert.equal(unselectedTableField.textContent, "$9,999,999.99");

  runtime.subscriptions[0]({ type: "metric:change" });

  assert.equal(topCardField.textContent, "$11,000,000.00");
  assert.equal(selectedTableField.textContent, "$11,000,000.00");
  assert.equal(unselectedTableField.textContent, "$9,999,999.99");
});

test("gp manual metric bindings stay aligned with seeded outputs", async () => {
  const { GP_MANUAL_METRICS } = await import("../scripts/extract-ingestion-data.mjs");
  const html = read("modules/Gp/views/gp mockups.html");
  const csv = read("supabase/ingestion_data.csv");
  const sql = read("supabase/seed_ingestion_data.sql");

  for (const manualMetric of GP_MANUAL_METRICS) {
    const htmlPattern = new RegExp(
      `data-metric-key="${manualMetric.metric_key}"[^>]*>${manualMetric.value_display}<`,
    );
    const csvPattern = new RegExp(
      `^gp,${manualMetric.metric_key},.*?,${manualMetric.value_numeric},${manualMetric.value_display},number,`,
      "m",
    );
    const sqlPattern = new RegExp(
      `'gp', '${manualMetric.metric_key}'.*?, ${manualMetric.value_numeric}, '${manualMetric.value_display}', 'number'`,
    );

    assert.match(html, htmlPattern);
    assert.match(csv, csvPattern);
    assert.match(sql, sqlPattern);
  }
});

test("curated seed artifacts include legacy metric keys for insurance trend migration", () => {
  const csv = read("supabase/ingestion_data.csv");
  const sql = read("supabase/seed_ingestion_data.sql");

  assert.match(
    csv,
    /^module,metric_key,legacy_metric_key,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context$/m
  );
  for (const [metricKey, legacyMetricKey] of Object.entries(INSURANCE_TREND_LEGACY_KEYS)) {
    const escapedMetricKey = metricKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedLegacyMetricKey = legacyMetricKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(csv, new RegExp(`^[^,]+,${escapedMetricKey},${escapedLegacyMetricKey},`, "m"));
    assert.match(sql, new RegExp(`'${escapedMetricKey}', '${escapedLegacyMetricKey}',`));
  }
});

test("buildIngestionMetrics assigns legacy metric keys to curated insurance trend rows", async () => {
  const { buildIngestionMetrics } = await import("../scripts/extract-ingestion-data.mjs");
  const metrics = await buildIngestionMetrics();

  for (const [metricKey, legacyMetricKey] of Object.entries(INSURANCE_TREND_LEGACY_KEYS)) {
    const metric = metrics.find((row) => row.metric_key === metricKey);
    assert.ok(metric, `Expected curated metric ${metricKey} to be generated`);
    assert.equal(metric.legacy_metric_key, legacyMetricKey);
  }
});

test("curated metric definitions carry legacy metric keys without a later patch pass", async () => {
  const source = read("scripts/extract-ingestion-data.mjs");
  const { GP_MANUAL_METRICS } = await import("../scripts/extract-ingestion-data.mjs");

  assert.doesNotMatch(source, /semantic_identifier/);

  for (const manualMetric of GP_MANUAL_METRICS) {
    assert.equal(
      manualMetric.legacy_metric_key,
      null,
      `Expected ${manualMetric.metric_key} to avoid legacy key baggage`,
    );
  }
});
