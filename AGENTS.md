# AGENTS.md

lovia's bundled chat page, extended with React views. Read README.md first.

## Layout

Two self-contained halves; run each side's commands from its own directory.

- `backend/app/main.py` — the agent and `create()`: `create_app(..., ui=ChatUI(...))`.
  `--dev` loads `frontend/src/dev.ts` from Vite; otherwise `ui/dist/app.js` + `app.css`.
- `backend/app/ui/index.html` — extends `lovia/index.html`; sidebar links to views.
- `frontend/src/main.tsx` — registers every view (`lovia.registerView`).
- `frontend/src/lib/view.tsx` — `reactView()`: one React root per draw, shared QueryClient.
- `frontend/src/lib/lovia.ts` — typed `window.lovia` + hooks + `apiJson`.
- `frontend/src/index.css` — Tailwind/shadcn ↔ lovia token bridge.

The halves meet in two paths only: Vite builds into `../backend/app/ui/dist`, and
tsconfig reads `lovia.d.ts` from `../backend/.venv`.

## Commands

| Task | Command |
| --- | --- |
| Python deps (backend/) | `uv sync --extra dev` |
| Test / lint / types (backend/) | `uv run pytest` · `uv run ruff check .` · `uv run mypy app` |
| Frontend types / build (frontend/) | `npm run typecheck` · `npm run build` |
| Dev | `npm run dev` (frontend/) + `uv run lovia-react --dev` (backend/) |

`backend/tests/test_ui_css.py` and the build test skip until `npm run build` has run.

## Things that will bite you

- **lovia owns the URL.** No client-side router: a page is a view (`?view=<id>`),
  a sub-page is `?view=<id>/<path>` → `ViewProps.path`. Each path change redraws the root.
- **CSS must not leak into the chat page.** No Tailwind Preflight (scoped reset on
  `.lr-root` instead). lovia's classes are `lv-*` and its tokens `--lv-*`, so
  utilities and theme variables can't collide. Declare layers before use —
  `@layer` order is first-mention order. Read lovia's tokens as `var(--lv-…)`;
  run the CSS test after upgrading lovia (it checks they all still exist).
- `window.lovia`'s types come from the installed wheel
  (`backend/.venv/lib/python*/site-packages/lovia/web/static/lovia.d.ts`) — `uv sync`
  before `tsc`.
- `lovia.state` returns a new object per read; use `useLoviaState()`, which caches it.
- shadcn CLI: it doesn't resolve the `@/` alias under TS 7 and writes
  `import { cn } from "cn"` (and installs an npm package `cn`). After `npx shadcn add`,
  point the import at `@/lib/utils` and uninstall `cn`.
- Use only lovia's stable surface (docs/en/stability.md): `create_app`, `ChatUI`,
  `window.lovia`, the HTTP API. Not `lovia.web.config`, class names, or JS modules.

## Conventions

Conventional Commits. Python: ruff + mypy strict. Frontend: TypeScript strict, `@/` imports.
