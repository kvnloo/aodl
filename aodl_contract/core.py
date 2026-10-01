"""Canonical HOTL 0.2 intent contract projection and semantic identity.

This module is deliberately runtime-free. It canonicalizes authored AODL intent
semantics only; mutable plan/eventLog/observedGraph projections are excluded.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from .validator import validate

CORE_FORMAT = "aodl-core-v1"
_INTENT_FIELDS = (
    "specVersion",
    "graphId",
    "revision",
    "intentGraph",
    "policies",
    "constraints",
    "provenance",
)


def _canonical_key(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def _normalize(value: object) -> object:
    if isinstance(value, dict):
        return {str(key): _normalize(value[key]) for key in sorted(value, key=str)}
    if isinstance(value, list):
        return [_normalize(item) for item in value]
    return value


def _sorted_list(value: object) -> object:
    if not isinstance(value, list):
        return _normalize(value)
    items = [_normalize(item) for item in value]
    return sorted(items, key=_canonical_key)


def _canonical_node(node: object) -> object:
    if not isinstance(node, dict):
        return _normalize(node)
    out: dict[str, object] = {str(key): _normalize(value) for key, value in node.items()}
    if "ports" in out:
        out["ports"] = _sorted_list(out["ports"])
    for key in ("capabilities", "authorityCeiling"):
        if key in out:
            out[key] = _sorted_list(out[key])
    return _normalize(out)


def _canonical_edge(edge: object) -> object:
    if not isinstance(edge, dict):
        return _normalize(edge)
    out: dict[str, object] = {str(key): _normalize(value) for key, value in edge.items()}
    authority = out.get("authority")
    if isinstance(authority, dict) and "grant" in authority:
        authority = dict(authority)
        authority["grant"] = _sorted_list(authority["grant"])
        out["authority"] = authority
    return _normalize(out)


def _canonical_intent_graph(graph: object) -> object:
    if not isinstance(graph, dict):
        return _normalize(graph)
    out: dict[str, object] = {str(key): _normalize(value) for key, value in graph.items()}
    nodes = graph.get("nodes")
    if isinstance(nodes, list):
        out["nodes"] = sorted((_canonical_node(node) for node in nodes), key=_canonical_key)
    edges = graph.get("edges")
    if isinstance(edges, list):
        out["edges"] = sorted((_canonical_edge(edge) for edge in edges), key=_canonical_key)
    return _normalize(out)


def _canonical_policies(policies: object) -> object:
    if not isinstance(policies, dict):
        return _normalize(policies)
    out: dict[str, object] = {str(key): _normalize(value) for key, value in policies.items()}
    if "kinds" in out:
        out["kinds"] = _sorted_list(out["kinds"])
    return _normalize(out)


def to_core(document: object) -> dict[str, object]:
    """Return canonical authored HOTL 0.2 semantics.

    Validation is authoritative. Invalid input is rejected rather than
    normalized into a second interpretation of AODL.
    """

    issues = validate(document)
    if issues:
        raise ValueError("AODL validation failed: " + "; ".join(str(issue) for issue in issues))
    if not isinstance(document, dict) or document.get("specVersion") != "0.2":
        raise ValueError("AODL Core v1 requires specVersion 0.2")

    contract: dict[str, object] = {}
    for key in _INTENT_FIELDS:
        value = document[key]
        if key == "intentGraph":
            contract[key] = _canonical_intent_graph(value)
        elif key == "policies":
            contract[key] = _canonical_policies(value)
        else:
            contract[key] = _normalize(value)

    return {
        "coreFormat": CORE_FORMAT,
        "contract": _normalize(contract),
    }


def canonical_json(document: object) -> str:
    """Serialize AODL Core v1 deterministically."""

    return json.dumps(to_core(document), ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def semantic_fingerprint(document: object) -> str:
    """SHA-256 identity of the canonical authored intent contract."""

    return hashlib.sha256(canonical_json(document).encode("utf-8")).hexdigest()
