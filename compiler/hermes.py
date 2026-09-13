#!/usr/bin/env python3
"""Hermes dry-run compiler. Zero dependencies. Fail closed.

Input: a valid HOTL 0.2 document. Output: an immutable Kanban-shaped `plan`.
Does not spawn Hermes, does not execute, does not invent observed runtime.

Upstream: https://github.com/NousResearch/hermes-agent/issues/88589
Profile: profiles/hermes.md

Usage:
  python3 compiler/hermes.py path/to/doc.json
"""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tests"))

from validate import Issue, validate  # noqa: E402

PEER_KINDS = frozenset({"executor", "task", "model", "service"})
REVIEW_RELATIONS = frozenset({"verification", "critique"})
STATUS_DRY_RUN = "dry-run"
STATUS_UNCLAIMED = "dry-run-unclaimed"


def _as_dict(value: object) -> dict[str, object]:
    return value if isinstance(value, dict) else {}


def _as_list(value: object) -> list[object]:
    return value if isinstance(value, list) else []


def _source_hash(doc: dict[str, object]) -> str:
    provenance = _as_dict(doc.get("provenance"))
    source = provenance.get("sourceHash")
    return str(source) if isinstance(source, str) else ""


def _kanban_id(source_hash: str, node_id: str) -> str:
    digest = hashlib.sha256(f"{source_hash}:{node_id}".encode()).hexdigest()
    return f"t_{digest[:8]}"


def _idempotency_key(doc: dict[str, object], source_hash: str) -> str:
    payload = {
        "graphId": doc.get("graphId"),
        "revision": doc.get("revision"),
        "sourceHash": source_hash,
        "specVersion": doc.get("specVersion"),
    }
    blob = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(blob.encode()).hexdigest()


def _node_map(graph: dict[str, object]) -> dict[str, dict[str, object]]:
    out: dict[str, dict[str, object]] = {}
    for item in _as_list(graph.get("nodes")):
        node = _as_dict(item)
        ident = node.get("id")
        if isinstance(ident, str):
            out[ident] = node
    return out


def _edges(graph: dict[str, object]) -> list[dict[str, object]]:
    out: list[dict[str, object]] = []
    for item in _as_list(graph.get("edges")):
        edge = _as_dict(item)
        if edge:
            out.append(edge)
    return out


def _peer_pairs(nodes: dict[str, dict[str, object]], edges: list[dict[str, object]]) -> set[tuple[str, str]]:
    pairs: set[tuple[str, str]] = set()
    for edge in edges:
        if edge.get("relation") not in {"data", "message"}:
            continue
        frm = edge.get("from")
        to = edge.get("to")
        if not isinstance(frm, str) or not isinstance(to, str) or frm == to:
            continue
        left = nodes.get(frm)
        right = nodes.get(to)
        if not left or not right:
            continue
        if left.get("kind") not in PEER_KINDS or right.get("kind") not in PEER_KINDS:
            continue
        pair = tuple(sorted((frm, to)))
        pairs.add((str(pair[0]), str(pair[1])))
    return pairs


def _mesh_silhouette(nodes: dict[str, dict[str, object]], edges: list[dict[str, object]]) -> bool:
    peers = [ident for ident, node in nodes.items() if node.get("kind") in PEER_KINDS]
    if len(peers) < 3:
        return False
    pairs = _peer_pairs(nodes, edges)
    for i, a in enumerate(peers):
        for b in peers[i + 1 :]:
            if tuple(sorted((a, b))) not in pairs:
                return False
    return True


def _unsupported(doc: dict[str, object]) -> list[Issue]:
    issues: list[Issue] = []
    graph = _as_dict(doc.get("intentGraph"))
    nodes = _node_map(graph)
    edges = _edges(graph)
    policies = _as_dict(doc.get("policies"))
    kinds = policies.get("kinds")
    kind_set = {str(k) for k in kinds} if isinstance(kinds, list) else set()

    for edge in edges:
        if edge.get("relation") == "message":
            issues.append(
                Issue("message", f"unsupported message: edge {edge.get('id')} is not a Hermes Kanban relation")
            )

    if "mesh" in kind_set or _mesh_silhouette(nodes, edges):
        issues.append(Issue("mesh", "unsupported mesh: peer density is visualization-only until Hermes has a contract"))

    if "auction" in kind_set or "auction" in policies:
        issues.append(Issue("auction", "unsupported auction: marketplace allocation does not compile to Kanban"))

    return issues


def _project(doc: dict[str, object]) -> dict[str, object]:
    graph = _as_dict(doc.get("intentGraph"))
    nodes = _node_map(graph)
    edges = _edges(graph)
    source_hash = _source_hash(doc)
    ids = {ident: _kanban_id(source_hash, ident) for ident in nodes}

    parents: dict[str, list[str]] = {ident: [] for ident in nodes}
    reviews: dict[str, list[str]] = {ident: [] for ident in nodes}
    for edge in edges:
        frm = edge.get("from")
        to = edge.get("to")
        if not isinstance(frm, str) or not isinstance(to, str):
            continue
        if frm not in ids or to not in ids:
            continue
        rel = edge.get("relation")
        if rel == "dependency":
            parents[to].append(ids[frm])
        elif rel in REVIEW_RELATIONS and nodes[to].get("kind") == "verifier":
            reviews[frm].append(ids[to])

    tasks: list[dict[str, object]] = []
    for ident in sorted(nodes):
        node = nodes[ident]
        task: dict[str, object] = {
            "id": ids[ident],
            "node": ident,
            "kind": node.get("kind"),
        }
        harness = node.get("harness")
        if isinstance(harness, str) and node.get("kind") == "executor":
            task["harness"] = harness
        task["parents"] = sorted(set(parents[ident]))
        task["reviewChildren"] = sorted(set(reviews[ident]))
        tasks.append(task)

    return {
        "compiler": "hermes",
        "profile": "hermes",
        "status": STATUS_DRY_RUN,
        "specVersion": doc.get("specVersion"),
        "graphId": doc.get("graphId"),
        "revision": doc.get("revision"),
        "sourceHash": source_hash,
        "idempotencyKey": _idempotency_key(doc, source_hash),
        "tasks": tasks,
    }


def compile_document(doc: object) -> tuple[dict[str, object] | None, list[Issue]]:
    """Return (plan, issues). Never mutates `doc`. Never writes eventLog."""
    if not isinstance(doc, dict):
        return None, [Issue("type", "document must be an object")]
    issues = validate(doc)
    if issues:
        return None, issues
    if doc.get("specVersion") != "0.2":
        return None, [Issue("version", "Hermes dry-run compiles hotl-0.2 only")]
    blocked = _unsupported(doc)
    if blocked:
        return None, blocked
    plan = _project(doc)
    if plan.get("status") == STATUS_UNCLAIMED:
        return None, [Issue("compile", "status must leave dry-run-unclaimed")]
    return copy.deepcopy(plan), []


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: python3 compiler/hermes.py <doc.json>", file=sys.stderr)
        return 2
    exit_code = 0
    for arg in argv[1:]:
        path = Path(arg)
        doc = json.loads(path.read_text())
        plan, issues = compile_document(doc)
        if issues or plan is None:
            exit_code = 1
            print(f"{path}: FAIL")
            for issue in issues:
                print(f"  {issue}")
        else:
            print(json.dumps(plan, indent=2))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
