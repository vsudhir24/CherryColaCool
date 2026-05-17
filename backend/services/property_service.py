import re
from functools import lru_cache
from pathlib import Path

import pandas as pd

from services.scoring_model import (
    build_rank_reasons,
    calculate_priority_score,
    suggest_action,
)

BACKEND_DIR = Path(__file__).resolve().parent.parent
VACANT_CSV = BACKEND_DIR / "data" / "processed" / "vacant_properties_clean.csv"
BLIGHT_CSV = BACKEND_DIR / "data" / "processed" / "blight_tickets_clean.csv"

BLIGHT_ONLY_MIN_VIOLATIONS = 2
DEFAULT_LIMIT = 3000


def _norm_parcel(parcel_id) -> str | None:
    if parcel_id is None or (isinstance(parcel_id, float) and pd.isna(parcel_id)):
        return None
    text = str(parcel_id).strip().lower().rstrip(".")
    return text or None


def _norm_zip(zip_code) -> str:
    if zip_code is None or (isinstance(zip_code, float) and pd.isna(zip_code)):
        return ""
    value = str(zip_code).strip()
    if value.endswith(".0"):
        value = value[:-2]
    return value.zfill(5) if value.isdigit() else value


def _is_valid_parcel_key(parcel_key) -> bool:
    return parcel_key is not None and not (isinstance(parcel_key, float) and pd.isna(parcel_key))


def _make_id(parcel_key: str | None, address: str) -> str:
    if _is_valid_parcel_key(parcel_key):
        slug = re.sub(r"[^a-z0-9]+", "-", str(parcel_key).lower()).strip("-")
        return f"parcel-{slug}" if slug else f"addr-{abs(hash(address)) % 10**8}"
    return f"addr-{abs(hash(address.upper())) % 10**8}"


def _aggregate_blight(blight_df: pd.DataFrame) -> pd.DataFrame:
    blight_df = blight_df.copy()
    blight_df["parcel_key"] = blight_df["Parcel ID"].map(_norm_parcel)

    grouped = (
        blight_df.groupby("parcel_key", dropna=False)
        .agg(
            address=("Address", "first"),
            zip=("Zip Code", "first"),
            lat=("Latitude", "first"),
            lng=("Longitude", "first"),
            blight_violations=("Address", "count"),
            outstanding_balance=("Balance Due", "sum"),
        )
        .reset_index()
    )
    return grouped


def _row_to_property(
    *,
    parcel_key: str | None,
    address: str,
    zip_code: str,
    lat: float,
    lng: float,
    vacant: bool,
    blight_violations: int,
    outstanding_balance: float,
    tax_delinquent_years: int = 0,
    complaints_311: int = 0,
) -> dict:
    vacancy_status = "vacant" if vacant else "unknown"
    if not vacant and blight_violations >= 3:
        vacancy_status = "occupied"

    # Tax fields stay at 0 until tax-roll data is integrated.
    tax_delinquent_amount = 0

    score_input = {
        "vacant": vacant,
        "blight_violations": int(blight_violations),
        "tax_delinquent_years": int(tax_delinquent_years),
        "outstanding_balance": float(outstanding_balance),
        "complaints_311": int(complaints_311),
    }
    priority_score = calculate_priority_score(score_input)

    rank_reasons = build_rank_reasons(
        vacant=vacant,
        blight_violations=int(blight_violations),
        tax_delinquent_years=int(tax_delinquent_years),
        outstanding_balance=float(outstanding_balance),
        complaints_311=int(complaints_311),
    )

    suggested_action = suggest_action(
        priority_score=priority_score,
        vacant=vacant,
        blight_violations=int(blight_violations),
        outstanding_balance=float(outstanding_balance),
    )

    return {
        "id": _make_id(parcel_key, address),
        "address": address,
        "zip": zip_code,
        "lat": float(lat),
        "lng": float(lng),
        "priorityScore": priority_score,
        "vacancyStatus": vacancy_status,
        "blightViolations": int(blight_violations),
        "taxDelinquentYears": int(tax_delinquent_years),
        "taxDelinquentAmount": tax_delinquent_amount,
        "complaints311": int(complaints_311),
        "rankReasons": rank_reasons,
        "suggestedAction": suggested_action,
        "_outstandingBalance": float(outstanding_balance),
    }


@lru_cache(maxsize=1)
def _load_all_properties() -> tuple[dict, ...]:
    if not VACANT_CSV.exists() or not BLIGHT_CSV.exists():
        raise FileNotFoundError(
            "Processed data not found. Run utils/clean_blight_data.py and utils/clean_data.py first."
        )

    vacant_df = pd.read_csv(VACANT_CSV, low_memory=False)
    blight_df = pd.read_csv(BLIGHT_CSV, low_memory=False)
    blight_agg = _aggregate_blight(blight_df)

    blight_by_parcel = {
        row.parcel_key: row
        for row in blight_agg.itertuples(index=False)
        if _is_valid_parcel_key(row.parcel_key)
    }

    properties: list[dict] = []
    vacant_parcel_keys: set[str] = set()

    for _, row in vacant_df.iterrows():
        parcel_key = _norm_parcel(row["Parcel ID"])
        if _is_valid_parcel_key(parcel_key):
            vacant_parcel_keys.add(parcel_key)

        blight_row = blight_by_parcel.get(parcel_key) if parcel_key else None
        blight_violations = int(blight_row.blight_violations) if blight_row is not None else 0
        outstanding_balance = (
            float(blight_row.outstanding_balance) if blight_row is not None else 0.0
        )

        properties.append(
            _row_to_property(
                parcel_key=parcel_key,
                address=str(row["Address"]).strip(),
                zip_code=_norm_zip(row["Zip Code"]),
                lat=float(row["Latitude"]),
                lng=float(row["Longitude"]),
                vacant=True,
                blight_violations=blight_violations,
                outstanding_balance=outstanding_balance,
            )
        )

    for blight_row in blight_agg.itertuples(index=False):
        if not _is_valid_parcel_key(blight_row.parcel_key) or blight_row.parcel_key in vacant_parcel_keys:
            continue
        if int(blight_row.blight_violations) < BLIGHT_ONLY_MIN_VIOLATIONS:
            continue

        properties.append(
            _row_to_property(
                parcel_key=blight_row.parcel_key,
                address=str(blight_row.address).strip(),
                zip_code=_norm_zip(blight_row.zip),
                lat=float(blight_row.lat),
                lng=float(blight_row.lng),
                vacant=False,
                blight_violations=int(blight_row.blight_violations),
                outstanding_balance=float(blight_row.outstanding_balance),
            )
        )

    properties.sort(
        key=lambda p: (
            p["priorityScore"],
            p["blightViolations"],
            p.get("_outstandingBalance", 0),
        ),
        reverse=True,
    )
    return tuple(properties)


def get_properties(filters: dict | None = None, limit: int | None = DEFAULT_LIMIT) -> list[dict]:
    filters = filters or {}
    properties = list(_load_all_properties())

    address_q = (filters.get("address") or "").strip().lower()
    if address_q:
        properties = [p for p in properties if address_q in p["address"].lower()]

    zip_code = (filters.get("zip") or "").strip()
    if zip_code:
        properties = [p for p in properties if p["zip"] == zip_code]

    score_min = filters.get("score_min")
    if score_min is not None:
        properties = [p for p in properties if p["priorityScore"] >= int(score_min)]

    score_max = filters.get("score_max")
    if score_max is not None:
        properties = [p for p in properties if p["priorityScore"] <= int(score_max)]

    if filters.get("tax_delinquent") in (True, "true", "1", 1):
        properties = [p for p in properties if p["taxDelinquentYears"] > 0]

    if filters.get("vacant_blight") in (True, "true", "1", 1):
        properties = [
            p
            for p in properties
            if p["vacancyStatus"] == "vacant" and p["blightViolations"] > 0
        ]

    properties.sort(
        key=lambda p: (
            p["priorityScore"],
            p["blightViolations"],
            p.get("_outstandingBalance", 0),
        ),
        reverse=True,
    )

    if limit is not None and limit > 0:
        properties = properties[:limit]

    return [_public_property(p) for p in properties]


def _public_property(prop: dict) -> dict:
    return {k: v for k, v in prop.items() if not k.startswith("_")}


def clear_property_cache() -> None:
    _load_all_properties.cache_clear()
