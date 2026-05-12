// mobile.js - 移动端交互：页面切换、抽屉菜单、位置权限、AI设置

// ============================================================
// 移动端导航（联系人 → 聊天页面切换）
// ============================================================

let _mobileNavInitialized = false;
// 移动端消息渲染计数器，记录已渲染的消息数量
let _mobileRenderedCount = 0;

/**
 * 增量渲染移动端聊天消息
 * 只渲染从 _mobileRenderedCount 到 State.chatHistory.length 的新增消息
 * 避免每次切换页面时清空 DOM 重建全部气泡
 */
function renderMobileMessages() {
  const mobileContainer = document.getElementById('mobileChatMessages');
  if (!mobileContainer) return;
  const targetHistory = State.currentCharacter === 'echo' ? State.chatHistory : State.lensHistory;
  const senderName = State.currentCharacter === 'echo' ? 'echo' : 'lens';
  // 检查容器中子元素数量是否和历史匹配，不匹配则清空重建
  // （角色切换时 _mobileRenderedCount 比实际消息数多，需要清空）
  if (mobileContainer.children.length > targetHistory.length ||
      mobileContainer.children.length === 0 && targetHistory.length > 0) {
    mobileContainer.innerHTML = '';
    _mobileRenderedCount = 0;
  }
  // 从上次渲染的位置开始增量追加
  for (let i = _mobileRenderedCount; i < targetHistory.length; i++) {
    const msg = targetHistory[i];
    const sender = msg.role === 'user' ? 'user' : senderName;
    // 对 Echo 和棱镜的长回复进行分段显示
    if ((sender === 'echo' || sender === 'lens') && msg.content.length > 30 && typeof splitIntoMessages === 'function') {
      const segments = splitIntoMessages(msg.content);
      for (let s = 0; s < segments.length; s++) {
        const wrapper = document.createElement('div');
        wrapper.className = 'message ' + sender;
        const bubble = document.createElement('div');
        bubble.className = 'bubble ' + sender;
        bubble.textContent = segments[s].text;
        wrapper.appendChild(bubble);
        mobileContainer.appendChild(wrapper);
      }
    } else {
      const wrapper = document.createElement('div');
      wrapper.className = 'message ' + sender;
      const bubble = document.createElement('div');
      bubble.className = 'bubble ' + sender;
      bubble.textContent = msg.content;
      wrapper.appendChild(bubble);
      mobileContainer.appendChild(wrapper);
    }
  }
  // 更新计数器
  _mobileRenderedCount = targetHistory.length;
  // 滚动到底部
  mobileContainer.scrollTop = mobileContainer.scrollHeight;
}

function initMobileNavigation() {
  if (_mobileNavInitialized) return;
  _mobileNavInitialized = true;

  const contactsPage = document.getElementById('contactsPage');
  if (!contactsPage) return;  // 桌面端不执行

  const chatPage = document.getElementById('mobileChatPage');
  const echoContact = document.getElementById('mobileEchoContact');
  const backBtn = document.getElementById('mobileBackBtn');

  // 默认显示联系人页
  contactsPage.classList.add('show');

  // 点击联系人 → 进入聊天
  echoContact.addEventListener('click', function () {
    contactsPage.classList.remove('show');
    chatPage.classList.add('show');
    switchCharacter('echo');        // 切换角色到 Echo
    // 增量渲染，不清空 DOM，不闪烁
    renderMobileMessages();
  });

  // 棱镜移动端联系人
  const lensContact = document.getElementById('mobileLensContact');
  if (lensContact) {
    lensContact.addEventListener('click', function () {
      contactsPage.classList.remove('show');
      chatPage.classList.add('show');
      switchCharacter('lens');        // 切换角色到棱镜
      renderMobileMessages();
    });
  }

  // 返回按钮
  backBtn.addEventListener('click', function () {
    chatPage.classList.remove('show');
    contactsPage.classList.add('show');
  });

  // 绑定移动端发送按钮
  const mobileInput = document.getElementById('mobileUserInput');
  const mobileSendBtn = document.getElementById('mobileSendBtn');
  const mobileContainer = document.getElementById('mobileChatMessages');
  bindSendButton(mobileInput, mobileSendBtn, mobileContainer);
}

// ============================================================
// 移动端 AI 设置弹出层（将 aiSettingsPanel 临时移到 body）
// ============================================================

function openMobileAiSettings() {
  const panel = document.getElementById('aiSettingsPanel');
  if (!panel) return;

  // 创建遮罩
  const overlay = document.createElement('div');
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
  const panel = document.getElementById('aiSettingsPanel');
  const overlay = document.getElementById('aiSettingsMobileOverlay');
  if (!panel) return;

  // 移回下拉菜单内部
  const originalParent = document.querySelector('.dropdown-menu');
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

let _drawerInitialized = false;
function initDrawer() {
  if (_drawerInitialized) return;
  _drawerInitialized = true;

  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('drawer');
  const contactsPage = document.getElementById('contactsPage');
  if (!overlay || !drawer) return;

  function open()  { overlay.classList.add('show'); drawer.classList.add('show'); }
  function close() { overlay.classList.remove('show'); drawer.classList.remove('show'); }

  // 头像按钮打开抽屉
  const mobileAvatarBtn = document.getElementById('mobileAvatarBtn');
  const drawerAvatarBtn = document.getElementById('drawerAvatar');
  if (mobileAvatarBtn) mobileAvatarBtn.addEventListener('click', open);
  if (drawerAvatarBtn) drawerAvatarBtn.addEventListener('click', open);

  // 遮罩关闭
  overlay.addEventListener('click', close);

  // 菜单项点击
  drawer.addEventListener('click', function (e) {
    const item = e.target.closest('.drawer-item');
    if (!item) return;
    const action = item.dataset.action;

    if (action === 'profile')     { close(); openProfileModal(); }
    if (action === 'memory')      { close(); document.getElementById('navMemoryBtn').click(); }
    if (action === 'settings')    { close(); document.getElementById('navSettingsBtn').click(); }
    if (action === 'ai-settings') { close(); openMobileAiSettings(); }
    if (action === 'clear')       { close(); openConfirmDialog(); }
    if (action === 'about-echo' || action === 'about-lens') { close(); openAbout(); }
  });

  // 右滑打开手势（仅在联系人页生效）
  if (!contactsPage) return;
  let touchStartX = 0;
  let touchStartY = 0;

  contactsPage.addEventListener('touchstart', function (e) {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  contactsPage.addEventListener('touchend', function (e) {
    const dx = (e.changedTouches[0] ? e.changedTouches[0].clientX : touchStartX) - touchStartX;
    const dy = Math.abs((e.changedTouches[0] ? e.changedTouches[0].clientY : touchStartY) - touchStartY);

    // 右滑超过 50px 且水平位移大于垂直位移
    if (dx > 50 && dx > dy * 1.5 && touchStartX < 40) {
      open();
    }
  });
}

// ============================================================
// 位置权限开关设置
// ============================================================

function initLocationToggle() {
  const toggle = document.getElementById('locationToggle');
  if (!toggle) return;

  toggle.checked = localStorage.getItem('morph-location-enabled') !== 'false';

  toggle.addEventListener('change', function () {
    localStorage.setItem('morph-location-enabled', toggle.checked ? 'true' : 'false');
  });
}
