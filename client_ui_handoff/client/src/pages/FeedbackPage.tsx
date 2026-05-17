import { useState } from 'react'
import type { User } from '../App'

const GROUPS = [
  {id:'1',name:'Youth Alive Fellowship'},{id:'2',name:'Morning Glory Bible Study'},
  {id:'3',name:'Sanctuary Choir'},{id:'4',name:"Women's Fellowship"},
  {id:'5',name:'Intercessory Prayer Group'},{id:'6',name:"Men's Brotherhood"},
]
const HISTORY = [
  {group:"Women's Fellowship",        date:'Apr 18',rating:4.7,responses:48,sentiment:'Excellent'},
  {group:'Youth Alive Fellowship',    date:'Apr 20',rating:4.4,responses:62,sentiment:'Very Good'},
  {group:'Sanctuary Choir',           date:'Apr 21',rating:4.8,responses:30,sentiment:'Excellent'},
  {group:'Morning Glory Bible Study', date:'Apr 19',rating:3.9,responses:22,sentiment:'Good'},
  {group:'Intercessory Prayer Group', date:'Apr 17',rating:3.2,responses:18,sentiment:'Needs Attention'},
]
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
  const [group,setGroup]   = useState('')
  const [date,setDate]     = useState(new Date().toISOString().split('T')[0])
  const [rating,setRating] = useState(0)
  const [resp,setResp]     = useState('')
  const [notes,setNotes]   = useState('')
  const [tab,setTab]       = useState<'submit'|'history'>('submit')
  const [ok,setOk]         = useState(false)

  const submit = () => {
    if (!group||!rating) return
    setOk(true); setTimeout(()=>{setOk(false);setRating(0);setResp('');setNotes('')},3000)
  }

  const ratingLabel = ['','Poor','Fair','Good','Very Good','Outstanding'][rating]||''

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">Feedback</span></div>
        <h1 className="page-title">Session <span className="title-accent">Feedback</span></h1>
        <p className="page-sub">Log qualitative feedback to enhance SVR model accuracy by up to 18%</p>
      </div>

      <div className="tab-strip mb-4 anim-up-1">
        <div className={`tab-pill ${tab==='submit'?'on':''}`} onClick={()=>setTab('submit')}>◎ Submit</div>
        <div className={`tab-pill ${tab==='history'?'on':''}`} onClick={()=>setTab('history')}>◻ History</div>
      </div>

      {tab==='submit' && (
        <div className="bento" style={{gridTemplateColumns:'1fr 260px',gap:14}}>
          <div className="glass p-6">
            <div className="sec-title mb-4">Submit Session Feedback</div>
            {ok && (
              <div className="notice notice-ok mb-4">
                <span className="notice-icon">✓</span>
                <div className="notice-body">
                  <div className="notice-title">Feedback submitted</div>
                  <div className="notice-msg">Rating data added to the qualitative analysis pipeline.</div>
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

            {/* Top rated */}
            <div className="glass p-5">
              <div className="sec-title mb-3">Top Rated</div>
              <div className="flex-col gap-3">
                {HISTORY.slice(0,3).map((f,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:i<2?10:0,borderBottom:i<2?'1px solid var(--border-glass)':'none'}}>
                    <div>
                      <div style={{fontSize:'0.75rem',fontWeight:600,color:'var(--t-hi)'}}>{f.group.split(' ').slice(0,2).join(' ')}</div>
                      <div style={{fontSize:'0.65rem',color:'var(--t-lo)'}}>{f.responses} responses</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span style={{color:'var(--a-amber)'}}>★</span>
                      <span className="mono fw-7" style={{color:'var(--t-hi)',fontSize:'0.85rem'}}>{f.rating}</span>
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
            <div className="sec-title">Feedback History</div>
            <button className="btn btn-glass btn-sm">↑ Export</button>
          </div>
          <div className="table-shell">
            <table className="data-tbl">
              <thead><tr><th>Group</th><th>Date</th><th>Avg Rating</th><th>Responses</th><th>Sentiment</th><th></th></tr></thead>
              <tbody>
                {HISTORY.map((f,i)=>(
                  <tr key={i}>
                    <td style={{fontWeight:600,color:'var(--t-hi)'}}>{f.group}</td>
                    <td>{f.date}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{color:'var(--a-amber)'}}>★</span>
                        <span className="mono fw-7" style={{color:'var(--t-hi)'}}>{f.rating}</span>
                        <span style={{fontSize:'0.67rem',color:'var(--t-lo)'}}>/5</span>
                      </div>
                    </td>
                    <td><span className="mono">{f.responses}</span></td>
                    <td><span className={`tag ${SENT_TAG[f.sentiment]}`}>{f.sentiment}</span></td>
                    <td><button className="btn btn-ghost btn-xs">View →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
