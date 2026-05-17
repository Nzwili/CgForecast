from fastapi.testclient import TestClient
from service import app
import unittest.mock as mock

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_predict_validation():
    # Test that invalid feature length is rejected
    payload = {
        "group_id": 1,
        "horizon": 4,
        "features": [100.0, 0.5] # Only 2 features, expects 4
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422 # Unprocessable Entity

@mock.patch("joblib.load")
@mock.patch("os.path.exists")
def test_predict_success(mock_exists, mock_load):
    # Setup mock model and scaler
    mock_exists.return_value = True
    
    mock_model = mock.Mock()
    mock_model.predict.return_value = [150.5]
    
    mock_scaler = mock.Mock()
    mock_scaler.transform.return_value = [[1.0, 1.0, 1.0, 1.0]]
    
    mock_load.return_value = {
        'model': mock_model,
        'scaler': mock_scaler
    }

    payload = {
        "group_id": 1,
        "horizon": 4,
        "features": [140.0, 1.2, 0.8, 4.5]
    }
    
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_headcount" in data
    assert data["predicted_headcount"] == 150.5
    assert "confidence_lower" in data
    assert "confidence_upper" in data
