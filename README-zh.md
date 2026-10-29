# lovia-react

[English](./README.md) | **简体中文**

在 [lovia](https://github.com/cymoo/lovia) 内置聊天界面的基础上，用 React 扩展更多页面。
聊天部分——会话、流式输出、工具调用、审批、定时任务、记忆——直接复用 lovia 自带的页面；
其余页面（仪表盘、表单、业务面板等）用 React 编写，以 lovia
[view](https://github.com/cymoo/lovia/blob/main/docs/zh/web-server.md) 的形式挂载到这个页面中。

```text
backend/    Python（uv）：lovia Agent，由 create_app 提供服务，
            ChatUI 把 React 构建产物作为扩展脚本加载
  app/        main.py（Agent 与应用）、__main__.py（命令行）、ui/（模板与构建产物）
  tests/
frontend/   Vite + React 19 + TypeScript、Tailwind v4、shadcn/ui、
            TanStack Query、Recharts——构建输出到 backend/app/ui/dist/
```

## 安装

```bash
cd backend && uv sync --extra dev    # Python 依赖（backend/.venv）
cp .env.example .env                 # 然后填写 LOVIA_MODEL 及对应的 key
cd ../frontend && npm install
```

## 开发

需要两个进程；修改 React 代码后，会在聊天页面中原地热更新；修改 `backend/app/`
下的 Python 代码后，服务会自动重启。

```bash
cd frontend && npm run dev           # Vite，端口 5173
cd backend && uv run lovia-react --dev   # lovia，端口 8000，从 Vite 加载前端
```

重启会切断正在流式输出的回答的连接：页面会显示网络错误，但服务端会把这次运行完成
（或保存为可恢复的 checkpoint），刷新页面即可看到。

## 构建与运行

```bash
cd frontend && npm run build         # → backend/app/ui/dist/app.{js,css}
cd backend && uv run lovia-react     # 直接使用构建产物，运行时不需要 Node
```

监听非本机地址（`--host 0.0.0.0`）时 API 需要令牌：`lovia-react` 每次启动会生成一个，
并打印带令牌的访问链接。
也可以作为 ASGI 应用运行（在 `backend/` 下）：`uvicorn --factory app.main:create`。

## 新增页面

1. 在 `frontend/src/views/<name>/` 下编写一个接收 `ViewProps` 的组件。
2. 在 `frontend/src/main.tsx` 中注册：
   `lovia.registerView('<id>', reactView(title, Component))`。
3. 在 `backend/app/ui/index.html` 的 `sidebar_nav` block 中加入口：
   `<a href="?view=<id>">…</a>`（文案写在 `backend/app/main.py` 的 `MESSAGES` 中）。

在 view 中，可以通过 `@/lib/lovia` 以带类型的方式访问页面能力：
`useLoviaState()`（当前对话、主题、语言、是否运行中）、`useLoviaEvent()`、
用于调用 lovia [HTTP API](https://github.com/cymoo/lovia/blob/main/docs/zh/http-api.md)
或自定义路由的 `apiJson()`，以及 `lovia.send / setDraft / newChat / openSession /
toast`。子页面通过 URL 表示：`?view=<id>/<path>`（即 `ViewProps.path`）。

## 样式

shadcn/ui 的颜色、圆角和阴影都映射到 lovia 的设计 token 上，因此 React 页面会自动跟随
聊天页的主题、强调色和暗色模式。Tailwind 不启用 Preflight（否则会重置整个页面的样式）——
详见 `frontend/src/index.css` 文件头的说明；`backend/tests/test_ui_css.py` 会检查构建产物
读取的每个 lovia token 是否仍然存在。

## 检查

```bash
cd backend && uv run pytest && uv run ruff check . && uv run mypy app
cd frontend && npm run typecheck
```
