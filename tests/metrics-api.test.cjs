const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  buildSourceTrace,
  buildSupabaseRestUrl,
  parseMetricUpdatePayload,
  parseRequestQuery,
} = require("../api/_lib/metrics.js");
const metricsHandler = require("../api/metrics.js");

test("parseRequestQuery normalizes and deduplicates metric keys", () => {
  const query = parseRequestQuery({
    keys: " mortgage_total_due , mortgage_total_due, mortgage_interest_rate ,, ",
  });

  assert.deepEqual(query, {
    keys: ["mortgage_total_due", "mortgage_interest_rate"],
    module: "",
    limit: 500,
  });
});

test("buildSupabaseRestUrl builds a key-filtered REST query", () => {
  const url = decodeURIComponent(
    buildSupabaseRestUrl("https://example.supabase.co", {
      keys: ["mortgage_total_due", "mortgage_interest_rate"],
      module: "",
      limit: 2,
    }),
  );

  assert.match(url, /https:\/\/example\.supabase\.co\/rest\/v1\/ingestion_data\?/);
  assert.match(url, /metric_key=in\.\("mortgage_total_due","mortgage_interest_rate"\)/);
  assert.match(
    url,
    /select=id,module,metric_key,semantic_identifier,label,display_label,search_label,value_numeric,value_display,value_type,currency,source_file,source_context,ui_context,updated_at/,
  );
  assert.match(url, /limit=2/);
});

test("schema and setup include the rerunnable semantic_identifier migration", () => {
  const schema = fs.readFileSync(path.join(__dirname, "..", "supabase", "schema.sql"), "utf8");
  const setup = fs.readFileSync(path.join(__dirname, "..", "supabase", "setup.sql"), "utf8");

  assert.match(schema, /alter table if exists ingestion_data\s+add column if not exists semantic_identifier text;/i);
  assert.match(setup, /alter table if exists ingestion_data\s+add column if not exists semantic_identifier text;/i);
  assert.match(schema, /create index if not exists ingestion_data_semantic_identifier_idx on ingestion_data \(semantic_identifier\);/i);
  assert.match(setup, /create index if not exists ingestion_data_semantic_identifier_idx on ingestion_data \(semantic_identifier\);/i);
});

test("parseRequestQuery accepts module requests without keys", () => {
  const query = parseRequestQuery({
    module: "taxes",
    limit: "1200",
  });

  assert.deepEqual(query, {
    keys: [],
    module: "taxes",
    limit: 1200,
  });
});

test("buildSourceTrace formats file and context for hover traceability", () => {
  const trace = buildSourceTrace({
    source_file: "modules/taxes/views/index.html",
    source_context: "Net payable after appeal",
  });

  assert.equal(
    trace,
    "Source file: modules/taxes/views/index.html\nContext: Net payable after appeal",
  );
});

test("parseMetricUpdatePayload normalizes editable fields", () => {
  const payload = parseMetricUpdatePayload({
    metric_key: "gp_modules_gp_views_gp_mockups_025",
    value_display: "   ",
    value_numeric: "not-a-number",
    source_context: "2024 KÃ¢â‚¬â€˜1",
  });

  assert.deepEqual(payload, {
    metric_key: "gp_modules_gp_views_gp_mockups_025",
    updates: {
      value_display: "-",
      value_numeric: null,
      source_context: "2024 K-1",
    },
  });
});

test("parseMetricUpdatePayload rejects missing metric keys", () => {
  assert.throws(
    () => parseMetricUpdatePayload({ value_display: "$10" }),
    /metric_key/i,
  );
});

test("parseMetricUpdatePayload rejects payloads without editable fields", () => {
  assert.throws(
    () => parseMetricUpdatePayload({ metric_key: "mortgage_total_due" }),
    /editable field/i,
  );
});

test("GET /api/metrics retries without semantic_identifier for legacy Supabase schemas", async () => {
  const originalFetch = global.fetch;
  const originalEnv = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };

  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "public-key";
  delete process.env.SUPABASE_ANON_KEY;

  const fetchCalls = [];
  global.fetch = async (url) => {
    fetchCalls.push(decodeURIComponent(String(url)));
    if (fetchCalls.length === 1) {
      return {
        ok: false,
        status: 400,
        async text() {
          return JSON.stringify({
            code: "PGRST204",
            details: "Could not find the 'semantic_identifier' column of 'ingestion_data' in the schema cache",
          });
        },
      };
    }

    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify([]);
      },
      async json() {
        return [
          {
            module: "gp",
            metric_key: "gp_total_gp_sponsors",
            label: "Total GP Sponsors (PPC)",
            value_display: "6",
          },
        ];
      },
    };
  };

  const response = {
    headers: {},
    statusCode: 200,
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(payload) {
      this.body = payload;
    },
  };

  try {
    await metricsHandler(
      {
        method: "GET",
        query: {
          module: "gp",
        },
      },
      response,
    );
  } finally {
    global.fetch = originalFetch;
    process.env.SUPABASE_URL = originalEnv.SUPABASE_URL;
    process.env.SUPABASE_PUBLISHABLE_KEY = originalEnv.SUPABASE_PUBLISHABLE_KEY;
    process.env.SUPABASE_ANON_KEY = originalEnv.SUPABASE_ANON_KEY;
  }

  assert.equal(response.statusCode, 200);
  assert.equal(fetchCalls.length, 2);
  assert.match(fetchCalls[0], /semantic_identifier/);
  assert.doesNotMatch(fetchCalls[1], /semantic_identifier/);

  const payload = JSON.parse(response.body);
  assert.equal(payload.data[0].semantic_identifier, null);
});
