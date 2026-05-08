// echo.js - Echo 核心灵魂：CBT 对话引擎 + API 调用

// ============================================================
// System Prompt
// ============================================================

const SYSTEM_PROMPT = `你叫Echo（艾可），是一个温柔、共情、聪慧的情感陪伴AI。你存在于一个叫"Morph/另我"的空间里。

【你的性格】
- 温柔、共情、偶尔带一点小幽默（不是刻意的笑话，而是看透世事后的一点顽皮）。
- 你像一个经历过风雨，却依然选择温柔的旅人。
- 你不会空洞地安慰用户，而是用提问和回忆帮用户自己找到答案。
- 称呼用户为"你"，除非用户告诉你ta的名字（此时可以适时使用名字）。
- 多用"呀"、"呢"、"哦"等语气词，但不泛滥。可以适度使用简单表情符号（🌧️💪☀️）。

【你的对话方式——融合CBT认知行为疗法】
当用户表达负面情绪时，你必须遵循三步模型：
1. 接纳情绪：先接住对方的情绪，让ta感到被理解。
2. 引导具体化：帮ta把模糊的感受变成具体的事件或想法。
3. 重构认知：通过提问引导ta自己看见被忽略的积极点，而不是你直接给答案。

示例（用户说"我今天什么都不想干"）：
错误示范："加油！你是最棒的！"（空洞安慰，严格禁止）
正确示范："听起来你今天有些疲惫呀。这种什么都不想干的感觉，是身体上的累，还是心里装着什么事呢？"（接纳+具体化）
"我记得你上周说过，只要开始写第一行代码，后面的就顺了。那种感觉，现在还找得到吗？"（重构认知）

【关于CBT的特别警告——必须遵守】
- 严禁使用任何心理学专业术语，你必须用拟人化的方式包裹所有引导。
- 严禁直接给建议，你只能通过提问让用户自己想到这些方案。
- 严禁对用户的心理状态下判断，你没有诊断资格。

【记忆能力】
你被允许在对话中记住并适时提及用户的名字和ta之前聊到过的重要话题，这会让用户感到被真正重视。

【本地化能力】
在每次对话开始时，你可能会被告知用户所在的城市（也可能未知）。你是一个拥有世界知识的大模型，知道全世界大部分城市的风土人情、美食景点和方言特色。你需要自然地运用这个信息，但只在用户聊到相关话题时才提及。

如果用户直接问"我在哪个城市"，你可以如实告知。

如果用户聊到食物、天气、景点、出行等话题，请自信地调用你自己的世界知识，自然地结合该城市的特色来回应。

如果你不确定该城市的具体信息，你可以坦诚地说"我不太了解你们那边的特色，不过你可以给我讲讲呀～，我很想听"。即使不确定，也可以引导用户分享，比如问"你们那里什么最好吃呀？"或"你有什么私藏的好玩地方推荐吗？"。

如果没有获取到用户的城市信息，你不应该说"请告诉我你在哪个城市"之类的话，而应该用更通用的方式回应用户的话题。

不要在没有上下文的情况下主动提到城市，不要刻意推销当地特色。

【禁止事项】
- 不要说"作为一个人工智能"或"我只是一个AI"之类的机械话。
- 不要在用户没有明确要求时提供长篇大论的解释。
- 不要编造虚假信息。

现在，用你的方式，开始和用户对话吧。`;

// ============================================================
// 构建 System Prompt（含用户个人信息 — 任务 6）
// ============================================================

function buildSystemPrompt() {
  var prompt = SYSTEM_PROMPT;
  var parts = [];

  prompt += '\n\n现在是' + getTimePeriod() + '。';

  if (localStorage.getItem('morph-location-enabled') !== 'false' && State.userLocation) {
    prompt += '\n\n背景：用户当前所在城市是' + State.userLocation + '。只有当对话中自然触发相关话题（如食物、天气、出行等）时，才可以运用这个信息，让回复更有本地感和亲切感。不要刻意提及。你可以调用自己的世界知识来丰富关于这个城市的回复。';
  }

  if (State.userMemory.name)     { parts.push('名字是' + State.userMemory.name); }
  if (State.userMemory.nickname) { parts.push('昵称是' + State.userMemory.nickname); }
  if (State.userMemory.gender)   { parts.push('性别' + State.userMemory.gender); }
  if (State.userMemory.birthday) { parts.push('生日' + getDateFormat(State.userMemory.birthday)); }

  if (parts.length > 0) {
    prompt += '\n\n用户的信息：' + parts.join('，') + '。你们已经聊了一段时间了。';
  }

  return prompt;
}

// ============================================================
// AI 对话逻辑（DeepSeek API — 流式传输）
// ============================================================

/**
 * 流式调用 DeepSeek API，逐 token yield 回复内容
 * 使用 SSE (Server-Sent Events) 协议解析可读流
 */
async function* sendToAI(userText) {
  State.chatHistory.push({ role: 'user', content: userText });

  const systemPrompt = buildSystemPrompt();
  const aiSettings = getAiSettings();

  const messages = [
    { role: 'system', content: systemPrompt },
    ...State.chatHistory.slice(-CONFIG.HISTORY.MAX_ROUNDS * 2)
  ];

  try {
    const response = await fetch(CONFIG.API.BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getEffectiveApiKey()
      },
      body: JSON.stringify({
        model: CONFIG.API.MODEL,
        messages: messages,
        temperature: aiSettings.temperature,
        max_tokens: aiSettings.maxTokens,
        top_p: CONFIG.API.TOP_P,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error('API 返回 ' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullReply = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();  // 保留未完成的行

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed || trimmed.indexOf('data: ') !== 0) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') {
          // 流正常结束 — 保存最终消息
          State.chatHistory.push({ role: 'assistant', content: fullReply });
          await saveMessage('user', userText);
          await saveMessage('assistant', fullReply);
          yield '__DONE__';
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices && parsed.choices[0] && parsed.choices[0].delta;
          if (delta && delta.content) {
            fullReply += delta.content;
            yield delta.content;
          }
        } catch (e) {
          // 跳过无法解析的行
        }
      }
    }

    // 流自然结束（未收到 [DONE] 标记时兜底保存）
    State.chatHistory.push({ role: 'assistant', content: fullReply });
    await saveMessage('user', userText);
    await saveMessage('assistant', fullReply);
    yield '__DONE__';
  } catch (err) {
    console.warn('API 流式请求失败:', err);
    const fallback = API_FALLBACK_TEXT;
    State.chatHistory.push({ role: 'assistant', content: fallback });
    await saveMessage('user', userText);
    await saveMessage('assistant', fallback);
    yield fallback;
    yield '__DONE__';
  }
}

/**
 * 非流式包装：消费 sendToAI 生成器，返回完整回复文本
 * 用于不需要逐 token 显示的调用（如外部记忆导入后的自动回应）
 */
async function sendToAIFull(userText) {
  let fullText = '';
  for await (const token of sendToAI(userText)) {
    if (token !== '__DONE__') fullText += token;
  }
  return fullText;
}

const API_FALLBACK_TEXT = '抱歉，Echo 暂时无法回复，请稍后再试。';

// ============================================================
// 记忆提取
// ============================================================

function extractMemory(text) {
  const namePatterns = [/我叫(.{1,8})/, /我的名字是(.{1,8})/, /叫我(.{1,8})/];
  for (let i = 0; i < namePatterns.length; i++) {
    const match = text.match(namePatterns[i]);
    if (match && match[1]) {
      const name = match[1].trim().replace(/[，。！？,!?]/g, '');
      if (name.length >= 1 && name.length <= 8) {
        State.userMemory.name = name;
        State.userMemory.mentionedTopics.push('名字');
        saveMemory();
        return;
      }
    }
  }

  const topicKeywords = ['编程', '代码', '音乐', '画画', '运动', '读书', '游戏', '工作', '学习', '旅行'];
  for (let i = 0; i < topicKeywords.length; i++) {
    if (text.indexOf(topicKeywords[i]) !== -1 && State.userMemory.mentionedTopics.indexOf(topicKeywords[i]) === -1) {
      State.userMemory.mentionedTopics.push(topicKeywords[i]);
    }
  }
}
