"""Schemi pydantic per le richieste API."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    lang: Literal["it", "en"] = "it"
    user: str = "Giulia Bianchi"


class ReviewRequest(BaseModel):
    interaction_id: str
    outcome: Literal["validata", "correggi", "scarta"]
    note: str = ""
    user: str = "Giulia Bianchi"


class FeedbackRequest(BaseModel):
    interaction_id: str
    vote: Literal["up", "down"]
    comment: str = ""


class PaloFieldRequest(BaseModel):
    key: str
    value: bool | str | float
    note: str = ""
    by: str = ""
