# 便签 v2 — Sticky Notes Desktop App

基于 Electron + SQLite 的桌面知识记录系统，支持 Markdown、分区管理、日历回溯、多主题切换。

## 特性

- **三栏桌面布局** — 侧边栏 | 便签列表 | 编辑器，类 VS Code / Notion 风格
- **Markdown 编辑** — 实时预览，自动保存，Ctrl+S 手动保存
- **分区系统** — 预置 6 个分区，支持自定义创建/删除
- **日历回溯** — 迷你月历 + 日期选择器，任意历史日期翻阅
- **标签系统** — 多标签，标签筛选
- **全文搜索** — 搜索内容 + 标签 + 时间组合筛选
- **8 套主题** — 可爱粉 / 极简白 / HelloKitty / 海盐蓝 / 森系绿 / 落日橘 / 薰衣草 / 暗夜
- **面板动画** — 编辑器滑入滑出，卡片列表渐入
- **系统托盘** — 最小化到托盘，点击唤出
- **全局快捷键** — Ctrl+Shift+N 显隐窗口，Ctrl+N 新建，Ctrl+S 保存
- **始终置顶** — 悬浮在所有窗口之上

## 技术栈

- **Electron** — 桌面壳
- **sql.js** — SQLite (WebAssembly，无需编译)
- **marked** — Markdown 渲染
- **原生 HTML/CSS/JS** — 无框架

## 快速开始

```bash
# 安装依赖（国内用户需设 Electron 镜像）
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install

# 启动
npm start
```

> 如果 Electron 下载失败，手动解压到 `node_modules/electron/dist/` 并创建 `path.txt` 内容为 `electron.exe`。

## 项目结构

```
便签app/
├── main.js          # Electron 主进程（窗口/托盘/快捷键/IPC）
├── preload.js       # contextBridge 安全桥接
├── database.js      # SQLite CRUD 封装
├── package.json
└── renderer/
    ├── index.html   # 三栏布局
    ├── style.css    # 8 套主题设计系统
    ├── renderer.js  # UI 逻辑
    └── marked.umd.js # Markdown 渲染器
```

## 数据存储

便签数据保存在 `%APPDATA%/sticky-notes-v2/notes.db`（SQLite），备份此文件即可迁移数据。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+N | 显示/隐藏窗口 |
| Ctrl+N | 新建便签 |
| Ctrl+S | 保存当前便签 |
| Esc | 关闭编辑器 |

## License

MIT
