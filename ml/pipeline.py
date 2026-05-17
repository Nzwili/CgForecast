"""
ml/pipeline.py
Feature engineering pipeline — runs on all groups in the database.
Computes rolling_avg_4w, trend_slope, rsvp_rate, feedback_avg and
writes to the `Feature` table.

Usage:
    python ml/pipeline.py
"""
import os
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))


def get_connection():
    db_url = os.environ.get('DATABASE_URL', '')
    if db_url.startswith('postgres://') or db_url.startswith('postgresql://'):
        if db_url.startswith('postgres://'):
            db_url = db_url.replace('postgres://', 'postgresql://', 1)
        import psycopg2
        conn = psycopg2.connect(db_url)
        return conn, '%s'
    else:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), '..', 'server', 'prisma', 'dev.db')
        conn = sqlite3.connect(db_path)
        return conn, '?'


def compute_features(group_id: int, conn, placeholder: str) -> pd.DataFrame:
    query = f"""
        SELECT a."sessionDate" as session_date,
               a.headcount,
               a."rsvpCount" as rsvp_count,
               COALESCE(f."avgRating", 3.0) AS avg_rating
        FROM   "Attendance" a
        LEFT JOIN "Feedback" f
               ON f."groupId" = a."groupId"
              AND f."sessionDate" = a."sessionDate"
        WHERE  a."groupId" = {placeholder}
        ORDER  BY a."sessionDate"
    """
    df = pd.read_sql(query, conn, params=[group_id])
    if df.empty:
        return df

    df['session_date_raw'] = df['session_date']
    
    # Safely convert session_date to pandas datetime regardless of source data representation
    if pd.api.types.is_numeric_dtype(df['session_date']):
        df['session_date'] = pd.to_datetime(df['session_date'], unit='ms')
    else:
        df['session_date'] = pd.to_datetime(df['session_date'])
        
    df.sort_values('session_date', inplace=True)

    # Rolling 4-week average headcount
    df['rolling_avg_4w'] = df['headcount'].rolling(4, min_periods=2).mean()

    # Trend slope — linear regression coefficient over last 8 weeks
    def slope(series):
        if len(series) < 3:
            return 0.0
        x = np.arange(len(series))
        return float(np.polyfit(x, series, 1)[0])

    df['trend_slope'] = df['headcount'].rolling(8, min_periods=3).apply(slope, raw=True)

    # RSVP rate (clamp to [0, 1])
    df['rsvp_rate'] = df['rsvp_count'] / df['headcount'].replace(0, np.nan)
    df['rsvp_rate'] = df['rsvp_rate'].fillna(0.0).clip(0, 1)

    df['feedback_avg'] = df['avg_rating']
    df['group_id'] = group_id

    df.dropna(subset=['rolling_avg_4w'], inplace=True)
    return df


def run_pipeline():
    conn, placeholder = get_connection()
    is_postgres = (placeholder == '%s')
    try:
        cur = conn.cursor()
        cur.execute('SELECT DISTINCT id FROM "Group"')
        group_ids = [r[0] for r in cur.fetchall()]
        cur.close()

        if not group_ids:
            print("No groups found. Have you run the seed script?")
            return

        for gid in group_ids:
            df = compute_features(gid, conn, placeholder)
            if df.empty:
                print(f"  [!] Group {gid}: no attendance data, skipping.")
                continue

            inserted = 0
            for _, row in df.iterrows():
                cur = conn.cursor()
                
                # Format dates/timestamps dynamically for PG vs SQLite
                if is_postgres:
                    feat_date = pd.to_datetime(row['session_date_raw']).to_pydatetime()
                    comp_date = datetime.utcnow()
                else:
                    if isinstance(row['session_date_raw'], str):
                        feat_date = row['session_date_raw']
                    else:
                        feat_date = int(row['session_date_raw'])
                    comp_date = int(datetime.utcnow().timestamp() * 1000)

                cur.execute(
                        f"""
                        INSERT INTO "Feature"
                            ("groupId", "featureDate", "rollingAvg4w",
                             "trendSlope", "rsvpRate", "feedbackAvg", "computedAt")
                        VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})
                        """,
                        (
                            gid,
                            feat_date,
                            float(row['rolling_avg_4w']),
                            float(row['trend_slope']) if not np.isnan(row['trend_slope']) else 0.0,
                            float(row['rsvp_rate']),
                            float(row['feedback_avg']),
                            comp_date,
                        ),
                    )
                inserted += cur.rowcount if hasattr(cur, 'rowcount') else 1
            conn.commit()
            print(f"  [OK] Group {gid}: {inserted} feature rows inserted.")

        print(f"\n[DONE] Pipeline complete for {len(group_ids)} group(s).")
    finally:
        conn.close()


if __name__ == '__main__':
    run_pipeline()
