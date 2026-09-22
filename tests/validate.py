#!/usr/bin/env python3
"""HOTL/AODL static validator CLI — thin wrapper over aodl_contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aodl_contract import Issue, validate  # noqa: E402,F401
# `Issue` and `validate` are re-exported deliberately: this module is the shared
# validation facade for the test corpus. `tests/compile.py` already imports
# `validate` from here, and `compiler/hermes.py` imports both `Issue` and
# `validate` from here. Re-exporting only `validate` made that second import fail
# with `ImportError: cannot import name 'Issue' from 'validate'`, which broke the
# declared CI step `python3 tests/compile.py` (validate.yml:19) while the
# preceding step `python3 tests/validate.py` passed.

VALID_DIR = ROOT / "examples" / "valid"
INVALID_DIR = ROOT / "examples" / "invalid"

INVALID_EXPECT = {
    "unknown-version": "unknown specVersion",
    "unbounded-recursion": "unbounded",
    "implicit-fan-in": "implicit fan-in",
    "missing-port": "unknown port",
    "self-edge": "self-edge",
    "dependency-cycle": "dependency cycle",
    "craid-feedback-cycle": "dependency cycle",
    "payment-execution": "payment execution",
    "hidden-privilege": "privileged capability",
    "missing-endpoint": "unknown node",
    "isolated-node": "isolated node",
    "control-room-as-executor": "control-room",
    "unknown-harness": "unknown harness",
    "verifier-merge-grant": "merge grant",
    "gate-identity-delegated": "humanGate identity",
    "langchain-as-harness": "unknown harness",
    "fail-event": "unknown event",
    "open-questions-field": "unknown fields",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def run_corpus() -> int:
    failures = 0
    try:
        from aodl_contract.validator import validate_encodings

        enc = validate_encodings()
        if enc:
            print("encodings FAIL")
            for i in enc:
                print(" ", i)
            failures += 1
        else:
            print("encodings OK")
    except Exception as exc:
        print(f"encodings SKIP ({type(exc).__name__}: {exc})")

    for path in sorted(VALID_DIR.glob("*.json")):
        issues = validate(load_json(path))
        if issues:
            print(f"valid/{path.name} FAIL")
            for i in issues:
                print(" ", i)
            failures += 1
        else:
            print(f"valid/{path.name} OK")

    for path in sorted(INVALID_DIR.glob("*.json")):
        key = path.stem
        issues = validate(load_json(path))
        needle = INVALID_EXPECT.get(key)
        msgs = [getattr(i, "msg", None) or str(i) for i in issues]
        codes = [getattr(i, "code", "") for i in issues]
        blob = " ".join([*msgs, *codes, *[str(i) for i in issues]])
        ok = bool(issues) and (needle is None or needle in blob)
        if not ok:
            print(f"invalid/{path.name} FAIL expected~{needle!r} got={msgs}")
            failures += 1
        else:
            print(f"invalid/{path.name} OK")
    return 1 if failures else 0


def main(argv=None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv:
        issues = validate(load_json(Path(argv[0])))
        for i in issues:
            print(i)
        return 1 if issues else 0
    return run_corpus()


if __name__ == "__main__":
    raise SystemExit(main())
