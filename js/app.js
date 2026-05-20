/* ===================================================
   AI 聚合 API — App Script
   - 导航栏交互（移动端、滚动效果）
   - 模型卡片渲染
   - 筛选/搜索（定价页）
   - 滚动入场动画
   - 统计数字动画
   - 使用次数管理（兼容旧工具页）
   =================================================== */

(function () {
  'use strict';

  // ============== Model Data (shared) ==============
  const MODELS = window.API_CLIENT ? API_CLIENT.getAllModels() : [];

  // Provider icon colors
  const PROVIDER_COLORS = {
    'DeepSeek': '#4F46E5',
    '智谱 AI': '#1E90FF',
    '通义千问': '#7C3AED',
    'ChatAnywhere': '#10B981',
    '硅基流动': '#06B6D4',
    '七牛云': '#D97706',
    '本地': '#64748B',
  };

  // ============== DOM Ready ==============
  document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initModelCards();
    initFilterTabs();
    initSearch();
    initScrollReveal();
    initStatsCounter();
    initToolPage(); // keep old tool page compat
    updateUsageUI(); // keep old usage display
  });

  // ============== Navigation ==============
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    // Scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const current = window.pageYOffset;
      if (current > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      lastScroll = current;
    }, { passive: true });

    // Mobile toggle
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
      });

      // Close on link click
      links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          toggle.classList.remove('active');
          links.classList.remove('open');
        });
      });
    }

    // Active link
    const path = window.location.pathname;
    document.querySelectorAll('.navbar-links a').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href !== '/' && path.includes(href)) {
        a.classList.add('active');
      } else if (href === '/' && (path === '/' || path === '/index.html')) {
        a.classList.add('active');
      }
    });
  }

  // ============== Model Cards ==============
  function initModelCards() {
    // Index page grid
    const indexGrid = document.getElementById('modelGrid');
    if (indexGrid) {
      renderModelCards(indexGrid, MODELS);
    }

    // Pricing page grid
    const pricingGrid = document.getElementById('pricingModelGrid');
    if (pricingGrid) {
      renderModelCards(pricingGrid, MODELS, true);
    }
  }

  function renderModelCards(container, models, detailed = false) {
    if (!container || !models.length) return;

    // Show skeleton first
    container.innerHTML = '';
    for (let i = 0; i < Math.min(models.length, 4); i++) {
      const skeleton = document.createElement('div');
      skeleton.className = 'model-card skeleton-card';
      skeleton.style.height = detailed ? '260px' : '220px';
      container.appendChild(skeleton);
    }

    // Render actual cards after brief delay
    setTimeout(() => {
      container.innerHTML = '';
      models.forEach((model, index) => {
        const card = createModelCard(model, detailed, index);
        container.appendChild(card);
      });

      // Re-init reveal for new cards
      initScrollReveal();
    }, 300);
  }

  function createModelCard(model, detailed, index) {
    const card = document.createElement('div');
    card.className = 'model-card reveal';
    card.dataset.category = model.category || 'other';
    card.dataset.id = model.id;
    card.style.transitionDelay = `${index * 0.05}s`;

    const statusLabel = model.status === 'active' ? '运营中' : (model.status === 'coming' ? '即将上线' : model.status);
    const statusClass = model.status === 'active' ? 'tag-active' : (model.status === 'coming' ? 'tag-coming' : '');
    const isFree = model.inputPrice === '免费' && model.outputPrice === '免费';

    const speedLabel = model.speed === 'fast' ? '快' : (model.speed === 'medium' ? '中' : '慢');
    const speedClass = `tag-speed-${model.speed}`;

    const iconColor = PROVIDER_COLORS[model.provider] || model.color || '#6366F1';

    card.innerHTML = `
      <div class="model-card-header">
        <div class="model-card-icon" style="background:${iconColor};">${model.icon || model.name[0]}</div>
        <div class="model-card-badges">
          <span class="tag ${statusClass}">${statusLabel}</span>
          <span class="tag tag-speed ${speedClass}">${speedLabel}</span>
        </div>
      </div>
      <div class="model-card-name">${model.name}</div>
      <div class="model-card-provider">${model.provider}</div>
      <div class="model-card-specs">
        <div class="model-card-spec">
          <span class="spec-label">上下文</span>
          <span class="spec-value">${model.context}</span>
        </div>
        <div class="model-card-spec">
          <span class="spec-label">输入价格</span>
          <span class="spec-value">${isFree ? '免费' : model.inputPrice + '/1M'}</span>
        </div>
        <div class="model-card-spec">
          <span class="spec-label">输出价格</span>
          <span class="spec-value">${isFree ? '免费' : model.outputPrice + '/1M'}</span>
        </div>
        <div class="model-card-spec">
          <span class="spec-label">${detailed ? '描述' : '状态'}</span>
          <span class="spec-value">${detailed ? (model.description || '-') : statusLabel}</span>
        </div>
      </div>
      ${detailed ? `
        <div class="model-card-actions">
          <a href="playground.html" class="btn btn-primary btn-sm btn-block">开始使用</a>
        </div>
      ` : `
        <div class="model-card-actions">
          <a href="/pricing.html" class="btn btn-secondary btn-sm btn-block">查看定价</a>
        </div>
      `}
    `;

    return card;
  }

  // ============== Filter Tabs (Pricing Page) ==============
  function initFilterTabs() {
    const tabsContainer = document.getElementById('filterTabs');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.filter-tab');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        applyFilters();
      });
    });
  }

  function applyFilters() {
    const grid = document.getElementById('pricingModelGrid');
    if (!grid) return;

    const activeTab = document.querySelector('.filter-tab.active');
    const filter = activeTab ? activeTab.dataset.filter : 'all';
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase().trim() || '';

    const cards = grid.querySelectorAll('.model-card');
    cards.forEach((card) => {
      const category = card.dataset.category || 'other';
      const name = card.querySelector('.model-card-name')?.textContent?.toLowerCase() || '';
      const provider = card.querySelector('.model-card-provider')?.textContent?.toLowerCase() || '';

      const matchesFilter = filter === 'all' || category === filter;
      const matchesSearch = !searchTerm || name.includes(searchTerm) || provider.includes(searchTerm);

      if (matchesFilter && matchesSearch) {
        card.style.display = '';
        card.style.opacity = '1';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // ============== Search ==============
  function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(applyFilters, 200);
    });
  }

  // ============== Scroll Reveal ==============
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  // ============== Stats Counter ==============
  function initStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    if (!stats.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.textContent.trim();
            const num = parseFloat(text.replace(/[^0-9.]/g, ''));
            const suffix = text.replace(/[0-9.]/g, '');
            if (!isNaN(num)) {
              animateCount(el, num, suffix);
            }
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    stats.forEach((el) => observer.observe(el));
  }

  function animateCount(el, target, suffix) {
    const duration = 1500;
    const startTime = performance.now();
    const startVal = 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const current = startVal + (target - startVal) * eased;

      if (target >= 1) {
        el.textContent = Math.round(current) + suffix;
      } else {
        el.textContent = current.toFixed(1) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  // ============== Tool Page Compat (keep existing) ==============
  const USAGE_KEY = 'free_usage_remaining';
  const DEFAULT_FREE_TRIALS = 10;

  function getUsageRemaining() {
    const val = localStorage.getItem(USAGE_KEY);
    if (val === null) {
      localStorage.setItem(USAGE_KEY, DEFAULT_FREE_TRIALS);
      return DEFAULT_FREE_TRIALS;
    }
    return parseInt(val, 10) || 0;
  }

  function decrementUsage() {
    const current = getUsageRemaining();
    const next = Math.max(0, current - 1);
    localStorage.setItem(USAGE_KEY, next);
    updateUsageUI();
    return next;
  }

  function updateUsageUI() {
    const remaining = getUsageRemaining();
    document.querySelectorAll('.usage-badge').forEach((el) => {
      el.textContent = `剩余 ${remaining} 次`;
    });
    document.querySelectorAll('.free-count').forEach((el) => {
      el.textContent = remaining;
    });
    if (remaining <= 0) {
      document.querySelectorAll('.btn-generate').forEach((btn) => {
        btn.disabled = true;
        btn.title = '免费次数已用完，请前往价格页购买';
      });
    }
  }

  function initToolPage() {
    const generateBtn = document.getElementById('generateBtn');
    const outputArea = document.getElementById('outputArea');
    const copyBtn = document.getElementById('copyBtn');

    if (!generateBtn || !outputArea) return;

    generateBtn.addEventListener('click', async () => {
      const remaining = getUsageRemaining();
      if (remaining <= 0) {
        alert('免费次数已用完，请前往价格页购买更多次数。');
        window.location.href = '/pricing.html';
        return;
      }

      generateBtn.disabled = true;
      generateBtn.textContent = '生成中...';

      try {
        const type = generateBtn.dataset.type || 'weekly';
        const params = {};

        document.querySelectorAll('[data-param]').forEach((el) => {
          params[el.dataset.param] = el.value;
        });

        const content = await window.generateContent(type, params);
        outputArea.textContent = content;
        outputArea.dataset.content = content;
        decrementUsage();

        if (copyBtn) {
          copyBtn.classList.remove('copied');
          copyBtn.textContent = '复制文案';
        }
      } catch (err) {
        outputArea.textContent = `生成失败：${err.message}`;
      } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = '生成';
      }
    });

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const content = outputArea.dataset.content || outputArea.textContent;
        if (!content || content === '生成的文案将显示在这里') {
          alert('暂无内容可复制');
          return;
        }
        navigator.clipboard.writeText(content).then(() => {
          copyBtn.classList.add('copied');
          copyBtn.textContent = '已复制';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = '复制文案';
          }, 2000);
        }).catch(() => {
          const ta = document.createElement('textarea');
          ta.value = content;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copyBtn.classList.add('copied');
          copyBtn.textContent = '已复制';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.textContent = '复制文案';
          }, 2000);
        });
      });
    }
  }

})();
