# AI 写作助手

周报生成器 / 小红书文案 / 朋友圈文案 — 一键生成，微信支付收款。

## 技术栈

- **前端**: 纯静态 HTML + CSS + JS（GitHub Pages 托管）
- **后端 API**: Cloudflare Workers
- **AI 模型**: DeepSeek API（免费无限）
- **成本**: 零元

## 本地开发

```bash
# 前端直接在浏览器打开 index.html 即可
# mock 模式下无需后端，数据在浏览器本地生成
```

## 部署

### 1. 部署后端（Cloudflare Workers）

```bash
# 安装依赖
npm install

# 配置 DeepSeek API Key
npx wrangler secret put DEEPSEEK_API_KEY
# 输入你的 DeepSeek API Key

# 部署
npx wrangler deploy
```

部署完成后会得到一个 URL（如 `https://ai-writer-api.xxx.workers.dev`），记下来。

### 2. 部署前端（GitHub Pages）

```bash
# 1. 在 GitHub 创建新仓库
# 2. 推送代码
git remote add origin https://github.com/你的用户名/ai-writer.git
git push -u origin master

# 3. 在 GitHub 仓库 Settings → Pages 中
#    选择 main 分支，/ (root) 目录，点 Save
```

### 3. 连接前后端

部署 Worker 后，修改 `js/api.js` 中的 `API_CONFIG.baseUrl` 为你的 Worker URL。

或者 Worker 配置路由规则，让 `/api/*` 路径映射到 Worker。

## 支付接入

目前使用微信收款码手动确认：
1. 用户扫码付款
2. 你在微信收到到账通知
3. 手动在后台给用户增加使用次数

后期可接入度小满 ClawPay 实现自动化。

## 项目结构

```
ai-writer/
├── index.html          # 首页
├── pricing.html        # 价格页
├── tools/
│   ├── weekly.html     # 周报生成器
│   ├── xiaohongshu.html # 小红书文案
│   └── moments.html    # 朋友圈文案
├── css/
│   └── style.css       # 全局样式
├── js/
│   ├── api.js          # API 封装（mock + 真实 API 双模）
│   └── app.js          # 通用业务逻辑
└── worker/
    ├── index.js        # Worker 入口（3 个 API 路由）
    ├── prompts.js      # AI 提示词模板
    ├── usage.js        # 使用次数管理（KV + 内存兜底）
    ├── config.js       # 配置
    └── wrangler.toml   # Workers 部署配置
```
