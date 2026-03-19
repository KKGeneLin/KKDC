let fetchFn;
try { fetchFn = global.fetch || require('node-fetch'); } catch (e) { fetchFn = global.fetch; }
const fetch = fetchFn;

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const payload = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');
    return res.status(200).json({ ok: true, persisted: false, message: 'Storage disabled - not persisted', echo: payload });
  } catch (err) {
    console.error('api/save error:', err && (err.stack || err.message || err));
    if (err instanceof SyntaxError) return res.status(400).json({ error: 'Invalid JSON', details: err.message });
    return res.status(500).json({ ok: false, error: 'internal_error', message: String(err && err.message) });
  }
};
