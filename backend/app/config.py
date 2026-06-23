"""Configurazione centrale del Compliance Copilot.

Tutti i parametri di governance (soglia di escalation, termini sensibili,
modello Claude) vivono qui così sono ispezionabili e versionabili.
"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

# --- Percorsi -------------------------------------------------------------
DATA_DIR = BACKEND_DIR / "data"
CORPUS_DIR = DATA_DIR / "corpus"
CHROMA_DIR = DATA_DIR / "chroma"
AUDIT_LOG = DATA_DIR / "audit" / "audit_log.jsonl"
COLLECTION_NAME = "compliance_corpus"

# Password condivisa opzionale: se impostata, l'API (e quindi la demo) richiede
# il token. Utile quando la si espone pubblicamente per non far consumare la
# chiave a sconosciuti. Vuota = nessun gate.
APP_PASSWORD = os.getenv("APP_PASSWORD", "").strip()

# --- Modello Claude -------------------------------------------------------
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "").strip()
# Modello di default: l'ultimo Sonnet (buon rapporto qualità/latenza per RAG).
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6").strip()
MAX_TOKENS = 1400

# --- Parametri di governance ---------------------------------------------
# Sotto questa soglia la risposta è marcata "richiede revisione esperto".
CONFIDENCE_THRESHOLD = int(os.getenv("CONFIDENCE_THRESHOLD", "60"))
# Numero di chunk recuperati dal vector store per ogni domanda.
RETRIEVAL_K = int(os.getenv("RETRIEVAL_K", "4"))

# Lista configurabile di variabili sensibili / proxy discriminatori.
# L'attivazione di uno di questi termini in query o risposta alza un warning
# anti-discriminazione (IVASS / non-discriminazione nel pricing).
SENSITIVE_TERMS = [
    "cap", "codice postale", "codice di avviamento postale", "avviamento postale",
    "genere", "sesso", "gender",
    "nazionalità", "nazionalita", "etnia", "etnico", "razza", "origine etnica",
    "religione", "religioso", "orientamento sessuale", "stato civile",
    "disabilità", "disabilita", "handicap",
    "quartiere", "zona di residenza", "area di residenza",
    "postal code", "postcode", "zip", "ethnicity", "nationality", "religion",
]

# Stima del tempo di ricerca manuale risparmiato per ogni domanda risolta
# (in minuti) — usata per il KPI "tempo risparmiato" della dashboard.
MINUTES_SAVED_PER_QUERY = int(os.getenv("MINUTES_SAVED_PER_QUERY", "15"))

# Origini consentite per il frontend Vite.
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")


def has_api_key() -> bool:
    return bool(ANTHROPIC_API_KEY)
