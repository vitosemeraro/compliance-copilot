"""PALO Readiness Panel — punteggio di trustworthiness del tool (F12).

Framework PALO mappato su ISO 42001 / ISO 42005 / EU AI Act / NIST AI RMF.

Principio non negoziabile: il punteggio SUPPORTA il giudizio umano, non lo
sostituisce. Alcuni indicatori sono AUTOMATICI (calcolati dai dati di sessione),
altri sono MANUALI/HITL (un umano li valida, con autore + data). Finché i campi
HITL non sono validati, il punteggio complessivo NON è "verde pieno".
"""
from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from typing import Any

from . import audit
from .config import DATA_DIR

PALO_DIR = DATA_DIR / "palo"
MANUAL_FILE = PALO_DIR / "manual.json"
HISTORY_FILE = PALO_DIR / "history.jsonl"

_LOCK = threading.Lock()
DEFAULT_VALIDATOR = "Vito R. — AI Productivity Lead"

# --- Definizione dei campi MANUALI/HITL ----------------------------------
# type: bool | score (0..1) | enum
MANUAL_FIELDS: dict[str, dict[str, Any]] = {
    "impact_assessment": {"label": "Impact assessment (ISO 42005) svolto?", "type": "bool", "dim": "data_gov"},
    "fairness_review": {"label": "Fairness review del caso d'uso", "type": "score", "dim": "fairness"},
    "raci": {"label": "Accountability / RACI definito?", "type": "bool", "dim": "human"},
    "eu_risk_tier": {"label": "EU AI Act — risk tier", "type": "enum",
                     "options": ["minimal", "limited", "high", "unacceptable"], "dim": "eu"},
    "gate_decision": {"label": "Gate decision", "type": "enum",
                      "options": ["go", "conditional", "nogo"], "dim": "gov"},
}

DIMENSIONS = [
    {"key": "data_gov", "label": "Data Governance & Privacy", "weight": 0.20},
    {"key": "transparency", "label": "Transparency & Safety", "weight": 0.25},
    {"key": "human", "label": "Human Agency & Oversight", "weight": 0.20},
    {"key": "fairness", "label": "Fairness & Accountability", "weight": 0.25},
    {"key": "environmental", "label": "Environmental Sustainability", "weight": 0.10},
]


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# --- Persistenza dei campi manuali ---------------------------------------

def _read_manual() -> dict[str, Any]:
    if not MANUAL_FILE.exists():
        return {}
    try:
        return json.loads(MANUAL_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def _write_manual(data: dict[str, Any]) -> None:
    PALO_DIR.mkdir(parents=True, exist_ok=True)
    MANUAL_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _append_history(snapshot: dict[str, Any]) -> None:
    PALO_DIR.mkdir(parents=True, exist_ok=True)
    with HISTORY_FILE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(snapshot, ensure_ascii=False) + "\n")


def _read_history() -> list[dict[str, Any]]:
    if not HISTORY_FILE.exists():
        return []
    out = []
    with HISTORY_FILE.open("r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                out.append(json.loads(line))
    return out


def _ensure_seed() -> None:
    """Stato iniziale realistico: alcuni campi validati, altri pendenti, e
    una piccola storia di readiness in crescita (per il trend)."""
    if MANUAL_FILE.exists():
        return
    manual = {
        "fairness_review": {"value": 0.8, "note": "Caso d'uso a basso rischio di bias; variabili proxy presidiate dal guardrail.", "by": DEFAULT_VALIDATOR, "at": "2026-05-12T10:00:00+00:00"},
        "eu_risk_tier": {"value": "limited", "note": "Copilota di retrieval/bozza, nessuna decisione automatizzata su persone.", "by": DEFAULT_VALIDATOR, "at": "2026-05-12T10:05:00+00:00"},
        # impact_assessment, raci, gate_decision → pendenti (non impostati)
    }
    _write_manual(manual)
    # storia sintetica (readiness in crescita)
    if not HISTORY_FILE.exists():
        for ts, overall in [("2026-04-01T09:00:00+00:00", 54), ("2026-04-20T09:00:00+00:00", 63),
                            ("2026-05-12T09:00:00+00:00", 71)]:
            _append_history({"ts": ts, "overall": overall, "complete": False})


# --- Indicatori AUTO -----------------------------------------------------

def _auto() -> dict[str, Any]:
    rows = audit.reconstruct_rows()
    total = len(rows) or 1
    with_sources = sum(1 for r in rows if (r.get("sources") or []))
    explainability = round(100 * with_sources / total)
    grounded = sum(1 for r in rows if r.get("grounded"))
    grounding = round(100 * grounded / total)
    reviewed = sum(1 for r in rows if r.get("outcome"))
    oversight = round(100 * reviewed / total)
    privacy_incidents = 0
    guardrail_rows = [r for r in rows if r.get("guardrail")]
    guardrail_resolved = sum(1 for r in guardrail_rows if r.get("outcome"))
    antibias = round(100 * guardrail_resolved / len(guardrail_rows)) if guardrail_rows else 100

    events = audit.read_events()
    up = sum(1 for e in events if e.get("event_type") == "feedback" and e.get("vote") == "up")
    down = sum(1 for e in events if e.get("event_type") == "feedback" and e.get("vote") == "down")
    adoption = round(100 * up / (up + down)) if (up + down) else None

    return {
        "explainability": explainability,
        "grounding": grounding,
        "oversight": oversight,
        "privacy_incidents": privacy_incidents,
        "privacy": 100 if privacy_incidents == 0 else max(0, 100 - 20 * privacy_incidents),
        "antibias": antibias,
        "guardrail_total": len(guardrail_rows),
        "guardrail_resolved": guardrail_resolved,
        "adoption": adoption,
    }


def _manual_contribution(key: str, manual: dict[str, Any]) -> tuple[int | None, dict[str, Any]]:
    """Ritorna (contributo 0-100 o None se pendente, descrittore campo)."""
    spec = MANUAL_FIELDS[key]
    entry = manual.get(key)
    validated = bool(entry)
    value = entry.get("value") if entry else None
    contrib: int | None = None
    if validated:
        if spec["type"] == "bool":
            contrib = 100 if value else 0
        elif spec["type"] == "score":
            contrib = round(float(value) * 100)
        elif spec["type"] == "enum":
            if key == "eu_risk_tier":
                contrib = 100  # aver classificato il rischio = readiness
            elif key == "gate_decision":
                contrib = {"go": 100, "conditional": 60, "nogo": 0}.get(value, 0)
            else:
                contrib = 100
    field = {
        "key": key, "label": spec["label"], "type": spec["type"],
        "options": spec.get("options"), "dim": spec["dim"],
        "value": value, "note": entry.get("note") if entry else "",
        "by": entry.get("by") if entry else None, "at": entry.get("at") if entry else None,
        "validated": validated,
    }
    return contrib, field


# --- Calcolo dello stato completo ----------------------------------------

def compute_state() -> dict[str, Any]:
    _ensure_seed()
    manual = _read_manual()
    auto = _auto()

    # campi manuali (descrittori per la UI)
    fields = {}
    contrib = {}
    for key in MANUAL_FIELDS:
        c, f = _manual_contribution(key, manual)
        fields[key] = f
        contrib[key] = c

    # --- dimension score ---
    def dim_block(key, label, auto_parts, manual_keys):
        # auto_parts: lista di (nome, valore). manual_keys: campi manuali della dimensione.
        items = []
        scores = []
        for name, val in auto_parts:
            items.append({"name": name, "value": val, "kind": "auto"})
            scores.append(val)
        pending = False
        for mk in manual_keys:
            c = contrib[mk]
            items.append({"name": fields[mk]["label"], "value": c, "kind": "manual",
                          "validated": fields[mk]["validated"], "by": fields[mk]["by"], "at": fields[mk]["at"]})
            if c is None:
                pending = True
            else:
                scores.append(c)
        score = round(sum(scores) / len(scores)) if scores else 0
        status = "pending" if pending else "ok"
        return {"key": key, "label": label, "score": score, "status": status, "indicators": items}

    dims = {
        "data_gov": dim_block("data_gov", "Data Governance & Privacy",
                              [("Privacy incidents (0)", auto["privacy"])], ["impact_assessment"]),
        "transparency": dim_block("transparency", "Transparency & Safety",
                                  [("Explainability", auto["explainability"]), ("Grounding rate", auto["grounding"])], []),
        "human": dim_block("human", "Human Agency & Oversight",
                           [("Human oversight rate", auto["oversight"])], ["raci"]),
        "fairness": dim_block("fairness", "Fairness & Accountability",
                              [("Anti-bias triggers gestiti", auto["antibias"])], ["fairness_review"]),
    }
    # environmental: placeholder per la POC
    dims["environmental"] = {"key": "environmental", "label": "Environmental Sustainability",
                             "score": 85, "status": "placeholder",
                             "indicators": [{"name": "Stima placeholder (POC)", "value": 85, "kind": "auto"}]}

    # --- overall ---
    overall = 0.0
    for d in DIMENSIONS:
        overall += dims[d["key"]]["score"] * d["weight"]
    overall = round(overall)
    hitl_pending = [k for k in MANUAL_FIELDS if not fields[k]["validated"]]
    complete = len(hitl_pending) == 0
    gate = fields["gate_decision"]["value"] if fields["gate_decision"]["validated"] else None

    # --- framework alignment ---
    iso42001 = round((auto["oversight"] + auto["grounding"] + auto["antibias"]) / 3)
    iso42005 = contrib["impact_assessment"] if contrib["impact_assessment"] is not None else None
    eu_ai_act = contrib["eu_risk_tier"] if contrib["eu_risk_tier"] is not None else None
    nist_map = 100 if fields["eu_risk_tier"]["validated"] else 40
    nist = round((100 + nist_map + round((auto["grounding"] + auto["oversight"]) / 2) + auto["oversight"]) / 4)
    frameworks = [
        {"key": "iso42001", "label": "ISO 42001", "value": iso42001, "pending": False},
        {"key": "iso42005", "label": "ISO 42005", "value": iso42005 or 0, "pending": iso42005 is None},
        {"key": "eu_ai_act", "label": "EU AI Act Readiness", "value": eu_ai_act or 0, "pending": eu_ai_act is None},
        {"key": "nist_rmf", "label": "NIST AI RMF", "value": nist, "pending": False},
    ]

    # --- raccomandazioni ---
    recs = []
    if auto["explainability"] < 90:
        recs.append(f"Explainability {auto['explainability']}% — alcune risposte non citano fonti: rivedi il grounding.")
    if auto["oversight"] < 70:
        recs.append(f"Human oversight {auto['oversight']}% — troppe risposte non revisionate: smaltisci la coda di revisione.")
    for k in hitl_pending:
        recs.append(f"Valida “{MANUAL_FIELDS[k]['label']}” (campo HITL in attesa).")

    return {
        "overall": overall,
        "complete": complete,
        "status": "complete" if complete else "provisional",
        "hitl_pending": hitl_pending,
        "gate_decision": gate,
        "dimensions": [dims[d["key"]] for d in DIMENSIONS],
        "frameworks": frameworks,
        "fields": fields,
        "recommendations": recs,
        "auto": auto,
        "history": _read_history(),
        "computed_at": _now(),
    }


def set_field(key: str, value: Any, note: str = "", by: str = "") -> dict[str, Any]:
    if key not in MANUAL_FIELDS:
        raise ValueError(f"Campo non valido: {key}")
    spec = MANUAL_FIELDS[key]
    # validazione minima
    if spec["type"] == "enum" and value not in spec["options"]:
        raise ValueError(f"Valore non ammesso per {key}: {value}")
    with _LOCK:
        _ensure_seed()
        manual = _read_manual()
        manual[key] = {"value": value, "note": note, "by": by or DEFAULT_VALIDATOR, "at": _now()}
        _write_manual(manual)
        state = compute_state()
        _append_history({"ts": _now(), "overall": state["overall"], "complete": state["complete"]})
        state["history"] = _read_history()
    return state
