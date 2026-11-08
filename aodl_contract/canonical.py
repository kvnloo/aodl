"""HOTL 0.2 canonicalization and semantic fingerprint (spec/canonicalization.md, aodl-canon-1)."""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Any

from .validator import validate

CANON_VERSION = "aodl-canon-1"
_GRAPHS = ("intentGraph", "observedGraph")


class CanonicalizationError(ValueError):
    """Raised instead of approximating a document the rules do not cover."""


def _sort_by_id(items: list[Any], where: str) -> list[Any]:
    ids = [x.get("id") if isinstance(x, dict) else None for x in items]
    if any(not isinstance(i, str) for i in ids) or len(set(ids)) != len(ids):
        raise CanonicalizationError(f"{where}: every entry needs a unique string id")
    return sorted(items, key=lambda x: x["id"])


def _sort_strings(value: Any, where: str) -> Any:
    if value is None:
        return value
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise CanonicalizationError(f"{where}: expected a list of strings")
    return sorted(value)


def canonicalize(doc: dict[str, Any]) -> dict[str, Any]:
    """Return a new canonical document; the input is never mutated."""
    if not isinstance(doc, dict) or doc.get("specVersion") != "0.2":
        raise CanonicalizationError("only specVersion 0.2 (wire hotl-0.2) documents are canonicalized")
    issues = validate(doc)
    if issues:
        raise CanonicalizationError(f"document is not valid ({len(issues)} issue(s))")
    out = copy.deepcopy(doc)
    for g in _GRAPHS:
        graph = out.get(g)
        if not isinstance(graph, dict):
            continue
        for coll in ("nodes", "edges"):
            if isinstance(graph.get(coll), list):
                graph[coll] = _sort_by_id(graph[coll], f"{g}.{coll}")
        for node in graph.get("nodes") or []:
            if isinstance(node.get("ports"), list):
                node["ports"] = _sort_by_id(node["ports"], f"{g}.nodes[{node['id']}].ports")
            for key in ("capabilities", "authorityCeiling"):
                if key in node:
                    node[key] = _sort_strings(node[key], f"{g}.nodes[{node['id']}].{key}")
        for edge in graph.get("edges") or []:
            auth = edge.get("authority")
            if isinstance(auth, dict) and "grant" in auth:
                auth["grant"] = _sort_strings(auth["grant"], f"{g}.edges[{edge['id']}].authority.grant")
    policies = out.get("policies")
    if isinstance(policies, dict) and "kinds" in policies:
        policies["kinds"] = _sort_strings(policies["kinds"], "policies.kinds")
    for i, event in enumerate(out.get("eventLog") or []):  # order preserved: semantic
        if isinstance(event, dict) and "causalParents" in event:
            event["causalParents"] = _sort_strings(event["causalParents"], f"eventLog[{i}].causalParents")
    return out


def _strip_provenance(value: Any) -> Any:
    if isinstance(value, dict):
        return {k: _strip_provenance(v) for k, v in value.items() if k != "provenance"}
    if isinstance(value, list):
        return [_strip_provenance(v) for v in value]
    return value


def semantic_fingerprint(doc: dict[str, Any]) -> str:
    core = _strip_provenance(canonicalize(doc))
    payload = json.dumps(core, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return f"{CANON_VERSION}:{hashlib.sha256(payload.encode('utf-8')).hexdigest()}"
