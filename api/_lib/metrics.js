const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const DEFAULT_SELECT = "metric_key,value_display,source_file,source_context,updated_at";

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

module.exports = {
  buildSourceTrace,
  buildSupabaseRestUrl,
  parseRequestQuery,
};
