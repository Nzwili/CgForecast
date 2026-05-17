import { useState } from 'react'
import type { User } from '../App'

const GROUPS = [
  {id:'1',name:'Youth Alive Fellowship'},{id:'2',name:'Morning Glory Bible Study'},
  {id:'3',name:'Sanctuary Choir'},{id:'4',name:"Women's Fellowship"},
  {id:'5',name:'Intercessory Prayer Group'},{id:'6',name:"Men's Brotherhood"},
]
const LOGS = [
  {group:'Youth Alive Fellowship',   date:'Apr 20',hc:138,rsvp:145,by:'D. Kamau'},
  {group:'Morning Glory Bible Study',date:'Apr 19',hc:72, rsvp:90, by:'G. Njeri'},
  {group:'Sanctuary Choir',          date:'Apr 21',hc:65, rsvp:65, by:'Admin'},
  {group:"Women's Fellowship",       date:'Apr 18',hc:201,rsvp:210,by:'M. Otieno'},
  {group:'Intercessory Prayer Group',date:'Apr 17',hc:41, rsvp:55, by:'D. Kamau'},
]

export function AttendancePage({ user:_user }: {user:User}) {
  const [group,setGroup] = useState('')
  const [date,setDate]   = useState(new Date().toISOString().split('T')[0])
  const [hc,setHc]       = useState('')
  const [rsvp,setRsvp]   = useState('')
  const [tab,setTab]     = useState<'log'|'history'>('log')
  const [ok,setOk]       = useState(false)

  const submit = () => {
    if (!group||!hc) return
    setOk(true); setTimeout(()=>{setOk(false);setHc('');setRsvp('')},3000)
  }

  const rate = hc&&rsvp ? (parseFloat(hc)/parseFloat(rsvp)*100) : 0

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">Attendance</span></div>
        <h1 className="page-title">Attendance <span className="title-accent">Logging</span></h1>
        <p className="page-sub">Record session headcounts and RSVP data to feed the ML pipeline</p>
      </div>

      <div className="tab-strip mb-4 anim-up-1">
        <div className={`tab-pill ${tab==='log'?'on':''}`} onClick={()=>setTab('log')}>✔ Log Session</div>
        <div className={`tab-pill ${tab==='history'?'on':''}`} onClick={()=>setTab('history')}>◻ History</div>
      </div>

      {tab==='log' && (
        <div className="bento" style={{gridTemplateColumns:'1fr 280px',gap:14}}>
          <div className="glass p-6">
            <div className="sec-title mb-4">New Session Entry</div>
            {ok && (
              <div className="notice notice-ok mb-4">
                <span className="notice-icon">✓</span>
                <div className="notice-body">
                  <div className="notice-title">Attendance submitted</div>
                  <div className="notice-msg">Data ingested into the ML pipeline for model retraining.</div>
                </div>
              </div>
            )}
            <div className="flex-col gap-4">
              <div className="field">
                <label className="field-label">Ministry Group *</label>
                <select className="field-select" value={group} onChange={e=>setGroup(e.target.value)}>
                  <option value="">Select group…</option>
                  {GROUPS.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Session Date</label>
                <input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)}/>
              </div>
              <div className="bento bento-2" style={{gap:12}}>
                <div className="field">
                  <label className="field-label">Headcount *</label>
                  <input type="number" className="field-input" placeholder="0" value={hc} onChange={e=>setHc(e.target.value)} min="0"/>
                </div>
                <div className="field">
                  <label className="field-label">RSVP Count</label>
                  <input type="number" className="field-input" placeholder="0" value={rsvp} onChange={e=>setRsvp(e.target.value)} min="0"/>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Session Notes</label>
                <textarea className="field-textarea" rows={3} placeholder="Public holiday, weather, special events…"/>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={submit} disabled={!group||!hc}>✔ Submit</button>
                <button className="btn btn-glass" onClick={()=>{setGroup('');setHc('');setRsvp('')}}>Clear</button>
              </div>
            </div>
          </div>

          <div className="flex-col gap-3">
            {/* Rate preview */}
            <div className="glass p-5">
              <div className="sec-title mb-3">Rate Preview</div>
              {hc&&rsvp ? (
                <>
                  <div style={{fontFamily:'Syne',fontSize:'2.4rem',fontWeight:800,color:rate>80?'var(--a-emerald)':'var(--a-amber)',letterSpacing:'-0.04em',lineHeight:1,marginBottom:6}}>
                    {rate.toFixed(0)}%
                  </div>
                  <div style={{fontSize:'0.75rem',color:'var(--t-lo)',marginBottom:12}}>{hc} of {rsvp} RSVPs attended</div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{width:`${Math.min(rate,100)}%`,background:rate>80?'var(--a-emerald)':'var(--a-amber)'}}/>
                  </div>
                </>
              ) : (
                <div className="empty" style={{padding:'20px 0'}}>
                  <div className="empty-icon">◎</div>
                  <div className="empty-body">Enter headcount + RSVP to preview attendance rate</div>
                </div>
              )}
            </div>

            {/* Pipeline status */}
            <div className="glass p-5">
              <div className="sec-title mb-3">ML Pipeline</div>
              <div className="flex-col gap-3">
                {[
                  {label:'Data Ingestion',       active:true },
                  {label:'Feature Engineering',  active:true },
                  {label:'SVR Model Training',   active:false},
                  {label:'Forecast Generation',  active:false},
                ].map((s,i)=>(
                  <div key={i} className="flex items-center justify-between">
                    <span style={{fontSize:'0.77rem',color:'var(--t-mid)'}}>{s.label}</span>
                    <div className="flex items-center gap-2">
                      <div style={{width:6,height:6,borderRadius:'50%',background:s.active?'var(--a-emerald)':'var(--t-lo)',boxShadow:s.active?'0 0 8px var(--a-emerald-glow)':'none'}}/>
                      <span style={{fontSize:'0.67rem',fontWeight:600,color:s.active?'var(--a-emerald)':'var(--t-lo)'}}>{s.active?'Active':'Idle'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='history' && (
        <div>
          <div className="sec-head">
            <div className="sec-title">Recent Logs</div>
            <button className="btn btn-glass btn-sm">↑ Export CSV</button>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead><tr><th>Group</th><th>Date</th><th>Headcount</th><th>RSVP</th><th>Rate</th><th>Logged By</th></tr></thead>
              <tbody>
                {LOGS.map((l,i)=>{
                  const r = (l.hc/l.rsvp*100)
                  return (
                    <tr key={i}>
                      <td style={{fontWeight:600,color:'var(--t-hi)'}}>{l.group}</td>
                      <td>{l.date}</td>
                      <td><span className="mono fw-7" style={{color:'var(--t-hi)'}}>{l.hc}</span></td>
                      <td><span className="mono">{l.rsvp}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="prog-track" style={{width:48}}>
                            <div className="prog-fill" style={{width:`${r}%`,background:r>80?'var(--a-emerald)':'var(--a-amber)'}}/>
                          </div>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:r>80?'var(--a-emerald)':'var(--a-amber)'}}>{r.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>{l.by}</td>
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
