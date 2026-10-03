"""Read-only validation/identity CLI. AODL remains the semantic authority."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from pathlib import Path
from typing import Any

from .validator import validate, spec_revision, WIRE_SPEC

MAX_INPUT_BYTES = 1024 * 1024


class InputError(ValueError):
    """A bounded diagnostic code, never private document content."""


def _object(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise InputError("duplicate_key")
        result[key] = value
    return result


def _constant(value: str) -> Any:
    raise InputError("nonfinite_number")


def _float(value: str) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise InputError("nonfinite_number")
    return number


def _read(path: str) -> bytes:
    if path == "-":
        raw = sys.stdin.buffer.read(MAX_INPUT_BYTES + 1)
    else:
        with Path(path).open("rb") as stream:
            raw = stream.read(MAX_INPUT_BYTES + 1)
    if len(raw) > MAX_INPUT_BYTES:
        raise InputError("input_too_large")
    return raw


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="aodl-validate")
    parser.add_argument("path", nargs="?", help="JSON document, or - for stdin")
    parser.add_argument("-V", "--version", action="store_true")
    parser.add_argument("--json", action="store_true", dest="as_json")
    parser.add_argument("--fingerprint", action="store_true", help="Include the canonical HOTL 0.2 fingerprint")
    args = parser.parse_args(argv)
    revision = spec_revision()
    if args.version:
        if args.as_json:
            print(json.dumps({"schema": "aodl.version.v1", "wireSpec": WIRE_SPEC, "validatorRevision": revision}))
        else:
            print(f"wire={WIRE_SPEC} semantic={revision}")
        return 0
    if args.path is None:
        parser.error("a document path or - is required")

    result: dict[str, Any] = {
        "schema": "aodl.validation.v1", "ok": False,
        "wireSpec": WIRE_SPEC, "validatorRevision": revision,
        "canonicalVersion": None, "semanticFingerprint": None,
        "inputSha256": None, "issues": [], "error": None,
    }
    status = 2
    try:
        raw = _read(args.path)
        result["inputSha256"] = hashlib.sha256(raw).hexdigest()
        doc = json.loads(raw.decode("utf-8"), object_pairs_hook=_object,
                         parse_constant=_constant, parse_float=_float)
        issues = validate(doc)
        # Validator messages can contain user values; JSON diagnostics expose codes only.
        result["issues"] = [{"code": issue.code} for issue in issues]
        status = 1 if issues else 0
        if not args.as_json:
            for issue in issues:
                print(issue)
        if not issues and args.fingerprint:
            from .canonical import CANON_VERSION, semantic_fingerprint
            result["semanticFingerprint"] = semantic_fingerprint(doc)
            result["canonicalVersion"] = CANON_VERSION
        result["ok"] = status == 0
    except InputError as error:
        result["error"] = str(error)
    except OSError:
        result["error"] = "input_unavailable"
    except (UnicodeError, json.JSONDecodeError):
        result["error"] = "invalid_json"
    except (ValueError, TypeError, RecursionError):
        result["error"] = "validation_or_canonicalization_failed"
    if result["error"]:
        status = 2
        result["ok"] = False
        result["semanticFingerprint"] = None
        result["canonicalVersion"] = None
    if args.as_json:
        print(json.dumps(result, sort_keys=True, separators=(",", ":"), allow_nan=False))
    elif result["error"]:
        print(result["error"], file=sys.stderr)
    elif args.fingerprint and result["ok"]:
        print(result["semanticFingerprint"])
    return status


if __name__ == "__main__":
    raise SystemExit(main())
