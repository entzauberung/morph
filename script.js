// ============================================================
// Morph / 另我 — Echo 对话灵魂
// V1.0：发布冲刺 · 完整 UI 激活
// ============================================================

// ============================================================
// 记忆系统 & 对话历史
// ============================================================

const userMemory = {
  name: null,
  nickname: null,
  gender: '',
  birthday: '',
  mentionedTopics: []
};

const chatHistory = [];

// ============================================================
// IndexedDB 持久化（Dexie.js）
// ============================================================

const db = new Dexie('MorphDatabase');
db.version(1).stores({
  messages: '++id, role, content, timestamp',
  userInfo: 'key'
});

async function loadChatHistory() {
  try {
    const allMessages = await db.messages.orderBy('id').toArray();
    allMessages.forEach(function (msg) {
      chatHistory.push({ role: msg.role, content: msg.content });
    });
  } catch (e) {
    console.warn('IndexedDB 读取失败，以空历史启动:', e);
  }
}

async function loadUserMemory() {
  try {
    const saved = await db.userInfo.get('memory');
    if (saved) {
      userMemory.name = saved.name || null;
      userMemory.nickname = saved.nickname || null;
      userMemory.gender = saved.gender || '';
      userMemory.birthday = saved.birthday || '';
      userMemory.mentionedTopics = saved.mentionedTopics || [];
    }
  } catch (e) {
    console.warn('IndexedDB 读取记忆失败:', e);
  }
}

async function saveMemory() {
  try {
    await db.userInfo.put({
      key: 'memory',
      name: userMemory.name,
      nickname: userMemory.nickname,
      gender: userMemory.gender,
      birthday: userMemory.birthday,
      mentionedTopics: userMemory.mentionedTopics
    });
  } catch (e) {
    console.warn('IndexedDB 保存记忆失败:', e);
  }
}

async function saveMessage(role, content) {
  try {
    await db.messages.put({ role: role, content: content, timestamp: Date.now() });

    const count = await db.messages.count();
    const limit = CONFIG.HISTORY.MAX_PERSIST;
    if (count > limit) {
      const toDelete = await db.messages.orderBy('id').limit(Math.floor(limit / 2)).keys();
      await db.messages.bulkDelete(toDelete);
    }
  } catch (e) {
    console.warn('IndexedDB 写入失败:', e);
  }
}

function renderHistoryMessages() {
  for (let i = 0; i < chatHistory.length; i++) {
    const msg = chatHistory[i];
    addMessage(msg.content, msg.role === 'user' ? 'user' : 'echo');
  }
}

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
// 工具函数
// ============================================================

function getCurrentTime() {
  const now = new Date();
  return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

function getTimePeriod() {
  var hour = new Date().getHours();
  if (hour >= 5 && hour < 8)  return '清晨';
  if (hour >= 8 && hour < 12) return '上午';
  if (hour >= 12 && hour < 14) return '中午';
  if (hour >= 14 && hour < 18) return '下午';
  if (hour >= 18 && hour < 22) return '晚上';
  return '深夜';
}

// Location state (not persisted — fetched fresh each session)
var userLocation = null;
var locationRequested = false;

function requestLocation() {
  if (locationRequested) return;
  locationRequested = true;

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(
    function (position) {
      var lat = position.coords.latitude;
      var lon = position.coords.longitude;
      var url = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json&accept-language=zh';

      fetch(url)
        .then(function (res) { return res.ok ? res.json() : Promise.reject(); })
        .then(function (data) {
          if (data && data.address) {
            var addr = data.address;
            var city = addr.city || addr.town || addr.county || addr.state || addr.country || '';
            if (city) {
              userLocation = city;

              // 首次定位到该城市时发送自然欢迎语
              var greetedCity = localStorage.getItem('morph-location-greeted');
              if (greetedCity !== city) {
                var greetings = [
                  '原来你在' + city + '呀～ 我听说那边的美食很有名，是不是真的？',
                  city + '呀，那边的天气最近怎么样？',
                  '我还没去过' + city + '呢，你有什么推荐的地方吗？'
                ];
                var greeting = greetings[Math.floor(Math.random() * greetings.length)];

                addMessage(greeting, 'echo');
                chatHistory.push({ role: 'assistant', content: greeting });
                saveMessage('assistant', greeting);
                localStorage.setItem('morph-location-greeted', city);
              }
            }
          }
        })
        .catch(function () { /* silent */ });
    },
    function () { /* user denied — silent */ },
    { timeout: 5000, maximumAge: 3600000 }
  );
}

function getEffectiveApiKey() {
  const key = localStorage.getItem('morph-api-key');
  return key || CONFIG.API.API_KEY;
}

function getAiSettings() {
  const temp = parseFloat(localStorage.getItem('morph-temperature')) || CONFIG.API.TEMPERATURE;
  const maxTokens = parseInt(localStorage.getItem('morph-max-tokens'), 10) || CONFIG.API.MAX_TOKENS;
  return { temperature: temp, maxTokens: maxTokens };
}

function getDateFormat(yyyymmdd) {
  if (!yyyymmdd) return '';
  const parts = yyyymmdd.split('-');
  if (parts.length !== 3) return yyyymmdd;
  return parts[0] + '年' + parts[1] + '月' + parts[2] + '日';
}

function showToast(text, duration) {
  duration = duration || 1800;
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(function () { toast.classList.remove('show'); }, duration);
}

// ============================================================
// 核心：addMessage
// ============================================================

function addMessage(messageText, sender, timestampFirst) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message ' + sender;

  const timeEl = document.createElement('div');
  timeEl.className = 'message-time';
  timeEl.textContent = getCurrentTime();

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bubble ' + sender;
  bubbleEl.textContent = messageText;

  if (timestampFirst) {
    messageWrapper.appendChild(timeEl);
    messageWrapper.appendChild(bubbleEl);
  } else {
    messageWrapper.appendChild(bubbleEl);
    messageWrapper.appendChild(timeEl);
  }

  chatMessages.appendChild(messageWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageWrapper;
}

// ============================================================
// 打字指示器
// ============================================================

function createTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message echo typing-indicator';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bubble echo typing-bubble';

  const dots = document.createElement('span');
  dots.className = 'typing-dots';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    dots.appendChild(dot);
  }

  bubbleEl.appendChild(dots);
  messageWrapper.appendChild(bubbleEl);
  chatMessages.appendChild(messageWrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  return messageWrapper;
}

function removeTypingIndicator(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

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
        userMemory.name = name;
        userMemory.mentionedTopics.push('名字');
        saveMemory();
        return;
      }
    }
  }

  const topicKeywords = ['编程', '代码', '音乐', '画画', '运动', '读书', '游戏', '工作', '学习', '旅行'];
  for (let i = 0; i < topicKeywords.length; i++) {
    if (text.indexOf(topicKeywords[i]) !== -1 && userMemory.mentionedTopics.indexOf(topicKeywords[i]) === -1) {
      userMemory.mentionedTopics.push(topicKeywords[i]);
    }
  }
}

// ============================================================
// 构建 System Prompt（含用户个人信息 — 任务 6）
// ============================================================

function buildSystemPrompt() {
  var prompt = SYSTEM_PROMPT;
  var parts = [];

  prompt += '\n\n现在是' + getTimePeriod() + '。';

  if (localStorage.getItem('morph-location-enabled') !== 'false' && userLocation) {
    prompt += '\n\n背景：用户当前所在城市是' + userLocation + '。只有当对话中自然触发相关话题（如食物、天气、出行等）时，才可以运用这个信息，让回复更有本地感和亲切感。不要刻意提及。你可以调用自己的世界知识来丰富关于这个城市的回复。';
  }

  if (userMemory.name)     { parts.push('名字是' + userMemory.name); }
  if (userMemory.nickname) { parts.push('昵称是' + userMemory.nickname); }
  if (userMemory.gender)   { parts.push('性别' + userMemory.gender); }
  if (userMemory.birthday) { parts.push('生日' + getDateFormat(userMemory.birthday)); }

  if (parts.length > 0) {
    prompt += '\n\n用户的信息：' + parts.join('，') + '。你们已经聊了一段时间了。';
  }

  return prompt;
}

// ============================================================
// AI 对话逻辑（DeepSeek API — 流式传输）
// ============================================================

const API_FALLBACK_TEXT = '抱歉，Echo 暂时无法回复，请稍后再试。';

/**
 * 流式调用 DeepSeek API，逐 token yield 回复内容
 * 使用 SSE (Server-Sent Events) 协议解析可读流
 */
async function* sendToAI(userText) {
  chatHistory.push({ role: 'user', content: userText });

  const systemPrompt = buildSystemPrompt();
  const aiSettings = getAiSettings();

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-CONFIG.HISTORY.MAX_ROUNDS * 2)
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
          chatHistory.push({ role: 'assistant', content: fullReply });
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
    chatHistory.push({ role: 'assistant', content: fullReply });
    await saveMessage('user', userText);
    await saveMessage('assistant', fullReply);
    yield '__DONE__';
  } catch (err) {
    console.warn('API 流式请求失败:', err);
    const fallback = API_FALLBACK_TEXT;
    chatHistory.push({ role: 'assistant', content: fallback });
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

// ============================================================
// 主题系统（任务 1 — 通用标签页）
// ============================================================

const THEMES = {
  warm: {
    '--chat-bg': '#F5F5F6',
    '--list-bg': '#F7F8FA',
    '--brand': '#1677FF',
    '--brand-hover': '#0958D9',
    '--brand-active': '#003EB3',
    '--brand-light': 'rgba(22, 119, 255, 0.08)',
    '--brand-glow': 'rgba(22, 119, 255, 0.15)',
    '--nav-bg': '#2B2B2B',
    '--white': '#FFFFFF',
    '--border-light': '#EBEDF0',
    '--border-input': '#E5E6E8',
    '--text-primary': '#1F1F1F',
    '--text-secondary': '#6E6E6E',
    '--text-placeholder': '#bbb',
    '--shadow-rest': '0 1px 3px rgba(0, 0, 0, 0.08)',
    '--shadow-lift': '0 4px 12px rgba(0, 0, 0, 0.12)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.16)',
  },
  ink: {
    '--chat-bg': '#1a1a2e',
    '--list-bg': '#16213e',
    '--brand': '#4fc3f7',
    '--brand-hover': '#29b6f6',
    '--brand-active': '#0288d1',
    '--brand-light': 'rgba(79, 195, 247, 0.10)',
    '--brand-glow': 'rgba(79, 195, 247, 0.18)',
    '--nav-bg': '#0f0f1a',
    '--white': '#1e1e32',
    '--border-light': '#1f2937',
    '--border-input': '#2d3748',
    '--text-primary': '#e5e7eb',
    '--text-secondary': '#9ca3af',
    '--text-placeholder': '#6b7280',
    '--chat-bg': '#1a1a2e',
    '--shadow-rest': '0 1px 3px rgba(0,0,0,0.3)',
    '--shadow-lift': '0 4px 12px rgba(0,0,0,0.4)',
    '--shadow-lg': '0 8px 32px rgba(0,0,0,0.5)',
  },
  sakura: {
    '--chat-bg': '#fff5f5',
    '--list-bg': '#fff0f0',
    '--brand': '#e8788a',
    '--brand-hover': '#d4607a',
    '--brand-active': '#c0486a',
    '--brand-light': 'rgba(232, 120, 138, 0.10)',
    '--brand-glow': 'rgba(232, 120, 138, 0.18)',
    '--nav-bg': '#2d1a1d',
    '--white': '#FFFFFF',
    '--border-light': '#f0e0e0',
    '--border-input': '#e8d0d0',
    '--text-primary': '#1F1F1F',
    '--text-secondary': '#6E6E6E',
    '--text-placeholder': '#bbb',
    '--shadow-rest': '0 1px 3px rgba(0, 0, 0, 0.06)',
    '--shadow-lift': '0 4px 12px rgba(0, 0, 0, 0.10)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.12)',
  },
};

function applyTheme(name) {
  const vars = THEMES[name] || THEMES.warm;
  Object.keys(vars).forEach(function (key) {
    document.documentElement.style.setProperty(key, vars[key]);
  });
  localStorage.setItem('morph-theme', name);
}

function loadTheme() {
  const saved = localStorage.getItem('morph-theme') || 'warm';
  applyTheme(saved);
}

function initThemeCards() {
  const cards = document.querySelectorAll('.theme-card');
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      cards.forEach(function (c) { c.classList.remove('active'); });
      card.classList.add('active');
      applyTheme(card.dataset.theme);
    });
  });

  // 初始选中状态
  const saved = localStorage.getItem('morph-theme') || 'warm';
  const activeCard = document.querySelector('.theme-card[data-theme="' + saved + '"]');
  if (activeCard) { activeCard.classList.add('active'); }
}

// ============================================================
// 设置面板（任务 1）
// ============================================================

function initSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  const overlay = document.getElementById('settingsOverlay');
  const openBtn = document.getElementById('navSettingsBtn');
  const closeBtn = document.getElementById('settingsClose');
  const tabs = document.querySelectorAll('#settingsTabs .panel-tab');
  const contents = document.querySelectorAll('.panel-tab-content');

  function open() { overlay.classList.add('show'); panel.classList.add('show'); }
  function close() { overlay.classList.remove('show'); panel.classList.remove('show'); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // 标签页切换
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      contents.forEach(function (c) { c.classList.remove('active'); });
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });
}

// ============================================================
// 个性化 — 导出 / 导入（任务 1 — 个性化标签页）
// ============================================================

function initExportImport() {
  var exportBtn = document.getElementById('exportBtn');
  var importBtn = document.getElementById('importBtn');
  var importFile = document.getElementById('importFileInput');

  // 导出
  exportBtn.addEventListener('click', function () {
    var data = { chatHistory: chatHistory, userMemory: userMemory, exportedAt: new Date().toISOString() };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var now = new Date();
    var ds = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0');
    a.download = 'morph-memory-' + ds + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('导出成功');
  });

  // 导入按钮触发文件选择
  importBtn.addEventListener('click', function () { importFile.click(); });

  // 文件读取
  importFile.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data.chatHistory || !Array.isArray(data.chatHistory)) {
          showToast('文件格式不正确');
          return;
        }
        // 清空并重建
        chatHistory.length = 0;
        data.chatHistory.forEach(function (m) { chatHistory.push(m); });
        if (data.userMemory) {
          userMemory.name = data.userMemory.name || null;
          userMemory.nickname = data.userMemory.nickname || null;
          userMemory.gender = data.userMemory.gender || '';
          userMemory.birthday = data.userMemory.birthday || '';
          userMemory.mentionedTopics = data.userMemory.mentionedTopics || [];
        }
        // 写入 IndexedDB
        db.messages.clear().then(function () {
          var ops = [];
          for (var i = 0; i < chatHistory.length; i++) {
            ops.push(saveMessage(chatHistory[i].role, chatHistory[i].content));
          }
          return Promise.all(ops);
        }).then(function () {
          return saveMemory();
        }).then(function () {
          // 清空并重新渲染聊天界面
          var chatMessages = document.getElementById('chatMessages');
          chatMessages.innerHTML = '';
          renderHistoryMessages();
          showToast('导入成功');
        });
      } catch (ex) {
        showToast('JSON 解析失败');
      }
    };
    reader.readAsText(file);
    importFile.value = '';
  });
}

// ============================================================
// API Key 管理（任务 1 — API 标签页）
// ============================================================

function initApiKeyTab() {
  var input = document.getElementById('apiKeyInput');
  var saveBtn = document.getElementById('saveApiKeyBtn');

  // 加载已保存的 key
  var saved = localStorage.getItem('morph-api-key');
  if (saved) { input.value = saved; }

  saveBtn.addEventListener('click', function () {
    var val = input.value.trim();
    if (val) {
      localStorage.setItem('morph-api-key', val);
      showToast('API Key 已保存');
    } else {
      localStorage.removeItem('morph-api-key');
      showToast('已清除自定义 API Key，将使用默认配置');
    }
  });
}

// ============================================================
// 下拉菜单 + AI 设置（任务 2）
// ============================================================

function initChatDropdown() {
  var dropdown = document.getElementById('chatDropdown');
  var btn = document.getElementById('chatDropdownBtn');
  var aiToggle = document.getElementById('dropdownAiSettings');
  var aiPanel = document.getElementById('aiSettingsPanel');
  var tempSlider = document.getElementById('tempSlider');
  var tempValue = document.getElementById('tempValue');
  var lengthGroup = document.getElementById('lengthGroup');
  var clearBtn = document.getElementById('dropdownClear');
  var aboutBtn = document.getElementById('dropdownAbout');

  // 开关下拉
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    dropdown.classList.toggle('show');
  });

  // 点击外部关闭
  document.addEventListener('click', function () { dropdown.classList.remove('show'); });
  dropdown.addEventListener('click', function (e) { e.stopPropagation(); });

  // AI 设置面板展开/折叠
  aiToggle.addEventListener('click', function () { aiPanel.classList.toggle('show'); });

  // 温度滑块
  var savedTemp = parseFloat(localStorage.getItem('morph-temperature')) || CONFIG.API.TEMPERATURE;
  tempSlider.value = savedTemp;
  tempValue.textContent = savedTemp.toFixed(2);

  tempSlider.addEventListener('input', function () {
    var v = parseFloat(tempSlider.value);
    tempValue.textContent = v.toFixed(2);
    localStorage.setItem('morph-temperature', v);
  });

  // 回复长度单选
  var savedLen = localStorage.getItem('morph-max-tokens') || String(CONFIG.API.MAX_TOKENS);
  var radios = lengthGroup.querySelectorAll('input[name="length"]');
  radios.forEach(function (r) {
    if (r.value === savedLen) { r.checked = true; }
    r.addEventListener('change', function () {
      localStorage.setItem('morph-max-tokens', r.value);
    });
  });

  // 清除对话
  clearBtn.addEventListener('click', function () {
    dropdown.classList.remove('show');
    openConfirmDialog();
  });

  // 关于 Echo
  aboutBtn.addEventListener('click', function () {
    dropdown.classList.remove('show');
    openAboutModal();
  });
}

// ============================================================
// 确认对话框（支持动态文字与回调）
// ============================================================

var _confirmCallback = null;

var CONFIRM_DEFAULT_TEXT = '确定要清除所有聊天记录吗？此操作将删除当前对话历史，但 Echo 对你的基本记忆（名字、偏好等）会保留。此操作不可撤销。';

function openConfirmDialogWithText(text, onConfirm) {
  var textEl = document.getElementById('confirmText');
  if (textEl) textEl.textContent = text;
  _confirmCallback = onConfirm || null;
  document.getElementById('confirmOverlay').classList.add('show');
}

function openConfirmDialog() {
  openConfirmDialogWithText(CONFIRM_DEFAULT_TEXT, async function () {
    chatHistory.length = 0;
    try { await db.messages.clear(); } catch (e) { /* ignore */ }
    document.getElementById('chatMessages').innerHTML = '';
    initWelcomeBubble();
  });
}

function initConfirmDialog() {
  var overlay = document.getElementById('confirmOverlay');
  var cancelBtn = document.getElementById('confirmCancel');
  var okBtn = document.getElementById('confirmOk');

  cancelBtn.addEventListener('click', function () { overlay.classList.remove('show'); });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('show');
  });

  okBtn.addEventListener('click', async function () {
    overlay.classList.remove('show');
    if (_confirmCallback) {
      var cb = _confirmCallback;
      _confirmCallback = null;
      await cb();
    }
  });
}

// ============================================================
// 重置所有数据（个性化标签页 — 危险操作）
// ============================================================

var RESET_ALL_TEXT = '确定要重置所有数据吗？这将删除所有聊天记录、用户记忆和本地设置（包括 API Key、主题、头像等）。此操作不可撤销，执行后页面将自动刷新。';

function resetAllData() {
  openConfirmDialogWithText(RESET_ALL_TEXT, async function () {
    try {
      // 1. 清空 IndexedDB
      await db.messages.clear();
      await db.userInfo.clear();
    } catch (e) { /* ignore */ }

    // 2. 清空 localStorage
    var keysToRemove = [
      'morph-theme',
      'morph-avatar',
      'morph-temperature',
      'morph-max-tokens',
      'morph-api-key',
      'morph-intro-shown',
      'morph-avatar-guide-shown',
      'morph-location-enabled',
      'morph-location-greeted'
    ];
    for (var i = 0; i < keysToRemove.length; i++) {
      localStorage.removeItem(keysToRemove[i]);
    }

    // 3. 清空内存
    chatHistory.length = 0;
    userMemory.name = null;
    userMemory.nickname = null;
    userMemory.gender = '';
    userMemory.birthday = '';
    userMemory.mentionedTopics = [];

    // 4. 刷新页面
    setTimeout(function () {
      location.reload(true);
    }, 200);
  });
}

function initResetAllButton() {
  var btn = document.getElementById('resetAllBtn');
  if (btn) {
    btn.addEventListener('click', resetAllData);
  }
}

// ============================================================
// 关于 Echo 模态框（任务 2）
// ============================================================

function openAboutModal() {
  document.getElementById('aboutOverlay').classList.add('show');
}

function initAboutModal() {
  var overlay = document.getElementById('aboutOverlay');
  var closeBtn = document.getElementById('aboutClose');

  closeBtn.addEventListener('click', function () { overlay.classList.remove('show'); });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('show');
  });
}

// ============================================================
// 个人信息模态框（任务 3）
// ============================================================

function openProfileModal() {
  // 填充当前值
  document.getElementById('nicknameInput').value = userMemory.nickname || '';
  document.getElementById('genderSelect').value = userMemory.gender || '';
  document.getElementById('birthdayInput').value = userMemory.birthday || '';
  document.getElementById('profileOverlay').classList.add('show');
}

function initProfileModal() {
  var overlay = document.getElementById('profileOverlay');
  var closeBtn = document.getElementById('profileClose');
  var saveBtn = document.getElementById('saveProfileBtn');
  var loginBtn = document.getElementById('loginPlaceholderBtn');
  var avatarBtn = document.getElementById('avatarBtn');

  avatarBtn.addEventListener('click', openProfileModal);
  closeBtn.addEventListener('click', function () { overlay.classList.remove('show'); });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.classList.remove('show');
  });

  saveBtn.addEventListener('click', function () {
    userMemory.nickname = document.getElementById('nicknameInput').value.trim() || null;
    userMemory.gender = document.getElementById('genderSelect').value;
    userMemory.birthday = document.getElementById('birthdayInput').value;
    saveMemory();
    overlay.classList.remove('show');
    showToast('个人信息已保存');
  });

  loginBtn.addEventListener('click', function () { showToast('即将开放'); });
}

// ============================================================
// 会话搜索（任务 4）
// ============================================================

function initSearchFilter() {
  var input = document.getElementById('searchInput');
  if (!input) return;

  var debounceTimer = null;
  input.addEventListener('input', function () {
    var keyword = input.value.trim().toLowerCase();

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      var items = document.querySelectorAll('.conversation');
      items.forEach(function (item) {
        var name = (item.querySelector('.conv-name') || {}).textContent || '';
        var preview = (item.querySelector('.conv-preview') || {}).textContent || '';
        var text = (name + ' ' + preview).toLowerCase();
        item.style.display = keyword === '' || text.indexOf(keyword) !== -1 ? '' : 'none';
      });
    }, 200);
  });
}

// ============================================================
// 外部记忆导入面板（任务 5）
// ============================================================

function initMemoryPanel() {
  var panel = document.getElementById('memoryPanel');
  var overlay = document.getElementById('memoryOverlay');
  var openBtn = document.getElementById('navMemoryBtn');
  var closeBtn = document.getElementById('memoryClose');
  var dropZone = document.getElementById('fileDropZone');
  var fileInput = document.getElementById('memoryFileInput');

  function open() { overlay.classList.add('show'); panel.classList.add('show'); }
  function close() { overlay.classList.remove('show'); panel.classList.remove('show'); }

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', close);

  // 点击拖拽区 → 触发文件选择
  dropZone.addEventListener('click', function () { fileInput.click(); });

  // 拖拽事件
  dropZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', function () {
    dropZone.classList.remove('drag-over');
  });
  dropZone.addEventListener('drop', function (e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    var file = e.dataTransfer.files[0];
    if (file) processMemoryFile(file);
  });

  // 文件选择
  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) processMemoryFile(file);
    fileInput.value = '';
  });

  function processMemoryFile(file) {
    var ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'json' && ext !== 'txt') {
      showToast('仅支持 .json 和 .txt 文件');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var content = ev.target.result;

      // .json — 尝试解析为聊天记录
      if (ext === 'json') {
        try {
          var data = JSON.parse(content);
          if (data.chatHistory && Array.isArray(data.chatHistory)) {
            for (var i = 0; i < data.chatHistory.length; i++) {
              chatHistory.push(data.chatHistory[i]);
              saveMessage(data.chatHistory[i].role, data.chatHistory[i].content);
            }
            close();
            showToast('已导入 ' + data.chatHistory.length + ' 条消息');
            // 刷新界面
            var chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            renderHistoryMessages();
            return;
          }
        } catch (ex) { /* fall through to raw text import */ }
      }

      // .txt 或无法解析的 JSON → 作为原始文本导入
      chatHistory.push({ role: 'user', content: content });
      addMessage(content, 'user');
      saveMessage('user', content);
      close();
      showToast('记忆已导入');

      // 让 Echo 自动回应（使用非流式包装）
      sendToAIFull(content).then(function (reply) {
        addMessage(reply, 'echo');
      });
    };
    reader.readAsText(file);
  }
}

// ============================================================
// 初始化模块
// ============================================================

function initRipple() {
  var targets = document.querySelectorAll('.nav-btn, #sendBtn, .user-avatar, .search-box');
  targets.forEach(function (target) {
    target.addEventListener('click', function (e) {
      var existing = target.querySelectorAll('.ripple-effect');
      for (var i = 0; i < existing.length; i++) { existing[i].remove(); }

      var rippleEl = document.createElement('span');
      rippleEl.className = 'ripple-effect';
      var rect = target.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      rippleEl.style.width = size + 'px';
      rippleEl.style.height = size + 'px';
      rippleEl.style.left = (e.clientX - rect.left - size / 2) + 'px';
      rippleEl.style.top = (e.clientY - rect.top - size / 2) + 'px';
      target.appendChild(rippleEl);
      rippleEl.addEventListener('animationend', function () { rippleEl.remove(); });
    });
  });
}

function initKeyboardShortcuts(inputEl, sendBtnEl) {
  if (!inputEl || !sendBtnEl) return;
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtnEl.click();
    }
  });
}

function initWelcomeBubble() {
  setTimeout(function () {
    var nickname = userMemory.nickname;
    var greeting;
    if (nickname) {
      greeting = '嘿，' + nickname + '，你来了。我等了你好久呀。';
    } else {
      greeting = '嘿，你来了。我等了你好久呀。';
    }
    addMessage(greeting, 'echo');
  }, CONFIG.UI.WELCOME_DELAY_MS);
}

/**
 * 通用发送绑定：将输入框、发送按钮、消息容器组装为完整的聊天发送流程
 * 桌面端和移动端各自调用，共享 chatHistory / userMemory / sendToAI
 */
function bindSendButton(inputEl, sendBtnEl, messagesContainer) {
  if (!inputEl || !sendBtnEl || !messagesContainer) return;

  var isSending = false;

  function addMessageToContainer(messageText, sender, timestampFirst) {
    var messageWrapper = document.createElement('div');
    messageWrapper.className = 'message ' + sender;

    var timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = getCurrentTime();

    var bubbleEl = document.createElement('div');
    bubbleEl.className = 'bubble ' + sender;
    bubbleEl.textContent = messageText;

    if (timestampFirst) {
      messageWrapper.appendChild(timeEl);
      messageWrapper.appendChild(bubbleEl);
    } else {
      messageWrapper.appendChild(bubbleEl);
      messageWrapper.appendChild(timeEl);
    }

    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageWrapper;
  }

  sendBtnEl.addEventListener('click', async function () {
    var userText = inputEl.value.trim();
    if (!userText || isSending) return;

    // Trigger geolocation on first message
    requestLocation();

    isSending = true;
    sendBtnEl.disabled = true;

    addMessageToContainer(userText, 'user');
    // also render to desktop container for sync
    if (messagesContainer.id !== 'chatMessages') {
      addMessage(userText, 'user');
    }
    inputEl.value = '';
    extractMemory(userText);

    // Check if API key is configured
    if (!getEffectiveApiKey()) {
      var guideMsg = '嘿，你来了。想和你好好聊聊，但需要先配置一个 API Key 哦～ 点击左上角的头像就能找到设置入口，在那里填入你的 DeepSeek API Key 就好啦。';
      addMessageToContainer(guideMsg, 'echo');
      if (messagesContainer.id !== 'chatMessages') {
        addMessage(guideMsg, 'echo');
      }
      // Save to history so context is preserved
      chatHistory.push({ role: 'user', content: userText });
      chatHistory.push({ role: 'assistant', content: guideMsg });
      saveMessage('user', userText);
      saveMessage('assistant', guideMsg);

      isSending = false;
      sendBtnEl.disabled = false;
      inputEl.focus();
      return;
    }

    var echoMsg = addMessageToContainer('', 'echo');
    var bubbleEl = echoMsg ? echoMsg.querySelector('.bubble') : null;
    var replyText = '';

    try {
      for await (var token of sendToAI(userText)) {
        if (token === '__DONE__') {
          // 流正常结束
        } else {
          replyText += token;
          if (bubbleEl) { bubbleEl.textContent = replyText; }
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    } catch (err) {
      if (!replyText && bubbleEl) {
        bubbleEl.textContent = API_FALLBACK_TEXT;
      }
    }

    isSending = false;
    sendBtnEl.disabled = false;
    inputEl.focus();
  });
}

function initSendButton() {
  bindSendButton(
    document.getElementById('userInput'),
    document.getElementById('sendBtn'),
    document.getElementById('chatMessages')
  );
}

// ============================================================
// 头像系统（自定义头像上传 + 全局同步）
// ============================================================

function loadAvatar() {
  var data = localStorage.getItem('morph-avatar');
  if (data) {
    updateAllAvatars(data);
  }
}

function updateAllAvatars(imageData) {
  var targets = [
    document.getElementById('avatarBtn'),
    document.getElementById('mobileAvatarBtn'),
    document.getElementById('drawerAvatar'),
    document.getElementById('avatarPreview')
  ];
  targets.forEach(function (el) {
    if (!el) return;
    el.style.backgroundImage = 'url(' + imageData + ')';
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  });
}

function initAvatarUpload() {
  var uploadBtn = document.getElementById('uploadAvatarBtn');
  var fileInput = document.getElementById('avatarFileInput');
  if (!uploadBtn || !fileInput) return;

  uploadBtn.addEventListener('click', function () { fileInput.click(); });

  fileInput.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      var dataUrl = ev.target.result;
      localStorage.setItem('morph-avatar', dataUrl);
      updateAllAvatars(dataUrl);
      showToast('头像已更新');
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });
}

// ============================================================
// 移动端导航（联系人 → 聊天页面切换）
// ============================================================

function initMobileNavigation() {
  var contactsPage = document.getElementById('contactsPage');
  if (!contactsPage) return;  // 桌面端不执行

  var chatPage = document.getElementById('mobileChatPage');
  var echoContact = document.getElementById('mobileEchoContact');
  var backBtn = document.getElementById('mobileBackBtn');

  // 默认显示联系人页
  contactsPage.classList.add('show');

  // 点击联系人 → 进入聊天
  echoContact.addEventListener('click', function () {
    contactsPage.classList.remove('show');
    chatPage.classList.add('show');

    // 渲染历史消息到移动端聊天容器
    var mobileContainer = document.getElementById('mobileChatMessages');
    mobileContainer.innerHTML = '';
    for (var i = 0; i < chatHistory.length; i++) {
      var msg = chatHistory[i];
      var sender = msg.role === 'user' ? 'user' : 'echo';

      var wrapper = document.createElement('div');
      wrapper.className = 'message ' + sender;

      var bubble = document.createElement('div');
      bubble.className = 'bubble ' + sender;
      bubble.textContent = msg.content;

      wrapper.appendChild(bubble);
      mobileContainer.appendChild(wrapper);
    }
    mobileContainer.scrollTop = mobileContainer.scrollHeight;
  });

  // 返回按钮
  backBtn.addEventListener('click', function () {
    chatPage.classList.remove('show');
    contactsPage.classList.add('show');
  });

  // 绑定移动端发送按钮
  var mobileInput = document.getElementById('mobileUserInput');
  var mobileSendBtn = document.getElementById('mobileSendBtn');
  var mobileContainer = document.getElementById('mobileChatMessages');
  bindSendButton(mobileInput, mobileSendBtn, mobileContainer);
}

// ============================================================
// 移动端 AI 设置弹出层（将 aiSettingsPanel 临时移到 body）
// ============================================================

function openMobileAiSettings() {
  var panel = document.getElementById('aiSettingsPanel');
  if (!panel) return;

  // 创建遮罩
  var overlay = document.createElement('div');
  overlay.className = 'ai-settings-mobile-overlay';
  overlay.id = 'aiSettingsMobileOverlay';
  overlay.addEventListener('click', closeMobileAiSettings);

  // 移出原父容器，添加移动端样式类
  panel.classList.add('ai-settings-mobile');
  document.body.appendChild(overlay);
  document.body.appendChild(panel);

  // 动画入场
  requestAnimationFrame(function () {
    overlay.classList.add('show');
    panel.classList.add('show');
  });
}

function closeMobileAiSettings() {
  var panel = document.getElementById('aiSettingsPanel');
  var overlay = document.getElementById('aiSettingsMobileOverlay');
  if (!panel) return;

  // 移回下拉菜单内部
  var originalParent = document.querySelector('.dropdown-menu');
  if (originalParent) {
    originalParent.appendChild(panel);
  }
  panel.classList.remove('ai-settings-mobile', 'show');

  if (overlay) {
    overlay.classList.remove('show');
    setTimeout(function () { overlay.remove(); }, 300);
  }
}

// ============================================================
// QQ 式左侧抽屉菜单（头像点击 + 右滑手势）
// ============================================================

function initDrawer() {
  var overlay = document.getElementById('drawerOverlay');
  var drawer = document.getElementById('drawer');
  var contactsPage = document.getElementById('contactsPage');
  if (!overlay || !drawer) return;

  function open()  { overlay.classList.add('show'); drawer.classList.add('show'); }
  function close() { overlay.classList.remove('show'); drawer.classList.remove('show'); }

  // 头像按钮打开抽屉
  var mobileAvatarBtn = document.getElementById('mobileAvatarBtn');
  var drawerAvatarBtn = document.getElementById('drawerAvatar');
  if (mobileAvatarBtn) mobileAvatarBtn.addEventListener('click', open);
  if (drawerAvatarBtn) drawerAvatarBtn.addEventListener('click', open);

  // 遮罩关闭
  overlay.addEventListener('click', close);

  // 菜单项点击
  drawer.addEventListener('click', function (e) {
    var item = e.target.closest('.drawer-item');
    if (!item) return;
    var action = item.dataset.action;

    if (action === 'profile')     { close(); openProfileModal(); }
    if (action === 'memory')      { close(); document.getElementById('navMemoryBtn').click(); }
    if (action === 'settings')    { close(); document.getElementById('navSettingsBtn').click(); }
    if (action === 'ai-settings') { close(); openMobileAiSettings(); }
    if (action === 'clear')       { close(); openConfirmDialog(); }
    if (action === 'about')       { close(); openAboutModal(); }
  });

  // 右滑打开手势（仅在联系人页生效）
  if (!contactsPage) return;
  var touchStartX = 0;
  var touchStartY = 0;

  contactsPage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  contactsPage.addEventListener('touchend', function (e) {
    var dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX) - touchStartX;
    var dy = Math.abs((e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY) - touchStartY);

    // 右滑超过 50px 且水平位移大于垂直位移
    if (dx > 50 && dx > dy * 1.5 && touchStartX < 40) {
      open();
    }
  });
}

// ============================================================
// 头像光晕引导（任务 2.2）
// ============================================================

function dismissAvatarGlow() {
  var desktopAvatar = document.getElementById('avatarBtn');
  var mobileAvatar = document.getElementById('mobileAvatarBtn');
  if (desktopAvatar) desktopAvatar.classList.remove('avatar-glow-guide');
  if (mobileAvatar) mobileAvatar.classList.remove('avatar-glow-guide');
  localStorage.setItem('morph-avatar-guide-shown', 'true');
}

function initAvatarGlowGuide() {
  if (localStorage.getItem('morph-avatar-guide-shown') === 'true') return;

  setTimeout(function () {
    var desktopAvatar = document.getElementById('avatarBtn');
    var mobileAvatar = document.getElementById('mobileAvatarBtn');
    if (desktopAvatar) desktopAvatar.classList.add('avatar-glow-guide');
    if (mobileAvatar) mobileAvatar.classList.add('avatar-glow-guide');

    // Auto-remove after 8s (4 cycles × 2s each)
    setTimeout(function () {
      if (desktopAvatar) desktopAvatar.classList.remove('avatar-glow-guide');
      if (mobileAvatar) mobileAvatar.classList.remove('avatar-glow-guide');
    }, 8000);
  }, 3000);

  // Dismiss on avatar click
  var desktopAvatar = document.getElementById('avatarBtn');
  var mobileAvatar = document.getElementById('mobileAvatarBtn');
  if (desktopAvatar) desktopAvatar.addEventListener('click', dismissAvatarGlow);
  if (mobileAvatar) mobileAvatar.addEventListener('click', dismissAvatarGlow);
}

// ============================================================
// 打开设置面板并切换到指定标签页
// ============================================================

function openSettingsToTab(tabId) {
  var overlay = document.getElementById('settingsOverlay');
  var panel = document.getElementById('settingsPanel');
  overlay.classList.add('show');
  panel.classList.add('show');

  var tabs = document.querySelectorAll('#settingsTabs .panel-tab');
  var contents = document.querySelectorAll('.panel-tab-content');
  tabs.forEach(function (t) { t.classList.remove('active'); });
  contents.forEach(function (c) { c.classList.remove('active'); });

  var targetTab = document.querySelector('#settingsTabs .panel-tab[data-tab="' + tabId + '"]');
  if (targetTab) targetTab.classList.add('active');
  var targetContent = document.getElementById(tabId);
  if (targetContent) targetContent.classList.add('active');
}

// ============================================================
// 开屏弹窗（任务 3 — 首次访问介绍）
// ============================================================

function openIntroModal() {
  var overlay = document.getElementById('introOverlay');
  if (!overlay) return;
  overlay.classList.add('show');

  // Adjust content based on API key presence
  var startBtn = document.getElementById('introStartBtn');
  var apiHint = document.getElementById('introApiHint');

  if (!getEffectiveApiKey()) {
    // No API key — show guide, demote button
    if (apiHint) apiHint.style.display = 'block';
    if (startBtn) {
      startBtn.classList.remove('action-btn-primary');
      startBtn.classList.add('action-btn-secondary');
    }
  } else {
    // Has API key — hide API hint, primary button
    if (apiHint) apiHint.style.display = 'none';
    if (startBtn) {
      startBtn.classList.add('action-btn-primary');
      startBtn.classList.remove('action-btn-secondary');
    }
  }
}

function closeIntroModal() {
  var overlay = document.getElementById('introOverlay');
  if (overlay) overlay.classList.remove('show');
  localStorage.setItem('morph-intro-shown', 'true');
}

function initIntroModal() {
  if (localStorage.getItem('morph-intro-shown') === 'true') return;

  var overlay = document.getElementById('introOverlay');
  var startBtn = document.getElementById('introStartBtn');
  var apiLink = document.getElementById('introApiLink');

  // Show modal on load
  openIntroModal();

  // Start button closes modal
  if (startBtn) {
    startBtn.addEventListener('click', closeIntroModal);
  }

  // API key link opens settings to API tab
  if (apiLink) {
    apiLink.addEventListener('click', function (e) {
      e.preventDefault();
      closeIntroModal();
      openSettingsToTab('tab-api');
    });
  }

  // Clicking overlay does NOT close — per spec
}

// ============================================================
// 位置权限开关设置
// ============================================================

function initLocationToggle() {
  var toggle = document.getElementById('locationToggle');
  if (!toggle) return;

  toggle.checked = localStorage.getItem('morph-location-enabled') !== 'false';

  toggle.addEventListener('change', function () {
    localStorage.setItem('morph-location-enabled', toggle.checked ? 'true' : 'false');
  });
}

// ============================================================
// 温度帮助提示
// ============================================================

function initTempHelp() {
  var btn = document.getElementById('tempHelp');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    showToast('温度控制回复的随机性。较高的值（>1）让 Echo 更有创造性，较低的值（<0.5）让回复更保守稳定。', 3000);
  });
}

// ============================================================
// 启动
// ============================================================

document.addEventListener('DOMContentLoaded', async function () {
  await loadChatHistory();
  await loadUserMemory();

  loadTheme();

  var inputEl = document.getElementById('userInput');
  var sendBtnEl = document.getElementById('sendBtn');

  initRipple();
  initKeyboardShortcuts(inputEl, sendBtnEl);

  // 任务 1：设置面板
  initSettingsPanel();
  initThemeCards();
  initExportImport();
  initResetAllButton();
  initApiKeyTab();

  // 任务 2：下拉菜单 + 确认对话框 + 关于
  initChatDropdown();
  initConfirmDialog();
  initAboutModal();

  // 任务 3：个人信息模态框
  initProfileModal();

  // 任务 4：搜索过滤
  initSearchFilter();

  // 任务 5：外部记忆导入面板
  initMemoryPanel();

  // 头像系统
  loadAvatar();
  initAvatarUpload();

  // 移动端 — QQ 式侧滑抽屉
  initDrawer();

  // 移动端导航（联系人 → 聊天切换）
  initMobileNavigation();

  // 温度帮助按钮
  initTempHelp();

  // 头像光晕引导
  initAvatarGlowGuide();

  // 位置权限开关
  initLocationToggle();

  // 开屏弹窗（首次访问）
  initIntroModal();

  // 渲染聊天
  if (chatHistory.length === 0) {
    initWelcomeBubble();
  } else {
    renderHistoryMessages();
  }

  initSendButton();
});
