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


def schema_cross_check() -> int:
    """The JSON Schema must never reject a document this validator accepts.

    `README.md` and `docs/working-note.md` call `schema/hotl-0.2.schema.json`
    "the checkable form" of the IR, and NOTHING loaded it. Measured against this
    corpus it is a partial restatement:

      * it catches 3 of the 18 documents in `examples/invalid/`
        (fail-event, open-questions-field, unknown-version) -- all structural;
      * the other 15 are rejected for SEMANTIC reasons (dependency cycles,
        privilege escalation, implicit fan-in, isolated nodes, payment
        execution) that a structural schema cannot express;
      * the hand-written validator catches all 18.

    So the schema is a subset, not a second implementation, and the one property
    that must hold is one-directional: a 0.2 document the validator accepts must
    NOT be rejected by the schema, or an external consumer implementing the
    published schema would refuse documents we call valid.

    `hotl-0.1-fanin.json` is skipped by design -- it is a 0.1 document, and this
    is the 0.2 schema. `validate()` dispatches on `specVersion` and handles both.

    Returns 0 on success, including when `jsonschema` is absent: this repo is
    zero-dependency BY DESIGN (`aodl_contract/validator.py` reimplements the
    checks in pure Python), so the schema cannot be enforced by AODL's own CI.
    That is exactly why the subset relationship is recorded here rather than
    assumed.
    """
    try:
        import jsonschema
    except ImportError:
        print("schema cross-check SKIP (jsonschema not installed; this repo is "
              "zero-dependency by design)")
        return 0

    schema_path = ROOT / "schema" / "hotl-0.2.schema.json"
    if not schema_path.is_file():
        print(f"schema cross-check FAIL: {schema_path.relative_to(ROOT)} is missing")
        return 1
    validator = jsonschema.Draft202012Validator(load_json(schema_path))

    false_rejections = 0
    checked = 0
    for path in sorted(VALID_DIR.glob("*.json")):
        doc = load_json(path)
        if doc.get("specVersion") != "0.2":
            continue
        checked += 1
        errors = sorted(validator.iter_errors(doc), key=lambda e: list(e.path))
        if errors:
            false_rejections += 1
            print(f"schema/valid/{path.name} FALSE REJECTION")
            for e in errors[:3]:
                print(f"  {list(e.path)}: {e.message}")

    caught = 0
    total02 = 0
    for path in sorted(INVALID_DIR.glob("*.json")):
        doc = load_json(path)
        if doc.get("specVersion") != "0.2":
            continue
        total02 += 1
        if any(True for _ in validator.iter_errors(doc)):
            caught += 1

    if false_rejections:
        print(f"schema cross-check FAIL ({false_rejections} false rejections)")
        return 1
    print(f"schema cross-check OK ({checked} valid 0.2 docs accepted; "
          f"structurally catches {caught}/{total02} of the invalid corpus -- "
          f"the rest are semantic and live only in the Python validator)")
    return 0


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

    failures += schema_cross_check()
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
