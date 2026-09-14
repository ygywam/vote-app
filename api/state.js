import { getCounts } from './_redis.js';

export default async function handler(req, res) {
  try {
    const counts = await getCounts();
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, counts });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
