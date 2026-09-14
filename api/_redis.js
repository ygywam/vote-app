const REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function assertEnv() {
  if (!REST_URL || !REST_TOKEN) {
    const msg = 'Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN';
    const err = new Error(msg);
    err.statusCode = 500;
    throw err;
  }
}

async function redis(cmd, args = []) {
  assertEnv();
  const url = `${REST_URL}/${cmd}/${args.map(encodeURIComponent).join('/')}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${REST_TOKEN}`,
    },
    cache: 'no-store',
  });
  const j = await r.json();
  if (!r.ok) {
    const err = new Error(j?.error || 'Redis request failed');
    err.statusCode = r.status;
    throw err;
  }
  return j;
}

export const KEYS = {
  activePoll: 'qrVote:activePoll',
  questions: 'qrVote:questions',
  settings: 'qrVote:settings',
};

function pollKeys(pollId) {
  const safe = String(pollId || 'poll1').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'poll1';
  return {
    one: `qrVote:${safe}:one`,
    two: `qrVote:${safe}:two`,
    labels: `qrVote:${safe}:labels`,
    id: safe,
  };
}

export async function getActivePollId() {
  const r = await redis('get', [KEYS.activePoll]);
  const v = String(r?.result || 'poll1');
  return v || 'poll1';
}

export async function getCounts() {
  const active = await getActivePollId();
  return getCountsForPoll(active);
}

export async function getCountsForPoll(pollId) {
  const k = pollKeys(pollId);
  const [one, two] = await Promise.all([
    redis('get', [k.one]),
    redis('get', [k.two]),
  ]);

  const n1 = Number(one?.result ?? 0);
  const n2 = Number(two?.result ?? 0);
  return {
    one: Number.isFinite(n1) ? n1 : 0,
    two: Number.isFinite(n2) ? n2 : 0,
  };
}

export async function incr(choice, pollId) {
  const k = pollKeys(pollId);
  const key = choice === 1 ? k.one : k.two;
  await redis('incr', [key]);
  return getCountsForPoll(k.id);
}

export async function reset(code, pollId) {
  const expected = process.env.RESET_CODE || 'reset';
  if (code !== expected) {
    const err = new Error('Reset code mismatch');
    err.statusCode = 403;
    throw err;
  }

  const k = pollKeys(pollId);
  await Promise.all([
    redis('set', [k.one, '0']),
    redis('set', [k.two, '0']),
  ]);
  return getCountsForPoll(k.id);
}

export async function setActivePoll(pollId, labels) {
  const k = pollKeys(pollId);
  await redis('set', [KEYS.activePoll, k.id]);
  if (labels && (labels.label1 || labels.label2)) {
    await redis('set', [k.labels, JSON.stringify({
      label1: String(labels.label1 || ''),
      label2: String(labels.label2 || ''),
    })]);
  }
  // Ensure keys exist
  await Promise.all([
    redis('setnx', [k.one, '0']),
    redis('setnx', [k.two, '0']),
  ]);
  return { pollId: k.id };
}

export async function getQuestions() {
  const r = await redis('get', [KEYS.questions]);
  if (!r?.result) return null;
  try {
    return JSON.parse(r.result);
  } catch {
    return null;
  }
}

export async function setQuestions(questions) {
  // questions: [{ pollId, label1, label2 }]
  const sanitized = Array.isArray(questions)
    ? questions
        .map((q) => ({
          pollId: pollKeys(q?.pollId).id,
          label1: String(q?.label1 || ''),
          label2: String(q?.label2 || ''),
        }))
        .slice(0, 50)
    : [];

  await redis('set', [KEYS.questions, JSON.stringify(sanitized)]);
  // Ensure keys exist for each poll
  await Promise.all(
    sanitized.flatMap((q) => {
      const k = pollKeys(q.pollId);
      return [
        redis('setnx', [k.one, '0']),
        redis('setnx', [k.two, '0']),
        redis('setnx', [k.labels, JSON.stringify({ label1: q.label1, label2: q.label2 })]),
      ];
    })
  );
  return sanitized;
}

export async function getSettings() {
  const r = await redis('get', [KEYS.settings]);
  if (!r?.result) return null;
  try {
    return JSON.parse(r.result);
  } catch {
    return null;
  }
}

export async function setSettings(settings) {
  const sanitized = {
    title: String(settings?.title || ''),
    subtitle: String(settings?.subtitle || ''),
  };
  await redis('set', [KEYS.settings, JSON.stringify(sanitized)]);
  return sanitized;
}
