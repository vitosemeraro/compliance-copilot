"""Costruisce l'indice vettoriale dal corpus.

    python -m scripts.build_index

Va eseguito una volta prima di avviare il backend (o dopo ogni modifica al
corpus). L'embedding è locale: al primo avvio Chroma scarica il modello ONNX.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.vectorstore import build_index, list_documents  # noqa: E402


def main() -> None:
    print("Indicizzazione del corpus in corso (primo avvio: scarico modello embedding)…")
    n = build_index()
    print(f"\nIndicizzati {n} chunk da {len(list_documents())} documenti:\n")
    for doc in list_documents():
        flag = "  [FITTIZIO]" if doc["fictitious"] else ""
        print(f"  · {doc['doc_title']} — {doc['sections']} sezioni ({doc['type']}){flag}")
    print("\nIndice pronto in data/chroma.")


if __name__ == "__main__":
    main()
