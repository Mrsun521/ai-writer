/* ------------------------------------------------------------------ */
/*  XorPay 支付集成模块                                                  */
/*  文档: https://xorpay.com/doc/                                      */
/* ------------------------------------------------------------------ */

const XORPAY_API = "https://xorpay.com/api";

/**
 * XorPay 签名: value 顺序拼接后 MD5
 * 下单: name + pay_type + price + order_id + notify_url + app_secret
 * 回调: aoid + order_id + pay_price + pay_time + app_secret
 */
async function md5(str) {
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("MD5", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
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
 * 创建支付订单
 * @param {string} name - 商品名称
 * @param {number} price - 金额（元）
 * @param {string} orderId - 订单号
 * @param {string} notifyUrl - 回调地址
 * @param {object} env - Worker 环境变量
 * @returns {Promise<{qr: string, aoid: string}|Error>}
 */
export async function createOrder(name, price, orderId, notifyUrl, env) {
  const aid = env.XORPAY_AID;
  const appSecret = env.XORPAY_APP_SECRET;

  if (!aid || !appSecret) {
    throw new Error("XorPay 未配置 (XORPAY_AID / XORPAY_APP_SECRET)");
  }

  const payType = "native";
  const priceStr = price.toFixed(2);
  const signStr = name + payType + priceStr + orderId + notifyUrl + appSecret;
  const sign = await md5(signStr);

  const params = new URLSearchParams({
    name, pay_type: payType, price: priceStr,
    order_id: orderId, notify_url: notifyUrl, sign,
    expire: "7200",
  });

  const resp = await fetch(`${XORPAY_API}/pay/${aid}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await resp.json();
  if (data.status !== "ok") {
    throw new Error(`XorPay 下单失败: ${data.status} ${data.info || ""}`);
  }

  return {
    qr: data.info.qr,
    aoid: data.aoid,
    expires_in: data.expires_in || 7200,
  };
}

/**
 * 验证支付回调签名
 * @param {object} body - 回调 POST body
 * @param {string} appSecret - XorPay APP_SECRET
 * @returns {boolean}
 */
export async function verifyCallback(body, appSecret) {
  const { aoid, order_id, pay_price, pay_time, sign } = body;
  if (!aoid || !order_id || !pay_price || !pay_time || !sign) return false;

  const signStr = aoid + order_id + pay_price + pay_time + appSecret;
  const expectedSign = await md5(signStr);
  return sign === expectedSign;
}
