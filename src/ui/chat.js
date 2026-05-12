// chat.js - 聊天 UI：消息气泡、发送、主题、搜索

// ============================================================
// 核心：addMessage
// ============================================================

function addMessage(messageText, sender, timestampFirst) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  // 对 Echo 和棱镜的长回复进行分段显示
  if ((sender === 'echo' || sender === 'lens') && messageText.length > 30 && typeof splitIntoMessages === 'function') {
    const segments = splitIntoMessages(messageText);
    let firstWrapper = null;
    for (let s = 0; s < segments.length; s++) {
      const segText = segments[s].text;
      const wrapper = document.createElement('div');
      wrapper.className = 'message ' + sender;
      const timeEl = document.createElement('div');
      timeEl.className = 'message-time';
      timeEl.textContent = getCurrentTime();
      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + sender;
      bubble.textContent = segText;
      wrapper.appendChild(bubble);
      wrapper.appendChild(timeEl);
      chatMessages.appendChild(wrapper);
      if (s === 0) { firstWrapper = wrapper; }
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return firstWrapper;
  }

  // 短文本或用户消息：单气泡
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
// 实时分段工具函数（流式分段 Step 2）
// ============================================================

/**
 * 判断当前文本是否需要分段
 * @param {string} text - 当前段积累文本
 * @returns {boolean} 是否需要分段
 */
function shouldSplitSegment(text) {
  // 条件：文本长度 >= 30 字 且 包含句子结束符
  if (text.length < 30) return false;
  return /[。！？……]+/.test(text);
}

/**
 * 找到文本中最后一个句子边界的位置
 * @param {string} text - 当前段积累文本
 * @returns {number} 最后一个句子结束符的索引（包含该符号），未找到返回 -1
 */
function findLastSentenceBoundary(text) {
  for (let i = text.length - 1; i >= 0; i--) {
    if ('。！？……'.includes(text[i])) {
      return i + 1;  // 返回包含结束符的位置
    }
  }
  return -1;
}

/**
 * 简易 sleep 函数
 * @param {number} ms - 等待毫秒数
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}

// ============================================================
// 打字指示器
// ============================================================

function createTypingIndicator() {
  const senderClass = State.currentCharacter === 'lens' ? 'lens' : 'echo';
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return null;

  const messageWrapper = document.createElement('div');
  messageWrapper.className = 'message ' + senderClass + ' typing-indicator';

  const bubbleEl = document.createElement('div');
  bubbleEl.className = 'bubble ' + senderClass + ' typing-bubble';

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

function renderHistoryMessages(character) {
  character = character || State.currentCharacter || 'echo';
  const targetHistory = character === 'echo' ? State.chatHistory : State.lensHistory;
  const senderName = character === 'echo' ? 'echo' : 'lens';
  for (let i = 0; i < targetHistory.length; i++) {
    const msg = targetHistory[i];
    addMessage(msg.content, msg.role === 'user' ? 'user' : senderName);
  }
}

function initWelcomeBubble(character) {
  character = character || 'echo';
  setTimeout(function () {
    let greeting;
    if (character === 'echo') {
      const nickname = State.userMemory.nickname;
      if (nickname) {
        greeting = '嘿，' + nickname + '，你来了。我等了你好久呀。';
      } else {
        greeting = '嘿，你来了。我等了你好久呀。';
      }
    } else {
      greeting = '有什么事情在脑子里打转吗？说出来，我们一起梳理一下。';
    }
    addMessage(greeting, character === 'echo' ? 'echo' : 'lens');
  }, CONFIG.UI.WELCOME_DELAY_MS);
}

/**
 *切换角色 
 */
function switchCharacter(character) {
  // 已经在当前角色，不做任何事
  if (character === State.currentCharacter) return;
  // 切换角色标记
  State.currentCharacter = character;
  // 清空聊天区
  const chatArea = document.getElementById('chatMessages');
  chatArea.innerHTML = '';
  // 高亮侧边栏联系人
  document.querySelectorAll('.conversation').forEach(function (el) {
    el.classList.remove('active');
  });
  document.getElementById('contact-' + character).classList.add('active');
  // 更换角色名和状态文本
  document.getElementById('chat-header-title').textContent =
    character === 'echo' ? 'Echo' : 'Lens';
  document.getElementById('chat-header-status').textContent =
    character === 'echo' ? '在线' : '在线';
  // 桌面端 UI 更新
  document.getElementById('chat-header-title').textContent =
    character === 'echo' ? 'Echo' : 'Lens';
  document.getElementById('userInput').placeholder =
    character === 'echo' ? '和 Echo 说点什么吧...' : '和Lens聊聊你的想法...';
  // 移动端 UI 同步更新
  document.getElementById('mobile-chat-header-title').textContent =
    character === 'echo' ? 'Echo' : 'Lens';
  document.getElementById('mobile-chat-header-status').textContent = '在线';
  document.getElementById('mobileUserInput').placeholder =
    character === 'echo' ? '和 Echo 说点什么吧...' : '和Lens聊聊你的想法...';
  // 更新"关于"按钮文本（桌面端下拉菜单触发按钮）
  const desktopAboutSpan = document.querySelector('#dropdownAbout span');
  if (desktopAboutSpan) {
    desktopAboutSpan.textContent = character === 'echo' ? 'ℹ️ 关于 Echo' : 'ℹ️ 关于棱镜';
  }
  // 切换移动端"关于"按钮（Echo / 棱镜）
  const drawerAboutEcho = document.querySelector('.drawer-item[data-action="about-echo"]');
  const drawerAboutLens = document.querySelector('.drawer-item[data-action="about-lens"]');
  if (drawerAboutEcho && drawerAboutLens) {
    drawerAboutEcho.style.display = character === 'echo' ? '' : 'none';
    drawerAboutLens.style.display = character === 'echo' ? 'none' : '';
  }

  // 加载聊天历史
  const targetHistory = character === 'echo' ? State.chatHistory : State.lensHistory;
  if (targetHistory.length === 0) {
    initWelcomeBubble(character);
  } else {
    renderHistoryMessages(character);
  }
  // 滚动到底部
  setTimeout(function () {
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 100);
}

// =
/**
 * 通用发送绑定：将输入框、发送按钮、消息容器组装为完整的聊天发送流程
 * 桌面端和移动端各自调用，共享 State.chatHistory / State.userMemory / sendToAI
 */
function bindSendButton(inputEl, sendBtnEl, messagesContainer) {
  if (!inputEl || !sendBtnEl || !messagesContainer) return;

  let isSending = false;

  function addMessageToContainer(messageText, sender, timestampFirst) {
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

    messagesContainer.appendChild(messageWrapper);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return messageWrapper;
  }

  sendBtnEl.addEventListener('click', async function () {
    const userText = inputEl.value.trim();
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
    // 仅 Echo 角色提取用户兴趣，棱镜不提取
    if (State.currentCharacter === 'echo') {
      extractMemory(userText);
    }

    // Check if API key is configured
    if (!getEffectiveApiKey()) {
      const guideMsg = '嘿，你来了。想和你好好聊聊，但需要先配置一个 API Key 哦～ 点击左上角的头像就能找到设置入口，在那里填入你的 DeepSeek API Key 就好啦。';
      addMessageToContainer(guideMsg, State.currentCharacter === 'lens' ? 'lens' : 'echo');
      if (messagesContainer.id !== 'chatMessages') {
        addMessage(guideMsg, State.currentCharacter === 'lens' ? 'lens' : 'echo');
      }
      // 保存到对应角色的历史数组
      if (State.currentCharacter === 'echo') {
        State.chatHistory.push({ role: 'user', content: userText });
        State.chatHistory.push({ role: 'assistant', content: guideMsg });
      } else {
        State.lensHistory.push({ role: 'user', content: userText });
        State.lensHistory.push({ role: 'assistant', content: guideMsg });
      }
      saveMessage('user', userText, State.currentCharacter);
      saveMessage('assistant', guideMsg, State.currentCharacter);

      isSending = false;
      sendBtnEl.disabled = false;
      inputEl.focus();
      return;
    }

    const senderClass = State.currentCharacter === 'lens' ? 'lens' : 'echo';
    const echoMsg = addMessageToContainer('', senderClass);
    let bubbleEl = echoMsg ? echoMsg.querySelector('.bubble') : null;
    let replyText = '';
    // Step 1：当前段积累区 — 所有 token 先经此处再同步到气泡，为实时分段做准备
    let currentSegmentText = '';

    try {
      // 根据当前角色选择 AI 引擎
      const aiGenerator = State.currentCharacter === 'lens' ? lensSendToAI(userText) : sendToAI(userText);
      for await (const token of aiGenerator) {
        if (token === '__DONE__') {
          // 流正常结束 — 定型最后一段，保存消息
          if (bubbleEl && currentSegmentText) {
            bubbleEl.textContent = currentSegmentText;
          }
          await saveMessage('user', userText, State.currentCharacter);
          await saveMessage('assistant', replyText, State.currentCharacter);
        } else {
          // 所有 token 先写入积累区，再同步到气泡（保持打字动画不变）
          currentSegmentText += token;
          replyText += token;
          if (bubbleEl) { bubbleEl.textContent = currentSegmentText; }
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          // Step 2：实时分段检测 — 在流式接收过程中按句子边界分段
          if (shouldSplitSegment(currentSegmentText)) {
            const splitIndex = findLastSentenceBoundary(currentSegmentText);
            if (splitIndex > 0 && splitIndex < currentSegmentText.length) {
              // 定型前半段到当前气泡
              const finalizedText = currentSegmentText.substring(0, splitIndex);
              bubbleEl.textContent = finalizedText;
              // 剩余文本作为新段的起点
              const remainingText = currentSegmentText.substring(splitIndex).trimStart();

              // 等待 700ms 后创建新气泡
              await sleep(700);

              // 创建新气泡
              const newEchoWrapper = addMessageToContainer('', senderClass);
              bubbleEl = newEchoWrapper ? newEchoWrapper.querySelector('.bubble') : null;
              currentSegmentText = remainingText;
              if (bubbleEl) { bubbleEl.textContent = currentSegmentText; }
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          }
        }
      }
    } catch (err) {
      // API 失败 — 统一在这里处理保存和 fallback 展示
      console.warn('sendToAI 失败，使用 fallback 兜底:', err);
      const fallback = State.currentCharacter === 'lens' ? LENS_FALLBACK_TEXT : API_FALLBACK_TEXT;
      if (bubbleEl) {
        bubbleEl.textContent = fallback;
      }
      replyText = fallback;
      // API 失败时推送到对应角色的历史数组
      if (State.currentCharacter === 'echo') {
        State.chatHistory.push({ role: 'assistant', content: fallback });
      } else {
        State.lensHistory.push({ role: 'assistant', content: fallback });
      }
      await saveMessage('user', userText, State.currentCharacter);
      await saveMessage('assistant', fallback, State.currentCharacter);
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
// 初始化模块
// ============================================================

function initKeyboardShortcuts(inputEl, sendBtnEl) {
  if (!inputEl || !sendBtnEl) return;
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtnEl.click();
    }
  });
}

function initRipple() {
  const targets = document.querySelectorAll('.nav-btn, #sendBtn, .user-avatar, .search-box');
  targets.forEach(function (target) {
    target.addEventListener('click', function (e) {
      const existing = target.querySelectorAll('.ripple-effect');
      for (let i = 0; i < existing.length; i++) { existing[i].remove(); }

      const rippleEl = document.createElement('span');
      rippleEl.className = 'ripple-effect';
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      rippleEl.style.width = size + 'px';
      rippleEl.style.height = size + 'px';
      rippleEl.style.left = (e.clientX - rect.left - size / 2) + 'px';
      rippleEl.style.top = (e.clientY - rect.top - size / 2) + 'px';
      target.appendChild(rippleEl);
      rippleEl.addEventListener('animationend', function () { rippleEl.remove(); });
    });
  });
}

// ============================================================
// 下拉菜单 + AI 设置（任务 2）
// ============================================================

function initChatDropdown() {
  const dropdown = document.getElementById('chatDropdown');
  const btn = document.getElementById('chatDropdownBtn');
  const aiToggle = document.getElementById('dropdownAiSettings');
  const aiPanel = document.getElementById('aiSettingsPanel');
  const tempSlider = document.getElementById('tempSlider');
  const tempValue = document.getElementById('tempValue');
  const lengthGroup = document.getElementById('lengthGroup');
  const clearBtn = document.getElementById('dropdownClear');
  const aboutBtn = document.getElementById('dropdownAbout');

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
  const savedTemp = parseFloat(localStorage.getItem('morph-temperature')) || CONFIG.API.TEMPERATURE;
  tempSlider.value = savedTemp;
  tempValue.textContent = savedTemp.toFixed(2);

  tempSlider.addEventListener('input', function () {
    const v = parseFloat(tempSlider.value);
    tempValue.textContent = v.toFixed(2);
    localStorage.setItem('morph-temperature', v);
  });

  // 回复长度单选
  const savedLen = localStorage.getItem('morph-max-tokens') || String(CONFIG.API.MAX_TOKENS);
  const radios = lengthGroup.querySelectorAll('input[name="length"]');
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

  // 关于 Echo / 关于棱镜
  aboutBtn.addEventListener('click', function () {
    dropdown.classList.remove('show');
    openAbout();
  });
}

// ============================================================
// 会话搜索（任务 4）
// ============================================================

function initSearchFilter() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  let debounceTimer = null;
  input.addEventListener('input', function () {
    const keyword = input.value.trim().toLowerCase();

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      const items = document.querySelectorAll('.conversation');
      items.forEach(function (item) {
        const name = (item.querySelector('.conv-name') || {}).textContent || '';
        const preview = (item.querySelector('.conv-preview') || {}).textContent || '';
        const text = (name + ' ' + preview).toLowerCase();
        item.style.display = keyword === '' || text.indexOf(keyword) !== -1 ? '' : 'none';
      });
    }, 200);
  });
}

// ============================================================
// 温度帮助提示
// ============================================================

function initTempHelp() {
  const btn = document.getElementById('tempHelp');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    showToast('温度控制回复的随机性。较高的值（>1）让 Echo 更有创造性，较低的值（<0.5）让回复更保守稳定。', 3000);
  });
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
