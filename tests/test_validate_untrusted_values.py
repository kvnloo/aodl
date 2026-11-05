"""Untrusted JSON must never crash the validator: non-scalar values become issues."""
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aodl_contract import validate  # noqa: E402


def _string_paths(obj, path=()):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _string_paths(v, path + (k,))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from _string_paths(v, path + (i,))
    elif isinstance(obj, str):
        yield path


def _set(doc, path, value):
    for key in path[:-1]:
        doc = doc[key]
    doc[path[-1]] = value


class UntrustedValues(unittest.TestCase):
    def test_non_scalar_fields_are_issues_not_exceptions(self):
        mutations = 0
        for f in sorted((ROOT / "examples" / "valid").glob("*.json")):
            doc = json.loads(f.read_text())
            for path in _string_paths(doc):
                for bad in ([doc and "x"], {"x": "y"}):
                    d = copy.deepcopy(doc)
                    _set(d, path, bad)
                    mutations += 1
                    try:
                        validate(d)
                    except TypeError as exc:  # pragma: no cover - the regression
                        self.fail(f"{f.name} {path}: {exc}")
        self.assertGreater(mutations, 100)


if __name__ == "__main__":
    unittest.main()
