(() => {
  const BATCH_SIZE = 60;
  const API_PATH = "/api/metrics";

  function chunk(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }
    return chunks;
  }

  function buildSourceTrace(row) {
    const parts = [];
    if (row?.source_file) parts.push(`Source file: ${row.source_file}`);
    if (row?.source_context) parts.push(`Context: ${row.source_context}`);
    return parts.join("\n");
  }

  async function fetchMetricBatch(keys) {
    const url = new URL(API_PATH, window.location.origin);
    url.searchParams.set("keys", keys.join(","));

    const response = await fetch(url.toString(), {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Metrics API request failed: ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.data) ? payload.data : [];
  }

  async function loadDynamicMetrics() {
    const elements = Array.from(document.querySelectorAll("[data-metric-key]"));
    if (!elements.length) return;

    const uniqueKeys = [...new Set(elements.map((element) => element.dataset.metricKey).filter(Boolean))];
    if (!uniqueKeys.length) return;

    try {
      const rows = (
        await Promise.all(chunk(uniqueKeys, BATCH_SIZE).map((keys) => fetchMetricBatch(keys)))
      ).flat();

      const rowsByKey = new Map(rows.map((row) => [row.metric_key, row]));

      for (const element of elements) {
        const row = rowsByKey.get(element.dataset.metricKey);
        if (!row) continue;

        if (row.value_display !== undefined && row.value_display !== null) {
          element.textContent = row.value_display;
        }

        const trace = buildSourceTrace(row);
        if (trace) {
          element.title = trace;
          element.dataset.sourceFile = row.source_file || "";
          element.dataset.sourceContext = row.source_context || "";
        }
      }
    } catch (error) {
      console.warn("[metrics-api] Falling back to static HTML values.", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadDynamicMetrics, { once: true });
  } else {
    loadDynamicMetrics();
  }

  window.loadDynamicMetrics = loadDynamicMetrics;
})();
