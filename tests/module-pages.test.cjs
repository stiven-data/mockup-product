const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

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
