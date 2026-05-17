import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'
import { toast } from 'sonner'

const CFG: Record<string,any> = {
  drop:   {icon:'↘',col:'var(--a-rose)',   bg:'rgba(248,95,124,0.07)',   border:'rgba(248,95,124,0.18)',   label:'Decline'},
  growth: {icon:'↗',col:'var(--a-emerald)',bg:'rgba(16,217,138,0.07)',   border:'rgba(16,217,138,0.18)',   label:'Growth'},
  stable: {icon:'→',col:'var(--a-amber)',  bg:'rgba(248,185,78,0.07)',   border:'rgba(248,185,78,0.18)',   label:'Stable'},
}
const TAG_TYPE: Record<string,string> = { drop:'tag-rose', growth:'tag-emerald', stable:'tag-amber' }

export function AlertsPage({ user:_user, onNav }: {user:User, onNav: (p: any, gid?: number) => void}) {
  const [alerts,setAlerts]  = useState<any[]>([])
  const [filt,setFilt]      = useState<'all'|'active'|'done'>('all')
  const [typef,setTypef]    = useState<'all'|'drop'|'growth'|'stable'>('all')

  useEffect(() => {
    Promise.all([
      api.get('/api/alerts?all=true'),
      api.get('/api/groups')
    ]).then(([alertsRes, groupsRes]) => {
      const groupsMap = groupsRes.data.reduce((acc:any, g:any) => ({...acc, [g.id]: g.name}), {})
      setAlerts(alertsRes.data.map((a:any) => ({
        id: a.id,
        groupId: a.groupId,
        group: groupsMap[a.groupId] || `Group ${a.groupId}`,
        type: a.alertType,
        msg: a.message,
        rec: a.recommendation,
        ack: a.acknowledged,
        sev: a.alertType === 'drop' ? 'critical' : a.alertType === 'growth' ? 'positive' : 'info',
        date: new Date(a.createdAt).toLocaleDateString()
      })))
    }).catch(console.error)
  }, [])

  const ack = async (id:number) => {
    try {
      await api.patch(`/api/alerts/${id}/acknowledge`)
      setAlerts(a=>a.map(x=>x.id===id?{...x,ack:true}:x))
      toast.success('Alert acknowledged')
    } catch (e) {
      toast.error('Failed to acknowledge alert')
    }
  }
  const unacked = alerts.filter(a=>!a.ack).length

  const shown = alerts.filter(a=>{
    if (filt==='active' && a.ack)  return false
    if (filt==='done'  && !a.ack)  return false
    if (typef!=='all'  && a.type!==typef) return false
    return true
  })

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>Dashboard</span><span className="crumb-sep">/</span><span className="crumb-cur">Alerts</span></div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">System <span className="title-accent">Alerts</span></h1>
            <p className="page-sub">ML-generated growth and decline notifications</p>
          </div>
          {unacked>0 && (
            <div style={{background:'var(--a-rose-dim)',border:'1px solid rgba(248,95,124,0.3)',borderRadius:'var(--r-md)',padding:'8px 14px',display:'flex',alignItems:'center',gap:8}}>
              <div style={{width:7,height:7,borderRadius:'50%',background:'var(--a-rose)',boxShadow:'0 0 8px var(--a-rose-glow)'}}/>
              <span style={{fontSize:'0.78rem',fontWeight:700,color:'var(--a-rose)'}}>{unacked} unacknowledged</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 anim-up-1" style={{flexWrap:'wrap'}}>
        <div className="tab-strip">
          {(['all','active','done'] as const).map(f=>(
            <div key={f} className={`tab-pill ${filt===f?'on':''}`} onClick={()=>setFilt(f)} style={{textTransform:'capitalize'}}>
              {f==='done'?'Acknowledged':f==='active'?'Pending':f}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          {([['all','All'],['drop','↘ Decline'],['growth','↗ Growth'],['stable','→ Stable']] as const).map(([v,l])=>(
            <button key={v} className={`btn btn-sm ${typef===v?'btn-primary':'btn-glass'}`} onClick={()=>setTypef(v)}>{l}</button>
          ))}
        </div>
      </div>

      {/* Alert cards */}
      <div className="flex-col gap-3 anim-up-2">
        {shown.length===0 && (
          <div className="glass">
            <div className="empty">
              <div className="empty-icon">◈</div>
              <div className="empty-head">No alerts</div>
              <div className="empty-body" style={{marginBottom: 16}}>No alerts match your filters.</div>
              <button className="btn btn-primary btn-sm" onClick={() => { setFilt('all'); setTypef('all'); }}>Clear filters</button>
            </div>
          </div>
        )}
        {shown.map(a=>{
          const c = CFG[a.type]
          return (
            <div key={a.id} style={{
              display:'flex',alignItems:'flex-start',gap:14,
              padding:'18px 20px',borderRadius:'var(--r-lg)',
              background:c.bg, border:`1px solid ${c.border}`,
              position:'relative',overflow:'hidden',
              opacity:a.ack?0.6:1,
              transition:'opacity 0.2s',
            }}>
              {/* left accent */}
              <div style={{position:'absolute',left:0,top:0,bottom:0,width:2,background:c.col}}/>

              <div style={{fontSize:'1.6rem',flexShrink:0,color:c.col,marginTop:2}}>{c.icon}</div>

              <div style={{flex:1,minWidth:0}}>
                <div className="flex items-center gap-2 mb-2" style={{flexWrap:'wrap'}}>
                  <span style={{fontFamily:'Syne',fontWeight:700,color:'var(--t-hi)',fontSize:'0.88rem'}}>{a.group}</span>
                  <span className={`tag ${TAG_TYPE[a.type]}`}>{c.label}</span>
                  {a.ack && <span className="tag tag-ghost">Acknowledged</span>}
                  {a.sev==='critical' && !a.ack && <span className="tag tag-rose" style={{animation:'shimmer 2s infinite'}}>⚡ Critical</span>}
                </div>
                <div style={{fontSize:'0.8rem',color:'var(--t-mid)',lineHeight:1.6,marginBottom:6}}>{a.msg}</div>
                <div style={{fontSize:'0.73rem',color:'var(--t-lo)'}}>💡 {a.rec}</div>
                <div style={{fontSize:'0.65rem',color:'var(--t-lo)',marginTop:6}}>Generated: {a.date}</div>
              </div>

              <div className="flex-col gap-2" style={{flexShrink:0}}>
                {!a.ack && <button className="btn btn-success btn-sm" onClick={()=>ack(a.id)}>✓ Acknowledge</button>}
                <button className="btn btn-glass btn-sm" onClick={()=>onNav('forecast', a.groupId)}>View Group</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
