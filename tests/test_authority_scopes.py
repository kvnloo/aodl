"""Node authorityScopes / prohibitions (spec/authority-scopes.md): exact, ceiling-bounded, fail closed."""
import copy
import json
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aodl_contract import semantic_fingerprint, validate  # noqa: E402

BASE = json.loads((ROOT / "examples" / "valid" / "authority-scopes.json").read_text())


def _doc(**agent):
    d = copy.deepcopy(BASE)
    node = next(n for n in d["intentGraph"]["nodes"] if n["id"] == "agent")
    for k, v in agent.items():
        if v is None:
            node.pop(k, None)
        else:
            node[k] = v
    return d


def _msgs(doc):
    return " | ".join(str(i) for i in validate(doc))


class AuthorityScopes(unittest.TestCase):
    def test_fixture_is_valid(self):
        self.assertEqual(validate(BASE), [])

    def test_fields_are_optional(self):
        self.assertEqual(validate(_doc(authorityScopes=None, prohibitions=None)), [])

    def test_scope_cannot_widen_ceiling(self):
        m = _msgs(_doc(authorityScopes=[{"effect": "deploy", "targets": {"envs": ["prod"]}}]))
        self.assertIn("widens authorityCeiling", m)

    def test_targets_required_and_non_empty(self):
        self.assertIn("targets must be an object", _msgs(_doc(authorityScopes=[{"effect": "push"}])))
        self.assertIn("at least one target", _msgs(_doc(authorityScopes=[{"effect": "push", "targets": {}}])))
        self.assertIn("non-empty array", _msgs(_doc(authorityScopes=[{"effect": "push", "targets": {"branches": []}}])))

    def test_unknown_target_key_and_entry_field(self):
        self.assertIn("unknown target key", _msgs(_doc(authorityScopes=[{"effect": "push", "targets": {"orgs": ["x"]}}])))
        self.assertIn("unknown fields", _msgs(_doc(authorityScopes=[{"effect": "push", "targets": {"branches": ["a"]}, "why": 1}])))

    def test_wildcards_rejected(self):
        for w in ("*", "ALL", "any", "feat/*", "non_default", "v?"):
            with self.subTest(w=w):
                self.assertIn("scopes are exact", _msgs(_doc(authorityScopes=[{"effect": "push", "targets": {"branches": [w]}}])))

    def test_effect_shape(self):
        for bad in ("Push", "", 3, ["push"], "push!"):
            with self.subTest(bad=bad):
                self.assertIn("lower-case effect id", _msgs(_doc(authorityScopes=[{"effect": bad, "targets": {"branches": ["a"]}}])))

    def test_payment_is_unsupported(self):
        m = _msgs(_doc(authorityCeiling=["execute", "payment"],
                       authorityScopes=[{"effect": "payment", "targets": {"hosts": ["stripe.com"]}}]))
        self.assertIn("payment execution is unsupported", m)
        self.assertIn("payment execution is unsupported", _msgs(_doc(prohibitions=[{"effect": "wallet"}])))

    def test_scopes_only_on_executors(self):
        d = copy.deepcopy(BASE)
        task = next(n for n in d["intentGraph"]["nodes"] if n["id"] == "intent")
        task["authorityCeiling"] = ["execute", "push"]
        task["authorityScopes"] = [{"effect": "push", "targets": {"branches": ["x"]}}]
        self.assertIn("only allowed on executor", _msgs(d))

    def test_prohibition_targets_optional_but_exact(self):
        self.assertEqual(validate(_doc(prohibitions=[{"effect": "merge"}])), [])
        self.assertIn("scopes are exact", _msgs(_doc(prohibitions=[{"effect": "push", "targets": {"branches": ["*"]}}])))
        self.assertIn("must be an array", _msgs(_doc(prohibitions={"effect": "push"})))

    def test_non_scalar_values_are_issues(self):
        for bad in ({"a": 1}, "push", 7, None):
            with self.subTest(bad=bad):
                self.assertTrue(validate(_doc(authorityScopes=bad)) or bad is None)
        self.assertTrue(validate(_doc(authorityScopes=[{"effect": "push", "targets": {"branches": [["main"]]}}])))

    def test_fingerprint_moves_with_any_scope_edit(self):
        before = semantic_fingerprint(BASE)
        widened = _doc(authorityScopes=[{"effect": "push", "targets": {"repos": ["~/workspace/aodl"],
                                                                        "branches": ["feat/authority-scopes", "main"]}}])
        self.assertEqual(validate(widened), [])
        self.assertNotEqual(before, semantic_fingerprint(widened))
        removed_prohibition = _doc(prohibitions=[{"effect": "merge"}])
        self.assertNotEqual(before, semantic_fingerprint(removed_prohibition))


if __name__ == "__main__":
    unittest.main()
