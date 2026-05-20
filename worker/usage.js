import config from "./config.js";

/**
 * Usage tracking for free-tier rate limiting and token-level billing.
 *
 * Uses Workers KV (binding `USAGE`) as primary store.
 * Falls back to an in-memory Map when KV is unavailable.
 */

const memFallback = new Map();

/* ------------------------------------------------------------------ */
/*  KV helpers                                                         */
/* ------------------------------------------------------------------ */

function kvKey(ip) {
  return `usage:${ip}`;
}

function userKey(userId) {
  return `user:${userId}`;
}

function dailyKey(userId, date) {
  return `usage:daily:${userId}:${date}`;
}

function txnKey(userId, timestamp) {
  return `txn:${userId}:${timestamp}`;
}

async function getRecord(ip, env) {
  if (env && env.USAGE) {
    const raw = await env.USAGE.get(kvKey(ip));
    return raw ? JSON.parse(raw) : null;
  }
  return memFallback.get(ip) ?? null;
}

async function putRecord(ip, record, env) {
  if (env && env.USAGE) {
    await env.USAGE.put(kvKey(ip), JSON.stringify(record));
  }
  memFallback.set(ip, record);
}

/* ------------------------------------------------------------------ */
/*  Legacy free-tier helpers (preserved for backward compat)           */
/* ------------------------------------------------------------------ */

export async function getRemaining(ip, env) {
  const record = await getRecord(ip, env);
  if (!record) return config.FREE_TRIALS;

  const today = new Date().toISOString().slice(0, 10);
  if (record.lastReset !== today) {
    record.count = 0;
    record.lastReset = today;
    await putRecord(ip, record, env);
    return config.FREE_TRIALS;
  }

  return Math.max(0, config.FREE_TRIALS - record.count);
}

export async function consume(ip, env) {
  const record = (await getRecord(ip, env)) ?? { count: 0, lastReset: "" };
  const today = new Date().toISOString().slice(0, 10);
  if (record.lastReset !== today) {
    record.count = 1;
    record.lastReset = today;
  } else {
    record.count += 1;
  }
  await putRecord(ip, record, env);
  return Math.max(0, config.FREE_TRIALS - record.count);
}

export async function addPaid(ip, amount, env) {
  const record = (await getRecord(ip, env)) ?? { count: 0, lastReset: "", paid: 0 };
  record.paid = (record.paid || 0) + amount;
  await putRecord(ip, record, env);
  const remaining = await getRemaining(ip, env);
  return remaining + (record.paid || 0);
}

export async function canUse(ip, env) {
  const remaining = await getRemaining(ip, env);
  if (remaining > 0) return true;
  const record = await getRecord(ip, env);
  const paid = record?.paid ?? 0;
  return paid > 0;
}

export async function consumePaid(ip, env) {
  const record = (await getRecord(ip, env)) ?? { count: 0, lastReset: "" };
  const paid = record.paid || 0;
  if (paid > 0) {
    record.paid = paid - 1;
    await putRecord(ip, record, env);
  }
  return record.paid || 0;
}

/* ------------------------------------------------------------------ */
/*  Token-level billing (new)                                          */
/* ------------------------------------------------------------------ */

/**
 * Get a user's current balance from KV.
 * Returns { balance, totalSpent, totalEarned }.
 */
export async function getUserBalance(userId, env) {
  const kv = env.USAGE;
  if (!kv) return { balance: config.FREE_TRIAL_TOKENS, totalSpent: 0, totalEarned: 0 };

  const key = `balance:${userId}`;
  const raw = await kv.get(key);
  if (raw) return JSON.parse(raw);

  /* First visit: grant free trial tokens */
  const initial = { balance: config.FREE_TRIAL_TOKENS, totalSpent: 0, totalEarned: config.FREE_TRIAL_TOKENS };
  await kv.put(key, JSON.stringify(initial));
  return initial;
}

/**
 * Deduct tokens from a user's balance.
 * Returns the new balance, or -1 if insufficient.
 */
export async function deductBalance(userId, inputTokens, outputTokens, model, env) {
  const kv = env.USAGE;
  if (!kv) return -1;

  const prices = config.PRICES[model];
  if (!prices) return -1;

  /* Calculate cost in token-units (1 token-unit = price per million tokens) */
  const cost =
    (inputTokens * prices.input + outputTokens * prices.output) / 1_000_000;

  const costWhole = Math.ceil(cost * 1_000_000) / 1_000_000;

  const balance = await getUserBalance(userId, env);
  if (balance.balance < costWhole) return -1;

  balance.balance -= costWhole;
  balance.totalSpent += costWhole;
  await kv.put(`balance:${userId}`, JSON.stringify(balance));

  return balance.balance;
}

/**
 * Add tokens to a user's balance (top-up).
 */
export async function addBalance(userId, amount, env) {
  const kv = env.USAGE;
  if (!kv) return 0;

  const balance = await getUserBalance(userId, env);
  balance.balance += amount;
  balance.totalEarned += amount;
  await kv.put(`balance:${userId}`, JSON.stringify(balance));

  return balance.balance;
}

/**
 * Record daily token usage.
 */
export async function recordDailyUsage(userId, model, inputTokens, outputTokens, env) {
  const kv = env.USAGE;
  if (!kv) return;

  const today = new Date().toISOString().slice(0, 10);
  const key = dailyKey(userId, today);

  const raw = await kv.get(key);
  const record = raw ? JSON.parse(raw) : { inputTokens: 0, outputTokens: 0, requests: 0, models: {} };

  record.inputTokens += inputTokens;
  record.outputTokens += outputTokens;
  record.requests += 1;
  record.models[model] = (record.models[model] || 0) + 1;

  await kv.put(key, JSON.stringify(record), { expirationTtl: 86400 * 31 });
}

/**
 * Get daily usage for a user in a date range.
 */
export async function getDailyUsage(userId, startDate, endDate, env) {
  const kv = env.USAGE;
  if (!kv) return [];

  const results = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    const key = dailyKey(userId, dateStr);
    const raw = await kv.get(key);
    if (raw) {
      results.push({ date: dateStr, ...JSON.parse(raw) });
    }
  }

  return results;
}

/**
 * Get aggregate usage stats for a user.
 */
export async function getUserUsage(userId, env) {
  const balance = await getUserBalance(userId, env);
  const today = new Date().toISOString().slice(0, 10);
  const todayRaw = await (env?.USAGE?.get(dailyKey(userId, today)));
  const todayUsage = todayRaw ? JSON.parse(todayRaw) : { inputTokens: 0, outputTokens: 0, requests: 0 };

  return {
    balance: balance.balance,
    totalSpent: balance.totalSpent,
    totalEarned: balance.totalEarned,
    todayRequests: todayUsage.requests || 0,
    todayTokens: (todayUsage.inputTokens || 0) + (todayUsage.outputTokens || 0),
  };
}

/* ------------------------------------------------------------------ */
/*  Transaction recording                                              */
/* ------------------------------------------------------------------ */

/**
 * Record a transaction (top-up, usage deduction, etc.)
 */
export async function addTransaction(userId, type, amount, description, env) {
  const kv = env.USAGE;
  if (!kv) return;

  const now = Date.now();
  const key = txnKey(userId, now);
  const txn = {
    type,
    amount,
    description,
    createdAt: new Date().toISOString(),
    id: `${userId}-${now}`,
  };

  await kv.put(key, JSON.stringify(txn), { expirationTtl: 86400 * 365 });
}

/**
 * List transactions for a user, newest first.
 */
export async function getTransactions(userId, env, limit = 50) {
  const kv = env.USAGE;
  if (!kv) return [];

  const prefix = `txn:${userId}:`;
  const list = await kv.list({ prefix });

  const keys = list.keys.sort((a, b) => b.name.localeCompare(a.name)).slice(0, limit);
  const txns = await Promise.all(
    keys.map(async (k) => {
      const raw = await kv.get(k.name);
      return raw ? JSON.parse(raw) : null;
    }),
  );

  return txns.filter(Boolean);
}

/**
 * Estimate token count from text (rough approximation).
 * ~1 token per 4 chars for English, ~1 token per 1.5 chars for CJK.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const other = text.length - cjk;
  return Math.ceil(cjk / 1.5 + other / 4);
}
