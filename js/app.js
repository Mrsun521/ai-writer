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

function initNavbar() {
  const path = window.location.pathname;
  document.querySelectorAll('.navbar-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (path === href || path.endsWith(href)) {
      a.classList.add('active');
    } else if (href === '/' && (path === '/' || path === '/index.html')) {
      a.classList.add('active');
    }
  });
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

      const content = await generateContent(type, params);
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
        // Fallback for older browsers
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

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  updateUsageUI();
  initToolPage();
});
