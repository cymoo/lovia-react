"""The served app: a lovia agent, its chat UI, and the React pages in ``ui/``.

The React code (``frontend/``) builds to ``ui/dist/app.js`` + ``app.css``,
which the chat page imports as an extension script; each page registers
itself as a lovia view (``window.lovia.registerView``). ``ui/index.html``
extends the bundled page with the sidebar links that open them.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from lovia import Agent, UserError, model_from_env
from lovia.web import SURFACE_NOTE, ChatUI, create_app

UI_DIR = Path(__file__).parent / "ui"
DIST = UI_DIR / "dist"

# UI strings for ui/index.html's own elements (data-i18n="app.*").
MESSAGES = {
    "en": {"app.dashboard": "Dashboard"},
    "zh": {"app.dashboard": "运行概览"},
}


def build_agent() -> Agent:
    return Agent(
        name="assistant",
        instructions="You are a helpful assistant.\n\n" + SURFACE_NOTE,
        model=model_from_env(),
    )


def _ui(dev_server: str | None) -> ChatUI:
    if dev_server:
        # Vite serves the source with HMR; it injects the CSS itself.
        scripts, styles = [f"{dev_server.rstrip('/')}/src/dev.ts"], []
    elif (DIST / "app.js").is_file():
        scripts, styles = ["dist/app.js"], ["dist/app.css"]
    else:
        raise UserError(
            f"frontend build not found: {DIST / 'app.js'}",
            hint="run `npm run build` in frontend/, or start with --dev "
            "while `npm run dev` is running",
        )
    return ChatUI(assets=UI_DIR, scripts=scripts, styles=styles, messages=MESSAGES)


def create(*, dev_server: str | None = None, db_path: str | None = None) -> FastAPI:
    """Build the ASGI app (``uvicorn --factory app.main:create``).

    ``dev_server`` loads the React pages from a running Vite dev server
    (``http://localhost:5173``) instead of the build in ``ui/dist``.
    """
    app: FastAPI = create_app(
        build_agent(),
        title="lovia-react",
        db_path=db_path,
        ui=_ui(dev_server),
    )
    return app
