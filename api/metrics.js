const {
  buildSupabaseRestUrl,
  parseRequestQuery,
} = require("./_lib/metrics.js");

function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY.");
  }

  return { url, key };
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

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
    credentials = getSupabaseCredentials();
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
    return;
  }

  try {
    const endpoint = buildSupabaseRestUrl(credentials.url, query);
    const response = await fetch(endpoint, {
      headers: {
        apikey: credentials.key,
        authorization: `Bearer ${credentials.key}`,
      },
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Supabase request failed (${response.status}): ${details}`);
    }

    const data = await response.json();
    res.statusCode = 200;
    res.end(JSON.stringify({ data }));
  } catch (error) {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: error.message }));
  }
};
