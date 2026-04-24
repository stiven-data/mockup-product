# Testing Supabase Dynamic Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `Testing` branch module pages read displayed value fields from Supabase through the existing Vercel API/runtime, while surfacing `Missing in Supabase` for bound fields that do not have a matching row.

**Architecture:** Reuse the existing `api/metrics.js` and `assets/js/supabase-data.js` flow. Static pages (`taxes`, `insurance`, `Gp`) will be annotated with stable metric keys and the shared runtime script; `insurance` gets an extra inline-trend bridge; `mortgage` keeps its workbook-driven layout but adds a focused Supabase overlay after render. Seed-generation scripts remain the source for `supabase/ingestion_data.csv` and `supabase/seed_ingestion_data.sql`.

**Tech Stack:** Static HTML, vanilla JavaScript, Supabase REST + Realtime, Vercel serverless functions, Node `--test`, PowerShell

---

## File Structure

- Modify: `assets/js/supabase-data.js`
  - Honor explicit missing-state metadata on bound fields instead of silently preserving static fallbacks.
- Modify: `scripts/data-driven-core.mjs`
  - Emit richer metric wrappers for static pages and expose a helper to inject the shared runtime script.
- Modify: `scripts/annotate-metrics.mjs`
  - Apply richer annotations and inject the shared runtime into static module pages.
- Modify: `scripts/extract-ingestion-data.mjs`
  - Regenerate seed artifacts and append manual rows for bound values that the HTML extractor does not discover automatically.
- Modify: `modules/taxes/views/index.html`
  - Become an annotated static page driven by the shared runtime.
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
  - Become an annotated static page and update the inline trend rendering to read Supabase-backed values.
- Modify: `modules/Gp/views/gp mockups.html`
  - Become an annotated static page and bind the non-currency counts that the extractor misses.
- Modify: `modules/mortgage/views/index.html`
  - Add stable field hooks for the mortgage overlay and load the shared runtime/bridge script.
- Create: `modules/mortgage/views/current-debt-supabase.js`
  - Apply Supabase rows to the already-rendered mortgage DOM.
- Modify: `tests/data-driven-core.test.mjs`
  - Cover richer annotation output and runtime-script injection helpers.
- Create: `tests/module-pages.test.cjs`
  - Guard that the HTML modules are wired for the shared runtime and contain expected bound fields.
- Create: `tests/supabase-data-runtime.test.cjs`
  - Exercise the shared runtime in a VM-backed fake DOM and verify missing-state behavior.
- Modify: `supabase/ingestion_data.csv`
  - Regenerated seed artifact.
- Modify: `supabase/seed_ingestion_data.sql`
  - Regenerated seed artifact.
- Reference: `docs/specs/2026-04-23-testing-supabase-dynamic-values-design.md`

## Task 1: Strengthen annotation tooling for static module pages

**Files:**
- Modify: `scripts/data-driven-core.mjs`
- Modify: `scripts/annotate-metrics.mjs`
- Modify: `tests/data-driven-core.test.mjs`

- [ ] **Step 1: Write the failing tests for richer metric wrappers and runtime injection**

```js
import assert from "node:assert/strict";
import test from "node:test";

import {
  annotateHtmlMetrics,
  injectMetricsRuntime,
} from "../scripts/data-driven-core.mjs";

test("annotateHtmlMetrics adds missing-state metadata to bound values", () => {
  const { html } = annotateHtmlMetrics(`<main><strong>$8,600,000</strong></main>`, {
    module: "taxes",
    sourceFile: "modules/taxes/views/index.html",
  });

  assert.match(
    html,
    /<span data-metric-key="taxes_modules_taxes_views_index_001" data-metric-missing="Missing in Supabase">\$8,600,000<\/span>/,
  );
});

test("injectMetricsRuntime appends the shared runtime script once", () => {
  const html = injectMetricsRuntime("<body><main>Metrics</main></body>", "../../../assets/js/supabase-data.js");

  assert.match(html, /<script src="\.\.\/\.\.\/\.\.\/assets\/js\/supabase-data\.js"><\/script>/);
  assert.equal(
    injectMetricsRuntime(html, "../../../assets/js/supabase-data.js").match(/supabase-data\.js/g)?.length,
    1,
  );
});
```

- [ ] **Step 2: Run the focused test file and verify it fails**

Run:

```powershell
node --test .\tests\data-driven-core.test.mjs
```

Expected: FAIL because `injectMetricsRuntime` does not exist yet and the annotation output does not include `data-metric-missing`.

- [ ] **Step 3: Add the richer wrapper and runtime injection helper**

```js
export function annotateHtmlMetrics(html, options) {
  const metrics = [];
  const parts = splitProtectedBlocks(html);
  const annotatedParts = parts.map((part) => {
    if (part.protected) return part.content;

    return part.content.replace(TAG_OR_TEXT_PATTERN, (segment) => {
      if (segment.startsWith("<")) return segment;

      return segment.replace(MONEY_OR_PERCENT_PATTERN, (valueDisplay) => {
        const metric = buildMetric(valueDisplay, options, metrics.length + 1, segment);
        metrics.push(metric);
        return `<span data-metric-key="${metric.metric_key}" data-metric-missing="Missing in Supabase">${valueDisplay}</span>`;
      });
    });
  });

  return {
    html: annotatedParts.join(""),
    metrics,
  };
}

export function injectMetricsRuntime(html, runtimePath) {
  if (html.includes(runtimePath)) return html;
  const scriptTag = `<script src="${runtimePath}"></script>`;
  return html.replace("</body>", `    ${scriptTag}\n  </body>`);
}
```

```js
import { annotateHtmlMetrics, injectMetricsRuntime, moduleFromPath } from "./data-driven-core.mjs";

const RUNTIME_PATH = "../../../assets/js/supabase-data.js";

for (const sourceFile of HTML_FILES) {
  const html = await readFile(sourceFile, "utf8");
  const alreadyAnnotated = html.includes("data-metric-key=");
  const baseHtml = alreadyAnnotated ? html : annotateHtmlMetrics(html, {
    module: moduleFromPath(sourceFile),
    sourceFile,
  }).html;
  const finalHtml = injectMetricsRuntime(baseHtml, RUNTIME_PATH);
  await writeFile(sourceFile, finalHtml, "utf8");
}
```

- [ ] **Step 4: Re-run the focused tests and verify they pass**

Run:

```powershell
node --test .\tests\data-driven-core.test.mjs
```

Expected: PASS with the new wrapper and helper tests green.

- [ ] **Step 5: Commit**

```powershell
git add .\scripts\data-driven-core.mjs .\scripts\annotate-metrics.mjs .\tests\data-driven-core.test.mjs
git commit -m "test: strengthen static metric annotation tooling"
```

## Task 2: Make the shared runtime surface missing-state values instead of static fallbacks

**Files:**
- Modify: `assets/js/supabase-data.js`
- Create: `tests/supabase-data-runtime.test.cjs`

- [ ] **Step 1: Write the failing runtime test in a VM-backed fake DOM**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createElement(metricKey, textContent = "$1.00") {
  return {
    dataset: {
      metricKey,
      metricMissing: "Missing in Supabase",
    },
    textContent,
    title: "",
    parentElement: { tagName: "STRONG" },
  };
}

function loadRuntime(rows) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "assets", "js", "supabase-data.js"),
    "utf8",
  );
  const elements = [createElement("insurance_modules_insurance_views_insurance_command_center_oasis_trusted_001")];
  const context = {
    console,
    NodeFilter: { SHOW_TEXT: 4, FILTER_REJECT: 2, FILTER_ACCEPT: 1 },
    fetch: async () => ({
      ok: true,
      json: async () => ({ data: rows }),
    }),
    window: {
      location: { origin: "https://example.test" },
      addEventListener() {},
    },
    document: {
      readyState: "loading",
      addEventListener() {},
      body: {},
      querySelectorAll(selector) {
        return selector === "[data-metric-key]" ? elements : [];
      },
    },
  };

  vm.createContext(context);
  vm.runInContext(source, context);
  return { runtime: context.window.ValorisMetrics, elements };
}

test("loadDynamicMetrics shows a missing-state token when Supabase returns no rows", async () => {
  const { runtime, elements } = loadRuntime([]);
  await runtime.loadDynamicMetrics();
  assert.equal(elements[0].textContent, "Missing in Supabase");
});

test("loadDynamicMetrics prefers the Supabase value_display when a row exists", async () => {
  const { runtime, elements } = loadRuntime([
    {
      metric_key: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_001",
      value_display: "$99,619",
      source_file: "modules/insurance/views/insurance_command_center_oasis_trusted.html",
      source_context: "$99,619",
    },
  ]);
  await runtime.loadDynamicMetrics();
  assert.equal(elements[0].textContent, "$99,619");
});
```

- [ ] **Step 2: Run the runtime test and verify it fails**

Run:

```powershell
node --test .\tests\supabase-data-runtime.test.cjs
```

Expected: FAIL because the runtime currently preserves the original static text when no row is returned.

- [ ] **Step 3: Update the runtime to honor explicit missing-state metadata**

```js
function applyMetricRowToElement(element, row) {
  const missingValue = normalizeDisplayValue(element.dataset.metricMissing, "Missing in Supabase");
  const nextValue = row ? normalizeDisplayValue(row.value_display, missingValue) : missingValue;
  element.textContent = nextValue;

  if (!row) {
    element.title = "";
    element.dataset.sourceFile = "";
    element.dataset.sourceContext = "";
    return;
  }

  const trace = buildSourceTrace(row);
  if (trace) {
    element.title = trace;
    element.dataset.sourceFile = row.source_file || "";
    element.dataset.sourceContext = row.source_context || "";
  }
}

async function loadDynamicMetrics() {
  repairStaticArtifactsInDom();

  const elements = Array.from(document.querySelectorAll("[data-metric-key]"));
  if (!elements.length) return;

  const uniqueKeys = [...new Set(elements.map((element) => element.dataset.metricKey).filter(Boolean))];
  if (!uniqueKeys.length) return;

  try {
    const rows = (
      await Promise.all(chunk(uniqueKeys, BATCH_SIZE).map((keys) => fetchMetricBatch(keys)))
    ).flat();

    rememberRows(rows);
    applyRowsToPage(rows);
    emit("metric:loaded", rows);
  } catch (error) {
    console.warn("[metrics-runtime] Falling back to missing-state values.", error);
    applyRowsToPage([]);
  }
}
```

- [ ] **Step 4: Run the runtime test again and verify it passes**

Run:

```powershell
node --test .\tests\supabase-data-runtime.test.cjs
```

Expected: PASS with both the missing-row and populated-row scenarios green.

- [ ] **Step 5: Commit**

```powershell
git add .\assets\js\supabase-data.js .\tests\supabase-data-runtime.test.cjs
git commit -m "feat: surface missing supabase values in runtime"
```

## Task 3: Annotate Taxes and GP, and extend seed generation for GP counts the extractor misses

**Files:**
- Modify: `modules/taxes/views/index.html`
- Modify: `modules/Gp/views/gp mockups.html`
- Modify: `scripts/extract-ingestion-data.mjs`
- Create: `tests/module-pages.test.cjs`
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`

- [ ] **Step 1: Write the failing structural tests for static-module wiring**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

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
```

- [ ] **Step 2: Run the structural test file and verify it fails**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: FAIL because neither page is wired to the runtime and the GP manual count keys do not exist yet.

- [ ] **Step 3: Annotate the static pages and append the GP manual metrics to the seed generator**

```js
const gpMetrics = [
  metric("gp", "gp_total_gp_sponsors", "Total GP Sponsors (PPC)", 6, "6", "number", "modules/Gp/views/gp mockups.html"),
  metric("gp", "gp_k1_partners_in_manager_entity", "K-1 Partners in Manager Entity", 8, "8", "number", "modules/Gp/views/gp mockups.html"),
  metric("gp", "gp_source_k1_year", "Source K-1 Year", 2024, "2024", "number", "modules/Gp/views/gp mockups.html"),
];

const metrics = [...htmlMetrics, ...mortgageMetrics, ...gpMetrics];
```

```html
<div class="gp-detail-row">
  <dt class="meta-label gp-detail-term">Total GP Sponsors (PPC)</dt>
  <dd class="gp-detail-value"><strong><span data-metric-key="gp_total_gp_sponsors" data-metric-missing="Missing in Supabase">6</span></strong></dd>
</div>
<div class="gp-detail-row">
  <dt class="meta-label gp-detail-term">K-1 Partners in Manager Entity</dt>
  <dd class="gp-detail-value"><strong><span data-metric-key="gp_k1_partners_in_manager_entity" data-metric-missing="Missing in Supabase">8</span></strong></dd>
</div>
<div class="gp-detail-row">
  <dt class="meta-label gp-detail-term">Source K-1 Year</dt>
  <dd class="gp-detail-value"><strong><span data-metric-key="gp_source_k1_year" data-metric-missing="Missing in Supabase">2024</span></strong></dd>
</div>
```

Run:

```powershell
node .\scripts\annotate-metrics.mjs
node .\scripts\extract-ingestion-data.mjs
```

Expected: the taxes and GP pages now contain `data-metric-key` bindings plus the shared runtime script, and the regenerated seed files include the GP manual count rows.

- [ ] **Step 4: Re-run the structural tests and the existing data-core tests**

Run:

```powershell
node --test .\tests\module-pages.test.cjs .\tests\data-driven-core.test.mjs
```

Expected: PASS with the taxes/GP wiring checks green.

- [ ] **Step 5: Commit**

```powershell
git add .\modules\taxes\views\index.html ".\modules\Gp\views\gp mockups.html" .\scripts\extract-ingestion-data.mjs .\tests\module-pages.test.cjs .\supabase\ingestion_data.csv .\supabase\seed_ingestion_data.sql
git commit -m "feat: wire taxes and gp values to supabase"
```

## Task 4: Wire Insurance values, including the inline trend renderer

**Files:**
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Modify: `tests/module-pages.test.cjs`
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`

- [ ] **Step 1: Add the failing insurance structural test**

```js
test("insurance page re-renders the trend from Supabase-backed metric keys", () => {
  const html = read("modules/insurance/views/insurance_command_center_oasis_trusted.html");
  assert.match(html, /window\.ValorisMetrics/);
  assert.match(html, /insuranceTrendMetricMap/);
  assert.match(html, /data-metric-key=/);
});
```

- [ ] **Step 2: Run the module page tests and verify the new insurance assertion fails**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: FAIL because the insurance page still uses hardcoded trend amounts inside the inline script.

- [ ] **Step 3: Annotate the insurance page and replace hardcoded trend amounts with metric-key lookups**

```html
<script src="../../../assets/js/supabase-data.js"></script>
<script>
  (() => {
    const insuranceTrendMetricMap = {
      standard: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_004",
      stepUp: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_005",
      renewal: "insurance_modules_insurance_views_insurance_command_center_oasis_trusted_006",
    };

    const insuranceTrendData = [
      { month: "Mar-25", metricKey: insuranceTrendMetricMap.standard, period: "Mar-Jul 2025", variant: "standard" },
      { month: "Apr-25", metricKey: insuranceTrendMetricMap.standard, period: "Mar-Jul 2025", variant: "standard" },
      { month: "May-25", metricKey: insuranceTrendMetricMap.standard, period: "Mar-Jul 2025", variant: "standard" },
      { month: "Jun-25", metricKey: insuranceTrendMetricMap.standard, period: "Mar-Jul 2025", variant: "standard" },
      { month: "Jul-25", metricKey: insuranceTrendMetricMap.standard, period: "Mar-Jul 2025", variant: "standard" },
      { month: "Aug-25", metricKey: insuranceTrendMetricMap.stepUp, period: "Aug-Dec 2025", variant: "standard" },
      { month: "Sep-25", metricKey: insuranceTrendMetricMap.stepUp, period: "Aug-Dec 2025", variant: "standard" },
      { month: "Oct-25", metricKey: insuranceTrendMetricMap.stepUp, period: "Aug-Dec 2025", variant: "standard" },
      { month: "Nov-25", metricKey: insuranceTrendMetricMap.stepUp, period: "Aug-Dec 2025", variant: "standard" },
      { month: "Dec-25", metricKey: insuranceTrendMetricMap.stepUp, period: "Aug-Dec 2025", variant: "standard" },
      { month: "Jan-26", metricKey: insuranceTrendMetricMap.renewal, period: "Jan-Feb 2026", variant: "renewal" },
      { month: "Feb-26", metricKey: insuranceTrendMetricMap.renewal, period: "Jan-Feb 2026", variant: "renewal" },
    ];

    function lookupAmount(metricKey) {
      const row = window.ValorisMetrics?.getRow(metricKey);
      return Number.isFinite(row?.value_numeric) ? row.value_numeric : null;
    }

    function renderTrend() {
      const resolvedTrendData = insuranceTrendData.map((entry) => ({
        ...entry,
        amount: lookupAmount(entry.metricKey),
      }));

      const maxAmount = Math.max(
        ...resolvedTrendData.map((entry) => (Number.isFinite(entry.amount) ? entry.amount : 0)),
        1,
      );

      barsTarget.innerHTML = resolvedTrendData
        .map((entry) => {
          const height = Number.isFinite(entry.amount)
            ? Math.max(24, Math.round((entry.amount / maxAmount) * 100))
            : 24;
          const variantClass = entry.variant === "renewal" ? " is-renewal" : "";
          const displayValue = Number.isFinite(entry.amount)
            ? compactCurrency.format(entry.amount)
            : "Missing in Supabase";

          return `
            <div class="insurance-bar">
              <div class="insurance-bar__value">${displayValue}</div>
              <div class="insurance-bar__column${variantClass}" style="height: ${height}%;"></div>
              <div class="insurance-bar__label">${entry.month}</div>
            </div>
          `;
        })
        .join("");

      tableTarget.innerHTML = resolvedTrendData
        .map((entry) => {
          const displayValue = Number.isFinite(entry.amount)
            ? currency.format(entry.amount)
            : "Missing in Supabase";

          return `
            <tr>
              <th scope="row">${entry.month}</th>
              <td>${displayValue}</td>
              <td>${entry.period}</td>
            </tr>
          `;
        })
        .join("");
    }

    window.ValorisMetrics?.refreshMetrics?.().finally(renderTrend);
    window.ValorisMetrics?.subscribe?.(({ type }) => {
      if (type === "metric:loaded" || type === "metric:change") renderTrend();
    });
  })();
</script>
```

- [ ] **Step 4: Re-run the page-structure tests**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: PASS with the insurance trend bridge detected and all three static pages wired.

- [ ] **Step 5: Commit**

```powershell
git add .\modules\insurance\views\insurance_command_center_oasis_trusted.html .\tests\module-pages.test.cjs
git commit -m "feat: wire insurance values and trend to supabase"
```

## Task 5: Add the mortgage Supabase overlay without changing the workbook-driven layout

**Files:**
- Modify: `modules/mortgage/views/index.html`
- Create: `modules/mortgage/views/current-debt-supabase.js`
- Modify: `scripts/extract-ingestion-data.mjs`
- Modify: `tests/module-pages.test.cjs`
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`

- [ ] **Step 1: Add the failing mortgage structural test**

```js
test("mortgage page loads the shared runtime and the Supabase bridge", () => {
  const html = read("modules/mortgage/views/index.html");
  assert.match(html, /current-debt-supabase\.js/);
  assert.match(html, /data-mortgage-field=/);
});
```

- [ ] **Step 2: Run the page-structure tests and verify the mortgage assertion fails**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: FAIL because the mortgage page currently renders workbook values only and has no Supabase overlay hooks.

- [ ] **Step 3: Create the mortgage bridge and add stable field hooks to the rendered DOM**

```js
window.applyCurrentDebtSupabaseBindings = async function applyCurrentDebtSupabaseBindings() {
  if (!window.ValorisMetrics?.refreshMetrics) return;

  await window.ValorisMetrics.refreshMetrics();

  const fieldMap = {
    principalBalance: "mortgage_principal_balance",
    interestRate: "mortgage_interest_rate",
    escrowAmount: "mortgage_escrow_amount",
    monthlyPaymentIoOnly: "mortgage_monthly_payment_io_only",
    monthlyPaymentWithEscrow: "mortgage_monthly_payment_with_escrow",
    currentInterestDue: "mortgage_current_interest_due",
    currentTaxDue: "mortgage_current_tax_due",
    currentInsuranceDue: "mortgage_current_insurance_due",
    totalDue: "mortgage_total_due",
    endingEscrowBalance: "mortgage_ending_escrow_balance",
  };

  for (const [fieldName, metricKey] of Object.entries(fieldMap)) {
    const element = document.querySelector(`[data-mortgage-field="${fieldName}"]`);
    if (!element) continue;

    const row = window.ValorisMetrics.getRow(metricKey);
    element.textContent = row?.value_display || "Missing in Supabase";
  }
};
```

```html
<script src="../../../assets/js/supabase-data.js"></script>
<script src="./current-debt-supabase.js"></script>
<script src="./current-debt-data.js"></script>
```

```js
const buildStat = (label, fieldName, value) =>
  `<div class="stat-card"><div class="meta-label">${escapeHtml(label)}</div><strong data-mortgage-field="${escapeHtml(fieldName)}">${escapeHtml(value)}</strong></div>`;

const buildSnapshotCard = (label, fieldName, value) =>
  `<div class="stat-card"><div class="meta-label">${escapeHtml(label)}</div><strong data-mortgage-field="${escapeHtml(fieldName)}">${escapeHtml(value)}</strong></div>`;

topStats.innerHTML = [
  buildStat("Principal Balance", "principalBalance", formatCurrency(loan.principalBalance)),
  buildStat("Interest Rate", "interestRate", formatPercent(loan.interestRate)),
  buildStat("Loan Type", "loanType", cleanText(loan.loanType)),
  buildStat("Escrow Amount", "escrowAmount", cleanText(details.escrowAmount)),
].join("");

snapshotStack.innerHTML = [
  buildSnapshotCard("Current Interest Due", "currentInterestDue", formatCurrency(snapshot.currentInterestDue)),
  buildSnapshotCard("Current Tax Due", "currentTaxDue", formatCurrency(snapshot.currentTaxDue)),
  buildSnapshotCard("Current Insurance Due", "currentInsuranceDue", formatCurrency(snapshot.currentInsuranceDue)),
  buildSnapshotCard("Total Due", "totalDue", formatCurrency(snapshot.totalDue)),
  buildSnapshotCard("Ending Escrow Balance", "endingEscrowBalance", formatCurrency(snapshot.endingEscrowBalance)),
].join("");

window.applyCurrentDebtSupabaseBindings?.();
```

- [ ] **Step 4: Re-run the page-structure tests and regenerate the seed artifacts**

Run:

```powershell
node .\scripts\extract-ingestion-data.mjs
node --test .\tests\module-pages.test.cjs
```

Expected: PASS with the mortgage bridge detected and the regenerated Supabase seed files reflecting the current manual mortgage metrics.

- [ ] **Step 5: Commit**

```powershell
git add .\modules\mortgage\views\index.html .\modules\mortgage\views\current-debt-supabase.js .\scripts\extract-ingestion-data.mjs .\tests\module-pages.test.cjs .\supabase\ingestion_data.csv .\supabase\seed_ingestion_data.sql
git commit -m "feat: overlay mortgage values from supabase"
```

## Task 6: Run the full verification sweep and leave the branch deployable

**Files:**
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`
- Verify: `modules/taxes/views/index.html`
- Verify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Verify: `modules/Gp/views/gp mockups.html`
- Verify: `modules/mortgage/views/index.html`

- [ ] **Step 1: Run the full automated test suite**

Run:

```powershell
node --test
```

Expected: PASS with `data-driven-core`, `metrics-api`, `module-pages`, and `supabase-data-runtime` all green.

- [ ] **Step 2: Run the seed-generation scripts one final time**

Run:

```powershell
node .\scripts\annotate-metrics.mjs
node .\scripts\extract-ingestion-data.mjs
```

Expected: script output shows the generated Supabase artifacts written successfully with no duplicate runtime script tags added to static pages.

- [ ] **Step 3: Perform structural smoke checks across all modules**

Run:

```powershell
rg -n "supabase-data\.js|data-metric-key=|data-mortgage-field=|current-debt-supabase\.js" .\modules
```

Expected: taxes, insurance, and GP show `supabase-data.js` plus `data-metric-key=`, and mortgage shows `supabase-data.js`, `current-debt-supabase.js`, and `data-mortgage-field=`.

- [ ] **Step 4: Check the final git diff for only intended files**

Run:

```powershell
git status --short
git diff --stat
```

Expected: only the runtime, scripts, module pages, tests, and regenerated Supabase seed files are modified.

- [ ] **Step 5: Commit**

```powershell
git add .\assets\js\supabase-data.js .\modules .\scripts .\supabase .\tests
git commit -m "feat: drive testing module values from supabase"
```
