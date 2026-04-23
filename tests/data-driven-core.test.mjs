import assert from "node:assert/strict";
import test from "node:test";

import {
  annotateHtmlMetrics,
  injectMetricsRuntime,
  extractHtmlMetrics,
  normalizeDisplayValue,
  repairTextArtifacts,
  parseDisplayValue,
} from "../scripts/data-driven-core.mjs";

test("extractHtmlMetrics finds visible financial metrics and ignores CSS", () => {
  const html = `
    <style>.card{width:100%;color:#123456}</style>
    <main>
      <strong>$8,600,000</strong>
      <span>35%</span>
      <p>Escrow amount $32,719.00 / mo</p>
    </main>`;

  const metrics = extractHtmlMetrics(html, {
    module: "taxes",
    sourceFile: "modules/taxes/views/index.html",
  });

  assert.deepEqual(
    metrics.map((metric) => metric.value_display),
    ["$8,600,000", "35%", "$32,719.00"],
  );
  assert.equal(metrics[0].metric_key, "taxes_modules_taxes_views_index_001");
  assert.equal(metrics[1].metric_key, "taxes_modules_taxes_views_index_002");
  assert.equal(metrics[2].value_numeric, 32719);
});

test("annotateHtmlMetrics wraps matching values with missing metric metadata", () => {
  const html = `<main><strong>$8,600,000</strong><span>35%</span></main>`;
  const { html: annotatedHtml, metrics } = annotateHtmlMetrics(html, {
    module: "taxes",
    sourceFile: "modules/taxes/views/index.html",
  });

  assert.match(
    annotatedHtml,
    /<span data-metric-key="taxes_modules_taxes_views_index_001" data-metric-missing="Missing in Supabase">\$8,600,000<\/span>/,
  );
  assert.match(
    annotatedHtml,
    /<span data-metric-key="taxes_modules_taxes_views_index_002" data-metric-missing="Missing in Supabase">35%<\/span>/,
  );
  assert.equal(metrics.length, 2);
});

test("injectMetricsRuntime appends the runtime once before the closing body tag", () => {
  const html = "<html><body><main>Hi</main></body></html>";
  const injected = injectMetricsRuntime(html, "../../../assets/js/supabase-data.js");

  assert.match(
    injected,
    /<script src="\.\.\/\.\.\/\.\.\/assets\/js\/supabase-data\.js"><\/script><\/body><\/html>$/,
  );

  assert.equal(
    injectMetricsRuntime(injected, "../../../assets/js/supabase-data.js"),
    injected,
  );
});

test("parseDisplayValue supports currency and percentages", () => {
  assert.deepEqual(parseDisplayValue("$15,275.20"), {
    value_numeric: 15275.2,
    value_type: "currency",
    currency: "USD",
  });
  assert.deepEqual(parseDisplayValue("2.6623%"), {
    value_numeric: 2.6623,
    value_type: "percent",
    currency: null,
  });
});

test("extractHtmlMetrics excludes surrounding punctuation from currency values", () => {
  const html = `<p>Value moved from $9,143,000 to $8,600,000, lowering payable.</p>`;

  const metrics = extractHtmlMetrics(html, {
    module: "taxes",
    sourceFile: "modules/taxes/views/index.html",
  });

  assert.deepEqual(
    metrics.map((metric) => metric.value_display),
    ["$9,143,000", "$8,600,000"],
  );
});

test("normalizeDisplayValue returns a clean fallback for empty or broken placeholders", () => {
  assert.equal(normalizeDisplayValue(null), "-");
  assert.equal(normalizeDisplayValue(undefined), "-");
  assert.equal(normalizeDisplayValue(""), "-");
  assert.equal(normalizeDisplayValue("   "), "-");
  assert.equal(normalizeDisplayValue("â€”"), "-");
  assert.equal(normalizeDisplayValue("undefined"), "-");
  assert.equal(normalizeDisplayValue("NaN"), "-");
});

test("repairTextArtifacts fixes common mojibake without blanking meaningful text", () => {
  assert.equal(repairTextArtifacts("2024 Kâ€‘1"), "2024 K-1");
  assert.equal(repairTextArtifacts("Marâ€“Jul 2025"), "Mar-Jul 2025");
  assert.equal(repairTextArtifacts("Oasis at San Marco Â· 4800 Atlantic"), "Oasis at San Marco - 4800 Atlantic");
});
