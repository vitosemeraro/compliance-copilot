"""Parsing del corpus markdown in chunk indicizzabili.

Ogni documento ha un frontmatter YAML e sezioni delimitate da `### `.
Il chunking è **per articolo/sezione** così le citazioni sono precise
(documento · sezione/articolo), come richiesto dallo spec (F2).
"""
from __future__ import annotations

import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterator

import yaml

from .config import CORPUS_DIR

_FRONTMATTER = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_SECTION = re.compile(r"^###\s+(.*)$", re.MULTILINE)


@dataclass
class Chunk:
    chunk_id: str          # es. "ivass-40-2018::art-12"
    doc_id: str            # es. "ivass-40-2018"
    doc_title: str         # titolo esteso del documento
    doc_short: str         # etichetta breve mostrata nelle citazioni
    section: str           # es. "Art. 12 — Criteri attuariali"
    type: str              # "public" | "internal"
    fictitious: bool       # True per le policy sintetiche
    jurisdiction: str
    text: str              # corpo della sezione

    def to_metadata(self) -> dict:
        d = asdict(self)
        d.pop("text")
        return d


def _slug(value: str) -> str:
    value = value.lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")[:48]


def parse_document(path: Path) -> Iterator[Chunk]:
    raw = path.read_text(encoding="utf-8")
    m = _FRONTMATTER.match(raw)
    if not m:
        raise ValueError(f"Frontmatter mancante in {path.name}")
    meta = yaml.safe_load(m.group(1)) or {}
    body = raw[m.end():]

    doc_id = str(meta.get("id") or _slug(path.stem))
    doc_title = str(meta.get("title") or doc_id)
    doc_short = str(meta.get("short") or doc_title)
    doc_type = str(meta.get("type") or "public")
    fictitious = bool(meta.get("fictitious", False))
    jurisdiction = str(meta.get("jurisdiction") or "")

    # Split su ogni heading `### `.
    matches = list(_SECTION.finditer(body))
    if not matches:
        return
    for i, match in enumerate(matches):
        section = match.group(1).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        text = body[start:end].strip()
        if not text:
            continue
        yield Chunk(
            chunk_id=f"{doc_id}::{_slug(section)}",
            doc_id=doc_id,
            doc_title=doc_title,
            doc_short=doc_short,
            section=section,
            type=doc_type,
            fictitious=fictitious,
            jurisdiction=jurisdiction,
            text=text,
        )


def load_corpus(corpus_dir: Path = CORPUS_DIR) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted(corpus_dir.glob("*.md")):
        chunks.extend(parse_document(path))
    return chunks
