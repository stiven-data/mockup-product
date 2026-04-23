module.exports = async (_req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (!url || !key) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "Missing SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY." }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ url, key }));
};
