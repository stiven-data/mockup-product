async function fetchMetrics(module) {
  const response = await fetch(`/api/metrics?module=${encodeURIComponent(module)}`, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metrics for ${module}.`);
  }

  const payload = await response.json();
  return Array.isArray(payload.data) ? payload.data : [];
}

function renderMetrics(container, metrics) {
  container.innerHTML = "";

  for (const metric of metrics) {
    const row = document.createElement("div");
    row.className = "metric-row";
    row.dataset.metricKey = metric.metric_key;
    const label = document.createElement("label");
    label.className = "metric-label";
    label.htmlFor = `metric-${metric.metric_key}`;
    label.textContent = metric.label;

    const input = document.createElement("input");
    input.id = `metric-${metric.metric_key}`;
    input.className = "metric-input";
    input.type = "text";
    input.inputMode = "decimal";
    input.value = metric.value_numeric ?? "";

    const display = document.createElement("span");
    display.className = "metric-display";
    display.textContent = metric.value_display;

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.className = "metric-save";
    saveButton.textContent = "Save";

    saveButton.addEventListener("click", async () => {
      const rawValue = input.value.trim();
      const numericValue = rawValue === "" ? null : Number(rawValue.replace(/,/g, ""));

      if (numericValue !== null && !Number.isFinite(numericValue)) {
        alert(`Invalid numeric value for ${metric.label}.`);
        return;
      }

      saveButton.disabled = true;

      try {
        const updated = await updateMetricValue(metric.metric_key, numericValue);
        metric.value_numeric = updated.value_numeric;
        metric.value_display = updated.value_display;
        display.textContent = updated.value_display;
      } finally {
        saveButton.disabled = false;
      }
    });

    row.append(label, input, display, saveButton);
    container.appendChild(row);
  }
}

async function updateMetricValue(metricKey, valueNumeric) {
  const response = await fetch("/api/metrics", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      metric_key: metricKey,
      value_numeric: valueNumeric,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Failed to update ${metricKey}.`);
  }

  const payload = await response.json();
  return payload.data;
}

async function bootMetricsPage() {
  const container = document.getElementById("metrics-root");
  const metrics = await fetchMetrics("taxes");
  renderMetrics(container, metrics);
}

bootMetricsPage().catch((error) => {
  console.error(error);
});
