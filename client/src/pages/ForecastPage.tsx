import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { User } from '../App'
import api from '../api/client'

const CustomTooltip = ({active,payload,label}:any) => {
  if (!active||!payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{label}</div>
      {payload.filter((p:any)=>p.value!=null).map((p:any,i:number)=>(
        <div key={i} className="chart-tip-row">
          <div className="chart-tip-dot" style={{background:p.color}}/>
          <span className="chart-tip-key">{p.name}</span>
          <span className="chart-tip-val">{Math.round(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function ForecastPage({ user:_user, initialGroupId }: {user:User, initialGroupId?: number | null}) {
  const [groups, setGroups] = useState<any[]>([])
  const [gid,setGid] = useState(initialGroupId ? String(initialGroupId) : '')
  const [horizon, setHorizon] = useState<number>(4)
  const [data, setData] = useState<any[]>([])
  const [allForecasts, setAllForecasts] = useState<any[]>([])
  const [noData, setNoData] = useState(false)
  const [modelMeta, setModelMeta] = useState<any>(null)
  const [showMeta, setShowMeta] = useState(false)
  const [accuracyData, setAccuracyData] = useState<any[]>([])

  useEffect(() => {
    api.get('/api/groups').then(res => {
      setGroups(res.data)
      if (initialGroupId) {
        setGid(String(initialGroupId))
      } else if (res.data.length > 0 && !gid) {
        setGid(String(res.data[0].id))
      }
    }).catch(console.error)
    api.get('/api/ml/accuracy').then(res => {
      setAccuracyData(res.data.groups || [])
    }).catch(() => {})
  }, [initialGroupId])

  useEffect(() => {
    if (!gid) return
    setNoData(false)
    api.get(`/api/forecast?group=${gid}&horizon=${horizon}`).then(res => {
      const { forecast, historical } = res.data
      // Update model meta for this group
      const gMeta = accuracyData.find(m => String(m.groupId) === String(gid))
      setModelMeta(gMeta || null)
      
      const chartData = historical.map((h: any) => ({
        date: new Date(h.sessionDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
        actual: h.headcount
      }))

      const lastHist = chartData[chartData.length - 1]
      
      if (forecast) {
        if (lastHist) {
          chartData.push({
            date: lastHist.date + ' (Now)',
            predicted: lastHist.actual,
            lo: lastHist.actual,
            hi: lastHist.actual,
          })
        }
        chartData.push({
          date: new Date(Date.now() + horizon*7*24*60*60*1000).toLocaleDateString(undefined, {month:'short', day:'numeric'}),
          predicted: forecast.predictedHeadcount,
          lo: forecast.confidenceLower,
          hi: forecast.confidenceUpper
        })
      }

      setData(chartData)

      // Build all-groups comparison: fetch forecasts for every group
      Promise.all(
        groups.map(g => api.get(`/api/forecast?group=${g.id}`)
          .then(r => ({ group: g.name, ...r.data.forecast, historical: r.data.historical }))
          .catch(() => null)
        )
      ).then(results => setAllForecasts(results.filter(Boolean)))

    }).catch(err => {
      if (err.response?.status === 404) setNoData(true)
      else console.error(err)
      setData([])
    })
  }, [gid, horizon, accuracyData])

  const grp = groups.find(g=>String(g.id)===String(gid)) || { name: 'Loading...' }
  // Derive modelMeta reactively so it updates when accuracyData arrives after the forecast effect
  const resolvedMeta = accuracyData.find(m => String(m.groupId) === String(gid)) || modelMeta
  const lastActual = data.filter(d=>d.actual!=null).at(-1)?.actual ?? 0
  const lastPred   = data.filter(d=>d.predicted!=null).at(-1)?.predicted ?? 0
  const pct = lastActual > 0 ? ((lastPred-lastActual)/lastActual*100).toFixed(1) : "0"
  const growing = parseFloat(pct)>=0

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">AI Forecast</span></div>
        <h1 className="page-title">Growth <span className="title-accent">Forecast</span></h1>
        <p className="page-sub">SVR machine learning predictions for attendance trends</p>
      </div>

      {/* Control row */}
      <div className="glass p-5 mb-4 anim-up-1">
        <div className="flex items-center gap-5" style={{flexWrap:'wrap'}}>
          <div style={{flex:'1 1 200px'}}>
            <div className="field-label mb-2">Faith Group</div>
            <select className="field-select" value={gid} onChange={e=>setGid(e.target.value)}>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div style={{flex:'1 1 120px'}}>
            <div className="field-label mb-2">Forecast Horizon</div>
            <select className="field-select" value={horizon} onChange={e=>setHorizon(parseInt(e.target.value))}>
              <option value={1}>1 Week</option>
              <option value={4}>4 Weeks</option>
              <option value={8}>8 Weeks</option>
              <option value={12}>12 Weeks</option>
            </select>
          </div>

          <div className="glow-sep" style={{width:'1px',height:52,margin:0,background:'linear-gradient(180deg,transparent,var(--border-glass-hi),transparent)'}}/>

          {[
            {label:'Current',val:String(lastActual),color:'var(--t-hi)'},
            {label:`${horizon}-Week Predicted`,val:String(Math.round(lastPred)),color:growing?'var(--a-emerald)':'var(--a-rose)'},
            {label:'Outlook',val:`${growing?'+':''}${pct}%`,color:growing?'var(--a-emerald)':'var(--a-rose)'},
            ...(_user.role === 'admin' ? [{label:'SVR Accuracy',val: resolvedMeta?.mae != null ? `MAE ${resolvedMeta.mae.toFixed(1)}` : 'Train model',color:'var(--a-indigo)'}] : [])
          ].map((k,i)=>(
            <div key={i} style={{textAlign:'center',minWidth:80}}>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--t-lo)',marginBottom:4}}>{k.label}</div>
              <div style={{fontFamily:'Syne',fontSize:'1.5rem',fontWeight:800,color:k.color,letterSpacing:'-0.03em',lineHeight:1}}>{k.val}</div>
            </div>
          ))}

          {_user.role === 'admin' && (
            <div style={{marginLeft:'auto',display:'flex',gap:8}}>
              <span className="tag tag-indigo">SVR v2</span>
              <span className="tag tag-emerald">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="glass p-6 mb-4 anim-up-2">
        <div className="sec-head mb-4">
          <div>
            <div className="sec-title">{grp.name}</div>
            <div className="sec-sub">Historical attendance vs SVR prediction with 95% confidence band</div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{top:4,right:8,bottom:0,left:-8}}>
            <defs>
              <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--a-emerald)" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="var(--a-emerald)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--a-indigo)" stopOpacity={0.18}/>
                <stop offset="95%" stopColor="var(--a-indigo)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="ciBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--a-indigo)" stopOpacity={0.07}/>
                <stop offset="100%" stopColor="var(--a-indigo)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
            <XAxis dataKey="date" tick={{fill:'var(--t-lo)',fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'var(--t-lo)',fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip content={<CustomTooltip/>}/>
            <ReferenceLine x={data.find(d => String(d.date).includes('(Now)'))?.date} stroke="var(--border-glass-hi)" strokeDasharray="3 3" label={{ position: 'top', value: 'Today', fill: 'var(--t-lo)', fontSize: 10 }} />
            {/* CI band (Amber) */}
            <Area type="monotone" dataKey="hi" stroke="none" fill="rgba(248,185,78,0.15)" name="Upper bound" legendType="none"/>
            <Area type="monotone" dataKey="lo" stroke="none" fill="var(--bg-void)" fillOpacity={1} name="Lower bound" legendType="none"/>
            {/* Actual (Teal) */}
            <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2.5} fill="rgba(16,185,129,0.1)" dot={{fill:'#10b981',r:3,strokeWidth:0}} name="Historical Attendance" connectNulls={false}/>
            {/* Predicted (Orange) */}
            <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" fill="none" dot={{fill:'#f59e0b',r:3,strokeWidth:0}} name="SVR Forecast" connectNulls={false}/>
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-5 mt-3" style={{justifyContent:'center'}}>
          {[
            {col:'#10b981',label:'Historical Attendance',dash:false},
            {col:'#f59e0b', label:'SVR Forecast',dash:true},
            {col:'rgba(248,185,78,0.4)',label:'Confidence Interval',dash:false},
          ].map((l,i)=>(
            <div key={i} className="flex items-center gap-2">
              <div style={{width:22,height:2,background:l.col,borderRadius:1,borderTop:l.dash?`2px dashed ${l.col}`:'none',}}/>
              <span style={{fontSize:'0.7rem',color:'var(--t-lo)'}}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight bento */}
      <div className="bento bento-3 anim-up-3">
        {[
          {icon:growing?'↗':'↘', title:'Trend Direction', body:`The SVR model forecasts a ${growing?'positive growth':'decline'} trajectory for ${grp.name} over 6 weeks.`, color:growing?'var(--a-emerald)':'var(--a-rose)'},
          {icon:'◎', title:'Confidence Interval', body:(() => {
            const lastF = data.filter(d=>d.predicted!=null).at(-1)
            if (lastF?.lo != null && lastF?.hi != null) {
              const range = Math.round(lastF.hi - lastF.lo)
              return `At 95% confidence, predicted attendance is within ±${Math.round(range/2)} members of the point estimate (range: ${Math.round(lastF.lo)}–${Math.round(lastF.hi)}).`
            }
            return 'Run a forecast to see the confidence interval for this group.'
          })(), color:'var(--a-indigo)'},
          {icon:'💡', title:'AI Recommendation', body:growing?'Growth is healthy. Sustain current engagement and consider capacity expansion.':'Initiate outreach immediately. Schedule pastoral follow-ups with lapsed members.', color:'var(--a-amber)'},
        ].map((c,i)=>(
          <div key={i} className="glass p-5">
            <div style={{fontSize:'1.4rem',marginBottom:10,color:c.color}}>{c.icon}</div>
            <div className="sec-title mb-2">{c.title}</div>
            <div style={{fontSize:'0.78rem',color:'var(--t-mid)',lineHeight:1.65}}>{c.body}</div>
          </div>
        ))}
      </div>

      {/* Insufficient data state */}
      {noData && (
        <div className="glass anim-up-3">
          <div className="empty">
            <div className="empty-icon">⟋</div>
            <div className="empty-head">Insufficient Data</div>
            <div className="empty-body">This faith group needs at least 5 attendance records before the SVR model can generate a forecast. Use <strong>Data Import</strong> to load historical data or log sessions on the Attendance page.</div>
          </div>
        </div>
      )}

      {/* Model Details — collapsible */}
      {_user.role === 'admin' && resolvedMeta && (
        <div className="glass p-5 anim-up-3" style={{marginTop:16}}>
          <div className="sec-head" style={{cursor:'pointer'}} onClick={()=>setShowMeta(s=>!s)}>
            <div>
              <div className="sec-title">⚙️ Model Details</div>
              <div className="sec-sub">SVR configuration and training metadata for {grp.name}</div>
            </div>
            <span style={{color:'var(--t-lo)',fontSize:'0.8rem'}}>{showMeta?'▲ Hide':'▼ Show'}</span>
          </div>
          {showMeta && (
            <div className="bento bento-3 mt-3">
              {[
                {label:'Kernel',            val: resolvedMeta.bestParams?.kernel ?? 'RBF'},
                {label:'Best C',            val: resolvedMeta.bestParams?.C ?? '—'},
                {label:'Best γ (gamma)',     val: resolvedMeta.bestParams?.gamma ?? '—'},
                {label:'Best ε (epsilon)',   val: resolvedMeta.bestParams?.epsilon ?? '—'},
                {label:'Training Records',  val: resolvedMeta.trainingRecords ?? '—'},
                {label:'MAE',               val: resolvedMeta.mae != null ? resolvedMeta.mae.toFixed(2) : '—'},
                {label:'RMSE',              val: resolvedMeta.rmse != null ? resolvedMeta.rmse.toFixed(2) : '—'},
                {label:'Trained At',        val: resolvedMeta.trainedAt ? new Date(resolvedMeta.trainedAt).toLocaleString() : '—'},
              ].map((item,i)=>(
                <div key={i} style={{padding:'10px 14px',background:'var(--bg-float)',borderRadius:'var(--r-sm)',border:'1px solid var(--border-glass)'}}>
                  <div style={{fontSize:'0.65rem',color:'var(--t-lo)',marginBottom:4,textTransform:'uppercase',letterSpacing:'0.08em'}}>{item.label}</div>
                  <div className="mono" style={{fontSize:'0.85rem',color:'var(--t-hi)',fontWeight:600}}>{String(item.val)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Groups Comparison table */}
      {allForecasts.length > 0 && (
        <div className="glass p-6 anim-up-3" style={{marginTop:16}}>
          <div className="sec-head mb-4">
            <div>
              <div className="sec-title">All Groups Comparison</div>
              <div className="sec-sub">SVR predicted headcount vs. current — all groups side by side</div>
            </div>
          </div>
          <div className="table-shell" style={{border:'none'}}>
            <table className="data-tbl">
              <thead>
                <tr><th>Group</th><th>Latest Actual</th><th>SVR Predicted</th><th>Change</th><th>Confidence Range</th></tr>
              </thead>
              <tbody>
                {allForecasts.map((f:any, i:number) => {
                  const last = f.historical?.at(-1)?.headcount || 0
                  const pred = Math.round(f.predictedHeadcount || 0)
                  const pct  = last > 0 ? ((pred - last) / last * 100).toFixed(1) : '0'
                  const up   = parseFloat(pct) >= 0
                  return (
                    <tr key={i}>
                      <td style={{fontWeight:600,color:'var(--t-hi)',fontSize:'0.82rem'}}>{f.group}</td>
                      <td><span className="mono">{last}</span></td>
                      <td><span className="mono fw-7">{pred}</span></td>
                      <td>
                        <span style={{color:up?'var(--a-emerald)':'var(--a-rose)',fontWeight:700,fontSize:'0.8rem'}}>
                          {up?'↑':'↓'} {up?'+':''}{pct}%
                        </span>
                      </td>
                      <td style={{fontSize:'0.78rem',color:'var(--t-lo)'}}>
                        {Math.round(f.confidenceLower||0)} – {Math.round(f.confidenceUpper||0)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
