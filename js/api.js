const API_CONFIG = {
  baseUrl: '/api/generate',
  timeout: 30000,
};

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
    const tone = params.tone || '活泼';
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

async function generateContent(type, params) {
  // Try real API first, fallback to mock
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(API_CONFIG.baseUrl, {
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
    // Fallback to mock
    const mockFn = MOCK_RESPONSES[type];
    if (!mockFn) throw new Error(`Unknown content type: ${type}`);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    return mockFn(params);
  }
}
