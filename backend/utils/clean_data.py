import pandas as pd
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BACKEND_DIR / "data" / "raw"
PROCESSED_DIR = BACKEND_DIR / "data" / "processed"

VACANT_INPUT = RAW_DIR / "vacant_property_registrations.csv"
BLIGHT_INPUT = PROCESSED_DIR / "cleaned_blight_data.csv"

VACANT_OUTPUT = PROCESSED_DIR / "vacant_properties_clean.csv"
BLIGHT_OUTPUT = PROCESSED_DIR / "blight_tickets_clean.csv"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

vacant_columns = [
    "Address",
    "Date Issued",
    "Neighborhood",
    "Council District",
    "Zip Code",
    "Parcel ID",
    "Longitude",
    "Latitude",
]

blight_columns = [
    "Address",
    "Ticket Issued Date",
    "Fine Amount",
    "Judgement Amount",
    "Balance Due",
    "Payment Status",
    "Neighborhood",
    "Council District",
    "Zip Code",
    "Parcel ID",
    "Longitude",
    "Latitude",
]

print("Cleaning vacant properties...")
vacant_df = pd.read_csv(VACANT_INPUT, usecols=vacant_columns, low_memory=False)

vacant_df["Date Issued"] = pd.to_datetime(vacant_df["Date Issued"], errors="coerce")
vacant_df = vacant_df.dropna(subset=["Address", "Latitude", "Longitude"])
vacant_df = vacant_df.drop_duplicates(subset=["Address", "Parcel ID"])

vacant_df.to_csv(VACANT_OUTPUT, index=False)
print(f"Saved: {VACANT_OUTPUT}")
print(f"Vacant rows: {len(vacant_df)}")

print("Cleaning blight tickets...")
blight_df = pd.read_csv(BLIGHT_INPUT, usecols=blight_columns, low_memory=False)

blight_df["Ticket Issued Date"] = pd.to_datetime(
    blight_df["Ticket Issued Date"],
    errors="coerce"
)

blight_df = blight_df.dropna(subset=["Address", "Latitude", "Longitude"])

# Optional: keep only recent tickets
blight_df = blight_df[blight_df["Ticket Issued Date"].dt.year >= 2020]

blight_df.to_csv(BLIGHT_OUTPUT, index=False)
print(f"Saved: {BLIGHT_OUTPUT}")
print(f"Blight rows: {len(blight_df)}")

print("Done!")