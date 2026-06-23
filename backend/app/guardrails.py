"""Guardrail anti-discriminazione (F6).

Rileva variabili sensibili / proxy discriminatori in query e risposta. La
risposta NON viene bloccata: procede ma resta segnalata, in linea con lo spec
("la risposta procede, ma resta segnalata").
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .config import SENSITIVE_TERMS


@dataclass
class GuardrailResult:
    triggered: bool
    terms: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {"triggered": self.triggered, "terms": self.terms}


def _find_terms(text: str) -> list[str]:
    found: list[str] = []
    low = (text or "").lower()
    for term in SENSITIVE_TERMS:
        # confine di parola per evitare falsi positivi su sottostringhe
        if re.search(rf"(?<![a-zà-ù]){re.escape(term)}(?![a-zà-ù])", low):
            found.append(term)
    return found


def check(*texts: str) -> GuardrailResult:
    """Controlla uno o più testi (tipicamente query + risposta)."""
    terms: list[str] = []
    for t in texts:
        for term in _find_terms(t):
            if term not in terms:
                terms.append(term)
    return GuardrailResult(triggered=bool(terms), terms=terms)
