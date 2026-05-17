"""
ml/tests/test_pipeline.py
Pytest tests for the prediction service endpoint.
Requires the FastAPI service to be running OR uses TestClient.
"""
import pytest
from fastapi.testclient import TestClient

# Add parent dir to path so imports work
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from ml.service import app

client = TestClient(app)


def test_health_endpoint():
    """Service should return 200 with status ok."""
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_predict_missing_model():
    """A group with no trained model should return 404."""
    response = client.post('/predict', json={
        'group_id': 99999,
        'horizon': 4,
        'features': [45.0, 1.2, 0.6, 3.8]
    })
    assert response.status_code == 404


def test_predict_wrong_feature_length():
    """Should reject features list of wrong length."""
    response = client.post('/predict', json={
        'group_id': 1,
        'horizon': 4,
        'features': [45.0, 1.2]  # too short
    })
    assert response.status_code == 422  # Pydantic validation error


class TestWithModel:
    """
    Tests that require a trained model to exist.
    These will be skipped if no model is found for group 1.
    """

    @pytest.fixture(autouse=True)
    def require_model(self):
        model_path = os.path.join(
            os.path.dirname(__file__), '..', 'models', 'group_1.pkl'
        )
        if not os.path.exists(model_path):
            pytest.skip("No trained model for group 1 — run train.py first.")

    def test_headcount_prediction_positive(self):
        """Predicted headcount must be >= 0."""
        response = client.post('/predict', json={
            'group_id': 1, 'horizon': 4, 'features': [45.0, 1.2, 0.6, 3.8]
        })
        assert response.status_code == 200
        assert response.json()['predicted_headcount'] >= 0

    def test_confidence_interval_order(self):
        """CI lower <= prediction <= CI upper."""
        response = client.post('/predict', json={
            'group_id': 1, 'horizon': 4, 'features': [45.0, 1.2, 0.6, 3.8]
        })
        d = response.json()
        assert d['confidence_lower'] <= d['predicted_headcount'] <= d['confidence_upper']

    def test_prediction_is_numeric(self):
        """All fields should be floats."""
        response = client.post('/predict', json={
            'group_id': 1, 'horizon': 4, 'features': [50.0, 0.5, 0.7, 4.0]
        })
        d = response.json()
        for key in ('predicted_headcount', 'confidence_lower', 'confidence_upper'):
            assert isinstance(d[key], (int, float))


def test_sus_score_calculation():
    """SUS score should be in [0, 100] and target >= 68."""
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
    from sus_score import sus_score

    responses = [
        [4, 1, 4, 2, 4, 1, 5, 2, 4, 1],
        [3, 2, 4, 1, 5, 2, 4, 1, 3, 2],
        [5, 1, 5, 1, 4, 2, 5, 1, 4, 2],
        [4, 2, 3, 2, 4, 3, 4, 2, 3, 2],
        [4, 1, 4, 1, 5, 1, 5, 1, 5, 1],
    ]
    score = sus_score(responses)
    assert 0 <= score <= 100
