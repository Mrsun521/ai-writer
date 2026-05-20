// 前端静态页面嵌入 — 由 Worker 直接 serve，无需 GitHub Pages

export const STATIC_FILES = {
  "/": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI 写作助手 - 一键生成优质内容</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">AI 写作助手</a>
      <ul class="navbar-links">
        <li><a href="/">首页</a></li>
        <li><a href="/tools/weekly">工具</a></li>
        <li><a href="/pricing">价格</a></li>
      </ul>
      <div class="navbar-usage">
        <span class="usage-badge">剩余 10 次</span>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <section class="hero">
      <div class="container">
        <h1>AI 写作助手</h1>
        <p>周报 · 小红书 · 朋友圈，一键生成</p>
        <a href="/tools/weekly" class="btn btn-primary btn-lg">立即使用</a>
      </div>
    </section>
    <section class="container">
      <div class="card-grid">
        <div class="card">
          <div class="card-icon">📋</div>
          <h3>周报生成器</h3>
          <p>输入本周工作内容，自动生成专业周报，支持亮点总结和下周规划。</p>
          <div class="card-usage">免费次数：<span class="free"><span class="free-count">10</span> 次</span></div>
          <a href="/tools/weekly" class="btn btn-primary btn-block">开始使用</a>
        </div>
        <div class="card">
          <div class="card-icon">📕</div>
          <h3>小红书文案</h3>
          <p>智能生成小红书爆款文案，标题吸睛、正文动人、标签精准。</p>
          <div class="card-usage">免费次数：<span class="free"><span class="free-count">10</span> 次</span></div>
          <a href="/tools/xiaohongshu" class="btn btn-primary btn-block">开始使用</a>
        </div>
        <div class="card">
          <div class="card-icon">💬</div>
          <h3>朋友圈文案</h3>
          <p>根据场景和心情生成朋友圈文案，工作生活节日全覆盖。</p>
          <div class="card-usage">免费次数：<span class="free"><span class="free-count">10</span> 次</span></div>
          <a href="/tools/moments" class="btn btn-primary btn-block">开始使用</a>
        </div>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 AI 写作助手. All rights reserved.</p>
    </div>
  </footer>
  <script src="/js/api.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`,

  "/pricing": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>价格 - AI 写作助手</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">AI 写作助手</a>
      <ul class="navbar-links">
        <li><a href="/">首页</a></li>
        <li><a href="/tools/weekly">工具</a></li>
        <li><a href="/pricing">价格</a></li>
      </ul>
      <div class="navbar-usage">
        <span class="usage-badge">剩余 10 次</span>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <div class="container">
      <section class="hero" style="padding-bottom:20px">
        <h1>选择适合你的方案</h1>
        <p>按需付费，灵活使用</p>
      </section>
      <div class="pricing-grid">
        <div class="pricing-card">
          <span class="badge popular">免费</span>
          <div class="plan-name">体验版</div>
          <div class="plan-price">免费</div>
          <div class="plan-desc">体验 AI 写作的魅力</div>
          <ul class="plan-features">
            <li>10 次免费生成</li>
            <li>所有工具可用</li>
            <li>基础文案生成</li>
          </ul>
          <a href="/tools/weekly" class="btn btn-primary btn-block">开始使用</a>
        </div>
        <div class="pricing-card featured">
          <span class="badge popular">按次</span>
          <div class="plan-name">按次付费</div>
          <div class="plan-price">1 <span class="unit">元/次</span></div>
          <div class="plan-desc">用多少付多少，灵活自由</div>
          <ul class="plan-features">
            <li>1 元/次，无上限</li>
            <li>所有工具可用</li>
            <li>优先生成速度</li>
            <li>微信支付</li>
          </ul>
          <div style="display:flex;gap:12px;justify-content:center;margin:16px 0">
            <div>
              <img src="data:image/jpeg;base64,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" alt="微信收款码" style="width:140px;height:140px;border-radius:8px">
              <p style="font-size:12px;color:var(--gray-400);margin-top:4px">微信支付</p>
            </div>
            <div>
              <img src="data:image/jpeg;base64,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" alt="支付宝收款码" style="width:140px;height:140px;border-radius:8px">
              <p style="font-size:12px;color:var(--gray-400);margin-top:4px">支付宝</p>
            </div>
          </div>
          <p style="font-size:13px;color:var(--gray-400)">扫码支付，即时到账</p>
        </div>
        <div class="pricing-card">
          <span class="badge coming">即将上线</span>
          <div class="plan-name">包月套餐</div>
          <div class="plan-price">19.9 <span class="unit">元/月</span></div>
          <div class="plan-desc">高频使用首选，超值优惠</div>
          <ul class="plan-features">
            <li>100 次/月生成额度</li>
            <li>所有工具可用</li>
            <li>优先生成速度</li>
            <li>专属客服支持</li>
          </ul>
          <button class="btn btn-secondary btn-block" disabled>即将上线</button>
        </div>
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 AI 写作助手. All rights reserved.</p>
    </div>
  </footer>
  <script src="/js/api.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`,

  "/tools/weekly": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>周报生成器 - AI 写作助手</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">AI 写作助手</a>
      <ul class="navbar-links">
        <li><a href="/">首页</a></li>
        <li><a href="/tools/weekly">工具</a></li>
        <li><a href="/pricing">价格</a></li>
      </ul>
      <div class="navbar-usage">
        <span class="usage-badge">剩余 10 次</span>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <div class="container">
      <div style="padding:24px 0 0">
        <h1 style="font-size:28px;font-weight:800;color:var(--gray-900)">周报生成器</h1>
        <p style="color:var(--gray-500);margin-top:4px">输入本周工作内容，一键生成专业周报</p>
      </div>
      <div class="tool-layout">
        <div class="tool-section">
          <h2>输入信息</h2>
          <div class="form-group">
            <label for="content">本周完成的工作内容</label>
            <textarea id="content" data-param="content" placeholder="本周完成的工作内容...例如：完成了用户管理模块的开发"></textarea>
          </div>
          <div class="form-group">
            <label for="highlights">本周亮点</label>
            <input id="highlights" data-param="highlights" placeholder="例如：性能优化提升 30%">
          </div>
          <div class="form-group">
            <label for="nextPlan">下周计划</label>
            <input id="nextPlan" data-param="nextPlan" placeholder="例如：开始订单系统的开发">
          </div>
          <button id="generateBtn" class="btn btn-primary btn-block btn-lg" data-type="weekly">生成</button>
        </div>
        <div class="tool-section">
          <div class="output-header">
            <h2>生成结果</h2>
            <button id="copyBtn" class="copy-btn">复制文案</button>
          </div>
          <div id="outputArea" class="output-area"></div>
          <p style="font-size:13px;color:var(--gray-400)">每次生成消耗 1 次免费次数</p>
        </div>
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 AI 写作助手. All rights reserved.</p>
    </div>
  </footer>
  <script src="/js/api.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`,

  "/tools/xiaohongshu": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>小红书文案生成器 - AI 写作助手</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">AI 写作助手</a>
      <ul class="navbar-links">
        <li><a href="/">首页</a></li>
        <li><a href="/tools/weekly">工具</a></li>
        <li><a href="/pricing">价格</a></li>
      </ul>
      <div class="navbar-usage">
        <span class="usage-badge">剩余 10 次</span>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <div class="container">
      <div style="padding:24px 0 0">
        <h1 style="font-size:28px;font-weight:800;color:var(--gray-900)">小红书文案生成器</h1>
        <p style="color:var(--gray-500);margin-top:4px">智能生成小红书爆款文案，标题吸睛、正文动人</p>
      </div>
      <div class="tool-layout">
        <div class="tool-section">
          <h2>输入信息</h2>
          <div class="form-group">
            <label for="topic">主题</label>
            <input id="topic" data-param="topic" placeholder="例如：一款好用的笔记软件推荐">
          </div>
          <div class="form-group">
            <label for="audience">目标受众</label>
            <select id="audience" data-param="audience">
              <option value="通用">通用</option>
              <option value="学生党">学生党</option>
              <option value="上班族">上班族</option>
              <option value="宝妈">宝妈</option>
              <option value="健身爱好者">健身爱好者</option>
              <option value="美妆爱好者">美妆爱好者</option>
            </select>
          </div>
          <div class="form-group">
            <label for="tone">语气风格</label>
            <select id="tone" data-param="tone">
              <option value="活泼">活泼</option>
              <option value="正式">正式</option>
              <option value="专业">专业</option>
              <option value="幽默">幽默</option>
              <option value="温暖">温暖</option>
            </select>
          </div>
          <button id="generateBtn" class="btn btn-primary btn-block btn-lg" data-type="xiaohongshu">生成</button>
        </div>
        <div class="tool-section">
          <div class="output-header">
            <h2>生成结果</h2>
            <button id="copyBtn" class="copy-btn">复制文案</button>
          </div>
          <div id="outputArea" class="output-area"></div>
          <p style="font-size:13px;color:var(--gray-400)">每次生成消耗 1 次免费次数</p>
        </div>
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 AI 写作助手. All rights reserved.</p>
    </div>
  </footer>
  <script src="/js/api.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`,

  "/tools/moments": `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>朋友圈文案生成器 - AI 写作助手</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="navbar-inner">
      <a href="/" class="navbar-logo">AI 写作助手</a>
      <ul class="navbar-links">
        <li><a href="/">首页</a></li>
        <li><a href="/tools/weekly">工具</a></li>
        <li><a href="/pricing">价格</a></li>
      </ul>
      <div class="navbar-usage">
        <span class="usage-badge">剩余 10 次</span>
      </div>
    </div>
  </nav>
  <main class="main-content">
    <div class="container">
      <div style="padding:24px 0 0">
        <h1 style="font-size:28px;font-weight:800;color:var(--gray-900)">朋友圈文案生成器</h1>
        <p style="color:var(--gray-500);margin-top:4px">根据场景和心情生成朋友圈文案</p>
      </div>
      <div class="tool-layout">
        <div class="tool-section">
          <h2>输入信息</h2>
          <div class="form-group">
            <label for="content">想表达的内容</label>
            <textarea id="content" data-param="content" placeholder="描述你想表达的内容或心情..."></textarea>
          </div>
          <div class="form-group">
            <label for="scene">场景选择</label>
            <select id="scene" data-param="scene">
              <option value="work">工作</option>
              <option value="life">生活</option>
              <option value="holiday">节日</option>
              <option value="other">其他</option>
            </select>
          </div>
          <button id="generateBtn" class="btn btn-primary btn-block btn-lg" data-type="moments">生成</button>
        </div>
        <div class="tool-section">
          <div class="output-header">
            <h2>生成结果</h2>
            <button id="copyBtn" class="copy-btn">复制文案</button>
          </div>
          <div id="outputArea" class="output-area"></div>
          <p style="font-size:13px;color:var(--gray-400)">每次生成消耗 1 次免费次数</p>
        </div>
      </div>
    </div>
  </main>
  <footer class="footer">
    <div class="container">
      <p>&copy; 2026 AI 写作助手. All rights reserved.</p>
    </div>
  </footer>
  <script src="/js/api.js"></script>
  <script src="/js/app.js"></script>
</body>
</html>`,

  "/css/style.css": `:root{--primary:#4F46E5;--primary-hover:#4338CA;--primary-light:#EEF2FF;--secondary:#10B981;--secondary-hover:#059669;--gray-50:#F9FAFB;--gray-100:#F3F4F6;--gray-200:#E5E7EB;--gray-300:#D1D5DB;--gray-400:#9CA3AF;--gray-500:#6B7280;--gray-600:#4B5563;--gray-700:#374151;--gray-800:#1F2937;--gray-900:#111827;--white:#FFFFFF;--shadow-sm:0 1px 2px rgba(0,0,0,0.05);--shadow-md:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);--shadow-lg:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -2px rgba(0,0,0,0.05);--radius-sm:6px;--radius-md:8px;--radius-lg:12px;--radius-xl:16px;--font-sans:-apple-system,BlinkMacSystemFont,"Microsoft YaHei","PingFang SC","Noto Sans SC",sans-serif}*{margin:0;padding:0;box-sizing:border-box}body{font-family:var(--font-sans);background:var(--gray-50);color:var(--gray-800);line-height:1.6;min-height:100vh;display:flex;flex-direction:column}.navbar{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(255,255,255,0.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--gray-200);height:64px}.navbar-inner{max-width:1200px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between}.navbar-logo{font-size:20px;font-weight:700;color:var(--primary);text-decoration:none;display:flex;align-items:center;gap:8px}.navbar-links{display:flex;align-items:center;gap:32px;list-style:none}.navbar-links a{text-decoration:none;color:var(--gray-600);font-size:15px;font-weight:500;transition:color .2s;padding:4px 0;position:relative}.navbar-links a:hover{color:var(--gray-900)}.navbar-links a.active{color:var(--primary)}.navbar-links a.active::after{content:"";position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--primary);border-radius:1px}.navbar-usage{display:flex;align-items:center;gap:12px}.usage-badge{font-size:13px;background:var(--primary-light);color:var(--primary);padding:4px 12px;border-radius:20px;font-weight:600}.main-content{flex:1;padding-top:64px}.container{max-width:1200px;margin:0 auto;padding:0 24px}.hero{padding:80px 0 60px;text-align:center}.hero h1{font-size:48px;font-weight:800;color:var(--gray-900);letter-spacing:-1.5px;margin-bottom:16px;line-height:1.2}.hero p{font-size:20px;color:var(--gray-500);max-width:500px;margin:0 auto 32px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 24px;border-radius:var(--radius-md);font-size:15px;font-weight:600;cursor:pointer;transition:all .2s;border:none;text-decoration:none;font-family:inherit}.btn-primary{background:var(--primary);color:var(--white)}.btn-primary:hover{background:var(--primary-hover);transform:translateY(-1px);box-shadow:var(--shadow-md)}.btn-secondary{background:var(--gray-100);color:var(--gray-700)}.btn-secondary:hover{background:var(--gray-200)}.btn-lg{padding:16px 32px;font-size:17px}.btn-block{width:100%}.btn:disabled{opacity:.5;cursor:not-allowed;transform:none!important}.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;padding:20px 0 80px}.card{background:var(--white);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-200);transition:all .25s;position:relative}.card:hover{box-shadow:var(--shadow-lg);transform:translateY(-4px);border-color:var(--primary)}.card-icon{width:48px;height:48px;border-radius:var(--radius-md);background:var(--primary-light);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:16px}.card h3{font-size:20px;font-weight:700;color:var(--gray-900);margin-bottom:8px}.card p{color:var(--gray-500);font-size:15px;margin-bottom:16px;line-height:1.5}.card-usage{font-size:13px;color:var(--gray-400);margin-bottom:20px}.card-usage .free{color:var(--secondary);font-weight:600}.tool-layout{display:grid;grid-template-columns:1fr 1fr;gap:32px;padding:40px 0 80px}.tool-section{background:var(--white);border-radius:var(--radius-lg);padding:32px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-200)}.tool-section h2{font-size:20px;font-weight:700;color:var(--gray-900);margin-bottom:24px}.form-group{margin-bottom:20px}.form-group label{display:block;font-size:14px;font-weight:600;color:var(--gray-700);margin-bottom:6px}.form-group textarea,.form-group input,.form-group select{width:100%;padding:10px 14px;border:1px solid var(--gray-300);border-radius:var(--radius-md);font-size:15px;font-family:inherit;color:var(--gray-800);background:var(--white);transition:border-color .2s,box-shadow .2s;outline:none}.form-group textarea:focus,.form-group input:focus,.form-group select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(79,70,229,0.1)}.form-group textarea{min-height:140px;resize:vertical}.output-area{min-height:200px;background:var(--gray-50);border-radius:var(--radius-md);padding:20px;white-space:pre-wrap;line-height:1.7;font-size:15px;color:var(--gray-800);border:1px solid var(--gray-200);margin-bottom:16px}.output-area:empty::before{content:"生成的文案将显示在这里";color:var(--gray-400)}.output-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}.copy-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:var(--radius-sm);font-size:14px;font-weight:500;color:var(--gray-600);background:var(--gray-100);border:1px solid var(--gray-200);cursor:pointer;transition:all .2s;font-family:inherit}.copy-btn:hover{background:var(--gray-200)}.copy-btn.copied{background:#D1FAE5;color:var(--secondary);border-color:var(--secondary)}.pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;padding:40px 0 80px}.pricing-card{background:var(--white);border-radius:var(--radius-xl);padding:40px 32px;box-shadow:var(--shadow-sm);border:1px solid var(--gray-200);text-align:center;transition:all .25s;position:relative}.pricing-card:hover{box-shadow:var(--shadow-lg);transform:translateY(-4px)}.pricing-card.featured{border-color:var(--primary);box-shadow:0 0 0 1px var(--primary),var(--shadow-md)}.pricing-card .badge{display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:4px 12px;border-radius:20px;margin-bottom:16px}.pricing-card .badge.popular{background:var(--primary-light);color:var(--primary)}.pricing-card .badge.coming{background:var(--gray-100);color:var(--gray-500)}.pricing-card .plan-name{font-size:18px;font-weight:700;color:var(--gray-900);margin-bottom:8px}.pricing-card .plan-price{font-size:42px;font-weight:800;color:var(--gray-900);margin-bottom:4px}.pricing-card .plan-price .unit{font-size:16px;font-weight:500;color:var(--gray-500)}.pricing-card .plan-desc{font-size:15px;color:var(--gray-500);margin-bottom:24px}.pricing-card .plan-features{list-style:none;margin-bottom:28px}.pricing-card .plan-features li{padding:8px 0;font-size:15px;color:var(--gray-700);border-bottom:1px solid var(--gray-100)}.pricing-card .plan-features li:last-child{border-bottom:none}.qr-placeholder{width:160px;height:160px;margin:16px auto;background:var(--gray-100);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--gray-400);border:2px dashed var(--gray-300);overflow:hidden}.qr-placeholder img{width:100%;height:100%;object-fit:cover}.footer{background:var(--white);border-top:1px solid var(--gray-200);padding:24px 0;text-align:center;color:var(--gray-400);font-size:14px}@media(max-width:768px){.hero h1{font-size:32px}.hero p{font-size:17px}.tool-layout{grid-template-columns:1fr}.navbar-inner{padding:0 16px}.navbar-links{gap:16px}.navbar-links a{font-size:14px}.card-grid,.pricing-grid{grid-template-columns:1fr}.container{padding:0 16px}.tool-section{padding:20px}}`,

  "/js/api.js": `const API_CONFIG={baseUrl:"/api/generate",timeout:30000};const MOCK_RESPONSES={weekly:(p)=>{return"【本周工作汇报】\\n\\n一、本周完成工作\\n"+(p.content||"未提供")+"\\n\\n二、本周工作亮点\\n"+(p.highlights||"暂无")+"\\n\\n三、下周工作计划\\n"+(p.nextPlan||"暂无")+"\\n\\n四、总结\\n各项工作按计划推进。"},xiaohongshu:(p)=>{const t=p.topic||"默认主题";const titles=["家人们谁懂啊！"+t+"真的绝了🔥",""+t+"｜我不允许还有人不知道这个✨","救命！"+t+"也太好用了吧😭","抄作业！"+t+"保姆级攻略来了📖","后悔没早知道的"+t+"，建议收藏⭐"];return"📌 标题："+titles[Math.floor(Math.random()*titles.length)]+"\\n\\n📝 正文：\\n姐妹们！今天一定要跟大家分享一下"+t+"的宝藏用法✨\\n\\n真的真的强烈推荐！谁用谁知道！😎\\n\\n#"+t.replace(/\\s+/g,"")+" #好物分享 #宝藏推荐"},moments:(p)=>{const c=p.content||"今天的心情";return c+"\\n\\n生活明朗，万物可爱 ✨\\n#日常生活 #小确幸\\n\\n📷 配图建议：生活照片 / 风景照 / 美食图"}};async function generateContent(type,params){try{const c=new AbortController;const t=setTimeout(()=>c.abort(),API_CONFIG.timeout);const r=await fetch(API_CONFIG.baseUrl,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,params}),signal:c.signal});clearTimeout(t);if(!r.ok)throw new Error("HTTP "+r.status);const d=await r.json();return d.content||d}catch(e){console.warn("API call failed, using mock: "+e.message);const f=MOCK_RESPONSES[type];if(!f)throw new Error("Unknown type: "+type);await new Promise(r=>setTimeout(r,800+Math.random()*600));return f(params)}}`,

  "/js/app.js": `const USAGE_KEY="free_usage_remaining";const DEFAULT_FREE_TRIALS=10;function getUsageRemaining(){const v=localStorage.getItem(USAGE_KEY);if(v===null){localStorage.setItem(USAGE_KEY,DEFAULT_FREE_TRIALS);return DEFAULT_FREE_TRIALS}return parseInt(v,10)||0}function decrementUsage(){const c=getUsageRemaining();const n=Math.max(0,c-1);localStorage.setItem(USAGE_KEY,n);updateUsageUI();return n}function updateUsageUI(){const r=getUsageRemaining();document.querySelectorAll(".usage-badge").forEach(el=>{el.textContent="剩余 "+r+" 次"});document.querySelectorAll(".free-count").forEach(el=>{el.textContent=r});if(r<=0){document.querySelectorAll(".btn-generate").forEach(btn=>{btn.disabled=true;btn.title="免费次数已用完，请前往价格页购买"})}}function initNavbar(){const p=window.location.pathname;document.querySelectorAll(".navbar-links a").forEach(a=>{const h=a.getAttribute("href");if(!h)return;if(p===h||p.endsWith(h)||(h==="/"&&(p==="/"||p==="/index.html")))a.classList.add("active")})}function initToolPage(){const btn=document.getElementById("generateBtn");const out=document.getElementById("outputArea");const copy=document.getElementById("copyBtn");if(!btn||!out)return;btn.addEventListener("click",async()=>{if(getUsageRemaining()<=0){alert("免费次数已用完，请前往价格页购买");window.location.href="/pricing";return}btn.disabled=true;btn.textContent="生成中...";try{const params={};document.querySelectorAll("[data-param]").forEach(el=>{params[el.dataset.param]=el.value});const content=await generateContent(btn.dataset.type||"weekly",params);out.textContent=content;out.dataset.content=content;decrementUsage();if(copy){copy.classList.remove("copied");copy.textContent="复制文案"}}catch(err){out.textContent="生成失败："+err.message}finally{btn.disabled=false;btn.textContent="生成"}});if(copy){copy.addEventListener("click",()=>{const c=out.dataset.content||out.textContent;if(!c||c==="生成的文案将显示在这里"){alert("暂无内容可复制");return}navigator.clipboard.writeText(c).then(()=>{copy.classList.add("copied");copy.textContent="已复制";setTimeout(()=>{copy.classList.remove("copied");copy.textContent="复制文案"},2000)}).catch(()=>{const ta=document.createElement("textarea");ta.value=c;document.body.appendChild(ta);ta.select();document.execCommand("copy");document.body.removeChild(ta);copy.classList.add("copied");copy.textContent="已复制";setTimeout(()=>{copy.classList.remove("copied");copy.textContent="复制文案"},2000)})})}}document.addEventListener("DOMContentLoaded",()=>{initNavbar();updateUsageUI();initToolPage()})`,
};
