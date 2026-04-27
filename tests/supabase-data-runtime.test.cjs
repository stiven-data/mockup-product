const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const runtimePath = path.join(__dirname, "../assets/js/supabase-data.js");
const runtimeSource = fs.readFileSync(runtimePath, "utf8");
const SUPABASE_IMPORT_SNIPPET = 'await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm")';

function createResponse(payload, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() {
      return payload;
    },
  };
}

function createElement({
  metricKey,
  textContent,
  metricMissing,
  title = "stale trace",
  sourceFile = "stale/source.html",
  sourceContext = "stale context",
}) {
  const dataset = { metricKey };
  if (metricMissing !== undefined) {
    dataset.metricMissing = metricMissing;
  }
  if (sourceFile !== undefined) {
    dataset.sourceFile = sourceFile;
  }
  if (sourceContext !== undefined) {
    dataset.sourceContext = sourceContext;
  }

  return {
    dataset,
    textContent,
    title,
  };
}

async function loadRuntime(metricRows, elements, options = {}) {
  const domEvents = new Map();
  const windowEvents = new Map();
  let metricsCallCount = 0;
  let supabaseRestCallCount = 0;
  const fakeConsole = {
    debug() {},
    error() {},
    info() {},
    log() {},
    warn() {},
  };

  const document = {
    body: {},
    readyState: "loading",
    visibilityState: "visible",
    addEventListener(type, handler) {
      domEvents.set(type, handler);
    },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-metric-key]");
      return elements;
    },
  };

  const window = {
    addEventListener(type, handler) {
      windowEvents.set(type, handler);
    },
    document,
    location: {
      origin: "https://example.test",
      pathname: options.pathname || "/",
    },
  };

  window.window = window;
  document.defaultView = window;
  if (options.publicConfig) {
    window.VALORIS_PUBLIC_SUPABASE_CONFIG = options.publicConfig;
  }
  if (options.supabaseModule) {
    window.__loadSupabaseModule = async () => options.supabaseModule;
  }

  const fetch = async (url, fetchOptions = {}) => {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;

    if (pathname === "/api/public-config") {
      return createResponse({});
    }

    if (pathname === "/api/metrics") {
      const keys = (parsedUrl.searchParams.get("keys") || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const module = parsedUrl.searchParams.get("module");
      const request = {
        callCount: metricsCallCount,
        keys,
        method: fetchOptions.method || "GET",
        module,
        searchParams: parsedUrl.searchParams,
        url: parsedUrl,
      };
      const responseConfig =
        typeof options.metricsResponse === "function"
          ? options.metricsResponse(request)
          : Array.isArray(options.metricsResponse)
            ? options.metricsResponse[Math.min(metricsCallCount, options.metricsResponse.length - 1)]
            : options.metricsResponse;
      metricsCallCount += 1;

      if (responseConfig?.reject) {
        throw new Error(responseConfig.reject);
      }
      if (responseConfig && responseConfig.ok === false) {
        return createResponse(
          responseConfig.payload ?? { error: "metrics unavailable" },
          false,
          responseConfig.status ?? 500,
        );
      }

      const defaultRows = module
        ? metricRows.filter((row) => row?.module === module)
        : keys.length
          ? metricRows.filter((row) => keys.includes(row?.metric_key))
          : metricRows;
      return createResponse({ data: responseConfig?.data ?? defaultRows });
    }

    if (pathname === "/rest/v1/ingestion_data") {
      const request = {
        callCount: supabaseRestCallCount,
        headers: fetchOptions.headers || {},
        method: fetchOptions.method || "GET",
        searchParams: parsedUrl.searchParams,
        url: parsedUrl,
      };
      const responseConfig =
        typeof options.supabaseRestResponse === "function"
          ? options.supabaseRestResponse(request)
          : Array.isArray(options.supabaseRestResponse)
            ? options.supabaseRestResponse[Math.min(supabaseRestCallCount, options.supabaseRestResponse.length - 1)]
            : options.supabaseRestResponse;
      supabaseRestCallCount += 1;

      if (responseConfig?.reject) {
        throw new Error(responseConfig.reject);
      }
      if (responseConfig && responseConfig.ok === false) {
        return createResponse(
          responseConfig.payload ?? { error: "supabase unavailable" },
          false,
          responseConfig.status ?? 500,
        );
      }

      return createResponse(responseConfig?.data ?? metricRows);
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const scriptSource = options.supabaseModule
    ? runtimeSource.replace(SUPABASE_IMPORT_SNIPPET, "await window.__loadSupabaseModule()")
    : runtimeSource;

  const context = vm.createContext({
    URL,
    console: fakeConsole,
    document,
    fetch,
    window,
  });

  new vm.Script(scriptSource, {
    filename: runtimePath,
  }).runInContext(context);

  const init = domEvents.get("DOMContentLoaded");
  assert.equal(typeof init, "function");
  await init();

  return {
    document,
    elements,
    window,
    windowEvents,
  };
}

test("missing Supabase rows use the element missing label and clear stale trace metadata", async () => {
  const elements = [
    createElement({
      metricKey: "taxes_total_due",
      textContent: "$8,600,000",
      metricMissing: "Hidden in Supabase",
    }),
    createElement({
      metricKey: "taxes_rate",
      textContent: "35%",
    }),
  ];

  await loadRuntime([], elements);

  assert.equal(elements[0].textContent, "Hidden in Supabase");
  assert.equal(elements[0].title, "");
  assert.equal(elements[0].dataset.sourceFile, undefined);
  assert.equal(elements[0].dataset.sourceContext, undefined);

  assert.equal(elements[1].textContent, "Missing in Supabase");
  assert.equal(elements[1].title, "");
  assert.equal(elements[1].dataset.sourceFile, undefined);
  assert.equal(elements[1].dataset.sourceContext, undefined);
});

test("row values replace the static text with value_display", async () => {
  const elements = [
    createElement({
      metricKey: "taxes_total_due",
      textContent: "$8,600,000",
      metricMissing: "Hidden in Supabase",
    }),
  ];

  await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_total_due",
        value_display: "$9,125,000",
        source_file: "modules/taxes/views/index.html",
        source_context: "Updated total due",
      },
    ],
    elements,
  );

  assert.equal(elements[0].textContent, "$9,125,000");
  assert.equal(elements[0].title, "Source file: modules/taxes/views/index.html\nContext: Updated total due");
  assert.equal(elements[0].dataset.sourceFile, "modules/taxes/views/index.html");
  assert.equal(elements[0].dataset.sourceContext, "Updated total due");
});

test("failed metrics fetch applies missing state to bound fields", async () => {
  const elements = [
    createElement({
      metricKey: "taxes_total_due",
      textContent: "$8,600,000",
      metricMissing: "Hidden in Supabase",
    }),
  ];

  await loadRuntime([], elements, {
    metricsResponse: {
      reject: "network down",
    },
  });

  assert.equal(elements[0].textContent, "Hidden in Supabase");
  assert.equal(elements[0].title, "");
  assert.equal(elements[0].dataset.sourceFile, undefined);
  assert.equal(elements[0].dataset.sourceContext, undefined);
});

test("failed refresh after a successful load clears cached rows for bound fields", async () => {
  const elements = [
    createElement({
      metricKey: "taxes_total_due",
      textContent: "$8,600,000",
      metricMissing: "Hidden in Supabase",
    }),
  ];

  const runtime = await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_total_due",
        value_display: "$9,125,000",
        source_file: "modules/taxes/views/index.html",
        source_context: "Updated total due",
      },
    ],
    elements,
    {
      metricsResponse: ({ callCount }) =>
        callCount === 0 ? { ok: true } : { reject: "network down" },
    },
  );

  assert.equal(elements[0].textContent, "$9,125,000");
  assert.equal(runtime.window.ValorisMetrics.getRow("taxes_total_due").value_display, "$9,125,000");

  await runtime.window.ValorisMetrics.refreshMetrics();

  assert.equal(elements[0].textContent, "Hidden in Supabase");
  assert.equal(elements[0].title, "");
  assert.equal(runtime.window.ValorisMetrics.getRow("taxes_total_due"), null);
});

test("ensureMetricRows fetches and caches rows without relying on bound DOM elements", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "mortgage",
        metric_key: "mortgage_total_due",
        value_display: "$12,000,000",
        source_file: "modules/mortgage/views/current-debt-data.js",
        source_context: "Total Due",
      },
    ],
    [],
  );

  const rows = await runtime.window.ValorisMetrics.ensureMetricRows(["mortgage_total_due"]);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].metric_key, "mortgage_total_due");
  assert.equal(runtime.window.ValorisMetrics.getRow("mortgage_total_due").value_display, "$12,000,000");
});

test("getMetricValue resolves exact metric_key and numeric values", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "mortgage",
        metric_key: "mortgage_total_due",
        label: "Total Due",
        value_numeric: 112158.22,
        value_display: "$112,158.22",
      },
    ],
    [],
  );

  const rows = await runtime.window.ValorisMetrics.ensureModuleRows("mortgage");

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      metricKey: "mortgage_total_due",
      defaultValue: "$0.00",
    }),
    "$112,158.22",
  );

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      metricKey: "mortgage_total_due",
      preferNumeric: true,
      defaultValue: 0,
    }),
    112158.22,
  );
});

test("getMetricValue supports legacy_metric_key fallback for transitional bindings", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_total_tax_liability",
        legacy_metric_key: "taxes_modules_taxes_views_index_127",
        label: "Total Tax Liability",
        value_numeric: 149715.38,
        value_display: "$149,715.38",
      },
    ],
    [],
  );

  const rows = await runtime.window.ValorisMetrics.ensureModuleRows("taxes");

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      fallbackMetricKeys: ["taxes_modules_taxes_views_index_127"],
      defaultValue: "$0.00",
    }),
    "$149,715.38",
  );
});

test("getMetricValue no longer falls back to labels or semantic identifiers", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_total_tax_liability",
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
    "$0.00",
  );

  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue(rows, {
      key: "taxes.missing.metric",
      defaultValue: "$0.00",
    }),
    "$0.00",
  );
});

test("ensureModuleRows refetches after a later key refresh clears part of a cached module snapshot", async () => {
  const fullModuleRows = [
    {
      module: "mortgage",
      metric_key: "mortgage_total_due",
      label: "Total Due",
      value_numeric: 112158.22,
      value_display: "$112,158.22",
    },
    {
      module: "mortgage",
      metric_key: "mortgage_interest_due",
      label: "Interest Due",
      value_numeric: 18158.22,
      value_display: "$18,158.22",
    },
  ];
  let moduleFetchCount = 0;

  const runtime = await loadRuntime(fullModuleRows, [], {
    metricsResponse({ keys, module }) {
      if (module === "mortgage") {
        moduleFetchCount += 1;
        return { data: fullModuleRows };
      }

      if (keys.length) {
        return {
          data: fullModuleRows.filter((row) => row.metric_key === "mortgage_total_due"),
        };
      }

      return { data: [] };
    },
  });

  const firstRows = await runtime.window.ValorisMetrics.ensureModuleRows("mortgage");
  assert.equal(firstRows.length, 2);
  assert.equal(moduleFetchCount, 1);

  const partialRows = await runtime.window.ValorisMetrics.ensureMetricRows([
    "mortgage_total_due",
    "mortgage_interest_due",
  ]);
  assert.equal(partialRows.length, 1);
  assert.equal(runtime.window.ValorisMetrics.getRow("mortgage_interest_due"), null);

  const repairedRows = await runtime.window.ValorisMetrics.ensureModuleRows("mortgage");
  assert.equal(moduleFetchCount, 2);
  assert.equal(repairedRows.length, 2);
  assert.equal(
    runtime.window.ValorisMetrics.getRow("mortgage_interest_due").value_display,
    "$18,158.22",
  );
});

test("realtime delete clears the cached row instead of re-adding it", async () => {
  let realtimeHandler = null;
  const cachedRow = {
    module: "taxes",
    metric_key: "taxes_total_due",
    legacy_metric_key: "taxes_modules_taxes_views_index_002",
    label: "Total Due",
    value_numeric: 9125000,
    value_display: "$9,125,000",
    source_file: "modules/taxes/views/index.html",
    source_context: "Updated total due",
  };
  const elements = [
    createElement({
      metricKey: "taxes_total_due",
      textContent: "$8,600,000",
      metricMissing: "Hidden in Supabase",
    }),
  ];

  const runtime = await loadRuntime([cachedRow], elements, {
    publicConfig: {
      key: "public-anon-key",
      url: "https://example.supabase.co",
    },
    supabaseModule: {
      createClient() {
        return {
          channel() {
            return {
              on(event, filter, handler) {
                realtimeHandler = handler;
                return this;
              },
              subscribe(statusHandler) {
                if (statusHandler) statusHandler("SUBSCRIBED");
                return this;
              },
            };
          },
        };
      },
    },
  });

  const rows = await runtime.window.ValorisMetrics.ensureModuleRows("taxes");
  assert.equal(rows.length, 1);
  assert.equal(typeof realtimeHandler, "function");

  realtimeHandler({
    eventType: "DELETE",
    new: null,
    old: cachedRow,
  });

  assert.equal(runtime.window.ValorisMetrics.getRow("taxes_total_due"), null);
  assert.equal(elements[0].textContent, "Hidden in Supabase");
});

test("module pages can render legacy DOM bindings after fetching canonical rows by module", async () => {
  const elements = [
    createElement({
      metricKey: "taxes_modules_taxes_views_index_127",
      textContent: "$0.00",
      metricMissing: "Hidden in Supabase",
    }),
  ];

  const runtime = await loadRuntime(
    [
      {
        module: "taxes",
        metric_key: "taxes_total_tax_liability",
        legacy_metric_key: "taxes_modules_taxes_views_index_127",
        value_display: "$149,715.38",
      },
    ],
    elements,
    {
      pathname: "/modules/taxes/views/index.html",
      metricsResponse({ module }) {
        return module === "taxes"
          ? {
              data: [
                {
                  module: "taxes",
                  metric_key: "taxes_total_tax_liability",
                  legacy_metric_key: "taxes_modules_taxes_views_index_127",
                  value_display: "$149,715.38",
                },
              ],
            }
          : { data: [] };
      },
    },
  );

  assert.equal(elements[0].textContent, "$149,715.38");
  assert.equal(
    runtime.window.ValorisMetrics.getRow("taxes_modules_taxes_views_index_127").metric_key,
    "taxes_total_tax_liability",
  );
});

test("getMetricRow does not widen non-array lookup data to the global cache", async () => {
  const runtime = await loadRuntime(
    [
      {
        module: "mortgage",
        metric_key: "mortgage_total_due",
        label: "Total Due",
        value_numeric: 112158.22,
        value_display: "$112,158.22",
      },
    ],
    [],
  );

  await runtime.window.ValorisMetrics.ensureModuleRows("mortgage");

  assert.equal(
    runtime.window.ValorisMetrics.getMetricRow({}, {
      metricKey: "mortgage_total_due",
    }),
    null,
  );
  assert.equal(
    runtime.window.ValorisMetrics.getMetricValue({}, {
      metricKey: "mortgage_total_due",
      defaultValue: "$0.00",
    }),
    "$0.00",
  );
});

test("direct Supabase reads retry without legacy_metric_key for pre-migration schemas", async () => {
  const runtime = await loadRuntime([], [], {
    publicConfig: {
      key: "public-anon-key",
      url: "https://example.supabase.co",
    },
    metricsResponse: {
      ok: false,
      status: 400,
      payload: { error: "Request failed with status 400" },
    },
    supabaseRestResponse: ({ callCount, searchParams }) => {
      const select = decodeURIComponent(searchParams.get("select") || "");
      if (callCount === 0) {
        return {
          ok: false,
          status: 400,
          payload: {
            code: "PGRST204",
            error: "Could not find the 'legacy_metric_key' column of 'ingestion_data' in the schema cache",
          },
        };
      }

      assert.doesNotMatch(select, /legacy_metric_key/);
      return {
        data: [
          {
            module: "gp",
            metric_key: "gp_total_gp_sponsors",
            label: "Total GP Sponsors (PPC)",
            value_numeric: 6,
            value_display: "6",
          },
        ],
      };
    },
  });

  const rows = await runtime.window.ValorisMetrics.fetchMetricsByModule("gp");

  assert.equal(rows.length, 1);
  assert.equal(rows[0].legacy_metric_key, null);
});
