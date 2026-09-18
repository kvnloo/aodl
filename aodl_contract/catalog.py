"""Harness catalog loading (fail-closed)."""

from __future__ import annotations

import json
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent


def load_harness_catalog(root: Path | None = None) -> dict:
    path = (root or _ROOT) / "harnesses" / "catalog.json"
    if not path.is_file():
        raise FileNotFoundError(str(path))
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise TypeError("harness catalog must be object")
    return data
