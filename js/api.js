/* ===================================================
   AI 聚合 API — API Client
   - OpenAI 兼容格式
   - SSE / 流式响应
   - Mock 模式（无需后端）
   - 统一错误处理 + 自动重试
   =================================================== */

const API_CLIENT = (() => {
  'use strict';

  // --------------- Config ---------------
  const CONFIG = {
    baseUrl: '/v1',
    apiKey: localStorage.getItem('ai_api_key') || '',
    timeout: 30000,
    maxRetries: 2,
    retryDelay: 1000,
    mockMode: true, // auto fallback to mock when API unavailable
    debug: false,
  };

  // --------------- Model List (source of truth) ---------------
  const MODELS = [
    {
      id: 'deepseek-v3',
      name: 'DeepSeek-V3',
      provider: 'DeepSeek',
      category: 'deepseek',
      context: '128K',
      inputPrice: '¥0.1',
      outputPrice: '¥0.3',
      status: 'active',
      speed: 'fast',
      color: '#4F46E5',
      icon: 'D',
      description: '高性能通用模型，推理与编码能力突出',
    },
    {
      id: 'glm-4-flash',
      name: 'GLM-4-Flash',
      provider: '智谱 AI',
      category: 'glm',
      context: '128K',
      inputPrice: '免费',
      outputPrice: '免费',
      status: 'active',
      speed: 'fast',
      color: '#1E90FF',
      icon: 'G',
      description: '免费开源的轻量模型，适合高频调用',
    },
    {
      id: 'qwen3-27b',
      name: 'Qwen3-27B',
      provider: '通义千问',
      category: 'qwen',
      context: '128K',
      inputPrice: '¥0.1',
      outputPrice: '¥0.3',
      status: 'active',
      speed: 'fast',
      color: '#7C3AED',
      icon: 'Q',
      description: '千问最新版本，推理与长文本能力全面升级',
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o-mini',
      provider: 'ChatAnywhere',
      category: 'gpt',
      context: '128K',
      inputPrice: '¥0.2',
      outputPrice: '¥0.5',
      status: 'active',
      speed: 'fast',
      color: '#10B981',
      icon: 'G',
      description: '轻量快速，200 次/天免费额度',
    },
    {
      id: 'qwen2.5-7b',
      name: 'Qwen2.5-7B',
      provider: '硅基流动',
      category: 'qwen',
      context: '32K',
      inputPrice: '免费',
      outputPrice: '免费',
      status: 'active',
      speed: 'fast',
      color: '#06B6D4',
      icon: 'Q',
      description: '轻量快速，永久免费，适合简单任务',
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: '七牛云',
      category: 'other',
      context: '200K',
      inputPrice: '¥3.0',
      outputPrice: '¥10.0',
      status: 'active',
      speed: 'medium',
      color: '#D97706',
      icon: 'C',
      description: '高质量长上下文模型，适合复杂推理任务',
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: '七牛云',
      category: 'other',
      context: '1M',
      inputPrice: '¥2.0',
      outputPrice: '¥6.0',
      status: 'active',
      speed: 'medium',
      color: '#2563EB',
      icon: 'G',
      description: '百万 Token 超长上下文，旗舰级表现',
    },
    {
      id: 'ollama-qwen2.5',
      name: 'Ollama Qwen2.5',
      provider: '本地',
      category: 'other',
      context: '32K',
      inputPrice: '免费',
      outputPrice: '免费',
      status: 'active',
      speed: 'medium',
      color: '#64748B',
      icon: 'O',
      description: '本地部署，离线可用，零成本',
    },
  ];

  // --------------- Mock Data ---------------
  const MOCK_CHAT_RESPONSES = [
    '你好！我是 AI 助手，很高兴为你服务。有什么我可以帮助你的吗？',
    '这是一个很好的问题！让我来为你详细解答...\n\n首先，我们需要理解这个问题的背景。然后从以下几个方面来分析：\n\n1. **核心技术原理**\n2. **实际应用场景**\n3. **最佳实践建议**\n\n希望这些信息对你有帮助！',
    '感谢你的提问。根据我的分析，这里有几点建议：\n\n- 方案 A：适合快速迭代的场景\n- 方案 B：更适合生产环境部署\n- 方案 C：作为备选方案\n\n请根据你的具体需求选择合适的方案。',
    '让我们一步步来分析这个问题：\n\n```python\ndef example():\n    print("Hello, World!")\n```\n\n以上就是实现该功能的核心代码。关键在于理解其背后的设计思想。',
  ];

  const MOCK_EMBEDDING_DIM = 1536;

  // --------------- Helpers ---------------
  function log(...args) {
    if (CONFIG.debug) console.log('[API Client]', ...args);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function buildHeaders(extra = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...extra,
    };
    if (CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${CONFIG.apiKey}`;
    }
    return headers;
  }

  function buildUrl(path) {
    const base = CONFIG.baseUrl.replace(/\/+$/, '');
    return `${base}${path}`;
  }

  // --------------- Error Classes ---------------
  class ApiError extends Error {
    constructor(message, status, data) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }

  class RateLimitError extends ApiError {
    constructor(retryAfter) {
      super('请求频率超限', 429, { retryAfter });
      this.name = 'RateLimitError';
      this.retryAfter = retryAfter;
    }
  }

  class AuthError extends ApiError {
    constructor() {
      super('API Key 无效或未设置', 401);
      this.name = 'AuthError';
    }
  }

  // --------------- Core HTTP Client ---------------
  async function request(method, path, body, opts = {}) {
    const url = buildUrl(path);
    const options = {
      method,
      headers: buildHeaders(opts.headers),
      signal: opts.signal || null,
    };
    if (body) options.body = JSON.stringify(body);

    let lastError;
    const maxRetries = opts.retries !== undefined ? opts.retries : CONFIG.maxRetries;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = CONFIG.retryDelay * Math.pow(2, attempt - 1);
          log(`Retry #${attempt} after ${delay}ms`);
          await sleep(delay);
        }

        const res = await fetch(url, options);

        if (res.status === 401) throw new AuthError();
        if (res.status === 429) {
          const retryAfter = parseInt(res.headers.get('Retry-After') || '5', 10);
          throw new RateLimitError(retryAfter);
        }
        if (res.status === 422) {
          const data = await res.json().catch(() => ({}));
          throw new ApiError(data.error?.message || '请求参数错误', 422, data);
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new ApiError(data.error?.message || `HTTP ${res.status}`, res.status, data);
        }

        // SSE stream
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('text/event-stream') || opts.stream) {
          return { stream: true, response: res };
        }

        const data = await res.json();
        return data;
      } catch (err) {
        lastError = err;
        if (err.name === 'AbortError') {
          throw new ApiError('请求超时', 0);
        }
        if (err instanceof AuthError) throw err;
        if (err instanceof ApiError && err.status !== 429) {
          if (err.status < 500) throw err; // 4xx not retryable (except 429)
        }
        log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}):`, err.message);
      }
    }

    throw lastError || new ApiError('请求失败', 0);
  }

  // --------------- SSE Parser ---------------
  async function* parseSSE(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // comment or empty

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            try {
              yield JSON.parse(data);
            } catch {
              // ignore parse errors for partial chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // --------------- Mock Generator ---------------
  async function* mockChatStream(messages) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    const baseResponse = MOCK_CHAT_RESPONSES[Math.floor(Math.random() * MOCK_CHAT_RESPONSES.length)];
    const words = baseResponse.split('');
    const chunkSize = 3;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join('');
      const delta = {
        id: `mock-${Date.now()}`,
        object: 'chat.completion.chunk',
        created: Math.floor(Date.now() / 1000),
        model: 'mock-model',
        choices: [
          {
            index: 0,
            delta: { content: chunk },
            finish_reason: null,
          },
        ],
      };
      yield delta;
      await sleep(30 + Math.random() * 40);
    }

    // Final chunk
    yield {
      id: `mock-${Date.now()}`,
      object: 'chat.completion.chunk',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-model',
      choices: [
        {
          index: 0,
          delta: {},
          finish_reason: 'stop',
        },
      ],
    };
  }

  function mockChatCompletion(messages) {
    const randomIdx = Math.floor(Math.random() * MOCK_CHAT_RESPONSES.length);
    const content = MOCK_CHAT_RESPONSES[randomIdx];
    return {
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'mock-model',
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: content.length,
        total_tokens: 10 + content.length,
      },
    };
  }

  function mockEmbedding(input) {
    const texts = Array.isArray(input) ? input : [input];
    return {
      object: 'list',
      data: texts.map((t, i) => ({
        object: 'embedding',
        index: i,
        embedding: Array.from({ length: MOCK_EMBEDDING_DIM }, () => Math.random() * 2 - 1),
      })),
      model: 'mock-embedding',
      usage: { prompt_tokens: texts.length * 5, total_tokens: texts.length * 5 },
    };
  }

  // --------------- Public API ---------------

  /** OpenAI-compatible chat completion (non-streaming) */
  async function chatCompletion(body) {
    if (CONFIG.mockMode) {
      await sleep(400 + Math.random() * 600);
      return mockChatCompletion(body.messages || []);
    }
    return request('POST', '/chat/completions', body);
  }

  /** OpenAI-compatible chat completion (streaming) */
  async function* chatCompletionStream(body) {
    const streamBody = { ...body, stream: true };

    if (CONFIG.mockMode) {
      yield* mockChatStream(body.messages || []);
      return;
    }

    const result = await request('POST', '/chat/completions', streamBody, { stream: true });
    if (result.stream && result.response) {
      yield* parseSSE(result.response);
    }
  }

  /** OpenAI-compatible embeddings */
  async function createEmbedding(body) {
    if (CONFIG.mockMode) {
      await sleep(200 + Math.random() * 300);
      return mockEmbedding(body.input);
    }
    return request('POST', '/embeddings', body);
  }

  /** List all available models */
  async function listModels() {
    if (CONFIG.mockMode) {
      await sleep(100);
      return MODELS.map((m) => ({
        id: m.id,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: m.provider,
      }));
    }
    return request('GET', '/models');
  }

  /** Get model detail */
  function getModel(id) {
    return MODELS.find((m) => m.id === id) || null;
  }

  /** Get all models with full metadata for UI */
  function getAllModels() {
    return [...MODELS];
  }

  /** Set API key */
  function setApiKey(key) {
    CONFIG.apiKey = key;
    CONFIG.mockMode = !key;
    localStorage.setItem('ai_api_key', key);
  }

  /** Toggle mock mode */
  function setMockMode(enabled) {
    CONFIG.mockMode = enabled;
  }

  /** Update config */
  function setConfig(updates) {
    Object.assign(CONFIG, updates);
    if (updates.apiKey !== undefined) {
      localStorage.setItem('ai_api_key', updates.apiKey);
    }
  }

  // --------------- Exports ---------------
  return {
    chatCompletion,
    chatCompletionStream,
    createEmbedding,
    listModels,
    getModel,
    getAllModels,
    setApiKey,
    setMockMode,
    setConfig,
    ApiError,
    RateLimitError,
    AuthError,
    MODELS,
  };
})();

/* ===================================================
   Backward Compatibility (for old tool pages)
   =================================================== */
(function () {
  const API_BASE = '/api/generate';
  const TIMEOUT = 30000;

  const MOCK_RESPONSES = {
    weekly: (params) => {
      const content = params.content || '本周完成的工作内容未提供';
      const highlights = params.highlights || '暂无特别亮点';
      const nextPlan = params.nextPlan || '暂无下周计划';
      return `【本周工作汇报】

一、本周完成工作
${content}

二、本周工作亮点
${highlights}

三、下周工作计划
${nextPlan}

四、总结与反思
本周各项工作按计划推进，重点任务已按时完成。下周将继续保持高效节奏，确保项目稳步推进。`;
    },

    xiaohongshu: (params) => {
      const topic = params.topic || '默认主题';
      const audience = params.audience || '通用';
      const titles = [
        `家人们谁懂啊！${topic}真的绝了🔥`,
        `${topic}｜我不允许还有人不知道这个✨`,
        `救命！${topic}也太好用了吧😭`,
        `抄作业！${topic}保姆级攻略来了📖`,
        `后悔没早知道的${topic}，建议收藏⭐`,
      ];
      const title = titles[Math.floor(Math.random() * titles.length)];
      return `📌 标题：${title}

📝 正文：
姐妹们！今天一定要跟大家分享一下${topic}的宝藏用法✨

说实话一开始我也是抱着试试看的心态，结果真的被惊艳到了！💥

👇 几个要点分享给大家：
1️⃣ 首先要选对适合自己的，不要盲目跟风
2️⃣ 使用前做好功课，了解清楚再下手
3️⃣ 坚持使用才是王道，三天打鱼可不行

真的真的强烈推荐给每一个${audience}的朋友们！谁用谁知道！😎

#${topic.replace(/\s+/g, '')} #好物分享 #宝藏推荐 #生活必备 #干货分享 #涨知识 #必看`;
    },

    moments: (params) => {
      const content = params.content || '今天的心情';
      const scene = params.scene || '生活';
      const scenes = {
        work: `【工作日常】
${content}

新的一天，继续努力💪
#工作日常 #加油打工人`,
        life: `${content}

生活明朗，万物可爱 ✨
#日常生活 #小确幸`,
        holiday: `${content}

节日快乐！🎉 愿每一天都值得被记录。
#节日快乐 #美好时光`,
        other: `${content}

记录此刻的想法 📝
#日常分享 #随记`,
      };
      const text = scenes[scene] || scenes.life;

      const imageTips = {
        work: '📷 配图建议：工作场景照片 / 电脑桌面 / 咖啡杯',
        life: '📷 配图建议：生活照片 / 风景照 / 美食图',
        holiday: '📷 配图建议：节日装饰 / 聚会照片 / 礼物',
        other: '📷 配图建议：相关配图或纯色背景图',
      };

      return `${text}\n\n${imageTips[scene] || imageTips.life}`;
    },
  };

  window.API_CLIENT = API_CLIENT;
  window.MOCK_RESPONSES = MOCK_RESPONSES;

  window.generateContent = async function (type, params) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.content || data;
    } catch (err) {
      console.warn(`API call failed, using mock: ${err.message}`);
      const mockFn = MOCK_RESPONSES[type];
      if (!mockFn) throw new Error(`Unknown content type: ${type}`);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
      return mockFn(params);
    }
  };
})();
