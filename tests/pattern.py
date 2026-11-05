#!/usr/bin/env python3
"""Pattern templates: compile, admit, enforce. Fail then pass.

Run: python3 tests/pattern.py
"""

from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
import importlib.util  # noqa: E402

from aodl_contract import validate  # noqa: E402

_spec = importlib.util.spec_from_file_location("aodl_pattern_compiler", ROOT / "compiler" / "pattern.py")
assert _spec and _spec.loader
P = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(P)

FAIL = 0


def check(name: str, cond: bool, detail: object = "") -> None:
    global FAIL
    print(("OK   " if cond else "FAIL ") + name + (f"  {detail}" if not cond and detail else ""))
    FAIL += 0 if cond else 1


def codes(issues) -> set[str]:
    return {i.code for i in issues}


inst = json.loads((ROOT / "patterns/instances/kevin-council-4x4.json").read_text())
tpl = P.load_template(inst["pattern"])
routes = P.load_routes()
params = inst["params"]

# --- compile: the owner's 4x4 council is a valid HOTL 0.2 document
doc, issues = P.compile_pattern(tpl, params, routes, inst["instanceId"])
check("4x4 council compiles", doc is not None and not issues, [str(i) for i in issues])
assert doc is not None
check("compiled doc passes the AODL validator", validate(doc) == [])
check("36 research leases reserved", sum(l["count"] for l in doc["plan"]["leases"]) == 36)
check("budget matches leases", doc["constraints"]["budgets"]["researchSpawns"] == 36)
check("quorum = all four seats", doc["policies"]["quorum"] == 4)
check("plan is deterministic", P.compile_pattern(tpl, params, routes, inst["instanceId"])[0] == doc)

# --- compile-time laws
bad = dict(params, rounds=9)
check("rounds over the template max is rejected", "finite-bounds" in codes(P.compile_pattern(tpl, bad, routes)[1]))
bad = dict(params, seats=["argon", "astra", "gpt-7"])
check("unlisted model alias is rejected", "route-alias-only" in codes(P.compile_pattern(tpl, bad, routes)[1]))
bad = dict(params, researchPool={"free": 9})
check("pool over maxPerClass is rejected", "finite-bounds" in codes(P.compile_pattern(tpl, bad, routes)[1]))
r2 = copy.deepcopy(routes)
r2["aliases"]["astra"]["route"] = "hermes"
check("Astra inside Hermes breaks gpt-via-fx", "route-law" in codes(P.compile_pattern(tpl, params, r2)[1]))
r3 = copy.deepcopy(routes)
r3["aliases"]["argon"]["route"] = "hermes"
check("Gemini outside agy breaks gemini-via-agy", "route-law" in codes(P.compile_pattern(tpl, params, r3)[1]))

# --- admission: exact-route preflight, no substitution
good = {s["alias"]: {"exit": 0, "text": "ok", "usageOk": True, "observedModel": s["model"]} for s in doc["plan"]["seats"]}
check("all seats preflighted -> admitted", P.admit(doc, good) == [])
sub = copy.deepcopy(good)
sub["fable-5.1"]["observedModel"] = "claude-opus-5-5"
check("substituted seat model blocks admission", "seat-preflight" in codes(P.admit(doc, sub)))
missing = {k: v for k, v in good.items() if k != "argon"}
check("missing seat receipt blocks admission", "seat-preflight" in codes(P.admit(doc, missing)))

# --- run: replay a legal council, then each violation
seats = [s["alias"] for s in doc["plan"]["seats"]]
model = {s["alias"]: s["model"] for s in doc["plan"]["seats"]}
FREE = frozenset({"llama-4-scout:free", "qwen3-coder:free"})


def legal_run() -> list[dict]:
    events: list[dict] = []
    prev: dict[str, str] = {}
    for rnd in range(1, 5):
        cur: dict[str, str] = {}
        for s in seats:
            tid = f"r{rnd}.{s}"
            cites = [] if rnd == 1 else [prev[p] for p in seats if p != s]
            events.append({"type": "turn", "id": tid, "seat": s, "round": rnd, "observedModel": model[s], "cites": cites})
            cur[s] = tid
            if rnd == 1:
                for i in range(5):
                    events.append({"type": "spawn", "id": f"{s}.free{i}", "seat": s, "class": "free", "depth": 1, "observedModel": "qwen3-coder:free"})
                for i in range(2):
                    events.append({"type": "spawn", "id": f"{s}.luna{i}", "seat": s, "class": "luna", "depth": 1, "observedModel": "gpt-6-luna"})
                    events.append({"type": "spawn", "id": f"{s}.haiku{i}", "seat": s, "class": "haiku-5.5", "depth": 1, "observedModel": "claude-haiku-5-5"})
        prev = cur
    return events


run = legal_run()
check("legal 4-round council with 36 spawns passes", P.enforce(doc, run, FREE) == [], [str(i) for i in P.enforce(doc, run, FREE)])
extra = run + [{"type": "turn", "id": "r5.opus", "seat": "opus-5.5", "round": 5, "observedModel": "claude-opus-5-5", "cites": []}]
check("a 5th round is rejected", "round-token" in codes(P.enforce(doc, extra, FREE)))
sixth = run + [{"type": "spawn", "id": "astra.free5", "seat": "astra", "class": "free", "depth": 1, "observedModel": "qwen3-coder:free"}]
check("a 6th free agent is rejected", "spawn-lease" in codes(P.enforce(doc, sixth, FREE)))
sonnet = run + [{"type": "spawn", "id": "opus.sonnet", "seat": "opus-5.5", "class": "sonnet", "depth": 1, "observedModel": "x"}]
check("an unleased class is rejected", "spawn-lease" in codes(P.enforce(doc, sonnet, FREE)))
deep = [e if e.get("id") != "argon.luna0" else dict(e, depth=2) for e in run]
check("depth-2 delegation is rejected", "spawn-lease" in codes(P.enforce(doc, deep, FREE)))
paid = [e if e.get("id") != "argon.free0" else dict(e, observedModel="claude-opus-5-5") for e in run]
check("free lease answered by a paid model is rejected", "observed-model" in codes(P.enforce(doc, paid, FREE)))
peek = [e if e.get("id") != "r1.astra" else dict(e, cites=["r1.argon"]) for e in run]
check("round 1 peeking at a peer is rejected", "peer-text" in codes(P.enforce(doc, peek, FREE)))
skip = [e if e.get("id") != "r3.argon" else dict(e, cites=[]) for e in run]
check("examination without peer text is rejected", "peer-text" in codes(P.enforce(doc, skip, FREE)))
twice = run[:1] + run[:1]
check("a second turn in the same round is rejected", "round-token" in codes(P.enforce(doc, twice, FREE)))

print(f"\n{'FAIL' if FAIL else 'PASS'}: {FAIL} failing checks")
sys.exit(1 if FAIL else 0)
