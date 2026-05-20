/* ------------------------------------------------------------------ */
/*  爱发电 (afdian.net) 支付集成模块                                    */
/*  文档: https://afdian.net/dashboard/dev                            */
/* ------------------------------------------------------------------ */

const AFDIAN_API = "https://afdian.net/api/open";

/**
 * MD5 hash
 */
async function md5(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("MD5", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * 生成爱发电 API 签名
 * sign = md5(token + key1 + val1 + key2 + val2 + ...)（按 key 字母序）
 * token 直接拼接（无等号/无前缀），其余 key + value 逐对拼接
 */
async function afdianSign(token, paramsObj) {
  const keys = Object.keys(paramsObj).sort();
  let str = token;
  for (const k of keys) {
    str += k + String(paramsObj[k]);
  }
  return md5(str);
}

/**
 * 生成唯一订单号
 */
export function generateOrderId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `AI${ts}${rand}`;
}

/**
 * 创建支付订单 — 生成订单记录并返回爱发电支付链接
 * @param {string} userId - 用户标识
 * @param {number} amount - 金额（元）
 * @param {string} orderId - 内部订单号
 * @param {object} env - Worker 环境变量
 * @returns {{ payUrl: string, orderId: string }}
 */
export async function createOrder(userId, amount, orderId, env) {
  const planConfig = env.AFDIAN_PLANS ? JSON.parse(env.AFDIAN_PLANS) : {};
  let planId = null;
  for (const [pid, cfg] of Object.entries(planConfig)) {
    if (cfg.amount === amount) { planId = pid; break; }
  }
  if (!planId) throw new Error(`未找到金额 ${amount} 对应的爱发电方案`);

  const userIdShort = env.AFDIAN_USER_ID || "";
  const payUrl = `https://afdian.net/item/${planId}?custom_order_id=${orderId}`;

  return { payUrl, orderId, planId };
}

/**
 * 验证爱发电回调 — 调用 query_order API 二次验证
 * @param {object} body - 回调 POST body
 * @param {object} env - Worker 环境变量
 * @returns {Promise<{valid: boolean, order: object}|null>}
 */
export async function verifyCallback(body, env) {
  const token = env.AFDIAN_TOKEN;
  const userId = env.AFDIAN_USER_ID;
  if (!token || !userId) return null;

  const ec = body?.ec;
  const orderData = body?.data?.order;
  if (ec !== 200 || !orderData) return null;

  const orderId = orderData.out_trade_no || "";
  if (!orderId) return null;

  /* 调用 query_order API 二次验证订单真实性 */
  const ts = Math.floor(Date.now() / 1000);
  const params = JSON.stringify({ page: 1 });
  const sign = await afdianSign(token, { params, ts, user_id: userId });

  const resp = await fetch(`${AFDIAN_API}/query-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, params, ts, sign }),
  });

  if (!resp.ok) return null;

  const result = await resp.json();
  if (result.ec !== 200) return null;

  /* 在订单列表中查找匹配的订单 */
  const orderList = result.data?.list || result.data?.order || [];
  const orders = Array.isArray(orderList) ? orderList : [orderList];
  const found = orders.find(o => o.out_trade_no === orderId || o.custom_order_id === orderId);
  if (!found) return null;

  /* 确认已支付( status === 2 ) */
  if (found.status !== 2) return null;

  const customOrderId = found.custom_order_id || "";
  const totalAmount = parseFloat(found.total_amount || "0");

  return {
    valid: true,
    order: {
      outTradeNo: found.out_trade_no,
      customOrderId,
      planId: found.plan_id || "",
      totalAmount,
      payTime: found.pay_time || "",
    },
  };
}
