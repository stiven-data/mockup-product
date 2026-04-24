# Ingestion Data Semantic Identifier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable `semantic_identifier` to `public.ingestion_data` and refactor the frontend/runtime so mortgage, insurance, and GP can resolve metrics by semantic meaning first while preserving legacy `metric_key` compatibility.

**Architecture:** Keep the database change additive. Curated rows gain explicit semantic identifiers through the seed-generation pipeline, the API/runtime exposes the new field, and `assets/js/supabase-data.js` becomes the shared semantic-first lookup layer. Mortgage and insurance switch to module-level semantic lookups with legacy fallback keys, while GP summary metrics migrate through semantic DOM attributes.

**Tech Stack:** Static HTML, vanilla JavaScript, Supabase REST + Realtime, Vercel serverless functions, Node `--test`, PowerShell

---

## File Structure

- Modify: `supabase/schema.sql`
  - Add `semantic_identifier` and index it for runtime lookups.
- Modify: `supabase/setup.sql`
  - Mirror the schema change for local/bootstrap setup.
- Modify: `api/_lib/metrics.js`
  - Include `semantic_identifier` in Supabase select lists.
- Modify: `assets/js/supabase-data.js`
  - Add semantic-first row/value lookup helpers and module-level row caching.
- Modify: `scripts/extract-ingestion-data.mjs`
  - Generate `semantic_identifier` for curated/manual rows and include it in CSV/SQL seed outputs.
- Modify: `modules/mortgage/views/current-debt-supabase.js`
  - Resolve field overlays through semantic identifiers with legacy fallbacks.
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
  - Resolve trend rows through semantic identifiers with legacy fallbacks.
- Modify: `modules/Gp/views/gp mockups.html`
  - Add semantic DOM bindings for curated summary metrics.
- Modify: `tests/metrics-api.test.cjs`
  - Assert the API contract now exposes `semantic_identifier`.
- Modify: `tests/supabase-data-runtime.test.cjs`
  - Cover semantic lookup priority, duplicate handling, and module row caching.
- Modify: `tests/current-debt-supabase.test.cjs`
  - Assert the mortgage bridge fetches module rows and resolves semantic identifiers.
- Modify: `tests/module-pages.test.cjs`
  - Assert GP and insurance pages contain semantic-first bindings and that seed artifacts contain curated semantic identifiers.
- Modify: `supabase/ingestion_data.csv`
  - Regenerated seed artifact with `semantic_identifier`.
- Modify: `supabase/seed_ingestion_data.sql`
  - Regenerated seed artifact with `semantic_identifier`.
- Reference: `docs/specs/2026-04-24-ingestion-data-semantic-identifier-design.md`

## Task 1: Extend the schema and API contract

**Files:**
- Modify: `supabase/schema.sql`
- Modify: `supabase/setup.sql`
- Modify: `api/_lib/metrics.js`
- Modify: `tests/metrics-api.test.cjs`

- [ ] **Step 1: Write the failing API contract test**

```js
test("buildSupabaseRestUrl includes semantic_identifier in the select clause", () => {
  const url = decodeURIComponent(
    buildSupabaseRestUrl("https://example.supabase.co", {
      keys: ["mortgage_total_due"],
      module: "",
      limit: 1,
    }),
  );

  assert.match(
    url,
    /select=id,module,metric_key,semantic_identifier,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at/,
  );
});
```

- [ ] **Step 2: Run the focused API test file and verify it fails**

Run:

```powershell
node --test .\tests\metrics-api.test.cjs
```

Expected: FAIL because the current `DEFAULT_SELECT` string does not include `semantic_identifier`.

- [ ] **Step 3: Add `semantic_identifier` to the database schema and API select list**

```sql
create table if not exists ingestion_data (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  metric_key text not null unique,
  semantic_identifier text,
  label text not null,
  value_numeric numeric,
  value_display text not null,
  value_type text not null default 'kpi',
  currency text,
  source_file text,
  source_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingestion_data_module_idx on ingestion_data (module);
create index if not exists ingestion_data_semantic_identifier_idx on ingestion_data (semantic_identifier);
```

```js
const DEFAULT_SELECT =
  "id,module,metric_key,semantic_identifier,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at";
```

- [ ] **Step 4: Re-run the API test file and verify it passes**

Run:

```powershell
node --test .\tests\metrics-api.test.cjs
```

Expected: PASS with the new `semantic_identifier` select contract covered.

- [ ] **Step 5: Commit the schema/API contract change**

```powershell
git add .\supabase\schema.sql .\supabase\setup.sql .\api\_lib\metrics.js .\tests\metrics-api.test.cjs
git commit -m "feat: expose semantic identifiers in metrics contract"
```

## Task 2: Generate semantic identifiers in curated seed data

**Files:**
- Modify: `scripts/extract-ingestion-data.mjs`
- Modify: `tests/module-pages.test.cjs`
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`

- [ ] **Step 1: Write the failing seed-artifact assertions**

```js
test("curated seed artifacts include semantic identifiers", () => {
  const csv = read("supabase/ingestion_data.csv");
  const sql = read("supabase/seed_ingestion_data.sql");

  assert.match(csv, /^module,metric_key,semantic_identifier,label,value_numeric,value_display,value_type,currency,source_file,source_context$/m);
  assert.match(csv, /^mortgage,mortgage_total_due,mortgage\.total_due,Total Due,112158\.22,"\$112,158\.22",currency,USD,/m);
  assert.match(csv, /^gp,gp_total_gp_sponsors,gp\.total_gp_sponsors,Total GP Sponsors \(PPC\),6,6,number,,/m);

  assert.match(sql, /'mortgage', 'mortgage_total_due', 'mortgage\.total_due', 'Total Due'/);
  assert.match(sql, /'gp', 'gp_total_gp_sponsors', 'gp\.total_gp_sponsors', 'Total GP Sponsors \(PPC\)'/);
});
```

- [ ] **Step 2: Run the module-page test file and verify it fails**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: FAIL because the current CSV/SQL headers and rows do not contain `semantic_identifier`.

- [ ] **Step 3: Teach the extraction script to assign curated semantic identifiers and emit the new column**

```js
const CURATED_SEMANTIC_IDENTIFIERS = {
  mortgage_total_due: "mortgage.total_due",
  mortgage_principal_balance: "mortgage.principal_balance",
  mortgage_interest_rate: "mortgage.interest_rate",
  gp_total_gp_sponsors: "gp.total_gp_sponsors",
  gp_k1_partners_in_manager_entity: "gp.k1_partners_in_manager_entity",
  gp_source_k1_year: "gp.source_k1_year",
  insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010: "insurance.monthly_expense.2025-03",
  insurance_modules_insurance_views_insurance_command_center_oasis_trusted_011: "insurance.monthly_expense.2025-04",
};

function metric(
  module,
  metric_key,
  label,
  value_numeric,
  value_display,
  value_type,
  source_file,
  source_context = label,
  semantic_identifier = null,
) {
  return {
    module,
    metric_key,
    semantic_identifier,
    label,
    value_numeric,
    value_display,
    value_type,
    currency: value_type === "currency" ? "USD" : null,
    source_file,
    source_context,
  };
}

function withSemanticIdentifiers(rows) {
  return rows.map((row) => ({
    ...row,
    semantic_identifier: row.semantic_identifier || CURATED_SEMANTIC_IDENTIFIERS[row.metric_key] || null,
  }));
}
```

```js
const columns = [
  "module",
  "metric_key",
  "semantic_identifier",
  "label",
  "value_numeric",
  "value_display",
  "value_type",
  "currency",
  "source_file",
  "source_context",
];
```

- [ ] **Step 4: Regenerate the seed artifacts and verify the tests pass**

Run:

```powershell
node .\scripts\extract-ingestion-data.mjs
node --test .\tests\module-pages.test.cjs
```

Expected: PASS with curated rows carrying `semantic_identifier` in both generated seed artifacts.

- [ ] **Step 5: Commit the extraction and seed updates**

```powershell
git add .\scripts\extract-ingestion-data.mjs .\tests\module-pages.test.cjs .\supabase\ingestion_data.csv .\supabase\seed_ingestion_data.sql
git commit -m "feat: generate curated semantic identifiers"
```

## Task 3: Add semantic-first runtime lookup helpers

**Files:**
- Modify: `assets/js/supabase-data.js`
- Modify: `tests/supabase-data-runtime.test.cjs`

- [ ] **Step 1: Write the failing runtime helper tests**

```js
test("getMetricValue prefers semantic_identifier over label and legacy metric keys", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "mortgage",
        metric_key: "mortgage_modules_current_debt_999",
        semantic_identifier: "mortgage.total_due",
        label: "Total Due",
        value_numeric: 112158.22,
        value_display: "$112,158.22",
      },
      {
        module: "mortgage",
        metric_key: "mortgage_total_due",
        semantic_identifier: null,
        label: "Legacy Total Due",
        value_numeric: 999,
        value_display: "$999.00",
      },
    ],
    [],
  );

  const rows = await runtime.window.ValorisMetrics.ensureModuleRows("mortgage");

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      key: "mortgage.total_due",
      label: "Total Due",
      metricKey: "mortgage_total_due",
      fallbackMetricKeys: ["mortgage_total_due"],
      defaultValue: "$0.00",
    }),
    "$112,158.22",
  );

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      key: "mortgage.total_due",
      preferNumeric: true,
      defaultValue: 0,
    }),
    112158.22,
  );
});
```

```js
test("getMetricValue falls back to normalized labels and default values", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_modules_taxes_views_index_127",
        semantic_identifier: null,
        label: "Total Tax Liability:",
        value_numeric: 149715.38,
        value_display: "$149,715.38",
      },
    ],
    [],
  );

  const rows = await runtime.window.ValorisMetrics.ensureModuleRows("taxes");

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      label: " total tax liability ",
      defaultValue: "$0.00",
    }),
    "$149,715.38",
  );

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      key: "taxes.missing.metric",
      defaultValue: "$0.00",
    }),
    "$0.00",
  );
});
```

- [ ] **Step 2: Run the runtime test file and verify it fails**

Run:

```powershell
node --test .\tests\supabase-data-runtime.test.cjs
```

Expected: FAIL because `ensureModuleRows`, `getMetricRow`, and `getMetricValue` do not exist yet.

- [ ] **Step 3: Implement module-level caching and semantic-first lookup helpers**

```js
const state = {
  channel: null,
  clientPromise: null,
  configPromise: null,
  listeners: new Set(),
  mode: "unknown",
  refreshPromise: null,
  rowsByKey: new Map(),
  rowsBySemanticIdentifier: new Map(),
  rowsByNormalizedLabel: new Map(),
};

function normalizeLookupText(value) {
  return repairTextArtifacts(value)
    .toLowerCase()
    .replace(/[.:|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pushRow(map, key, row) {
  if (!key) return;
  const current = map.get(key) || [];
  current.push(row);
  map.set(key, current);
}

function rebuildIndexes() {
  state.rowsBySemanticIdentifier.clear();
  state.rowsByNormalizedLabel.clear();

  for (const row of state.rowsByKey.values()) {
    pushRow(state.rowsBySemanticIdentifier, normalizeLookupText(row.semantic_identifier), row);
    pushRow(state.rowsByNormalizedLabel, normalizeLookupText(row.label), row);
  }
}

async function ensureModuleRows(module) {
  const rows = await fetchMetricsByModule(module);
  rememberRows(rows);
  rebuildIndexes();
  emit("metric:loaded", rows);
  return rows;
}
```

```js
function getMetricRow(data, lookup = {}) {
  const rows = Array.isArray(data) ? data : getRows();
  const rowsByKey = new Map(rows.filter(Boolean).map((row) => [row.metric_key, row]));
  const rowsBySemanticIdentifier = new Map();
  const rowsByNormalizedLabel = new Map();

  for (const row of rows) {
    pushRow(rowsBySemanticIdentifier, normalizeLookupText(row.semantic_identifier), row);
    pushRow(rowsByNormalizedLabel, normalizeLookupText(row.label), row);
  }

  const semanticCandidates =
    rowsBySemanticIdentifier.get(normalizeLookupText(lookup.key || lookup.metricKey)) || [];
  const labelCandidates = rowsByNormalizedLabel.get(normalizeLookupText(lookup.label)) || [];
  const keyCandidates = [lookup.metricKey, ...(lookup.fallbackMetricKeys || [])]
    .filter(Boolean)
    .map((metricKey) => rowsByKey.get(metricKey))
    .filter(Boolean);

  return [...semanticCandidates, ...labelCandidates, ...keyCandidates][0] || null;
}

function getMetricValue(data, lookup = {}) {
  const row = getMetricRow(data, lookup);
  if (!row) return lookup.defaultValue;
  if (lookup.preferNumeric) {
    return Number.isFinite(Number(row.value_numeric)) ? Number(row.value_numeric) : lookup.defaultValue;
  }
  return normalizeDisplayValue(row.value_display, lookup.defaultValue);
}
```

```js
window.ValorisMetrics = {
  ensureMetricRows,
  ensureModuleRows,
  fetchAllMetrics,
  fetchMetricsByModule,
  getMetricRow,
  getMetricValue,
  getRow(metricKey) {
    return state.rowsByKey.get(metricKey) || null;
  },
  getRows() {
    return [...state.rowsByKey.values()];
  },
  // existing helpers preserved
};
```

- [ ] **Step 4: Re-run the runtime tests and verify they pass**

Run:

```powershell
node --test .\tests\supabase-data-runtime.test.cjs
```

Expected: PASS with semantic-first lookup, label fallback, and module row caching covered.

- [ ] **Step 5: Commit the runtime lookup layer**

```powershell
git add .\assets\js\supabase-data.js .\tests\supabase-data-runtime.test.cjs
git commit -m "feat: add semantic-first metrics runtime lookups"
```

## Task 4: Migrate the mortgage overlay bridge to semantic lookups

**Files:**
- Modify: `modules/mortgage/views/current-debt-supabase.js`
- Modify: `tests/current-debt-supabase.test.cjs`

- [ ] **Step 1: Write the failing mortgage bridge test**

```js
test("mortgage bridge fetches module rows and resolves semantic identifiers", async () => {
  const domEvents = new Map();
  const fields = [createField("principal-balance"), createField("total-due")];
  const requestedModules = [];

  const document = {
    readyState: "loading",
    addEventListener(type, handler) {
      domEvents.set(type, handler);
    },
    querySelectorAll() {
      return fields;
    },
  };

  const window = {
    ValorisMetrics: {
      async ensureModuleRows(module) {
        requestedModules.push(module);
        return [
          {
            module: "mortgage",
            metric_key: "mortgage_modules_current_debt_001",
            semantic_identifier: "mortgage.principal_balance",
            value_display: "$10,853,176.39",
          },
          {
            module: "mortgage",
            metric_key: "mortgage_modules_current_debt_009",
            semantic_identifier: "mortgage.total_due",
            value_display: "$12,000,000",
          },
        ];
      },
      getMetricRow(rows, lookup) {
        return rows.find((row) => row.semantic_identifier === lookup.key) || null;
      },
      subscribe() {
        return () => {};
      },
    },
    document,
  };

  // run the bridge here, then assert:
  assert.deepEqual(requestedModules, ["mortgage"]);
  assert.equal(fields[0].textContent, "$10,853,176.39");
  assert.equal(fields[1].textContent, "$12,000,000");
});
```

- [ ] **Step 2: Run the focused mortgage bridge test and verify it fails**

Run:

```powershell
node --test .\tests\current-debt-supabase.test.cjs
```

Expected: FAIL because the bridge still calls `ensureMetricRows` with legacy metric keys only.

- [ ] **Step 3: Replace legacy key mapping with semantic lookup definitions**

```js
const FIELD_LOOKUPS = {
  "principal-balance": {
    key: "mortgage.principal_balance",
    fallbackMetricKeys: ["mortgage_principal_balance"],
  },
  "interest-rate": {
    key: "mortgage.interest_rate",
    fallbackMetricKeys: ["mortgage_interest_rate"],
  },
  "total-due": {
    key: "mortgage.total_due",
    fallbackMetricKeys: ["mortgage_total_due"],
  },
};
```

```js
function applyOverlay(rows = []) {
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
  const rows = metricsRuntime?.ensureModuleRows
    ? await metricsRuntime.ensureModuleRows("mortgage")
    : [];

  applyOverlay(rows);
}
```

- [ ] **Step 4: Re-run the bridge test and verify it passes**

Run:

```powershell
node --test .\tests\current-debt-supabase.test.cjs
```

Expected: PASS with the bridge now resolving semantic identifiers first and keeping workbook fallbacks intact.

- [ ] **Step 5: Commit the mortgage bridge migration**

```powershell
git add .\modules\mortgage\views\current-debt-supabase.js .\tests\current-debt-supabase.test.cjs
git commit -m "feat: migrate mortgage overlay to semantic identifiers"
```

## Task 5: Migrate insurance and GP to semantic-first frontend lookups

**Files:**
- Modify: `modules/insurance/views/insurance_command_center_oasis_trusted.html`
- Modify: `modules/Gp/views/gp mockups.html`
- Modify: `tests/module-pages.test.cjs`

- [ ] **Step 1: Write the failing page wiring assertions**

```js
test("insurance trend wiring includes semantic identifiers with legacy fallbacks", () => {
  const html = read("modules/insurance/views/insurance_command_center_oasis_trusted.html");

  assert.match(html, /key: "insurance\.monthly_expense\.2025-03"/);
  assert.match(html, /fallbackMetricKeys: \["insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010"\]/);
  assert.match(html, /ensureModuleRows\("insurance"\)/);
  assert.match(html, /getMetricValue\(rows, \{/);
});

test("gp summary metrics bind semantic identifiers in the DOM", () => {
  const html = read("modules\/Gp\/views\/gp mockups\.html");

  assert.match(html, /data-semantic-identifier="gp\.total_gp_sponsors"/);
  assert.match(html, /data-fallback-metric-keys="gp_total_gp_sponsors"/);
  assert.match(html, /data-semantic-identifier="gp\.source_k1_year"/);
});
```

- [ ] **Step 2: Run the page test file and verify it fails**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: FAIL because the insurance trend objects and GP summary DOM still only use legacy key bindings.

- [ ] **Step 3: Update the insurance trend script and GP summary DOM**

```html
<strong>
  <span
    data-semantic-identifier="gp.total_gp_sponsors"
    data-fallback-metric-keys="gp_total_gp_sponsors"
    data-metric-key="gp_total_gp_sponsors"
    data-metric-missing="6"
  >6</span>
</strong>
```

```js
const insuranceTrendData = [
  {
    month: "Mar-25",
    key: "insurance.monthly_expense.2025-03",
    label: "Monthly Insurance Trend | Mar-25",
    fallbackMetricKeys: ["insurance_modules_insurance_views_insurance_command_center_oasis_trusted_010"],
    period: "Mar-Jul 2025",
    variant: "standard",
    defaultAmount: 16496.85,
    defaultDisplay: "$16,496.85",
  },
];

async function refreshInsuranceTrend() {
  const metricsRuntime = getMetricsRuntime();
  const rows = metricsRuntime?.ensureModuleRows
    ? await metricsRuntime.ensureModuleRows("insurance")
    : [];

  renderInsuranceTrend(rows);
}

function getTrendEntryState(rows, entry) {
  const metricsRuntime = getMetricsRuntime();
  return {
    ...entry,
    amount: metricsRuntime?.getMetricValue(rows, {
      key: entry.key,
      label: entry.label,
      fallbackMetricKeys: entry.fallbackMetricKeys,
      preferNumeric: true,
      defaultValue: entry.defaultAmount ?? null,
    }),
    displayAmount: metricsRuntime?.getMetricValue(rows, {
      key: entry.key,
      label: entry.label,
      fallbackMetricKeys: entry.fallbackMetricKeys,
      defaultValue: entry.defaultDisplay || missingDisplay,
    }),
  };
}
```

- [ ] **Step 4: Re-run the page tests and verify they pass**

Run:

```powershell
node --test .\tests\module-pages.test.cjs
```

Expected: PASS with insurance trend lookups and GP summary bindings using semantic-first configuration.

- [ ] **Step 5: Commit the insurance and GP migration**

```powershell
git add ".\modules\insurance\views\insurance_command_center_oasis_trusted.html" ".\modules\Gp\views\gp mockups.html" .\tests\module-pages.test.cjs
git commit -m "feat: migrate insurance and gp screens to semantic identifiers"
```

## Task 6: Run the regression suite and verify seeded/runtime behavior together

**Files:**
- Modify: `supabase/ingestion_data.csv`
- Modify: `supabase/seed_ingestion_data.sql`
- Verify: `tests/metrics-api.test.cjs`
- Verify: `tests/supabase-data-runtime.test.cjs`
- Verify: `tests/current-debt-supabase.test.cjs`
- Verify: `tests/module-pages.test.cjs`

- [ ] **Step 1: Rebuild the seed artifacts from source**

Run:

```powershell
node .\scripts\extract-ingestion-data.mjs
```

Expected: A `Wrote ... metrics` summary plus the regenerated `supabase/ingestion_data.csv` and `supabase/seed_ingestion_data.sql`.

- [ ] **Step 2: Run the focused regression suite**

Run:

```powershell
node --test .\tests\metrics-api.test.cjs .\tests\supabase-data-runtime.test.cjs .\tests\current-debt-supabase.test.cjs .\tests\module-pages.test.cjs
```

Expected: PASS with schema/API, runtime helper, mortgage bridge, and screen wiring all green.

- [ ] **Step 3: Verify the semantic identifier footprint in the generated artifacts and runtime code**

Run:

```powershell
rg -n "semantic_identifier|ensureModuleRows|getMetricValue|getMetricRow" .\supabase .\assets\js .\modules .\api .\tests
```

Expected: Matches in schema/setup, generated seed artifacts, runtime helper exports, mortgage bridge, insurance trend script, GP summary bindings, and the updated tests.

- [ ] **Step 4: Review the final diff for unintended churn**

Run:

```powershell
git diff --stat
git diff -- .\supabase .\api .\assets\js .\modules .\scripts .\tests
```

Expected: Only the files listed in this plan change, with no unrelated regressions or accidental rewrites.

- [ ] **Step 5: Commit the final integrated refactor**

```powershell
git add .\supabase .\api .\assets\js .\modules .\scripts .\tests
git commit -m "feat: add semantic identifiers to ingestion lookups"
```
