# Compliance Copilot — POC

Copilota interno per la funzione **Compliance** di Prima: interroga il corpus
normativo e le policy in linguaggio naturale e risponde **ancorato alle fonti**,
con citazioni, confidenza, human-in-the-loop, guardrail anti-discriminazione e
audit trail immutabile.

> POC dimostrativa. Corpus **pubblico + sintetico**, nessun dato reale di clienti
> Prima. Dimostra il *pattern*: con i documenti interni fa lo stesso, in sicurezza.

Implementa lo spec `Spec_Compliance_Copilot_POC.md` e ricrea il design di
`Compliance Copilot.dc.html` (handoff Claude Design) come app reale.

---

## Architettura

```
[ React + Vite ]  ──►  [ FastAPI orchestratore ]  ──►  [ Claude API ]
   (frontend :5173)         (backend :8000)              (grounding)
                                  │
                                  ├──► [ MCP server "corpus" ] ──► [ Chroma vector store ]
                                  │     (stdio, tool: search_corpus / get_document / list_documents)
                                  ├──► [ Guardrail layer ]  (variabili sensibili, soglie, HITL)
                                  └──► [ Audit trail ]      (JSONL append-only, catena SHA-256)
```

Il retrieval passa **realmente** dal protocollo MCP: l'orchestratore è un client
MCP che interroga un server `corpus` separato (non una chiamata simulata).

### Stack
- **Frontend:** React 18 + Vite. 5 schermate, bilingue IT/EN.
- **Backend:** Python 3.11 + FastAPI.
- **Modello:** Claude via API (`claude-sonnet-4-6` di default) con forced tool-use
  per output strutturato. **Fallback deterministico** se manca la API key.
- **Retrieval:** Chroma (embedding locale ONNX MiniLM) + rerank ibrido
  semantico/lessicale. Chunking per articolo/sezione → citazioni precise.
- **MCP:** server `corpus` con FastMCP (stdio).
- **Audit:** JSONL append-only con catena di hash SHA-256 (tamper-evident).

---

## Avvio rapido

### 1. Backend (Python)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (oppure: source .venv/bin/activate)
pip install -r requirements.txt

# (opzionale) chiave Claude — senza, gira in modalità fallback
copy .env.example .env            # poi inserisci ANTHROPIC_API_KEY

python scripts/build_index.py     # indicizza il corpus (1ª volta scarica il modello embedding)
python scripts/seed_audit.py      # popola l'audit trail con storico dimostrativo

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend (Node)
```bash
cd frontend
npm install
npm run dev
```
Apri **http://localhost:5173**.

---

## Le 5 schermate
- **Chat con fonti** — Q&A grounded: risposta con citazioni cliccabili → snippet
  originale evidenziato, badge confidenza, validazione (Valida / Da correggere /
  Scarta), voto 👍/👎.
- **Confidenza bassa** — domanda con copertura insufficiente → confidenza sotto
  soglia, banner di escalation, invio a revisione esperto.
- **Guardrail pricing** — domanda su variabile sensibile (es. CAP) → warning
  anti-discriminazione IVASS; la risposta procede ma resta segnalata.
- **Audit trail** — registro completo, ricercabile e filtrabile, con stato catena
  SHA-256 ed export CSV/JSON.
- **Dashboard adoption** — KPI (grounding, escalation, % validate, tempo
  risparmiato), trend, esiti, top temi, lacune del corpus.

Le tre voci "assistente" auto-caricano una domanda demo per raccontare la storia;
la barra di input resta libera per qualsiasi altra domanda.

---

## Criteri di accettazione (DoD) → dove

| Criterio | Dove |
|---|---|
| Citazione cliccabile allo snippet di fonte | Chat → chip citazione + pannello Fonti |
| Domanda fuori-corpus → "non presente nelle fonti" | Grounding stretto (`llm.py`, prompt §6) |
| Confidenza bassa → escalation | Soglia 60 (`config.py`) → banner + revisione |
| Variabile sensibile → warning anti-discriminazione | `guardrails.py` (lista termini configurabile) |
| Ogni interazione nell'audit trail, esportabile | `audit.py` JSONL + `/api/audit/export` |
| Dashboard con i KPI | `/api/dashboard`, schermata Dashboard |
| MCP realmente in uso (non simulato) | `mcp_server/corpus_server.py` + `mcp_client.py` |

---

## Endpoint principali
`POST /api/ask` · `POST /api/review` · `POST /api/feedback` ·
`GET /api/audit` · `GET /api/audit/export?format=csv|json` ·
`GET /api/dashboard` · `GET /api/sources` · `GET /api/health`

## Regole di governance del modello (`app/llm.py`)
Grounding stretto · citazione sempre · confidenza onesta · niente decisioni ·
warning su variabili sensibili · risposta nella lingua della domanda.

## Note
- Senza `ANTHROPIC_API_KEY` il motore "fallback" costruisce la risposta
  deterministicamente dalle fonti recuperate (confidenza derivata dalla
  copertura). Con la key, Claude produce risposte e confidenze piene.
- `scripts/seed_audit.py` **azzera e ripopola** l'audit log con dati dimostrativi.
- Smoke test: `scripts/smoke_retrieval.py`, `scripts/smoke_mcp.py`.
