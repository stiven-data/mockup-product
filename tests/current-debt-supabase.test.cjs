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

test("mortgage bridge fetches mapped metric keys before applying the overlay", async () => {
  const domEvents = new Map();
  const rowsByKey = new Map([
    ["mortgage_principal_balance", { value_display: "$10,853,176.39" }],
    ["mortgage_total_due", { value_display: "$12,000,000" }],
  ]);
  const fields = [createField("principal-balance"), createField("total-due")];
  const requestedKeys = [];

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
      async ensureMetricRows(keys) {
        requestedKeys.push(...keys);
      },
      getRow(metricKey) {
        return rowsByKey.get(metricKey) || null;
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

  assert.deepEqual(requestedKeys, [
    "mortgage_principal_balance",
    "mortgage_interest_rate",
    "mortgage_escrow_amount",
    "mortgage_monthly_payment_io_only",
    "mortgage_monthly_payment_with_escrow",
    "mortgage_current_interest_due",
    "mortgage_current_tax_due",
    "mortgage_current_insurance_due",
    "mortgage_total_due",
    "mortgage_ending_escrow_balance",
  ]);
  assert.equal(fields[0].textContent, "$10,853,176.39");
  assert.equal(fields[1].textContent, "$12,000,000");
});
