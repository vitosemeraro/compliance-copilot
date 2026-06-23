"""Orchestrazione del modello con regole di grounding (spec §6).

Espone `generate_answer(question, lang, sources)` che ritorna una risposta
strutturata: segmenti con citazioni, confidenza, flag grounded/out_of_corpus.

Due motori:
  · "claude"   — Claude via API con forced tool-use (output strutturato garantito)
  · "fallback" — risposta deterministica dalle fonti, se manca ANTHROPIC_API_KEY
                 (la demo resta funzionante anche offline, chiaramente etichettata)
"""
from __future__ import annotations

from typing import Any

from anthropic import AsyncAnthropic

from .config import ANTHROPIC_API_KEY, CLAUDE_MODEL, MAX_TOKENS, has_api_key

OUT_OF_CORPUS_FLOOR = 26  # sotto questa rilevanza max → quasi certamente fuori corpus

SYSTEM_PROMPT = """Sei il Compliance Copilot di Prima, un assistente interno per la funzione Compliance assicurativa.

REGOLE DI COMPORTAMENTO (vincolanti):
1. GROUNDING STRETTO: rispondi ESCLUSIVAMENTE sulla base delle FONTI fornite. Non usare mai conoscenza generale del modello. Se le fonti non bastano a rispondere, dichiaralo apertamente.
2. CITAZIONE SEMPRE: ogni affermazione fattuale deve avere un riferimento al numero della fonte da cui proviene. Nessuna fonte = nessuna affermazione.
3. CONFIDENZA ONESTA: stima la confidenza (0-100) in base a quanto le fonti coprono la domanda. Copertura piena e diretta → alta; copertura parziale o indiretta → bassa.
4. NIENTE DECISIONI: non emettere giudizi definitivi di conformità. Produci una bozza "da validare" da un esperto.
5. FUORI CORPUS: se la domanda non è coperta dalle fonti, imposta out_of_corpus=true, grounded=false, confidenza bassa e spiega che l'informazione non è presente nelle fonti disponibili.
6. LINGUA: rispondi nella lingua indicata dal campo LINGUA.
7. FORMATO: prosa semplice e scorrevole. NIENTE markdown, NIENTE grassetto/asterischi, NIENTE titoli o elenchi numerati/puntati. La risposta deve stare in 2-4 frasi essenziali.

Devi SEMPRE rispondere chiamando lo strumento `emit_answer`. Spezza la risposta in segmenti brevi: ogni segmento che afferma un fatto porta nel campo `citation` il numero della SINGOLA fonte da cui quel fatto proviene (non elencare tutte le fonti su ogni segmento); i segmenti di raccordo hanno citation=null."""

EMIT_TOOL = {
    "name": "emit_answer",
    "description": "Emette la risposta strutturata, ancorata alle fonti, con citazioni e confidenza.",
    "input_schema": {
        "type": "object",
        "properties": {
            "segments": {
                "type": "array",
                "description": "Risposta spezzata in segmenti. Ogni segmento fattuale cita la fonte.",
                "items": {
                    "type": "object",
                    "properties": {
                        "text": {"type": "string"},
                        "citation": {
                            "type": ["integer", "null"],
                            "description": "Numero della fonte (1-based) o null per raccordo.",
                        },
                    },
                    "required": ["text", "citation"],
                },
            },
            "confidence": {"type": "integer", "minimum": 0, "maximum": 100},
            "grounded": {"type": "boolean"},
            "out_of_corpus": {"type": "boolean"},
            "used_sources": {"type": "array", "items": {"type": "integer"}},
            "rationale": {"type": "string", "description": "Breve motivazione della confidenza."},
        },
        "required": ["segments", "confidence", "grounded", "out_of_corpus", "used_sources", "rationale"],
    },
}


def _format_sources(sources: list[dict[str, Any]]) -> str:
    blocks = []
    for s in sources:
        tag = "POLICY INTERNA (FITTIZIA)" if s.get("fictitious") else "NORMATIVA PUBBLICA"
        blocks.append(
            f"[FONTE {s['n']}] {s['doc_short']} — {s['section']} ({tag})\n{s['text']}"
        )
    return "\n\n".join(blocks)


def _clamp(value: int, lo: int = 3, hi: int = 98) -> int:
    return max(lo, min(hi, int(value)))


async def _generate_claude(question: str, lang: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    lang_label = "italiano" if lang == "it" else "inglese (English)"
    user_content = (
        f"LINGUA: {lang_label}\n\n"
        f"FONTI DISPONIBILI:\n{_format_sources(sources)}\n\n"
        f"DOMANDA: {question}"
    )
    resp = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        tools=[EMIT_TOOL],
        tool_choice={"type": "tool", "name": "emit_answer"},
        messages=[{"role": "user", "content": user_content}],
    )
    payload = None
    for block in resp.content:
        if block.type == "tool_use" and block.name == "emit_answer":
            payload = block.input
            break
    if payload is None:
        raise RuntimeError("Il modello non ha restituito emit_answer")

    payload["engine"] = "claude"
    payload["confidence"] = _clamp(payload.get("confidence", 0))
    return payload


def _generate_fallback(question: str, lang: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    """Risposta deterministica dalle fonti (nessuna chiamata al modello)."""
    top_relevance = sources[0]["relevance"] if sources else 0
    out_of_corpus = (not sources) or top_relevance < OUT_OF_CORPUS_FLOOR

    if out_of_corpus:
        msg = (
            "L'informazione richiesta non è presente nelle fonti disponibili. "
            "Non posso rispondere senza una fonte: la domanda va indirizzata a una "
            "fonte di corpus appropriata o all'esperto compliance."
        ) if lang == "it" else (
            "The requested information is not present in the available sources. "
            "I can't answer without a source: route this question to an appropriate "
            "corpus source or to a compliance expert."
        )
        return {
            "segments": [{"text": msg, "citation": None}],
            "confidence": _clamp(top_relevance, 3, 35),
            "grounded": False,
            "out_of_corpus": True,
            "used_sources": [],
            "rationale": "Nessuna fonte rilevante sopra la soglia di copertura.",
            "engine": "fallback",
        }

    # Costruisce la risposta dai 1-2 chunk più rilevanti, ognuno citato.
    used = sources[:2]
    intro = (
        "In base alle fonti disponibili: "
        if lang == "it" else "Based on the available sources: "
    )
    segments = [{"text": intro, "citation": None}]
    for s in used:
        snippet = s["text"].strip()
        # prima frase del chunk come sintesi
        first = snippet.split(". ")[0].strip().rstrip(".")
        segments.append({"text": first + ". ", "citation": s["n"]})

    coverage = round(sum(s["relevance"] for s in used) / len(used))
    return {
        "segments": segments,
        "confidence": _clamp(coverage, 30, 85),
        "grounded": True,
        "out_of_corpus": False,
        "used_sources": [s["n"] for s in used],
        "rationale": "Confidenza derivata dalla copertura delle fonti (motore fallback).",
        "engine": "fallback",
    }


async def generate_answer(question: str, lang: str, sources: list[dict[str, Any]]) -> dict[str, Any]:
    if has_api_key():
        try:
            return await _generate_claude(question, lang, sources)
        except Exception as exc:  # rete/chiave/timeout → degrada con grazia
            result = _generate_fallback(question, lang, sources)
            result["engine_error"] = str(exc)
            return result
    return _generate_fallback(question, lang, sources)
