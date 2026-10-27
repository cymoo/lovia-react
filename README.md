# lovia-react

The [lovia](https://github.com/cymoo/lovia) web chat UI, extended with React
pages. The chat — sessions, streaming, tools, approvals, schedules, memory —
is lovia's own bundled page; everything else (dashboards, forms, business
panels) is React, drawn into that page as lovia
[views](https://github.com/cymoo/lovia/blob/main/docs/en/web-server.md#views).

- **Backend** — `lovia_react/`: a lovia `Agent` served by `create_app`, with
  `ChatUI` loading the React build as an extension script.
- **Frontend** — `frontend/`: Vite + React 19 + TypeScript, Tailwind v4,
  shadcn/ui, TanStack Query, Recharts. Built into `lovia_react/ui/dist/`.

## Setup

```bash
uv sync --extra dev                  # Python deps (.venv)
cp .env.example .env                 # then set LOVIA_MODEL and its key
cd frontend && npm install
```

## Develop

Two processes; React changes hot-reload in place inside the chat page.

```bash
cd frontend && npm run dev           # Vite on :5173
uv run lovia-react --dev             # lovia on :8000, loading from Vite
```

Python changes need a restart of `lovia-react`.

## Build and run

```bash
cd frontend && npm run build         # → lovia_react/ui/dist/app.{js,css}
uv run lovia-react                   # serves the build; no Node at runtime
```

`lovia-react --host 0.0.0.0` off loopback generates an access token and
prints it. As an ASGI app: `uvicorn --factory lovia_react.app:create`.

## Add a page

1. Write a component taking `ViewProps` under `frontend/src/views/<name>/`.
2. Register it in `frontend/src/main.tsx`:
   `lovia.registerView('<id>', reactView(title, Component))`.
3. Link it from `lovia_react/ui/index.html`'s `sidebar_nav` block:
   `<a href="?view=<id>">…</a>` (label it via `MESSAGES` in `app.py`).

Inside a view, `@/lib/lovia` gives typed access to the page:
`useLoviaState()` (chat on screen, theme, language, busy), `useLoviaEvent()`,
`apiJson()` for lovia's [HTTP API](https://github.com/cymoo/lovia/blob/main/docs/en/http-api.md)
or your own routes, and `lovia.send / setDraft / newChat / openSession /
toast`. Sub-pages live in the URL as `?view=<id>/<path>` (`ViewProps.path`).

## Styling

shadcn/ui's colors, radii and shadows map onto lovia's design tokens, so
React pages follow the chat page's theme, accent and dark mode. Tailwind runs
without Preflight and keeps clear of the page's own class names and tokens —
see the header of `frontend/src/index.css`; `tests/test_ui_css.py` checks
the build. (Tracked upstream: cymoo/lovia#317.)

## Checks

```bash
uv run pytest && uv run ruff check . && uv run mypy lovia_react
cd frontend && npm run typecheck
```
