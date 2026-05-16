"""
Run this script the night before the hackathon to ingest Detroit open data.
Downloads and loads:
  - Blight violations CSV
  - Vacant property registrations
"""
import pandas as pd
import sqlite3
import requests
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "../backend"))
from database import get_db, init_db, DB_PATH

BLIGHT_CSV_URL = "https://apis.detroitmi.gov/data/blight_violations.zip"
RAW_DIR = os.path.join(os.path.dirname(__file__), "../data/raw")

def download_blight_data():
    print("Downloading blight violations data...")
    r = requests.get(BLIGHT_CSV_URL, stream=True)
    zip_path = os.path.join(RAW_DIR, "blight_violations.zip")
    with open(zip_path, "wb") as f:
        for chunk in r.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Downloaded to {zip_path}")
    return zip_path

def load_blight_violations(zip_path: str):
    print("Loading blight violations...")
    df = pd.read_csv(zip_path, compression="zip", low_memory=False)
    print(f"  Loaded {len(df)} violations")

    # Normalize column names
    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

    conn = get_db()
    loaded = 0
    for _, row in df.iterrows():
        try:
            conn.execute("""
                INSERT OR IGNORE INTO blight_violations
                (parcel_id, violation_date, violation_code, description, fine_amount, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                str(row.get("parcelid", "")),
                str(row.get("ticketissuedtime", "")),
                str(row.get("violationcode", "")),
                str(row.get("violationdescription", "")),
                float(row.get("fineamt", 0) or 0),
                str(row.get("disposition", "")),
            ))
            loaded += 1
        except Exception as e:
            continue
    conn.commit()
    conn.close()
    print(f"  Inserted {loaded} blight violations")

def load_vacant_properties():
    """
    Load vacant property registrations from Detroit Open Data Portal.
    Uses the ArcGIS REST API — no auth required.
    """
    print("Loading vacant property registrations...")
    url = "https://services2.arcgis.com/qvkbeam8lgZ7xKP2/arcgis/rest/services/Vacant_Property_Registrations/FeatureServer/0/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "f": "json",
        "resultRecordCount": 2000,
    }
    r = requests.get(url, params=params)
    data = r.json()
    features = data.get("features", [])
    print(f"  Got {len(features)} vacant properties")

    conn = get_db()
    loaded = 0
    for feat in features:
        attrs = feat.get("attributes", {})
        geo = feat.get("geometry", {})
        try:
            conn.execute("""
                INSERT OR IGNORE INTO properties
                (parcel_id, address, neighborhood, latitude, longitude, vacancy_status, vacancy_since)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                str(attrs.get("parcel_id") or attrs.get("PARCELNO") or ""),
                str(attrs.get("address") or attrs.get("ADDRESS") or ""),
                str(attrs.get("neighborhood") or attrs.get("NEIGHBORHOOD") or ""),
                geo.get("y"),
                geo.get("x"),
                str(attrs.get("status") or "VACANT"),
                str(attrs.get("registration_date") or ""),
            ))
            loaded += 1
        except Exception as e:
            continue
    conn.commit()
    conn.close()
    print(f"  Inserted {loaded} vacant properties")

def seed_sample_data():
    """
    Seed realistic sample data for demo if real download fails.
    Run this as fallback during the hackathon.
    """
    print("Seeding sample data...")
    conn = get_db()

    sample_properties = [
        ("P001", "1234 Michigan Ave", "Corktown", 42.3314, -83.0654, "VACANT", "2019-03-15", 1, 4),
        ("P002", "5678 Woodward Ave", "New Center", 42.3748, -83.0644, "VACANT", "2020-07-22", 1, 3),
        ("P003", "910 E Jefferson Ave", "Jefferson-Chalmers", 42.3529, -82.9884, "VACANT", "2018-01-10", 0, 0),
        ("P004", "2200 Gratiot Ave", "East Village", 42.3590, -83.0210, "VACANT", "2017-05-30", 1, 5),
        ("P005", "3300 W Vernor Hwy", "Southwest Detroit", 42.3243, -83.0854, "VACANT", "2021-11-01", 0, 0),
        ("P006", "444 Alexandrine St", "Midtown", 42.3536, -83.0612, "VACANT", "2016-08-14", 1, 6),
        ("P007", "7890 Mack Ave", "East English Village", 42.3772, -82.9732, "VACANT", "2022-02-28", 0, 0),
        ("P008", "1111 Dexter Ave", "Dexter-Linwood", 42.3701, -83.1045, "VACANT", "2015-03-01", 1, 7),
    ]

    for p in sample_properties:
        conn.execute("""
            INSERT OR IGNORE INTO properties
            (parcel_id, address, neighborhood, latitude, longitude, vacancy_status, vacancy_since, tax_delinquent, years_delinquent)
            VALUES (?,?,?,?,?,?,?,?,?)
        """, p)

    sample_violations = [
        ("P001", "2022-05-10", "9-1-101", "Failure to maintain exterior", 500, "RESPONSIBLE"),
        ("P001", "2023-01-15", "9-1-111", "Broken windows", 250, "RESPONSIBLE"),
        ("P004", "2021-08-20", "9-1-101", "Overgrown vegetation", 200, "RESPONSIBLE"),
        ("P004", "2022-03-05", "9-1-115", "Illegal dumping on property", 1000, "RESPONSIBLE"),
        ("P004", "2023-06-12", "9-1-101", "Failure to maintain exterior", 500, "RESPONSIBLE"),
        ("P006", "2020-02-14", "9-1-101", "Structural hazard", 2000, "RESPONSIBLE"),
        ("P006", "2021-07-30", "9-1-111", "Broken windows", 250, "RESPONSIBLE"),
        ("P008", "2019-09-01", "9-1-101", "Failure to maintain exterior", 500, "RESPONSIBLE"),
        ("P008", "2020-04-22", "9-1-115", "Illegal dumping", 1000, "RESPONSIBLE"),
        ("P008", "2021-11-10", "9-1-101", "Overgrown vegetation", 200, "RESPONSIBLE"),
        ("P008", "2022-06-01", "9-1-111", "Broken windows", 250, "RESPONSIBLE"),
    ]

    for v in sample_violations:
        conn.execute("""
            INSERT OR IGNORE INTO blight_violations
            (parcel_id, violation_date, violation_code, description, fine_amount, status)
            VALUES (?,?,?,?,?,?)
        """, v)

    sample_complaints = [
        ("P001", "2023-03-01", "Broken glass everywhere, kids play nearby"),
        ("P004", "2022-12-10", "People dumping trash here every week"),
        ("P004", "2023-02-14", "Abandoned cars on property, smells bad"),
        ("P006", "2021-05-20", "Roof caving in, looks like it could collapse"),
        ("P008", "2022-08-15", "This building has been empty for years, attracts crime"),
        ("P008", "2023-01-02", "Squatters moving in and out, not safe"),
    ]

    for c in sample_complaints:
        conn.execute("""
            INSERT OR IGNORE INTO complaints (parcel_id, complaint_date, complaint_text)
            VALUES (?,?,?)
        """, c)

    conn.commit()
    conn.close()
    print("Sample data seeded.")

if __name__ == "__main__":
    os.makedirs(RAW_DIR, exist_ok=True)
    init_db()

    mode = sys.argv[1] if len(sys.argv) > 1 else "sample"
    if mode == "real":
        try:
            zip_path = download_blight_data()
            load_blight_violations(zip_path)
            load_vacant_properties()
        except Exception as e:
            print(f"Real data load failed: {e}")
            print("Falling back to sample data...")
            seed_sample_data()
    else:
        seed_sample_data()

    print("Data ingestion complete.")
