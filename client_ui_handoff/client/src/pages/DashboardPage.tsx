import type { User, Page } from '../App'

interface Props { user: User; onNav:(p:Page)=>void }

const GROUPS = [
  { id:1, name:'Youth Alive Fellowship',      cat:'Youth',       leader:'D. Kamau',   members:142, trend:'up',   chg:'+8%',  last:'Apr 20', status:'active'  },
  { id:2, name:'Morning Glory Bible Study',   cat:'Bible Study', leader:'G. Njeri',   members:87,  trend:'down', chg:'−4%',  last:'Apr 19', status:'warning' },
  { id:3, name:'Sanctuary Choir',             cat:'Music',       leader:'S. Waweru',  members:65,  trend:'up',   chg:'+12%', last:'Apr 21', status:'active'  },
  { id:4, name:"Women's Fellowship",          cat:'Fellowship',  leader:'M. Otieno',  members:203, trend:'flat', chg:'+1%',  last:'Apr 18', status:'active'  },
  { id:5, name:'Intercessory Prayer Group',   cat:'Prayer',      leader:'P. Mwangi',  members:48,  trend:'down', chg:'−11%', last:'Apr 17', status:'alert'   },
  { id:6, name:"Men's Brotherhood",           cat:'Fellowship',  leader:'J. Kariuki', members:119, trend:'up',   chg:'+3%',  last:'Apr 20', status:'active'  },
]
const CAT_TAG: Record<string,string> = { Youth:'tag-indigo','Bible Study':'tag-violet',Music:'tag-emerald',Fellowship:'tag-amber',Prayer:'tag-rose' }
const ST_TAG: Record<string,string>  = { active:'tag-emerald',warning:'tag-amber',alert:'tag-rose' }

export function DashboardPage({ user, onNav }: Props) {
  const today = new Date().toLocaleDateString('en-KE',{weekday:'long',month:'long',day:'numeric',year:'numeric'})
  return (
    <div className="anim-up">
      {/* Page header */}
      <div className="page-header">
        <div className="crumb"><span>Home</span><span className="crumb-sep">/</span><span className="crumb-cur">Dashboard</span></div>
        <h1 className="page-title">
          Good day, <span className="title-accent">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="page-sub">{today}</p>
      </div>

      {/* ML alert strip */}
      <div className="notice notice-warn anim-up-1">
        <span className="notice-icon">⚡</span>
        <div className="notice-body">
          <div className="notice-title">SVR Model Alert — Attendance Decline Detected</div>
          <div className="notice-msg">Intercessory Prayer Group shows an 11% attendance drop across 4 consecutive sessions. Model confidence: 94.2%.</div>
          <div className="notice-tip">💡 Pastoral follow-up and member outreach recommended before next session.</div>
        </div>
        <button className="btn btn-glass btn-sm" onClick={()=>onNav('alerts')} style={{flexShrink:0}}>View Alerts</button>
      </div>

      {/* ── BENTO STATS ── */}
      <div className="bento bento-4 mb-4 anim-up-1">
        {[
          { color:'c-indigo',  icon:'◉', val:'664',  label:'Total Members',   delta:'+6.2%', dir:'up'   },
          { color:'c-violet',  icon:'⬡', val:'6',    label:'Active Groups',   delta:'Stable', dir:'flat' },
          { color:'c-rose',    icon:'◈', val:'3',    label:'Active Alerts',   delta:'2 new',  dir:'down' },
          { color:'c-emerald', icon:'⟁', val:'93.7%',label:'SVR Accuracy',    delta:'+1.2%', dir:'up'   },
        ].map((s,i)=>(
          <div key={i} className={`glass stat-glass ${s.color}`}>
            <div className="stat-icon-wrap">{s.icon}</div>
            <div className="stat-num">{s.val}</div>
            <div className="stat-label">{s.label}</div>
            <div className={`stat-delta ${s.dir==='up'?'delta-up':s.dir==='down'?'delta-down':'delta-flat'}`}>
              {s.dir==='up'?'↑':s.dir==='down'?'↓':'→'} {s.delta}
            </div>
          </div>
        ))}
      </div>

      {/* ── BENTO MAIN ── */}
      <div className="bento" style={{gridTemplateColumns:'1fr 300px',gap:14}}>

        {/* Groups table */}
        <div>
          <div className="sec-head">
            <div>
              <div className="sec-title">Ministry Groups</div>
              <div className="sec-sub">All registered groups and ML trend signals</div>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-glass btn-sm">↑ Export</button>
              <button className="btn btn-primary btn-sm">+ Group</button>
            </div>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead>
                <tr>
                  <th>Group</th><th>Category</th><th>Leader</th><th>Members</th><th>Trend</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {GROUPS.map(g=>(
                  <tr key={g.id} className="pointer">
                    <td>
                      <div style={{fontWeight:600,color:'var(--t-hi)',fontSize:'0.82rem'}}>{g.name}</div>
                      <div style={{fontSize:'0.67rem',color:'var(--t-lo)',marginTop:1}}>Last: {g.last}</div>
                    </td>
                    <td><span className={`tag ${CAT_TAG[g.cat]||'tag-ghost'}`}>{g.cat}</span></td>
                    <td style={{fontSize:'0.78rem'}}>{g.leader}</td>
                    <td><span className="mono fw-7" style={{color:'var(--t-hi)',fontSize:'0.85rem'}}>{g.members}</span></td>
                    <td>
                      <span style={{
                        color: g.trend==='up'?'var(--a-emerald)':g.trend==='down'?'var(--a-rose)':'var(--a-amber)',
                        fontWeight:700,fontSize:'0.78rem'
                      }}>
                        {g.trend==='up'?'↑':g.trend==='down'?'↓':'→'} {g.chg}
                      </span>
                    </td>
                    <td><span className={`tag ${ST_TAG[g.status]}`} style={{textTransform:'capitalize'}}>{g.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — bento stack */}
        <div className="flex-col gap-3">

          {/* Quick Actions */}
          <div className="glass p-5">
            <div className="sec-title mb-3">Quick Actions</div>
            <div className="flex-col gap-2">
              <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={()=>onNav('attendance')}>✔ Log Attendance</button>
              <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('feedback')}>◎ Submit Feedback</button>
              {(user.role==='admin'||user.role==='pastor') && (
                <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('forecast')}>⟋ AI Forecast</button>
              )}
              <button className="btn btn-glass w-full" style={{justifyContent:'center'}} onClick={()=>onNav('alerts')}>◈ Manage Alerts</button>
            </div>
          </div>

          {/* Model health */}
          <div className="glass p-5">
            <div className="sec-title mb-3">SVR Model Health</div>
            <div className="flex-col gap-3">
              {GROUPS.slice(0,4).map((g,i)=>{
                const pct = 85+i*3
                return (
                  <div key={g.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{fontSize:'0.72rem',color:'var(--t-mid)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{g.name.split(' ').slice(0,2).join(' ')}</span>
                      <span className="mono" style={{fontSize:'0.72rem',color:'var(--a-emerald)',fontWeight:600}}>{pct}%</span>
                    </div>
                    <div className="prog-track">
                      <div className="prog-fill" style={{width:`${pct}%`,background:'linear-gradient(90deg,var(--a-indigo),var(--a-violet))'}}/>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity feed */}
          <div className="glass p-5">
            <div className="sec-title mb-3">Recent Activity</div>
            <div className="flex-col gap-3">
              {[
                {icon:'✔',text:'Youth attendance logged',time:'2h ago',c:'var(--a-emerald)'},
                {icon:'◈',text:'Alert: Prayer Group decline',time:'5h ago',c:'var(--a-rose)'},
                {icon:'⟋',text:'Choir forecast refreshed',time:'1d ago',c:'var(--a-indigo)'},
                {icon:'◎',text:"Women's feedback submitted",time:'1d ago',c:'var(--a-violet)'},
              ].map((a,i)=>(
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
