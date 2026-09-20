from __future__ import annotations

import json
import sys
from pathlib import Path

from .validator import validate, spec_revision, WIRE_SPEC


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    if argv and argv[0] in ("-V", "--version"):
        print(f"wire={WIRE_SPEC} semantic={spec_revision()}")
        return 0
    if not argv:
        print("usage: aodl-validate <doc.json> | aodl-validate -V", file=sys.stderr)
        return 2
    doc = json.loads(Path(argv[0]).read_text(encoding="utf-8"))
    issues = validate(doc)
    for i in issues:
        print(i)
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
