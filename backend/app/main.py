"""API FastAPI del Compliance Copilot.

Orchestratore che espone la pipeline RAG + governance al frontend e mantiene
viva la sessione MCP verso il server `corpus` per tutta la vita dell'app.
"""
from __future__ import annotations

import csv
import io
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles

from . import adoption, audit
from .config import (
    APP_PASSWORD,
    BACKEND_DIR,
    CLAUDE_MODEL,
    CONFIDENCE_THRESHOLD,
    CORS_ORIGINS,
    SENSITIVE_TERMS,
    has_api_key,
)

# Endpoint /api accessibili senza password (per il gate stesso).
_OPEN_PATHS = {"/api/health", "/api/config"}
from .mcp_client import CorpusMCPClient
from .models import AskRequest, FeedbackRequest, ReviewRequest
from .rag import answer as rag_answer


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = CorpusMCPClient()
    await client.connect()
    app.state.mcp = client
    try:
        yield
    finally:
        await client.aclose()


app = FastAPI(title="Compliance Copilot", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def password_gate(request: Request, call_next):
    """Se APP_PASSWORD è impostata, protegge le rotte /api (eccetto health/config)."""
    if APP_PASSWORD:
        path = request.url.path
        if path.startswith("/api") and path not in _OPEN_PATHS:
            if request.headers.get("x-app-password") != APP_PASSWORD:
                return JSONResponse({"detail": "unauthorized"}, status_code=401)
    return await call_next(request)


@app.get("/api/auth/check")
async def auth_check():
    return {"ok": True}


@app.get("/api/health")
async def health():
    client: CorpusMCPClient = app.state.mcp
    return {
        "status": "ok",
        "mcp_connected": client.session is not None,
        "mcp_tools": client.tools,
        "engine": "claude" if has_api_key() else "fallback",
    }


@app.get("/api/config")
async def config():
    client: CorpusMCPClient = app.state.mcp
    return {
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "engine": "claude" if has_api_key() else "fallback",
        "model": CLAUDE_MODEL if has_api_key() else None,
        "mcp_tools": client.tools,
        "sensitive_terms": SENSITIVE_TERMS,
        "auth_required": bool(APP_PASSWORD),
    }


@app.get("/api/sources")
async def sources():
    client: CorpusMCPClient = app.state.mcp
    return {"documents": await client.list_documents()}


@app.post("/api/ask")
async def ask(req: AskRequest):
    client: CorpusMCPClient = app.state.mcp
    return await rag_answer(client, question=req.question, lang=req.lang, user=req.user)


@app.post("/api/review")
async def review(req: ReviewRequest):
    try:
        ev = audit.log_review(
            interaction_id=req.interaction_id,
            outcome=req.outcome,
            user=req.user,
            note=req.note,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"ok": True, "event": ev}


@app.post("/api/feedback")
async def feedback(req: FeedbackRequest):
    ev = audit.log_feedback(interaction_id=req.interaction_id, vote=req.vote, comment=req.comment)
    return {"ok": True, "event": ev}


@app.get("/api/audit")
async def get_audit(
    search: str = "",
    outcome: str = Query("", description="validata|correggi|scarta|rev"),
):
    rows = audit.rows_light()
    total = len(rows)
    if search:
        s = search.lower()
        rows = [r for r in rows if s in r["question"].lower() or s in r["user"].lower()]
    if outcome:
        if outcome == "rev":
            rows = [r for r in rows if r["needs_review"] and not r["outcome"]]
        else:
            rows = [r for r in rows if r["outcome"] == outcome]
    return {
        "rows": rows,
        "count": len(rows),
        "total": total,
        "chain_valid": audit.verify_chain(),
    }


@app.get("/api/interaction/{interaction_id}")
async def interaction(interaction_id: str):
    row = audit.get_interaction(interaction_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Interazione non trovata")
    return row


@app.get("/api/audit/export")
async def export_audit(format: str = Query("csv", pattern="^(csv|json)$")):
    rows = audit.reconstruct_rows()
    if format == "json":
        body = json.dumps(rows, ensure_ascii=False, indent=2)
        return Response(
            content=body,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=audit_trail.json"},
        )
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["timestamp", "utente", "domanda", "lingua", "fonti", "confidenza", "esito", "guardrail", "motore", "hash"])
    for r in rows:
        writer.writerow([
            r["ts"], r["user"], r["question"], r["lang"], len(r.get("sources", [])),
            r["confidence"], r.get("outcome") or ("in_revisione" if r["needs_review"] else "—"),
            "sì" if r["guardrail"] else "no", r["engine"], r["hash"],
        ])
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_trail.csv"},
    )


@app.get("/api/dashboard")
async def dashboard():
    return audit.dashboard_stats()


@app.get("/api/adoption")
async def adoption_health():
    return adoption.adoption_stats()


# In produzione il backend serve anche il frontend compilato (stessa origine):
# un'unica porta/URL da esporre. Eseguire prima `npm run build` nel frontend.
# Il mount va in fondo così le rotte /api hanno la precedenza.
FRONTEND_DIST = BACKEND_DIR.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
