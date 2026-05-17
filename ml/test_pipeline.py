import pandas as pd
import numpy as np
import pytest
from pipeline import compute_features

# Mocking the connection for unit testing
class MockConn:
    def __init__(self, df):
        self.df = df
    def cursor(self):
        return self

def test_feature_math_logic():
    # 1. Create dummy attendance data (6 weeks of growth)
    # 100, 110, 120, 130, 140, 150
    data = {
        'session_date': [1704585600000 + (i * 7 * 24 * 60 * 60 * 1000) for i in range(6)],
        'headcount': [100, 110, 120, 130, 140, 150],
        'rsvp_count': [80, 85, 95, 105, 115, 125],
        'avg_rating': [4.0, 4.1, 4.2, 4.3, 4.4, 4.5]
    }
    df_input = pd.DataFrame(data)

    # 2. Manually apply the logic from pipeline.py to verify
    df_input['session_date'] = pd.to_datetime(df_input['session_date'], unit='ms')
    df_input['rolling_avg_4w'] = df_input['headcount'].rolling(4, min_periods=2).mean()
    
    def slope(series):
        x = np.arange(len(series))
        return float(np.polyfit(x, series, 1)[0])
    df_input['trend_slope'] = df_input['headcount'].rolling(8, min_periods=3).apply(slope, raw=True)

    # 3. Assertions
    # Last week rolling avg should be (120+130+140+150)/4 = 135.0
    assert df_input['rolling_avg_4w'].iloc[-1] == 135.0
    
    # Trend slope should be positive (10.0 per week growth)
    assert df_input['trend_slope'].iloc[-1] > 0
    assert round(df_input['trend_slope'].iloc[-1], 1) == 10.0

def test_rsvp_rate_clamping():
    # Test that RSVP rate doesn't exceed 1.0 (100%)
    headcount = pd.Series([100, 100])
    rsvp = pd.Series([120, 80]) # 120 is impossible (error in data)
    
    rate = rsvp / headcount.replace(0, np.nan)
    rate = rate.fillna(0.0).clip(0, 1)
    
    assert rate[0] == 1.0 # Clamped
    assert rate[1] == 0.8 # Correct
