"""The React build must not restyle the chat page it lives in.

frontend/src/index.css (repo root) explains the rules; these tests catch a lovia upgrade
(new tokens, new class names) or a new utility that breaks them.
"""

from __future__ import annotations

import re
from pathlib import Path

import lovia.web
import pytest

from app.main import DIST

STATIC = Path(lovia.web.__file__).parent / "static"
TEMPLATE = Path(lovia.web.__file__).parent / "templates" / "index.html"
CSS = DIST / "app.css"

pytestmark = pytest.mark.skipif(
    not CSS.is_file(), reason="frontend not built (npm run build in frontend/)"
)

# Same meaning on both sides: display: none.
SHARED_CLASSES = {"hidden"}


def _lovia_tokens() -> set[str]:
    css = (STATIC / "styles.css").read_text()
    return set(re.findall(r"^\s+(--[\w-]+):", css, re.M))


def _lovia_classes() -> set[str]:
    names = set(re.findall(r"\.([a-z][a-z0-9-]*)", (STATIC / "styles.css").read_text()))
    sources = [TEMPLATE, *(STATIC / "js").glob("*.js")]
    attr = re.compile(r"""(?:class(?:Name)?\s*=\s*|classList\.\w+\()['"`]([^'"`]*)""")
    for source in sources:
        for value in attr.findall(source.read_text()):
            names.update(re.findall(r"[a-z][a-z0-9-]*", value))
    return names


def _built() -> str:
    return CSS.read_text()


def test_build_defines_no_lovia_token_on_root() -> None:
    blocks = re.findall(r":root,:host\{([^}]*)\}", _built())
    defined = {decl.split(":", 1)[0].strip() for b in blocks for decl in b.split(";")}
    assert not defined & _lovia_tokens()


def test_build_has_no_utility_named_like_a_chat_page_class() -> None:
    # Plain, unescaped class selectors: the utilities a bare class name hits.
    utilities = set(re.findall(r"(?:^|[}\s,])\.([a-z][a-z0-9-]*)\{", _built(), re.M))
    assert not (utilities & _lovia_classes()) - SHARED_CLASSES
