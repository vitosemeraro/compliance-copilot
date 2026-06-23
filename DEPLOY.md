# Deploy online (cloud)

La POC gira in **un solo container Docker**: il backend FastAPI serve sia le API
sia il frontend compilato. Indice vettoriale e audit dimostrativo sono già
dentro l'immagine. Ti serve solo impostare due secret.

## Cosa ti serve
- Un account **GitHub** (per ospitare il codice) e un account **Render** (free) — o **Railway**.
- La tua **chiave Anthropic** (`ANTHROPIC_API_KEY`).
- Una **password** a piacere per proteggere la demo (`APP_PASSWORD`).

> ⚠️ L'URL sarà pubblico. Imposta SEMPRE `APP_PASSWORD`: senza, chiunque abbia il
> link può usare la tua chiave e consumare credito.

---

## Opzione A — Render (consigliata, free)

1. **Porta il codice su GitHub.** Dalla cartella `compliance-copilot`:
   ```bash
   git init
   git add .
   git commit -m "Compliance Copilot POC"
   git branch -M main
   git remote add origin https://github.com/<tuo-utente>/compliance-copilot.git
   git push -u origin main
   ```
   (Il `.gitignore` esclude già chiave, venv, node_modules e dati generati.)

2. **Crea il servizio su Render.**
   - Vai su https://dashboard.render.com → **New** → **Blueprint**.
   - Collega il repo: Render rileva `render.yaml` e propone il servizio `compliance-copilot`.
   - In alternativa: **New → Web Service** → repo → Runtime **Docker** (usa il `Dockerfile`).

3. **Imposta i secret** (Environment):
   - `ANTHROPIC_API_KEY` = la tua chiave
   - `APP_PASSWORD` = una password a tua scelta
   - (`CLAUDE_MODEL` è già `claude-sonnet-4-6`)

4. **Deploy.** La prima build richiede ~5–10 min (scarica il modello embedding e
   costruisce l'indice). Al termine ottieni un URL `https://compliance-copilot-xxxx.onrender.com`.

5. Apri l'URL, inserisci la password, condividi link + password con i tuoi amici.

**Note sul free tier Render:** il servizio va in sleep dopo ~15 min di inattività
(primo accesso successivo lento, ~30–60s) e ha **512MB di RAM** — potrebbe essere
al limite. Se vedi crash/OOM nei log, passa al piano `starter` o usa Railway.

---

## Opzione B — Railway (più RAM nel free)

1. Porta il codice su GitHub (come sopra).
2. https://railway.app → **New Project** → **Deploy from GitHub repo**.
3. Railway rileva il `Dockerfile`. Aggiungi le **Variables**: `ANTHROPIC_API_KEY`,
   `APP_PASSWORD`, `CLAUDE_MODEL=claude-sonnet-4-6`.
4. Genera un dominio pubblico (Settings → Networking → Generate Domain).

---

## Provare il container in locale (facoltativo)
Se hai Docker installato:
```bash
cd compliance-copilot
docker build -t compliance-copilot .
docker run -p 8000:8000 \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e APP_PASSWORD=demo123 \
  compliance-copilot
```
Apri http://localhost:8000.

---

## Sicurezza e costi
- La chiave resta **solo lato server** (mai inviata al browser).
- Con `APP_PASSWORD` impostata, ogni chiamata API richiede il token: gli estranei
  non possono usare la chiave.
- Monitora i consumi su https://console.anthropic.com → Usage.
- Per spegnere tutto: sospendi/elimina il servizio dal dashboard.
