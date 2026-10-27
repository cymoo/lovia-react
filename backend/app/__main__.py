"""``lovia-react`` — serve the app: ``lovia-react [--dev] [--host H] [--port P]``."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from lovia import UserError
from lovia.web import generate_token, is_loopback, serve

from .main import create

VITE_DEV_SERVER = "http://localhost:5173"

# --dev settings for the reloaded worker, which builds the app itself.
_ENV_DEV_SERVER = "LOVIA_REACT_DEV_SERVER"
_ENV_DB = "LOVIA_REACT_DB"
_ENV_TOKEN = "LOVIA_REACT_TOKEN"


def _reload_factory() -> FastAPI:
    """The app uvicorn rebuilds on each code change in --dev."""
    return create(
        dev_server=os.environ[_ENV_DEV_SERVER],
        db_path=os.getenv(_ENV_DB),
        token=os.getenv(_ENV_TOKEN),
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="lovia-react", description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--db", help="SQLite file (default ./.lovia/assistant.db)")
    parser.add_argument(
        "--dev",
        nargs="?",
        const=VITE_DEV_SERVER,
        metavar="URL",
        help="load the React pages from a Vite dev server (default "
        f"{VITE_DEV_SERVER}) and reload on Python changes",
    )
    args = parser.parse_args(argv)
    load_dotenv()
    # Off loopback the API needs a token; serve() refuses an app without one.
    token = None if is_loopback(args.host) else generate_token()
    try:
        # Built up front in --dev too, so a config error reads as one line
        # here instead of a traceback in the reloaded worker.
        app = create(dev_server=args.dev, db_path=args.db, token=token)
    except UserError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    if not args.dev:
        serve(app, host=args.host, port=args.port)  # prints the token link
        return 0

    # uvicorn reloads only an import string, never a built app: hand the
    # worker its settings through the environment it inherits.
    os.environ[_ENV_DEV_SERVER] = args.dev
    for name, value in ((_ENV_DB, args.db), (_ENV_TOKEN, token)):
        if value:
            os.environ[name] = value
    if token:
        print(
            f"web API auth enabled — UI: http://{args.host}:{args.port}/?token={token}"
        )
    uvicorn.run(
        f"{__package__}.__main__:_reload_factory",
        factory=True,
        host=args.host,
        port=args.port,
        reload=True,
        reload_dirs=[str(Path(__file__).parent)],
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
