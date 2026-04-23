(() => {
  const BATCH_SIZE = 60;
  const API_PATH = "/api/metrics";
  const CONFIG_PATH = "/api/public-config";
  const RUNTIME_VERSION = "2026-04-23-2";
  const MODULES = ["mortgage", "insurance", "taxes", "gp"];
  const EMPTY_DISPLAY_TOKENS = new Set([
    "",
    "-",
    "—",
    "–",
    "â€”",
    "â€“",
    "null",
    "undefined",
    "nan",
    "n/a",
  ]);
  const MISSING_DISPLAY_FALLBACK = "Missing in Supabase";
  const TEXT_ARTIFACT_REPLACEMENTS = [
    [/KÃ¢â‚¬â€˜1/g, "K-1"],
    [/Kâ€‘1/g, "K-1"],
    [/â€‘/g, "-"],
    [/â€”/g, "-"],
    [/â€“/g, "-"],
    [/Â·/g, " - "],
    [/â€œ|â€/g, '"'],
    [/â–¶/g, ">"],
  ];

  const state = {
    rowsByKey: new Map(),
    listeners: new Set(),
    configPromise: null,
    clientPromise: null,
    channel: null,
    refreshPromise: null,
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

  function buildSourceTrace(row) {
    const parts = [];
    if (row?.source_file) parts.push(`Source file: ${repairTextArtifacts(row.source_file)}`);
    if (row?.source_context) parts.push(`Context: ${repairTextArtifacts(row.source_context)}`);
    return parts.join("\n");
  }

  function isSkippableNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    const tagName = parent.tagName;
    return ["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"].includes(tagName);
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

  async function fetchJson(url, options = {}) {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.headers || {}),
      },
      ...options,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }
    return payload;
  }

  async function fetchMetricBatch(keys) {
    const url = appendRuntimeVersion(new URL(API_PATH, window.location.origin));
    url.searchParams.set("keys", keys.join(","));
    return fetchJson(url.toString()).then((payload) => (Array.isArray(payload?.data) ? payload.data : []));
  }

  async function fetchMetricsByModule(module, limit = 5000) {
    const url = appendRuntimeVersion(new URL(API_PATH, window.location.origin));
    url.searchParams.set("module", module);
    url.searchParams.set("limit", String(limit));
    return fetchJson(url.toString()).then((payload) => (Array.isArray(payload?.data) ? payload.data : []));
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

  async function getPublicConfig() {
    if (!state.configPromise) {
      const url = appendRuntimeVersion(new URL(CONFIG_PATH, window.location.origin));
      state.configPromise = fetchJson(url.toString()).catch((error) => {
        console.warn("[metrics-runtime] Public config unavailable.", error);
        return null;
      });
    }
    return state.configPromise;
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
      label: normalizeEditableText(input.label),
      value_display: normalizeDisplayValue(input.value_display),
      value_numeric: normalizeEditableText(input.value_numeric),
      source_context: normalizeEditableText(input.source_context),
    };

    const response = await fetchJson(API_PATH, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    if (response?.data?.metric_key) {
      rememberRows([response.data]);
      applyRowsToPage([response.data]);
      emit("metric:saved", response.data);
    }

    return response?.data || null;
  }

  async function loadDynamicMetrics() {
    repairStaticArtifactsInDom();

    const elements = Array.from(document.querySelectorAll("[data-metric-key]"));
    if (!elements.length) return;

    const uniqueKeys = [...new Set(elements.map((element) => element.dataset.metricKey).filter(Boolean))];
    if (!uniqueKeys.length) return;

    try {
      const rows = (
        await Promise.all(chunk(uniqueKeys, BATCH_SIZE).map((keys) => fetchMetricBatch(keys)))
      ).flat();

      rememberRows(rows);
      applyRowsToPage(rows, { useCachedRows: false });
      emit("metric:loaded", rows);
    } catch (error) {
      console.warn("[metrics-runtime] Falling back to static HTML values.", error);
      applyRowsToPage([], { useCachedRows: false });
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
    fetchAllMetrics,
    fetchMetricsByModule,
    getRow(metricKey) {
      return state.rowsByKey.get(metricKey) || null;
    },
    getRows() {
      return [...state.rowsByKey.values()];
    },
    loadDynamicMetrics,
    refreshMetrics,
    normalizeDisplayValue,
    repairStaticArtifactsInDom,
    repairTextArtifacts,
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
