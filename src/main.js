// main.js - 启动入口：按正确顺序初始化所有模块

document.addEventListener('DOMContentLoaded', async function () {
  await loadChatHistory();
  await loadUserMemory();

  // ====== 新增：检测 IndexedDB 是否为空，若为空则尝试从 localStorage 恢复 ======
  if (State.chatHistory.length === 0) {
    const restored = await restoreFromLocalStorage();
    if (restored) {
      // 恢复成功，重新加载数据到内存（清空后重新 load，防止重复）
      State.chatHistory = [];
      await loadChatHistory();
      await loadUserMemory();
    }
  }
  // ====== 新增结束 ======

  loadTheme();

  const inputEl = document.getElementById('userInput');
  const sendBtnEl = document.getElementById('sendBtn');

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

  // 渲染桌面端历史消息
  if (State.chatHistory.length === 0) {
    initWelcomeBubble();
  } else {
    renderHistoryMessages();
    // 同步移动端渲染计数器，确保增量渲染从正确位置开始
    if (typeof _mobileRenderedCount !== 'undefined') {
      _mobileRenderedCount = State.chatHistory.length;
    }
  }

  initSendButton();
});
