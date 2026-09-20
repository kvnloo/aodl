#!/usr/bin/env python3
"""AODL Mesh Registry — fail-closed catalog of domain tools.

Not HOTL 0.3. Does not validate orchestration documents.
Does not add harness ids. Zero dependencies.

Usage:
  python3 tests/mesh_registry.py
"""

from __future__ import annotations

import copy
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = ROOT / "schema" / "mesh-registry.schema.json"
REGISTRY_PATH = ROOT / "mesh" / "registry.json"
FIXTURE_DIR = ROOT / "tests" / "fixtures" / "mesh"
HARNESS_PATH = ROOT / "harnesses" / "catalog.json"
HOTL_FIXTURE = ROOT / "examples" / "valid" / "pipeline.json"

sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests"))
from aodl_contract import Issue, validate  # noqa: E402
from validate import load_json  # noqa: E402

ID_RE = re.compile(r"^[a-z][a-z0-9-]{0,63}$")
STAGES = (
    "specify",
    "resolve",
    "render",
    "plan",
    "execute",
    "verify",
    "evaluate",
    "learn",
)
STATUSES = ("reference", "candidate", "adapter", "native")
FORBIDDEN_HARNESS_IDS = frozenset({"langchain", "llm", "shadcn", "shadcn-lint", "jev"})
# Mesh ids that would look like a new harness. shadcn-lint is a registry row, not a harness.
FORBIDDEN_MESH_IDS = frozenset({"langchain", "llm", "shadcn"})
ENTRY_REQUIRED = ("id", "stage", "domain", "modalities", "role", "status", "satisfies")
ENTRY_OPTIONAL = ("note", "url", "inTree", "harnessId", "alsoStages")
ROOT_REQUIRED = (
    "schemaVersion",
    "hotlSpecVersion",
    "rule",
    "stages",
    "statuses",
    "evidence",
    "modalities",
    "entries",
)
MESH_HOTL_KEYS = frozenset({"evidence_required", "meshRegistry", "meshCatalog"})

INVALID_EXPECT = {
    "duplicate-ids": "duplicate id",
    "unknown-stage": "unknown stage",
    "unknown-status": "unknown status",
}


def _as_dict(value: object, path: str, issues: list[Issue]) -> dict[str, object] | None:
    if not isinstance(value, dict):
        issues.append(Issue("type", f"{path} must be an object"))
        return None
    return value


def _as_list(value: object, path: str, issues: list[Issue]) -> list[object] | None:
    if not isinstance(value, list):
        issues.append(Issue("type", f"{path} must be an array"))
        return None
    return value


def _schema_item_enum(schema: dict[str, object], name: str) -> tuple[str, ...]:
    props = schema.get("properties")
    if not isinstance(props, dict):
        return ()
    rec = props.get(name)
    if not isinstance(rec, dict):
        return ()
    items = rec.get("items")
    if not isinstance(items, dict):
        return ()
    enum = items.get("enum")
    if not isinstance(enum, list) or not all(isinstance(x, str) for x in enum):
        return ()
    return tuple(enum)


def _entry_enum(schema: dict[str, object], field: str) -> tuple[str, ...]:
    defs = schema.get("$defs")
    if not isinstance(defs, dict):
        return ()
    entry = defs.get("entry")
    if not isinstance(entry, dict):
        return ()
    props = entry.get("properties")
    if not isinstance(props, dict):
        return ()
    rec = props.get(field)
    if not isinstance(rec, dict):
        return ()
    enum = rec.get("enum")
    if isinstance(enum, list) and all(isinstance(x, str) for x in enum):
        return tuple(enum)
    items = rec.get("items")
    if isinstance(items, dict):
        nested = items.get("enum")
        if isinstance(nested, list) and all(isinstance(x, str) for x in nested):
            return tuple(nested)
    return ()


def validate_schema_file(schema: object) -> list[Issue]:
    issues: list[Issue] = []
    doc = _as_dict(schema, "schema", issues)
    if doc is None:
        return issues
    if doc.get("additionalProperties") is not False:
        issues.append(Issue("schema", "root additionalProperties must be false"))
    defs = doc.get("$defs")
    if not isinstance(defs, dict) or not isinstance(defs.get("entry"), dict):
        issues.append(Issue("schema", "missing $defs.entry"))
        return issues
    entry = defs["entry"]
    if not isinstance(entry, dict):
        issues.append(Issue("schema", "$defs.entry must be an object"))
        return issues
    if entry.get("additionalProperties") is not False:
        issues.append(Issue("schema", "entry additionalProperties must be false"))
    if tuple(_entry_enum(doc, "stage")) != STAGES:
        issues.append(Issue("schema", "entry.stage enum must match pipeline stages"))
    if tuple(_entry_enum(doc, "status")) != STATUSES:
        issues.append(Issue("schema", "entry.status enum must match statuses"))
    if _entry_enum(doc, "satisfies") != _schema_item_enum(doc, "evidence"):
        issues.append(Issue("schema", "satisfies enum must match evidence vocabulary"))
    if _entry_enum(doc, "modalities") != _schema_item_enum(doc, "modalities"):
        issues.append(Issue("schema", "entry.modalities enum must match modalities vocabulary"))
    return issues


def validate_registry(doc: object, schema: dict[str, object]) -> list[Issue]:
    issues: list[Issue] = []
    root = _as_dict(doc, "registry", issues)
    if root is None:
        return issues
    extra = sorted(set(root) - set(ROOT_REQUIRED))
    missing = [k for k in ROOT_REQUIRED if k not in root]
    if extra:
        issues.append(Issue("closed", f"unknown fields {extra}"))
    if missing:
        issues.append(Issue("required", f"missing {missing}"))
        return issues
    if root.get("schemaVersion") != 1:
        issues.append(Issue("schema", "schemaVersion must be 1"))
    if root.get("hotlSpecVersion") != "0.2":
        issues.append(Issue("schema", "hotlSpecVersion must be 0.2"))
    if not isinstance(root.get("rule"), str) or not root["rule"]:
        issues.append(Issue("type", "rule must be a nonempty string"))
    stages = root.get("stages")
    if stages != list(STAGES):
        issues.append(Issue("stages", f"stages must be {list(STAGES)} in order"))
    statuses = root.get("statuses")
    if statuses != list(STATUSES):
        issues.append(Issue("status", f"statuses must be {list(STATUSES)} in order"))
    evidence_vocab = _schema_item_enum(schema, "evidence")
    modalities_vocab = _schema_item_enum(schema, "modalities")
    evidence = root.get("evidence")
    if not isinstance(evidence, list) or tuple(evidence) != evidence_vocab:
        issues.append(Issue("evidence", "evidence vocabulary must match the schema enum"))
    modalities = root.get("modalities")
    if not isinstance(modalities, list) or tuple(modalities) != modalities_vocab:
        issues.append(Issue("modalities", "modalities vocabulary must match the schema enum"))
    entries = _as_list(root.get("entries"), "entries", issues)
    if entries is None:
        return issues
    seen: dict[str, int] = {}
    catalog_ids = _harness_ids()
    for i, raw in enumerate(entries):
        path = f"entries[{i}]"
        rec = _as_dict(raw, path, issues)
        if rec is None:
            continue
        extra_e = sorted(set(rec) - set(ENTRY_REQUIRED) - set(ENTRY_OPTIONAL))
        if extra_e:
            issues.append(Issue("closed", f"{path} unknown fields {extra_e}"))
        for key in ENTRY_REQUIRED:
            if key not in rec:
                issues.append(Issue("required", f"{path} missing {key}"))
        ident = rec.get("id")
        if not isinstance(ident, str) or not ID_RE.match(ident):
            issues.append(Issue("id", f"{path} id must be kebab-case"))
        elif ident in seen:
            issues.append(Issue("id", f"duplicate id {ident!r}"))
        else:
            seen[ident] = i
        stage = rec.get("stage")
        if stage not in STAGES:
            issues.append(Issue("stage", f"{path} unknown stage {stage!r}"))
        status = rec.get("status")
        if status not in STATUSES:
            issues.append(Issue("status", f"{path} unknown status {status!r}"))
        domain = rec.get("domain")
        if not isinstance(domain, str) or not domain.strip():
            issues.append(Issue("domain", f"{path} domain must be a nonempty string"))
        role = rec.get("role")
        if not isinstance(role, str) or not role.strip():
            issues.append(Issue("role", f"{path} role must be a nonempty string"))
        mods = rec.get("modalities")
        if not isinstance(mods, list) or not mods:
            issues.append(Issue("modalities", f"{path} modalities must be a nonempty array"))
        else:
            for m in mods:
                if m not in modalities_vocab:
                    issues.append(Issue("modalities", f"{path} unknown modality {m!r}"))
        sat = rec.get("satisfies")
        if not isinstance(sat, list) or not sat:
            issues.append(Issue("evidence", f"{path} satisfies must be a nonempty array"))
        else:
            for ev in sat:
                if ev not in evidence_vocab:
                    issues.append(Issue("evidence", f"{path} unknown evidence {ev!r}"))
        if "url" in rec:
            url = rec.get("url")
            if not isinstance(url, str) or not url.startswith("https://"):
                issues.append(Issue("url", f"{path} url must be an https URL"))
        if "note" in rec and (not isinstance(rec.get("note"), str) or not rec["note"]):
            issues.append(Issue("note", f"{path} note must be a nonempty string"))
        if "inTree" in rec:
            rel = rec.get("inTree")
            if not isinstance(rel, str) or not rel or Path(rel).is_absolute() or ".." in Path(rel).parts:
                issues.append(Issue("inTree", f"{path} inTree must be a relative in-repo path"))
            elif not (ROOT / rel).exists():
                issues.append(Issue("inTree", f"{path} inTree missing {rel}"))
        if "harnessId" in rec:
            hid = rec.get("harnessId")
            if hid is not None:
                if not isinstance(hid, str) or hid not in catalog_ids:
                    issues.append(Issue("harness", f"{path} harnessId {hid!r} is not a catalog id"))
                if hid in FORBIDDEN_HARNESS_IDS:
                    issues.append(Issue("harness", f"{path} forbidden harness id {hid!r}"))
        if ident in FORBIDDEN_MESH_IDS:
            issues.append(Issue("harness", f"{path} mesh id {ident!r} is not allowed (not a harness id)"))
        also = rec.get("alsoStages")
        if "alsoStages" in rec:
            if not isinstance(also, list) or not also:
                issues.append(Issue("stages", f"{path} alsoStages must be a nonempty array"))
            else:
                for st in also:
                    if st not in STAGES:
                        issues.append(Issue("stage", f"{path} unknown stage {st!r}"))
                    if st == stage:
                        issues.append(Issue("stages", f"{path} alsoStages must not repeat primary stage"))
    return issues


def _harness_ids() -> set[str]:
    if not HARNESS_PATH.exists():
        return set()
    raw = load_json(HARNESS_PATH)
    if not isinstance(raw, dict):
        return set()
    supported = raw.get("supported")
    if not isinstance(supported, list):
        return set()
    return {x for x in supported if isinstance(x, str)}


def _collect_keys(value: object) -> set[str]:
    keys: set[str] = set()
    if isinstance(value, dict):
        keys.update(value)
        for child in value.values():
            keys.update(_collect_keys(child))
    elif isinstance(value, list):
        for child in value:
            keys.update(_collect_keys(child))
    return keys


def _by_id(entries: list[object]) -> dict[str, dict[str, object]]:
    out: dict[str, dict[str, object]] = {}
    for raw in entries:
        if isinstance(raw, dict) and isinstance(raw.get("id"), str):
            out[str(raw["id"])] = raw
    return out


def _pin_seeds(doc: dict[str, object]) -> list[Issue]:
    issues: list[Issue] = []
    entries = doc.get("entries")
    if not isinstance(entries, list):
        return [Issue("entries", "entries missing")]
    by_id = _by_id(entries)

    def need(ident: str) -> dict[str, object] | None:
        rec = by_id.get(ident)
        if rec is None:
            issues.append(Issue("seed", f"missing seed id {ident}"))
        return rec

    aodl = need("aodl")
    if aodl is not None:
        if aodl.get("stage") != "specify" or aodl.get("status") != "native":
            issues.append(Issue("seed", "aodl must be specify/native"))
        if aodl.get("inTree") != "schema/hotl-0.2.schema.json":
            issues.append(Issue("seed", "aodl inTree must be schema/hotl-0.2.schema.json"))
    hermes = need("hermes")
    if hermes is not None:
        if hermes.get("stage") != "plan" or hermes.get("status") != "adapter":
            issues.append(Issue("seed", "hermes plan compiler must be plan/adapter"))
        if hermes.get("inTree") != "compiler/hermes.py":
            issues.append(Issue("seed", "hermes inTree must be compiler/hermes.py"))
        if hermes.get("harnessId") != "hermes":
            issues.append(Issue("seed", "hermes harnessId must be catalog id hermes"))
    ripple = need("ripple")
    if ripple is not None:
        if ripple.get("stage") != "resolve" or ripple.get("status") != "candidate":
            issues.append(Issue("seed", "ripple must be resolve/candidate"))
        if "inTree" in ripple:
            issues.append(Issue("seed", "ripple is not this tree"))
        url = ripple.get("url")
        if url != "https://github.com/kvnloo/ripple":
            issues.append(Issue("seed", "ripple url must be kvnloo/ripple"))
    langgraph = need("langgraph")
    if langgraph is not None:
        if langgraph.get("status") != "reference" or langgraph.get("stage") != "plan":
            issues.append(Issue("seed", "langgraph must be plan/reference"))
        if "harnessId" in langgraph:
            issues.append(Issue("seed", "langgraph is not a harness id"))
        if "inTree" in langgraph:
            issues.append(Issue("seed", "langgraph profile is not on preview"))
    lint = need("shadcn-lint")
    if lint is not None:
        if lint.get("stage") != "verify" or lint.get("status") != "reference":
            issues.append(Issue("seed", "shadcn-lint must be verify/reference"))
        if "design_system_compliance" not in (lint.get("satisfies") or []):
            issues.append(Issue("seed", "shadcn-lint must satisfy design_system_compliance"))
        if "harnessId" in lint:
            issues.append(Issue("seed", "shadcn-lint is not a harness id"))
    kerdoios = need("kerdoios")
    if kerdoios is not None:
        if kerdoios.get("status") != "candidate" or kerdoios.get("stage") != "execute":
            issues.append(Issue("seed", "kerdoios must be execute/candidate"))
        if "url" in kerdoios:
            issues.append(Issue("seed", "kerdoios has no known public URL — do not invent one"))
    jev = need("jev")
    if jev is not None:
        if jev.get("status") != "candidate" or jev.get("stage") != "resolve":
            issues.append(Issue("seed", "jev must be resolve/candidate"))
        if jev.get("role") != "probabilistic-decision-engine":
            issues.append(Issue("seed", "jev role must be probabilistic-decision-engine"))
        also = jev.get("alsoStages")
        if not isinstance(also, list) or set(also) != {"plan", "verify"}:
            issues.append(Issue("seed", "jev alsoStages must be plan and verify"))
        sat = jev.get("satisfies") or []
        if "calibrated_decision" not in sat:
            issues.append(Issue("seed", "jev must satisfy calibrated_decision"))
        if "harnessId" in jev:
            issues.append(Issue("seed", "jev is not a harness id"))
        if "inTree" in jev:
            issues.append(Issue("seed", "jev is not this tree"))
        url = jev.get("url")
        if url != "https://typesafe.ai/blog/introducing-system-one-models-and-jev":
            issues.append(Issue("seed", "jev url must be the TypeSafe System One announcement"))
    o8 = need("o8")
    if o8 is not None:
        if o8.get("harnessId") != "o8":
            issues.append(Issue("seed", "o8 harnessId must be catalog id o8"))
        if o8.get("status") not in {"candidate", "reference"}:
            issues.append(Issue("seed", "o8 has no in-tree compiler; not native/adapter"))
    return issues


def _pin_hotl_untouched() -> list[Issue]:
    issues: list[Issue] = []
    if not HOTL_FIXTURE.exists():
        return [Issue("hotl", f"missing {HOTL_FIXTURE.relative_to(ROOT)}")]
    doc = load_json(HOTL_FIXTURE)
    keys = _collect_keys(doc)
    leaked = sorted(keys & MESH_HOTL_KEYS)
    if leaked:
        issues.append(Issue("hotl", f"HOTL fixture has mesh keys {leaked}"))
    hotl_issues = validate(doc)
    if hotl_issues:
        issues.append(Issue("hotl", f"pipeline.json must still validate: {hotl_issues[0]}"))
    if not isinstance(doc, dict):
        return issues
    mutated = copy.deepcopy(doc)
    mutated["evidence_required"] = ["visual_similarity"]
    extra_issues = validate(mutated)
    blob = " ".join(str(i) for i in extra_issues).lower()
    if not extra_issues or "unknown fields" not in blob:
        issues.append(Issue("hotl", "HOTL must fail closed on evidence_required"))
    catalog = _harness_ids()
    leaked_harness = sorted(catalog & FORBIDDEN_HARNESS_IDS)
    if leaked_harness:
        issues.append(Issue("harness", f"forbidden harness ids present {leaked_harness}"))
    return issues


def _run_in_memory_negatives(schema: dict[str, object], registry: dict[str, object]) -> list[Issue]:
    issues: list[Issue] = []
    dup = copy.deepcopy(registry)
    entries = dup.get("entries")
    if isinstance(entries, list) and entries and isinstance(entries[0], dict):
        entries.append(copy.deepcopy(entries[0]))
        found = validate_registry(dup, schema)
        blob = " ".join(str(i) for i in found).lower()
        if "duplicate id" not in blob:
            issues.append(Issue("negative", "duplicate ids must fail"))
    bad_stage = copy.deepcopy(registry)
    ents = bad_stage.get("entries")
    if isinstance(ents, list) and ents and isinstance(ents[0], dict):
        ents[0]["stage"] = "deploy"
        found = validate_registry(bad_stage, schema)
        blob = " ".join(str(i) for i in found).lower()
        if "unknown stage" not in blob:
            issues.append(Issue("negative", "unknown stage must fail"))
    bad_status = copy.deepcopy(registry)
    ents = bad_status.get("entries")
    if isinstance(ents, list) and ents and isinstance(ents[0], dict):
        ents[0]["status"] = "experimental"
        found = validate_registry(bad_status, schema)
        blob = " ".join(str(i) for i in found).lower()
        if "unknown status" not in blob:
            issues.append(Issue("negative", "unknown status must fail"))
    return issues


def main() -> int:
    failed = 0
    if not SCHEMA_PATH.exists():
        print("FAIL missing schema/mesh-registry.schema.json")
        return 1
    if not REGISTRY_PATH.exists():
        print("FAIL missing mesh/registry.json")
        return 1
    schema = load_json(SCHEMA_PATH)
    schema_issues = validate_schema_file(schema)
    if schema_issues:
        failed += 1
        print("FAIL schema/mesh-registry.schema.json")
        for issue in schema_issues:
            print(f"  {issue}")
    else:
        print("ok   schema/mesh-registry.schema.json")
    if not isinstance(schema, dict):
        print("FAIL schema is not an object")
        return 1
    registry = load_json(REGISTRY_PATH)
    issues = validate_registry(registry, schema)
    if issues:
        failed += 1
        print("FAIL mesh/registry.json")
        for issue in issues:
            print(f"  {issue}")
    else:
        print("ok   mesh/registry.json")
    if isinstance(registry, dict):
        seed_issues = _pin_seeds(registry)
        if seed_issues:
            failed += 1
            print("FAIL mesh registry seed pins")
            for issue in seed_issues:
                print(f"  {issue}")
        else:
            print("ok   mesh registry seed pins")
        neg = _run_in_memory_negatives(schema, registry)
        if neg:
            failed += 1
            print("FAIL in-memory negatives")
            for issue in neg:
                print(f"  {issue}")
        else:
            print("ok   in-memory duplicate/unknown stage/status")
    hotl = _pin_hotl_untouched()
    if hotl:
        failed += 1
        print("FAIL HOTL documents must not need mesh fields")
        for issue in hotl:
            print(f"  {issue}")
    else:
        print("ok   examples/valid/pipeline.json needs no mesh fields")
    if not FIXTURE_DIR.is_dir():
        print("FAIL missing tests/fixtures/mesh")
        failed += 1
    else:
        files = sorted(FIXTURE_DIR.glob("*.json"))
        stems = {p.stem for p in files}
        missing = set(INVALID_EXPECT) - stems
        extra = stems - set(INVALID_EXPECT)
        if missing:
            failed += 1
            print(f"FAIL missing mesh fixtures: {sorted(missing)}")
        if extra:
            failed += 1
            print(f"FAIL unexpected mesh fixtures: {sorted(extra)}")
        for path in files:
            expect = INVALID_EXPECT.get(path.stem)
            fixture = load_json(path)
            found = validate_registry(fixture, schema)
            blob = " ".join(str(i) for i in found).lower()
            if not found:
                failed += 1
                print(f"FAIL {path.relative_to(ROOT)} (expected fail)")
            elif expect and expect not in blob:
                failed += 1
                print(f"FAIL {path.relative_to(ROOT)} (wanted {expect!r})")
                for issue in found:
                    print(f"  {issue}")
            else:
                print(f"ok   {path.relative_to(ROOT)} -> {found[0]}")
    if failed:
        print(f"{failed} failure(s)")
        return 1
    n_entries = 0
    if isinstance(registry, dict) and isinstance(registry.get("entries"), list):
        n_entries = len(registry["entries"])
    print(f"mesh registry matched — {n_entries} entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
