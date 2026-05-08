// data.js - 数据持久化层

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
      State.chatHistory.push({ role: msg.role, content: msg.content });
    });
  } catch (e) {
    console.warn('IndexedDB 读取失败，以空历史启动:', e);
  }
}

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
