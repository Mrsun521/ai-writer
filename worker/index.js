import config from "./config.js";
import { buildPrompt } from "./prompts.js";
import {
  getRemaining,
  consume,
  consumePaid,
  canUse,
  addPaid,
} from "./usage.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function clientIP(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json;charset=utf-8" },
  });
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

/* ------------------------------------------------------------------ */
/*  CORS preflight                                                     */
/* ------------------------------------------------------------------ */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function cors(resp) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    resp.headers.set(k, v);
  }
  return resp;
}

/* ------------------------------------------------------------------ */
/*  DeepSeek call                                                      */
/* ------------------------------------------------------------------ */

async function callDeepSeek(messages, env) {
  const apiKey = env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const resp = await fetch(config.DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: env.MODEL || config.MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    throw new Error(`DeepSeek API 错误 ${resp.status}: ${detail}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 返回了空结果");
  }
  return content;
}

/* ------------------------------------------------------------------ */
/*  Route handlers                                                     */
/* ------------------------------------------------------------------ */

/**
 * POST /api/generate
 * Body: { type: "weekly"|"xiaohongshu"|"moments", params: {...} }
 */
async function handleGenerate(request, env) {
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
  if (!["weekly", "xiaohongshu", "moments"].includes(type)) {
    return error(`不支持的 type: ${type}，可选: weekly, xiaohongshu, moments`, 400);
  }

  const ip = clientIP(request);
  if (!(await canUse(ip, env))) {
    return error("免费次数已用完，请购买后继续使用", 402);
  }

  // 构建提示词
  const messages = buildPrompt(type, params);
  if (!messages) {
    return error("提示词构建失败", 500);
  }

  // 调用 DeepSeek
  let content;
  try {
    content = await callDeepSeek(messages, env);
  } catch (e) {
    return error(e.message, 502);
  }

  // 扣减次数（优先扣免费，免费没了扣付费）
  const remaining = await getRemaining(ip, env);
  let usageRemaining;
  if (remaining > 0) {
    usageRemaining = await consume(ip, env);
    // consume 返回的是免费剩余；加上付费部分
    const record = await ((env && env.USAGE)
      ? env.USAGE.get(`usage:${ip}`)
      : null);
    const paid = record ? JSON.parse(record).paid || 0 : 0;
    usageRemaining += paid;
  } else {
    const paidLeft = await consumePaid(ip, env);
    usageRemaining = paidLeft;
  }

  return json({ content, usage_remaining: usageRemaining });
}

/**
 * GET /api/usage
 * Query: ip (optional, falls back to request IP)
 */
async function handleUsage(request, env) {
  const url = new URL(request.url);
  const ip = url.searchParams.get("ip") || clientIP(request);
  const freeRemaining = await getRemaining(ip, env);

  const record = await ((env && env.USAGE)
    ? env.USAGE.get(`usage:${ip}`)
    : null);
  const paid = record ? JSON.parse(record).paid || 0 : 0;

  return json({
    remaining: freeRemaining + paid,
    free_remaining: freeRemaining,
    paid_remaining: paid,
    total: config.FREE_TRIALS,
  });
}

/**
 * POST /api/verify-payment
 * Body: { ip: "用户IP", amount: 1 }
 */
async function handleVerifyPayment(request, env) {
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
/*  Worker entry                                                       */
/* ------------------------------------------------------------------ */

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return cors(new Response(null, { status: 204 }));
    }

    const url = new URL(request.url);
    const path = url.pathname;

    let response;

    try {
      switch (true) {
        case request.method === "POST" && path === "/api/generate":
          response = await handleGenerate(request, env);
          break;

        case request.method === "GET" && path === "/api/usage":
          response = await handleUsage(request, env);
          break;

        case request.method === "POST" && path === "/api/verify-payment":
          response = await handleVerifyPayment(request, env);
          break;

        default:
          response = error("Not Found", 404);
      }
    } catch (e) {
      response = error(`服务器内部错误: ${e.message}`, 500);
    }

    return cors(response);
  },
};
