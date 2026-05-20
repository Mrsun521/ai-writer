import config from "./config.js";

/* ------------------------------------------------------------------ */
/*  Base64url helpers                                                 */
/* ------------------------------------------------------------------ */

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return atob(str);
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return b64url(str);
}

/* ------------------------------------------------------------------ */
/*  JWT                                                                */
/* ------------------------------------------------------------------ */

export async function signJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + config.JWT_EXPIRES_IN };

  const encoder = new TextEncoder();
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(body));

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  return `${headerB64}.${payloadB64}.${bufToB64url(sig)}`;
}

export async function verifyJWT(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, sigB64] = parts;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
    encoder.encode(`${headerB64}.${payloadB64}`),
  );

  if (!valid) return null;

  const payload = JSON.parse(b64urlDecode(payloadB64));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) return null;

  return payload;
}

/* ------------------------------------------------------------------ */
/*  API Keys                                                           */
/* ------------------------------------------------------------------ */

/** Generate a new API key: sk- + random chars */
export function generateApiKey() {
  const prefix = config.API_KEY_PREFIX;
  const remaining = config.API_KEY_LENGTH - prefix.length;
  const bytes = new Uint8Array(remaining);
  crypto.getRandomValues(bytes);
  let str = prefix;
  for (let i = 0; i < remaining; i++) {
    const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
    str += charset[bytes[i] % charset.length];
  }
  return str;
}

/** Hash an API key for storage (SHA-256 prefix) */
export async function hashApiKey(key) {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(key));
  return bufToB64url(hash);
}

/* ------------------------------------------------------------------ */
/*  Password hashing (PBKDF2)                                          */
/* ------------------------------------------------------------------ */

function generateSalt(length = 16) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bufToB64url(bytes);
}

export async function hashPassword(password) {
  const salt = generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return `${salt}:${bufToB64url(bits)}`;
}

export async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const computed = bufToB64url(bits);
  return computed === hash;
}

/* ------------------------------------------------------------------ */
/*  Rate limiting (KV-backed)                                          */
/* ------------------------------------------------------------------ */

export async function checkRateLimit(identifier, env, opts = {}) {
  const window = opts.window || config.RATE_LIMIT_WINDOW;
  const max = opts.max || config.RATE_LIMIT_MAX;
  const now = Math.floor(Date.now() / 1000);
  const windowKey = Math.floor(now / window);
  const kvKey = `ratelimit:${identifier}:${windowKey}`;

  const kv = env.USAGE;
  if (!kv) return true;

  const raw = await kv.get(kvKey);
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= max) return false;

  await kv.put(kvKey, String(count + 1), { expirationTtl: window });
  return true;
}
