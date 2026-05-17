import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'

const DEMO = [
  { id:'1', name:'Rev. Samuel Njoroge',  email:'samuel@church.org',  role:'pastor' },
  { id:'2', name:'Admin Grace Wanjiku',  email:'grace@church.org',   role:'admin'  },
  { id:'3', name:'Analyst Victor Nzwili', email:'victor@church.org',  role:'analyst'},
]
const ROLE_CLS: Record<string,string> = { admin:'role-admin', pastor:'role-pastor', analyst:'role-indigo' }
const initials = (n:string) => n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()

export function LoginPage({ onLogin }: { onLogin:(email:string, pw:string)=>Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'verification'>('login')
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [role, setRole]   = useState('pastor')
  const [church, setChurch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState('')
  const [verified, setVerified] = useState<boolean>(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === 'true') {
      setVerified(true)
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const submitLogin = async () => {
    setLoading(true); setErr('')
    try { await onLogin(email, pw) }
    catch (error: any) {
      setErr(error.response?.data?.message || error.response?.data?.error || 'Invalid credentials.')
      setLoading(false)
    }
  }

  const submitSignup = async () => {
    if (!name || !email || !pw || !role || !church) return setErr('All fields are required.')
    setLoading(true); setErr('')
    try {
      await api.post('/api/auth/register', { name, email, password: pw, role, church })
      setVerified(true)
      setMode('login')
    } catch (error: any) {
      setErr(error.response?.data?.error || 'Failed to register account.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-canvas">
      <div style={{width:'100%',maxWidth:420}}>
        {/* Hero logo */}
        <div className="text-center mb-5">
          <div style={{width:56,height:56,background:'linear-gradient(135deg,var(--a-indigo),var(--a-violet))',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 14px',boxShadow:'0 0 30px var(--a-indigo-glow), 0 0 60px rgba(124,109,240,0.15)',border:'1px solid rgba(255,255,255,0.12)'}}>
            <img src="/logo.png" style={{width: 32, height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)'}} alt="Logo" />
          </div>
          <div style={{fontFamily:'Syne',fontSize:'1.45rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.03em',lineHeight:1}}>
            CG Forecast
          </div>
          <div style={{fontSize:'0.75rem',color:'var(--t-lo)',marginTop:5}}>
            Faith Organization Growth Intelligence · SVR ML
          </div>
        </div>

        <div className="login-card anim-up">
          {verified && (
            <div className="notice notice-ok" style={{marginBottom: 16}}>
              <span className="notice-icon">✅</span>
              <div className="notice-body">
                <div className="notice-title">Account Active!</div>
                <div className="notice-msg">Your account has been created successfully. Sign in below.</div>
              </div>
            </div>
          )}

          {mode === 'login' && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:'Syne',fontSize:'1.1rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.02em'}}>Welcome back</div>
                <div style={{fontSize:'0.78rem',color:'var(--t-lo)',marginTop:3}}>Sign in to access your dashboard</div>
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
                  <input className="field-input" type="email" placeholder="you@church.org" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitLogin()}/>
                </div>
                <div className="field">
                  <label className="field-label">Password</label>
                  <input className="field-input" type="password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitLogin()}/>
                </div>
              </div>

              <button className="btn btn-primary w-full" style={{justifyContent:'center',padding:'11px',fontSize:'0.85rem'}} onClick={submitLogin} disabled={loading}>
                {loading ? '⏳ Signing in…' : 'Sign In →'}
              </button>

              <div style={{textAlign: 'center', marginTop: '16px', fontSize: '0.8rem'}}>
                <span style={{color: 'var(--t-lo)'}}>Don't have an account? </span>
                <span className="pointer" style={{color: 'var(--a-indigo)', fontWeight: 600}} onClick={() => {setMode('signup'); setErr('')}}>Create one</span>
              </div>

              <div className="glow-sep"/>
              <div style={{fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--t-lo)',marginBottom:10}}>
                Demo accounts · click to fill credentials
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
            </>
          )}

          {mode === 'signup' && (
            <>
              <div style={{marginBottom:24}}>
                <div style={{fontFamily:'Syne',fontSize:'1.1rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.02em'}}>Create an Account</div>
                <div style={{fontSize:'0.78rem',color:'var(--t-lo)',marginTop:3}}>Onboard to the faith organization growth platform</div>
              </div>

              {err && (
                <div className="notice notice-danger" style={{marginBottom:16}}>
                  <span className="notice-icon">⚠</span>
                  <div className="notice-body"><div className="notice-msg">{err}</div></div>
                </div>
              )}

              <div className="flex-col gap-3 mb-4">
                <div className="field"><label className="field-label">Full Name</label><input className="field-input" type="text" placeholder="John Doe" value={name} onChange={e=>setName(e.target.value)}/></div>
                <div className="field"><label className="field-label">Email Address</label><input className="field-input" type="email" placeholder="john@church.org" value={email} onChange={e=>setEmail(e.target.value)}/></div>
                <div className="field"><label className="field-label">Password</label><input className="field-input" type="password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)}/></div>
                <div className="flex gap-3">
                  <div className="field flex-1">
                    <label className="field-label">Role</label>
                    <select className="field-select" value={role} onChange={e=>setRole(e.target.value)}>
                      <option value="pastor">Pastor</option>
                      <option value="admin">Administrator</option>
                      <option value="analyst">Data Analyst</option>
                    </select>
                  </div>
                  <div className="field flex-1">
                    <label className="field-label">Church / Campus</label>
                    <input className="field-input" type="text" placeholder="Main Campus" value={church} onChange={e=>setChurch(e.target.value)}/>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary w-full" style={{justifyContent:'center',padding:'11px',fontSize:'0.85rem'}} onClick={submitSignup} disabled={loading}>
                {loading ? '⏳ Creating Account…' : 'Sign Up →'}
              </button>

              <div style={{textAlign: 'center', marginTop: '16px', fontSize: '0.8rem'}}>
                <span style={{color: 'var(--t-lo)'}}>Already have an account? </span>
                <span className="pointer" style={{color: 'var(--a-indigo)', fontWeight: 600}} onClick={() => {setMode('login'); setErr('')}}>Sign In</span>
              </div>
            </>
          )}

          {mode === 'verification' && (
            <div className="text-center">
              <div style={{fontSize: '3rem', marginBottom: '10px'}}>✉️</div>
              <div style={{fontFamily:'Syne',fontSize:'1.1rem',fontWeight:800,color:'var(--t-hi)',letterSpacing:'-0.02em', marginBottom: '10px'}}>Verify Your Email</div>
              <div style={{fontSize:'0.82rem',color:'var(--t-mid)', lineHeight: 1.5, marginBottom: '24px'}}>
                We've sent a verification link to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
              </div>
              <button className="btn btn-primary w-full" style={{justifyContent:'center',padding:'11px',fontSize:'0.85rem'}} onClick={() => { setMode('login'); setErr(''); setPw(''); }}>
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        <div style={{textAlign:'center',marginTop:16,fontSize:'0.65rem',color:'var(--t-lo)'}}>
          Powered by SVR Machine Learning · Faith Organization Growth Forecasting System
        </div>
      </div>
    </div>
  )
}
