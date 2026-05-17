"""
ml/train.py
Trains a per-group SVR model using time-series-aware cross-validation.
Saves model + scaler bundles to ml/models/group_<id>.pkl.

Usage:
    python ml/train.py
"""
import os
import sys
import datetime

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import GridSearchCV, TimeSeriesSplit
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVR
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.arima.model import ARIMA

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ['rolling_avg_4w', 'trend_slope', 'rsvp_rate', 'feedback_avg']
TARGET = 'headcount'
MIN_RECORDS = 10
HORIZONS = [1, 4, 8, 12]


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


def train_group(group_id: int, horizon: int, conn, placeholder: str):
    query = f"""
        SELECT f."rollingAvg4w" as rolling_avg_4w,
               f."trendSlope" as trend_slope,
               f."rsvpRate" as rsvp_rate,
               f."feedbackAvg" as feedback_avg,
               a.headcount
        FROM   "Feature" f
        JOIN   "Attendance" a
               ON a."groupId" = f."groupId"
              AND a."sessionDate" = f."featureDate"
        WHERE  f."groupId" = {placeholder}
        ORDER  BY f."featureDate"
    """
    df = pd.read_sql(query, conn, params=[group_id])

    # Forecast future: shift headcount by -horizon
    df['target_headcount'] = df['headcount'].shift(-horizon)
    df.dropna(subset=['target_headcount'], inplace=True)

    if len(df) < MIN_RECORDS:
        print(f"  [!] Group {group_id} (h={horizon}): only {len(df)} records, need {MIN_RECORDS}. Skipping.")
        return None

    X = df[FEATURES].values
    y = df['target_headcount'].values

    # Time-series-aware split (no shuffling)
    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s = scaler.transform(X_test)
    # 1. Hyperparameter Search Space for RBF Kernel
    param_grid = {
        'C':       [1, 10, 100],
        'gamma':   ['scale', 'auto'],
        'epsilon': [0.1, 0.5],
    }
    # 2. Time-Series-Aware Cross-Validation (Prevents Look-Ahead Bias)
    tscv = TimeSeriesSplit(n_splits=min(5, len(X_train) - 1))
    # 3. Grid Search with Negative MAE Scoring
    gs = GridSearchCV(
        SVR(kernel='rbf'),
        param_grid,
        cv=tscv,
        scoring='neg_mean_absolute_error',
        n_jobs=-1,
        refit=True,
    )
    gs.fit(X_train_s, y_train)

    model = gs.best_estimator_
    preds = model.predict(X_test_s)
    mae = mean_absolute_error(y_test, preds)
    rmse = float(np.sqrt(mean_squared_error(y_test, preds)))
    print(f"  [OK] Group {group_id} (h={horizon}): SVR MAE={mae:.2f}, RMSE={rmse:.2f}, params={gs.best_params_}")

    # Baseline 1: OLS Linear Regression
    ols = LinearRegression()
    ols.fit(X_train_s, y_train)
    ols_preds = ols.predict(X_test_s)
    ols_mae = mean_absolute_error(y_test, ols_preds)
    ols_rmse = float(np.sqrt(mean_squared_error(y_test, ols_preds)))
    print(f"       OLS: MAE={ols_mae:.2f}, RMSE={ols_rmse:.2f}")

    # Baseline 2: ARIMA(1,1,1) on the target variable directly (univariate)
    try:
        arima = ARIMA(y_train, order=(1, 1, 1))
        arima_fit = arima.fit()
        arima_preds = arima_fit.forecast(steps=len(y_test))
        arima_mae = mean_absolute_error(y_test, arima_preds)
        arima_rmse = float(np.sqrt(mean_squared_error(y_test, arima_preds)))
        print(f"       ARIMA: MAE={arima_mae:.2f}, RMSE={arima_rmse:.2f}")
    except Exception as e:
        print(f"       [!] ARIMA Failed: {e}")
        arima_mae = None
        arima_rmse = None
    # 4. Joblib Serialization for Production Handoff
    bundle_path = os.path.join(MODEL_DIR, f'group_{group_id}_h{horizon}.pkl')
    joblib.dump({
        'model': model,
        'scaler': scaler,
        'mae': float(mae),
        'rmse': rmse,
        'ols_mae': float(ols_mae),
        'ols_rmse': float(ols_rmse),
        'arima_mae': float(arima_mae) if arima_mae is not None else None,
        'arima_rmse': float(arima_rmse) if arima_rmse is not None else None,
        'best_params': gs.best_params_,
        'trained_at': datetime.datetime.utcnow().isoformat() + 'Z',
        'group_id': group_id,
        'horizon': horizon,
        'training_records': int(len(X_train)),
    }, bundle_path)
    return mae


def main():
    conn, placeholder = get_connection()
    try:
        cur = conn.cursor()
        cur.execute('SELECT DISTINCT id FROM "Group"')
        group_ids = [r[0] for r in cur.fetchall()]
        cur.close()

        if not group_ids:
            print("No groups found. Run seed + pipeline first.")
            return

        print(f"Training SVR for {len(group_ids)} group(s) across horizons {HORIZONS}…\n")
        results = {}
        for gid in group_ids:
            for h in HORIZONS:
                mae = train_group(gid, h, conn, placeholder)
                if mae is not None:
                    results[f"{gid}_h{h}"] = mae

        print(f"\n[DONE] Training complete. Models saved to {MODEL_DIR}/")
        if results:
            avg_mae = sum(results.values()) / len(results)
            print(f"   Average MAE across all models: {avg_mae:.2f}")
    finally:
        conn.close()


if __name__ == '__main__':
    main()
