const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
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
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_011", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_012", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_013", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_014", value_numeric: 16496.85, value_display: "$16,496.85", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_015", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_016", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_017", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_018", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_019", value_numeric: 20353.19, value_display: "$20,353.19", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_020", value_numeric: 8500, value_display: "$8,500.00", binding: "trend" },
  { metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_021", value_numeric: 8500, value_display: "$8,500.00", binding: "trend" },
];

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
});

test("insurance page loads the shared metrics runtime and binds insurance metrics", () => {
  const html = read("modules/insurance/views/insurance_command_center_oasis_trusted.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /data-metric-key="insurance_modules_insurance_views_insurance_command_center_oasis_trusted_001"/);
  assert.match(html, /window\.ValorisMetrics/);
  assert.match(html, /Missing in Supabase/);
  assert.match(html, /insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010/);
  assert.doesNotMatch(html, /insurance_expense_[a-z]{3}_[0-9]{4}/);
  assert.doesNotMatch(html, /fallbackDisplay/);
  assert.match(html, /function escapeHtml\(value\)/);
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
    const csvPattern = new RegExp(
      `^insurance,${metric.metric_key},.*?,${metric.value_numeric},"?${escapedDisplay}"?,currency,USD,`,
      "m",
    );
    const sqlPattern = new RegExp(
      `'insurance', '${metric.metric_key}'.*?, ${metric.value_numeric}, '${escapedDisplay}', 'currency'`,
    );

    assert.match(html, htmlPattern);
    assert.match(csv, csvPattern);
    assert.match(sql, sqlPattern);
  }
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
  assert.match(html, /Missing in Supabase/);
  assert.match(html, /window\.currentDebtSupabaseBridge/);
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
