const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const DEFAULT_SELECT =
  "id,module,metric_key,semantic_identifier,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at";
const TEXT_ARTIFACT_REPLACEMENTS = [
  [/KÃ¢â‚¬â€˜1/g, "K-1"],
  [/Kâ€‘1/g, "K-1"],
  [/â€‘/g, "-"],
  [/â€”/g, "-"],
  [/â€“/g, "-"],
  [/Â·/g, " - "],
];
const EMPTY_DISPLAY_TOKENS = new Set(["", "-", "—", "–", "â€”", "â€“", "null", "undefined", "nan", "n/a"]);

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

function buildSupabaseRestUrl(baseUrl, query) {
  const url = new URL("/rest/v1/ingestion_data", baseUrl);
  url.searchParams.set("select", DEFAULT_SELECT);
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

function parseMetricUpdatePayload(body = {}) {
  const metric_key = typeof body.metric_key === "string" ? body.metric_key.trim() : "";
  if (!metric_key) {
    throw new Error("metric_key is required.");
  }

  const updates = {};
  if (body.value_display !== undefined) {
    updates.value_display = normalizeDisplayValue(body.value_display);
  }
  if (body.value_numeric !== undefined) {
    updates.value_numeric = parseOptionalNumber(body.value_numeric);
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
  buildSourceTrace,
  buildSupabaseRestUrl,
  parseMetricUpdatePayload,
  parseRequestQuery,
};
