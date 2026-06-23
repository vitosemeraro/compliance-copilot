"""Smoke test: retrieval + Claude reale sulle domande demo."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import has_api_key, CLAUDE_MODEL  # noqa: E402
from app.llm import generate_answer  # noqa: E402
from app.rag import _build_sources  # noqa: E402
from app.vectorstore import search  # noqa: E402

QUESTIONS = [
    ("Possiamo usare i dati storici dei sinistri per personalizzare il premio RC Auto?", "it"),
    ("Qual e' il periodo di conservazione corretto per le registrazioni delle chiamate di vendita inbound?", "it"),
    ("Possiamo usare il CAP di residenza come variabile per il pricing RC Auto?", "it"),
    ("Qual e' la capitale della Francia?", "it"),
]


async def main() -> None:
    print(f"API key presente: {has_api_key()}  modello: {CLAUDE_MODEL}\n")
    for q, lang in QUESTIONS:
        sources = _build_sources(search(q, 4), q)
        res = await generate_answer(q, lang, sources)
        text = " ".join(s["text"] for s in res["segments"])
        print(f"Q: {q}")
        print(f"   engine={res['engine']} conf={res['confidence']} grounded={res['grounded']} out_of_corpus={res['out_of_corpus']}")
        if res.get("engine_error"):
            print(f"   ERRORE: {res['engine_error']}")
        print(f"   -> {text[:220]}")
        print(f"   fonti citate: {res.get('used_sources')}\n")


if __name__ == "__main__":
    asyncio.run(main())
