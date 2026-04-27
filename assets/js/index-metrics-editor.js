(() => {
  const RUNTIME_KEY = "ValorisMetrics";

  function formatTimestamp(value) {
    if (!value) return "Never updated";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
  }

  function normalizeComparableText(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function firstNonEmpty(values) {
    return values.find((value) => String(value ?? "").trim()) || "";
  }

  function getPreferredLabel(row) {
    const fallback = firstNonEmpty([row.display_label, row.search_label, row.label, row.metric_key]);
    const rejected = new Set([
      normalizeComparableText(row.value_display),
      normalizeComparableText(row.metric_key),
    ]);

    for (const candidate of [row.display_label, row.search_label, row.label, row.metric_key]) {
      const normalized = normalizeComparableText(candidate);
      if (normalized && !rejected.has(normalized)) {
        return candidate;
      }
    }

    return fallback;
  }

  function isMeaningfulContext(row, candidate) {
    const normalized = normalizeComparableText(candidate);
    if (!normalized) return false;

    const duplicates = new Set([
      normalizeComparableText(getPreferredLabel(row)),
      normalizeComparableText(row.display_label),
      normalizeComparableText(row.search_label),
      normalizeComparableText(row.label),
      normalizeComparableText(row.metric_key),
      normalizeComparableText(row.value_display),
    ]);

    return !duplicates.has(normalized);
  }

  function getPrimaryContext(row) {
    for (const candidate of [row.source_context, row.ui_context]) {
      if (isMeaningfulContext(row, candidate)) {
        return String(candidate).trim();
      }
    }
    return "";
  }

  function getEditableContextValue(row) {
    for (const candidate of [row.source_context, row.ui_context]) {
      if (isMeaningfulContext(row, candidate)) {
        return String(candidate).trim();
      }
    }
    return "";
  }

  function getValueTypeSummary(row) {
    const type = String(row.value_type || "number").trim().toLowerCase();
    const currency = String(row.currency || "").trim().toUpperCase();

    if (type === "currency") {
      return currency ? `currency | ${currency}` : "currency";
    }
    if (type === "percent") return "percent";
    return type || "number";
  }

  function getTraceSummary(row) {
    return `${row.module} | ${row.source_file || "No source file"}`;
  }

  function buildDraftFromRow(row) {
    return {
      value_numeric: row.value_numeric ?? "",
      source_context: getEditableContextValue(row),
    };
  }

  function parseOptionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeDraft(draft) {
    return {
      value_numeric: parseOptionalNumber(draft.value_numeric),
      source_context: String(draft.source_context || "").trim(),
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

    function clearRowStatus(metricKey) {
      state.rowStatuses.delete(metricKey);
    }

    function getRow(metricKey) {
      return state.rows.find((item) => item.metric_key === metricKey) || null;
    }

    function getDraft(metricKey, row) {
      if (!state.drafts.has(metricKey)) {
        state.drafts.set(metricKey, buildDraftFromRow(row));
      }
      return state.drafts.get(metricKey);
    }

    function hasDraftChanges(metricKey, row) {
      const draft = state.drafts.get(metricKey);
      if (!draft) return false;

      const original = normalizeDraft(buildDraftFromRow(row));
      const normalizedDraft = normalizeDraft(draft);
      return (
        normalizedDraft.value_numeric !== original.value_numeric ||
        normalizedDraft.source_context !== original.source_context
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
            row.legacy_metric_key,
            row.label,
            row.display_label,
            row.search_label,
            row.value_display,
            row.source_file,
            row.ui_context,
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

    function appendTextNode(parent, tagName, text, className = "") {
      const element = document.createElement(tagName);
      if (className) {
        element.className = className;
      }
      element.textContent = text;
      parent.appendChild(element);
      return element;
    }

    function buildEmptyStateRow(message) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 5;
      cell.textContent = message;
      row.appendChild(cell);
      return row;
    }

    function buildMetricRow(row) {
      const draft = getDraft(row.metric_key, row);
      const rowStatus = state.rowStatuses.get(row.metric_key);
      const isDirty = hasDraftChanges(row.metric_key, row);
      const isSaving = state.savingRows.has(row.metric_key);
      const primaryContext = getPrimaryContext({ ...row, source_context: draft.source_context });
      const tableRow = document.createElement("tr");
      tableRow.dataset.metricKey = row.metric_key;

      const metricCell = document.createElement("td");
      appendTextNode(metricCell, "strong", getPreferredLabel(row));
      appendTextNode(metricCell, "small", row.metric_key, "metric-key");
      if (row.legacy_metric_key) {
        appendTextNode(metricCell, "small", `Legacy: ${row.legacy_metric_key}`);
      }
      appendTextNode(metricCell, "small", `Updated: ${formatTimestamp(row.updated_at)}`);
      tableRow.appendChild(metricCell);

      const formattedCell = document.createElement("td");
      appendTextNode(formattedCell, "code", getValueTypeSummary(row));
      tableRow.appendChild(formattedCell);

      const rawValueCell = document.createElement("td");
      const numericInput = document.createElement("input");
      numericInput.dataset.field = "value_numeric";
      numericInput.inputMode = "decimal";
      numericInput.placeholder = "Enter raw numeric value";
      numericInput.step = "any";
      numericInput.value = String(draft.value_numeric ?? "");
      rawValueCell.appendChild(numericInput);
      tableRow.appendChild(rawValueCell);

      const contextCell = document.createElement("td");
      const contextWrap = document.createElement("div");
      contextWrap.className = "editor-context";
      const contextSummary = appendTextNode(
        contextWrap,
        "p",
        primaryContext || "No business context available.",
        `context-summary${primaryContext ? "" : " is-empty"}`,
      );
      contextSummary.className = `context-summary${primaryContext ? "" : " is-empty"}`;
      appendTextNode(contextWrap, "small", getTraceSummary(row), "context-trace");
      const contextTextarea = document.createElement("textarea");
      contextTextarea.dataset.field = "source_context";
      contextTextarea.placeholder = "Describe what the raw value represents in business terms.";
      contextTextarea.value = draft.source_context;
      contextWrap.appendChild(contextTextarea);
      contextCell.appendChild(contextWrap);
      tableRow.appendChild(contextCell);

      const actionsCell = document.createElement("td");
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "editor-actions";

      const saveButton = document.createElement("button");
      saveButton.className = "save-button";
      saveButton.dataset.action = "save";
      saveButton.disabled = !isDirty || isSaving;
      saveButton.textContent = isSaving ? "Saving..." : "Save";
      actionsWrap.appendChild(saveButton);

      const resetButton = document.createElement("button");
      resetButton.className = "reset-button";
      resetButton.dataset.action = "reset";
      resetButton.disabled = !isDirty || isSaving;
      resetButton.textContent = "Reset";
      actionsWrap.appendChild(resetButton);

      const rowStatusElement = document.createElement("span");
      rowStatusElement.className = `row-status${rowStatus?.type ? ` is-${rowStatus.type}` : ""}`;
      rowStatusElement.textContent = rowStatus?.message || (isDirty ? "Unsaved changes" : "Ready");
      actionsWrap.appendChild(rowStatusElement);

      actionsCell.appendChild(actionsWrap);
      tableRow.appendChild(actionsCell);

      return tableRow;
    }

    function render() {
      const rows = getVisibleRows();
      updateMeta(rows);
      body.replaceChildren();

      if (!rows.length) {
        body.appendChild(buildEmptyStateRow("No metrics match the current filters."));
        return;
      }

      for (const row of rows) {
        body.appendChild(buildMetricRow(row));
      }
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

    function syncContextPreview(rowElement, row, draft) {
      const preview = rowElement.querySelector(".context-summary");
      if (!preview) return;

      const context = getPrimaryContext({ ...row, source_context: draft.source_context });
      preview.textContent = context || "No business context available.";
      preview.className = `context-summary${context ? "" : " is-empty"}`;
    }

    async function loadRows() {
      if (!state.filterModule) {
        state.rows = [];
        setStatus("Select a module to load metrics.");
        meta.textContent = "Choose a module to edit its live metrics.";
        body.replaceChildren(buildEmptyStateRow("Select a module to load metrics."));
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
        body.replaceChildren(buildEmptyStateRow(message));
      }
    }

    async function saveRow(metricKey) {
      const row = getRow(metricKey);
      if (!row) return;

      if (!hasDraftChanges(metricKey, row)) {
        state.drafts.set(metricKey, buildDraftFromRow(row));
        clearRowStatus(metricKey);
        setStatus("Realtime sync active.", "success");
        render();
        return;
      }

      const draft = getDraft(metricKey, row);
      state.savingRows.add(metricKey);
      setRowStatus(metricKey, "Saving...");
      render();

      try {
        const saved = await runtime.saveMetricUpdate({
          metric_key: metricKey,
          value_numeric: draft.value_numeric,
          source_context: draft.source_context,
        });

        if (saved) {
          state.rows = state.rows.map((item) => (item.metric_key === metricKey ? saved : item));
          state.drafts.set(metricKey, buildDraftFromRow(saved));
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

      state.drafts.set(metricKey, buildDraftFromRow(row));
      clearRowStatus(metricKey);
      setStatus("Realtime sync active.", "success");
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
      if (hasDraftChanges(metricKey, row)) {
        setRowStatus(metricKey, "Unsaved changes");
      } else {
        clearRowStatus(metricKey);
        setStatus("Realtime sync active.", "success");
      }
      if (field === "source_context") {
        syncContextPreview(rowElement, row, draft);
      }
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
        state.drafts.set(row.metric_key, buildDraftFromRow(row));
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
