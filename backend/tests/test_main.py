from __future__ import annotations

import os
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app import __main__ as cli


@pytest.fixture(autouse=True)
def _env(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> Iterator[None]:
    monkeypatch.setenv("LOVIA_MODEL", "openai:gpt-test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.chdir(tmp_path)
    yield
    # main() hands --dev settings to the worker through os.environ.
    for name in (cli._ENV_DEV_SERVER, cli._ENV_DB, cli._ENV_TOKEN):
        os.environ.pop(name, None)


def test_dev_reloads_through_an_import_string(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[tuple[Any, dict[str, Any]]] = []
    monkeypatch.setattr(
        cli.uvicorn, "run", lambda target, **kw: calls.append((target, kw))
    )

    assert cli.main(["--dev", "--db", "chats.db"]) == 0

    [(target, kwargs)] = calls
    assert target == "app.__main__:_reload_factory"
    assert kwargs["factory"] and kwargs["reload"]
    assert kwargs["reload_dirs"] == [str(Path(cli.__file__).parent)]
    # The worker rebuilds the same app from the environment it inherits.
    with TestClient(cli._reload_factory()) as client:
        assert "http://localhost:5173/src/dev.ts" in client.get("/").text


def test_off_loopback_gets_a_token(monkeypatch: pytest.MonkeyPatch) -> None:
    calls: list[Any] = []
    monkeypatch.setattr(cli.uvicorn, "run", lambda target, **kw: calls.append(target))

    assert cli.main(["--dev", "--host", "0.0.0.0"]) == 0

    with TestClient(cli._reload_factory()) as client:
        assert client.get("/api/info").status_code == 401


def test_config_error_is_one_line(
    capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("LOVIA_MODEL")
    assert cli.main(["--dev"]) == 2
    assert capsys.readouterr().err.startswith("error: no model configured")
