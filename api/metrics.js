const {
  DEFAULT_SELECT,
  LEGACY_SELECT,
  buildSupabaseRestUrl,
  isMissingSemanticIdentifierError,
  normalizeMetricRows,
  parseMetricUpdatePayload,
  parseRequestQuery,
} = require("./_lib/metrics.js");

function getSupabaseCredentials(mode = "read") {
  const url = process.env.SUPABASE_URL;
  const key =
    mode === "write"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_ANON_KEY
      : process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (mode === "write") {
      throw new Error(
        "Missing SUPABASE_URL and a write-capable key (SUPABASE_SERVICE_ROLE_KEY or publishable/anon key with update policy).",
      );
    }
    throw new Error("Missing SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY.");
  }

  return { url, key };
}

function buildSupabaseUpdateUrl(baseUrl, metricKey) {
  const url = new URL("/rest/v1/ingestion_data", baseUrl);
  url.searchParams.set("metric_key", `eq.${metricKey}`);
  url.searchParams.set(
    "select",
    "id,module,metric_key,label,value_numeric,value_display,value_type,currency,source_file,source_context,updated_at",
  );
  return url.toString();
}

function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
  return {};
}

async function fetchMetricsRows(credentials, query) {
  for (const select of [DEFAULT_SELECT, LEGACY_SELECT]) {
    const endpoint = buildSupabaseRestUrl(credentials.url, query, { select });
    const response = await fetch(endpoint, {
      headers: {
        apikey: credentials.key,
        authorization: `Bearer ${credentials.key}`,
      },
    });

    if (response.ok) {
      return normalizeMetricRows(await response.json());
    }

    const details = await response.text();
    if (select === DEFAULT_SELECT && isMissingSemanticIdentifierError(response.status, details)) {
      continue;
    }

    throw new Error(`Supabase request failed (${response.status}): ${details}`);
  }

  return [];
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    let query;
    try {
      query = parseRequestQuery(req.query || {});
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    let credentials;
    try {
      credentials = getSupabaseCredentials("read");
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
      return;
    }

    try {
      const data = await fetchMetricsRows(credentials, query);
      res.statusCode = 200;
      res.end(JSON.stringify({ data }));
    } catch (error) {
      res.statusCode = 502;
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  try {
    if (req.method !== "PATCH") {
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const { metric_key, updates } = parseMetricUpdatePayload(readJsonBody(req));
    const credentials = getSupabaseCredentials("write");
    const endpoint = buildSupabaseUpdateUrl(credentials.url, metric_key);
    const response = await fetch(endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: credentials.key,
        authorization: `Bearer ${credentials.key}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...updates,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${details}`);
    }

    const [data] = await response.json();
    res.statusCode = 200;
    res.end(JSON.stringify({ data }));
  } catch (error) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: error.message }));
  }
};
