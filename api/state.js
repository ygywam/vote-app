import { getActivePollId, getCountsForPoll } from './_redis.js';

export default async function handler(req, res) {
  try {
    const pollId = (req.query && req.query.pollId) ? String(req.query.pollId) : await getActivePollId();
    const counts = await getCountsForPoll(pollId);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ok: true, pollId, counts });
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
