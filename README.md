# NovelAgent - 小说写作辅助器

AI 驱动的智能小说写作平台，专为网文创作者打造。

## 功能特性

- **多模式 AI 写作** — 规划 / 写作 / 自动三种模式，AI 先问后写
- **代写** — 续写、改写、全章生成，支持大纲→细纲→章纲→正文的分步创作
- **评价** — 读者视角客观评价，检测毒点、降智、动机缺失等问题
- **检查** — 语病、错别字、设定冲突（区分伏笔）、人设冲突
- **文风 Skill** — 8 种预设文风（金庸、鲁迅、江南、新海诚等）+ 自定义文风提取
- **VS Code 式编辑器** — 左侧章节目录 / 中间编辑区 / 右侧 AI 聊天面板
- **多项目管理** — 同时进行多本小说创作
- **主题切换** — 深色 / 浅色 / 暖色（二次元风格）
- **中英双语** — 支持中文和英文界面

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + TypeScript + TailwindCSS + CodeMirror 6 |
| 后端 | Express.js + TypeScript + SQLite |
| AI | OpenAI 兼容接口（支持 DeepSeek、通义千问、Moonshot 等） |
| 状态管理 | Zustand |
| 国际化 | i18next |

## 快速开始

### 1. 安装依赖

```bash
npm run install:all
```

### 2. 启动项目

**方式一：双击桌面快捷方式**

运行 `start.bat` 会自动启动前后端并打开浏览器。

**方式二：手动启动**

```bash
# 终端 1 - 启动后端
cd server
npm run dev

# 终端 2 - 启动前端
cd client
npm run dev
```

### 3. 打开浏览器

访问 `http://localhost:5173`，注册账号后进入设置页填写 API Key 即可使用。

## 支持的 AI 模型

任何 OpenAI 兼容格式的 API 均可使用：

- OpenAI（GPT-4o 等）
- DeepSeek
- 通义千问
- Moonshot
- 智谱 GLM
- 其他兼容 OpenAI 格式的服务

在设置页填写 API Key、Base URL 和模型名称，点击「测试连接」验证即可。

## 项目结构

```
noval_agent/
├── client/          # 前端 React 应用
│   └── src/
│       ├── components/   # UI 组件
│       ├── pages/        # 页面
│       ├── stores/       # Zustand 状态管理
│       ├── services/     # API 调用层
│       ├── hooks/        # 自定义 Hooks
│       ├── i18n/         # 国际化
│       └── themes/       # 主题配置
├── server/          # 后端 Express 应用
│   └── src/
│       ├── routes/       # API 路由
│       ├── services/     # 业务逻辑
│       │   └── ai/       # 多 Agent 系统
│       ├── middleware/    # 中间件
│       └── db/           # 数据库
├── shared/          # 共享类型定义
└── start.bat        # 一键启动脚本
```

## 许可证

MIT
