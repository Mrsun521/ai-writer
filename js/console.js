/* Developer Console - Business Logic */

/* ---------- Mock Data Generators ---------- */

function randomStr(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateApiKey() {
  return 'sk-' + randomStr(32);
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.getFullYear() + '-' +
    (d.getMonth() + 1).toString().padStart(2, '0') + '-' +
    d.getDate().toString().padStart(2, '0');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDateTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return formatDate(d) + ' ' +
    d.getHours().toString().padStart(2, '0') + ':' +
    d.getMinutes().toString().padStart(2, '0');
}

/* ---------- Initial Mock Data ---------- */

const INITIAL_KEYS = [
  { id: 'k_' + randomStr(8), key: generateApiKey(), name: '生产环境', created: '2026-05-01', lastUsed: '2026-05-20 14:30', status: 'active' },
  { id: 'k_' + randomStr(8), key: generateApiKey(), name: '开发测试', created: '2026-05-05', lastUsed: '2026-05-19 10:15', status: 'active' },
  { id: 'k_' + randomStr(8), key: generateApiKey(), name: '临时密钥', created: '2026-05-10', lastUsed: '2026-05-18 22:00', status: 'active' },
];

const INITIAL_TRANSACTIONS = [
  { id: 'tx_001', date: '2026-05-20', description: 'API 调用消耗 (DeepSeek-V3)', amount: -2.50, type: 'usage' },
  { id: 'tx_002', date: '2026-05-19', description: 'API 调用消耗 (GLM-4-Flash)', amount: -1.80, type: 'usage' },
  { id: 'tx_003', date: '2026-05-18', description: 'API 调用消耗 (Claude Sonnet 4)', amount: -4.20, type: 'usage' },
  { id: 'tx_004', date: '2026-05-17', description: 'API 调用消耗 (GPT-4o-mini)', amount: -0.90, type: 'usage' },
  { id: 'tx_005', date: '2026-05-15', description: '账户充值', amount: 100.00, type: 'topup' },
  { id: 'tx_006', date: '2026-05-14', description: 'API 调用消耗 (Qwen3-27B)', amount: -1.50, type: 'usage' },
  { id: 'tx_007', date: '2026-05-12', description: 'API 调用消耗 (Gemini 2.5 Pro)', amount: -3.00, type: 'usage' },
  { id: 'tx_008', date: '2026-05-10', description: 'API 调用消耗 (DeepSeek-V3)', amount: -2.10, type: 'usage' },
];

/* ---------- State ---------- */

const STORAGE_KEY = 'console_state';

let consoleState = {
  apiKeys: [],
  transactions: [],
  balance: 99.50,
  totalCalls: 8956,
  totalTokens: 18500000,
  todayCalls: 128,
  todayTokens: 285000,
};

function saveConsoleState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      apiKeys: consoleState.apiKeys,
      transactions: consoleState.transactions,
      balance: consoleState.balance,
    }));
  } catch (e) {
    // ignore
  }
}

function loadConsoleState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      consoleState.apiKeys = data.apiKeys || [];
      consoleState.transactions = data.transactions || [];
      consoleState.balance = data.balance ?? 99.50;
    } else {
      consoleState.apiKeys = JSON.parse(JSON.stringify(INITIAL_KEYS));
      consoleState.transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
      saveConsoleState();
    }
  } catch (e) {
    consoleState.apiKeys = JSON.parse(JSON.stringify(INITIAL_KEYS));
    consoleState.transactions = JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS));
  }
}

/* ---------- Trend Data (always generated fresh) ---------- */

function getTrendData() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = (d.getMonth() + 1) + '/' + d.getDate();
    const calls = Math.floor(80 + Math.random() * 100);
    const tokens = Math.floor(150000 + Math.random() * 200000);
    days.push({ label, calls, tokens });
  }
  return days;
}

function getUsageStats(type) {
  const models = [
    { model: 'DeepSeek-V3', dailyCalls: 45, dailyTokens: 120000, monthlyCalls: 980, monthlyTokens: 2850000 },
    { model: 'GLM-4-Flash', dailyCalls: 32, dailyTokens: 65000, monthlyCalls: 720, monthlyTokens: 1520000 },
    { model: 'Qwen3-27B', dailyCalls: 18, dailyTokens: 40000, monthlyCalls: 410, monthlyTokens: 920000 },
    { model: 'GPT-4o-mini', dailyCalls: 15, dailyTokens: 28000, monthlyCalls: 340, monthlyTokens: 650000 },
    { model: 'Claude Sonnet 4', dailyCalls: 8, dailyTokens: 22000, monthlyCalls: 165, monthlyTokens: 480000 },
    { model: 'Gemini 2.5 Pro', dailyCalls: 6, dailyTokens: 15000, monthlyCalls: 120, monthlyTokens: 320000 },
    { model: 'SiliconFlow Qwen2.5-7B', dailyCalls: 3, dailyTokens: 5000, monthlyCalls: 55, monthlyTokens: 110000 },
    { model: 'Ollama qwen2.5:7b', dailyCalls: 1, dailyTokens: 2000, monthlyCalls: 20, monthlyTokens: 45000 },
  ];
  return models.map(m => ({
    model: m.model,
    calls: type === 'daily' ? m.dailyCalls : m.monthlyCalls,
    tokens: type === 'daily' ? m.dailyTokens : m.monthlyTokens,
  }));
}

/* ---------- Panel Navigation ---------- */

const PANELS = ['dashboard', 'api-keys', 'usage', 'billing', 'settings'];
let currentPanel = 'dashboard';

function switchPanel(panelId) {
  if (!PANELS.includes(panelId)) return;
  currentPanel = panelId;

  // Update sidebar
  document.querySelectorAll('.console-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.panel === panelId);
  });

  // Show active panel
  document.querySelectorAll('.console-panel').forEach(panel => {
    panel.classList.remove('active');
  });
  const target = document.getElementById('panel-' + panelId);
  if (target) target.classList.add('active');

  // Render panel content
  switch (panelId) {
    case 'dashboard': renderDashboard(); break;
    case 'api-keys': renderApiKeys(); break;
    case 'usage': renderUsage('daily'); break;
    case 'billing': renderBilling(); break;
    case 'settings': renderSettings(); break;
  }
}

/* ---------- Dashboard ---------- */

function renderDashboard() {
  const trend = getTrendData();

  // Stat cards
  document.getElementById('statBalance').textContent = '¥' + consoleState.balance.toFixed(2);
  document.getElementById('statTodayCalls').textContent = consoleState.todayCalls;
  document.getElementById('statActiveKeys').textContent = consoleState.apiKeys.filter(k => k.status === 'active').length;
  document.getElementById('statTotalTokens').textContent = formatNumber(consoleState.totalTokens);

  // Trend chart
  renderBarChart('trendChart', trend.map(d => ({ label: d.label, value: d.calls })), '#6366F1');
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

/* ---------- Bar Chart (CSS-based) ---------- */

function renderBarChart(containerId, data, color) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barHeight = 180;

  container.innerHTML = '';
  container.style.cssText = 'display:flex;align-items:flex-end;gap:8px;height:' + (barHeight + 30) + 'px;padding:0 4px;';

  data.forEach(item => {
    const group = document.createElement('div');
    group.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end;';

    const bar = document.createElement('div');
    const h = Math.max((item.value / maxVal) * barHeight, 4);
    bar.style.cssText = 'width:100%;max-width:36px;border-radius:4px 4px 0 0;transition:height 0.4s;position:relative;';
    bar.style.height = h + 'px';
    bar.style.background = 'linear-gradient(180deg,' + color + ', ' + color + 'cc)';

    const tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.textContent = item.value;
    bar.appendChild(tooltip);

    const label = document.createElement('div');
    label.textContent = item.label;
    label.style.cssText = 'font-size:11px;color:#9CA3AF;margin-top:4px;white-space:nowrap;';

    group.appendChild(bar);
    group.appendChild(label);
    container.appendChild(group);
  });
}

/* ---------- API Keys ---------- */

function renderApiKeys() {
  const tbody = document.getElementById('apiKeysBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  if (consoleState.apiKeys.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-cell">暂无 API Key，点击上方按钮创建</td></tr>';
    return;
  }

  consoleState.apiKeys.forEach(k => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td><code class="key-display">' + maskKey(k.key) + '</code></td>' +
      '<td>' + escapeHtml(k.name) + '</td>' +
      '<td>' + k.created + '</td>' +
      '<td>' + k.lastUsed + '</td>' +
      '<td>' +
      '<span class="badge badge-' + (k.status === 'active' ? 'success' : 'danger') + '">' +
      (k.status === 'active' ? '启用' : '禁用') +
      '</span>' +
      '</td>' +
      '<td class="action-cell">' +
      '<button class="btn btn-sm btn-copy" data-key="' + k.key + '" title="复制">复制</button>' +
      '<button class="btn btn-sm btn-danger" data-id="' + k.id + '" title="删除">删除</button>' +
      '</td>';
    tbody.appendChild(tr);
  });

  // Bind copy buttons
  tbody.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      navigator.clipboard.writeText(key).then(() => {
        btn.textContent = '已复制';
        setTimeout(() => { btn.textContent = '复制'; }, 2000);
      }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = key;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '已复制';
        setTimeout(() => { btn.textContent = '复制'; }, 2000);
      });
    });
  });

  // Bind delete buttons
  tbody.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('确定要删除此 API Key 吗？')) {
        const id = btn.dataset.id;
        consoleState.apiKeys = consoleState.apiKeys.filter(k => k.id !== id);
        saveConsoleState();
        renderApiKeys();
        updateDashboardStats();
      }
    });
  });
}

function maskKey(key) {
  if (!key || key.length < 10) return key;
  return key.slice(0, 6) + '••••••••' + key.slice(-4);
}

/* ---------- Usage ---------- */

let usageViewType = 'daily';

function renderUsage(type) {
  usageViewType = type;
  const stats = getUsageStats(type);

  // Toggle buttons
  document.querySelectorAll('.usage-toggle').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Summary
  const totalCalls = stats.reduce((s, m) => s + m.calls, 0);
  const totalTokens = stats.reduce((s, m) => s + m.tokens, 0);
  document.getElementById('usageTotalCalls').textContent = totalCalls;
  document.getElementById('usageTotalTokens').textContent = formatNumber(totalTokens);

  // Table
  const tbody = document.getElementById('usageBody');
  tbody.innerHTML = '';
  stats.forEach(m => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + escapeHtml(m.model) + '</td>' +
      '<td>' + m.calls + '</td>' +
      '<td>' + formatNumber(m.tokens) + '</td>' +
      '<td>' + (m.calls > 0 ? ((m.tokens / m.calls).toFixed(0)) : '0') + '</td>';
    tbody.appendChild(tr);
  });

  // Chart
  renderBarChart('usageChart', stats.map(m => ({ label: m.model.length > 10 ? m.model.slice(0, 10) + '..' : m.model, value: m.calls })), '#8B5CF6');
}

/* ---------- Billing ---------- */

function renderBilling() {
  document.getElementById('billingBalance').textContent = '¥' + consoleState.balance.toFixed(2);

  const tbody = document.getElementById('billingBody');
  tbody.innerHTML = '';
  if (consoleState.transactions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-cell">暂无交易记录</td></tr>';
    return;
  }

  consoleState.transactions.forEach(tx => {
    const tr = document.createElement('tr');
    const isTopup = tx.type === 'topup';
    tr.innerHTML =
      '<td>' + tx.date + '</td>' +
      '<td>' + escapeHtml(tx.description) + '</td>' +
      '<td class="' + (isTopup ? 'amount-positive' : 'amount-negative') + '">' +
      (isTopup ? '+' : '') + tx.amount.toFixed(2) +
      '</td>';
    tbody.appendChild(tr);
  });
}

/* ---------- Settings ---------- */

function renderSettings() {
  const nameInput = document.getElementById('settingsName');
  const emailInput = document.getElementById('settingsEmail');
  const notifyToggle = document.getElementById('settingsNotify');
  const modelSelect = document.getElementById('settingsDefaultModel');

  // Load from localStorage
  const settings = loadSettings();
  nameInput.value = settings.name || '';
  emailInput.value = settings.email || '';
  notifyToggle.checked = settings.notify !== false;
  if (modelSelect) {
    modelSelect.value = settings.defaultModel || 'deepseek-v3';
  }

  // Save handler
  const saveBtn = document.getElementById('settingsSaveBtn');
  const newSaveBtn = saveBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  newSaveBtn.addEventListener('click', () => {
    const newSettings = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      notify: notifyToggle.checked,
      defaultModel: modelSelect ? modelSelect.value : 'deepseek-v3',
    };
    saveSettings(newSettings);
    newSaveBtn.textContent = '已保存';
    setTimeout(() => { newSaveBtn.textContent = '保存设置'; }, 2000);
  });
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('console_settings') || '{}');
  } catch (e) {
    return {};
  }
}

function saveSettings(settings) {
  try {
    localStorage.setItem('console_settings', JSON.stringify(settings));
  } catch (e) {
    // ignore
  }
}

function updateDashboardStats() {
  document.getElementById('statActiveKeys').textContent = consoleState.apiKeys.filter(k => k.status === 'active').length;
}

/* ---------- Event Binding ---------- */

function bindConsoleEvents() {
  // Sidebar navigation
  document.querySelectorAll('.console-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      switchPanel(item.dataset.panel);
      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        document.querySelector('.console-sidebar').classList.remove('open');
      }
    });
  });

  // Mobile sidebar toggle
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.querySelector('.console-sidebar').classList.toggle('open');
    });
  }

  // Create API Key
  const createKeyBtn = document.getElementById('createKeyBtn');
  if (createKeyBtn) {
    createKeyBtn.addEventListener('click', () => {
      const name = prompt('请输入 API Key 名称：', '新密钥');
      if (!name || !name.trim()) return;
      const newKey = {
        id: 'k_' + randomStr(8),
        key: generateApiKey(),
        name: name.trim(),
        created: formatDate(new Date()),
        lastUsed: '尚未使用',
        status: 'active',
      };
      consoleState.apiKeys.unshift(newKey);
      saveConsoleState();
      renderApiKeys();
      updateDashboardStats();
    });
  }

  // Usage toggle
  document.querySelectorAll('.usage-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      renderUsage(btn.dataset.type);
    });
  });

  // Top-up modal
  const topupModal = document.getElementById('topupModal');
  const topupStep1 = document.getElementById('topupStep1');
  const topupStep2 = document.getElementById('topupStep2');
  const amountGrid = document.getElementById('amountGrid');
  const qrImage = document.getElementById('qrImage');
  const qrPlaceholder = document.getElementById('qrPlaceholder');
  const qrStatus = document.getElementById('qrStatus');
  let selectedAmount = 50;
  let currentOrderId = null;
  let pollTimer = null;

  // Amount selection
  amountGrid?.addEventListener('click', (e) => {
    const btn = e.target.closest('.amount-btn');
    if (!btn) return;
    amountGrid.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAmount = parseInt(btn.dataset.amount);
  });

  // Open modal
  document.getElementById('topupBtn')?.addEventListener('click', () => {
    topupModal.classList.add('show');
    topupStep1.style.display = 'block';
    topupStep2.style.display = 'none';
    qrImage.style.display = 'none';
    qrPlaceholder.textContent = '选择金额开始充值';
    qrStatus.innerHTML = '';
  });

  // Close modal
  function closeModal() {
    topupModal.classList.remove('show');
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }
  document.getElementById('modalClose')?.addEventListener('click', closeModal);
  document.getElementById('topupCancel')?.addEventListener('click', closeModal);
  topupModal?.addEventListener('click', (e) => {
    if (e.target === topupModal) closeModal();
  });

  // Confirm payment
  document.getElementById('topupConfirm')?.addEventListener('click', async () => {
    topupStep1.style.display = 'none';
    topupStep2.style.display = 'block';
    qrPlaceholder.textContent = '正在创建支付订单...';
    qrImage.style.display = 'none';
    qrStatus.innerHTML = '<span class="status-badge pending">等待支付</span>';

    try {
      // Try real API first
      const resp = await fetch('/api/pay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selectedAmount }),
      });

      if (resp.ok) {
        const data = await resp.json();
        currentOrderId = data.order_id;
        // Show QR code
        qrImage.src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(data.qr);
        qrImage.onload = () => {
          qrImage.style.display = 'block';
          qrPlaceholder.style.display = 'none';
        };
        qrImage.onerror = () => {
          // QR API unavailable, show raw URL
          qrPlaceholder.innerHTML = `
            <p style="font-size:13px;color:var(--gray-500);margin-bottom:8px;">无法加载二维码图片</p>
            <p style="font-size:12px;color:var(--gray-400);word-break:break-all;">请复制以下链接到微信打开：</p>
            <code style="font-size:11px;background:var(--gray-100);padding:8px;border-radius:4px;display:inline-block;max-width:100%;word-break:break-all;">${data.qr}</code>
          `;
          qrPlaceholder.style.display = 'block';
        };

        // Poll payment status
        pollTimer = setInterval(async () => {
          try {
            const statusResp = await fetch('/api/pay/order-status?order_id=' + currentOrderId);
            if (statusResp.ok) {
              const statusData = await statusResp.json();
              if (statusData.status === 'completed') {
                clearInterval(pollTimer);
                pollTimer = null;
                qrStatus.innerHTML = '<span class="status-badge success">支付成功！</span>';
                // Refresh balance
                const usageResp = await fetch('/api/usage');
                if (usageResp.ok) {
                  const usageData = await usageResp.json();
                  consoleState.balance = (usageData.balance || 0) / 1000000;
                }
                saveConsoleState();
                renderBilling();
                updateDashboardStats();
                setTimeout(() => closeModal(), 2000);
              }
            }
          } catch (_) {}
        }, 3000);
      } else {
        throw new Error('API unavailable');
      }
    } catch (_) {
      // Mock mode: simulate payment
      qrPlaceholder.innerHTML = `
        <div style="width:200px;height:200px;border:2px dashed var(--gray-300);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-direction:column;background:var(--gray-50);">
          <span style="font-size:48px;">&#128179;</span>
          <span style="font-size:13px;color:var(--gray-500);margin-top:8px;">模拟支付</span>
        </div>
      `;
      qrPlaceholder.style.display = 'block';

      // Simulate payment after 5 seconds
      setTimeout(() => {
        qrStatus.innerHTML = '<span class="status-badge success">支付成功！（模拟）</span>';
        consoleState.balance += selectedAmount;
        consoleState.transactions.unshift({
          id: 'tx_' + randomStr(8),
          date: formatDate(new Date()),
          description: '账户充值 ¥' + selectedAmount,
          amount: selectedAmount,
          type: 'topup',
        });
        saveConsoleState();
        renderBilling();
        updateDashboardStats();
        setTimeout(() => closeModal(), 2000);
      }, 5000);
    }
  });

  // Done button
  document.getElementById('topupDone')?.addEventListener('click', closeModal);

  // Click outside sidebar to close (mobile)
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.console-sidebar');
      const toggle = document.getElementById('sidebarToggle');
      if (sidebar && sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) && toggle && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    }
  });
}

/* ---------- Init ---------- */

function initConsole() {
  loadConsoleState();

  // Populate model select in settings if element exists
  const modelSelect = document.getElementById('settingsDefaultModel');
  if (modelSelect) {
    const models = [
      'deepseek-v3', 'glm-4-flash', 'qwen3-27b', 'gpt-4o-mini',
      'silicon-flow', 'claude-sonnet', 'gemini-pro', 'ollama-qwen',
    ];
    const modelNames = {
      'deepseek-v3': 'DeepSeek-V3', 'glm-4-flash': 'GLM-4-Flash', 'qwen3-27b': 'Qwen3-27B',
      'gpt-4o-mini': 'GPT-4o-mini', 'silicon-flow': 'SiliconFlow Qwen2.5-7B',
      'claude-sonnet': 'Claude Sonnet 4', 'gemini-pro': 'Gemini 2.5 Pro', 'ollama-qwen': 'Ollama qwen2.5:7b',
    };
    models.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = modelNames[id] || id;
      modelSelect.appendChild(opt);
    });
  }

  bindConsoleEvents();
  switchPanel('dashboard');
}

document.addEventListener('DOMContentLoaded', initConsole);
