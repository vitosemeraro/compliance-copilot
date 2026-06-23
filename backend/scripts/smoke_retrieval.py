"""Smoke test del retrieval sulle domande demo."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vectorstore import search  # noqa: E402

QUESTIONS = [
    "Possiamo usare i dati storici dei sinistri per personalizzare il premio RC Auto?",
    "Qual e' il periodo di conservazione corretto per le registrazioni delle chiamate di vendita inbound?",
    "Possiamo usare il CAP di residenza come variabile per il pricing RC Auto?",
    "Qual e' la capitale della Francia?",  # fuori corpus
]

for q in QUESTIONS:
    print("\nQ:", q)
    for r in search(q, 3):
        print(f"  [{r['relevance']:>3}] {r['doc_short']} -- {r['section']}")
