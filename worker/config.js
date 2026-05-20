export default {
  FREE_TRIAL_TOKENS: 1_000_000,

  PRICES: {
    "deepseek-chat":    { input: 1,   output: 2   },
    "glm-4-flash":      { input: 0,   output: 0   },
    "qwen3-27b":        { input: 0.5, output: 1   },
    "gpt-4o-mini":      { input: 0.5, output: 1   },
    "qwen2.5-7b":       { input: 0,   output: 0   },
    "claude-sonnet-4":  { input: 8,   output: 24  },
    "gemini-2.5-pro":   { input: 5,   output: 15  },
  },

  JWT_SECRET: "ai-api-gateway-secret",
  JWT_EXPIRES_IN: 86400 * 7,

  API_KEY_PREFIX: "sk-",
  API_KEY_LENGTH: 48,

  RATE_LIMIT_WINDOW: 60,
  RATE_LIMIT_MAX: 30,
};
