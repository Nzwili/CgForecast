import { useState, useEffect } from 'react'
import type { User, Page } from '../App'
import api from '../api/client'

const NAIROBI_LOCATIONS = ['Nairobi CBD','Westlands','Eastlands','Southlands','Northlands','Other Nairobi']
const RECORD_YEARS = ['Less than 1 year','1-2 years','2-5 years','5+ years']
const TECH_STACKS = ['Excel','Google Sheets','WhatsApp logs','Dedicated CMS','Other']

export function SettingsPage({ user, onNav }: { user: User; onNav?: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<'profile' | 'church' | 'notifications' | 'ml' | 'about'>('profile')
  const [retraining, setRetraining] = useState(false)
  const [retrainMsg, setRetrainMsg] = useState('')

  // Notification prefs stored in localStorage
  const [notifAnomalies, setNotifAnomalies] = useState(() => localStorage.getItem('notif_anomalies') !== 'false')
  const [notifWeekly, setNotifWeekly]       = useState(() => localStorage.getItem('notif_weekly')    !== 'false')
  const [notifFeedback, setNotifFeedback]   = useState(() => localStorage.getItem('notif_feedback')  === 'true')
  const [notifSaved, setNotifSaved]         = useState(false)

  // Church profile
  const [churchName, setChurchName]       = useState('')
  const [membership, setMembership]       = useState('')
  const [location, setLocation]           = useState('')
  const [yearsOfRecords, setYearsOfRecords] = useState('')
  const [techStack, setTechStack]         = useState<string[]>([])
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMsg, setProfileMsg]       = useState('')

  useEffect(() => {
    if (activeTab === 'church') {
      api.get('/api/church/profile').then(r => {
        if (r.data) {
          setChurchName(r.data.churchName || '')
          setMembership(String(r.data.activeMembership || ''))
          setLocation(r.data.location || '')
          setYearsOfRecords(r.data.yearsOfRecords || '')
          setTechStack(r.data.techStack ? r.data.techStack.split(',') : [])
        }
      }).catch(() => {})
    }
  }, [activeTab])

  const triggerRetrain = async () => {
    setRetraining(true); setRetrainMsg('')
    try {
      await api.post('/api/admin/retrain')
      setRetrainMsg('✅ SVR retrain triggered! Pipeline is running in the background.')
    } catch (e: any) {
      setRetrainMsg('❌ ' + (e.response?.data?.error || 'Could not reach ML service.'))
    } finally {
      setRetraining(false)
    }
  }

  const saveNotifications = () => {
    localStorage.setItem('notif_anomalies', String(notifAnomalies))
    localStorage.setItem('notif_weekly',    String(notifWeekly))
    localStorage.setItem('notif_feedback',  String(notifFeedback))
    setNotifSaved(true)
    setTimeout(() => setNotifSaved(false), 2000)
  }

  const saveChurchProfile = async () => {
    if (!churchName.trim()) return setProfileMsg('❌ Church name is required.')
    setProfileLoading(true); setProfileMsg('')
    try {
      await api.post('/api/church/profile', {
        churchName,
        activeMembership: membership ? parseInt(membership) : null,
        location,
        yearsOfRecords,
        techStack,
      })
      setProfileMsg('✅ Church profile saved successfully.')
    } catch (e: any) {
      setProfileMsg('❌ ' + (e.response?.data?.error || 'Failed to save profile.'))
    } finally { setProfileLoading(false) }
  }

  const TABS = [
    { id: 'profile',       icon: '👤', label: 'My Profile',      roles: ['admin','pastor'] },
    { id: 'church',        icon: '⛪', label: 'Church Profile',  roles: ['admin'] },
    { id: 'notifications', icon: '🔔', label: 'Notifications',   roles: ['admin','pastor'] },
    { id: 'ml',            icon: '⚙️', label: 'ML Parameters',   roles: ['admin','pastor'] },
    { id: 'about',         icon: '◈',  label: 'About System',    roles: ['admin','pastor'] },
  ].filter(t => t.roles.includes(user.role))

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb">
          <span>System</span><span className="crumb-sep">/</span><span className="crumb-cur">Settings</span>
        </div>
        <h1 className="page-title">
          System <span className="title-accent">Settings</span>
        </h1>
        <p className="page-sub">Manage your account and platform preferences</p>
      </div>

      <div className="bento" style={{ gridTemplateColumns: '220px 1fr', gap: '20px' }}>

        {/* Sidebar Menu */}
        <div className="flex-col gap-2 anim-up-1">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-glass'} w-full`}
              style={{ justifyContent: 'flex-start' }}
              onClick={() => setActiveTab(t.id as any)}
            >
              <span style={{ opacity: 0.8, marginRight: '6px' }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="glass p-6 anim-up-2">

          {/* PROFILE — read-only (no profile endpoint yet) */}
          {activeTab === 'profile' && (
            <div className="flex-col gap-5">
              <div className="sec-head">
                <div>
                  <div className="sec-title">Profile Information</div>
                  <div className="sec-sub">Your account details</div>
                </div>
              </div>
              <div className="divider" style={{ margin: '0 0 10px 0' }} />
              <div className="bento bento-2">
                <label className="field">
                  <span className="field-label">Full Name</span>
                  <input type="text" className="field-input opacity-50" value={user.name} disabled />
                </label>
                <label className="field">
                  <span className="field-label">Email Address</span>
                  <input type="email" className="field-input opacity-50" value={user.email} disabled />
                </label>
              </div>
              <div className="bento bento-2 mt-2">
                <label className="field">
                  <span className="field-label">Role</span>
                  <input type="text" className="field-input opacity-50" value={user.role} disabled />
                </label>
              </div>
              <div className="notice notice-info">
                <span className="notice-icon">ℹ️</span>
                <div className="notice-body">
                  <div className="notice-msg">Profile editing is not available in this research prototype. Contact your system administrator to update your details.</div>
                </div>
              </div>
            </div>
          )}

          {/* CHURCH PROFILE */}
          {activeTab === 'church' && (
            <div className="flex-col gap-5">
              <div className="sec-head">
                <div>
                  <div className="sec-title">Church Profile</div>
                  <div className="sec-sub">Demographic data for the sampled faith organization</div>
                </div>
              </div>
              <div className="divider" style={{ margin: '0 0 10px 0' }} />
              {profileMsg && (
                <div className={`notice ${profileMsg.startsWith('✅') ? 'notice-ok' : 'notice-danger'}`}>
                  <div className="notice-body"><div className="notice-msg">{profileMsg}</div></div>
                </div>
              )}
              <div className="bento bento-2" style={{gap:14}}>
                <div className="field">
                  <label className="field-label">Church Name *</label>
                  <input className="field-input" type="text" placeholder="e.g. Nairobi Chapel" value={churchName} onChange={e=>setChurchName(e.target.value)}/>
                </div>
                <div className="field">
                  <label className="field-label">Approximate Active Membership</label>
                  <input className="field-input" type="number" placeholder="e.g. 250" value={membership} onChange={e=>setMembership(e.target.value)} min="0"/>
                </div>
                <div className="field">
                  <label className="field-label">Primary Location (Nairobi)</label>
                  <select className="field-select" value={location} onChange={e=>setLocation(e.target.value)}>
                    <option value="">Select area…</option>
                    {NAIROBI_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Years of Digital Record-Keeping</label>
                  <select className="field-select" value={yearsOfRecords} onChange={e=>setYearsOfRecords(e.target.value)}>
                    <option value="">Select…</option>
                    {RECORD_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field-label">Current Tech Stack</label>
                <div className="flex gap-3" style={{flexWrap:'wrap',marginTop:6}}>
                  {TECH_STACKS.map(ts => (
                    <label key={ts} className="flex items-center gap-2 pointer" style={{fontSize:'0.8rem',color:'var(--t-mid)'}}>
                      <input type="checkbox" checked={techStack.includes(ts)} onChange={e=>setTechStack(s=>e.target.checked?[...s,ts]:s.filter(x=>x!==ts))} style={{accentColor:'var(--a-indigo)',width:15,height:15}}/>
                      {ts}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="btn btn-success" onClick={saveChurchProfile} disabled={profileLoading}>
                  {profileLoading ? '⏳ Saving…' : 'Save Church Profile'}
                </button>
              </div>
            </div>
          )}

          {/* NOTIFICATION SETTINGS */}
          {activeTab === 'notifications' && (
            <div className="flex-col gap-5">
              <div className="sec-head">
                <div>
                  <div className="sec-title">Notification Preferences</div>
                  <div className="sec-sub">Control how and when you are alerted</div>
                </div>
              </div>
              <div className="divider" style={{ margin: '0 0 10px 0' }} />
              {[
                { label:'ML Anomaly Alerts', desc:'Receive alerts when the SVR model detects a sharp decline.', val:notifAnomalies, set:setNotifAnomalies },
                { label:'Weekly Digest',     desc:'A weekly summary of group attendance and growth trends.',  val:notifWeekly,    set:setNotifWeekly },
                { label:'New Feedback Notifications', desc:'Alert me when critical feedback is submitted.',   val:notifFeedback,  set:setNotifFeedback },
              ].map((p,i) => (
                <div key={i} className="flex items-center justify-between p-4" style={{ background: 'var(--bg-float)', borderRadius: 'var(--r-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--t-hi)' }}>{p.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--t-lo)' }}>{p.desc}</div>
                  </div>
                  <input type="checkbox" checked={p.val} onChange={e=>p.set(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--a-indigo)' }} />
                </div>
              ))}
              <div className="flex gap-3">
                <button className="btn btn-success" onClick={saveNotifications}>
                  {notifSaved ? '✅ Saved' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ML PARAMETERS */}
          {activeTab === 'ml' && (
            <div className="flex-col gap-5">
              <div className="sec-head">
                <div>
                  <div className="sec-title">Model Tuning Parameters</div>
                  <div className="sec-sub">Adjust the sensitivity of the forecasting algorithm</div>
                </div>
                {user.role !== 'admin' && <span className="tag tag-rose">Admin Only</span>}
              </div>
              <div className="divider" style={{ margin: '0 0 10px 0' }} />
              <div className="notice notice-info">
                <span className="notice-icon">ℹ️</span>
                <div className="notice-body">
                  <div className="notice-title">Research Prototype</div>
                  <div className="notice-msg">SVR hyperparameter tuning (C, gamma, epsilon) is handled automatically via GridSearchCV during training. Manual parameter overrides are not exposed in this version. Use Manual Retrain below to force a fresh training cycle.</div>
                </div>
              </div>
              <div>
                <div className="sec-title mb-1">Manual Retrain</div>
                <div className="sec-sub mb-3">Trigger the SVR pipeline immediately with the latest database data.</div>
                {retrainMsg && (
                  <div className={`notice ${retrainMsg.startsWith('✅') ? 'notice-ok' : 'notice-danger'} mb-3`}>
                    <div className="notice-body"><div className="notice-msg">{retrainMsg}</div></div>
                  </div>
                )}
                <button className="btn btn-primary" onClick={triggerRetrain} disabled={retraining}>
                  {retraining ? '⏳ Retraining…' : '⚡ Trigger SVR Retrain Now'}
                </button>
              </div>
            </div>
          )}

          {/* ABOUT SYSTEM */}
          {activeTab === 'about' && (
            <div className="flex-col gap-5">
              <div className="sec-head">
                <div>
                  <div className="sec-title">About This System</div>
                  <div className="sec-sub">Faith Organization Growth Forecasting System — v1.0</div>
                </div>
              </div>
              <div className="divider" style={{ margin: '0 0 10px 0' }} />

              <div className="notice notice-info">
                <span className="notice-icon">⛪</span>
                <div className="notice-body">
                  <div className="notice-title">What is CG Forecast?</div>
                  <div className="notice-msg" style={{lineHeight:1.7}}>
                    <strong>CG Forecast</strong> is an SVR-powered forecasting microservice and research dashboard. It is not a full church management system. Its purpose is to ingest historical attendance data from faith organizations, train a per-group Support Vector Regression model, and generate forward-looking forecasts of population growth trends — displayed through a lightweight pastoral dashboard.
                  </div>
                </div>
              </div>

              <div className="glass p-5" style={{background:'var(--bg-float)'}}>
                <div className="sec-title mb-3">Deliverable</div>
                <div style={{fontSize:'0.82rem',color:'var(--t-mid)',lineHeight:1.7}}>
                  SVR forecasting microservice (Python FastAPI) + React research dashboard. The microservice is independently deployable and attachable to any existing church system via its REST API.
                </div>
              </div>

              <div className="glass p-5" style={{background:'var(--bg-float)'}}>
                <div className="sec-title mb-3">Research Scope</div>
                <div style={{fontSize:'0.82rem',color:'var(--t-mid)',lineHeight:1.7}}>
                  This system is scoped to <strong>evangelical faith organizations (churches) in Nairobi</strong> that already have historical attendance data in digital form (spreadsheets, CSV exports, Google Sheets exports). The target demographic is churches with <strong>100–500 active members</strong>, using a <strong>purposive sample of 5–10 churches</strong>. Churches must have a minimum of <strong>6 months of existing digital attendance records</strong> to generate meaningful SVR forecasts.
                </div>
              </div>

              <div className="glass p-5" style={{background:'var(--bg-float)'}}>
                <div className="sec-title mb-3">Technology Stack</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {[
                    ['Frontend','React 18 + Vite + TypeScript'],
                    ['Styling','CSS Variables + Tailwind'],
                    ['Charts','Recharts'],
                    ['Backend','Node.js + Express 4'],
                    ['ORM','Prisma 5'],
                    ['ML Engine','Python FastAPI + scikit-learn SVR (RBF kernel)'],
                    ['Auth','JWT (7-day expiry)'],
                    ['Email','Nodemailer + Brevo SMTP'],
                  ].map(([k,v],i) => (
                    <div key={i} style={{padding:'8px 12px',background:'var(--bg-elevated)',borderRadius:'var(--r-sm)',border:'1px solid var(--border-glass)'}}>
                      <div style={{fontSize:'0.65rem',color:'var(--t-lo)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:2}}>{k}</div>
                      <div style={{fontSize:'0.78rem',color:'var(--t-hi)',fontWeight:500}}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
