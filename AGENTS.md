# AGENTS.md

lovia's bundled chat page, extended with React views. Read README.md first.

## Layout

- `lovia_react/app.py` — the agent and `create()`: `create_app(..., ui=ChatUI(...))`.
  `--dev` loads `frontend/src/dev.ts` from Vite; otherwise `ui/dist/app.js` + `app.css`.
- `lovia_react/ui/index.html` — extends `lovia/index.html`; sidebar links to views.
- `frontend/src/main.tsx` — registers every view (`lovia.registerView`).
- `frontend/src/lib/view.tsx` — `reactView()`: one React root per draw, shared QueryClient.
- `frontend/src/lib/lovia.ts` — typed `window.lovia` + hooks + `apiJson`.
- `frontend/src/index.css` — Tailwind/shadcn ↔ lovia token bridge.

## Commands

| Task | Command |
| --- | --- |
| Python deps | `uv sync --extra dev` |
| Test / lint / types | `uv run pytest` · `uv run ruff check .` · `uv run mypy lovia_react` |
| Frontend types / build | `npm run typecheck` · `npm run build` (in `frontend/`) |
| Dev | `npm run dev` (frontend/) + `uv run lovia-react --dev` |

`tests/test_ui_css.py` and the build test skip until `npm run build` has run.

## Things that will bite you

- **lovia owns the URL.** No client-side router: a page is a view (`?view=<id>`),
  a sub-page is `?view=<id>/<path>` → `ViewProps.path`. Each path change redraws the root.
- **CSS must not leak into the chat page.** No Tailwind Preflight (scoped reset on
  `.lr-root` instead); no Tailwind theme variable named like a lovia token
  (`--radius-*`, `--shadow-*` are cleared and redefined via `@utility`); no utility
  named like a lovia class (`table`, `block`, `visible` excluded). Declare layers
  before use — `@layer` order is first-mention order. Run the CSS test after
  upgrading lovia. Upstream fix: cymoo/lovia#317.
- `window.lovia`'s types come from the installed wheel
  (`.venv/lib/python*/site-packages/lovia/web/static/lovia.d.ts`) — `uv sync` before `tsc`.
- `lovia.state` returns a new object per read; use `useLoviaState()`, which caches it.
- shadcn CLI: it doesn't resolve the `@/` alias under TS 7 and writes
  `import { cn } from "cn"` (and installs an npm package `cn`). After `npx shadcn add`,
  point the import at `@/lib/utils` and uninstall `cn`.
- Use only lovia's stable surface (docs/en/stability.md): `create_app`, `ChatUI`,
  `window.lovia`, the HTTP API. Not `lovia.web.config`, class names, or JS modules.

## Conventions

Conventional Commits. Python: ruff + mypy strict. Frontend: TypeScript strict, `@/` imports.
