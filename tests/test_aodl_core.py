from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
import sys
sys.path.insert(0, str(ROOT))

from aodl_contract import CORE_FORMAT, semantic_fingerprint, to_core, validate


def load(path: str) -> dict:
    return json.loads((ROOT / "examples" / path).read_text())


class AodlCoreV1Tests(unittest.TestCase):
    def test_core_is_intent_only_and_versioned(self):
        doc = load("valid/intent-loop.json")
        core = to_core(doc)
        self.assertEqual(core["coreFormat"], CORE_FORMAT)
        self.assertEqual(CORE_FORMAT, "aodl-core-v1")
        self.assertEqual(
            set(core["contract"]),
            {"specVersion", "graphId", "revision", "intentGraph", "policies", "constraints", "provenance"},
        )
        self.assertNotIn("plan", core["contract"])
        self.assertNotIn("eventLog", core["contract"])
        self.assertNotIn("observedGraph", core["contract"])

    def test_runtime_projection_does_not_change_fingerprint(self):
        doc = load("valid/intent-loop.json")
        stripped = copy.deepcopy(doc)
        stripped.pop("plan", None)
        stripped.pop("eventLog", None)
        stripped.pop("observedGraph", None)
        self.assertEqual(validate(doc), [])
        self.assertEqual(validate(stripped), [])
        self.assertEqual(semantic_fingerprint(doc), semantic_fingerprint(stripped))

    def test_semantically_irrelevant_order_is_canonical(self):
        doc = load("valid/pipeline.json")
        reordered = copy.deepcopy(doc)
        reordered["intentGraph"]["nodes"].reverse()
        reordered["intentGraph"]["edges"].reverse()
        reordered["policies"]["kinds"].reverse()
        for node in reordered["intentGraph"]["nodes"]:
            node["ports"].reverse()
            node["capabilities"].reverse()
            node["authorityCeiling"].reverse()
        for edge in reordered["intentGraph"]["edges"]:
            edge["authority"]["grant"].reverse()
        self.assertEqual(validate(reordered), [])
        self.assertEqual(semantic_fingerprint(doc), semantic_fingerprint(reordered))

    def test_authored_semantic_change_changes_fingerprint(self):
        doc = load("valid/pipeline.json")
        changed = copy.deepcopy(doc)
        changed["revision"] += 1
        self.assertEqual(validate(changed), [])
        self.assertNotEqual(semantic_fingerprint(doc), semantic_fingerprint(changed))

    def test_invalid_document_is_not_normalized(self):
        doc = load("valid/pipeline.json")
        doc["intentGraph"]["nodes"][0]["kind"] = ["task"]
        self.assertTrue(validate(doc))
        with self.assertRaises(ValueError):
            to_core(doc)

    def test_validate_is_total_for_malformed_json_shapes(self):
        base = load("valid/pipeline.json")

        cases = []

        doc = copy.deepcopy(base)
        doc["intentGraph"]["nodes"][0]["kind"] = ["task"]
        cases.append(doc)

        doc = copy.deepcopy(base)
        doc["intentGraph"]["nodes"][0]["ports"][0]["direction"] = {"bad": True}
        cases.append(doc)

        doc = copy.deepcopy(base)
        doc["intentGraph"]["edges"][0]["relation"] = ["dependency"]
        cases.append(doc)

        doc = copy.deepcopy(base)
        doc["intentGraph"]["edges"][0]["from"] = ["intent"]
        cases.append(doc)

        event_doc = load("valid/intent-loop.json")
        if event_doc.get("eventLog"):
            event_doc["eventLog"][0]["type"] = ["stateUpdate"]
            cases.append(event_doc)

        for i, malformed in enumerate(cases):
            with self.subTest(case=i):
                issues = validate(malformed)
                self.assertTrue(issues)
                self.assertTrue(all(hasattr(issue, "code") for issue in issues))


if __name__ == "__main__":
    unittest.main()
