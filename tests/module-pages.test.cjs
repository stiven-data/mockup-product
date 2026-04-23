const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8");
}

test("taxes page loads the shared metrics runtime and contains metric bindings", () => {
  const html = read("modules/taxes/views/index.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /data-metric-key=/);
});

test("gp page loads the shared metrics runtime and binds manual count fields", () => {
  const html = read("modules/Gp/views/gp mockups.html");
  assert.match(html, /supabase-data\.js/);
  assert.match(html, /gp_total_gp_sponsors/);
  assert.match(html, /gp_k1_partners_in_manager_entity/);
  assert.match(html, /gp_source_k1_year/);
});
