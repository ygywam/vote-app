import { reset } from './_redis.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }
    const { code } = req.body || {};
    const counts = await reset(code);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, counts });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
