"""Smoke test: connessione MCP stdio + chiamata tool."""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.mcp_client import CorpusMCPClient  # noqa: E402


async def main() -> None:
    client = CorpusMCPClient()
    await client.connect()
    print("Tool MCP disponibili:", client.tools)

    docs = await client.list_documents()
    print(f"Documenti nel corpus: {len(docs)}")

    res = await client.search_corpus(
        "Possiamo usare il CAP di residenza come variabile per il pricing RC Auto?", k=3
    )
    print("\nRicerca via MCP:")
    for r in res:
        print(f"  [{r['relevance']:>3}] {r['doc_short']} -- {r['section']}")

    await client.aclose()
    print("\nOK: MCP client/server funzionanti.")


if __name__ == "__main__":
    asyncio.run(main())
