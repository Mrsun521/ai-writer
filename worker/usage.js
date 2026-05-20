import config from "./config.js";

/**
 * Usage tracking for free-tier rate limiting.
 *
 * Uses Workers KV (binding `USAGE`) as primary store.
 * Falls back to an in-memory Map when KV is unavailable
 * (local dev, no binding configured).  Memory state is
 * lost on worker restart but avoids hard failure.
 */

const memFallback = new Map();

function kvKey(ip) {
  return `usage:${ip}`;
}

/**
 * Read usage record for an IP.
 * Returns `{ count, lastReset }` or null.
 */
async function getRecord(ip, env) {
  if (env && env.USAGE) {
    const raw = await env.USAGE.get(kvKey(ip));
    return raw ? JSON.parse(raw) : null;
  }
  return memFallback.get(ip) ?? null;
}

/**
 * Write usage record for an IP.
 */
async function putRecord(ip, record, env) {
  if (env && env.USAGE) {
    await env.USAGE.put(kvKey(ip), JSON.stringify(record));
  }
  memFallback.set(ip, record);
}

/**
 * Return remaining free uses for the given IP.
 */
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

/**
 * Consume one free use for the IP.
 * Returns the remaining count AFTER consumption.
 * When remaining hits 0 the caller should reject the request.
 */
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

/**
 * Top up paid uses for an IP.
 * Paid uses are tracked separately and stack on top of the free trial.
 * Value format: `{ count, lastReset, paid: N }`
 */
export async function addPaid(ip, amount, env) {
  const record = (await getRecord(ip, env)) ?? { count: 0, lastReset: "", paid: 0 };
  record.paid = (record.paid || 0) + amount;
  await putRecord(ip, record, env);

  const remaining = await getRemaining(ip, env);
  return remaining + (record.paid || 0);
}

/**
 * Check whether the IP still has any free or paid uses left.
 */
export async function canUse(ip, env) {
  const remaining = await getRemaining(ip, env);
  if (remaining > 0) return true;

  const record = await getRecord(ip, env);
  const paid = record?.paid ?? 0;
  return paid > 0;
}

/**
 * Consume a paid use (when free trials are exhausted).
 * Returns the remaining paid uses after consumption.
 */
export async function consumePaid(ip, env) {
  const record = (await getRecord(ip, env)) ?? { count: 0, lastReset: "" };
  const paid = record.paid || 0;
  if (paid > 0) {
    record.paid = paid - 1;
    await putRecord(ip, record, env);
  }
  return record.paid || 0;
}
