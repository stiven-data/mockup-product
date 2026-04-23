const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildSourceTrace,
  buildSupabaseRestUrl,
  parseRequestQuery,
} = require("../api/_lib/metrics.js");

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
  assert.match(url, /select=metric_key,value_display,source_file,source_context,updated_at/);
  assert.match(url, /limit=2/);
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
