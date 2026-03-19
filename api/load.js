let fetchFn;
try { fetchFn = global.fetch || require('node-fetch'); } catch (e) { fetchFn = global.fetch; }
const fetch = fetchFn;

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    // Storage has been disabled by request. Return a non-persistent default response.
    return res.status(200).json({ ok: true, data: null, message: 'Storage disabled - no database configured' });
  } catch (err) {
    console.error('api/load error:', err && (err.stack || err.message || err));
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err && err.message) });
  }
};
