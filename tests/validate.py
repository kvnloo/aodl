#!/usr/bin/env python3
"""HOTL/AODL static validator. Zero dependencies. Fail closed.

Thin CLI wrapper over the importable validator core (validator.py);
behavior is identical to the pre-extraction script.

Usage:
  python3 tests/validate.py
  python3 tests/validate.py path/to/doc.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from validator import Issue, validate  # noqa: E402

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
    "gate-api-payment-grant": "payment execution",
}





def validate_encodings() -> list[Issue]:
    issues: list[Issue] = []
    visual_path = ROOT / "encodings" / "visual.json"
    ir_path = ROOT / "encodings" / "ir-map.json"
    graphs_path = ROOT / "encodings" / "topology-graphs.json"
    for path in (visual_path, ir_path, graphs_path):
        if not path.exists():
            issues.append(Issue("encodings", f"missing {path.relative_to(ROOT)}"))
            return issues
    visual = load_json(visual_path)
    ir_map = load_json(ir_path)
    graphs = load_json(graphs_path)
    if not isinstance(visual, dict) or not isinstance(ir_map, dict) or not isinstance(graphs, dict):
        issues.append(Issue("type", "encodings documents must be objects"))
        return issues
    vis_ids = set((visual.get("topologies") or {}).keys())
    ir_ids = set((ir_map.get("topologies") or {}).keys())
    graph_ids = set(graphs.keys())
    if vis_ids != ir_ids:
        issues.append(Issue("encodings", f"visual/ir topology id mismatch extra={sorted(ir_ids-vis_ids)} missing={sorted(vis_ids-ir_ids)}"))
    if vis_ids != graph_ids:
        issues.append(Issue("encodings", f"visual/graph id mismatch extra={sorted(graph_ids-vis_ids)} missing={sorted(vis_ids-graph_ids)}"))
    swarm = (ir_map.get("topologies") or {}).get("swarm") or {}
    if swarm.get("status") != "not-inferred":
        issues.append(Issue("encodings", "swarm must be not-inferred"))
    market = (ir_map.get("topologies") or {}).get("marketplace") or {}
    kinds = (market.get("policies") or {}).get("kinds") or []
    if "auction" not in kinds:
        issues.append(Issue("encodings", "marketplace must map to auction policy"))
    payment = ((market.get("policies") or {}).get("auction") or {}).get("payment")
    if payment not in {None, "unsupported", False}:
        issues.append(Issue("payment", "marketplace payment execution is unsupported"))
    for tid, rec in (ir_map.get("topologies") or {}).items():
        if rec.get("status") not in {"expressible", "not-inferred", "unspecified"}:
            issues.append(Issue("encodings", f"{tid} has unknown ir status {rec.get('status')!r}"))
        example = rec.get("example")
        if example and not (ROOT / example).exists():
            issues.append(Issue("encodings", f"{tid} example missing {example}"))
    for kind, tid in (ir_map.get("fromHotl") or {}).items():
        if tid is None:
            continue
        if tid not in ir_ids:
            issues.append(Issue("encodings", f"fromHotl {kind} -> unknown topology {tid}"))
    translation = ir_map.get("translation") or {}
    if translation.get("symbol") != "tau" or translation.get("failClosed") != "bot" or translation.get("partial") is not True:
        issues.append(Issue("encodings", "translation must be partial tau with failClosed bot"))
    required_channels = ("provider", "model", "effort", "topology", "operatingMode", "state", "economics")
    channels = ir_map.get("channels") or {}
    for name in required_channels:
        rec = channels.get(name) or {}
        compile_mode = rec.get("compile")
        if compile_mode not in {"none", "declared-only", "ir-map"}:
            issues.append(Issue("encodings", f"channel {name} missing compile mode"))
    if (channels.get("topology") or {}).get("compile") != "ir-map":
        issues.append(Issue("encodings", "topology channel must compile through ir-map"))
    hybrid = (ir_map.get("topologies") or {}).get("hybrid") or {}
    if hybrid.get("status") != "not-inferred":
        issues.append(Issue("encodings", "unlabeled hybrid must be not-inferred"))
    return issues

REQUIRED_HARNESS_IDS = ("hermes", "omp", "o8", "grok", "codex", "claude", "pi", "fx")
HARNESS_KINDS = {"executor", "control-room"}
DASH_STATUS = {"wired", "none"}
FIRSTMATE_STATUS = {"primary", "crew", "none"}
REQUIRED_NETWORK = ("aodl", "dash", "frontier-kb", "hermes-keel", "hermes-agent")


def validate_catalog() -> list[Issue]:
    issues: list[Issue] = []
    path = ROOT / "harnesses" / "catalog.json"
    if not path.exists():
        return [Issue("catalog", "missing harnesses/catalog.json")]
    doc = load_json(path)
    if not isinstance(doc, dict):
        return [Issue("type", "harnesses/catalog.json must be an object")]
    supported = doc.get("supported")
    harnesses = doc.get("harnesses")
    distros = doc.get("distros")
    network = doc.get("network")
    if not isinstance(supported, list):
        issues.append(Issue("catalog", "supported must be an array"))
        return issues
    if list(supported) != list(REQUIRED_HARNESS_IDS):
        issues.append(
            Issue(
                "catalog",
                f"supported must be {list(REQUIRED_HARNESS_IDS)}, got {supported}",
            )
        )
    if not isinstance(harnesses, dict):
        issues.append(Issue("catalog", "harnesses must be an object"))
        return issues
    missing = [hid for hid in REQUIRED_HARNESS_IDS if hid not in harnesses]
    extra = [hid for hid in harnesses if hid not in REQUIRED_HARNESS_IDS]
    if missing:
        issues.append(Issue("catalog", f"missing harness ids {missing}"))
    if extra:
        issues.append(Issue("catalog", f"unknown harness ids {sorted(extra)}"))
    for hid in REQUIRED_HARNESS_IDS:
        row = harnesses.get(hid)
        if not isinstance(row, dict):
            issues.append(Issue("catalog", f"{hid} must be an object"))
            continue
        for key in ("name", "kind", "bin", "repo", "dash", "role"):
            if key not in row:
                issues.append(Issue("catalog", f"{hid} missing {key}"))
        if row.get("kind") not in HARNESS_KINDS:
            issues.append(Issue("catalog", f"{hid} kind {row.get('kind')!r} is unknown"))
        if row.get("dash") not in DASH_STATUS:
            issues.append(Issue("catalog", f"{hid} dash status {row.get('dash')!r} is unknown"))
        if row.get("firstmate") not in FIRSTMATE_STATUS:
            issues.append(Issue("catalog", f"{hid} firstmate status {row.get('firstmate')!r} is unknown"))
        repo = row.get("repo")
        if not isinstance(repo, str) or not repo.startswith("https://github.com/"):
            issues.append(Issue("catalog", f"{hid} repo must be a github URL"))
    if hid := "o8":
        if isinstance(harnesses.get("o8"), dict) and harnesses["o8"].get("kind") != "control-room":
            issues.append(Issue("catalog", "o8 must be kind control-room"))
    if not isinstance(distros, dict) or "firstmate" not in distros:
        issues.append(Issue("catalog", "distros.firstmate is required"))
    else:
        fm = distros["firstmate"]
        if not isinstance(fm, dict) or fm.get("kind") != "distro":
            issues.append(Issue("catalog", "firstmate must be kind distro"))
        if "firstmate" in (supported or []):
            issues.append(Issue("catalog", "firstmate is a distro, not a supported harness id"))
    if not isinstance(network, dict):
        issues.append(Issue("catalog", "network must be an object"))
    else:
        for nid in REQUIRED_NETWORK:
            node = network.get(nid)
            if not isinstance(node, dict) or not str(node.get("repo", "")).startswith("https://github.com/"):
                issues.append(Issue("catalog", f"network.{nid} needs a github repo"))
    return issues

def load_json(path: Path) -> object:
    return json.loads(path.read_text())


def _run_corpus() -> int:
    failed = 0
    valid_files = sorted(VALID_DIR.glob("*.json"))
    invalid_files = sorted(INVALID_DIR.glob("*.json"))
    if not valid_files:
        print("no valid fixtures", file=sys.stderr)
        return 1
    if not invalid_files:
        print("no invalid fixtures", file=sys.stderr)
        return 1

    for path in valid_files:
        issues = validate(load_json(path))
        if issues:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT)} (expected pass)")
            for issue in issues:
                print(f"  {issue}")
        else:
            print(f"ok   {path.relative_to(ROOT)}")

    for path in invalid_files:
        issues = validate(load_json(path))
        expect = INVALID_EXPECT.get(path.stem)
        blob = " ".join(str(i) for i in issues).lower()
        if not issues:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT)} (expected fail)")
        elif expect and expect.lower() not in blob:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT)} (wanted {expect!r})")
            for issue in issues:
                print(f"  {issue}")
        else:
            print(f"ok   {path.relative_to(ROOT)} -> {issues[0]}")

    missing = set(INVALID_EXPECT) - {p.stem for p in invalid_files}
    extra = {p.stem for p in invalid_files} - set(INVALID_EXPECT)
    if missing:
        print(f"FAIL missing invalid fixtures: {sorted(missing)}")
        failed += 1
    if extra:
        print(f"FAIL unexpected invalid fixtures: {sorted(extra)}")
        failed += 1

    encoding_issues = validate_encodings()
    if encoding_issues:
        failed += 1
        print("FAIL encodings join table")
        for issue in encoding_issues:
            print(f"  {issue}")
    else:
        print("ok   encodings/visual.json ↔ encodings/ir-map.json")


    catalog_issues = validate_catalog()
    if catalog_issues:
        failed += 1
        print("FAIL harnesses/catalog.json")
        for issue in catalog_issues:
            print(f"  {issue}")
    else:
        print("ok   harnesses/catalog.json")
    if failed:
        print(f"{failed} failure(s)")
        return 1
    print(f"{len(valid_files)} valid, {len(invalid_files)} invalid — all matched")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        exit_code = 0
        for arg in argv[1:]:
            path = Path(arg)
            issues = validate(load_json(path))
            if issues:
                exit_code = 1
                print(f"{path}: FAIL")
                for issue in issues:
                    print(f"  {issue}")
            else:
                print(f"{path}: ok")
        return exit_code
    return _run_corpus()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
