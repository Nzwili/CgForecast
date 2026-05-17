"""
ml/service.py
FastAPI microservice exposing a /predict endpoint.
Called by the Node.js server to generate attendance forecasts.

Run:
    uvicorn ml.service:app --port 5001 --reload
  OR (from inside ml/ dir):
    uvicorn service:app --port 5001 --reload
"""
import os

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

import pipeline
import train

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

app = FastAPI(
    title="Congregate ML Service",
    description="SVR-based attendance forecasting microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ForecastRequest(BaseModel):
    group_id: int
    horizon: int
    features: list[float]  # [rolling_avg_4w, trend_slope, rsvp_rate, feedback_avg]

    @field_validator('features')
    @classmethod
    def features_length(cls, v):
        if len(v) != 4:
            raise ValueError('features must have exactly 4 values: '
                             '[rolling_avg_4w, trend_slope, rsvp_rate, feedback_avg]')
        return v


@app.get('/health')
def health():
    models = [f for f in os.listdir(MODEL_DIR) if f.endswith('.pkl')] if os.path.isdir(MODEL_DIR) else []
    return {'status': 'ok', 'models_loaded': len(models)}


def run_ml_pipeline():
    try:
        print("Starting background ML pipeline run...")
        pipeline.run_pipeline()
        train.main()
        print("Background ML pipeline run completed.")
    except Exception as e:
        print(f"Error in background ML pipeline: {e}")


@app.post('/retrain')
def trigger_retrain(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_ml_pipeline)
    return {"status": "retraining started in background"}


@app.get('/accuracy')
def get_accuracy():
    """Return per-group model metrics from stored .pkl bundles, averaged across horizons."""
    groups_dict = {}
    if os.path.isdir(MODEL_DIR):
        for fname in sorted(os.listdir(MODEL_DIR)):
            if fname.endswith('.pkl') and fname.startswith('group_'):
                try:
                    bundle = joblib.load(os.path.join(MODEL_DIR, fname))
                    gid = bundle.get('group_id')
                    mae = bundle.get('mae')
                    rmse = bundle.get('rmse')
                    if gid is not None and mae is not None:
                        if gid not in groups_dict:
                            groups_dict[gid] = {
                                'maes': [], 'rmses': [], 'ols_maes': [], 'ols_rmses': [], 
                                'arima_maes': [], 'arima_rmses': [],
                                'bestParams': bundle.get('best_params'), 
                                'trainedAt': bundle.get('trained_at'), 
                                'trainingRecords': bundle.get('training_records')
                            }
                        groups_dict[gid]['maes'].append(mae)
                    groups_dict[gid]['rmses'].append(rmse)
                    
                    if bundle.get('ols_mae') is not None:
                        groups_dict[gid]['ols_maes'].append(bundle.get('ols_mae'))
                    if bundle.get('ols_rmse') is not None:
                        groups_dict[gid]['ols_rmses'].append(bundle.get('ols_rmse'))
                    if bundle.get('arima_mae') is not None:
                        groups_dict[gid]['arima_maes'].append(bundle.get('arima_mae'))
                    if bundle.get('arima_rmse') is not None:
                        groups_dict[gid]['arima_rmses'].append(bundle.get('arima_rmse'))
                except Exception:
                    pass

    groups = []
    for gid, data in groups_dict.items():
        avg_arima_mae = sum(data['arima_maes']) / len(data['arima_maes']) if data['arima_maes'] else None
        avg_arima_rmse = sum(data['arima_rmses']) / len(data['arima_rmses']) if data['arima_rmses'] else None
        
        groups.append({
            'groupId': gid,
            'mae': sum(data['maes']) / len(data['maes']),
            'rmse': sum(data['rmses']) / len(data['rmses']),
            'olsMae': sum(data['ols_maes']) / len(data['ols_maes']) if data['ols_maes'] else None,
            'olsRmse': sum(data['ols_rmses']) / len(data['ols_rmses']) if data['ols_rmses'] else None,
            'arimaMae': avg_arima_mae,
            'arimaRmse': avg_arima_rmse,
            'bestParams': data['bestParams'],
            'trainedAt': data['trainedAt'],
            'trainingRecords': data['trainingRecords']
        })

    maes = [g['mae'] for g in groups]
    overall_mae = round(sum(maes) / len(maes), 2) if maes else None
    return {'groups': groups, 'overallMae': overall_mae}


@app.post('/predict')
def predict(req: ForecastRequest):
    model_path = os.path.join(MODEL_DIR, f'group_{req.group_id}_h{req.horizon}.pkl')
    if not os.path.exists(model_path):
        raise HTTPException(
            status_code=404,
            detail=f'No trained model for group {req.group_id} at horizon {req.horizon}. Run train.py first.'
        )

    bundle = joblib.load(model_path)
    model: object = bundle['model']
    scaler: object = bundle['scaler']

    X = np.array(req.features).reshape(1, -1)
    X_s = scaler.transform(X)
    prediction = float(model.predict(X_s)[0])
    prediction = max(0.0, prediction)

    # Bootstrap 95% CI: perturb input slightly, observe prediction spread
    rng = np.random.default_rng(seed=42)
    noise = rng.normal(0, 0.05, (200, X.shape[1]))
    X_perturbed = np.tile(X, (200, 1)) + noise
    X_perturbed_s = scaler.transform(X_perturbed)
    bootstrap_preds = model.predict(X_perturbed_s)
    residual_std = float(np.std(bootstrap_preds))

    ci_lower = max(0.0, prediction - 1.96 * residual_std)
    ci_upper = prediction + 1.96 * residual_std

    return {
        'predicted_headcount': round(prediction, 1),
        'confidence_lower':    round(ci_lower,    1),
        'confidence_upper':    round(ci_upper,    1),
    }
