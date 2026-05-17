import { useState, useEffect } from 'react'
import type { User, Page } from '../App'
import api from '../api/client'

interface Props { user: User; page: Page; onNav: (p: Page) => void; onLogout: () => void; theme?: 'dark' | 'light'; toggleTheme?: () => void }

const NAV = [
  { id: 'dashboard'  as Page, icon: '▦',  label: 'Dashboard',    roles: ['admin','pastor','analyst'] },
  { id: 'attendance' as Page, icon: '✔',  label: 'Attendance',   roles: ['admin','pastor','analyst'] },
  { id: 'feedback'   as Page, icon: '◎',  label: 'Feedback',     roles: ['admin','pastor','analyst'] },
  { id: 'forecast'   as Page, icon: '⟋',  label: 'AI Forecast',  roles: ['admin','pastor','analyst'] },
  { id: 'metrics'    as Page, icon: '⚙️', label: 'Model Metrics', roles: ['admin','analyst'] },
  { id: 'alerts'     as Page, icon: '◈',  label: 'Alerts',       roles: ['admin','pastor','analyst'] },
  { id: 'import'     as Page, icon: '⬆',  label: 'Data Import',  roles: ['admin'] },
  { id: 'users'      as Page, icon: '👥', label: 'Users',        roles: ['admin'] },
]

const ROLE_CLASS: Record<string,string> = { admin:'role-admin', pastor:'role-pastor', analyst:'role-indigo' }
const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

export function Navbar({ user, page, onNav, onLogout, theme, toggleTheme }: Props) {
  const items = NAV.filter(i => i.roles.includes(user.role))
  const [alertCount, setAlertCount] = useState<number>(0)

  useEffect(() => {
    if (['admin', 'pastor', 'analyst'].includes(user.role)) {
      api.get('/api/alerts?status=active').then(res => setAlertCount(res.data.length)).catch(() => {})
    }
  }, [user.role, page])

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <div className="brand-icon" style={{background: 'transparent', boxShadow: 'none', border: 'none'}}>
            <img src="/logo.png" style={{width: 24, height: 24, objectFit: 'contain'}} alt="Logo" />
          </div>
          <div className="brand-text">
            <div className="brand-name">CG Forecast</div>
            <div className="brand-sub">Faith Organization Growth Intelligence</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Main</div>
        {items.filter(i => ['dashboard','attendance','feedback'].includes(i.id)).map(i => (
          <div key={i.id} className={`nav-link ${page===i.id?'active':''}`} onClick={()=>onNav(i.id)}>
            <span className="nav-icon">{i.icon}</span>
            {i.label}
          </div>
        ))}
        <div className="nav-group-label">Intelligence</div>
        {items.filter(i => ['forecast','alerts','metrics'].includes(i.id)).map(i => (
          <div key={i.id} className={`nav-link ${page===i.id?'active':''}`} onClick={()=>onNav(i.id)}>
            <span className="nav-icon">{i.icon}</span>
            {i.label}
            {i.id === 'alerts' && alertCount > 0 && <span className="nav-pill">{alertCount}</span>}
          </div>
        ))}
        {items.filter(i => i.id === 'import').length > 0 && (
          <>
            <div className="nav-group-label">Data</div>
            <div className={`nav-link ${page==='import'?'active':''}`} onClick={() => onNav('import')}>
              <span className="nav-icon">⬆</span>Data Import
            </div>
          </>
        )}
        <div className="nav-group-label">System</div>
        {['admin','pastor'].includes(user.role) && (
          <div className={`nav-link ${page==='settings'?'active':''}`} onClick={() => onNav('settings')}><span className="nav-icon">◻</span>Settings</div>
        )}
        <div className="nav-link" onClick={onLogout}><span className="nav-icon">⇥</span>Sign Out</div>
      </nav>

      <div className="sidebar-foot">
        <div style={{marginBottom:8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span className={`role-tag ${ROLE_CLASS[user.role]}`} style={{textTransform:'capitalize'}}>{user.role}</span>
          {toggleTheme && (
            <button onClick={toggleTheme} className="btn btn-glass" style={{padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'}}>
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          )}
        </div>
        <div className="user-chip">
          <div className="avatar">{initials(user.name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role">{user.email}</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
