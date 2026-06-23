"""Pipeline RAG + governance.

Compone: retrieval (via MCP) → Claude (grounding) → guardrail → audit trail.
È l'orchestratore che lo spec mette al centro dell'architettura.
"""
from __future__ import annotations

import re
from typing import Any

from . import audit, guardrails
from .config import CONFIDENCE_THRESHOLD, RETRIEVAL_K
from .llm import generate_answer
from .mcp_client import CorpusMCPClient
from .vectorstore import _tokens  # riuso del tokenizer per l'highlight


def _highlight(text: str, query: str) -> dict[str, str]:
    """Sceglie la frase più pertinente del chunk e la spezza in pre/hi/post."""
    sentences = re.split(r"(?<=[.;])\s+", text.strip())
    q = _tokens(query)
    best, best_score = sentences[0] if sentences else text, -1.0
    for sent in sentences:
        score = len(q & _tokens(sent))
        if score > best_score:
            best, best_score = sent, score
    idx = text.find(best)
    if idx < 0:
        return {"pre": "", "hi": text, "post": ""}
    return {"pre": text[:idx], "hi": best, "post": text[idx + len(best):]}


def _build_sources(raw: list[dict[str, Any]], query: str) -> list[dict[str, Any]]:
    sources = []
    for i, s in enumerate(raw, start=1):
        sources.append({
            "n": i,
            "doc_id": s["doc_id"],
            "doc_title": s["doc_title"],
            "doc_short": s["doc_short"],
            "section": s["section"],
            "type": s["type"],
            "fictitious": s["fictitious"],
            "relevance": s["relevance"],
            "text": s["text"],
            "highlight": _highlight(s["text"], query),
        })
    return sources


async def answer(
    client: CorpusMCPClient,
    *,
    question: str,
    lang: str = "it",
    user: str = "Giulia Bianchi",
) -> dict[str, Any]:
    # 1) Retrieval attraverso il server MCP (non simulato)
    raw = await client.search_corpus(question, k=RETRIEVAL_K)
    sources = _build_sources(raw, question)

    # 2) Generazione ancorata alle fonti
    result = await generate_answer(question, lang, sources)

    answer_text = " ".join(seg["text"] for seg in result["segments"])
    confidence = result["confidence"]
    out_of_corpus = result["out_of_corpus"]
    grounded = result["grounded"]
    needs_review = bool(out_of_corpus or confidence < CONFIDENCE_THRESHOLD)

    # 3) Guardrail anti-discriminazione su domanda + risposta
    grd = guardrails.check(question, answer_text)

    # marca le fonti effettivamente citate
    used = set(result.get("used_sources") or [])
    for s in sources:
        s["cited"] = s["n"] in used

    # 4) Audit trail (append-only, immutabile)
    cited_sources = [
        {"n": s["n"], "doc_short": s["doc_short"], "section": s["section"], "type": s["type"]}
        for s in sources if s["cited"]
    ] or [
        {"n": s["n"], "doc_short": s["doc_short"], "section": s["section"], "type": s["type"]}
        for s in sources[:1]
    ]
    interaction_id = audit.log_interaction(
        user=user,
        question=question,
        lang=lang,
        confidence=confidence,
        grounded=grounded,
        needs_review=needs_review,
        out_of_corpus=out_of_corpus,
        guardrail=grd.triggered,
        sources=cited_sources,
        engine=result["engine"],
        answer_segments=result["segments"],
        sources_full=sources,
        guardrail_terms=grd.terms,
        rationale=result.get("rationale", ""),
    )

    return {
        "id": interaction_id,
        "question": question,
        "lang": lang,
        "segments": result["segments"],
        "confidence": confidence,
        "threshold": CONFIDENCE_THRESHOLD,
        "grounded": grounded,
        "out_of_corpus": out_of_corpus,
        "needs_review": needs_review,
        "guardrail": grd.to_dict(),
        "sources": sources,
        "source_count": len(sources),
        "engine": result["engine"],
        "rationale": result.get("rationale", ""),
    }
