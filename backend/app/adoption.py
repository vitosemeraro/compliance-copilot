"""Metriche di adoption-health nel tempo.

Lente dell'AI Productivity Lead: non "quanto risponde bene il tool" (quello è
il dashboard di business), ma "quanto e come viene adottato, e dove le persone
si bloccano". I dati sono SINTETICI e deterministici (seed fisso) a scopo
dimostrativo: mostrano il pattern di misurazione, non utenti reali.
"""
from __future__ import annotations

import random
from typing import Any

# Ancora temporale coerente con il seed dell'audit (giugno 2026).
ANCHOR_Y, ANCHOR_M = 2026, 6
WINDOW = 12  # mesi
TEAMS = ["Compliance", "Legal", "Pricing", "Operations"]


def _month_key(idx: int) -> str:
    """idx 0..WINDOW-1 → 'YYYY-MM' (idx WINDOW-1 = mese ancora)."""
    back = (WINDOW - 1) - idx
    m = ANCHOR_M - back
    y = ANCHOR_Y
    while m <= 0:
        m += 12
        y -= 1
    return f"{y:04d}-{m:02d}"


def _build_roster() -> list[dict[str, Any]]:
    """Popolazione sintetica di utenti con coorte di signup e mesi attivi."""
    rnd = random.Random(7)
    # nuovi iscritti per mese (crescita dell'adozione nel tempo)
    signups = {1: 3, 2: 3, 3: 4, 4: 4, 5: 5, 6: 5, 7: 6, 8: 6, 9: 6, 10: 5, 11: 4}
    users: list[dict[str, Any]] = []
    uid = 0
    for s_idx, n in signups.items():
        for _ in range(n):
            uid += 1
            active = {s_idx} if rnd.random() < 0.95 else set()
            for m in range(s_idx + 1, WINDOW):
                k = m - s_idx
                prob = max(0.12, 0.92 * (0.86 ** k)) + rnd.uniform(-0.04, 0.08)
                if rnd.random() < prob:
                    active.add(m)
            asked = rnd.random() < 0.90
            consulted = asked and rnd.random() < 0.84
            validated = consulted and rnd.random() < 0.80
            users.append({
                "id": uid,
                "team": TEAMS[uid % len(TEAMS)],
                "signup": s_idx,
                "active": active,
                "asked": asked,
                "consulted": consulted,
                "validated": validated,
            })
    return users


def adoption_stats() -> dict[str, Any]:
    users = _build_roster()
    last = WINDOW - 1
    total = len(users)

    # --- Utenti attivi per mese (MAU trend) ---
    mau_trend = []
    for m in range(WINDOW):
        active_m = sum(1 for u in users if m in u["active"])
        mau_trend.append({"month": _month_key(m), "active": active_m})
    mau = mau_trend[-1]["active"]
    mau_prev = mau_trend[-2]["active"] if WINDOW >= 2 else mau
    mau_delta = mau - mau_prev

    # --- Retention 30/60/90 giorni (≈ mesi dopo il signup) ---
    def retention(offset: int) -> int:
        elig = [u for u in users if u["signup"] + offset <= last]
        if not elig:
            return 0
        ret = sum(1 for u in elig if (u["signup"] + offset) in u["active"])
        return round(100 * ret / len(elig))

    r30, r60, r90 = retention(1), retention(2), retention(3)
    retention_curve = [
        {"label": "0g", "pct": 100},
        {"label": "7g", "pct": round((r30 + 100) / 2 - 4)},
        {"label": "30g", "pct": r30},
        {"label": "60g", "pct": r60},
        {"label": "90g", "pct": r90},
    ]

    # --- Funnel di attivazione / drop-off (stadi annidati, monotòni) ---
    n_asked = sum(1 for u in users if u["asked"])
    n_consulted = sum(1 for u in users if u["consulted"])
    n_validated = sum(1 for u in users if u["validated"])
    n_returned = sum(1 for u in users if len(u["active"]) >= 2)  # retention, mostrata a parte
    funnel = [
        {"stage": "onboarded", "users": total},
        {"stage": "asked", "users": n_asked},
        {"stage": "consulted", "users": n_consulted},
        {"stage": "validated", "users": n_validated},
    ]
    for i, f in enumerate(funnel):
        f["pct"] = round(100 * f["users"] / total) if total else 0
        f["drop"] = 0 if i == 0 else round(100 * (funnel[i - 1]["users"] - f["users"]) / max(1, funnel[i - 1]["users"]))
    # stadio con il calo maggiore = dove si bloccano
    worst = max(range(1, len(funnel)), key=lambda i: funnel[i]["drop"])
    stuck_stage = funnel[worst]["stage"]

    # --- Segmenti utenti (recency + frequency) ---
    def segment(u: dict[str, Any]) -> str:
        last_active = max(u["active"]) if u["active"] else -1
        if last_active < last - 1:  # inattivo da >~30-60g
            return "dormant"
        freq = len(u["active"])
        if freq >= 5:
            return "power"
        if freq >= 3:
            return "regular"
        return "occasional"

    seg_counts = {"power": 0, "regular": 0, "occasional": 0, "dormant": 0}
    for u in users:
        seg_counts[segment(u)] += 1
    segments = [{"name": k, "count": v} for k, v in seg_counts.items()]

    # --- Punti di frizione (dove si perde valore) ---
    asked_not_validated = sum(1 for u in users if u["asked"] and not u["validated"])
    onboarded_not_asked = total - n_asked
    dormant = seg_counts["dormant"]
    friction = [
        {"key": "asked_not_validated", "count": asked_not_validated,
         "pct": round(100 * asked_not_validated / max(1, n_asked))},
        {"key": "onboarded_not_asked", "count": onboarded_not_asked,
         "pct": round(100 * onboarded_not_asked / total)},
        {"key": "dormant", "count": dormant, "pct": round(100 * dormant / total)},
    ]

    # --- Cohort retention heatmap ---
    cohorts = []
    by_signup: dict[int, list[dict[str, Any]]] = {}
    for u in users:
        by_signup.setdefault(u["signup"], []).append(u)
    for s_idx in sorted(by_signup):
        members = by_signup[s_idx]
        size = len(members)
        values = []
        for k in range(0, WINDOW - s_idx):
            act = sum(1 for u in members if (s_idx + k) in u["active"])
            values.append({"k": k, "pct": round(100 * act / size)})
        cohorts.append({"cohort": _month_key(s_idx), "size": size, "values": values})

    # --- Adozione per team ---
    by_team = []
    for tm in TEAMS:
        members = [u for u in users if u["team"] == tm]
        active_now = sum(1 for u in members if last in u["active"])
        by_team.append({"team": tm, "active": active_now, "total": len(members)})

    return {
        "total_users": total,
        "mau": mau,
        "mau_delta": mau_delta,
        "mau_trend": mau_trend,
        "retention": {"d30": r30, "d60": r60, "d90": r90},
        "retention_curve": retention_curve,
        "retained_pct": round(100 * n_returned / total) if total else 0,
        "dropoff_rate": round(100 * dormant / total) if total else 0,
        "funnel": funnel,
        "stuck_stage": stuck_stage,
        "segments": segments,
        "friction": friction,
        "cohorts": cohorts,
        "by_team": by_team,
    }
