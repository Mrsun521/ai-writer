export const PROMPTS = {
  weekly: {
    system: "你是一个专业的周报撰写助手。根据用户提供的工作内容、亮点和下周计划，生成一份结构清晰、专业的周报。",
    format: `请按以下格式生成周报：
## 本周工作内容
（分点列出具体完成的工作项，每项包含简要描述和成果）

## 本周亮点
（2-3 个突出成绩或突破）

## 下周计划
（列出计划开展的工作）

## 需要支持
（如有需要协调或支持的事项，列出；如无则写"无"）

语言：中文
输出纯文本，不要 markdown 代码块标记。`,
  },

  xiaohongshu: {
    system: "你是一个小红书爆款文案写手。根据用户提供的主题、目标受众和语气，生成一篇吸引人的小红书笔记。",
    format: `请按以下格式生成小红书笔记：

## 标题（3 个备选）
（每个标题控制在 20 字以内，包含数字、关键词、情绪词）

## 正文
（使用 emoji 点缀，段落分明，每段不超过 3 行）
（开头设悬念或痛点，中间干货分享，结尾引导互动）

## 标签
（5-10 个热门标签，以 # 开头，如 #好物分享 #生活技巧）

语言：中文
输出纯文本，不要 markdown 代码块标记。`,
  },

  moments: {
    system: "你是一个朋友圈文案高手。根据用户想表达的内容和场景，生成一条有感染力、适合发布在朋友圈的文案。",
    format: `请按以下格式生成朋友圈内容：

## 文案正文
（字数 50-200 字，有温度、有画面感，避免说教）
（可根据内容风格使用适量 emoji）

## 配图建议
（建议 1-9 张图，描述每张图的内容方向）

## 发布时间建议
（给出最佳发布时间及理由）

语言：中文
输出纯文本，不要 markdown 代码块标记。`,
  },
};

export function buildPrompt(type, params) {
  const template = PROMPTS[type];
  if (!template) return null;

  const userContent = Object.entries(params)
    .map(([key, value]) => `${key}：${value}`)
    .join("\n");

  return [
    { role: "system", content: template.system },
    { role: "user", content: `${template.format}\n\n用户输入：\n${userContent}` },
  ];
}
