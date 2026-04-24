const assert = require("node:assert/strict");
const test = require("node:test");

test("enrichMetricMetadata prefers high-confidence audit labels without mutating metric_key", async () => {
  const { enrichMetricMetadata } = await import("../scripts/ingestion-metadata.mjs");

  const enriched = enrichMetricMetadata(
    {
      module: "gp",
      metric_key: "gp_modules_gp_views_gp_mockups_001",
      label: "$6,047,500",
      value_display: "$6,047,500",
      source_context: "$6,047,500",
    },
    new Map([
      [
        "gp_modules_gp_views_gp_mockups_001",
        {
          metric_key: "gp_modules_gp_views_gp_mockups_001",
          frontend_text_found: "Total Capital Raise (LP)",
          recommended_label: "Total Capital Raise (LP)",
        },
      ],
    ]),
  );

  assert.equal(enriched.metric_key, "gp_modules_gp_views_gp_mockups_001");
  assert.equal(enriched.label, "$6,047,500");
  assert.equal(enriched.display_label, "Total Capital Raise (LP)");
  assert.equal(enriched.search_label, "Total Capital Raise (LP)");
  assert.equal(enriched.ui_context, "Total Capital Raise (LP)");
});

test("enrichMetricMetadata falls back to human source context when label is numeric", async () => {
  const { enrichMetricMetadata } = await import("../scripts/ingestion-metadata.mjs");

  const enriched = enrichMetricMetadata({
    module: "mortgage",
    metric_key: "mortgage_total_due",
    label: "$112,158.22",
    value_display: "$112,158.22",
    source_context: "Total Due",
  });

  assert.equal(enriched.display_label, "Total Due");
  assert.equal(enriched.search_label, "Total Due");
  assert.equal(enriched.ui_context, "Total Due");
});

test("buildIngestionMetrics derives logical GP sponsor summary labels from row and column headers", async () => {
  const { buildIngestionMetrics } = await import("../scripts/extract-ingestion-data.mjs");
  const metrics = await buildIngestionMetrics();
  const byKey = new Map(metrics.map((metric) => [metric.metric_key, metric]));

  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_022").display_label, "Ayesha Khalid | Capital Raised");
  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_023").display_label, "Ayesha Khalid | GP Project %");
  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_024").display_label, "Ayesha Khalid | Est. Acq. Fee");
});

test("buildIngestionMetrics derives logical GP partner roster labels for individual investor rows", async () => {
  const { buildIngestionMetrics } = await import("../scripts/extract-ingestion-data.mjs");
  const metrics = await buildIngestionMetrics();
  const byKey = new Map(metrics.map((metric) => [metric.metric_key, metric]));

  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_034").display_label, "Salvatore Caminito | Amount Invested");
  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_035").display_label, "Salvatore Caminito | % of Total Raise");
  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_064").display_label, "Dipti Lodaya | Amount Invested");
  assert.equal(byKey.get("gp_modules_gp_views_gp_mockups_065").display_label, "Dipti Lodaya | % of Total Raise");
});

test("buildIngestionMetrics derives logical Taxes labels for narrative and historical table values", async () => {
  const { buildIngestionMetrics } = await import("../scripts/extract-ingestion-data.mjs");
  const metrics = await buildIngestionMetrics();
  const byKey = new Map(metrics.map((metric) => [metric.metric_key, metric]));

  assert.equal(byKey.get("taxes_modules_taxes_views_index_008").display_label, "2025 Assessed Value Before Appeal");
  assert.equal(byKey.get("taxes_modules_taxes_views_index_009").display_label, "2025 Assessed Value After Appeal");
  assert.equal(byKey.get("taxes_modules_taxes_views_index_010").display_label, "Owner Benefit After Appeal Fees");
  assert.equal(byKey.get("taxes_modules_taxes_views_index_011").display_label, "Early Payment Discount");
  assert.equal(
    byKey.get("taxes_modules_taxes_views_index_012").display_label,
    "Net Payable After Early Payment Discount",
  );
  assert.equal(byKey.get("taxes_modules_taxes_views_index_055").display_label, "2024 | Non-Ad Valorem");
  assert.equal(byKey.get("taxes_modules_taxes_views_index_056").display_label, "2024 | Grand Total");
});
