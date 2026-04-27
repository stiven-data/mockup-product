const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const bridgePath = path.join(__dirname, "../modules/mortgage/views/current-debt-supabase.js");
const bridgeSource = fs.readFileSync(bridgePath, "utf8");

function createField(field, rowSelected = true) {
  const row = {
    getAttribute(name) {
      return name === "aria-selected" && rowSelected ? "true" : "false";
    },
  };

  return {
    dataset: { mortgageField: field },
    textContent: `Workbook ${field}`,
    closest(selector) {
      assert.equal(selector, ".mortgage-loan-row");
      return row;
    },
  };
}

function createBridgeHarness({
  fields,
  metricsRuntime,
  readyState = "loading",
}) {
  const domEvents = new Map();

  const document = {
    readyState,
    addEventListener(type, handler) {
      domEvents.set(type, handler);
    },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-mortgage-field]");
      return fields;
    },
  };

  const window = {
    ValorisMetrics: metricsRuntime,
    document,
  };

  window.window = window;
  document.defaultView = window;

  const context = vm.createContext({
    console: { warn() {} },
    document,
    window,
  });

  new vm.Script(bridgeSource, { filename: bridgePath }).runInContext(context);

  return {
    domEvents,
    document,
    window,
    bridge: window.currentDebtSupabaseBridge,
  };
}

test("mortgage bridge fetches module rows and resolves canonical metric keys", async () => {
  const fields = [createField("principal-balance"), createField("total-due")];
  const requestedModules = [];
  const rows = [
    {
      module: "mortgage",
      metric_key: "mortgage_principal_balance",
      value_display: "$10,853,176.39",
    },
    {
      module: "mortgage",
      metric_key: "mortgage_total_due",
      value_display: "$12,000,000",
    },
  ];

  const harness = createBridgeHarness({
    fields,
    metricsRuntime: {
      async ensureModuleRows(module) {
        requestedModules.push(module);
        return rows;
      },
      getMetricRow(metricRows, lookup) {
        return metricRows.find((row) => row.metric_key === lookup.metricKey) || null;
      },
      subscribe() {
        return () => {};
      },
    },
  });

  const init = harness.domEvents.get("DOMContentLoaded");
  assert.equal(typeof init, "function");
  await init();

  assert.deepEqual(requestedModules, ["mortgage"]);
  assert.equal(fields[0].textContent, "$10,853,176.39");
  assert.equal(fields[1].textContent, "$12,000,000");
});

test("mortgage bridge uses cached mortgage rows after refreshMetrics when ensureModuleRows is unavailable", async () => {
  const fields = [createField("principal-balance"), createField("total-due")];
  const rows = [
    {
      module: "mortgage",
      metric_key: "mortgage_principal_balance",
      value_display: "$10,853,176.39",
    },
    {
      module: "mortgage",
      metric_key: "mortgage_total_due",
      value_display: "$12,000,000",
    },
  ];
  let refreshCount = 0;

  const harness = createBridgeHarness({
    fields,
    metricsRuntime: {
      async refreshMetrics() {
        refreshCount += 1;
      },
      getRows() {
        return rows;
      },
      getMetricRow(metricRows, lookup) {
        return metricRows.find((row) => row.metric_key === lookup.metricKey) || null;
      },
      subscribe() {
        return () => {};
      },
    },
  });

  const init = harness.domEvents.get("DOMContentLoaded");
  assert.equal(typeof init, "function");
  await init();

  assert.equal(refreshCount, 1);
  assert.equal(fields[0].textContent, "$10,853,176.39");
  assert.equal(fields[1].textContent, "$12,000,000");
});

test("mortgage bridge applies subscription updates from cached rows without refetching the module", async () => {
  const fields = [createField("principal-balance"), createField("total-due")];
  const requestedModules = [];
  const cachedRows = [
    {
      module: "mortgage",
      metric_key: "mortgage_principal_balance",
      value_display: "$10,853,176.39",
    },
    {
      module: "mortgage",
      metric_key: "mortgage_total_due",
      value_display: "$12,000,000",
    },
  ];
  let subscriber = null;

  const harness = createBridgeHarness({
    fields,
    metricsRuntime: {
      async ensureModuleRows(module) {
        requestedModules.push(module);
        return cachedRows;
      },
      getRows() {
        return cachedRows;
      },
      getMetricRow(metricRows, lookup) {
        return metricRows.find((row) => row.metric_key === lookup.metricKey) || null;
      },
      subscribe(handler) {
        subscriber = handler;
        return () => {};
      },
    },
  });

  const init = harness.domEvents.get("DOMContentLoaded");
  assert.equal(typeof init, "function");
  await init();

  assert.deepEqual(requestedModules, ["mortgage"]);
  cachedRows[0].value_display = "$11,000,000.00";
  cachedRows[1].value_display = "$12,500,000.00";

  assert.equal(typeof subscriber, "function");
  subscriber({ type: "metric:change" });

  assert.deepEqual(requestedModules, ["mortgage"]);
  assert.equal(fields[0].textContent, "$11,000,000.00");
  assert.equal(fields[1].textContent, "$12,500,000.00");
});

test("mortgage bridge falls back to direct getRow lookups when shared row helpers are unavailable", async () => {
  const fields = [createField("principal-balance"), createField("total-due")];
  const rowsByKey = new Map([
    [
      "mortgage_principal_balance",
      {
        metric_key: "mortgage_principal_balance",
        value_display: "$11,000,000.00",
      },
    ],
    [
      "mortgage_total_due",
      {
        metric_key: "mortgage_total_due",
        value_display: "$12,500,000.00",
      },
    ],
  ]);
  let refreshCount = 0;

  const harness = createBridgeHarness({
    fields,
    metricsRuntime: {
      async refreshMetrics() {
        refreshCount += 1;
      },
      getRow(metricKey) {
        return rowsByKey.get(metricKey) || null;
      },
      subscribe() {
        return () => {};
      },
    },
    readyState: "complete",
  });

  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(refreshCount, 1);
  assert.equal(fields[0].textContent, "$11,000,000.00");
  assert.equal(fields[1].textContent, "$12,500,000.00");
});
