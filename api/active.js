import { setActivePoll } from './_redis.js';

// Public endpoint: sets only the active poll id (no auth).
// This is used so the projector can switch questions without needing to type
// an admin code during the session.
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    const { pollId } = req.body || {};
    if (!pollId) {
      res.status(400).json({ ok: false, error: 'pollId required' });
      return;
    }

    // No labels written here.
    const out = await setActivePoll(String(pollId), null);

    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, ...out });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
