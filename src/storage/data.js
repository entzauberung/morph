// data.js - 数据持久化层

// ============================================================
// IndexedDB 持久化（Dexie.js）
// ============================================================

const db = new Dexie('MorphDatabase');
db.version(1).stores({
  messages: '++id, role, content, timestamp',
  userInfo: 'key'
});

/**
 * 这个函数相当于：你打开聊天软件时，它自动去“浏览器的记忆盒”（IndexedDB 本地仓库）
 * 里把之前所有的聊天记录翻出来，按时间顺序排好，然后全部摆到 State.chatHistory 这个“桌子”上。
 *
 * 📥 输入：没有参数。它自己去找数据库里名为 messages 的文件夹的所有内容。
 * 📤 输出：没有返回值。但它的效果是修改了 State.chatHistory 数组（往里面添加了所有历史消息）。
 * 界面上的聊天框会读这个数组，所以界面上就会显示出过去的聊天内容。
 *
 * 🔁 它调用了 db 这个对象的 orderBy('id').toArray() 方法。
 * 这个 db 来自另一个文件，它的作用就是连接浏览器的本地仓库，
 * 帮我们按消息编号从小到大排好序，然后把所有记录一次性拿出来。
 */
async function loadChatHistory() {
  try {
    const allMessages = await db.messages.orderBy('id').toArray();
    if (allMessages && allMessages.length > 0) {
      allMessages.forEach(function (msg) {
        State.chatHistory.push({ role: msg.role, content: msg.content });
      });
      return;  // IndexedDB 有数据，直接用
    }
  } catch (e) {
    console.warn('IndexedDB 读取失败:', e);
  }
  // IndexedDB 为空或读取失败时，从 localStorage 的独立备份恢复
  try {
    const raw = localStorage.getItem('morph-messages-ls');
    if (raw) {
      const messages = JSON.parse(raw);
      messages.forEach(function (msg) {
        State.chatHistory.push({ role: msg.role, content: msg.content });
      });
      console.log('从 localStorage 恢复聊天记录: ' + messages.length + ' 条');
    }
  } catch (e) {
    console.warn('localStorage 读取失败:', e);
  }
}

/**
 * 从浏览器的本地数据库里，把之前保存的用户基本信息（名字、昵称、性别、生日、聊过的话题）读出来，
 * 然后一股脑儿塞进程序的“记忆盒子” State.userMemory 里，方便后面展示或使用。
 * 如果读不到，就保持记忆盒子是空的（默认值），不会报错，只是偷偷在控制台说一句“读取失败”。
 */
async function loadUserMemory() {
  try {
    const saved = await db.userInfo.get('memory');
    if (saved) {
      State.userMemory.name = saved.name || null;
      State.userMemory.nickname = saved.nickname || null;
      State.userMemory.gender = saved.gender || '';
      State.userMemory.birthday = saved.birthday || '';
      State.userMemory.mentionedTopics = saved.mentionedTopics || [];
    }
  } catch (e) {
    console.warn('IndexedDB 读取记忆失败:', e);
  }
}

/**
 * 保存当前用户的聊天记忆到浏览器本地数据库
 * 
 * 就像一个“标签为 memory 的便利贴”，把用户的名字、昵称、性别、生日、聊过的话题
 * 都贴到 userInfo 这个文件夹里。以后打开页面可以再读出来，让 AI 记住用户。
 * 
 * @param {无} - 依赖全局状态 State.userMemory
 * @returns {无} - 只有成功或失败都不影响页面，失败只会悄悄提醒
 * 
 * 调用 db.userInfo.put()   —— IndexedDB 的存储方法，在 db 初始化文件里
 */
async function saveMemory() {
  try {
    await db.userInfo.put({
      key: 'memory',
      name: State.userMemory.name,
      nickname: State.userMemory.nickname,
      gender: State.userMemory.gender,
      birthday: State.userMemory.birthday,
      mentionedTopics: State.userMemory.mentionedTopics
    });
  } catch (e) {
    console.warn('IndexedDB 保存记忆失败:', e);
  }
}

// 存一条新消息：把纸条贴到日记本里；如果本子太厚，就扔掉最旧的一半
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
  // 无论 IndexedDB 成功还是失败，都独立追加备份到 localStorage（不依赖 IndexedDB 读取）
  appendMessageToLocalStorage(role, content);
}

/**
 * 直接追加单条消息到 localStorage（不依赖 IndexedDB 读取）
 * 这是为了兼容 Edge / 国产浏览器中 IndexedDB 读取不稳定的问题
 * @param {string} role - 消息角色：'user' 或 'assistant'
 * @param {string} content - 消息文本内容
 */
function appendMessageToLocalStorage(role, content) {
  try {
    const LS_MESSAGES_KEY = 'morph-messages-ls';
    let messages = [];
    // 读取现有 localStorage 中的消息列表
    try {
      const raw = localStorage.getItem(LS_MESSAGES_KEY);
      if (raw) messages = JSON.parse(raw);
    } catch (e) { /* 忽略解析错误 */ }
    // 追加新消息
    messages.push({ role: role, content: content, timestamp: Date.now() });
    // 同样受 MAX_PERSIST 限制，避免撑爆 localStorage（5MB限制）
    const limit = (typeof CONFIG !== 'undefined' && CONFIG.HISTORY && CONFIG.HISTORY.MAX_PERSIST)
      ? CONFIG.HISTORY.MAX_PERSIST
      : 500;
    if (messages.length > limit) {
      messages = messages.slice(Math.floor(limit / 2));
    }
    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(messages));
  } catch (e) {
    // 备份失败不影响主流程，静默处理
  }
}
