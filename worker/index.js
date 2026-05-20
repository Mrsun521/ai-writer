import config from "./config.js";
import { MODELS, getModel, MODEL_ROUTES } from "./models.js";
import {
  signJWT, verifyJWT, generateApiKey, hashApiKey,
  hashPassword, verifyPassword, checkRateLimit,
} from "./auth.js";
import {
  getUserBalance, deductBalance, recordDailyUsage,
  getDailyUsage, getUserUsage, addBalance, addTransaction,
  getTransactions, estimateTokens, getRemaining, consume,
  canUse, addPaid, consumePaid,
} from "./usage.js";
import { STATIC_FILES } from "./static.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json;charset=utf-8" },
  });
}

function error(msg, status = 400, type = "invalid_request_error") {
  return json({
    error: { message: msg, type, param: null, code: null },
  }, status);
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function cors(resp) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    resp.headers.set(k, v);
  }
  return resp;
}

function clientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

/* ------------------------------------------------------------------ */
/*  Authentication middleware                                          */
/* ------------------------------------------------------------------ */

/**
 * Authenticate via API Key (used for /v1/* routes).
 * Extracts key from Authorization: Bearer sk-xxx header.
 */
async function authenticateApiKey(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return null;
  }

  const key = auth.slice(7).trim();
  const hash = await hashApiKey(key);

  const kv = env.USAGE;
  if (!kv) return null;

  const record = await kv.get(`apikey:${hash}`);
  if (!record) return null;

  const data = JSON.parse(record);
  if (data.expiresAt && Date.now() > data.expiresAt) return null;

  const userRaw = await kv.get(`user:${data.userId}`);
  if (!userRaw) return null;

  return { ...JSON.parse(userRaw), userId: data.userId };
}

/**
 * Authenticate via JWT (used for /api/* routes).
 * Extracts token from Authorization: Bearer xxx header.
 */
async function authenticateJWT(request, env) {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice(7).trim();
  const payload = await verifyJWT(token, config.JWT_SECRET);
  if (!payload) return null;

  const kv = env.USAGE;
  if (!kv) return null;

  const raw = await kv.get(`user:${payload.sub}`);
  if (!raw) return null;

  return { ...JSON.parse(raw), userId: payload.sub };
}

/* ------------------------------------------------------------------ */
/*  Route handlers — Chat Completions                                   */
/* ------------------------------------------------------------------ */

async function handleChatCompletions(request, env) {
  /* Authenticate */
  const user = await authenticateApiKey(request, env);
  if (!user) {
    return error("无效或缺失 API Key", 401, "authentication_error");
  }

  /* Rate limit */
  const allowed = await checkRateLimit(`apikey:${user.userId}`, env);
  if (!allowed) {
    return error("请求过于频繁，请稍后再试", 429, "rate_limit_error");
  }

  /* Parse body */
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON", 400);
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return error("messages 字段是必填的", 400);
  }

  const model = body.model || "deepseek-chat";
  const route = MODEL_ROUTES[model];
  if (!route) {
    return error(`不支持的模型: ${model}`, 400);
  }

  const modelInfo = getModel(model);
  if (!modelInfo || modelInfo.status === "coming") {
    return error(`模型 ${model} 尚未开放`, 400);
  }

  const isStream = body.stream === true;

  /* Check balance for paid models */
  const prices = config.PRICES[model];
  const isFree = prices && prices.input === 0 && prices.output === 0;
  if (!isFree) {
    const balance = await getUserBalance(user.userId, env);
    if (balance.balance <= 0) {
      return error("余额不足，请充值后继续使用", 402, "insufficient_quota");
    }
  }

  /* ---- Prepare upstream request ---- */
  const apiKey = env[route.envKey];
  if (!apiKey) {
    return error(`提供商 ${route.provider} 未配置`, 502, "api_error");
  }

  const upstreamBody = {
    model,
    messages: body.messages,
    temperature: body.temperature ?? 0.7,
    max_tokens: body.max_tokens ?? 4096,
    top_p: body.top_p ?? 1,
    stream: isStream,
  };

  if (body.frequency_penalty) upstreamBody.frequency_penalty = body.frequency_penalty;
  if (body.presence_penalty) upstreamBody.presence_penalty = body.presence_penalty;
  if (body.stop) upstreamBody.stop = body.stop;

  const upstreamResp = await fetch(route.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(upstreamBody),
  });

  if (!upstreamResp.ok) {
    const detail = await upstreamResp.text().catch(() => "");
    return error(`上游 API 错误 ${upstreamResp.status}: ${detail}`, 502, "api_error");
  }

  if (isStream) {
    return handleStreamingResponse(upstreamResp, user, model, env);
  }

  return handleNonStreamingResponse(upstreamResp, user, model, env);
}

async function handleNonStreamingResponse(upstreamResp, user, model, env) {
  const data = await upstreamResp.json();

  /* Extract usage from upstream if available */
  let inputTokens = data.usage?.prompt_tokens || 0;
  let outputTokens = data.usage?.completion_tokens || 0;

  /* Fallback: estimate from text */
  if (!inputTokens && data.choices?.[0]?.message?.content) {
    inputTokens = estimateTokens(
      data.choices.map((c) => c.message?.content || "").join(""),
    );
  }
  if (!outputTokens && data.choices?.[0]?.message?.content) {
    outputTokens = estimateTokens(
      data.choices.map((c) => c.message?.content || "").join(""),
    );
  }
  if (!inputTokens) inputTokens = 50;
  if (!outputTokens) outputTokens = 50;

  /* Deduct balance & record usage */
  const newBalance = await deductBalance(user.userId, inputTokens, outputTokens, model, env);
  await recordDailyUsage(user.userId, model, inputTokens, outputTokens, env);

  if (newBalance < 0) {
    return json({
      ...data,
      usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
    });
  }

  return json({
    ...data,
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  });
}

async function handleStreamingResponse(upstreamResp, user, model, env) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let accumulatedContent = "";
  let inputTokens = 0;
  let outputTokens = 0;

  const reader = upstreamResp.body.getReader();

  /* Pipe through: collect content, forward SSE to client */
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        /* Accumulate content for token estimation */
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                accumulatedContent += delta.content;
              }
              if (parsed.usage) {
                inputTokens = parsed.usage.prompt_tokens || inputTokens;
                outputTokens = parsed.usage.completion_tokens || outputTokens;
              }
            } catch {
              /* non-JSON data lines — skip */
            }
          }
        }

        await writer.write(value);
      }

      /* Calculate final token counts */
      if (!inputTokens) inputTokens = 50;
      if (!outputTokens) outputTokens = estimateTokens(accumulatedContent) || 50;

      await deductBalance(user.userId, inputTokens, outputTokens, model, env);
      await recordDailyUsage(user.userId, model, inputTokens, outputTokens, env);
    } catch (e) {
      console.error("Streaming error:", e);
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream;charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/* ------------------------------------------------------------------ */
/*  Route handlers — Models                                            */
/* ------------------------------------------------------------------ */

async function handleListModels() {
  return json({
    object: "list",
    data: MODELS.map((m) => ({
      id: m.id,
      object: "model",
      created: Math.floor(Date.now() / 1000),
      owned_by: m.provider,
      permission: [],
      root: m.id,
      parent: null,
    })),
  });
}

/* ------------------------------------------------------------------ */
/*  Route handlers — Auth                                              */
/* ------------------------------------------------------------------ */

async function handleRegister(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON");
  }

  const { email, password, name } = body;
  if (!email || !password) {
    return error("邮箱和密码是必填的");
  }
  if (password.length < 6) {
    return error("密码长度至少 6 位");
  }

  const kv = env.USAGE;
  if (!kv) return error("服务暂不可用", 503);

  const existing = await kv.get(`user:${email}`);
  if (existing) {
    return error("该邮箱已注册", 409);
  }

  const passwordHash = await hashPassword(password);
  const user = {
    email,
    name: name || email.split("@")[0],
    passwordHash,
    createdAt: new Date().toISOString(),
    role: "user",
  };

  await kv.put(`user:${email}`, JSON.stringify(user));

  const token = await signJWT({ sub: email, email, name: user.name }, config.JWT_SECRET);

  return json({
    token,
    user: { email: user.email, name: user.name, createdAt: user.createdAt },
  }, 201);
}

async function handleLogin(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON");
  }

  const { email, password } = body;
  if (!email || !password) {
    return error("邮箱和密码是必填的");
  }

  const kv = env.USAGE;
  if (!kv) return error("服务暂不可用", 503);

  const raw = await kv.get(`user:${email}`);
  if (!raw) {
    return error("邮箱或密码错误", 401, "authentication_error");
  }

  const user = JSON.parse(raw);
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return error("邮箱或密码错误", 401, "authentication_error");
  }

  const token = await signJWT({ sub: email, email, name: user.name }, config.JWT_SECRET);

  return json({
    token,
    user: { email: user.email, name: user.name, createdAt: user.createdAt },
  });
}

/* ------------------------------------------------------------------ */
/*  Route handlers — User Profile                                      */
/* ------------------------------------------------------------------ */

async function handleProfile(user) {
  return json({
    email: user.email,
    name: user.name,
    role: user.role || "user",
    createdAt: user.createdAt,
  });
}

/* ------------------------------------------------------------------ */
/*  Route handlers — API Key Management                                */
/* ------------------------------------------------------------------ */

async function handleListKeys(user, env) {
  const kv = env.USAGE;
  if (!kv) return json([]);

  const prefix = `apikey:`;
  const list = await kv.list({ prefix });

  const keys = [];
  for (const item of list.keys) {
    const raw = await kv.get(item.name);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.userId === user.userId) {
        keys.push({
          id: item.name.replace("apikey:", ""),
          prefix: data.keyPrefix,
          createdAt: data.createdAt,
          expiresAt: data.expiresAt,
        });
      }
    }
  }

  return json(keys);
}

async function handleCreateKey(user, env) {
  const kv = env.USAGE;
  if (!kv) return error("服务暂不可用", 503);

  const key = generateApiKey();
  const hash = await hashApiKey(key);
  const keyPrefix = key.slice(0, 8) + "****";

  const record = {
    userId: user.userId,
    keyPrefix,
    createdAt: new Date().toISOString(),
    expiresAt: null,
  };

  await kv.put(`apikey:${hash}`, JSON.stringify(record));

  return json({
    key,
    id: hash,
    createdAt: record.createdAt,
  }, 201);
}

async function handleDeleteKey(user, env, keyHash) {
  const kv = env.USAGE;
  if (!kv) return error("服务暂不可用", 503);

  const raw = await kv.get(`apikey:${keyHash}`);
  if (!raw) return error("API Key 不存在", 404);

  const data = JSON.parse(raw);
  if (data.userId !== user.userId) return error("无权删除此 API Key", 403);

  await kv.delete(`apikey:${keyHash}`);
  return json({ success: true });
}

/* ------------------------------------------------------------------ */
/*  Route handlers — Usage & Billing                                   */
/* ------------------------------------------------------------------ */

async function handleUsage(user, env) {
  const stats = await getUserUsage(user.userId, env);
  const freeRemaining = await getRemaining(user.email, env);
  const kv = env.USAGE;
  const record = kv ? await kv.get(`usage:${user.email}`) : null;
  const paid = record ? JSON.parse(record).paid || 0 : 0;

  return json({
    ...stats,
    free_remaining: freeRemaining,
    paid_remaining: paid,
    free_trial_total: config.FREE_TRIALS,
  });
}

async function handleDailyUsage(user, env, request) {
  const url = new URL(request.url);
  const startDate = url.searchParams.get("start") || new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10);
  const endDate = url.searchParams.get("end") || new Date().toISOString().slice(0, 10);

  const data = await getDailyUsage(user.userId, startDate, endDate, env);
  return json(data);
}

async function handleTopup(user, env, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON");
  }

  const { amount } = body;
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return error("amount 必须是正数");
  }

  const tokens = Math.floor(amount * 1000000);
  const newBalance = await addBalance(user.userId, tokens, env);
  await addTransaction(user.userId, "topup", amount, `充值 ${amount} 元 (${tokens.toLocaleString()} tokens)`, env);

  return json({
    success: true,
    amount,
    tokens,
    new_balance: newBalance,
  });
}

async function handleTransactions(user, env) {
  const txns = await getTransactions(user.userId, env);
  return json(txns);
}

/* ------------------------------------------------------------------ */
/*  Legacy routes (preserved for backward compat)                       */
/* ------------------------------------------------------------------ */

async function handleLegacyGenerate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON", 400);
  }

  const { type, params } = body;
  if (!type || !params) {
    return error("缺少必填字段 type 或 params", 400);
  }

  const ip = clientIP(request);
  if (!(await canUse(ip, env))) {
    return error("免费次数已用完，请购买后继续使用", 402);
  }

  const { buildPrompt } = await import("./prompts.js");
  const messages = buildPrompt(type, params);
  if (!messages) {
    return error("提示词构建失败", 500);
  }

  try {
    const apiKey = env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");

    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "deepseek-chat", messages, temperature: 0.7, max_tokens: 2048 }),
    });

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      throw new Error(`DeepSeek API 错误 ${resp.status}: ${detail}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("DeepSeek 返回了空结果");

    const remaining = await getRemaining(ip, env);
    let usageRemaining;
    if (remaining > 0) {
      usageRemaining = await consume(ip, env);
      const record = await (env?.USAGE?.get(`usage:${ip}`)).catch(() => null);
      const paid = record ? JSON.parse(record).paid || 0 : 0;
      usageRemaining += paid;
    } else {
      usageRemaining = await consumePaid(ip, env);
    }

    return json({ content, usage_remaining: usageRemaining });
  } catch (e) {
    return error(e.message, 502);
  }
}

async function handleLegacyUsage(request, env) {
  const url = new URL(request.url);
  const ip = url.searchParams.get("ip") || clientIP(request);
  const freeRemaining = await getRemaining(ip, env);
  const record = await (env?.USAGE?.get(`usage:${ip}`)).catch(() => null);
  const paid = record ? JSON.parse(record).paid || 0 : 0;

  return json({
    remaining: freeRemaining + paid,
    free_remaining: freeRemaining,
    paid_remaining: paid,
    total: config.FREE_TRIALS,
  });
}

async function handleLegacyVerifyPayment(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return error("请求体必须是有效的 JSON", 400);
  }

  const { ip, amount } = body;
  if (!ip || typeof amount !== "number" || amount <= 0) {
    return error("缺少必填字段 ip 或无效的 amount", 400);
  }

  const newBalance = await addPaid(ip, amount, env);
  return json({ success: true, new_balance: newBalance });
}

/* ------------------------------------------------------------------ */
/*  Static file serving (from static.js)                                */
/* ------------------------------------------------------------------ */

const CONTENT_TYPES = {
  ".html": "text/html;charset=utf-8",
  ".css": "text/css;charset=utf-8",
  ".js": "application/javascript;charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function serveStatic(path) {
  const key = path === "/" ? "/" : path.replace(/\/$/, "");
  const content = STATIC_FILES[key];
  if (!content) return null;

  const ext = key.match(/\.\w+$/) ? key.match(/\.\w+$/)[0] : ".html";
  const contentType = CONTENT_TYPES[ext] || "text/html;charset=utf-8";

  return new Response(content, {
    status: 200,
    headers: { "content-type": contentType },
  });
}

/* ------------------------------------------------------------------ */
/*  Worker entry                                                        */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    /* CORS preflight */
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    let response;

    try {
      /* ================================================================ */
      /*  OpenAI-compatible API routes                                     */
      /* ================================================================ */

      if (method === "POST" && path === "/v1/chat/completions") {
        response = await handleChatCompletions(request, env);
      }

      else if (method === "GET" && path === "/v1/models") {
        response = await handleListModels();
      }

      /* ================================================================ */
      /*  Auth routes                                                      */
      /* ================================================================ */

      else if (method === "POST" && path === "/api/auth/register") {
        response = await handleRegister(request, env);
      }

      else if (method === "POST" && path === "/api/auth/login") {
        response = await handleLogin(request, env);
      }

      /* ================================================================ */
      /*  Protected /api/* routes (JWT required)                           */
      /* ================================================================ */

      else if (method === "GET" && path === "/api/user/profile") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleProfile(user); }
      }

      else if (method === "GET" && path === "/api/keys") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleListKeys(user, env); }
      }

      else if (method === "POST" && path === "/api/keys/create") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleCreateKey(user, env); }
      }

      else if (method === "DELETE" && path.startsWith("/api/keys/")) {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else {
          const keyId = path.replace("/api/keys/", "");
          response = await handleDeleteKey(user, env, keyId);
        }
      }

      else if (method === "GET" && path === "/api/usage") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleUsage(user, env); }
      }

      else if (method === "GET" && path === "/api/usage/daily") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleDailyUsage(user, env, request); }
      }

      else if (method === "POST" && path === "/api/topup") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleTopup(user, env, request); }
      }

      else if (method === "GET" && path === "/api/transactions") {
        const user = await authenticateJWT(request, env);
        if (!user) { response = error("未登录或令牌已过期", 401, "authentication_error"); }
        else { response = await handleTransactions(user, env); }
      }

      /* ================================================================ */
      /*  Legacy routes (backward compat)                                  */
      /* ================================================================ */

      else if (method === "POST" && path === "/api/generate") {
        response = await handleLegacyGenerate(request, env);
      }

      else if (method === "GET" && path === "/api/legacy-usage") {
        response = await handleLegacyUsage(request, env);
      }

      else if (method === "POST" && path === "/api/verify-payment") {
        response = await handleLegacyVerifyPayment(request, env);
      }

      /* ================================================================ */
      /*  Fallback: static files or 404                                    */
      /* ================================================================ */

      else {
        response = serveStatic(path);
        if (!response) {
          response = serveStatic("/tools" + path) || serveStatic("/") || error("Not Found", 404);
        }
      }
    } catch (e) {
      console.error("Unhandled error:", e);
      response = error(`服务器内部错误: ${e.message}`, 500, "server_error");
    }

    return cors(response);
  },
};
