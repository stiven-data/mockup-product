(() => {
  const BATCH_SIZE = 60;
  const API_PATH = "/api/metrics";
  const CONFIG_PATH = "/api/public-config";
  const DEFAULT_SELECT =
    "id,module,metric_key,legacy_metric_key,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at";
  const LEGACY_SELECT =
    "id,module,metric_key,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at";
  const DEFAULT_CURRENCY = "USD";
  const MAX_LIMIT = 5000;
  const RUNTIME_VERSION = "2026-04-27-1";
  const MODULES = ["mortgage", "insurance", "taxes", "gp"];
  const EMPTY_DISPLAY_TOKENS = new Set([
    "",
    "-",
    "Ã¢â‚¬â€",
    "Ã¢â‚¬â€œ",
    "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â",
    "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“",
    "null",
    "undefined",
    "nan",
    "n/a",
  ]);
  const MISSING_DISPLAY_FALLBACK = "Missing in Supabase";
  const TEXT_ARTIFACT_REPLACEMENTS = [
    [/KÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‹Å“1/g, "K-1"],
    [/KÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœ1/g, "K-1"],
    [/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœ/g, "-"],
    [/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â/g, "-"],
    [/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“/g, "-"],
    [/Ãƒâ€šÃ‚Â·/g, " - "],
    [/ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ|ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â/g, '"'],
    [/ÃƒÂ¢Ã¢â‚¬â€œÃ‚Â¶/g, ">"],
  ];

  const state = {
    channel: null,
    clientPromise: null,
    configPromise: null,
    listeners: new Set(),
    mode: "unknown",
    refreshPromise: null,
    rowsByKey: new Map(),
    rowsByLegacyKey: new Map(),
    rowsByModule: new Map(),
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

  function resolveMetricText(row, field) {
    return normalizeEditableText(row?.[field]);
  }

  function inferModuleFromPath() {
    const pathname = String(window.location.pathname || "").toLowerCase();
    if (pathname.includes("/modules/mortgage/")) return "mortgage";
    if (pathname.includes("/modules/insurance/")) return "insurance";
    if (pathname.includes("/modules/taxes/")) return "taxes";
    if (pathname.includes("/modules/gp/")) return "gp";
    return "";
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
      legacy_metric_key: row?.legacy_metric_key ?? null,
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

  function formatMetricDisplay(row = {}, valueNumeric) {
    const numericValue = parseOptionalNumber(valueNumeric);
    if (numericValue === null) return "-";

    switch (String(row?.value_type || "").toLowerCase()) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: row?.currency || DEFAULT_CURRENCY,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numericValue);
      case "percent":
        return new Intl.NumberFormat("en-US", {
          style: "percent",
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).format(Math.abs(numericValue) > 1 ? numericValue / 100 : numericValue);
      case "integer":
      case "count":
        return new Intl.NumberFormat("en-US", {
          maximumFractionDigits: 0,
        }).format(numericValue);
      default:
        return new Intl.NumberFormat("en-US", {
          minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(numericValue);
    }
  }

  function buildSourceTrace(row) {
    const parts = [];
    if (row?.source_file) parts.push(`Source file: ${repairTextArtifacts(row.source_file)}`);
    if (row?.ui_context || row?.source_context) {
      parts.push(`Context: ${repairTextArtifacts(row.ui_context || row.source_context)}`);
    }
    return parts.join("\n");
  }

  function rebuildIndexes() {
    state.rowsByKey.clear();
    state.rowsByLegacyKey.clear();

    for (const rows of state.rowsByModule.values()) {
      for (const row of rows) {
        if (!row?.metric_key) continue;
        state.rowsByKey.set(row.metric_key, row);
        if (row.legacy_metric_key) {
          state.rowsByLegacyKey.set(row.legacy_metric_key, row);
        }
      }
    }
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

    const nextRows = rows.filter((row) => row?.metric_key).map(normalizeMetricRow);
    if (nextRows.length) {
      state.rowsByModule.set(normalizedModule, nextRows);
    } else {
      state.rowsByModule.delete(normalizedModule);
    }

    setModuleSnapshotValidity(normalizedModule, Boolean(options.valid) && nextRows.length > 0);
    rebuildIndexes();
    return nextRows;
  }

  function rememberRows(rows) {
    const grouped = new Map();
    for (const rawRow of rows) {
      const row = normalizeMetricRow(rawRow);
      if (!row?.metric_key || !row?.module) continue;
      const moduleRows = grouped.get(row.module) || state.rowsByModule.get(row.module) || [];
      const nextRows = moduleRows.slice();
      const existingIndex = nextRows.findIndex((candidate) => candidate?.metric_key === row.metric_key);
      if (existingIndex >= 0) {
        nextRows[existingIndex] = row;
      } else {
        nextRows.push(row);
      }
      grouped.set(row.module, nextRows);
    }

    for (const [module, moduleRows] of grouped.entries()) {
      state.rowsByModule.set(module, moduleRows);
    }

    rebuildIndexes();
  }

  function clearRows(keys) {
    const keysToClear = new Set((keys || []).filter(Boolean));
    if (!keysToClear.size) return;

    for (const [module, rows] of state.rowsByModule.entries()) {
      const nextRows = rows.filter((row) => !keysToClear.has(row?.metric_key));
      if (nextRows.length !== rows.length) {
        setModuleSnapshotValidity(module, false);
      }
      if (nextRows.length) {
        state.rowsByModule.set(module, nextRows);
      } else {
        state.rowsByModule.delete(module);
      }
    }

    rebuildIndexes();
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

  function buildSupabaseUpdateUrl(baseUrl, metricKey, select = DEFAULT_SELECT) {
    const url = new URL("/rest/v1/ingestion_data", baseUrl);
    url.searchParams.set("metric_key", `eq.${metricKey}`);
    url.searchParams.set("select", select);
    return url.toString();
  }

  function isMissingLegacyMetricKeyError(error) {
    return (
      error?.status === 400 &&
      /legacy_metric_key/i.test(String(error?.message || "")) &&
      /(column|schema cache|PGRST204)/i.test(String(error?.message || ""))
    );
  }

  function normalizeMetricRows(rows) {
    return (Array.isArray(rows) ? rows : []).map((row) => ({
      legacy_metric_key: row?.legacy_metric_key ?? null,
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
      if (!isMissingLegacyMetricKeyError(error)) throw error;

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
      async () => fetchSupabaseRows({ keys, module: "", limit: keys.length || BATCH_SIZE }),
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
      async () => fetchSupabaseRows({ keys: [], module, limit }),
    );
  }

  async function fetchAllMetrics() {
    const results = await Promise.all(MODULES.map((module) => fetchMetricsByModule(module)));
    return results.flat();
  }

  function resolveRowByLookupKey(rowsByKey, rowsByLegacyKey, lookupKey) {
    if (!lookupKey) return null;
    return rowsByKey.get(lookupKey) || rowsByLegacyKey.get(lookupKey) || null;
  }

  function buildLookupIndexes(rows) {
    const rowsByKey = new Map();
    const rowsByLegacyKey = new Map();

    for (const row of rows.filter(Boolean)) {
      const normalized = normalizeMetricRow(row);
      if (!normalized?.metric_key) continue;
      rowsByKey.set(normalized.metric_key, normalized);
      if (normalized.legacy_metric_key) {
        rowsByLegacyKey.set(normalized.legacy_metric_key, normalized);
      }
    }

    return {
      rowsByKey,
      rowsByLegacyKey,
    };
  }

  function getLookupIndexes(data) {
    if (Array.isArray(data)) return buildLookupIndexes(data);
    if (data === undefined || data === null) {
      return {
        rowsByKey: state.rowsByKey,
        rowsByLegacyKey: state.rowsByLegacyKey,
      };
    }

    return {
      rowsByKey: new Map(),
      rowsByLegacyKey: new Map(),
    };
  }

  function getMetricCandidates(data, lookup = {}) {
    const indexes = getLookupIndexes(data);
    const keys = [lookup.metricKey, lookup.key, ...(lookup.fallbackMetricKeys || [])].filter(Boolean);
    const candidates = [];
    const seenMetricKeys = new Set();

    function appendCandidate(row) {
      if (!row?.metric_key || seenMetricKeys.has(row.metric_key)) return;
      seenMetricKeys.add(row.metric_key);
      candidates.push(row);
    }

    for (const lookupKey of keys) {
      appendCandidate(resolveRowByLookupKey(indexes.rowsByKey, indexes.rowsByLegacyKey, lookupKey));
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
      const resolvedKeys = new Set(
        rows.flatMap((row) => [row?.metric_key, row?.legacy_metric_key]).filter(Boolean),
      );
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
    const lookupIndexes = buildLookupIndexes(rows);
    const elements = Array.from(document.querySelectorAll("[data-metric-key]"));

    for (const element of elements) {
      const lookupKey = element.dataset.metricKey;
      const row =
        resolveRowByLookupKey(lookupIndexes.rowsByKey, lookupIndexes.rowsByLegacyKey, lookupKey) ||
        (useCachedRows ? resolveRowByLookupKey(state.rowsByKey, state.rowsByLegacyKey, lookupKey) : null);
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
      value_numeric: parseOptionalNumber(input.value_numeric),
      source_context: normalizeEditableText(input.source_context) || null,
      ...(input.label !== undefined ? { label: normalizeEditableText(input.label) } : {}),
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
        const currentRow = resolveRowByLookupKey(state.rowsByKey, state.rowsByLegacyKey, payload.metric_key);
        if (!currentRow) {
          throw new Error(`Metric not found: ${payload.metric_key}`);
        }

        const config = await getDirectReadConfig();
        const directPayload = {
          updated_at: new Date().toISOString(),
          value_numeric: payload.value_numeric,
          value_display:
            payload.value_numeric !== undefined
              ? formatMetricDisplay(currentRow, payload.value_numeric)
              : currentRow.value_display,
          source_context: payload.source_context,
          ...(payload.label !== undefined ? { label: payload.label } : {}),
        };
        const response = await fetchJson(buildSupabaseUpdateUrl(config.url, payload.metric_key), {
          method: "PATCH",
          headers: buildSupabaseHeaders(config.key, { Prefer: "return=representation" }),
          body: JSON.stringify(directPayload),
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

    const module = inferModuleFromPath();
    if (module) {
      try {
        return await ensureModuleRows(module);
      } catch (error) {
        console.warn("[metrics-runtime] Module fetch failed. Falling back to key fetch.", error);
      }
    }

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
    formatMetricDisplay,
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
      return resolveRowByLookupKey(state.rowsByKey, state.rowsByLegacyKey, metricKey);
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
