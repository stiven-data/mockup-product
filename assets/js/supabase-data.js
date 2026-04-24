(() => {
  const BATCH_SIZE = 60;
  const API_PATH = "/api/metrics";
  const CONFIG_PATH = "/api/public-config";
  const DEFAULT_SELECT =
    "id,module,metric_key,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at";
  const MAX_LIMIT = 5000;
  const RUNTIME_VERSION = "2026-04-24-2";
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

  function parseOptionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  function buildSourceTrace(row) {
    const parts = [];
    if (row?.source_file) parts.push(`Source file: ${repairTextArtifacts(row.source_file)}`);
    if (row?.source_context) parts.push(`Context: ${repairTextArtifacts(row.source_context)}`);
    return parts.join("\n");
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

  function buildSupabaseReadUrl(baseUrl, query) {
    const url = new URL("/rest/v1/ingestion_data", baseUrl);
    url.searchParams.set("select", DEFAULT_SELECT);
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
        return Array.isArray(payload?.data) ? payload.data : [];
      },
      async () => {
        const config = await getDirectReadConfig();
        const payload = await fetchJson(
          buildSupabaseReadUrl(config.url, { keys, module: "", limit: keys.length || BATCH_SIZE }),
          { headers: buildSupabaseHeaders(config.key) },
        );
        return Array.isArray(payload) ? payload : [];
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
        return Array.isArray(payload?.data) ? payload.data : [];
      },
      async () => {
        const config = await getDirectReadConfig();
        const payload = await fetchJson(
          buildSupabaseReadUrl(config.url, { keys: [], module, limit }),
          { headers: buildSupabaseHeaders(config.key) },
        );
        return Array.isArray(payload) ? payload : [];
      },
    );
  }

  async function fetchAllMetrics() {
    const results = await Promise.all(MODULES.map((module) => fetchMetricsByModule(module)));
    return results.flat();
  }

  function rememberRows(rows) {
    for (const row of rows) {
      if (row?.metric_key) state.rowsByKey.set(row.metric_key, row);
    }
  }

  function clearRows(keys) {
    for (const key of keys) {
      state.rowsByKey.delete(key);
    }
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
      element.dataset.sourceContext = row.source_context || "";
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
          const row = payload.new || payload.old;
          if (!row?.metric_key) return;
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
        return response?.data || null;
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
        return Array.isArray(response) ? response[0] || null : null;
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
    fetchAllMetrics,
    fetchMetricsByModule,
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
