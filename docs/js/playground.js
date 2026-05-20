/* AI Playground - Chat Business Logic */

const MODELS = [
  { id: 'deepseek-v3', name: 'DeepSeek-V3', provider: 'DeepSeek', icon: 'DS', color: '#6366F1', desc: '编码与推理' },
  { id: 'glm-4-flash', name: 'GLM-4-Flash', provider: '智谱AI', icon: 'GLM', color: '#10B981', desc: '快速免费' },
  { id: 'qwen3-27b', name: 'Qwen3-27B', provider: '通义千问', icon: 'QW', color: '#F59E0B', desc: '轻量高效' },
  { id: 'gpt-4o-mini', name: 'GPT-4o-mini', provider: 'ChatAnywhere', icon: 'GPT', color: '#3B82F6', desc: '通用对话' },
  { id: 'silicon-flow', name: 'Qwen2.5-7B', provider: '硅基流动', icon: 'SF', color: '#8B5CF6', desc: '永久免费' },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4', provider: '七牛云', icon: 'CL', color: '#EC4899', desc: '高质量长上下文' },
  { id: 'gemini-pro', name: 'Gemini 2.5 Pro', provider: '七牛云', icon: 'GM', color: '#EF4444', desc: '综合能力强' },
  { id: 'ollama-qwen', name: 'Ollama qwen2.5:7b', provider: '本地', icon: 'OL', color: '#6B7280', desc: '本地离线' },
];

/* ---------- Model ID Mapping (playground -> API) ---------- */

const MODEL_ID_MAP = {
  'deepseek-v3': 'deepseek-v3',
  'glm-4-flash': 'glm-4-flash',
  'qwen3-27b': 'qwen3-27b',
  'gpt-4o-mini': 'gpt-4o-mini',
  'silicon-flow': 'qwen2.5-7b',
  'claude-sonnet': 'claude-sonnet-4',
  'gemini-pro': 'gemini-2.5-pro',
  'ollama-qwen': 'ollama-qwen2.5',
};

function getApiModelId(playgroundId) {
  return MODEL_ID_MAP[playgroundId] || playgroundId;
}

/* ---------- API Key Management ---------- */

const APIKEY_STORAGE_KEY = 'playground_api_key';

function hasApiKey() {
  return !!localStorage.getItem(APIKEY_STORAGE_KEY);
}

function getApiKey() {
  return localStorage.getItem(APIKEY_STORAGE_KEY) || '';
}

function saveApiKey(key) {
  localStorage.setItem(APIKEY_STORAGE_KEY, key);
  API_CLIENT.setApiKey(key);
}

function clearApiKey() {
  localStorage.removeItem(APIKEY_STORAGE_KEY);
  API_CLIENT.setApiKey('');
}

function renderApiKeyBar() {
  // Remove existing bar if any
  const existing = document.getElementById('apikeyBar');
  if (existing) existing.remove();

  const bar = document.createElement('div');
  bar.id = 'apikeyBar';
  bar.className = 'apikey-bar';
  bar.innerHTML =
    '<label>API Key</label>' +
    '<input type="password" id="apikeyInput" placeholder="sk-..." value="' + escapeHtml(getApiKey()) + '">' +
    '<button class="apikey-save-btn" id="apikeySaveBtn">保存</button>' +
    '<button class="apikey-clear-btn" id="apikeyClearBtn">清除</button>' +
    '<span class="apikey-status" id="apikeyStatus"></span>';

  // Insert after toolbar
  const toolbar = document.querySelector('.pg-toolbar');
  if (toolbar && toolbar.parentNode) {
    toolbar.parentNode.insertBefore(bar, toolbar.nextSibling);
  } else {
    // Fallback: insert at top of messages container
    const container = els.messagesContainer;
    if (container && container.parentNode) {
      container.parentNode.insertBefore(bar, container);
    }
  }

  // Bind events
  document.getElementById('apikeySaveBtn').addEventListener('click', () => {
    const input = document.getElementById('apikeyInput');
    const key = input.value.trim();
    if (!key) {
      setApiKeyStatus('请输入 API Key', true);
      return;
    }
    saveApiKey(key);
    setApiKeyStatus('已保存');
    setTimeout(() => {
      const barEl = document.getElementById('apikeyBar');
      if (barEl) barEl.remove();
    }, 1000);
  });

  document.getElementById('apikeyClearBtn').addEventListener('click', () => {
    clearApiKey();
    document.getElementById('apikeyInput').value = '';
    setApiKeyStatus('已清除');
  });

  document.getElementById('apikeyInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('apikeySaveBtn').click();
    }
  });
}

function setApiKeyStatus(msg, isError) {
  const el = document.getElementById('apikeyStatus');
  if (el) {
    el.textContent = msg;
    el.className = 'apikey-status' + (isError ? ' error' : '');
  }
}

/* ---------- Mock Responses ---------- */

function getMockResponse(modelId, userMessage) {
  const topic = userMessage.length > 40 ? userMessage.slice(0, 40) + '...' : userMessage;

  const responses = {
    'deepseek-v3': () =>
`根据您的问题「${topic}」，我从以下几个方面进行分析：

**1. 核心原理**

首先需要理解问题的本质。在计算机科学中，这涉及到数据结构与算法的综合运用。

**2. 实现方案**

以下是标准的实现方式：

\`\`\`python
def solve(input_data):
    # 初始化结果
    result = []
    # 遍历处理
    for item in input_data:
        processed = transform(item)
        result.append(processed)
    return result
\`\`\`

**3. 关键要点**

- 时间复杂度：O(n)，空间复杂度：O(1)
- 注意边界条件的处理
- 建议做充分的单元测试

**总结**

以上是对您问题的完整分析。如有具体实现细节需要探讨，欢迎继续交流。`,

    'glm-4-flash': () =>
`你好！很高兴为你解答 😊

关于「${topic}」，我来分享一些想法：

这个问题很有意思，我们可以从几个角度来看：

- **首先**，理解基本概念很重要，这是后续讨论的基础
- **其次**，实践是最好的学习方式，建议动手试一试
- **最后**，遇到具体问题随时可以深入讨论

**小建议**：如果你想要更具体的帮助，可以把需求说得更详细一些，我会给你更精准的建议！

有什么其他问题吗？随时问我～`,

    'qwen3-27b': () =>
`针对您的问题「${topic}」，我的回答如下：

核心观点
- 这是一个需要系统性分析的问题
- 建议从基础概念入手逐步深入

详细说明
1. 先理解问题的背景和上下文
2. 拆解为可处理的小问题
3. 逐个击破最后汇总

补充信息
- 相关资料可以在官方文档中找到
- 社区讨论也提供了很多参考案例

如有疑问欢迎继续交流。`,

    'gpt-4o-mini': () =>
`哇，这个问题问得好！✨

关于「${topic}」，我来给你分享一些想法：

1️⃣ **首先**，这个问题涉及的面挺广的，让我帮你梳理一下重点～

2️⃣ **其次**，我建议可以从这几个方向入手：
   - 方向一：理论研究
   - 方向二：实践验证
   - 方向三：总结优化

3️⃣ **最后**，记得多尝试、多总结，实践出真知！

如果还有疑问随时问我哦！😊 一起进步～`,

    'silicon-flow': () =>
`关于「${topic}」的简洁回答：

**可以直接这样做：**
- 步骤一：确认需求和前置条件
- 步骤二：选择合适的方案
- 步骤三：执行并验证结果

**注意事项：**
- 确保数据准确性
- 做好异常处理
- 记录关键日志

希望能帮到你。`,

    'claude-sonnet': () =>
`我来仔细分析一下「${topic}」这个问题。

## 核心分析

经过认真思考，我认为这个问题需要从以下几个维度来理解：

### 1. 理论基础
任何技术问题都需要建立在扎实的理论基础上。建议先确认相关的基本概念是否清晰。

### 2. 实践路径
\`\`\`
1. 环境准备 —— 配置必要的工具和依赖
2. 原型验证 —— 先用最小方案验证可行性
3. 迭代优化 —— 根据反馈逐步完善
\`\`\`

### 3. 注意事项
- 性能方面要提前做好评估
- 安全性不能忽视
- 可维护性需要考虑长期成本

## 总结
这是一个值得深入探讨的问题。如果你有具体的应用场景，我可以给出更有针对性的建议。`,

    'gemini-pro': () =>
`这是一个很好的问题！让我从多个角度来分析「${topic}」。

## 角度一：理论基础

从学术角度来看，这个问题涉及到几个核心概念：
• 概念A —— 这是理解问题的基础
• 概念B —— 这是解决问题的关键
• 概念C —— 这是优化方向的依据

## 角度二：实践应用

在实际应用中，我们通常遵循以下步骤：

| 步骤 | 操作 | 预期结果 |
|------|------|----------|
| 1 | 需求分析 | 明确目标 |
| 2 | 方案设计 | 确定路径 |
| 3 | 执行验证 | 得到结果 |

## 角度三：发展趋势

这个领域正在快速发展，值得关注的方向包括：
1. 自动化与智能化
2. 标准化与规范化
3. 生态化与平台化

希望这个全面的分析对你有所帮助。如有需要可以进一步探讨。`,

    'ollama-qwen': () =>
`好的，我来回答你关于「${topic}」的问题。

根据我的理解：

**简单来说：**
这是一个常见的问题，有标准的解决方法。

**具体步骤：**
1. 先搞清楚需求
2. 然后设计方案
3. 最后执行验证

**需要注意的点：**
- 细心很重要
- 多测试几遍
- 有问题及时调整

还有什么需要帮助的吗？`,
  };

  const fn = responses[modelId] || responses['deepseek-v3'];
  return fn();
}

/* ---------- Markdown Renderer ---------- */

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderMarkdown(text) {
  let html = escapeHtml(text);

  // Code blocks: ```lang\ncode```
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const header = lang ? '<div class="code-header">' + lang + '</div>' : '';
    return '<pre><code>' + header + code.trim() + '</code></pre>';
  });

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold: **text**
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

  // Line breaks (skip inside pre)
  let result = '';
  let inPre = false;
  for (let i = 0; i < html.length; i++) {
    if (html.slice(i, i + 4) === '<pre') inPre = true;
    if (html.slice(i, i + 6) === '</pre>') inPre = false;
    if (html[i] === '\n' && !inPre) result += '<br>';
    else result += html[i];
  }

  // Wrap consecutive <br> separated list items
  result = result.replace(/((?:<br>)*)((?:[-*]\s[^<\n]+<br>)+)/g, (_, brs, listContent) => {
    const items = listContent.split(/<br>\s*/).filter(Boolean).map(line => {
      const cleaned = line.replace(/^[-*]\s/, '');
      return '<li>' + cleaned + '</li>';
    });
    return brs + '<ul>' + items.join('') + '</ul>';
  });

  // Ordered list items
  result = result.replace(/((?:<br>)*)((?:\d+\.\s[^<\n]+<br>)+)/g, (_, brs, listContent) => {
    const items = listContent.split(/<br>\s*/).filter(Boolean).map(line => {
      const cleaned = line.replace(/^\d+\.\s/, '');
      return '<li>' + cleaned + '</li>';
    });
    return brs + '<ol>' + items.join('') + '</ol>';
  });

  // Clean up empty paragraphs
  result = result.replace(/(<br>\s*){3,}/g, '<br><br>');

  return result;
}

/* ---------- Typewriter Effect ---------- */

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

class Typewriter {
  constructor(element) {
    this.element = element;
    this.timer = null;
    this.stopped = false;
  }

  async start(html, speed = 20) {
    this.stopped = false;
    this.element.innerHTML = '';
    let output = '';
    let i = 0;

    while (i < html.length && !this.stopped) {
      if (html[i] === '<') {
        const closeIdx = html.indexOf('>', i);
        if (closeIdx !== -1) {
          output += html.slice(i, closeIdx + 1);
          i = closeIdx + 1;
          this.element.innerHTML = output;
          continue;
        }
      }
      output += html[i];
      i++;
      this.element.innerHTML = output;
      await sleep(speed);
    }

    if (!this.stopped) {
      this.element.innerHTML = html;
    }
  }

  stop() {
    this.stopped = true;
    this.element.innerHTML = this.element.innerHTML;
  }
}

/* ---------- Chat State ---------- */

const STORAGE_KEY = 'playground_state';

let state = {
  sessions: [],
  currentSessionId: null,
  currentModel: 'deepseek-v3',
  temperature: 0.7,
  isSending: false,
  currentTypewriter: null,
};

const els = {};

function genId() {
  return 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function saveState() {
  const data = {
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    currentModel: state.currentModel,
    temperature: state.temperature,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage full or unavailable
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      state.sessions = data.sessions || [];
      state.currentSessionId = data.currentSessionId || null;
      state.currentModel = data.currentModel || 'deepseek-v3';
      state.temperature = data.temperature ?? 0.7;
    }
  } catch (e) {
    // Corrupt data, reset
  }
}

function getCurrentSession() {
  return state.sessions.find(s => s.id === state.currentSessionId);
}

function updateSessionTitle(session) {
  if (!session) return;
  const firstUserMsg = session.messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    session.title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
  } else {
    session.title = '新对话';
  }
}

/* ---------- Model Selector ---------- */

function renderModelSelector() {
  const sel = els.modelSelect;
  sel.innerHTML = '';
  MODELS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name + ' — ' + m.provider;
    sel.appendChild(opt);
  });
  sel.value = state.currentModel;
}

function getCurrentModel() {
  return MODELS.find(m => m.id === state.currentModel) || MODELS[0];
}

function getModelById(id) {
  return MODELS.find(m => m.id === id) || MODELS[0];
}

/* ---------- Message Rendering ---------- */

function createMessageElement(msg) {
  const div = document.createElement('div');
  div.className = 'message ' + msg.role;
  div.dataset.timestamp = msg.timestamp || Date.now();

  if (msg.role === 'assistant') {
    const model = getModelById(msg.model || state.currentModel);
    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.style.background = model.color;
    avatar.textContent = model.icon;
    avatar.title = model.provider + ' - ' + model.name;
    div.appendChild(avatar);

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    const header = document.createElement('div');
    header.className = 'msg-header';
    header.innerHTML = '<span class="msg-model">' + model.name + '</span><span class="msg-time">' + formatTime(msg.timestamp) + '</span>';
    bubble.appendChild(header);
    const content = document.createElement('div');
    content.className = 'msg-content';
    content.innerHTML = renderMarkdown(msg.content);
    bubble.appendChild(content);
    div.appendChild(bubble);
  } else {
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    const content = document.createElement('div');
    content.className = 'msg-content';
    content.textContent = msg.content;
    bubble.appendChild(content);
    div.appendChild(bubble);
  }

  return div;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

function scrollToBottom() {
  els.messagesContainer.scrollTop = els.messagesContainer.scrollHeight;
}

/* ---------- Typing Indicator ---------- */

function showTypingIndicator() {
  const div = document.createElement('div');
  div.className = 'message assistant typing-indicator';

  const model = getCurrentModel();
  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.style.background = model.color;
  avatar.textContent = model.icon;
  div.appendChild(avatar);

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  const header = document.createElement('div');
  header.className = 'msg-header';
  header.innerHTML = '<span class="msg-model">' + model.name + '</span>';
  bubble.appendChild(header);

  const dots = document.createElement('div');
  dots.className = 'typing-dots';
  for (let i = 0; i < 3; i++) {
    const span = document.createElement('span');
    dots.appendChild(span);
  }
  bubble.appendChild(dots);
  div.appendChild(bubble);

  els.messagesContainer.appendChild(div);
  scrollToBottom();
  return div;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

/* ---------- Send / Receive ---------- */

async function sendMessage() {
  const input = els.chatInput;
  const text = input.value.trim();
  if (!text || state.isSending) return;
  if (!state.currentSessionId) {
    createNewSession();
  }

  const session = getCurrentSession();
  if (!session) return;

  state.isSending = true;
  input.value = '';
  input.style.height = 'auto';
  els.sendBtn.disabled = true;
  updateInputFooter();

  // Add user message
  const userMsg = { role: 'user', content: text, timestamp: Date.now() };
  session.messages.push(userMsg);
  updateSessionTitle(session);
  renderSessionList();

  const msgEl = createMessageElement(userMsg);
  els.messagesContainer.appendChild(msgEl);
  scrollToBottom();

  // Show typing indicator
  const typingEl = showTypingIndicator();

  const modelId = session.model;

  // ------ Try real API ------
  let responseText = '';

  // Only attempt real API if a key is configured
  if (hasApiKey()) {
    try {
      const apiModelId = getApiModelId(modelId);

      // Build message history for context
      const history = session.messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const stream = API_CLIENT.chatCompletionStream({
        model: apiModelId,
        messages: history,
        temperature: session.temperature,
      });

      // Remove typing indicator
      removeTypingIndicator(typingEl);

      // Create assistant message element (content starts empty)
      const assistantMsg = {
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        model: modelId,
      };
      session.messages.push(assistantMsg);

      const asstEl = createMessageElement(assistantMsg);
      els.messagesContainer.appendChild(asstEl);
      scrollToBottom();

      const contentEl = asstEl.querySelector('.msg-content');

      // Process stream chunks
      let fullContent = '';

      // Inner try-catch: if streaming fails mid-way, keep partial content
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content || '';
          const finishReason = chunk.choices?.[0]?.finish_reason;

          if (delta) {
            fullContent += delta;
          }

          // Render progressively
          if (delta && contentEl) {
            contentEl.innerHTML = renderMarkdown(fullContent);
            scrollToBottom();
          }

          if (finishReason === 'stop') {
            break;
          }
        }
      } catch (streamErr) {
        console.warn('Stream interrupted, partial content preserved:', streamErr.message);
      }

      // Final render (even if partial)
      if (contentEl) {
        contentEl.innerHTML = renderMarkdown(fullContent);
      }
      responseText = fullContent;
      assistantMsg.content = fullContent;

    } catch (err) {
      console.warn('API call failed to start, falling back to mock:', err.message);
      // Fall through to mock - typing indicator is still showing, no message committed
    }
  } else {
    // No API key, show the key banner if not already visible
    if (!document.getElementById('apikeyBar')) {
      renderApiKeyBar();
    }
  }

  // ------ Fallback to mock if API failed or no key ------
  if (!responseText) {
    // Simulate network delay for mock
    await sleep(600 + Math.random() * 900);

    // Get mock response
    responseText = getMockResponse(modelId, text);

    // Remove typing
    removeTypingIndicator(typingEl);

    // Add assistant message
    const assistantMsg = {
      role: 'assistant',
      content: responseText,
      timestamp: Date.now(),
      model: modelId,
    };
    session.messages.push(assistantMsg);

    const asstEl = createMessageElement(assistantMsg);
    els.messagesContainer.appendChild(asstEl);
    scrollToBottom();

    // Typewriter effect on the content
    const contentEl = asstEl.querySelector('.msg-content');
    if (contentEl) {
      const originalHtml = renderMarkdown(responseText);
      const tw = new Typewriter(contentEl);
      state.currentTypewriter = tw;
      await tw.start(originalHtml, 15);
      state.currentTypewriter = null;
    }
  }

  state.isSending = false;
  session.updatedAt = Date.now();
  saveState();
  updateInputFooter();
  renderSessionList();
}

/* ---------- Session Management ---------- */

function createNewSession() {
  const session = {
    id: genId(),
    title: '新对话',
    model: state.currentModel,
    temperature: state.temperature,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  state.sessions.unshift(session);
  state.currentSessionId = session.id;
  saveState();
  switchToSession(session.id);
}

function switchToSession(sessionId) {
  state.currentSessionId = sessionId;
  const session = getCurrentSession();
  if (!session) return;

  state.currentModel = session.model;
  state.temperature = session.temperature;

  els.modelSelect.value = state.currentModel;
  els.tempSlider.value = session.temperature;
  els.tempValue.textContent = session.temperature;

  renderMessages();
  renderSessionList();
  saveState();
}

function renderMessages() {
  els.messagesContainer.innerHTML = '';
  const session = getCurrentSession();
  if (!session || session.messages.length === 0) {
    showEmptyState();
    return;
  }

  session.messages.forEach(msg => {
    const el = createMessageElement(msg);
    els.messagesContainer.appendChild(el);
  });
  scrollToBottom();
}

function showEmptyState() {
  const model = getCurrentModel();
  els.messagesContainer.innerHTML =
    '<div class="empty-state">' +
    '<div class="empty-icon" style="background:' + model.color + '20;color:' + model.color + '">' + model.icon + '</div>' +
    '<h3>' + model.name + '</h3>' +
    '<p>' + model.provider + ' · ' + model.desc + '</p>' +
    '<p class="empty-hint">输入消息开始对话</p>' +
    '</div>';
}

function renderSessionList() {
  const list = els.sessionList;
  list.innerHTML = '';
  state.sessions.forEach(s => {
    const div = document.createElement('div');
    div.className = 'session-item' + (s.id === state.currentSessionId ? ' active' : '');
    div.innerHTML =
      '<span class="session-title">' + escapeHtml(s.title) + '</span>' +
      '<span class="session-model">' + getModelById(s.model).name + '</span>';
    div.addEventListener('click', () => switchToSession(s.id));
    list.appendChild(div);
  });
}

function deleteSession(id, e) {
  e.stopPropagation();
  state.sessions = state.sessions.filter(s => s.id !== id);
  if (state.currentSessionId === id) {
    state.currentSessionId = state.sessions.length > 0 ? state.sessions[0].id : null;
  }
  if (state.currentSessionId) {
    switchToSession(state.currentSessionId);
  } else {
    createNewSession();
  }
  saveState();
}

/* ---------- UI Updates ---------- */

function updateInputFooter() {
  const model = getCurrentModel();
  const session = getCurrentSession();
  const msgCount = session ? session.messages.length : 0;
  const pairs = Math.floor(msgCount / 2);
  els.modelInfo.textContent = model.name + ' · 温度 ' + state.temperature + ' · ' + pairs + ' 轮对话';
}

/* ---------- Event Binding ---------- */

function bindEvents() {
  // Model selector
  els.modelSelect.addEventListener('change', () => {
    state.currentModel = els.modelSelect.value;
    const session = getCurrentSession();
    if (session) {
      session.model = state.currentModel;
      saveState();
    }
    renderMessages();
    updateInputFooter();
  });

  // Temperature slider
  els.tempSlider.addEventListener('input', () => {
    const val = parseFloat(els.tempSlider.value);
    state.temperature = val;
    els.tempValue.textContent = val.toFixed(1);
    const session = getCurrentSession();
    if (session) {
      session.temperature = val;
    }
    updateInputFooter();
  });

  els.tempSlider.addEventListener('change', () => {
    saveState();
  });

  // Send button
  els.sendBtn.addEventListener('click', sendMessage);

  // Input
  els.chatInput.addEventListener('input', () => {
    els.chatInput.style.height = 'auto';
    els.chatInput.style.height = Math.min(els.chatInput.scrollHeight, 200) + 'px';
    els.sendBtn.disabled = !els.chatInput.value.trim() || state.isSending;
  });

  els.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // New chat button
  els.newChatBtn.addEventListener('click', () => {
    createNewSession();
    els.chatInput.focus();
  });

  // Sidebar toggle
  els.toggleSidebar.addEventListener('click', () => {
    els.sessionSidebar.classList.toggle('open');
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      const sidebar = els.sessionSidebar;
      const toggle = els.toggleSidebar;
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

/* ---------- Init ---------- */

function init() {
  // Cache DOM refs
  els.modelSelect = document.getElementById('modelSelect');
  els.tempSlider = document.getElementById('tempSlider');
  els.tempValue = document.getElementById('tempValue');
  els.chatInput = document.getElementById('chatInput');
  els.sendBtn = document.getElementById('sendBtn');
  els.messagesContainer = document.getElementById('messagesContainer');
  els.newChatBtn = document.getElementById('newChatBtn');
  els.sessionSidebar = document.getElementById('sessionSidebar');
  els.sessionList = document.getElementById('sessionList');
  els.toggleSidebar = document.getElementById('toggleSidebar');
  els.modelInfo = document.getElementById('modelInfo');

  loadState();

  // Initialize API key from localStorage
  const savedKey = getApiKey();
  if (savedKey) {
    API_CLIENT.setApiKey(savedKey);
  }

  renderModelSelector();

  els.tempSlider.value = state.temperature;
  els.tempValue.textContent = state.temperature.toFixed(1);

  if (state.sessions.length === 0 || !state.currentSessionId) {
    createNewSession();
  } else {
    switchToSession(state.currentSessionId);
  }

  renderSessionList();
  bindEvents();
  updateInputFooter();

  // Show API key banner if no key configured
  if (!savedKey && !document.getElementById('apikeyBar')) {
    renderApiKeyBar();
  }

  // Focus input on load
  setTimeout(() => els.chatInput.focus(), 100);
}

document.addEventListener('DOMContentLoaded', init);
