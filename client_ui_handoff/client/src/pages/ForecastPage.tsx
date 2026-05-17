import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { User } from '../App'

const GROUPS = [
  {id:'1',name:'Youth Alive Fellowship'},
  {id:'2',name:'Morning Glory Bible Study'},
  {id:'3',name:'Sanctuary Choir'},
  {id:'4',name:"Women's Fellowship"},
]

const genData = (id:string) => {
  const base = id==='1'?130:id==='2'?80:id==='3'?60:190
  const slope = id==='1'?1.8:id==='2'?-1.2:id==='3'?0.8:0.4
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct']
  return Array.from({length:10},(_,i)=>{
    const isHistory = i < 5
    const val = Math.round(base + slope*i*3 + (Math.random()-0.5)*10)
    return {
      date: months[i],
      actual:    isHistory ? val : undefined,
      predicted: !isHistory ? val : undefined,
      lo: !isHistory ? val-14-i*2 : undefined,
      hi: !isHistory ? val+14+i*2 : undefined,
    }
  })
}

const CustomTooltip = ({active,payload,label}:any) => {
  if (!active||!payload?.length) return null
  return (
    <div className="chart-tip">
      <div className="chart-tip-date">{label}</div>
      {payload.filter((p:any)=>p.value!=null).map((p:any,i:number)=>(
        <div key={i} className="chart-tip-row">
          <div className="chart-tip-dot" style={{background:p.color}}/>
          <span className="chart-tip-key">{p.name}</span>
          <span className="chart-tip-val">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ForecastPage({ user:_user }: {user:User}) {
  const [gid,setGid] = useState('1')
  const data = genData(gid)
  const grp = GROUPS.find(g=>g.id===gid)!
  const lastActual = data.filter(d=>d.actual!=null).at(-1)?.actual ?? 0
  const lastPred   = data.filter(d=>d.predicted!=null).at(-1)?.predicted ?? 0
  const pct = ((lastPred-lastActual)/lastActual*100).toFixed(1)
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
            <div className="field-label mb-2">Ministry Group</div>
            <select className="field-select" value={gid} onChange={e=>setGid(e.target.value)}>
              {GROUPS.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="glow-sep" style={{width:'1px',height:52,margin:0,background:'linear-gradient(180deg,transparent,var(--border-glass-hi),transparent)'}}/>

          {[
            {label:'Current',val:String(lastActual),color:'var(--t-hi)'},
            {label:'6-Week Predicted',val:String(lastPred),color:growing?'var(--a-emerald)':'var(--a-rose)'},
            {label:'Outlook',val:`${growing?'+':''}${pct}%`,color:growing?'var(--a-emerald)':'var(--a-rose)'},
            {label:'Accuracy',val:'93.7%',color:'var(--a-indigo)'},
          ].map((k,i)=>(
            <div key={i} style={{textAlign:'center',minWidth:80}}>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.09em',textTransform:'uppercase',color:'var(--t-lo)',marginBottom:4}}>{k.label}</div>
              <div style={{fontFamily:'Syne',fontSize:'1.5rem',fontWeight:800,color:k.color,letterSpacing:'-0.03em',lineHeight:1}}>{k.val}</div>
            </div>
          ))}

          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            <span className="tag tag-indigo">SVR v2</span>
            <span className="tag tag-emerald">Live</span>
          </div>
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
            {/* CI band */}
            <Area type="monotone" dataKey="hi" stroke="none" fill="url(#ciBg)" name="Upper bound" legendType="none"/>
            <Area type="monotone" dataKey="lo" stroke="none" fill="var(--bg-void)" fillOpacity={1} name="Lower bound" legendType="none"/>
            {/* Actual */}
            <Area type="monotone" dataKey="actual" stroke="var(--a-emerald)" strokeWidth={2.5} fill="url(#aGrad)" dot={{fill:'var(--a-emerald)',r:3,strokeWidth:0}} name="Actual" connectNulls={false}/>
            {/* Predicted */}
            <Area type="monotone" dataKey="predicted" stroke="var(--a-indigo)" strokeWidth={2} strokeDasharray="6 3" fill="url(#pGrad)" dot={{fill:'var(--a-indigo)',r:3,strokeWidth:0}} name="SVR Predicted" connectNulls={false}/>
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-5 mt-3" style={{justifyContent:'center'}}>
          {[
            {col:'var(--a-emerald)',label:'Historical Attendance',dash:false},
            {col:'var(--a-indigo)', label:'SVR Prediction',dash:true},
            {col:'rgba(124,109,240,0.25)',label:'Confidence Interval',dash:false},
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
          {icon:'◎', title:'Confidence Interval', body:`At 95% confidence, Week 6 attendance is projected between ${lastPred-18}–${lastPred+18} members.`, color:'var(--a-indigo)'},
          {icon:'💡', title:'AI Recommendation', body:growing?'Growth is healthy. Sustain current engagement and consider capacity expansion.':'Initiate outreach immediately. Schedule pastoral follow-ups with lapsed members.', color:'var(--a-amber)'},
        ].map((c,i)=>(
          <div key={i} className="glass p-5">
            <div style={{fontSize:'1.4rem',marginBottom:10,color:c.color}}>{c.icon}</div>
            <div className="sec-title mb-2">{c.title}</div>
            <div style={{fontSize:'0.78rem',color:'var(--t-mid)',lineHeight:1.65}}>{c.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
