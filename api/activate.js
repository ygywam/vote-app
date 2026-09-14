import { setActivePoll } from './_redis.js';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    const expected = process.env.ADMIN_CODE || process.env.RESET_CODE || 'reset';
    const { adminCode, pollId, label1, label2 } = req.body || {};

    if (!adminCode || String(adminCode) !== String(expected)) {
      res.status(403).json({ ok: false, error: 'Admin code mismatch' });
      return;
    }
    if (!pollId) {
      res.status(400).json({ ok: false, error: 'pollId required' });
      return;
    }

    const out = await setActivePoll(String(pollId), {
      label1,
      label2,
    });

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
