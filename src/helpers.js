// helpers.js - 工具函数（纯函数+通用工具）

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

function requestLocation() {
  if (State.locationRequested) return;
  State.locationRequested = true;

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
              State.userLocation = city;

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
                State.chatHistory.push({ role: 'assistant', content: greeting });
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
