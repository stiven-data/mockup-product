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

test("mortgage bridge fetches module rows and resolves semantic identifiers", async () => {
  const domEvents = new Map();
  const fields = [createField("principal-balance"), createField("total-due")];
  const requestedModules = [];

  const document = {
    readyState: "loading",
    addEventListener(type, handler) {
      domEvents.set(type, handler);
    },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-mortgage-field]");
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

  window.window = window;
  document.defaultView = window;

  const context = vm.createContext({
    console: { warn() {} },
    document,
    window,
  });

  new vm.Script(bridgeSource, { filename: bridgePath }).runInContext(context);

  const init = domEvents.get("DOMContentLoaded");
  assert.equal(typeof init, "function");
  await init();

  assert.deepEqual(requestedModules, ["mortgage"]);
  assert.equal(fields[0].textContent, "$10,853,176.39");
  assert.equal(fields[1].textContent, "$12,000,000");
});
