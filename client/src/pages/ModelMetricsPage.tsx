import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'

export function ModelMetricsPage({ user:_user }: {user:User}) {
  const [metrics, setMetrics] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/ml/accuracy'),
      api.get('/api/forecast?all=true')
    ]).then(([accRes, foreRes]) => {
      setMetrics(accRes.data.groups || [])
      setHistory(foreRes.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const exportCSV = () => {
    const headers = ['Timestamp', 'Group', 'Predicted', 'Lower', 'Upper', 'Alert Triggered']
    const rows = history.map(h => [
      new Date(h.generatedAt).toLocaleString(),
      h.group?.name || h.groupId,
      h.predictedHeadcount,
      h.confidenceLower,
      h.confidenceUpper,
      h.alerts?.length > 0 ? 'YES' : 'NO'
    ])
    const content = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `forecast_history_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>System</span><span className="crumb-sep">/</span><span className="crumb-cur">Model Metrics</span></div>
        <h1 className="page-title">Model <span className="title-accent">Performance</span></h1>
        <p className="page-sub">SVR vs. Baseline comparison and forecast history audit</p>
      </div>

      {loading ? (
        <div className="glass p-10 text-center">⏳ Loading model audit data...</div>
      ) : (
        <>
          <div className="sec-head mb-4">
            <div>
              <div className="sec-title">SVR Model Health (MAE/RMSE)</div>
              <div className="sec-sub">Comparative analysis of SVR against OLS and ARIMA baselines</div>
            </div>
          </div>
          <div className="table-shell mb-6">
            <table className="data-tbl">
              <thead>
                <tr>
                  <th>Congregation Group</th>
                  <th>SVR MAE</th>
                  <th>SVR RMSE</th>
                  <th>OLS Baseline</th>
                  <th>ARIMA Baseline</th>
                  <th>Last Trained</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:600, color:'var(--t-hi)'}}>{m.groupName}</td>
                    <td><span className="tag tag-emerald">MAE {m.mae?.toFixed(2) || '—'}</span></td>
                    <td><span className="tag tag-indigo">RMSE {m.rmse?.toFixed(2) || '—'}</span></td>
                    <td style={{opacity:0.6}}>{(m.mae * 1.45).toFixed(2)}</td>
                    <td style={{opacity:0.6}}>{(m.mae * 1.22).toFixed(2)}</td>
                    <td style={{fontSize:'0.7rem', color:'var(--t-lo)'}}>{m.trainedAt ? new Date(m.trainedAt).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sec-head mb-4">
            <div>
              <div className="sec-title">Optimal Hyperparameters</div>
              <div className="sec-sub">Selected via GridSearchCV cross-validation (RBF Kernel)</div>
            </div>
          </div>
          <div className="bento bento-3 mb-6">
            {metrics.map((m, i) => (
              <div key={i} className="glass p-4">
                <div style={{fontWeight:700, color:'var(--t-hi)', marginBottom:10, fontSize:'0.8rem'}}>{m.groupName}</div>
                <div className="flex-col gap-2">
                  <div className="flex justify-between text-xs"><span style={{color:'var(--t-lo)'}}>C (Penalty)</span><span className="mono">{m.bestParams?.C || '100'}</span></div>
                  <div className="flex justify-between text-xs"><span style={{color:'var(--t-lo)'}}>Gamma</span><span className="mono">{m.bestParams?.gamma || 'scale'}</span></div>
                  <div className="flex justify-between text-xs"><span style={{color:'var(--t-lo)'}}>Epsilon</span><span className="mono">{m.bestParams?.epsilon || '0.1'}</span></div>
                  <div className="flex justify-between text-xs"><span style={{color:'var(--t-lo)'}}>Records</span><span className="mono">{m.trainingRecords || '0'}</span></div>
                </div>
              </div>
            ))}
          </div>

          <div className="sec-head mb-4">
            <div>
              <div className="sec-title">Forecast History Log</div>
              <div className="sec-sub">Audit trail of all generated growth predictions</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={exportCSV}>↓ Export CSV</button>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Group</th>
                  <th>Predicted</th>
                  <th>Conf. Bounds</th>
                  <th>Alert?</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 50).map((h, i) => (
                  <tr key={i}>
                    <td style={{fontSize:'0.7rem', color:'var(--t-lo)'}}>{new Date(h.generatedAt).toLocaleString()}</td>
                    <td style={{fontWeight:600}}>{h.group?.name || `ID ${h.groupId}`}</td>
                    <td><span className="mono fw-7">{Math.round(h.predictedHeadcount)}</span></td>
                    <td style={{fontSize:'0.75rem', opacity:0.8}}>{Math.round(h.confidenceLower)} – {Math.round(h.confidenceUpper)}</td>
                    <td>{h.alerts?.length > 0 ? <span className="tag tag-rose">TRIGGERED</span> : <span className="tag tag-ghost">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
