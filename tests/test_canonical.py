"""aodl#21 acceptance: canonicalization + semantic fingerprint (spec/canonicalization.md)."""
import copy
import json
from pathlib import Path
import random
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aodl_contract import CANON_VERSION, CanonicalizationError, canonicalize, semantic_fingerprint, validate  # noqa: E402

VALID = sorted((ROOT / "examples" / "valid").glob("*.json"))


def docs_02():
    out = []
    for f in VALID:
        d = json.loads(f.read_text())
        if d.get("specVersion") == "0.2":
            out.append((f.name, d))
    return out


def shuffled(doc, rng):
    """Permute every order the spec declares non-semantic; rebuild dicts in random key order."""
    d = copy.deepcopy(doc)
    for g in ("intentGraph", "observedGraph"):
        graph = d.get(g) or {}
        for coll in ("nodes", "edges"):
            if isinstance(graph.get(coll), list):
                rng.shuffle(graph[coll])
        for node in graph.get("nodes") or []:
            for key in ("ports", "capabilities", "authorityCeiling"):
                if isinstance(node.get(key), list):
                    rng.shuffle(node[key])
        for edge in graph.get("edges") or []:
            if isinstance((edge.get("authority") or {}).get("grant"), list):
                rng.shuffle(edge["authority"]["grant"])
    if isinstance((d.get("policies") or {}).get("kinds"), list):
        rng.shuffle(d["policies"]["kinds"])
    for ev in d.get("eventLog") or []:
        if isinstance(ev.get("causalParents"), list):
            rng.shuffle(ev["causalParents"])

    def rekey(v):
        if isinstance(v, dict):
            items = list(v.items())
            rng.shuffle(items)
            return {k: rekey(x) for k, x in items}
        if isinstance(v, list):
            return [rekey(x) for x in v]
        return v
    return rekey(d)


class Canonical(unittest.TestCase):
    def test_version_prefix_is_explicit(self):
        name, doc = docs_02()[0]
        self.assertTrue(semantic_fingerprint(doc).startswith(CANON_VERSION + ":"))

    def test_unordered_permutations_keep_fingerprint(self):
        rng = random.Random(21)
        for name, doc in docs_02():
            base = semantic_fingerprint(doc)
            for _ in range(20):
                self.assertEqual(semantic_fingerprint(shuffled(doc, rng)), base, name)

    def test_source_is_never_mutated(self):
        for name, doc in docs_02():
            before = json.dumps(doc, sort_keys=False)
            canonicalize(doc)
            semantic_fingerprint(doc)
            self.assertEqual(json.dumps(doc, sort_keys=False), before, name)

    def test_source_hash_is_distinct_from_semantics(self):
        for name, doc in docs_02():
            if not isinstance((doc.get("provenance") or {}).get("sourceHash"), str):
                continue
            d = copy.deepcopy(doc)
            d["provenance"]["sourceHash"] = "f" * 64 if doc["provenance"]["sourceHash"] != "f" * 64 else "e" * 64
            self.assertEqual(semantic_fingerprint(d), semantic_fingerprint(doc), name)
            self.assertNotEqual(d["provenance"]["sourceHash"], doc["provenance"]["sourceHash"])

    def test_semantic_changes_change_fingerprint(self):
        changed = 0
        for name, doc in docs_02():
            mutations = []
            budgets = (doc.get("constraints") or {}).get("budgets") or {}
            for k, v in budgets.items():
                if isinstance(v, int) and not isinstance(v, bool):
                    mutations.append(("constraints.budgets." + k, lambda d, k=k: d["constraints"]["budgets"].__setitem__(k, d["constraints"]["budgets"][k] + 1)))
            nodes = (doc.get("intentGraph") or {}).get("nodes") or []
            for i, node in enumerate(nodes):
                if node.get("authorityCeiling"):
                    mutations.append((f"node {node['id']} authorityCeiling", lambda d, i=i: d["intentGraph"]["nodes"][i]["authorityCeiling"].pop()))
                if isinstance(node.get("lifecycle"), str):
                    mutations.append((f"node {node['id']} lifecycle", lambda d, i=i: d["intentGraph"]["nodes"][i].__setitem__("lifecycle", "failed" if d["intentGraph"]["nodes"][i]["lifecycle"] != "failed" else "completed")))
            for label, mutate in mutations:
                d = copy.deepcopy(doc)
                mutate(d)
                if validate(d):
                    continue  # only compare documents that remain valid
                self.assertNotEqual(semantic_fingerprint(d), semantic_fingerprint(doc), f"{name}: {label}")
                changed += 1
        self.assertGreater(changed, 5)

    def test_event_order_is_semantic(self):
        checked = 0
        for name, doc in docs_02():
            log = doc.get("eventLog") or []
            if len(log) < 2:
                continue
            d = copy.deepcopy(doc)
            d["eventLog"] = list(reversed(d["eventLog"]))
            if validate(d):
                continue
            self.assertNotEqual(semantic_fingerprint(d), semantic_fingerprint(doc), name)
            checked += 1
        if not checked:
            self.skipTest("no valid example with a reorderable eventLog")

    def test_fail_closed(self):
        with self.assertRaises(CanonicalizationError):
            semantic_fingerprint(json.loads((ROOT / "examples" / "valid" / "hotl-0.1-fanin.json").read_text()))
        for f in sorted((ROOT / "examples" / "invalid").glob("*.json")):
            with self.assertRaises(CanonicalizationError, msg=f.name):
                semantic_fingerprint(json.loads(f.read_text()))


if __name__ == "__main__":
    unittest.main()
