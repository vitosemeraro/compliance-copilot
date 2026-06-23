"""Client MCP verso il server `corpus`.

L'orchestratore FastAPI parla con il vector store **solo** attraverso il
protocollo MCP (stdio). La sessione è persistente per tutta la vita dell'app
(aperta nel lifespan) e le chiamate sono serializzate da un lock.
"""
from __future__ import annotations

import json
import os
import sys
from contextlib import AsyncExitStack
from pathlib import Path
from typing import Any

import anyio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

BACKEND_DIR = Path(__file__).resolve().parent.parent


class CorpusMCPClient:
    """Wrapper async su una sessione MCP stdio verso il server corpus."""

    def __init__(self) -> None:
        self._stack: AsyncExitStack | None = None
        self.session: ClientSession | None = None
        self._lock = anyio.Lock()
        self.tools: list[str] = []

    async def connect(self) -> None:
        server_script = BACKEND_DIR / "mcp_server" / "corpus_server.py"
        # Forziamo UTF-8 sullo stdio del child: su Windows il default è cp1252
        # e i caratteri accentati del corpus romperebbero il framing JSON-RPC.
        child_env = {**os.environ, "PYTHONUTF8": "1", "PYTHONIOENCODING": "utf-8"}
        params = StdioServerParameters(
            command=sys.executable,
            args=[str(server_script)],
            cwd=str(BACKEND_DIR),
            env=child_env,
        )
        self._stack = AsyncExitStack()
        read, write = await self._stack.enter_async_context(stdio_client(params))
        self.session = await self._stack.enter_async_context(ClientSession(read, write))
        await self.session.initialize()
        listed = await self.session.list_tools()
        self.tools = [t.name for t in listed.tools]

    async def aclose(self) -> None:
        if self._stack is not None:
            await self._stack.aclose()
            self._stack = None
            self.session = None

    async def _call(self, name: str, args: dict[str, Any]) -> Any:
        if self.session is None:
            raise RuntimeError("Sessione MCP non inizializzata")
        async with self._lock:
            result = await self.session.call_tool(name, args)
        # Il tool ritorna un'unica TextContent con payload JSON.
        for block in result.content:
            text = getattr(block, "text", None)
            if text:
                return json.loads(text)
        return None

    async def search_corpus(self, query: str, k: int = 4) -> list[dict[str, Any]]:
        data = await self._call("search_corpus", {"query": query, "k": k})
        return (data or {}).get("results", [])

    async def get_document(self, doc_id: str) -> list[dict[str, Any]]:
        data = await self._call("get_document", {"doc_id": doc_id})
        return (data or {}).get("sections", [])

    async def list_documents(self) -> list[dict[str, Any]]:
        data = await self._call("list_documents", {})
        return (data or {}).get("documents", [])
