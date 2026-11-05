"""Importable AODL/HOTL contract validation."""

from .canonical import CANON_VERSION, CanonicalizationError, canonicalize, semantic_fingerprint
from .validator import (
    Issue,
    WIRE_SPEC,
    validate,
    validate_document,
    validate_document_messages,
    validate_or_raise,
    spec_revision,
)

__all__ = [
    "CANON_VERSION",
    "CanonicalizationError",
    "canonicalize",
    "semantic_fingerprint",
    "Issue",
    "WIRE_SPEC",
    "validate",
    "validate_document",
    "validate_document_messages",
    "validate_or_raise",
    "spec_revision",
]
