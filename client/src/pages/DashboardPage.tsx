import { useState, useEffect } from 'react'
import type { User, Page } from '../App'
import api from '../api/client'
import { ResponsiveContainer, LineChart, Line } from 'recharts'

interface Props { user: User; onNav:(p:Page)=>void }

const CAT_TAG: Record<string,string> = { Youth:'tag-indigo','Bible Study':'tag-violet',Music:'tag-emerald',Fellowship:'tag-amber',Prayer:'tag-rose' }
const ST_TAG: Record<string,string>  = { active:'tag-emerald',warning:'tag-amber',alert:'tag-rose' }

export function DashboardPage({ user, onNav }: Props) {
  const [groups, setGroups] = useState<any[]>([])
  const [stats, setStats] = useState({ memberCount: '-', groupCount: '-', activeAlerts: '-' })
  const [criticalAlert, setCriticalAlert] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'cards'|'table'>('cards')
  const [accuracy, setAccuracy] = useState<string>('—')
  const [modelHealth, setModelHealth] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => {
    const loadData = () => {
      // Groups
      api.get('/api/groups').then(res => setGroups(res.data)).catch(console.error)

      // Live stats
      api.get('/api/admin/stats').then(res => {
        setStats({
          memberCount: String(res.data.memberCount),
          groupCount:  String(res.data.groupCount),
          activeAlerts:String(res.data.activeAlerts),
          avgSentiment:String(res.data.avgSentiment || '0.0'),
        } as any)
      }).catch(() => {})

      // Most critical alert
      api.get('/api/alerts').then(res => {
        const drop = res.data.find((a:any) => a.alertType === 'drop')
        if (drop) setCriticalAlert(drop)
      }).catch(() => {})

      // SVR accuracy (Admin/Analyst only)
      if (user.role === 'admin' || user.role === 'analyst') {
        api.get('/api/ml/accuracy').then(res => {
          if (res.data.overallMae != null) {
            const mae = res.data.overallMae
            const approxAcc = Math.max(0, Math.min(100, 100 - mae)).toFixed(1)
            setAccuracy(`~${approxAcc}% (MAE ${mae.toFixed(1)})`)
          } else setAccuracy('Training required')
          setModelHealth(res.data.groups || [])
        }).catch(() => setAccuracy('ML offline'))
      }

      // Recent activity
      api.get('/api/admin/recent?limit=4').then(res => {
        setRecentActivity(res.data.map((r: any) => ({
          icon: '✔',
          text: `${r.group?.name || 'Group'} attendance logged — ${r.headcount} present`,
          time: timeAgo(new Date(r.recordedAt)),
          c: 'var(--a-emerald)',
        })))
      }).catch(() => {})
    }

    loadData()
    const interval = setInterval(loadData, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [user.role])

  const today = new Date().toLocaleDateString('en-KE',{weekday:'long',month:'long',day:'numeric',year:'numeric'})

  return (
    <div className="anim-up">
      {/* Page header */}
      <div className="page-header">
        <div className="crumb"><span>Home</span><span className="crumb-sep">/</span><span className="crumb-cur">Dashboard</span></div>
        <h1 className="page-title">Good day, <span className="title-accent">{user.name.split(' ')[0]}</span></h1>
        <p className="page-sub">{today}</p>
      </div>

      {/* ML alert banner */}
      {criticalAlert && (
        <div className="notice notice-warn anim-up-1">
          <span className="notice-icon">⚡</span>
          <div className="notice-body">
            <div className="notice-title">SVR Alert — Attendance Decline Detected</div>
            <div className="notice-msg">{criticalAlert.message}</div>
            <div className="notice-tip">💡 {criticalAlert.recommendation}</div>
          </div>
          <button className="btn btn-glass btn-sm" onClick={()=>onNav('alerts')} style={{flexShrink:0}}>View Alerts</button>
        </div>
      )}

      {/* BENTO STATS */}
      <div className="bento bento-4 mb-4 anim-up-1">
        {[
          { color:'c-indigo',  icon:'◉', val: stats.memberCount, label:'Total Members',   delta:'+6.2%', dir:'up'   },
          { color:'c-violet',  icon:'⬡', val: stats.groupCount,  label:'Active Groups',   delta:'Stable', dir:'flat' },
          { color:'c-rose',    icon:'◈', val: stats.activeAlerts,label:'Active Alerts',   delta:'',  dir:'down' },
          (user.role === 'admin' || user.role === 'analyst') 
            ? { color:'c-emerald', icon:'⟁', val: accuracy, label:'SVR Accuracy', delta:'', dir:'flat' }
            : { color:'c-emerald', icon:'◎', val: (stats as any).avgSentiment || '0.0', label:'Avg Sentiment', delta:'+0.4', dir:'up' },
        ].map((s,i)=>(
          <div key={i} className={`glass stat-glass ${s.color}`}>
            <div className="stat-icon-wrap">{s.icon}</div>
            <div className="stat-num" style={{fontSize: (s.val?.length || 0) > 8 ? '0.85rem' : undefined}}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
            {s.delta && <div className={`stat-delta ${s.dir==='up'?'delta-up':s.dir==='down'?'delta-down':'delta-flat'}`}>
              {s.dir==='up'?'↑':s.dir==='down'?'↓':'→'} {s.delta}
            </div>}
          </div>
        ))}
      </div>

      {/* BENTO MAIN */}
      <div className="bento" style={{gridTemplateColumns:'1fr 300px',gap:14}}>

        {/* Faith groups section */}
        <div>
          <div className="sec-head">
            <div>
              <div className="sec-title">Faith Groups</div>
              <div className="sec-sub">All registered groups and ML trend signals</div>
            </div>
            <div className="flex gap-2">
              <div className="tab-strip" style={{ display: 'inline-flex', padding: 2, background: 'var(--bg-elevated)', borderRadius: 'var(--r-md)' }}>
                <div className={`tab-pill ${viewMode==='cards'?'on':''}`} onClick={()=>setViewMode('cards')} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>◻ Cards</div>
                <div className={`tab-pill ${viewMode==='table'?'on':''}`} onClick={()=>setViewMode('table')} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>≡ Table</div>
              </div>
              <button className="btn btn-glass btn-sm" onClick={() => alert('Exporting dashboard data as PDF...')}>↑ Export</button>
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
              {groups.map((g) => {
                const isUp = g.trend?.startsWith('+') && g.trend !== '+0%'
                const isDown = g.trend?.startsWith('-')
                const sparkData = Array.from({length: 10}).map((_,i) => ({
                  val: 50 + (isUp ? i*2 : isDown ? -i*2 : (Math.random()*4-2)) + Math.random()*5
                }))
                const strokeColor = isUp ? 'var(--a-emerald)' : isDown ? 'var(--a-rose)' : 'var(--a-amber)'
                return (
                  <div key={g.id} className="glass group-card" style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12, transition: 'transform 0.2s, box-shadow 0.2s' }}
                       onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 24px -8px ${strokeColor}`; }}
                       onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                       onClick={() => onNav('attendance')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 600, color: 'var(--t-hi)', fontSize: '0.9rem', lineHeight: 1.2 }}>{g.name}</div>
                      <span className={`tag ${ST_TAG[g.status]}`} style={{textTransform:'capitalize', padding: '2px 6px', fontSize: '0.65rem'}}>{g.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span className="mono fw-7" style={{ fontSize: '1.4rem', color: 'var(--t-hi)' }}>{g.memberCount || 0}</span>
                      <span style={{ color: strokeColor, fontWeight: 700, fontSize: '0.85rem' }}>
                        {isUp ? '↑' : isDown ? '↓' : '→'} {g.trend || '+0%'}
                      </span>
                    </div>
                    <div style={{ height: 40, width: '100%', marginTop: 'auto' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sparkData}>
                          <Line type="monotone" dataKey="val" stroke={strokeColor} strokeWidth={2} dot={false} isAnimationActive={false}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="table-shell">
              <table className="data-tbl">
                <thead><tr><th>Group</th><th>Category</th><th>Leader</th><th>Members</th><th>Trend</th><th>Status</th></tr></thead>
                <tbody>
                  {groups.map(g => {
                    const isUp = g.trend?.startsWith('+') && g.trend !== '+0%'
                    const isDown = g.trend?.startsWith('-')
                    return (
                      <tr key={g.id} className="pointer" onClick={() => onNav('attendance')}>
                        <td><div style={{fontWeight:600,color:'var(--t-hi)',fontSize:'0.82rem'}}>{g.name}</div></td>
                        <td><span className={`tag ${CAT_TAG[g.category]||'tag-ghost'}`}>{g.category}</span></td>
                        <td style={{fontSize:'0.78rem'}}>{g.leader?.name || '—'}</td>
                        <td><span className="mono fw-7" style={{color:'var(--t-hi)',fontSize:'0.85rem'}}>{g.memberCount || 0}</span></td>
                        <td><span style={{color: isUp?'var(--a-emerald)':isDown?'var(--a-rose)':'var(--a-amber)',fontWeight:700,fontSize:'0.78rem'}}>
                          {isUp?'↑':isDown?'↓':'→'} {g.trend || '+0%'}
                        </span></td>
                        <td><span className={`tag ${ST_TAG[g.status]}`} style={{textTransform:'capitalize'}}>{g.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex-col gap-3">
          {/* Quick Actions */}
          <div className="glass p-5">
            <div className="sec-title mb-3">Quick Actions</div>
            <div className="flex-col gap-2">
              <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={()=>onNav('attendance')}>✔ Log Attendance</button>
              <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('feedback')}>◎ Submit Feedback</button>
              {(user.role==='admin'||user.role==='pastor'||user.role==='analyst') && (
                <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('forecast')}>⟋ AI Forecast</button>
              )}
              {(user.role==='admin'||user.role==='analyst') && (
                <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('import')}>⬆ Data Import</button>
              )}
              <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('alerts')}>◈ Manage Alerts</button>
            </div>
          </div>

          {/* SVR Model Health — Admin/Analyst only */}
          {(user.role === 'admin' || user.role === 'analyst') && (
            <div className="glass p-5">
              <div className="sec-title mb-3">SVR Model Health</div>
              <div className="flex-col gap-3">
                {modelHealth.length === 0 ? (
                  <div style={{fontSize:'0.75rem',color:'var(--t-lo)',textAlign:'center',padding:'8px 0'}}>
                    {accuracy === 'ML offline' ? 'ML service offline' : 'No models trained yet. Import data to begin.'}
                  </div>
                ) : modelHealth.slice(0,4).map((m,i) => {
                  const maeScore = m.mae != null ? Math.max(0, Math.min(100, 100 - m.mae)) : null
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{fontSize:'0.72rem',color:'var(--t-mid)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{m.groupName}</span>
                        <span className="mono" style={{fontSize:'0.72rem',color:'var(--a-emerald)',fontWeight:600}}>
                          {maeScore != null ? `MAE ${m.mae.toFixed(1)}` : '—'}
                        </span>
                      </div>
                      <div className="prog-track">
                        <div className="prog-fill" style={{width:`${maeScore ?? 0}%`,background:'linear-gradient(90deg,var(--a-indigo),var(--a-violet))'}}/>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Recent Activity — live from /api/admin/recent */}
          <div className="glass p-5">
            <div className="sec-title mb-3">Recent Activity</div>
            <div className="flex-col gap-3">
              {recentActivity.length === 0 ? (
                <div style={{fontSize:'0.75rem',color:'var(--t-lo)',textAlign:'center',padding:'8px 0'}}>No recent activity yet.</div>
              ) : recentActivity.map((a,i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={{width:30,height:30,borderRadius:'var(--r-sm)',background:'var(--bg-float)',display:'flex',alignItems:'center',justifyContent:'center',color:a.c,fontSize:'0.85rem',flexShrink:0,border:'1px solid var(--border-glass)'}}>
                    {a.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'0.75rem',color:'var(--t-mid)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.text}</div>
                    <div style={{fontSize:'0.65rem',color:'var(--t-lo)',marginTop:1}}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
