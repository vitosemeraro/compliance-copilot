"""Server MCP `corpus` — espone il vector store come tool MCP via stdio.

Questo è il "vero agentic" richiesto dallo spec: il corpus normativo vive in
un server MCP separato e l'orchestratore lo interroga come client MCP, non con
una chiamata interna simulata.

Tool esposti:
  · search_corpus(query, k)   — ricerca semantica+lessicale, ritorna citazioni
  · get_document(doc_id)      — tutte le sezioni di un documento
  · list_documents()          — panoramica del corpus

Avvio standalone (debug):  python -m mcp_server.corpus_server
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from mcp.server.fastmcp import FastMCP  # noqa: E402

from app import vectorstore  # noqa: E402

mcp = FastMCP("corpus")


@mcp.tool()
def search_corpus(query: str, k: int = 4) -> str:
    """Cerca nel corpus normativo e di policy le sezioni più rilevanti.

    Ritorna JSON con i passaggi-fonte (documento, sezione, testo, rilevanza
    0-100). Da usare per ancorare ogni affermazione a una fonte citabile.
    """
    results = vectorstore.search(query, k=k)
    return json.dumps({"query": query, "results": results}, ensure_ascii=False)


@mcp.tool()
def get_document(doc_id: str) -> str:
    """Ritorna tutte le sezioni di un documento del corpus dato il suo id."""
    return json.dumps({"doc_id": doc_id, "sections": vectorstore.get_document(doc_id)}, ensure_ascii=False)


@mcp.tool()
def list_documents() -> str:
    """Elenca i documenti disponibili nel corpus con tipo e n. di sezioni."""
    return json.dumps({"documents": vectorstore.list_documents()}, ensure_ascii=False)


if __name__ == "__main__":
    mcp.run()
