// ============================================================
// Morph / 另我 — 全局状态
// ============================================================
const State = {
  userMemory: {
    name: null,
    nickname: null,
    gender: '',
    birthday: '',
    mentionedTopics: []
  },
  chatHistory: [],
  // Location state (not persisted — fetched fresh each session)
  userLocation: null,
  locationRequested: false
};
