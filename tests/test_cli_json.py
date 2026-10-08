"""Exercise the actual AODL command boundary; no model or network required."""
from __future__ import annotations

import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


def document():
    return {
        "specVersion": "0.2", "graphId": "consumer", "revision": 0,
        "intentGraph": {"nodes": [{
            "id": "task", "kind": "task", "ports": [],
            "capabilities": ["read", "execute"],
        }], "edges": []},
        "policies": {"kinds": []},
        "constraints": {"budgets": {"tokens": 100}, "termination": {"on": "verified"}},
        "provenance": {"sourceHash": "0" * 64},
    }


class ConsumerCliTests(unittest.TestCase):
    def run_cli(self, data=b"", *args):
        return subprocess.run(
            [sys.executable, "-m", "aodl_contract.cli", *args],
            input=data, capture_output=True, cwd=ROOT, timeout=10,
            env={**os.environ, "PYTHONPATH": str(ROOT)},
        )

    def fingerprint(self, value):
        return self.run_cli(json.dumps(value).encode(), "--fingerprint", "--json", "-")

    def packet(self, result, code=0):
        self.assertEqual(result.returncode, code, result.stderr.decode(errors="replace"))
        self.assertEqual(result.stderr, b"")
        self.assertEqual(len(result.stdout.splitlines()), 1)
        value = json.loads(result.stdout)
        self.assertEqual(value["schema"], "aodl.validation.v1")
        self.assertRegex(value["validatorRevision"], r"^[0-9a-f]{16}$")
        self.assertEqual(value["ok"], code == 0)
        return value

    def test_fingerprint_matches_canonical_library(self):
        from aodl_contract.canonical import semantic_fingerprint
        value = document()
        result = self.packet(self.fingerprint(value))
        self.assertEqual(result["semanticFingerprint"], semantic_fingerprint(value))
        self.assertEqual(result["canonicalVersion"], "aodl-canon-1")
        self.assertEqual(result["wireSpec"], "hotl-0.2")

    def test_input_digest_binds_response_to_exact_bytes(self):
        raw = json.dumps(document(), indent=2).encode()
        value = self.packet(self.run_cli(raw, "--fingerprint", "--json", "-"))
        self.assertEqual(value["inputSha256"], hashlib.sha256(raw).hexdigest())

    def test_nonsemantic_order_does_not_change_identity(self):
        first = document()
        second = copy.deepcopy(first)
        second["intentGraph"]["nodes"][0]["capabilities"].reverse()
        self.assertEqual(self.packet(self.fingerprint(first))["semanticFingerprint"],
                         self.packet(self.fingerprint(second))["semanticFingerprint"])

    def test_authored_constraint_changes_identity(self):
        first = document()
        second = copy.deepcopy(first)
        second["constraints"]["budgets"]["tokens"] += 1
        self.assertNotEqual(self.packet(self.fingerprint(first))["semanticFingerprint"],
                            self.packet(self.fingerprint(second))["semanticFingerprint"])

    def test_runtime_fields_are_not_silently_stripped(self):
        first = document()
        second = copy.deepcopy(first)
        second["plan"] = {"status": "dry-run"}
        self.assertNotEqual(self.packet(self.fingerprint(first))["semanticFingerprint"],
                            self.packet(self.fingerprint(second))["semanticFingerprint"])

    def test_file_and_stdin_match_without_modifying_file(self):
        raw = json.dumps(document()).encode()
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contract.json"
            path.write_bytes(raw)
            result = self.packet(self.run_cli(b"", "--fingerprint", "--json", str(path)))
            self.assertEqual(result, self.packet(self.run_cli(raw, "--fingerprint", "--json", "-")))
            self.assertEqual(path.read_bytes(), raw)

    def test_json_validation_does_not_claim_fingerprint(self):
        result = self.packet(self.run_cli(json.dumps(document()).encode(), "--json", "-"))
        self.assertIsNone(result["semanticFingerprint"])
        self.assertIsNone(result["canonicalVersion"])

    def test_invalid_contract_has_no_fingerprint(self):
        value = document()
        value["specVersion"] = "unknown"
        result = self.packet(self.fingerprint(value), 1)
        self.assertIsNone(result["semanticFingerprint"])
        self.assertTrue(result["issues"])

    def test_malformed_shapes_fail_without_traceback(self):
        for value in [None, [], {"specVersion": []}, {"specVersion": "0.2", "intentGraph": []}]:
            with self.subTest(value=value):
                result = self.packet(self.fingerprint(value), 1)
                self.assertIsNone(result["semanticFingerprint"])

    def test_invalid_json_does_not_echo_input(self):
        result = self.packet(self.run_cli(b'private_note_do_not_echo', "--json", "-"), 2)
        self.assertEqual(result["error"], "invalid_json")
        self.assertNotIn(b'private_note_do_not_echo', json.dumps(result).encode())

    def test_duplicate_keys_are_rejected(self):
        self.packet(self.run_cli(b'{"specVersion":"0.2","specVersion":"0.1"}', "--json", "-"), 2)

    def test_nonfinite_numbers_are_rejected(self):
        for token in [b"NaN", b"Infinity", b"-Infinity", b"1e9999"]:
            with self.subTest(token=token):
                self.packet(self.run_cli(b'{"value":' + token + b'}', "--json", "-"), 2)

    def test_invalid_utf8_is_rejected(self):
        self.packet(self.run_cli(b'\xff', "--json", "-"), 2)

    def test_oversize_stdin_is_rejected(self):
        result = self.packet(self.run_cli(b" " * (1024 * 1024 + 1), "--json", "-"), 2)
        self.assertEqual(result["error"], "input_too_large")

    def test_missing_file_is_structured(self):
        with tempfile.TemporaryDirectory() as directory:
            result = self.packet(self.run_cli(b"", "--json", str(Path(directory) / "missing")), 2)
        self.assertEqual(result["error"], "input_unavailable")

    def test_validation_messages_do_not_echo_private_values(self):
        value = document()
        value["specVersion"] = "private_note_do_not_echo"
        result = self.fingerprint(value)
        self.packet(result, 1)
        self.assertNotIn(b"private_note_do_not_echo", result.stdout + result.stderr)

    def test_legacy_version_stays_available(self):
        result = self.run_cli(b"", "-V")
        self.assertEqual(result.returncode, 0)
        self.assertTrue(result.stdout.startswith(b"wire=hotl-0.2 semantic="))

    def test_legacy_file_validation_stays_available(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "contract.json"
            path.write_text(json.dumps(document()), encoding="utf-8")
            result = self.run_cli(b"", str(path))
        self.assertEqual(result.returncode, 0)
        self.assertEqual(result.stdout, b"")


if __name__ == "__main__":
    unittest.main()
