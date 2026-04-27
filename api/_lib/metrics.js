const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const DEFAULT_CURRENCY = "USD";
const DEFAULT_SELECT =
  "id,module,metric_key,legacy_metric_key,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at";
const LEGACY_SELECT =
  "id,module,metric_key,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at";
const TEXT_ARTIFACT_REPLACEMENTS = [
  [/KÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Ëœ1/g, "K-1"],
  [/KÃ¢â‚¬â€˜1/g, "K-1"],
  [/Ã¢â‚¬â€˜/g, "-"],
  [/Ã¢â‚¬â€/g, "-"],
  [/Ã¢â‚¬â€œ/g, "-"],
  [/Ã‚Â·/g, " - "],
];
const EMPTY_DISPLAY_TOKENS = new Set(["", "-", "â€”", "â€“", "Ã¢â‚¬â€", "Ã¢â‚¬â€œ", "null", "undefined", "nan", "n/a"]);

function parseMetricKeys(rawValue) {
  const values = Array.isArray(rawValue) ? rawValue : String(rawValue || "").split(",");
  return [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];
}

function parseRequestQuery(query = {}) {
  const keys = parseMetricKeys(query.keys);
  const module = typeof query.module === "string" ? query.module.trim() : "";
  const rawLimit = Number.parseInt(String(query.limit || DEFAULT_LIMIT), 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  if (!keys.length && !module) {
    throw new Error("Provide at least one metric key or a module.");
  }

  return { keys, module, limit };
}

function buildSupabaseRestUrl(baseUrl, query, options = {}) {
  const url = new URL("/rest/v1/ingestion_data", baseUrl);
  url.searchParams.set("select", options.select || DEFAULT_SELECT);
  url.searchParams.set("order", "metric_key.asc");
  url.searchParams.set("limit", String(query.limit || DEFAULT_LIMIT));

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

function isMissingLegacyMetricKeyError(status, details = "") {
  return (
    status === 400 &&
    /legacy_metric_key/i.test(String(details)) &&
    /(column|schema cache|PGRST204)/i.test(String(details))
  );
}

function normalizeMetricRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    legacy_metric_key: row?.legacy_metric_key ?? null,
    ...row,
  }));
}

function buildSourceTrace(row) {
  const lines = [];
  if (row?.source_file) lines.push(`Source file: ${row.source_file}`);
  if (row?.source_context) lines.push(`Context: ${row.source_context}`);
  return lines.join("\n");
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

function parseMetricUpdatePayload(body = {}) {
  const metric_key = typeof body.metric_key === "string" ? body.metric_key.trim() : "";
  if (!metric_key) {
    throw new Error("metric_key is required.");
  }

  const updates = {};
  if (body.value_numeric !== undefined) {
    updates.value_numeric = parseOptionalNumber(body.value_numeric);
  }
  if (body.label !== undefined) {
    const label = repairTextArtifacts(body.label);
    if (!label) {
      throw new Error("label cannot be empty.");
    }
    updates.label = label;
  }
  if (body.source_context !== undefined) {
    updates.source_context = repairTextArtifacts(body.source_context) || null;
  }
  if (!Object.keys(updates).length) {
    throw new Error("Provide at least one editable field.");
  }

  return { metric_key, updates };
}

module.exports = {
  DEFAULT_SELECT,
  LEGACY_SELECT,
  buildSourceTrace,
  buildSupabaseRestUrl,
  formatMetricDisplay,
  isMissingLegacyMetricKeyError,
  normalizeDisplayValue,
  normalizeMetricRows,
  parseMetricUpdatePayload,
  parseOptionalNumber,
  parseRequestQuery,
};
