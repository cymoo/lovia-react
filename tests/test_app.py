from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from lovia import UserError

from lovia_react import app as app_module
from lovia_react.app import create


@pytest.fixture(autouse=True)
def _model(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LOVIA_MODEL", "openai:gpt-test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")


def _page(tmp_path: Path, **kwargs: str) -> str:
    with TestClient(create(db_path=str(tmp_path / "chats.db"), **kwargs)) as client:
        res = client.get("/")
        assert res.status_code == 200
        return res.text


def test_dev_mode_loads_the_vite_entry(tmp_path: Path) -> None:
    page = _page(tmp_path, dev_server="http://localhost:5173/")
    assert "http://localhost:5173/src/dev.ts" in page
    assert 'href="?view=dashboard"' in page


@pytest.mark.skipif(not (app_module.DIST / "app.js").is_file(), reason="not built")
def test_build_is_served_as_extension_script(tmp_path: Path) -> None:
    app = create(db_path=str(tmp_path / "chats.db"))
    with TestClient(app) as client:
        page = client.get("/").text
        assert "/ui/dist/app.js" in page
        assert "/ui/dist/app.css" in page
        assert client.get("/ui/dist/app.js").status_code == 200


def test_missing_build_says_how_to_fix(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(app_module, "DIST", tmp_path / "dist")
    with pytest.raises(UserError, match="npm run build"):
        create(db_path=str(tmp_path / "chats.db"))
