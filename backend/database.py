import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "../data/blight.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT UNIQUE,
            address TEXT,
            neighborhood TEXT,
            latitude REAL,
            longitude REAL,
            vacancy_status TEXT,
            vacancy_since TEXT,
            tax_delinquent INTEGER DEFAULT 0,
            years_delinquent INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS blight_violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT,
            violation_date TEXT,
            violation_code TEXT,
            description TEXT,
            fine_amount REAL,
            status TEXT,
            FOREIGN KEY (parcel_id) REFERENCES properties(parcel_id)
        );

        CREATE TABLE IF NOT EXISTS scored_properties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT UNIQUE,
            blight_score REAL,
            vacancy_score REAL,
            tax_score REAL,
            complaint_score REAL,
            total_score REAL,
            priority_tier TEXT,
            ai_explanation TEXT,
            scored_at TEXT,
            FOREIGN KEY (parcel_id) REFERENCES properties(parcel_id)
        );

        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            parcel_id TEXT,
            complaint_date TEXT,
            complaint_text TEXT,
            embedding TEXT,
            cluster_id INTEGER,
            FOREIGN KEY (parcel_id) REFERENCES properties(parcel_id)
        );
    """)

    conn.commit()
    conn.close()
    print("Database initialized.")

if __name__ == "__main__":
    init_db()
