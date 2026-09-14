import { getSettings, setSettings } from './_redis.js';

export default async function handler(req, res) {
  try {
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'GET') {
      const settings = await getSettings();
      res.status(200).json({ ok: true, settings: settings || null });
      return;
    }

    if (req.method === 'POST') {
      const expected = process.env.ADMIN_CODE || process.env.RESET_CODE || 'reset';
      const { adminCode, title, subtitle } = req.body || {};

      if (!adminCode || String(adminCode) !== String(expected)) {
        res.status(403).json({ ok: false, error: 'Admin code mismatch' });
        return;
      }

      const saved = await setSettings({ title, subtitle });
      res.status(200).json({ ok: true, settings: saved });
      return;
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (e) {
    res.status(e.statusCode || 500).json({ ok: false, error: e.message || 'error' });
  }
}
