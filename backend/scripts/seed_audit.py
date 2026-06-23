"""Popola l'audit trail con uno storico dimostrativo.

Le 7 interazioni più recenti coincidono con quelle del design (tabella Audit).
Lo storico più ampio rende vive le KPI/grafici della dashboard. Tutti i dati
sono FITTIZI e di sessione: dimostrano il pattern, non rappresentano attività
reale.

    python scripts/seed_audit.py
"""
from __future__ import annotations

import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import audit  # noqa: E402
from app.config import AUDIT_LOG  # noqa: E402

random.seed(42)

USERS = [
    ("Giulia Bianchi", "it"), ("Luca Ferri", "it"), ("Sara Conti", "it"),
    ("Marco Rossi", "it"), ("Elena Greco", "it"),
]

# (domanda, topic-keyword incluso, confidenza tipica, possibili esiti)
TEMPLATES = [
    ("Informativa privacy per il preventivatore online", 88, ["validata", "validata", "correggi"]),
    ("Conservazione documenti KYC per clienti cessati", 82, ["validata", "validata"]),
    ("Obblighi antiriciclaggio sulle polizze vita", 80, ["validata", "correggi"]),
    ("Dati storici sinistri per personalizzazione del premio", 86, ["validata"]),
    ("Trasparenza dei fattori di premio verso il contraente", 84, ["validata"]),
    ("Diritto di recesso su polizza connessa a finanziamento", 70, ["correggi", "validata"]),
    ("Valutazione di adeguatezza per prodotti IBIP", 77, ["validata", "correggi"]),
    ("Regole di comportamento nella distribuzione assicurativa", 81, ["validata"]),
    ("Processo decisionale automatizzato e art. 22 GDPR", 74, ["validata", "correggi"]),
    ("Conservazione della documentazione contrattuale e di sinistro", 83, ["validata"]),
]

# Lacune del corpus (out-of-corpus / bassa confidenza) con frequenza dal design
GAPS = [
    ("Trattamento dati biometrici per onboarding", 7),
    ("Polizze parametriche e regolazione del premio", 5),
    ("Conservazione log delle chiamate di vendita", 4),
    ("Cyber-insurance: obblighi di notifica", 3),
]

# Le 7 righe recenti, identiche al design (Compliance Copilot.dc.html → AUDIT)
RECENT = [
    ("2026-06-22T14:32:00", "Giulia Bianchi", "Periodo conservazione registrazioni vendita", 2, 54, "rev", False),
    ("2026-06-22T11:08:00", "Giulia Bianchi", "CAP come variabile di pricing RC Auto", 3, 79, "validata", True),
    ("2026-06-21T17:45:00", "Luca Ferri", "Informativa privacy per preventivatore online", 4, 91, "validata", False),
    ("2026-06-21T09:21:00", "Sara Conti", "Obblighi antiriciclaggio su polizze vita", 5, 88, "correggi", False),
    ("2026-06-20T16:10:00", "Giulia Bianchi", "Dati storici sinistri per personalizzazione premio", 3, 87, "validata", False),
    ("2026-06-20T10:54:00", "Marco Rossi", "Diritto di recesso polizza connessa a finanziamento", 2, 46, "scarta", False),
    ("2026-06-19T15:37:00", "Sara Conti", "Conservazione documenti KYC clienti cessati", 4, 82, "validata", False),
]

NOW = datetime(2026, 6, 22, 18, 0, tzinfo=timezone.utc)


def _iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat()


def _mk_sources(n: int) -> list[dict]:
    return [{"n": i + 1, "doc_short": "Fonte", "section": "—", "type": "public"} for i in range(n)]


def seed() -> None:
    if AUDIT_LOG.exists():
        AUDIT_LOG.unlink()

    # 1) Storico distribuito sugli ultimi ~11 mesi, volume crescente.
    months_back = 11
    total_hist = 0
    for m in range(months_back, 0, -1):
        # volume crescente avvicinandosi a oggi
        volume = random.randint(4, 6) + (months_back - m)
        for _ in range(volume):
            day_offset = m * 30 - random.randint(0, 28)
            ts = NOW - timedelta(days=day_offset, hours=random.randint(0, 9))
            q, base_conf, outcomes = random.choice(TEMPLATES)
            user, lang = random.choice(USERS)
            conf = max(45, min(96, base_conf + random.randint(-8, 8)))
            needs_review = conf < 60
            src = random.randint(2, 5)
            iid = audit.log_interaction(
                user=user, question=q, lang=lang, confidence=conf,
                grounded=True, needs_review=needs_review, out_of_corpus=False,
                guardrail=False, sources=_mk_sources(src), engine="seed", ts=_iso(ts),
            )
            if not needs_review:
                audit.log_review(
                    interaction_id=iid, outcome=random.choice(outcomes),
                    user=user, ts=_iso(ts + timedelta(minutes=12)),
                )
            total_hist += 1

    # 2) Lacune del corpus (domande senza risposta adeguata).
    for q, freq in GAPS:
        for _ in range(freq):
            ts = NOW - timedelta(days=random.randint(1, 120), hours=random.randint(0, 9))
            user, lang = random.choice(USERS)
            audit.log_interaction(
                user=user, question=q, lang=lang, confidence=random.randint(18, 40),
                grounded=False, needs_review=True, out_of_corpus=True,
                guardrail=False, sources=[], engine="seed", ts=_iso(ts),
            )

    # 3) Le 7 righe recenti del design (in coda → più recenti).
    for ts, user, q, src, conf, out, guardrail in reversed(RECENT):
        needs_review = out == "rev"
        iid = audit.log_interaction(
            user=user, question=q, lang="it", confidence=conf,
            grounded=conf >= 40, needs_review=needs_review, out_of_corpus=False,
            guardrail=guardrail, sources=_mk_sources(src), engine="seed", ts=ts + "+00:00",
        )
        if out in {"validata", "correggi", "scarta"}:
            audit.log_review(interaction_id=iid, outcome=out, user=user, ts=ts + "+00:00")

    rows = audit.reconstruct_rows()
    print(f"Audit seed completato: {len(rows)} interazioni, catena valida = {audit.verify_chain()}")
    stats = audit.dashboard_stats()
    print(f"  grounding={stats['grounding_rate']}%  escalation={stats['escalation_rate']}%  "
          f"validate={stats['validated_rate']}%  ore risparmiate={stats['hours_saved']}")


if __name__ == "__main__":
    seed()
