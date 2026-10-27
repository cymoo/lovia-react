"""``lovia-react`` — serve the app: ``lovia-react [--dev] [--host H] [--port P]``."""

from __future__ import annotations

import argparse
import sys

from dotenv import load_dotenv
from lovia import UserError
from lovia.web import serve

from .app import create

VITE_DEV_SERVER = "http://localhost:5173"


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
        help=f"load the React pages from a Vite dev server (default {VITE_DEV_SERVER})",
    )
    args = parser.parse_args(argv)
    load_dotenv()
    try:
        app = create(dev_server=args.dev, db_path=args.db)
    except UserError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    serve(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
