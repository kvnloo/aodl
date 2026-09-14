#!/usr/bin/env python3
"""Importable-API check for the realtime gate (issue #12).

Proves the validator core is usable without the CLI: a live gate imports
`validator` and calls `validate_document(doc)` -> list[str] (empty = valid).
Zero dependencies. Run from repo root:

  python3 tests/check_gate_api.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from validator import validate_document  # noqa: E402


def main() -> int:
    valid = json.loads((ROOT / "examples" / "valid" / "gate-api-ping.json").read_text())
    errors = validate_document(valid)
    assert errors == [], f"valid fixture rejected: {errors}"
    print("ok   gate-api-ping.json accepted by importable API")

    invalid = json.loads((ROOT / "examples" / "invalid" / "gate-api-payment-grant.json").read_text())
    errors = validate_document(invalid)
    assert errors, "invalid fixture accepted by importable API"
    blob = " ".join(errors).lower()
    assert "payment execution" in blob, f"expected payment-execution failure, got: {errors}"
    print(f"ok   gate-api-payment-grant.json rejected by importable API -> {errors[0]}")

    # Fail closed on an unknown specVersion from a pure in-memory dict (no file).
    errors = validate_document({"specVersion": "9.9"})
    assert errors, "unknown specVersion accepted"
    assert "unknown specversion" in " ".join(errors).lower(), f"unexpected: {errors}"
    print("ok   unknown specVersion fail-closed via importable API")

    print("gate api: valid accepted, invalid rejected, unknown version fail-closed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
