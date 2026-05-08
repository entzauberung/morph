// ============================================================
// Morph / 另我 — Echo 对话灵魂
// V1.0：发布冲刺 · 完整 UI 激活
// ============================================================

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

function renderHistoryMessages() {
  for (let i = 0; i < State.chatHistory.length; i++) {
    const msg = State.chatHistory[i];
    addMessage(msg.content, msg.role === 'user' ? 'user' : 'echo');
  }
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
    var data = { chatHistory: State.chatHistory, userMemory: State.userMemory, exportedAt: new Date().toISOString() };
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
        State.chatHistory.length = 0;
        data.chatHistory.forEach(function (m) { State.chatHistory.push(m); });
        if (data.userMemory) {
          State.userMemory.name = data.userMemory.name || null;
          State.userMemory.nickname = data.userMemory.nickname || null;
          State.userMemory.gender = data.userMemory.gender || '';
          State.userMemory.birthday = data.userMemory.birthday || '';
          State.userMemory.mentionedTopics = data.userMemory.mentionedTopics || [];
        }
        // 写入 IndexedDB
        db.messages.clear().then(function () {
          var ops = [];
          for (var i = 0; i < State.chatHistory.length; i++) {
            ops.push(saveMessage(State.chatHistory[i].role, State.chatHistory[i].content));
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

var CONFIRM_DEFAULT_TEXT = '确定要清除所有聊天记录吗？此操作将删除当前对话历史，但 Echo 对你的基本记忆（名字、偏好等）会保留。此操作不可撤销。';
let _confirmCallback = null;

function openConfirmDialogWithText(text, onConfirm) {
  var textEl = document.getElementById('confirmText');
  if (textEl) textEl.textContent = text;
  _confirmCallback = onConfirm || null;
  document.getElementById('confirmOverlay').classList.add('show');
}

function openConfirmDialog() {
  openConfirmDialogWithText(CONFIRM_DEFAULT_TEXT, async function () {
    State.chatHistory.length = 0;
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
    State.chatHistory.length = 0;
    State.userMemory.name = null;
    State.userMemory.nickname = null;
    State.userMemory.gender = '';
    State.userMemory.birthday = '';
    State.userMemory.mentionedTopics = [];

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
  document.getElementById('nicknameInput').value = State.userMemory.nickname || '';
  document.getElementById('genderSelect').value = State.userMemory.gender || '';
  document.getElementById('birthdayInput').value = State.userMemory.birthday || '';
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
    State.userMemory.nickname = document.getElementById('nicknameInput').value.trim() || null;
    State.userMemory.gender = document.getElementById('genderSelect').value;
    State.userMemory.birthday = document.getElementById('birthdayInput').value;
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
              State.chatHistory.push(data.chatHistory[i]);
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
      State.chatHistory.push({ role: 'user', content: content });
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
    var nickname = State.userMemory.nickname;
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
 * 桌面端和移动端各自调用，共享 State.chatHistory / State.userMemory / sendToAI
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
      State.chatHistory.push({ role: 'user', content: userText });
      State.chatHistory.push({ role: 'assistant', content: guideMsg });
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
    for (var i = 0; i < State.chatHistory.length; i++) {
      var msg = State.chatHistory[i];
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
  if (State.chatHistory.length === 0) {
    initWelcomeBubble();
  } else {
    renderHistoryMessages();
  }

  initSendButton();
});
