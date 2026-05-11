// src/streamSplitter.js — 消息分段引擎

/**
 * 将长文本按句子边界拆分成多条短消息
 * 算法逻辑与流式分段一致：遇到句子结束符且达到最小长度即切分
 * @param {string} text - 完整回复文本
 * @param {number} maxLen - 每段最大字符数（默认 60，兼容调用，算法中实际用于参考）
 * @param {number} minLen - 每段最小字符数（默认 30，达到此长度且遇到句子结束符即切）
 * @returns {Array<{text: string, delay: number}>} 分段数组，每段带延迟
 */
function splitIntoMessages(text, maxLen, minLen) {
  maxLen = maxLen || 60;
  minLen = minLen || 30;
  if (!text) return [{ text: text, delay: 0 }];
  // Step 1：按句子边界拆分（和流式分段逻辑一致）
  const rawSegments = [];
  let current = '';
  for (let i = 0; i < text.length; i++) {
    current += text[i];
    // 遇到句子结束符 且 积累文本 >= minLen 时切分
    if ('。！？……'.includes(text[i]) && current.length >= minLen) {
      rawSegments.push(current);
      current = '';
    }
  }
  // 剩余文本作为最后一段
  if (current) rawSegments.push(current);
  // 如果没有拆开，整段返回
  if (rawSegments.length <= 1) {
    return [{ text: text, delay: 0 }];
  }
  // 直接返回分段结果（不再合并短段，与流式分段逻辑一致）
  return rawSegments.map(function (seg, i) {
    return {
      text: seg,
      delay: i < rawSegments.length - 1 ? 700 : 0
    };
  });
}
