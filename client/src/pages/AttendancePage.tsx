import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'
import { toast } from 'sonner'

export function AttendancePage({ user:_user }: {user:User}) {
  const [groups, setGroups] = useState<any[]>([])
  const [logs, setLogs]     = useState<any[]>([])
  const [group, setGroup]   = useState('')
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0])
  const [hc, setHc]         = useState('')
  const [rsvp, setRsvp]     = useState('')
  const [tab, setTab]       = useState<'log'|'history'>('log')
  const [warn, setWarn]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showOverwriteModal, setShowOverwriteModal] = useState(false)

  useEffect(() => {
    api.get('/api/groups').then(res => setGroups(res.data)).catch(console.error)
  }, [])

  const fetchHistory = () => {
    if (group) {
      api.get(`/api/attendance/${group}`).then(res => setLogs(res.data)).catch(console.error)
    }
  }

  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab, group])

  const rate = hc && rsvp ? (parseFloat(hc) / parseFloat(rsvp) * 100) : 0

  // Warn if headcount > RSVP
  useEffect(() => {
    if (hc && rsvp && parseFloat(hc) > parseFloat(rsvp)) {
      setWarn('Headcount exceeds RSVP count — confirm this is correct before submitting.')
    } else {
      setWarn('')
    }
  }, [hc, rsvp])

  const submit = async (overwrite: boolean = false) => {
    if (!group || !hc) return
    setSubmitting(true);
    setShowOverwriteModal(false);
    try {
      await api.post('/api/attendance', {
        groupId: group, sessionDate: date,
        headcount: parseInt(hc), rsvpCount: parseInt(rsvp) || 0,
        overwrite
      })
      toast.success('Attendance logged')
      setHc(''); setRsvp('')
      // Auto-switch to history and refresh
      fetchHistory()
      setTab('history')
    } catch (e: any) {
      if (e.response?.data?.error?.includes('Duplicate')) {
        setShowOverwriteModal(true)
      } else {
        toast.error(e.response?.data?.error || 'Submission failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Real CSV export
  const exportCSV = () => {
    if (!logs.length) return
    const header = 'Date,Headcount,RSVP Count,Attendance Rate %'
    const rows = logs.map(l => {
      const r = l.rsvpCount ? (l.headcount / l.rsvpCount * 100).toFixed(1) : '0'
      const d = new Date(l.sessionDate).toLocaleDateString()
      return `${d},${l.headcount},${l.rsvpCount || 0},${r}`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const grpName = groups.find(g => String(g.id) === String(group))?.name || 'group'
    a.href = url; a.download = `attendance_${grpName.replace(/\s+/g,'_')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">Attendance</span></div>
        <h1 className="page-title">Attendance <span className="title-accent">Logging</span></h1>
        <p className="page-sub">For recording sessions going forward, after your historical data has been imported via Data Import</p>
      </div>

      <div className="tab-strip mb-4 anim-up-1">
        <div className={`tab-pill ${tab==='log'?'on':''}`} onClick={()=>setTab('log')}>✔ Log New Session</div>
        <div className={`tab-pill ${tab==='history'?'on':''}`} onClick={()=>setTab('history')}>◻ History</div>
      </div>

      {tab==='log' && (
        <div className="bento" style={{gridTemplateColumns:'1fr 280px',gap:14}}>
          <div className="glass p-6">
            <div className="sec-title mb-4">New Session Entry</div>

            {/* Import reminder for new users */}
            <div className="notice notice-info mb-4" style={{fontSize:'0.78rem'}}>
              <span className="notice-icon">💡</span>
              <div className="notice-body">
                <div className="notice-msg">New to the system? Start by importing your existing records via <strong>Data Import</strong> before logging new sessions.</div>
              </div>
            </div>

            {warn && (
              <div className="notice notice-warn mb-4">
                <span className="notice-icon">!</span>
                <div className="notice-body"><div className="notice-msg">{warn}</div></div>
              </div>
            )}
            
            {showOverwriteModal && (
              <div className="modal-backdrop" style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100}}>
                <div className="glass p-6" style={{width: 400, background: 'var(--bg-mid)'}}>
                  <div className="sec-title mb-2 text-rose-500">⚠ Record Already Exists</div>
                  <p className="mb-4 text-sm text-gray-300">A record for this group and date already exists. Do you want to overwrite it?</p>
                  <div className="flex gap-2">
                    <button className="btn btn-primary bg-rose-600 hover:bg-rose-700" onClick={() => submit(true)} disabled={submitting}>Yes, Overwrite</button>
                    <button className="btn btn-glass" onClick={() => setShowOverwriteModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-col gap-4">
              <div className="field">
                <label className="field-label">Faith Group *</label>
                <select className="field-select" value={group} onChange={e=>setGroup(e.target.value)}>
                  <option value="">Select group…</option>
                  {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Session Date</label>
                <input type="date" className="field-input" value={date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e=>setDate(e.target.value)}/>
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
                <button className="btn btn-primary" onClick={() => submit(false)} disabled={!group||!hc||submitting}>
                  {submitting ? '⏳ Submitting…' : '✔ Submit'}
                </button>
                <button className="btn btn-glass" onClick={()=>{setGroup('');setHc('');setRsvp('');setWarn('');setShowOverwriteModal(false)}}>Clear</button>
              </div>
            </div>
          </div>

          <div className="flex-col gap-3">
            {/* Rate preview */}
            <div className="glass p-5">
              <div className="sec-title mb-3">Attendance Rate Preview</div>
              {hc && rsvp ? (
                <>
                  <div style={{fontFamily:'Syne',fontSize:'2.8rem',fontWeight:800,
                    color:rate>=80?'var(--a-emerald)':rate>=60?'var(--a-amber)':'var(--a-rose)',
                    letterSpacing:'-0.04em',lineHeight:1,marginBottom:6}}>
                    {rate.toFixed(1)}%
                  </div>
                  <div style={{fontSize:'0.75rem',color:'var(--t-lo)',marginBottom:12}}>
                    {hc} of {rsvp} RSVPs attended
                  </div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{
                      width:`${Math.min(rate,100)}%`,
                      background:rate>=80?'var(--a-emerald)':rate>=60?'var(--a-amber)':'var(--a-rose)'
                    }}/>
                  </div>
                  <div style={{fontSize:'0.7rem',color:'var(--t-lo)',marginTop:8}}>
                    {rate>=80 ? '✅ Strong turnout' : rate>=60 ? '⚠ Below average' : '🔴 Critical — follow-up needed'}
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
            <div className="sec-title">Session History {group ? '' : '(Select a group)'}</div>
            <div className="flex gap-2">
              <select className="field-select" style={{width: 220}} value={group} onChange={e=>setGroup(e.target.value)}>
                <option value="">Select group…</option>
                {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button className="btn btn-glass btn-sm" onClick={exportCSV} disabled={!logs.length}>
                ↑ Export CSV
              </button>
            </div>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead><tr><th>Date</th><th>Headcount</th><th>RSVP</th><th>Rate</th></tr></thead>
              <tbody>
                {logs.slice().reverse().map((l,i)=>{
                  const r = l.rsvpCount ? (l.headcount/l.rsvpCount*100) : 0
                  return (
                    <tr key={i} style={{borderLeft: r < 60 ? '3px solid var(--a-rose)' : undefined}}>
                      <td>{new Date(l.sessionDate).toLocaleDateString()}</td>
                      <td><span className="mono fw-7" style={{color:'var(--t-hi)'}}>{l.headcount}</span></td>
                      <td><span className="mono">{l.rsvpCount || '—'}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="prog-track" style={{width:48}}>
                            <div className="prog-fill" style={{width:`${r}%`,background:r>=80?'var(--a-emerald)':r>=60?'var(--a-amber)':'var(--a-rose)'}}/>
                          </div>
                          <span style={{fontSize:'0.75rem',fontWeight:700,color:r>=80?'var(--a-emerald)':r>=60?'var(--a-amber)':'var(--a-rose)'}}>{l.rsvpCount ? r.toFixed(0)+'%' : '—'}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {logs.length === 0 && (
                  <tr><td colSpan={4} style={{textAlign:'center', padding:24, color:'var(--t-lo)'}}>
                    {group ? 'No records found for this group.' : 'Select a group to view history.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
