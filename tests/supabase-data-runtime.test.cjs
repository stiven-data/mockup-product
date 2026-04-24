const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const runtimePath = path.join(__dirname, "../assets/js/supabase-data.js");
const runtimeSource = fs.readFileSync(runtimePath, "utf8");

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
    },
  };

  window.window = window;
  document.defaultView = window;

  const fetch = async (url) => {
    const pathname = new URL(url).pathname;

    if (pathname === "/api/public-config") {
      return createResponse({});
    }

    if (pathname === "/api/metrics") {
      const responseConfig =
        typeof options.metricsResponse === "function"
          ? options.metricsResponse({ callCount: metricsCallCount })
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
      return createResponse({ data: metricRows });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  };

  const context = vm.createContext({
    URL,
    console: fakeConsole,
    document,
    fetch,
    window,
  });

  new vm.Script(runtimeSource, {
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
