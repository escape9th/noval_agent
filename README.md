<div align="center">

<img src="https://img.shields.io/badge/NovelAgent-v1.0-ff6b9d?style=for-the-badge&labelColor=1a1a2e" alt="NovelAgent"/>

### 写小说这件事，不该这么累  ༼ つ ╥﹏╥ ༽つ

**一个让你专心写故事、AI 帮你打杂的智能写作平台**

<br/>

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![Express](https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)

<br/>

<a href="#-功能特性">功能特性</a> · <a href="#-截图预览">截图</a> · <a href="#-快速开始">快速开始</a> · <a href="#-技术架构">架构</a> · <a href="#-支持的-ai-模型">AI 模型</a>

</div>

<br/>

## 为什么做这个？(・∀・(・∀・(・∀・*)

市面上的写作工具我基本都试过了，总差点意思 —

- 有的 AI 写作就是个高级补全，完全不懂网文节奏
- 有的功能够多但界面反人类，找个按钮要翻三层菜单
- 有的直接帮你写完，大纲都不问一句，写出来的东西跟你的故事毫无关系

所以做了 NovelAgent。核心理念很简单：

> **AI 先问后写，你是作者，AI 是助手。**

不会自作主张帮你写死剧情，而是先确认大纲、人设、走向，你觉得 OK 了再动笔。
写完还能从读者视角帮你找毒点、查语病、检测设定冲突。

简单说就是：**你负责创作，AI 负责打杂** 👌

<br/>

## 功能特性

<table>
<tr>
<td width="50%">

### ✍️ 多模式 AI 写作

三种模式随你选：

- **规划模式** — 只对话不动笔，帮你理清大纲、细纲、章纲，反复打磨
- **写作模式** — 按照你的设定写作，续写、改写、全章生成，分步确认
- **自动模式** — AI 自己判断，该聊时聊，该写时写

</td>
<td width="50%">

### 🤖 四大 AI 能力

- **代写** — 大纲 → 细纲 → 章纲 → 正文，分步创作
- **评价** — 读者视角找毒点、降智、动机缺失
- **检查** — 语病、错别字、设定冲突、人设冲突
- **文风** — 8 种预设风格，也能从你的文章里提取

</td>
</tr>
<tr>
<td width="50%">

### 📝 编辑器体验

- VS Code 式三栏布局，目录 / 编辑 / AI 一目了然
- CodeMirror 6 编辑器，中文输入丝滑
- 章节拖拽排序，自动保存不怕丢
- 外部文本粘贴，自动按章节拆分

</td>
<td width="50%">

### 🎨 主题 & 其他

- 三套主题：深色 / 浅色 / 暖色
- 暖色主题带樱花飘落 + 星星闪烁特效 ✨
- 中英双语界面
- 多项目管理，同时写几本都行
- 一键启动，本地运行

</td>
</tr>
</table>

<br/>

## 截图预览

<div align="center">


> 截图待补充，先 clone 下来自己体验一下吧 (少女祈祷中...)

</div>

<br/>

## 快速开始

只需要 Node.js，其他都不用装。

### 克隆 & 安装

```bash
git clone https://github.com/escape9th/noval_agent.git
cd noval_agent
npm run install:all
```

### 启动

**Windows 用户：** 双击 `start.bat`，一键搞定

**手动启动：**

```bash
# 终端 1 — 后端
cd server && npm run dev

# 终端 2 — 前端
cd client && npm run dev
```

浏览器打开 `http://localhost:5173`，注册账号，填个 API Key 就能用了。

> API Key 在设置页填，支持 DeepSeek、通义千问、Moonshot 等 OpenAI 兼容接口。填完点「测试连接」验证一下就好。

<br/>

## 支持的 AI 模型

只要是 OpenAI 兼容格式的 API 都行，下面是常用的几个：

| 服务商 | 推荐模型 | 说明 |
|:---|:---|:---|
| **DeepSeek** | `deepseek-chat` | 性价比之王，写中文很稳 |
| **通义千问** | `qwen-plus` | 阿里出品，中文理解好 |
| **Moonshot** | `moonshot-v1-8k` | Kimi 背后的模型 |
| **智谱 GLM** | `glm-4` | 国产老牌选手 |
| **OpenAI** | `gpt-4o` | 贵但强 |

<br/>

## 技术架构

```
noval_agent/
├── client/                 前端 React 应用
│   └── src/
│       ├── components/     UI 组件
│       │   ├── Editor/     CodeMirror 编辑器
│       │   ├── Chat/       AI 聊天面板
│       │   └── Theme/      主题系统（深色/浅色/暖色）
│       ├── pages/
│       │   ├── Dashboard   项目列表
│       │   ├── ProjectView 主编辑界面（三栏布局）
│       │   └── Settings    全局设置
│       ├── stores/         Zustand 状态管理
│       ├── services/       API 调用（含 SSE 流式传输）
│       └── i18n/           中英双语
│
├── server/                 后端 Express 应用
│   └── src/
│       ├── services/ai/    多 Agent 系统
│       │   ├── agent.ts    Agent 调度器
│       │   ├── planner.ts  规划 Agent
│       │   ├── writer.ts   写作 Agent
│       │   ├── evaluator.ts评价 Agent
│       │   ├── checker.ts  检查 Agent
│       │   └── styleEngine 文风引擎
│       ├── routes/         API 路由
│       └── db/             SQLite 数据库
│
├── shared/                 共享类型定义
└── start.bat               Windows 一键启动
```

<br/>

## 开发

```bash
npm run install:all        # 安装所有依赖

cd server && npm run dev   # 后端 :3001（热重载）
cd client && npm run dev   # 前端 :5173（热重载）
```

<br/>

---

<div align="center">

**觉得还不错？给个 Star 鼓励一下呗 (//∇//)⭐**

**可能会有些小问题，本人会经常使用这个项目所以会尽可能去修，见谅🦀**

MIT License · Made with ❤️ by [escape9th](https://github.com/escape9th)

</div>
