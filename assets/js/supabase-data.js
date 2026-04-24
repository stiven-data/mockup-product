(() => {
  const BATCH_SIZE = 60;
  const API_PATH = "/api/metrics";
  const CONFIG_PATH = "/api/public-config";
  const DEFAULT_SELECT =
    "id,module,metric_key,semantic_identifier,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at";
  const LEGACY_SELECT =
    "id,module,metric_key,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at";
  const MAX_LIMIT = 5000;
  const RUNTIME_VERSION = "2026-04-24-4";
  const MODULES = ["mortgage", "insurance", "taxes", "gp"];
  const EMPTY_DISPLAY_TOKENS = new Set([
    "",
    "-",
    "â€”",
    "â€“",
    "Ã¢â‚¬â€",
    "Ã¢â‚¬â€œ",
    "null",
    "undefined",
    "nan",
    "n/a",
  ]);
  const MISSING_DISPLAY_FALLBACK = "Missing in Supabase";
  const TEXT_ARTIFACT_REPLACEMENTS = [
    [/KÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœ1/g, "K-1"],
    [/KÃ¢â‚¬â€˜1/g, "K-1"],
    [/Ã¢â‚¬â€˜/g, "-"],
    [/Ã¢â‚¬â€/g, "-"],
    [/Ã¢â‚¬â€œ/g, "-"],
    [/Ã‚Â·/g, " - "],
    [/Ã¢â‚¬Å“|Ã¢â‚¬Â/g, '"'],
    [/Ã¢â€“Â¶/g, ">"],
  ];

  const state = {
    channel: null,
    clientPromise: null,
    configPromise: null,
    listeners: new Set(),
    mode: "unknown",
    refreshPromise: null,
    rowsByKey: new Map(),
    rowsByModule: new Map(),
    rowsByNormalizedLabel: new Map(),
    rowsBySemanticIdentifier: new Map(),
    validModuleSnapshots: new Set(),
  };

  function chunk(values, size) {
    const chunks = [];
    for (let index = 0; index < values.length; index += size) {
      chunks.push(values.slice(index, index + size));
    }
    return chunks;
  }

  function repairTextArtifacts(value) {
    let repaired = String(value ?? "");
    for (const [pattern, replacement] of TEXT_ARTIFACT_REPLACEMENTS) {
      repaired = repaired.replace(pattern, replacement);
    }
    return repaired.replace(/\s+/g, " ").trim();
  }

  function normalizeDisplayValue(value, fallback = "-") {
    const repaired = repairTextArtifacts(value);
    if (EMPTY_DISPLAY_TOKENS.has(repaired.toLowerCase())) return fallback;
    return repaired || fallback;
  }

  function normalizeEditableText(value) {
    const repaired = repairTextArtifacts(value);
    return repaired || "";
  }

  function normalizeLookupText(value) {
    return repairTextArtifacts(value)
      .toLowerCase()
      .replace(/[.:|]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resolveMetricText(row, field) {
    return normalizeEditableText(row?.[field]);
  }

  function normalizeMetricRow(row) {
    if (!row || !row.metric_key) return row;

    const displayLabel =
      resolveMetricText(row, "display_label") ||
      resolveMetricText(row, "search_label") ||
      resolveMetricText(row, "label") ||
      row.metric_key;
    const searchLabel =
      resolveMetricText(row, "search_label") ||
      resolveMetricText(row, "display_label") ||
      resolveMetricText(row, "label") ||
      row.metric_key;
    const uiContext = resolveMetricText(row, "ui_context") || resolveMetricText(row, "source_context") || null;

    return {
      semantic_identifier: row?.semantic_identifier ?? null,
      ...row,
      display_label: displayLabel,
      search_label: searchLabel,
      ui_context: uiContext,
    };
  }

  function parseOptionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function buildSourceTrace(row) {
    const parts = [];
    if (row?.source_file) parts.push(`Source file: ${repairTextArtifacts(row.source_file)}`);
    if (row?.ui_context || row?.source_context) {
      parts.push(`Context: ${repairTextArtifacts(row.ui_context || row.source_context)}`);
    }
    return parts.join("\n");
  }

  function pushRow(map, key, row) {
    if (!key) return;
    const current = map.get(key) || [];
    current.push(row);
    map.set(key, current);
  }

  function rebuildIndexes() {
    state.rowsBySemanticIdentifier.clear();
    state.rowsByNormalizedLabel.clear();

    for (const row of state.rowsByKey.values()) {
      pushRow(state.rowsBySemanticIdentifier, normalizeLookupText(row.semantic_identifier), row);
      pushRow(state.rowsByNormalizedLabel, normalizeLookupText(row.search_label), row);
      pushRow(state.rowsByNormalizedLabel, normalizeLookupText(row.display_label), row);
      pushRow(state.rowsByNormalizedLabel, normalizeLookupText(row.label), row);
    }
  }

  function updateCachedModuleRow(row) {
    if (!row?.module || !state.rowsByModule.has(row.module)) return;

    const moduleRows = state.rowsByModule.get(row.module) || [];
    const index = moduleRows.findIndex((candidate) => candidate?.metric_key === row.metric_key);

    if (index === -1) {
      state.rowsByModule.set(row.module, [...moduleRows, row]);
      return;
    }

    const nextRows = moduleRows.slice();
    nextRows[index] = row;
    state.rowsByModule.set(row.module, nextRows);
  }

  function setModuleSnapshotValidity(module, isValid) {
    const normalizedModule = normalizeEditableText(module);
    if (!normalizedModule) return;

    if (isValid) {
      state.validModuleSnapshots.add(normalizedModule);
      return;
    }

    state.validModuleSnapshots.delete(normalizedModule);
  }

  function cacheModuleRows(module, rows, options = {}) {
    const normalizedModule = normalizeEditableText(module);
    if (!normalizedModule) return [];

    const nextRows = rows.filter((row) => row?.metric_key);
    const previousRows = state.rowsByModule.get(normalizedModule) || [];
    const nextKeys = new Set(nextRows.map((row) => row.metric_key));

    for (const row of previousRows) {
      if (row?.metric_key && !nextKeys.has(row.metric_key)) {
        state.rowsByKey.delete(row.metric_key);
      }
    }

    for (const row of nextRows) {
      state.rowsByKey.set(row.metric_key, row);
    }

    if (nextRows.length) {
      state.rowsByModule.set(normalizedModule, nextRows);
    } else {
      state.rowsByModule.delete(normalizedModule);
    }

    setModuleSnapshotValidity(normalizedModule, Boolean(options.valid) && nextRows.length > 0);
    rebuildIndexes();
    return nextRows;
  }

  function isSkippableNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    return ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(parent.tagName);
  }

  function repairStaticArtifactsInDom(root = document.body) {
    if (!root || !document.createTreeWalker) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim() || isSkippableNode(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const repaired = repairTextArtifacts(node.nodeValue);
      if (repaired && repaired !== node.nodeValue) {
        node.nodeValue = repaired;
      }
    }
  }

  function appendRuntimeVersion(url) {
    url.searchParams.set("_v", RUNTIME_VERSION);
    return url;
  }

  function canUseApiRoutes() {
    const protocol =
      window.location.protocol ||
      (() => {
        try {
          return new URL(window.location.origin).protocol;
        } catch {
          return "";
        }
      })();

    return protocol === "http:" || protocol === "https:";
  }

  function buildRuntimeUrl(path) {
    if (!canUseApiRoutes()) return null;
    return appendRuntimeVersion(new URL(path, window.location.origin));
  }

  async function fetchJson(url, options = {}) {
    let response;
    try {
      response = await fetch(url, {
        cache: "no-store",
        headers: {
          accept: "application/json",
          ...(options.body ? { "content-type": "application/json" } : {}),
          ...(options.headers || {}),
        },
        ...options,
      });
    } catch (error) {
      error.status = 0;
      throw error;
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload?.error || `Request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  function shouldFallbackToDirect(error) {
    return (
      !canUseApiRoutes() ||
      error?.status === 0 ||
      error?.status === 400 ||
      error?.status === 404 ||
      error?.status === 500 ||
      error?.status === 502
    );
  }

  function buildSupabaseHeaders(key, extras = {}) {
    return {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...extras,
    };
  }

  function buildSupabaseReadUrl(baseUrl, query, options = {}) {
    const url = new URL("/rest/v1/ingestion_data", baseUrl);
    url.searchParams.set("select", options.select || DEFAULT_SELECT);
    url.searchParams.set("order", "metric_key.asc");
    url.searchParams.set("limit", String(Math.min(Math.max(query.limit || 500, 1), MAX_LIMIT)));

    if (query.keys?.length) {
      url.searchParams.set(
        "metric_key",
        `in.(${query.keys.map((value) => `"${String(value).replaceAll('"', '\\"')}"`).join(",")})`,
      );
    } else if (query.module) {
      url.searchParams.set("module", `eq.${query.module}`);
    }

    return url.toString();
  }

  function buildSupabaseUpdateUrl(baseUrl, metricKey) {
    const url = new URL("/rest/v1/ingestion_data", baseUrl);
    url.searchParams.set("metric_key", `eq.${metricKey}`);
    url.searchParams.set("select", DEFAULT_SELECT);
    return url.toString();
  }

  function isMissingSemanticIdentifierError(error) {
    return (
      error?.status === 400 &&
      /semantic_identifier/i.test(String(error?.message || "")) &&
      /(column|schema cache|PGRST204)/i.test(String(error?.message || ""))
    );
  }

  function normalizeMetricRows(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      semantic_identifier: row?.semantic_identifier ?? null,
      ...row,
    }));
  }

  async function fetchSupabaseRows(query) {
    const config = await getDirectReadConfig();

    try {
      const payload = await fetchJson(
        buildSupabaseReadUrl(config.url, query),
        { headers: buildSupabaseHeaders(config.key) },
      );
      return normalizeMetricRows(Array.isArray(payload) ? payload : []);
    } catch (error) {
      if (!isMissingSemanticIdentifierError(error)) throw error;

      const payload = await fetchJson(
        buildSupabaseReadUrl(config.url, query, { select: LEGACY_SELECT }),
        { headers: buildSupabaseHeaders(config.key) },
      );
      return normalizeMetricRows(Array.isArray(payload) ? payload : []);
    }
  }

  async function getPublicConfig() {
    if (!state.configPromise) {
      state.configPromise = (async () => {
        const embedded = window.VALORIS_PUBLIC_SUPABASE_CONFIG;
        if (embedded?.url && embedded?.key) return embedded;

        const url = buildRuntimeUrl(CONFIG_PATH);
        if (!url) return null;

        try {
          return await fetchJson(url.toString());
        } catch (error) {
          console.warn("[metrics-runtime] Public config unavailable from API.", error);
          return null;
        }
      })();
    }
    return state.configPromise;
  }

  async function getDirectReadConfig() {
    const config = await getPublicConfig();
    if (!config?.url || !config?.key) {
      throw new Error("Supabase public config is unavailable.");
    }
    return config;
  }

  async function runWithFallback(apiTask, directTask) {
    if (state.mode === "direct") {
      return directTask();
    }

    if (canUseApiRoutes()) {
      try {
        const result = await apiTask();
        state.mode = "api";
        return result;
      } catch (error) {
        if (!shouldFallbackToDirect(error)) throw error;
        console.warn("[metrics-runtime] API unavailable. Falling back to direct Supabase access.", error);
      }
    }

    const result = await directTask();
    state.mode = "direct";
    return result;
  }

  async function fetchMetricBatch(keys) {
    return runWithFallback(
      async () => {
        const url = buildRuntimeUrl(API_PATH);
        if (!url) throw Object.assign(new Error("API runtime unavailable."), { status: 0 });
        url.searchParams.set("keys", keys.join(","));
        const payload = await fetchJson(url.toString());
        return Array.isArray(payload?.data) ? payload.data.map(normalizeMetricRow) : [];
      },
      async () => {
        return fetchSupabaseRows({ keys, module: "", limit: keys.length || BATCH_SIZE });
      },
    );
  }

  async function fetchMetricsByModule(module, limit = 5000) {
    return runWithFallback(
      async () => {
        const url = buildRuntimeUrl(API_PATH);
        if (!url) throw Object.assign(new Error("API runtime unavailable."), { status: 0 });
        url.searchParams.set("module", module);
        url.searchParams.set("limit", String(limit));
        const payload = await fetchJson(url.toString());
        return Array.isArray(payload?.data) ? payload.data.map(normalizeMetricRow) : [];
      },
      async () => {
        return fetchSupabaseRows({ keys: [], module, limit });
      },
    );
  }

  async function fetchAllMetrics() {
    const results = await Promise.all(MODULES.map((module) => fetchMetricsByModule(module)));
    return results.flat();
  }

  function rememberRows(rows) {
    for (const row of rows) {
      const normalized = normalizeMetricRow(row);
      if (!normalized?.metric_key) continue;
      state.rowsByKey.set(normalized.metric_key, normalized);
      updateCachedModuleRow(normalized);
    }
    rebuildIndexes();
  }

  function clearRows(keys) {
    const keysToClear = new Set((keys || []).filter(Boolean));
    if (!keysToClear.size) return;
    const modulesToInvalidate = new Set();

    for (const key of keysToClear) {
      const row = state.rowsByKey.get(key);
      if (row?.module) modulesToInvalidate.add(row.module);
      state.rowsByKey.delete(key);
    }

    for (const [module, rows] of state.rowsByModule.entries()) {
      const nextRows = rows.filter((row) => !keysToClear.has(row?.metric_key));
      if (nextRows.length !== rows.length) {
        modulesToInvalidate.add(module);
      }
      if (nextRows.length) {
        state.rowsByModule.set(module, nextRows);
      } else {
        state.rowsByModule.delete(module);
      }
    }

    for (const module of modulesToInvalidate) {
      setModuleSnapshotValidity(module, false);
    }

    rebuildIndexes();
  }

  function buildLookupIndexes(rows) {
    const rowsByKey = new Map();
    const rowsBySemanticIdentifier = new Map();
    const rowsByNormalizedLabel = new Map();

    for (const row of rows.filter(Boolean)) {
      const normalized = normalizeMetricRow(row);
      if (!normalized?.metric_key) continue;
      rowsByKey.set(normalized.metric_key, normalized);
      pushRow(rowsBySemanticIdentifier, normalizeLookupText(normalized.semantic_identifier), normalized);
      pushRow(rowsByNormalizedLabel, normalizeLookupText(normalized.search_label), normalized);
      pushRow(rowsByNormalizedLabel, normalizeLookupText(normalized.display_label), normalized);
      pushRow(rowsByNormalizedLabel, normalizeLookupText(normalized.label), normalized);
    }

    return {
      rowsByKey,
      rowsByNormalizedLabel,
      rowsBySemanticIdentifier,
    };
  }

  function getLookupIndexes(data) {
    if (Array.isArray(data)) return buildLookupIndexes(data);
    if (data === undefined || data === null) {
      return {
        rowsByKey: state.rowsByKey,
        rowsByNormalizedLabel: state.rowsByNormalizedLabel,
        rowsBySemanticIdentifier: state.rowsBySemanticIdentifier,
      };
    }

    return {
      rowsByKey: new Map(),
      rowsByNormalizedLabel: new Map(),
      rowsBySemanticIdentifier: new Map(),
    };
  }

  function getMetricCandidates(data, lookup = {}) {
    const indexes = getLookupIndexes(data);
    const semanticIdentifier = normalizeLookupText(lookup.key || lookup.metricKey);
    const normalizedLabel = normalizeLookupText(lookup.label);
    const candidates = [];
    const seenMetricKeys = new Set();

    function appendCandidate(row) {
      if (!row?.metric_key || seenMetricKeys.has(row.metric_key)) return;
      seenMetricKeys.add(row.metric_key);
      candidates.push(row);
    }

    for (const row of indexes.rowsBySemanticIdentifier.get(semanticIdentifier) || []) {
      appendCandidate(row);
    }

    for (const row of indexes.rowsByNormalizedLabel.get(normalizedLabel) || []) {
      appendCandidate(row);
    }

    appendCandidate(indexes.rowsByKey.get(lookup.metricKey));

    for (const metricKey of lookup.fallbackMetricKeys || []) {
      appendCandidate(indexes.rowsByKey.get(metricKey));
    }

    return candidates;
  }

  function hasUsableMetricValue(row, preferNumeric) {
    if (!row) return false;
    if (preferNumeric) return parseOptionalNumber(row.value_numeric) !== null;
    return Boolean(normalizeDisplayValue(row.value_display, ""));
  }

  function getMetricRow(data, lookup = {}) {
    const candidates = getMetricCandidates(data, lookup);
    return candidates.find((row) => hasUsableMetricValue(row, Boolean(lookup.preferNumeric))) || candidates[0] || null;
  }

  async function ensureMetricRows(metricKeys) {
    const uniqueKeys = [...new Set((metricKeys || []).filter(Boolean))];
    if (!uniqueKeys.length) return [];

    try {
      const rows = (
        await Promise.all(chunk(uniqueKeys, BATCH_SIZE).map((keys) => fetchMetricBatch(keys)))
      ).flat();
      const resolvedKeys = new Set(rows.map((row) => row?.metric_key).filter(Boolean));
      const missingKeys = uniqueKeys.filter((key) => !resolvedKeys.has(key));

      rememberRows(rows);
      clearRows(missingKeys);
      applyRowsToPage([], { useCachedRows: true });
      emit("metric:loaded", rows);
      return rows;
    } catch (error) {
      clearRows(uniqueKeys);
      applyRowsToPage([], { useCachedRows: true });
      throw error;
    }
  }

  async function ensureModuleRows(module) {
    const normalizedModule = normalizeEditableText(module);
    if (!normalizedModule) return [];

    if (state.validModuleSnapshots.has(normalizedModule)) {
      return state.rowsByModule.get(normalizedModule) || [];
    }

    try {
      const rows = await fetchMetricsByModule(normalizedModule);
      const cachedRows = cacheModuleRows(normalizedModule, rows, {
        valid: rows.some((row) => row?.metric_key),
      });
      applyRowsToPage([], { useCachedRows: true });
      emit("metric:loaded", cachedRows);
      return cachedRows;
    } catch (error) {
      setModuleSnapshotValidity(normalizedModule, false);
      throw error;
    }
  }

  function applyMetricRowToElement(element, row) {
    const missingDisplay = element.dataset.metricMissing || MISSING_DISPLAY_FALLBACK;
    const nextValue = row
      ? normalizeDisplayValue(row.value_display, missingDisplay)
      : missingDisplay;
    element.textContent = nextValue;

    if (row) {
      const trace = buildSourceTrace(row);
      element.title = trace;
      element.dataset.sourceFile = row.source_file || "";
      element.dataset.sourceContext = row.ui_context || row.source_context || "";
      return;
    }

    element.title = "";
    delete element.dataset.sourceFile;
    delete element.dataset.sourceContext;
  }

  function applyRowsToPage(rows, options = {}) {
    const { useCachedRows = true } = options;
    const rowsByKey = new Map(rows.filter(Boolean).map((row) => [row.metric_key, row]));
    const elements = Array.from(document.querySelectorAll("[data-metric-key]"));

    for (const element of elements) {
      const row =
        rowsByKey.get(element.dataset.metricKey) ||
        (useCachedRows ? state.rowsByKey.get(element.dataset.metricKey) : null);
      applyMetricRowToElement(element, row);
    }
  }

  function emit(type, payload) {
    for (const listener of state.listeners) {
      try {
        listener({ type, payload });
      } catch (error) {
        console.warn("[metrics-runtime] Listener failed.", error);
      }
    }
  }

  function subscribe(listener) {
    state.listeners.add(listener);
    return () => state.listeners.delete(listener);
  }

  async function getRealtimeClient() {
    if (!state.clientPromise) {
      state.clientPromise = (async () => {
        const config = await getPublicConfig();
        if (!config?.url || !config?.key) return null;
        const module = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
        return module.createClient(config.url, config.key);
      })().catch((error) => {
        console.warn("[metrics-runtime] Realtime client unavailable.", error);
        return null;
      });
    }
    return state.clientPromise;
  }

  async function ensureRealtimeSubscription() {
    if (state.channel) return state.channel;

    const client = await getRealtimeClient();
    if (!client) return null;

    state.channel = client
      .channel("ingestion-data-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ingestion_data",
        },
        (payload) => {
          const isDelete = payload?.eventType === "DELETE" || (!payload?.new && payload?.old);
          const row = isDelete ? normalizeMetricRow(payload?.old) : normalizeMetricRow(payload?.new || payload?.old);
          if (!row?.metric_key) return;
          if (isDelete) {
            clearRows([row.metric_key]);
            applyRowsToPage([], { useCachedRows: true });
            emit("metric:change", row);
            return;
          }
          rememberRows([row]);
          applyRowsToPage([row]);
          emit("metric:change", row);
        },
      )
      .subscribe((status) => emit("realtime:status", status));

    return state.channel;
  }

  async function saveMetricUpdate(input) {
    const payload = {
      metric_key: normalizeEditableText(input.metric_key),
      value_display: normalizeDisplayValue(input.value_display),
      value_numeric: parseOptionalNumber(input.value_numeric),
      source_context: normalizeEditableText(input.source_context) || null,
    };

    const data = await runWithFallback(
      async () => {
        const response = await fetchJson(API_PATH, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        return normalizeMetricRow(response?.data || null);
      },
      async () => {
        const config = await getDirectReadConfig();
        const response = await fetchJson(buildSupabaseUpdateUrl(config.url, payload.metric_key), {
          method: "PATCH",
          headers: buildSupabaseHeaders(config.key, { Prefer: "return=representation" }),
          body: JSON.stringify({
            value_display: payload.value_display,
            value_numeric: payload.value_numeric,
            source_context: payload.source_context,
            updated_at: new Date().toISOString(),
          }),
        });
        return normalizeMetricRow(Array.isArray(response) ? response[0] || null : null);
      },
    );

    if (data?.metric_key) {
      rememberRows([data]);
      applyRowsToPage([data]);
      emit("metric:saved", data);
    }

    return data;
  }

  async function loadDynamicMetrics() {
    repairStaticArtifactsInDom();

    const elements = Array.from(document.querySelectorAll("[data-metric-key]"));
    if (!elements.length) return [];

    const uniqueKeys = [...new Set(elements.map((element) => element.dataset.metricKey).filter(Boolean))];
    if (!uniqueKeys.length) return [];

    try {
      return await ensureMetricRows(uniqueKeys);
    } catch (error) {
      console.warn("[metrics-runtime] Falling back to static HTML values.", error);
      return [];
    }
  }

  async function refreshMetrics() {
    if (!state.refreshPromise) {
      state.refreshPromise = loadDynamicMetrics().finally(() => {
        state.refreshPromise = null;
      });
    }
    return state.refreshPromise;
  }

  async function init() {
    repairStaticArtifactsInDom();
    await refreshMetrics();
    await ensureRealtimeSubscription();
  }

  window.ValorisMetrics = {
    ensureMetricRows,
    ensureModuleRows,
    fetchAllMetrics,
    fetchMetricsByModule,
    getMetricRow,
    getMetricValue(data, lookup = {}) {
      const row = getMetricRow(data, lookup);
      if (!row) return lookup.defaultValue;

      if (lookup.preferNumeric) {
        const value = parseOptionalNumber(row.value_numeric);
        return value === null ? lookup.defaultValue : value;
      }

      const value = normalizeDisplayValue(row.value_display, "");
      return value || lookup.defaultValue;
    },
    getRow(metricKey) {
      return state.rowsByKey.get(metricKey) || null;
    },
    getRows() {
      return [...state.rowsByKey.values()];
    },
    loadDynamicMetrics,
    normalizeDisplayValue,
    repairStaticArtifactsInDom,
    repairTextArtifacts,
    refreshMetrics,
    saveMetricUpdate,
    subscribe,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("pageshow", () => {
    refreshMetrics().catch((error) => console.warn("[metrics-runtime] Refresh on pageshow failed.", error));
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    refreshMetrics().catch((error) => console.warn("[metrics-runtime] Refresh on visibility change failed.", error));
  });
})();
