(() => {
  const RUNTIME_KEY = "ValorisMetrics";
  const MODULES = ["mortgage", "insurance", "gp", "taxes"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatTimestamp(value) {
    if (!value) return "Never updated";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }

  function boot() {
    const runtime = window[RUNTIME_KEY];
    const panel = document.getElementById("metrics-editor");
    if (!runtime || !panel) return;

    const body = document.getElementById("metrics-editor-body");
    const moduleFilter = document.getElementById("metrics-module-filter");
    const searchInput = document.getElementById("metrics-search");
    const meta = document.getElementById("metrics-editor-meta");
    const status = document.getElementById("metrics-editor-status");

    const state = {
      rows: [],
      drafts: new Map(),
      rowStatuses: new Map(),
      loading: false,
      filterModule: moduleFilter.value,
      search: "",
    };

    function setStatus(message, type = "") {
      status.textContent = message;
      status.className = `editor-status${type ? ` is-${type}` : ""}`;
    }

    function setRowStatus(metricKey, message, type = "") {
      state.rowStatuses.set(metricKey, { message, type });
    }

    function getDraft(metricKey, row) {
      return (
        state.drafts.get(metricKey) || {
          label: row.label || "",
          value_display: runtime.normalizeDisplayValue(row.value_display),
          value_numeric: row.value_numeric ?? "",
          source_context: row.source_context || "",
        }
      );
    }

    function getVisibleRows() {
      const search = state.search.trim().toLowerCase();

      return state.rows
        .filter((row) => state.filterModule === "all" || row.module === state.filterModule)
        .filter((row) => {
          if (!search) return true;
          return [
            row.module,
            row.metric_key,
            row.label,
            row.value_display,
            row.source_file,
            row.source_context,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);
        })
        .sort((left, right) => left.metric_key.localeCompare(right.metric_key));
    }

    function updateMeta(rows) {
      meta.textContent = `${rows.length} visible metric${rows.length === 1 ? "" : "s"} loaded from Supabase.`;
    }

    function render() {
      const rows = getVisibleRows();
      updateMeta(rows);

      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="5">No metrics match the current filters.</td></tr>';
        return;
      }

      body.innerHTML = rows
        .map((row) => {
          const draft = getDraft(row.metric_key, row);
          const rowStatus = state.rowStatuses.get(row.metric_key);

          return `
            <tr data-metric-key="${escapeHtml(row.metric_key)}">
              <td>
                <strong>${escapeHtml(row.label)}</strong>
                <small>${escapeHtml(row.metric_key)}</small>
                <small>${escapeHtml(row.module)} · ${escapeHtml(row.source_file || "No source file")}</small>
                <small>Updated: ${escapeHtml(formatTimestamp(row.updated_at))}</small>
              </td>
              <td>
                <input data-field="value_display" value="${escapeHtml(draft.value_display)}" />
              </td>
              <td>
                <input data-field="value_numeric" value="${escapeHtml(draft.value_numeric)}" />
              </td>
              <td>
                <input data-field="label" value="${escapeHtml(draft.label)}" />
                <textarea data-field="source_context">${escapeHtml(draft.source_context)}</textarea>
              </td>
              <td>
                <div class="editor-actions">
                  <button class="save-button" data-action="save">Save</button>
                  <span class="row-status${rowStatus?.type ? ` is-${rowStatus.type}` : ""}">
                    ${escapeHtml(rowStatus?.message || "Ready")}
                  </span>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    async function loadRows() {
      state.loading = true;
      setStatus("Loading metrics...", "");

      try {
        const rows =
          state.filterModule === "all"
            ? await runtime.fetchAllMetrics()
            : await runtime.fetchMetricsByModule(state.filterModule);

        state.rows = rows;
        setStatus("Realtime sync active.", "success");
        render();
      } catch (error) {
        setStatus(error.message || "Failed to load metrics.", "error");
        body.innerHTML = `<tr><td colspan="5">${escapeHtml(error.message || "Failed to load metrics.")}</td></tr>`;
      } finally {
        state.loading = false;
      }
    }

    async function saveRow(metricKey) {
      const row = state.rows.find((item) => item.metric_key === metricKey);
      if (!row) return;

      const draft = getDraft(metricKey, row);
      setRowStatus(metricKey, "Saving...", "");
      render();

      try {
        const saved = await runtime.saveMetricUpdate({
          metric_key: metricKey,
          label: draft.label,
          value_display: draft.value_display,
          value_numeric: draft.value_numeric,
          source_context: draft.source_context,
        });

        if (saved) {
          state.rows = state.rows.map((item) => (item.metric_key === metricKey ? saved : item));
          state.drafts.delete(metricKey);
        }

        setRowStatus(metricKey, "Saved", "success");
        setStatus(`Saved ${metricKey}.`, "success");
        render();
      } catch (error) {
        setRowStatus(metricKey, error.message || "Save failed", "error");
        setStatus(error.message || "Save failed.", "error");
        render();
      }
    }

    body.addEventListener("input", (event) => {
      const field = event.target?.dataset?.field;
      const rowElement = event.target?.closest("tr[data-metric-key]");
      if (!field || !rowElement) return;

      const metricKey = rowElement.dataset.metricKey;
      const row = state.rows.find((item) => item.metric_key === metricKey);
      if (!row) return;

      const draft = getDraft(metricKey, row);
      draft[field] = event.target.value;
      state.drafts.set(metricKey, draft);
      setRowStatus(metricKey, "Unsaved changes", "");
    });

    body.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      const rowElement = event.target?.closest("tr[data-metric-key]");
      if (action !== "save" || !rowElement) return;
      saveRow(rowElement.dataset.metricKey);
    });

    moduleFilter.addEventListener("change", () => {
      state.filterModule = moduleFilter.value;
      loadRows();
    });

    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      render();
    });

    runtime.subscribe((event) => {
      if (event.type !== "metric:change") return;

      const row = event.payload;
      const existingIndex = state.rows.findIndex((item) => item.metric_key === row.metric_key);
      if (existingIndex >= 0) {
        state.rows[existingIndex] = row;
      } else if (state.filterModule === "all" || state.filterModule === row.module) {
        state.rows.push(row);
      }

      if (!state.drafts.has(row.metric_key)) {
        setRowStatus(row.metric_key, "Updated remotely", "success");
      }

      render();
    });

    loadRows();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
