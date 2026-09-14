import { incr } from './_redis.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    const { choice } = req.body || {};
    if (choice !== 1 && choice !== 2) {
      res.status(400).json({ ok: false, error: 'choice must be 1 or 2' });
      return;
    }

    const counts = await incr(choice);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, counts });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
