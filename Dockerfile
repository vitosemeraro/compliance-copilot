# syntax=docker/dockerfile:1

# ---------- Stage 1: build del frontend ----------
FROM node:20-alpine AS frontend
WORKDIR /fe
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: backend (serve API + frontend compilato) ----------
FROM python:3.11-slim
ENV PYTHONUNBUFFERED=1 \
    PYTHONUTF8=1 \
    PYTHONIOENCODING=utf-8 \
    ANONYMIZED_TELEMETRY=False \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# Toolchain per le eventuali estensioni native (chroma-hnswlib, tokenizers).
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install -r backend/requirements.txt

COPY backend/ ./backend/
COPY --from=frontend /fe/dist ./frontend/dist

WORKDIR /app/backend
# Bake nell'immagine: indice vettoriale (scarica il modello embedding) + audit demo.
RUN python scripts/build_index.py && python scripts/seed_audit.py

EXPOSE 8000
# Render/Railway forniscono $PORT; in locale default 8000.
CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
