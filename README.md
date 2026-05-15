<div align="center">

# NovelAgent

**AI 驱动的智能小说写作平台 — 专为网文创作者打造**

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)
![Express](https://img.shields.io/badge/Express.js-4-000000?style=flat-square&logo=express)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

<br/>

[功能特性](#功能特性) · [快速开始](#快速开始) · [截图预览](#截图预览) · [技术架构](#技术架构) · [AI 模型](#支持的-ai-模型)

</div>

---

## 为什么做这个？

市面上的写作软件，要么 AI 功能弱，要么不符合网文创作习惯。NovelAgent 的目标很简单：

> **让 AI 真正理解网文创作流程，而不是当一个万能补全工具。**

- AI **先问后写**：不会自作主张，先确认大纲、人设、走向，再动笔
- 多 Agent 协作：规划、写作、评价、检查，各司其职
- 文风可定制：内置金庸、鲁迅、江南等 8 种文风，也能从你的文章中提取风格

---

## 功能特性

### 多模式 AI 写作

| 模式 | 说明 |
|:---:|:---|
| **规划模式** | 只对话不动笔，AI 帮你理清大纲、细纲、章纲，反复打磨到满意 |
| **写作模式** | AI 按照大纲和设定写作，续写、改写、全章生成，分步确认 |
| **自动模式** | AI 自行判断意图，该规划时规划，该动笔时动笔 |

### 四大 AI 能力

- **代写** — 续写、改写、全章生成，支持大纲 → 细纲 → 章纲 → 正文的分步创作
- **评价** — 读者视角客观评价，检测毒点、降智、动机缺失等常见问题
- **检查** — 语病、错别字、设定冲突（区分伏笔）、人设冲突
- **文风 Skill** — 8 种预设文风 + 自定义文风提取，一键切换写作风格

### 编辑器体验

- VS Code 式三栏布局：左侧章节目录 / 中间编辑区 / 右侧 AI 聊天面板
- CodeMirror 6 编辑器，流畅的中文输入体验
- 章节拖拽排序，自动保存
- 支持从外部粘贴大量文本，按章节自动拆分

### 其他

- 多项目管理，同时进行多本小说创作
- 三套主题：深色 / 浅色 / 暖色（二次元风格，带樱花飘落特效）
- 中英双语界面
- 一键启动，本地运行

---

## 截图预览

<div align="center">

### 项目管理
<!-- 将截图放到 docs/ 文件夹后取消注释 -->
<!-- ![Dashboard](docs/dashboard.png) -->
`待补充截图`

### 主编辑界面
<!-- ![Editor](docs/editor.png) -->
`待补充截图`

### 暖色主题
<!-- ![Theme](docs/theme.png) -->
`待补充截图`

</div>

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 1. 克隆项目

```bash
git clone https://github.com/escape9th/noval_agent.git
cd noval_agent
```

### 2. 安装依赖

```bash
npm run install:all
```

### 3. 启动

**方式一：一键启动（Windows）**

双击 `start.bat`，自动启动前后端并打开浏览器。

**方式二：手动启动**

```bash
# 终端 1 — 启动后端
cd server
npm run dev

# 终端 2 — 启动前端
cd client
npm run dev
```

### 4. 开始使用

浏览器访问 `http://localhost:5173`，注册账号后进入设置页，填写 API Key 即可。

---

## 支持的 AI 模型

任何 OpenAI 兼容格式的 API 均可使用：

| 服务商 | 推荐模型 |
|:---|:---|
| DeepSeek | deepseek-chat |
| 通义千问 | qwen-plus |
| Moonshot | moonshot-v1-8k |
| 智谱 GLM | glm-4 |
| OpenAI | gpt-4o |

在设置页填写 API Key、Base URL 和模型名称，点击「测试连接」验证即可。

---

## 技术架构

```
noval_agent/
├── client/                # 前端 React 应用
│   └── src/
│       ├── components/    # UI 组件
│       │   ├── Layout/    # 布局框架
│       │   ├── Editor/    # CodeMirror 编辑器
│       │   ├── Chat/      # AI 聊天面板
│       │   └── Theme/     # 主题系统
│       ├── pages/         # 页面
│       │   ├── Dashboard  # 项目列表
│       │   ├── ProjectView# 主编辑界面（三栏）
│       │   └── Settings   # 全局设置
│       ├── stores/        # Zustand 状态管理
│       ├── services/      # API 调用层（含 SSE 流式传输）
│       ├── i18n/          # 国际化
│       └── themes/        # 主题定义
├── server/                # 后端 Express 应用
│   └── src/
│       ├── routes/        # API 路由
│       ├── services/
│       │   └── ai/        # 多 Agent 系统
│       │       ├── agent.ts       # Agent 调度器
│       │       ├── planner.ts     # 规划 Agent
│       │       ├── writer.ts      # 写作 Agent
│       │       ├── evaluator.ts   # 评价 Agent
│       │       ├── checker.ts     # 检查 Agent
│       │       └── styleEngine.ts # 文风引擎
│       ├── middleware/    # JWT 认证中间件
│       └── db/            # SQLite 数据库
├── shared/                # 共享类型定义
└── start.bat              # Windows 一键启动
```

---

## 开发

```bash
# 安装依赖
npm run install:all

# 开发模式（热重载）
cd server && npm run dev   # 后端 :3001
cd client && npm run dev   # 前端 :5173

# 构建
cd client && npm run build
cd server && npm run build
```

---

## 许可证

[MIT](LICENSE)

---

<div align="center">

**如果觉得有帮助，点个 Star 支持一下**

</div>
