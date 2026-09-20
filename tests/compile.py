#!/usr/bin/env python3
"""Hermes dry-run compiler corpus. Zero dependencies. Fail closed.

Does not spawn Hermes, does not write a scheduler, does not invent observed.

Usage:
  python3 tests/compile.py
  python3 tests/compile.py path/to/doc.json
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "compiler"))
sys.path.insert(0, str(ROOT / "tests"))

from hermes import compile_document  # noqa: E402
from validate import load_json, validate  # noqa: E402

VALID_DIR = ROOT / "examples" / "valid"
INVALID_DIR = ROOT / "examples" / "invalid"
STOP_DIR = ROOT / "examples" / "compile-stop"

TASK_ID_RE = re.compile(r"^t_[a-f0-9]{8}$")
PLAN_FORBIDDEN = frozenset({"intentGraph", "eventLog", "observedGraph", "observed", "openQuestions"})

# Pins that lock Kanban shape. Do not weaken to make a stub pass.
INTENT_LOOP_TASKS = 6
INTENT_LOOP_PARENT_POINTERS = 1
INTENT_LOOP_REVIEW_CHILDREN = 1
HERMES_DRY_RUN_TASKS = 4
HERMES_DRY_RUN_PARENT_POINTERS = 2
HERMES_DRY_RUN_REVIEW_CHILDREN = 1

# valid 0.2 that must compile, except market (auction)
COMPILE_SKIP_VERSION = {"hotl-0.1-fanin"}
COMPILE_STOP_VALID = {"market"}

STOP_EXPECT = {
    "message": "unsupported message",
    "mesh": "unsupported mesh",
    "market": "unsupported auction",
    "payment-execution": "payment",
}


def _issues_blob(issues: list[object]) -> str:
    return " ".join(str(i) for i in issues).lower()


def _by_node(plan: dict[str, object]) -> dict[str, dict[str, object]]:
    out: dict[str, dict[str, object]] = {}
    for raw in plan.get("tasks") or []:
        if isinstance(raw, dict) and isinstance(raw.get("node"), str):
            out[str(raw["node"])] = raw
    return out


def _parent_pointers(plan: dict[str, object]) -> int:
    total = 0
    for raw in plan.get("tasks") or []:
        if isinstance(raw, dict) and isinstance(raw.get("parents"), list):
            total += len(raw["parents"])
    return total


def _review_pointers(plan: dict[str, object]) -> int:
    total = 0
    for raw in plan.get("tasks") or []:
        if isinstance(raw, dict) and isinstance(raw.get("reviewChildren"), list):
            total += len(raw["reviewChildren"])
    return total


def _check_plan_shape(plan: dict[str, object], n_nodes: int) -> list[str]:
    fails: list[str] = []
    if plan.get("compiler") != "hermes":
        fails.append(f"compiler {plan.get('compiler')!r} != hermes")
    if plan.get("profile") != "hermes":
        fails.append(f"profile {plan.get('profile')!r} != hermes")
    if plan.get("status") == "dry-run-unclaimed":
        fails.append("status must leave dry-run-unclaimed")
    if plan.get("status") != "dry-run":
        fails.append(f"status {plan.get('status')!r} != dry-run")
    tasks = plan.get("tasks")
    if not isinstance(tasks, list) or len(tasks) != n_nodes:
        fails.append(f"tasks len {0 if not isinstance(tasks, list) else len(tasks)} != {n_nodes}")
        return fails
    ids: list[str] = []
    for i, raw in enumerate(tasks):
        if not isinstance(raw, dict):
            fails.append(f"tasks[{i}] not an object")
            continue
        tid = raw.get("id")
        if not isinstance(tid, str) or not TASK_ID_RE.match(tid):
            fails.append(f"tasks[{i}].id {tid!r} is not t_[8 hex]")
        else:
            ids.append(tid)
        if not isinstance(raw.get("node"), str):
            fails.append(f"tasks[{i}].node missing")
        if not isinstance(raw.get("kind"), str):
            fails.append(f"tasks[{i}].kind missing")
        if not isinstance(raw.get("parents"), list):
            fails.append(f"tasks[{i}].parents must be an array")
        if not isinstance(raw.get("reviewChildren"), list):
            fails.append(f"tasks[{i}].reviewChildren must be an array")
    if len(ids) != len(set(ids)):
        fails.append("duplicate Kanban task ids")
    extra = PLAN_FORBIDDEN & set(plan)
    if extra:
        fails.append(f"plan must not carry {sorted(extra)}")
    return fails


def _check_intent_loop(plan: dict[str, object]) -> list[str]:
    fails = _check_plan_shape(plan, INTENT_LOOP_TASKS)
    if _parent_pointers(plan) != INTENT_LOOP_PARENT_POINTERS:
        fails.append(f"intent-loop parent pointers {_parent_pointers(plan)} != {INTENT_LOOP_PARENT_POINTERS}")
    if _review_pointers(plan) != INTENT_LOOP_REVIEW_CHILDREN:
        fails.append(f"intent-loop review children {_review_pointers(plan)} != {INTENT_LOOP_REVIEW_CHILDREN}")
    by_node = _by_node(plan)
    want = by_node.get("want")
    agent = by_node.get("agent")
    check = by_node.get("check")
    kevin = by_node.get("kevin")
    if not want or not agent or not check or not kevin:
        fails.append("intent-loop missing want/agent/check/kevin tasks")
        return fails
    if want.get("parents") != []:
        fails.append("want must have no parents")
    if agent.get("parents") != [want.get("id")]:
        fails.append("agent parents must be [want]")
    if agent.get("harness") != "hermes":
        fails.append(f"agent harness {agent.get('harness')!r} != hermes")
    if check.get("kind") != "verifier":
        fails.append("check must stay a verifier")
    if kevin.get("kind") != "humanGate":
        fails.append("kevin must stay a humanGate")
    if kevin.get("reviewChildren") != []:
        fails.append("humanGate is not a review parent")
    if check.get("id") not in (agent.get("reviewChildren") or []):
        fails.append("agent reviewChildren must include check")
    if kevin.get("id") in (agent.get("reviewChildren") or []):
        fails.append("humanGate must not be a review child")
    for task in plan.get("tasks") or []:
        if isinstance(task, dict) and kevin.get("id") in (task.get("reviewChildren") or []):
            fails.append(f"{task.get('node')} reviewChildren includes humanGate")
    return fails


def _check_hermes_dry_run(plan: dict[str, object]) -> list[str]:
    fails = _check_plan_shape(plan, HERMES_DRY_RUN_TASKS)
    if _parent_pointers(plan) != HERMES_DRY_RUN_PARENT_POINTERS:
        fails.append(
            f"hermes-dry-run parent pointers {_parent_pointers(plan)} != {HERMES_DRY_RUN_PARENT_POINTERS}"
        )
    if _review_pointers(plan) != HERMES_DRY_RUN_REVIEW_CHILDREN:
        fails.append(
            f"hermes-dry-run review children {_review_pointers(plan)} != {HERMES_DRY_RUN_REVIEW_CHILDREN}"
        )
    by_node = _by_node(plan)
    intent = by_node.get("intent")
    agent = by_node.get("agent")
    tool = by_node.get("tool")
    verify = by_node.get("verify")
    if not intent or not agent or not tool or not verify:
        fails.append("hermes-dry-run missing intent/agent/tool/verify")
        return fails
    if agent.get("parents") != [intent.get("id")]:
        fails.append("agent parents must be [intent]")
    if tool.get("parents") != [agent.get("id")]:
        fails.append("tool parents must be [agent]")
    if verify.get("id") not in (tool.get("reviewChildren") or []):
        fails.append("tool reviewChildren must include verify")
    if agent.get("harness") != "hermes":
        fails.append(f"agent harness {agent.get('harness')!r} != hermes")
    if "harness" in verify:
        fails.append("verifier must not bind a harness")
    return fails


def _assert_three_objects(doc: dict[str, object], plan: dict[str, object]) -> list[str]:
    fails: list[str] = []
    intent = json.dumps(doc.get("intentGraph"), sort_keys=True)
    events = json.dumps(doc.get("eventLog"), sort_keys=True) if "eventLog" in doc else None
    clone = json.loads(json.dumps(doc))
    again, issues = compile_document(clone)
    if issues or again is None:
        fails.append("second compile failed")
        return fails
    if json.dumps(clone.get("intentGraph"), sort_keys=True) != intent:
        fails.append("compile mutated intentGraph")
    if events is not None and json.dumps(clone.get("eventLog"), sort_keys=True) != events:
        fails.append("compile mutated eventLog")
    if json.dumps(plan, sort_keys=True) != json.dumps(again, sort_keys=True):
        fails.append("compile is not deterministic")
    if plan.get("status") == "dry-run-unclaimed":
        fails.append("claimed plan status is still dry-run-unclaimed")
    return fails


def _compile_ok(path: Path) -> list[str]:
    doc = load_json(path)
    if not isinstance(doc, dict):
        return ["document is not an object"]
    snapshot = json.dumps(doc, sort_keys=True)
    n_nodes = len((doc.get("intentGraph") or {}).get("nodes") or [])
    plan, issues = compile_document(doc)
    if issues or plan is None:
        return [f"expected pass: {_issues_blob(issues) or 'no plan'}"]
    if json.dumps(doc, sort_keys=True) != snapshot:
        return ["compile mutated the input document"]
    fails = _check_plan_shape(plan, n_nodes)
    if path.stem == "intent-loop":
        fails.extend(_check_intent_loop(plan))
    elif path.stem == "hermes-dry-run":
        fails.extend(_check_hermes_dry_run(plan))
    fails.extend(_assert_three_objects(doc, plan))
    embedded = doc.get("plan")
    if isinstance(embedded, dict) and path.stem in {"intent-loop", "hermes-dry-run"}:
        if embedded.get("status") == "dry-run-unclaimed":
            fails.append("fixture plan is still dry-run-unclaimed")
        if json.dumps(embedded, sort_keys=True) != json.dumps(plan, sort_keys=True):
            fails.append("fixture plan does not match compiler output")
    return fails


def _compile_stop(path: Path, expect: str) -> list[str]:
    doc = load_json(path)
    if not isinstance(doc, dict):
        return ["document is not an object"]
    if path.parent.name != "invalid":
        valid_issues = validate(doc)
        if valid_issues:
            return [f"compile-stop fixture must pass validate: {_issues_blob(valid_issues)}"]
    plan, issues = compile_document(doc)
    if plan is not None:
        return ["compile produced a plan (expected stop)"]
    if not issues:
        return ["compile stopped without issues"]
    blob = _issues_blob(issues)
    if expect.lower() not in blob:
        return [f"wanted {expect!r} in {_issues_blob(issues)!r}"]
    return []


def _run_corpus() -> int:
    failed = 0
    valid_files = sorted(VALID_DIR.glob("*.json"))
    stop_files = sorted(STOP_DIR.glob("*.json"))
    if not (STOP_DIR / "message.json").exists() or not (STOP_DIR / "mesh.json").exists():
        print("FAIL missing compile-stop message/mesh fixtures", file=sys.stderr)
        return 1

    for path in valid_files:
        if path.stem in COMPILE_SKIP_VERSION:
            print(f"skip {path.relative_to(ROOT)} (not hotl-0.2)")
            continue
        if path.stem in COMPILE_STOP_VALID:
            continue
        fails = _compile_ok(path)
        if fails:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT)}")
            for fail in fails:
                print(f"  {fail}")
        else:
            print(f"ok   {path.relative_to(ROOT)}")

    stop_paths = list(stop_files)
    stop_paths.append(VALID_DIR / "market.json")
    stop_paths.append(INVALID_DIR / "payment-execution.json")
    seen: set[str] = set()
    for path in stop_paths:
        expect = STOP_EXPECT.get(path.stem)
        if expect is None:
            failed += 1
            print(f"FAIL unexpected compile-stop {path.relative_to(ROOT)}")
            continue
        seen.add(path.stem)
        fails = _compile_stop(path, expect)
        if fails:
            failed += 1
            print(f"FAIL {path.relative_to(ROOT)} (wanted {expect!r})")
            for fail in fails:
                print(f"  {fail}")
        else:
            print(f"ok   {path.relative_to(ROOT)} -> stop {expect}")

    missing = set(STOP_EXPECT) - seen
    if missing:
        print(f"FAIL missing compile-stop coverage: {sorted(missing)}")
        failed += 1

    if failed:
        print(f"{failed} failure(s)")
        return 1
    print("compile corpus matched")
    return 0


def main(argv: list[str]) -> int:
    if len(argv) > 1:
        exit_code = 0
        for arg in argv[1:]:
            path = Path(arg)
            doc = load_json(path)
            plan, issues = compile_document(doc)
            if issues or plan is None:
                exit_code = 1
                print(f"{path}: FAIL")
                for issue in issues:
                    print(f"  {issue}")
            else:
                print(json.dumps(plan, indent=2, sort_keys=True))
        return exit_code
    return _run_corpus()


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
