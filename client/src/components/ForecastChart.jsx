import {
  ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</p>
      {payload.map(entry => (
        entry.value != null && (
          <p key={entry.dataKey} style={{ color: entry.stroke || entry.fill, fontWeight: 600 }}>
            {entry.name}: {typeof entry.value === 'number' ? Math.round(entry.value) : entry.value}
          </p>
        )
      ))}
    </div>
  );
}

/**
 * ForecastChart
 * @param {Array}  historical - [{date, headcount}]
 * @param {Object} forecast   - {predicted_headcount, confidence_lower, confidence_upper}
 */
export default function ForecastChart({ historical = [], forecast = null }) {
  const historicalData = historical.map(d => ({
    date: new Date(d.sessionDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    actual: d.headcount,
  }));

  const data = forecast
    ? [
        ...historicalData,
        {
          date: 'Forecast ▶',
          predicted:  forecast.predictedHeadcount ?? forecast.predicted_headcount,
          ci_upper:   forecast.confidenceUpper    ?? forecast.confidence_upper,
          ci_lower:   forecast.confidenceLower    ?? forecast.confidence_lower,
        },
      ]
    : historicalData;

  return (
    <div className="chart-container">
      <div className="chart-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        Attendance Trend &amp; Forecast
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Confidence interval band */}
          <Area
            type="monotone"
            dataKey="ci_upper"
            name="CI Upper"
            stroke="none"
            fill="#f59e0b"
            fillOpacity={0.12}
          />
          <Area
            type="monotone"
            dataKey="ci_lower"
            name="CI Lower"
            stroke="none"
            fill="#f59e0b"
            fillOpacity={0.0}
            baseValue="dataMax"
          />

          {/* Historical actual */}
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />

          {/* Forecast point */}
          <Line
            type="monotone"
            dataKey="predicted"
            name="Predicted"
            stroke="#f59e0b"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            dot={{ r: 6, fill: '#f59e0b', strokeWidth: 2, stroke: '#1a2235' }}
          />

          {forecast && (
            <ReferenceLine
              x="Forecast ▶"
              stroke="rgba(99,102,241,0.4)"
              strokeDasharray="4 3"
              label={{ value: 'Horizon', position: 'top', fontSize: 10, fill: 'var(--text-muted)' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#6366f1' }}/>
          Actual attendance
        </div>
        {forecast && (
          <>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#f59e0b' }}/>
              SVR forecast
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ background: '#f59e0b', opacity: 0.3, width: 18, borderRadius: 3, height: 10 }}/>
              95% confidence interval
            </div>
          </>
        )}
      </div>
    </div>
  );
}
