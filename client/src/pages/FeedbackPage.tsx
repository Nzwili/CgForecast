import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'
import { toast } from 'sonner'

const SENT_TAG: Record<string,string> = { Excellent:'tag-emerald','Very Good':'tag-indigo',Good:'tag-amber','Needs Attention':'tag-rose' }

const Star = ({n,val,set}:{n:number,val:number,set:(v:number)=>void}) => (
  <span onClick={()=>set(n)} style={{
    fontSize:'1.55rem',cursor:'pointer',
    color:n<=val?'var(--a-amber)':'rgba(255,255,255,0.12)',
    filter:n<=val?'drop-shadow(0 0 6px rgba(248,185,78,0.5))':'none',
    transition:'all 0.15s',userSelect:'none',
  }}>★</span>
)

export function FeedbackPage({ user:_user }: {user:User}) {
  const [groups, setGroups] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])

  const [group,setGroup]   = useState('')
  const [date,setDate]     = useState(new Date().toISOString().split('T')[0])
  const [rating,setRating] = useState(0)
  const [resp,setResp]     = useState('')
  const [notes,setNotes]   = useState('')
  const [tab,setTab]       = useState<'submit'|'history'>('submit')
  const [err,setErr]       = useState('')

  useEffect(() => {
    api.get('/api/groups').then(res => setGroups(res.data)).catch(console.error)
  }, [])

  const fetchHistory = () => {
    if (tab === 'history' && group) {
      api.get(`/api/feedback/${group}`).then(res => {
        setHistory(res.data.map((f:any) => {
          const r = f.avgRating
          const sentiment = r >= 4.5 ? 'Excellent' : r >= 4 ? 'Very Good' : r >= 3 ? 'Good' : 'Needs Attention'
          return {
            group: groups.find(g=>g.id==group)?.name || 'Unknown',
            date: new Date(f.sessionDate).toLocaleDateString(),
            rating: f.avgRating,
            responses: f.responseCount,
            sentiment
          }
        }))
      }).catch(console.error)
    } else {
      setHistory([])
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [tab, group, groups])

  const submit = async () => {
    if (!group) {
      setErr('Please select a group')
      return
    }
    if (!rating) {
      setErr('Please select a star rating')
      return
    }
    setErr('')
    try {
      await api.post('/api/feedback', { groupId: group, sessionDate: date, avgRating: rating, responseCount: parseInt(resp) || 0 })
      toast.success('Feedback submitted.')
      setRating(0);setResp('');setNotes('')
      // Switch to history to see the new record
      fetchHistory()
      setTab('history')
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Submission failed')
    }
  }

  const ratingLabel = ['','Poor','Fair','Good','Very Good','Outstanding'][rating]||''

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">Feedback</span></div>
        <h1 className="page-title">Session <span className="title-accent">Feedback</span></h1>
        <p className="page-sub">Record aggregated session satisfaction ratings for your faith groups</p>
      </div>

      <div className="tab-strip mb-4 anim-up-1">
        <div className={`tab-pill ${tab==='submit'?'on':''}`} onClick={()=>setTab('submit')}>◎ Submit</div>
        <div className={`tab-pill ${tab==='history'?'on':''}`} onClick={()=>setTab('history')}>◻ History</div>
      </div>

      {tab==='submit' && (
        <div className="bento" style={{gridTemplateColumns:'1fr 260px',gap:14}}>
          <div className="glass p-6">
            <div className="sec-title mb-4">Submit Session Feedback</div>
            
            {err && (
              <div className="notice notice-danger mb-4">
                <span className="notice-icon">⚠</span>
                <div className="notice-body"><div className="notice-msg">{err}</div></div>
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
                <input type="date" className="field-input" value={date} onChange={e=>setDate(e.target.value)}/>
              </div>
              <div className="field">
                <label className="field-label">Average Session Rating *</label>
                <div style={{display:'flex',gap:4,marginTop:4}}>
                  {[1,2,3,4,5].map(n=><Star key={n} n={n} val={rating} set={setRating}/>)}
                  {ratingLabel && <span style={{marginLeft:10,fontSize:'0.78rem',color:'var(--t-lo)',alignSelf:'center'}}>{ratingLabel}</span>}
                </div>
              </div>
              <div className="field">
                <label className="field-label">Number of Respondents</label>
                <input type="number" className="field-input" placeholder="0" value={resp} onChange={e=>setResp(e.target.value)} min="0"/>
              </div>
              <div className="field">
                <label className="field-label">Key Themes / Notes</label>
                <textarea className="field-textarea" rows={4} placeholder="Summarize feedback, themes, improvement areas…" value={notes} onChange={e=>setNotes(e.target.value)}/>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="btn btn-primary" onClick={submit} disabled={!group||!rating}>◎ Submit Feedback</button>
                <button className="btn btn-glass" onClick={()=>{setRating(0);setResp('');setNotes('')}}>Clear</button>
              </div>
            </div>
          </div>

          <div className="flex-col gap-3">
            {/* SVR weight breakdown */}
            <div className="glass p-5">
              <div className="sec-title mb-3">Model Contribution</div>
              <div style={{fontSize:'0.75rem',color:'var(--t-mid)',lineHeight:1.65,marginBottom:14}}>
                Feedback data improves SVR forecast accuracy by combining with attendance metrics.
              </div>
              {[
                {label:'Attendance Data',pct:65,col:'var(--a-indigo)'},
                {label:'Feedback Rating',pct:25,col:'var(--a-violet)'},
                {label:'Engagement Score',pct:10,col:'var(--a-emerald)'},
              ].map((s,i)=>(
                <div key={i} style={{marginBottom:12}}>
                  <div className="flex justify-between mb-2">
                    <span style={{fontSize:'0.72rem',color:'var(--t-lo)'}}>{s.label}</span>
                    <span className="mono" style={{fontSize:'0.72rem',fontWeight:600,color:s.col}}>{s.pct}%</span>
                  </div>
                  <div className="prog-track"><div className="prog-fill" style={{width:`${s.pct}%`,background:s.col}}/></div>
                </div>
              ))}
            </div>

              {/* Top Rated — real data from feedback history */}
              <div className="glass p-5">
                <div className="sec-title mb-3">Top Rated Groups</div>
                <div className="flex-col gap-3">
                  {groups
                    .filter(g => history.some((h:any) => h.group === g.name))
                    .slice(0,3)
                    .map((g, i) => {
                      const latest = history.filter((h:any) => h.group === g.name).slice(-1)[0]
                      if (!latest) return null
                      return (
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:i<2?10:0,borderBottom:i<2?'1px solid var(--border-glass)':'none'}}>
                          <div>
                            <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--t-hi)'}}>{g.name.split(' ').slice(0,2).join(' ')}</div>
                            <div style={{fontSize:'0.65rem',color:'var(--t-lo)'}}>{latest.responses} responses</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span style={{color:'var(--a-amber)'}}>★</span>
                            <span className="mono fw-7" style={{color:'var(--t-hi)',fontSize:'0.85rem'}}>{latest.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )
                    })
                  }
                  {groups.filter(g => history.some((h:any) => h.group === g.name)).length === 0 && (
                    <div style={{fontSize:'0.75rem',color:'var(--t-lo)',textAlign:'center',padding:'8px 0'}}>Submit feedback to see ratings here.</div>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {tab==='history' && (
        <div>
          <div className="sec-head">
            <div className="sec-title">Feedback History {group ? '' : '(Select a group)'}</div>
            <div className="flex gap-2">
              <select className="field-select" style={{width: 200}} value={group} onChange={e=>setGroup(e.target.value)}>
                <option value="">Select group…</option>
                {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button className="btn btn-glass btn-sm" onClick={() => alert('Exporting feedback_data.csv...')}>↑ Export</button>
            </div>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead><tr><th>Group</th><th>Date</th><th>Avg Rating</th><th>Responses</th><th>Sentiment</th><th></th></tr></thead>
              <tbody>
                {history.map((f,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600,color:'var(--t-hi)'}}>{f.group}</td>
                    <td>{f.date}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{color:'var(--a-amber)'}}>★</span>
                        <span className="mono fw-7" style={{color:'var(--t-hi)'}}>{f.rating.toFixed(1)}</span>
                        <span style={{fontSize:'0.67rem',color:'var(--t-lo)'}}>/5</span>
                      </div>
                    </td>
                    <td><span className="mono">{f.responses}</span></td>
                    <td><span className={`tag ${SENT_TAG[f.sentiment]}`}>{f.sentiment}</span></td>
                    <td><button className="btn btn-ghost btn-xs" onClick={() => alert('Showing detailed feedback themes...')}>View →</button></td>
                  </tr>
                ))}
                {history.length === 0 && (
                   <tr><td colSpan={6} style={{textAlign:'center', padding:20, color:'var(--t-lo)'}}>No feedback found or select a group</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
