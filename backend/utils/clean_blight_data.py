import pandas as pd
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
INPUT_FILE = BACKEND_DIR / "data" / "raw" / "blight_tickets.csv"
OUTPUT_FILE = BACKEND_DIR / "data" / "processed" / "cleaned_blight_data.csv"

# Columns we actually care about
columns_to_keep = [
    "Address",
    "Parcel ID",
    "Longitude",
    "Latitude",
    "Neighborhood",
    "Council District",
    "Zip Code",
    "Ticket Issued Date",
    "Fine Amount",
    "Judgement Amount",
    "Balance Due",
    "Payment Status",
    "Disposition"
]

print("Loading CSV...")

# Read only needed columns
blight_df = pd.read_csv(
    INPUT_FILE,
    usecols=columns_to_keep,
    low_memory=False
)

print(f"Original rows: {len(blight_df)}")

# Convert date column
blight_df["Ticket Issued Date"] = pd.to_datetime(
    blight_df["Ticket Issued Date"],
    errors="coerce"
)

# Keep only 2020-present
blight_df = blight_df[
    blight_df["Ticket Issued Date"].dt.year >= 2020
]

print(f"Rows after year filter: {len(blight_df)}")

# Remove rows with missing coordinates
blight_df = blight_df.dropna(subset=["Latitude", "Longitude"])

print(f"Rows after coordinate cleanup: {len(blight_df)}")

# Save cleaned file
OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
blight_df.to_csv(OUTPUT_FILE, index=False)

print("Done!")
print(f"Cleaned file saved to: {OUTPUT_FILE}")