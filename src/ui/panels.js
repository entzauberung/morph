// panels.js - 设置面板：设置面板控制、导入导出、API Key、记忆导入

// ============================================================
// Morph / 另我 — Echo 对话灵魂
// V1.0：发布冲刺 · 完整 UI 激活
// ============================================================

// ============================================================
// 设置面板（任务 1）
// ============================================================

function initSettingsPanel() {
  const panel = document.getElementById('settingsPanel');
  if (!panel) { console.warn('[panels] settingsPanel 元素不存在'); return; }
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
  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn) { console.warn('[panels] exportBtn 元素不存在'); return; }
  const importBtn = document.getElementById('importBtn');
  const importFile = document.getElementById('importFileInput');

  // 导出
  exportBtn.addEventListener('click', function () {
    const data = { chatHistory: State.chatHistory, userMemory: State.userMemory, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const ds = now.getFullYear() +
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
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      try {
        const data = JSON.parse(ev.target.result);
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
          const ops = [];
          for (let i = 0; i < State.chatHistory.length; i++) {
            ops.push(saveMessage(State.chatHistory[i].role, State.chatHistory[i].content));
          }
          return Promise.all(ops);
        }).then(function () {
          return saveMemory();
        }).then(function () {
          // 清空并重新渲染聊天界面
          const chatMessages = document.getElementById('chatMessages');
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
  const input = document.getElementById('apiKeyInput');
  if (!input) { console.warn('[panels] apiKeyInput 元素不存在'); return; }
  const saveBtn = document.getElementById('saveApiKeyBtn');

  // 加载已保存的 key
  const saved = localStorage.getItem('morph-api-key');
  if (saved) { input.value = saved; }

  saveBtn.addEventListener('click', function () {
    const val = input.value.trim();
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
// 外部记忆导入面板（任务 5）
// ============================================================

function initMemoryPanel() {
  const panel = document.getElementById('memoryPanel');
  if (!panel) { console.warn('[panels] memoryPanel 元素不存在'); return; }
  const overlay = document.getElementById('memoryOverlay');
  const openBtn = document.getElementById('navMemoryBtn');
  const closeBtn = document.getElementById('memoryClose');
  const dropZone = document.getElementById('fileDropZone');
  const fileInput = document.getElementById('memoryFileInput');

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
    const file = e.dataTransfer.files[0];
    if (file) processMemoryFile(file);
  });

  // 文件选择
  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) processMemoryFile(file);
    fileInput.value = '';
  });

  function processMemoryFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'json' && ext !== 'txt') {
      showToast('仅支持 .json 和 .txt 文件');
      return;
    }
    const reader = new FileReader();
    reader.onload = function (ev) {
      const content = ev.target.result;

      // .json — 尝试解析为聊天记录
      if (ext === 'json') {
        try {
          const data = JSON.parse(content);
          if (data.chatHistory && Array.isArray(data.chatHistory)) {
            for (let i = 0; i < data.chatHistory.length; i++) {
              State.chatHistory.push(data.chatHistory[i]);
              saveMessage(data.chatHistory[i].role, data.chatHistory[i].content);
            }
            close();
            showToast('已导入 ' + data.chatHistory.length + ' 条消息');
            // 刷新界面
            const chatMessages = document.getElementById('chatMessages');
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
      }).catch(function (err) {
        console.warn('sendToAIFull 面板调用失败:', err);
        addMessage(API_FALLBACK_TEXT, 'echo');
      });
    };
    reader.readAsText(file);
  }
}
