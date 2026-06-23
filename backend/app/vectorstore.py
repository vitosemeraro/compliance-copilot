"""Wrapper sul vector store locale (Chroma).

Usato sia dallo script di indicizzazione sia dal server MCP `corpus`.
L'embedding è locale (modello ONNX MiniLM di default di Chroma): nessun dato
lascia la macchina per essere indicizzato.
"""
from __future__ import annotations

import re
from typing import Any

import chromadb
from chromadb.config import Settings

from .config import CHROMA_DIR, COLLECTION_NAME
from .corpus import Chunk, load_corpus

# Stopword IT/EN minime: tolgono rumore dal punteggio lessicale.
_STOPWORDS = {
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "a", "da", "in",
    "con", "su", "per", "tra", "fra", "e", "o", "ed", "od", "che", "chi", "cui",
    "come", "del", "dei", "delle", "della", "dello", "degli", "al", "ai", "alle",
    "alla", "nel", "nei", "nelle", "sul", "sui", "si", "non", "puo", "possiamo",
    "usare", "qual", "quale", "e'", "the", "a", "an", "of", "to", "for", "is",
    "can", "we", "what", "and", "or", "in", "on", "use", "using",
}


def _tokens(text: str) -> set[str]:
    words = re.findall(r"[a-zà-ù0-9]+", (text or "").lower())
    return {w for w in words if len(w) > 2 and w not in _STOPWORDS}


def get_client() -> chromadb.ClientAPI:
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return chromadb.PersistentClient(
        path=str(CHROMA_DIR),
        settings=Settings(anonymized_telemetry=False, allow_reset=True),
    )


def get_collection(client: chromadb.ClientAPI | None = None):
    client = client or get_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )


def build_index() -> int:
    """(Re)costruisce l'indice dal corpus su disco. Ritorna il n. di chunk."""
    chunks = load_corpus()
    if not chunks:
        raise RuntimeError("Corpus vuoto: nessun documento in data/corpus")

    client = get_client()
    # Reset pulito della collezione per idempotenza.
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    collection = get_collection(client)

    collection.add(
        ids=[c.chunk_id for c in chunks],
        documents=[c.text for c in chunks],
        metadatas=[c.to_metadata() for c in chunks],
    )
    return len(chunks)


def _distance_to_confidence(distance: float) -> int:
    """Converte una distanza coseno [0..2] in un punteggio di rilevanza 0-100."""
    similarity = max(0.0, 1.0 - distance)  # coseno: 1 = identico, 0 = ortogonale
    return int(round(similarity * 100))


def _lexical_overlap(query_tokens: set[str], text: str) -> float:
    """Frazione dei token-query coperti dal testo (0..1)."""
    if not query_tokens:
        return 0.0
    doc_tokens = _tokens(text)
    return len(query_tokens & doc_tokens) / len(query_tokens)


def search(query: str, k: int = 4) -> list[dict[str, Any]]:
    """Ricerca ibrida: recupero semantico + rerank lessicale.

    Su un corpus piccolo e in italiano, mescolare il punteggio semantico con
    l'overlap di termini (titolo sezione + testo) migliora sensibilmente la
    precisione delle citazioni rispetto al solo embedding MiniLM.
    """
    collection = get_collection()
    # Corpus piccolo: recuperiamo un pool ampio e lasciamo decidere al rerank.
    candidates = min(max(k * 8, 32), collection.count())
    res = collection.query(
        query_texts=[query],
        n_results=candidates,
        include=["documents", "metadatas", "distances"],
    )
    docs = res.get("documents", [[]])[0]
    metas = res.get("metadatas", [[]])[0]
    dists = res.get("distances", [[]])[0]

    q_tokens = _tokens(query)
    scored: list[dict[str, Any]] = []
    for doc, meta, dist in zip(docs, metas, dists):
        semantic = _distance_to_confidence(float(dist)) / 100.0
        lexical = _lexical_overlap(q_tokens, f"{meta.get('section', '')} {doc}")
        blended = 0.55 * semantic + 0.45 * lexical
        scored.append({
            "chunk_id": meta.get("chunk_id"),
            "doc_id": meta.get("doc_id"),
            "doc_title": meta.get("doc_title"),
            "doc_short": meta.get("doc_short"),
            "section": meta.get("section"),
            "type": meta.get("type"),
            "fictitious": bool(meta.get("fictitious", False)),
            "jurisdiction": meta.get("jurisdiction"),
            "text": doc,
            "relevance": int(round(blended * 100)),
            "_semantic": round(semantic, 3),
            "_lexical": round(lexical, 3),
        })

    scored.sort(key=lambda r: r["relevance"], reverse=True)
    top = scored[:k]
    for rank, r in enumerate(top, start=1):
        r["rank"] = rank
    return top


def get_document(doc_id: str) -> list[dict[str, Any]]:
    """Ritorna tutte le sezioni di un documento, ordinate."""
    collection = get_collection()
    res = collection.get(where={"doc_id": doc_id}, include=["documents", "metadatas"])
    out: list[dict[str, Any]] = []
    for doc, meta in zip(res.get("documents", []), res.get("metadatas", [])):
        out.append({**meta, "text": doc})
    out.sort(key=lambda r: r.get("chunk_id", ""))
    return out


def list_documents() -> list[dict[str, Any]]:
    """Panoramica dei documenti nel corpus (per UI 'fonti disponibili')."""
    collection = get_collection()
    res = collection.get(include=["metadatas"])
    seen: dict[str, dict[str, Any]] = {}
    for meta in res.get("metadatas", []):
        doc_id = meta.get("doc_id")
        if doc_id not in seen:
            seen[doc_id] = {
                "doc_id": doc_id,
                "doc_title": meta.get("doc_title"),
                "doc_short": meta.get("doc_short"),
                "type": meta.get("type"),
                "fictitious": bool(meta.get("fictitious", False)),
                "sections": 0,
            }
        seen[doc_id]["sections"] += 1
    return sorted(seen.values(), key=lambda d: d["doc_title"])
