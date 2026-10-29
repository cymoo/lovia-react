"""The React build reads lovia's design tokens, which must still exist.

frontend/src/index.css maps Tailwind/shadcn onto lovia's `--lv-*` tokens; an
unknown one resolves to nothing, silently. This catches a lovia upgrade that
renames or drops one.
"""

from __future__ import annotations

import re
from pathlib import Path

import lovia.web
import pytest

from app.main import DIST

STYLES = Path(lovia.web.__file__).parent / "static" / "styles.css"
CSS = DIST / "app.css"

pytestmark = pytest.mark.skipif(
    not CSS.is_file(), reason="frontend not built (npm run build in frontend/)"
)


def test_build_reads_only_tokens_lovia_defines() -> None:
    defined = set(re.findall(r"(--lv-[\w-]+)\s*:", STYLES.read_text()))
    read = set(re.findall(r"var\((--lv-[\w-]+)", CSS.read_text()))
    assert read, "the build reads no lovia token"
    assert not read - defined
