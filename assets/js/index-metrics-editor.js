(() => {
  const RUNTIME_KEY = "ValorisMetrics";

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

  function buildDraftFromRow(runtime, row) {
    return {
      value_display: runtime.normalizeDisplayValue(row.value_display),
      value_numeric: row.value_numeric ?? "",
      source_context: row.source_context || "",
    };
  }

  function inferDefaultModule() {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes("/modules/mortgage/")) return "mortgage";
    if (pathname.includes("/modules/insurance/")) return "insurance";
    if (pathname.includes("/modules/taxes/")) return "taxes";
    if (pathname.includes("/modules/gp/")) return "gp";
    return "";
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

    const defaultModule = inferDefaultModule();
    if (defaultModule && Array.from(moduleFilter.options).some((option) => option.value === defaultModule)) {
      moduleFilter.value = defaultModule;
    }

    const state = {
      drafts: new Map(),
      filterModule: moduleFilter.value,
      rowStatuses: new Map(),
      rows: [],
      savingRows: new Set(),
      search: "",
    };

    function setStatus(message, type = "") {
      status.textContent = message;
      status.className = `editor-status${type ? ` is-${type}` : ""}`;
    }

    function setRowStatus(metricKey, message, type = "") {
      state.rowStatuses.set(metricKey, { message, type });
    }

    function getRow(metricKey) {
      return state.rows.find((item) => item.metric_key === metricKey) || null;
    }

    function getDraft(metricKey, row) {
      if (!state.drafts.has(metricKey)) {
        state.drafts.set(metricKey, buildDraftFromRow(runtime, row));
      }
      return state.drafts.get(metricKey);
    }

    function hasDraftChanges(metricKey, row) {
      const draft = state.drafts.get(metricKey);
      if (!draft) return false;

      const original = buildDraftFromRow(runtime, row);
      return (
        draft.value_display !== original.value_display ||
        String(draft.value_numeric) !== String(original.value_numeric) ||
        draft.source_context !== original.source_context
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
          const isDirty = hasDraftChanges(row.metric_key, row);
          const isSaving = state.savingRows.has(row.metric_key);

          return `
            <tr data-metric-key="${escapeHtml(row.metric_key)}">
              <td>
                <strong>${escapeHtml(row.label)}</strong>
                <small>${escapeHtml(row.metric_key)}</small>
                <small>${escapeHtml(row.module)} | ${escapeHtml(row.source_file || "No source file")}</small>
                <small>Updated: ${escapeHtml(formatTimestamp(row.updated_at))}</small>
              </td>
              <td>
                <input data-field="value_display" value="${escapeHtml(draft.value_display)}" />
              </td>
              <td>
                <input data-field="value_numeric" value="${escapeHtml(draft.value_numeric)}" />
              </td>
              <td>
                <textarea data-field="source_context">${escapeHtml(draft.source_context)}</textarea>
              </td>
              <td>
                <div class="editor-actions">
                  <button class="save-button" data-action="save" ${isDirty && !isSaving ? "" : "disabled"}>
                    ${isSaving ? "Saving..." : "Save"}
                  </button>
                  <button class="reset-button" data-action="reset" ${isDirty && !isSaving ? "" : "disabled"}>
                    Reset
                  </button>
                  <span class="row-status${rowStatus?.type ? ` is-${rowStatus.type}` : ""}">
                    ${escapeHtml(rowStatus?.message || (isDirty ? "Unsaved changes" : "Ready"))}
                  </span>
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    function syncRowControls(rowElement, metricKey, row) {
      const rowStatus = rowElement.querySelector(".row-status");
      const saveButton = rowElement.querySelector('[data-action="save"]');
      const resetButton = rowElement.querySelector('[data-action="reset"]');
      const isDirty = hasDraftChanges(metricKey, row);
      const isSaving = state.savingRows.has(metricKey);
      const statusState = state.rowStatuses.get(metricKey);

      if (rowStatus) {
        rowStatus.textContent = statusState?.message || (isDirty ? "Unsaved changes" : "Ready");
        rowStatus.className = `row-status${statusState?.type ? ` is-${statusState.type}` : ""}`;
      }
      if (saveButton) {
        saveButton.disabled = !isDirty || isSaving;
        saveButton.textContent = isSaving ? "Saving..." : "Save";
      }
      if (resetButton) {
        resetButton.disabled = !isDirty || isSaving;
      }
    }

    async function loadRows() {
      if (!state.filterModule) {
        state.rows = [];
        setStatus("Select a module to load metrics.");
        meta.textContent = "Choose a module to edit its live metrics.";
        body.innerHTML = '<tr><td colspan="5">Select a module to load metrics.</td></tr>';
        return;
      }

      setStatus("Loading metrics...");

      try {
        const rows =
          state.filterModule === "all"
            ? await runtime.fetchAllMetrics()
            : await runtime.fetchMetricsByModule(state.filterModule);

        state.rows = rows;
        setStatus("Realtime sync active.", "success");
        render();
      } catch (error) {
        const message = error.message || "Failed to load metrics.";
        setStatus(message, "error");
        body.innerHTML = `<tr><td colspan="5">${escapeHtml(message)}</td></tr>`;
      }
    }

    async function saveRow(metricKey) {
      const row = getRow(metricKey);
      if (!row || !hasDraftChanges(metricKey, row)) return;

      const draft = getDraft(metricKey, row);
      state.savingRows.add(metricKey);
      setRowStatus(metricKey, "Saving...");
      render();

      try {
        const saved = await runtime.saveMetricUpdate({
          metric_key: metricKey,
          value_display: draft.value_display,
          value_numeric: draft.value_numeric,
          source_context: draft.source_context,
        });

        if (saved) {
          state.rows = state.rows.map((item) => (item.metric_key === metricKey ? saved : item));
          state.drafts.set(metricKey, buildDraftFromRow(runtime, saved));
        }

        setRowStatus(metricKey, "Saved", "success");
        setStatus(`Saved ${metricKey}.`, "success");
      } catch (error) {
        const message = error.message || "Save failed.";
        setRowStatus(metricKey, message, "error");
        setStatus(message, "error");
      } finally {
        state.savingRows.delete(metricKey);
        render();
      }
    }

    function resetRow(metricKey) {
      const row = getRow(metricKey);
      if (!row) return;

      state.drafts.set(metricKey, buildDraftFromRow(runtime, row));
      setRowStatus(metricKey, "Reset", "");
      render();
    }

    body.addEventListener("input", (event) => {
      const field = event.target?.dataset?.field;
      const rowElement = event.target?.closest("tr[data-metric-key]");
      if (!field || !rowElement) return;

      const metricKey = rowElement.dataset.metricKey;
      const row = getRow(metricKey);
      if (!row) return;

      const draft = { ...getDraft(metricKey, row), [field]: event.target.value };
      state.drafts.set(metricKey, draft);
      setRowStatus(metricKey, hasDraftChanges(metricKey, row) ? "Unsaved changes" : "Ready");
      syncRowControls(rowElement, metricKey, row);
    });

    body.addEventListener("click", (event) => {
      const action = event.target?.dataset?.action;
      const rowElement = event.target?.closest("tr[data-metric-key]");
      if (!action || !rowElement) return;

      const metricKey = rowElement.dataset.metricKey;
      if (action === "save") {
        saveRow(metricKey);
        return;
      }
      if (action === "reset") {
        resetRow(metricKey);
      }
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

      if (!hasDraftChanges(row.metric_key, row)) {
        state.drafts.set(row.metric_key, buildDraftFromRow(runtime, row));
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
