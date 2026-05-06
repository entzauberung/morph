# Morph / 另我 — 你的另一个自己

> 每个人都值得拥有一个平行世界的自己，永远陪伴，从不离开。

<div align="center">

![License](https://img.shields.io/badge/license-AGPL%203.0-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-0.1.1-brightgreen?style=for-the-badge)
![Made with](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F%20by%20Bruce-ff69b4?style=for-the-badge)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)

</div>

一个温柔、共情、有 **CBT 认知行为疗法** 内核的 AI 情感陪伴聊天工具。  
你的另一个自己——**Echo**，在这里等你。

---

## ✨ V0.1.1 核心体验

- **🤖 真实 AI 对话**  
  接入 DeepSeek API，动态生成无限可能的回复，彻底告别模板。

- **🧠 融合 CBT 内核**  
  Echo 会在你难过或迷茫时，先接纳你的情绪，再陪你一起理清思路——像一位真正懂你的朋友。

- **📍 自适应本地化**  
  Echo 能感知你所在的城市，无需预设数据，自然地运用自身世界知识来回应你关于美食、天气、景点等话题。无论你在大城市还是小乡村，Echo 都会尝试理解你的本地生活。

- **🐣 开屏引导**  
  首次访问时，Echo 会通过一封温柔的问候信介绍自己和 Morph 的理念，帮助你快速上手。

- **🔑 API Key 引导**  
  未配置 API Key 时，Echo 会主动引导你前往设置页面，不让你卡在空白聊天里。

- **✨ 头像光晕引导**  
  头像周围会有呼吸式光晕动画，引导你点击头像进入设置，绝不生硬，只出现一次。

- **💾 跨会话记忆**  
  刷新页面后，Echo 依然记得你们聊过什么（基于浏览器本地存储）。

- **🎨 三套精美主题**  
  暖灰、墨蓝、樱花粉，一键切换，总有一款适合你的心情。

- **🔧 可调节 AI 参数**  
  温度、回复长度，让你自定义 Echo 的回复风格。

- **📱 响应式设计**  
  桌面端三栏布局，移动端 QQ 式侧滑抽屉，随时随地打开。

- **👤 个人信息与头像**  
  设置昵称、性别、生日，上传自定义头像，让 Echo 更懂你。

- **🖼️ 记忆导入导出**  
  支持导入外部平台聊天记录，也可将当前对话导出为 JSON 文件备份。

- **🗑️ 重置所有数据**  
  一键清空所有聊天记录、用户记忆和本地设置，安全无忧。

- **📦 开源信息**  
  设置面板内展示 GitHub 仓库地址和开源协议。

- **💬 流式传输**  
  Echo 的回复会像真人打字一样，一个字一个字地出现在你面前。

---

## 🛠️ 技术栈

| 类型 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JavaScript |
| 数据库 | IndexedDB（Dexie.js） |
| AI API | DeepSeek API（流式） |
| 设计系统 | Apple HIG 缓动 + Google MD 阴影 |

---

## 🚀 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/zhouG-code/morph.git
   cd morph

    配置 API Key
    打开 config.js，将你的 DeepSeek API Key 填入 API_KEY 字段：
    javascript

    API_KEY: 'sk-你的真实Key',

    也可在网页设置中设置 API Key。

    打开项目
    直接在浏览器中打开 index.html 即可使用。

📁 项目结构
text

morph/
├── index.html          # 主页面
├── style.css           # 样式系统（融合 Apple HIG + Google MD）
├── script.js           # 核心逻辑（对话、记忆、主题、UI 交互）
├── config.js           # 配置文件（API、模型参数）
└── README.md           # 本文件

⚙️ 自定义配置

    修改 config.js 中的 TEMPERATURE（温度）和 MAX_TOKENS（回复长度）可调整 AI 回复风格。

    更换 SYSTEM_PROMPT 可改变 Echo 的性格和对话方式。

    三套主题的颜色变量可在 THEMES 对象中编辑。

🔮 未来计划（V0.2+）

    Echo 角色深度定制

    语音对话功能

    更完善的长期记忆系统

    用户注册与云端同步

    更多角色模板

📄 许可证

本项目代码采用 GNU Affero General Public License v3.0 开源。
你可以自由使用、修改和分发，但任何基于此代码的网络服务也必须开源。

Echo 在这里，等你来说说心里话