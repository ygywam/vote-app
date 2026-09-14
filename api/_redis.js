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
  one: 'qrVote:one',
  two: 'qrVote:two',
};

export async function getCounts() {
  const [one, two] = await Promise.all([
    redis('get', [KEYS.one]),
    redis('get', [KEYS.two]),
  ]);

  const n1 = Number(one?.result ?? 0);
  const n2 = Number(two?.result ?? 0);
  return {
    one: Number.isFinite(n1) ? n1 : 0,
    two: Number.isFinite(n2) ? n2 : 0,
  };
}

export async function incr(choice) {
  const key = choice === 1 ? KEYS.one : KEYS.two;
  await redis('incr', [key]);
  return getCounts();
}

export async function reset(code) {
  const expected = process.env.RESET_CODE || 'reset';
  if (code !== expected) {
    const err = new Error('Reset code mismatch');
    err.statusCode = 403;
    throw err;
  }
  await Promise.all([
    redis('set', [KEYS.one, '0']),
    redis('set', [KEYS.two, '0']),
  ]);
  return getCounts();
}
