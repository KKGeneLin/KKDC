let fetchFn;
try {
  fetchFn = global.fetch || require('node-fetch');
} catch (e) {
  fetchFn = global.fetch;
}
const fetch = fetchFn;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '');

  // Quick bypass-response for debugging when test header present
  if (req.headers['x-test-bypass'] && req.headers['x-test-user']) {
    return res.status(200).json({ ok: true, debug: 'bypass-received', user: req.headers['x-test-user'] });
  }

  // Verify token to get user
  try {
    // Test bypass: when TEST_BYPASS_SECRET is set in env, allow a test header to simulate a user
    const bypassSecret = process.env.TEST_BYPASS_SECRET;
    let user;
    if (bypassSecret && req.headers['x-test-bypass'] === bypassSecret && req.headers['x-test-user']) {
      user = { id: req.headers['x-test-user'] };
    } else {
      const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: SERVICE_KEY,
        },
      });
      if (!u.ok) return res.status(401).json({ error: 'Invalid token' });
      user = await u.json();
    }

    const payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    const content = payload.data || payload;

    // Upsert into table `tournaments` with owner = user.id
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/tournaments`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify([{ owner: user.id, content }]),
    });

    if (!upsert.ok) {
      const txt = await upsert.text();
      return res.status(500).json({ error: 'Upsert failed', details: txt });
    }

    const result = await upsert.json();
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
