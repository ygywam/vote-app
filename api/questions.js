import { getQuestions, setQuestions } from './_redis.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      const questions = await getQuestions();
      res.status(200).json({ ok: true, questions: questions || [] });
      return;
    }

    if (req.method === 'POST') {
      const expected = process.env.ADMIN_CODE || process.env.RESET_CODE || 'reset';
      const { adminCode, questions } = req.body || {};

      if (!adminCode || String(adminCode) !== String(expected)) {
        res.status(403).json({ ok: false, error: 'Admin code mismatch' });
        return;
      }

      const saved = await setQuestions(questions);
      res.status(200).json({ ok: true, questions: saved });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (e) {
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
