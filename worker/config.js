export default {
  FREE_TRIAL_TOKENS: 1_000_000,

  /* 骨折价：零成本模型，比官方便宜 3-10 倍 */
  PRICES: {
    "deepseek-chat":    { input: 0.1, output: 0.3 },
    "glm-4-flash":      { input: 0,   output: 0   },
    "qwen3-27b":        { input: 0.1, output: 0.3 },
    "gpt-4o-mini":      { input: 0.2, output: 0.5 },
    "qwen2.5-7b":       { input: 0,   output: 0   },
    "claude-sonnet-4":  { input: 3,   output: 10  },
    "gemini-2.5-pro":   { input: 2,   output: 6   },
  },

  JWT_SECRET: "ai-api-gateway-secret",
  JWT_EXPIRES_IN: 86400 * 7,

  API_KEY_PREFIX: "sk-",
  API_KEY_LENGTH: 48,

  RATE_LIMIT_WINDOW: 60,
  RATE_LIMIT_MAX: 30,

  /* Payment — 爱发电 (afdian.net) */
  TOPUP_PRESETS: [5, 10, 20, 50, 100],
  TOKENS_PER_YUAN: 5_000_000,  // 1 元 = 500 万 tokens
  PAY_NOTIFY_PATH: "/api/pay/callback",

  /* 爱发电方案 → 金额映射（需在 afdian.net 后台创建方案后填入 plan_id） */
  /* AFDIAN_PLANS: { "plan_xxxxx": { amount: 10 }, "plan_yyyyy": { amount: 50 } }, */
};
