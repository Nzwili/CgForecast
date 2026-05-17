import { useState } from 'react'
import type { User } from '../App'

const DEMO: User[] = [
  { id:'1', name:'Rev. Samuel Njoroge',  email:'samuel@church.org', role:'pastor' },
  { id:'2', name:'Admin Grace Wanjiku',  email:'grace@church.org',  role:'admin'  },
  { id:'3', name:'Usher Daniel Kamau',   email:'daniel@church.org', role:'usher'  },
  { id:'4', name:'Mary Otieno',          email:'mary@church.org',   role:'member' },
]
const ROLE_CLS: Record<string,string> = { admin:'role-admin', pastor:'role-pastor', usher:'role-usher', member:'role-member' }
const initials = (n:string) => n.split(' ').map(x=>x[0]).join('').slice(0,2)

export function LoginPage({ onLogin }: { onLogin:(u:User)=>void }) {
  const [email,setEmail] = useState('')
  const [pw,setPw]       = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr]     = useState('')

  const submit = () => {
    setLoading(true); setErr('')
    setTimeout(()=>{
      const u = DEMO.find(x=>x.email===email)
      if (u && pw==='demo123') { onLogin(u) }
      else { setErr('Invalid credentials. Click a demo account below.'); setLoading(false) }
    }, 700)
  }

  return (
    <div className="login-canvas">
      <div style={{width:'100%',maxWidth:400}}>

        {/* Hero logo */}
        <div className="text-center mb-5">
          <div style={{
            width:56,height:56,
            background:'linear-gradient(135deg,var(--a-indigo),var(--a-violet))',
            borderRadius:14,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:26,margin:'0 auto 14px',
            boxShadow:'0 0 30px var(--a-indigo-glow), 0 0 60px rgba(124,109,240,0.15)',
            border:'1px solid rgba(255,255,255,0.12)'
          }}>⛪</div>
          <div style={{fontFamily:'Syne',fontSize:'1.45rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.03em',lineHeight:1}}>
            CG Forecast
          </div>
          <div style={{fontSize:'0.75rem',color:'var(--t-lo)',marginTop:5}}>
            Congregational Growth Intelligence
          </div>
        </div>

        <div className="login-card anim-up">
          <div style={{marginBottom:24}}>
            <div style={{fontFamily:'Syne',fontSize:'1.1rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.02em'}}>
              Welcome back
            </div>
            <div style={{fontSize:'0.78rem',color:'var(--t-lo)',marginTop:3}}>
              Sign in to access your dashboard
            </div>
          </div>

          {err && (
            <div className="notice notice-danger" style={{marginBottom:16}}>
              <span className="notice-icon">⚠</span>
              <div className="notice-body"><div className="notice-msg">{err}</div></div>
            </div>
          )}

          <div className="flex-col gap-4 mb-4">
            <div className="field">
              <label className="field-label">Email</label>
              <input className="field-input" type="email" placeholder="you@church.org"
                value={email} onChange={e=>setEmail(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input className="field-input" type="password" placeholder="••••••••"
                value={pw} onChange={e=>setPw(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submit()}/>
            </div>
          </div>

          <button className="btn btn-primary w-full" style={{justifyContent:'center',padding:'11px',fontSize:'0.85rem'}}
            onClick={submit} disabled={loading}>
            {loading ? '⏳ Signing in…' : 'Sign In →'}
          </button>

          <div className="glow-sep"/>

          <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--t-lo)',marginBottom:10}}>
            Demo accounts · password: demo123
          </div>
          <div className="flex-col gap-2">
            {DEMO.map(u=>(
              <div key={u.id} className="user-chip pointer" onClick={()=>{setEmail(u.email);setPw('demo123')}}>
                <div className="avatar" style={{width:26,height:26,fontSize:'0.65rem'}}>{initials(u.name)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="avatar-name" style={{fontSize:'0.75rem'}}>{u.name}</div>
                  <div className="avatar-role">{u.email}</div>
                </div>
                <span className={`role-tag ${ROLE_CLS[u.role]}`} style={{textTransform:'capitalize'}}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{textAlign:'center',marginTop:16,fontSize:'0.65rem',color:'var(--t-lo)'}}>
          Powered by SVR Machine Learning · Antigravity Stack
        </div>
      </div>
    </div>
  )
}
