#!/usr/bin/env python3
"""Pattern-template compiler and enforcer. Zero dependencies. Fail closed.

A pattern template (patterns/*.pattern.json) plus parameters compiles to an
ordinary HOTL 0.2 document: intent graph + policies + constraints + a `plan`
whose compiler is "pattern". The plan reserves finite leases (seats, round
tokens, research spawns per seat and class). Nothing here launches agents.

Three checks, one per law phase:
  compile(template, params)      -> (doc, issues)   laws with when="compile"
  admit(doc, preflight)          -> issues          laws with when="admit"
  enforce(doc, events)           -> issues          laws with when="run"

`enforce` is a pure replay over an event list, so a launcher can call it
before acting (reject the next event) and a reviewer can call it after
(audit a finished run). Same function both ways.

Usage:
  python3 compiler/pattern.py patterns/instances/kevin-council-4x4.json
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from aodl_contract import Issue, validate  # noqa: E402

PATTERNS = ROOT / "patterns"
PORTS = [
    {"id": "in", "direction": "in", "schema": "Task"},
    {"id": "out", "direction": "out", "schema": "Task"},
]
DELIVERY = {"order": "ordered", "idempotent": True, "timeoutMs": 600000, "maxRetries": 0}


def _sha(obj: object) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def load_routes() -> dict:
    return json.loads((PATTERNS / "routes.json").read_text())


def load_template(pattern_id: str) -> dict:
    path = PATTERNS / f"{pattern_id}.pattern.json"
    if not path.is_file():
        raise FileNotFoundError(f"unknown pattern {pattern_id!r}")
    return json.loads(path.read_text())


def _node(ident: str, kind: str, harness: str | None = None) -> dict:
    node = {
        "id": ident,
        "kind": kind,
        "ports": PORTS,
        "capabilities": ["execute"],
        "authorityCeiling": ["execute"],
        "lifecycle": "declared",
    }
    if harness:
        node["harness"] = harness
    return node


def _edge(relation: str, frm: str, to: str, source_hash: str, depth: int = 0) -> dict:
    return {
        "id": f"e-{relation}-{frm}-{to}".replace(".", "_"),
        "relation": relation,
        "from": frm,
        "to": to,
        "fromPort": "out",
        "toPort": "in",
        "delivery": DELIVERY,
        "authority": {"grant": ["execute"], "delegationDepth": depth},
        "provenance": {"sourceHash": source_hash},
    }


def _slug(alias: str) -> str:
    return alias.replace(".", "_")


# ---------------------------------------------------------------- compile


def check_params(template: dict, params: dict, routes: dict) -> list[Issue]:
    issues: list[Issue] = []
    spec = template.get("parameters", {})
    aliases = routes.get("aliases", {})
    laws = {law["provider"]: law for law in routes.get("routeLaws", [])}

    rounds = params.get("rounds")
    rs = spec.get("rounds", {})
    if not isinstance(rounds, int) or not rs.get("min", 1) <= rounds <= rs.get("max", 1):
        issues.append(Issue("finite-bounds", f"rounds must be an integer in [{rs.get('min')}, {rs.get('max')}], got {rounds!r}"))

    seats = params.get("seats")
    ss = spec.get("seats", {})
    if not isinstance(seats, list) or not ss.get("minItems", 1) <= len(seats) <= ss.get("maxItems", 1):
        issues.append(Issue("finite-bounds", f"seats must list {ss.get('minItems')}..{ss.get('maxItems')} aliases"))
        seats = seats if isinstance(seats, list) else []
    if len(set(map(str, seats))) != len(seats):
        issues.append(Issue("finite-bounds", "seats must be unique"))

    pool = params.get("researchPool", {})
    ps = spec.get("researchPool", {})
    if not isinstance(pool, dict):
        issues.append(Issue("finite-bounds", "researchPool must map alias -> count"))
        pool = {}
    for cls, count in pool.items():
        if not isinstance(count, int) or not 0 <= count <= ps.get("maxPerClass", 0):
            issues.append(Issue("finite-bounds", f"researchPool[{cls}] must be 0..{ps.get('maxPerClass')}, got {count!r}"))
    if sum(c for c in pool.values() if isinstance(c, int)) > ps.get("maxPerSeat", 0):
        issues.append(Issue("finite-bounds", f"research agents per seat exceed maxPerSeat {ps.get('maxPerSeat')}"))

    depth = params.get("maxDelegationDepth", spec.get("maxDelegationDepth", {}).get("default", 1))
    ds = spec.get("maxDelegationDepth", {})
    if not isinstance(depth, int) or not ds.get("min", 0) <= depth <= ds.get("max", 0):
        issues.append(Issue("finite-bounds", f"maxDelegationDepth must be {ds.get('min')}..{ds.get('max')}"))

    for alias in [*seats, *pool.keys()]:
        entry = aliases.get(alias)
        if entry is None:
            issues.append(Issue("route-alias-only", f"{alias!r} is not a route alias in patterns/routes.json"))
            continue
        law = laws.get(entry["provider"])
        if law and entry["route"] not in law["allowedRoutes"]:
            issues.append(Issue("route-law", f"{alias}: route {entry['route']} breaks {law['id']} ({law['why']})"))
    return issues


def compile_pattern(template: dict, params: dict, routes: dict | None = None, instance_id: str = "instance") -> tuple[dict | None, list[Issue]]:
    routes = routes or load_routes()
    issues = check_params(template, params, routes)
    if issues:
        return None, issues

    aliases = routes["aliases"]
    seats: list[str] = params["seats"]
    pool: dict[str, int] = {k: v for k, v in params.get("researchPool", {}).items() if v > 0}
    rounds: int = params["rounds"]
    depth: int = params.get("maxDelegationDepth", 1)
    source_hash = _sha({"pattern": template["id"], "version": template["patternVersion"], "params": params})

    nodes = [_node("brief", "task")]
    edges = []
    seat_ids = []
    leases = []
    for alias in seats:
        sid = f"seat.{_slug(alias)}"
        seat_ids.append(sid)
        nodes.append(_node(sid, "executor", aliases[alias]["harness"]))
        edges.append(_edge("dependency", "brief", sid, source_hash))
        for cls, count in pool.items():
            pid = f"pool.{_slug(alias)}.{_slug(cls)}"
            nodes.append(_node(pid, "executor", aliases[cls]["harness"]))
            edges.append(_edge("delegation", sid, pid, source_hash, depth=depth))
            edges.append(_edge("artifact", pid, sid, source_hash))
            leases.append({"seat": alias, "class": cls, "count": count, "route": aliases[cls]["route"], "model": aliases[cls]["model"]})
    # Peer examination: every seat critiques every other seat (not a dependency, so no cycle).
    for a in seat_ids:
        for b in seat_ids:
            if a != b:
                edges.append(_edge("critique", a, b, source_hash))
    nodes += [_node("synthesis", "task"), _node("check", "verifier"), _node("owner", "humanGate")]
    for sid in seat_ids:
        edges.append(_edge("dependency", sid, "synthesis", source_hash))
    edges.append(_edge("verification", "synthesis", "check", source_hash))
    edges.append(_edge("control", "check", "owner", source_hash))
    edges.append(_edge("observation", "owner", "brief", source_hash))

    total_spawns = sum(pool.values()) * len(seats)
    doc = {
        "specVersion": "0.2",
        "graphId": f"pattern-{template['id']}-{instance_id}",
        "revision": 0,
        "intentGraph": {"nodes": nodes, "edges": edges},
        "policies": {
            "kinds": ["fanout", "reducer", "human_gate"],
            "fanIn": "quorum",
            "quorum": len(seats),
            "reducer": "synthesis",
            "protocol": template["method"]["id"],
            "dynamic": {"allowed": total_spawns > 0, "maxChildren": max(sum(pool.values()), 1), "maxDepth": max(depth, 1)},
        },
        "constraints": {
            "budgets": {"rounds": rounds, "seats": len(seats), "researchSpawns": total_spawns, "attention": 1},
            "termination": {"on": "humanGate.approved"},
        },
        "provenance": {"source": f"pattern:{template['id']}@{template['patternVersion']}", "sourceHash": source_hash},
    }
    doc["plan"] = {
        "compiler": "pattern",
        "profile": "pattern-template",
        "status": "dry-run",
        "pattern": template["id"],
        "paramsHash": _sha(params),
        "topology": template["topology"],
        "rounds": rounds,
        "seats": [{"alias": a, "node": f"seat.{_slug(a)}", **{k: aliases[a][k] for k in ("provider", "route", "model")}} for a in seats],
        "leases": leases,
        "maxDelegationDepth": depth,
        "laws": [law["id"] for law in template["laws"]],
    }
    doc["plan"]["planHash"] = _sha({k: v for k, v in doc["plan"].items() if k != "planHash"})
    issues = validate(doc)
    return (doc if not issues else None), issues


# ---------------------------------------------------------------- admit


def admit(doc: dict, preflight: dict[str, dict]) -> list[Issue]:
    """preflight[alias] = {"exit": int, "text": str, "usageOk": bool, "observedModel": str}."""
    issues: list[Issue] = []
    for seat in doc["plan"]["seats"]:
        p = preflight.get(seat["alias"])
        if p is None:
            issues.append(Issue("seat-preflight", f"{seat['alias']}: no preflight receipt"))
            continue
        if p.get("exit") != 0 or not str(p.get("text") or "").strip() or not p.get("usageOk"):
            issues.append(Issue("seat-preflight", f"{seat['alias']}: preflight failed (exit/text/usage)"))
        if p.get("observedModel") != seat["model"]:
            issues.append(Issue("seat-preflight", f"{seat['alias']}: observed {p.get('observedModel')!r} != requested {seat['model']!r}; no substitution"))
    return issues


# ---------------------------------------------------------------- run


def enforce(doc: dict, events: list[dict], free_models: frozenset[str] | None = None) -> list[Issue]:
    """Replay run events against the plan's leases.

    Event shapes:
      {"type": "turn",  "id": str, "seat": alias, "round": int, "observedModel": str, "cites": [turn ids]}
      {"type": "spawn", "id": str, "seat": alias, "class": alias, "depth": int, "observedModel": str}
    """
    plan = doc["plan"]
    issues: list[Issue] = []
    seats = {s["alias"]: s for s in plan["seats"]}
    remaining = {(l["seat"], l["class"]): l["count"] for l in plan["leases"]}
    lease_model = {(l["seat"], l["class"]): l["model"] for l in plan["leases"]}
    current_round = 1
    turns_by_round: dict[int, dict[str, str]] = {}

    for ev in events:
        kind = ev.get("type")
        seat = ev.get("seat")
        if seat not in seats:
            issues.append(Issue("spawn-lease", f"{ev.get('id')}: unknown seat {seat!r}"))
            continue
        if kind == "turn":
            rnd = ev.get("round")
            tid = str(ev.get("id"))
            if not isinstance(rnd, int):
                issues.append(Issue("round-token", f"{tid}: turn without an integer round"))
                continue
            done = turns_by_round.get(current_round, {})
            if rnd == current_round + 1 and len(done) == len(seats):
                current_round += 1
            if rnd != current_round or rnd > plan["rounds"]:
                issues.append(Issue("round-token", f"{ev.get('id')}: {seat} turn for round {rnd}, token is round {current_round} of {plan['rounds']}"))
                continue
            if seat in turns_by_round.setdefault(rnd, {}):
                issues.append(Issue("round-token", f"{ev.get('id')}: {seat} already spoke in round {rnd}"))
                continue
            if ev.get("observedModel") != seats[seat]["model"]:
                issues.append(Issue("observed-model", f"{ev.get('id')}: {seat} answered as {ev.get('observedModel')!r}"))
            cites = set(ev.get("cites", []))
            if rnd == 1 and cites:
                issues.append(Issue("peer-text", f"{ev.get('id')}: round 1 must be independent"))
            if rnd > 1:
                peers = {t for s, t in turns_by_round.get(rnd - 1, {}).items() if s != seat}
                if not peers <= cites:
                    issues.append(Issue("peer-text", f"{ev.get('id')}: missing peer turns {sorted(peers - cites)}"))
            turns_by_round[rnd][str(seat)] = tid
        elif kind == "spawn":
            key = (seat, ev.get("class"))
            if key not in remaining:
                issues.append(Issue("spawn-lease", f"{ev.get('id')}: {seat} has no {ev.get('class')!r} lease"))
                continue
            if ev.get("depth", 1) > plan["maxDelegationDepth"]:
                issues.append(Issue("spawn-lease", f"{ev.get('id')}: depth {ev.get('depth')} > {plan['maxDelegationDepth']}"))
                continue
            if remaining[key] <= 0:
                issues.append(Issue("spawn-lease", f"{ev.get('id')}: {seat} exhausted its {ev.get('class')} leases"))
                continue
            want = lease_model[key]
            got = ev.get("observedModel")
            ok = got in (free_models or frozenset()) if want == "vllm-sr/free" else got == want
            if not ok:
                issues.append(Issue("observed-model", f"{ev.get('id')}: {ev.get('class')} spawn answered as {got!r}"))
            remaining[key] -= 1
        else:
            issues.append(Issue("spawn-lease", f"unknown event type {kind!r}"))
    return issues


def compile_instance(path: Path) -> tuple[dict | None, list[Issue]]:
    inst = json.loads(path.read_text())
    return compile_pattern(load_template(inst["pattern"]), inst["params"], instance_id=inst["instanceId"])


def main(argv: list[str]) -> int:
    if len(argv) != 2:
        print(__doc__.strip().splitlines()[-1], file=sys.stderr)
        return 2
    doc, issues = compile_instance(Path(argv[1]))
    if issues:
        for i in issues:
            print(str(i), file=sys.stderr)
        return 1
    print(json.dumps(doc, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
