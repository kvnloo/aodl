from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0, str(ROOT))

from aodl_contract import WIRE_SPEC, spec_revision, validate, validate_or_raise


class AodlContractApiTests(unittest.TestCase):
    def test_wire_and_revision(self):
        self.assertEqual(WIRE_SPEC, "hotl-0.2")
        self.assertEqual(len(spec_revision()), 16)

    def test_valid_fixture(self):
        doc = json.loads((ROOT / "examples/valid/pipeline.json").read_text())
        self.assertEqual(validate(doc), [])

    def test_unknown_harness_fails(self):
        doc = json.loads((ROOT / "examples/invalid/unknown-harness.json").read_text())
        issues = validate(doc)
        self.assertTrue(issues)
        blob = " ".join(str(i) for i in issues)
        self.assertIn("harness", blob.lower())

    def test_validate_or_raise(self):
        doc = json.loads((ROOT / "examples/invalid/unknown-version.json").read_text())
        with self.assertRaises(ValueError):
            validate_or_raise(doc)

    def test_source_hash_stable_on_plan_only_fields_not_required_here(self):
        # implementation-only plan change is a z0int concern; validator accepts plan mutability
        doc = json.loads((ROOT / "examples/valid/intent-loop.json").read_text())
        self.assertEqual(validate(doc), [])


if __name__ == "__main__":
    unittest.main()
