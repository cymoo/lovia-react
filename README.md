# lovia-react

**English** | [简体中文](./README-zh.md)

The [lovia](https://github.com/cymoo/lovia) web chat UI, extended with React
pages. The chat — sessions, streaming, tools, approvals, schedules, memory —
is lovia's own bundled page; everything else (dashboards, forms, business
panels) is React, drawn into that page as lovia
[views](https://github.com/cymoo/lovia/blob/main/docs/en/web-server.md#views).

```text
backend/    Python (uv): the lovia agent, served by create_app, with ChatUI
            loading the React build as an extension script
  app/        main.py (agent + app), __main__.py (CLI), ui/ (template + build)
  tests/
frontend/   Vite + React 19 + TypeScript, Tailwind v4, shadcn/ui,
            TanStack Query, Recharts — built into backend/app/ui/dist/
```

## Setup

```bash
cd backend && uv sync --extra dev    # Python deps (backend/.venv)
cp .env.example .env                 # then set LOVIA_MODEL and its key
cd ../frontend && npm install
```

## Develop

Two processes; React changes hot-reload in place inside the chat page, and
Python changes under `backend/app/` restart the server.

```bash
cd frontend && npm run dev           # Vite on :5173
cd backend && uv run lovia-react --dev   # lovia on :8000, loading from Vite
```

A restart cuts the connection of an answer that is still streaming: the
page shows a network error, while the server finishes the run (or keeps it
as a resumable checkpoint). Reload the page to see it.

## Build and run

```bash
cd frontend && npm run build         # → backend/app/ui/dist/app.{js,css}
cd backend && uv run lovia-react     # serves the build; no Node at runtime
```

Off loopback (`--host 0.0.0.0`) the API needs a token: `lovia-react`
generates one per start and prints the UI link carrying it. As an ASGI app (from `backend/`):
`uvicorn --factory app.main:create`.

## Add a page

1. Write a component taking `ViewProps` under `frontend/src/views/<name>/`.
2. Register it in `frontend/src/main.tsx`:
   `lovia.registerView('<id>', reactView(title, Component))`.
3. Link it from `backend/app/ui/index.html`'s `sidebar_nav` block:
   `<a href="?view=<id>">…</a>` (label it via `MESSAGES` in `backend/app/main.py`).

Inside a view, `@/lib/lovia` gives typed access to the page:
`useLoviaState()` (chat on screen, theme, language, busy), `useLoviaEvent()`,
`apiJson()` for lovia's [HTTP API](https://github.com/cymoo/lovia/blob/main/docs/en/http-api.md)
or your own routes, and `lovia.send / setDraft / newChat / openSession /
toast`. Sub-pages live in the URL as `?view=<id>/<path>` (`ViewProps.path`).

## Styling

shadcn/ui's colors, radii and shadows map onto lovia's design tokens, so
React pages follow the chat page's theme, accent and dark mode. Tailwind runs
without Preflight, which would restyle the whole page — see the header of
`frontend/src/index.css`; `backend/tests/test_ui_css.py` checks that every
lovia token the build reads still exists.

## Checks

```bash
cd backend && uv run pytest && uv run ruff check . && uv run mypy app
cd frontend && npm run typecheck
```
