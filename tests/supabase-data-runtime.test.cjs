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

async function loadRuntime(metricRows, elements) {
  const domEvents = new Map();
  const windowEvents = new Map();
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
