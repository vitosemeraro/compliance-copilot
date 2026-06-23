"""Audit trail append-only con catena di hash SHA-256 (F5).

Ogni interazione e ogni esito di revisione è un evento immutabile in append su
file JSONL. Ogni evento porta `prev_hash` e `hash` (SHA-256 del precedente +
contenuto): la catena rende il registro tamper-evident, come mostrato nel
design ("SHA-256 · registro immutabile").
"""
from __future__ import annotations

import hashlib
import json
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Iterable

from .config import AUDIT_LOG, MINUTES_SAVED_PER_QUERY

_LOCK = threading.Lock()

OUTCOME_LABELS = {"validata", "correggi", "scarta"}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical(event: dict[str, Any]) -> str:
    payload = {k: v for k, v in event.items() if k != "hash"}
    return json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def _last_hash() -> str:
    if not AUDIT_LOG.exists():
        return "GENESIS"
    last = "GENESIS"
    with AUDIT_LOG.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                try:
                    last = json.loads(line).get("hash", last)
                except json.JSONDecodeError:
                    continue
    return last


def _append(event: dict[str, Any]) -> dict[str, Any]:
    AUDIT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with _LOCK:
        prev = _last_hash()
        event["prev_hash"] = prev
        event["hash"] = hashlib.sha256((prev + _canonical(event)).encode("utf-8")).hexdigest()
        with AUDIT_LOG.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")
    return event


# --- Scrittura eventi -----------------------------------------------------

def log_interaction(
    *,
    user: str,
    question: str,
    lang: str,
    confidence: int,
    grounded: bool,
    needs_review: bool,
    out_of_corpus: bool,
    guardrail: bool,
    sources: list[dict[str, Any]],
    engine: str,
    ts: str | None = None,
    answer_segments: list[dict[str, Any]] | None = None,
    sources_full: list[dict[str, Any]] | None = None,
    guardrail_terms: list[str] | None = None,
    rationale: str = "",
) -> str:
    interaction_id = uuid.uuid4().hex[:12]
    event: dict[str, Any] = {
        "event_type": "interaction",
        "id": interaction_id,
        "ts": ts or _now_iso(),
        "user": user,
        "question": question,
        "lang": lang,
        "confidence": confidence,
        "grounded": grounded,
        "needs_review": needs_review,
        "out_of_corpus": out_of_corpus,
        "guardrail": guardrail,
        "sources": sources,
        "engine": engine,
    }
    # Payload completo della risposta: consente di riaprire fedelmente
    # l'interazione dal trail (riconsultare fonti, snippet, citazioni).
    if answer_segments is not None:
        event["answer_segments"] = answer_segments
    if sources_full is not None:
        event["sources_full"] = sources_full
    if guardrail_terms:
        event["guardrail_terms"] = guardrail_terms
    if rationale:
        event["rationale"] = rationale
    _append(event)
    return interaction_id


def log_review(*, interaction_id: str, outcome: str, user: str, note: str = "", ts: str | None = None) -> dict:
    if outcome not in OUTCOME_LABELS:
        raise ValueError(f"Esito non valido: {outcome}")
    return _append({
        "event_type": "review",
        "id": uuid.uuid4().hex[:12],
        "ts": ts or _now_iso(),
        "interaction_id": interaction_id,
        "outcome": outcome,
        "user": user,
        "note": note,
    })


def log_feedback(*, interaction_id: str, vote: str, comment: str = "", ts: str | None = None) -> dict:
    return _append({
        "event_type": "feedback",
        "id": uuid.uuid4().hex[:12],
        "ts": ts or _now_iso(),
        "interaction_id": interaction_id,
        "vote": vote,
        "comment": comment,
    })


# --- Lettura / ricostruzione ---------------------------------------------

def read_events() -> list[dict[str, Any]]:
    if not AUDIT_LOG.exists():
        return []
    events: list[dict[str, Any]] = []
    with AUDIT_LOG.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                events.append(json.loads(line))
    return events


def verify_chain(events: Iterable[dict[str, Any]] | None = None) -> bool:
    """Verifica l'integrità della catena di hash."""
    events = list(events) if events is not None else read_events()
    prev = "GENESIS"
    for ev in events:
        expected = hashlib.sha256((prev + _canonical(ev)).encode("utf-8")).hexdigest()
        if ev.get("hash") != expected or ev.get("prev_hash") != prev:
            return False
        prev = ev["hash"]
    return True


def reconstruct_rows() -> list[dict[str, Any]]:
    """Ricostruisce la tabella audit: ogni interazione con l'esito più recente."""
    events = read_events()
    interactions: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for ev in events:
        if ev["event_type"] == "interaction":
            interactions[ev["id"]] = {**ev, "outcome": None, "vote": None}
            order.append(ev["id"])
    for ev in events:
        iid = ev.get("interaction_id")
        if iid in interactions:
            if ev["event_type"] == "review":
                interactions[iid]["outcome"] = ev["outcome"]
            elif ev["event_type"] == "feedback":
                interactions[iid]["vote"] = ev["vote"]
    rows = [interactions[i] for i in order]
    rows.sort(key=lambda r: r["ts"], reverse=True)
    return rows


# Campi "pesanti" (risposta completa) da escludere dalla lista tabellare.
_HEAVY = ("answer_segments", "sources_full")


def rows_light() -> list[dict[str, Any]]:
    """Righe per la tabella audit, senza il payload pesante della risposta."""
    return [{k: v for k, v in r.items() if k not in _HEAVY} for r in reconstruct_rows()]


def get_interaction(interaction_id: str) -> dict[str, Any] | None:
    """Interazione completa (risposta + fonti + esito) per riaprirla dal trail."""
    for r in reconstruct_rows():
        if r["id"] == interaction_id:
            return r
    return None


# --- Statistiche per la dashboard ----------------------------------------

def dashboard_stats() -> dict[str, Any]:
    rows = reconstruct_rows()
    total = len(rows)
    grounded = sum(1 for r in rows if r["grounded"])
    escalations = sum(1 for r in rows if r["needs_review"])
    reviewed = [r for r in rows if r["outcome"]]
    validated = sum(1 for r in reviewed if r["outcome"] == "validata")
    fixed = sum(1 for r in reviewed if r["outcome"] == "correggi")
    discarded = sum(1 for r in reviewed if r["outcome"] == "scarta")
    n_rev = max(1, len(reviewed))

    # trend mensile (ultimi 12 mesi)
    buckets: dict[str, int] = {}
    for r in rows:
        key = r["ts"][:7]  # YYYY-MM
        buckets[key] = buckets.get(key, 0) + 1
    months_sorted = sorted(buckets.keys())[-12:]
    trend = [{"month": m, "count": buckets[m]} for m in months_sorted]

    # top temi (bucketing per parola chiave)
    topics = _top_topics(rows)
    # lacune del corpus: domande fuori-corpus o a bassa confidenza
    gaps = _corpus_gaps(rows)

    return {
        "total": total,
        "grounding_rate": round(100 * grounded / total) if total else 0,
        "escalation_rate": round(100 * escalations / total) if total else 0,
        "validated_rate": round(100 * validated / n_rev) if reviewed else 0,
        "outcomes": {
            "validated": round(100 * validated / n_rev) if reviewed else 0,
            "fixed": round(100 * fixed / n_rev) if reviewed else 0,
            "discarded": round(100 * discarded / n_rev) if reviewed else 0,
        },
        "hours_saved": round(total * MINUTES_SAVED_PER_QUERY / 60),
        "trend": trend,
        "topics": topics,
        "gaps": gaps,
        "chain_valid": verify_chain(),
    }


_TOPIC_RULES = [
    ("GDPR & dati personali", ["gdpr", "privacy", "dati personali", "conservazione", "biometric", "informativa"]),
    ("Pricing & IVASS", ["pricing", "premio", "ivass", "tariff", "cap", "sinistri", "rc auto"]),
    ("Antiriciclaggio (AML)", ["antiriciclaggio", "aml", "kyc", "adeguata verifica"]),
    ("Gestione sinistri", ["sinistr", "danni", "risarcimento"]),
    ("Contrattualistica", ["contratt", "recesso", "polizza", "clausol"]),
]


def _top_topics(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    counts = {name: 0 for name, _ in _TOPIC_RULES}
    for r in rows:
        q = r["question"].lower()
        for name, kws in _TOPIC_RULES:
            if any(kw in q for kw in kws):
                counts[name] += 1
                break
    items = [{"name": n, "count": c} for n, c in counts.items() if c > 0]
    items.sort(key=lambda x: x["count"], reverse=True)
    return items[:5]


def _corpus_gaps(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    gaps: dict[str, int] = {}
    for r in rows:
        if r["out_of_corpus"] or r["confidence"] < 60:
            key = r["question"].strip()
            gaps[key] = gaps.get(key, 0) + 1
    items = [{"question": q, "count": c} for q, c in gaps.items()]
    items.sort(key=lambda x: x["count"], reverse=True)
    return items[:5]
