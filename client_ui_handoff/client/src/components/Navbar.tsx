import type { User, Page } from '../App'

interface Props { user: User; page: Page; onNav: (p: Page) => void; onLogout: () => void }

const NAV = [
  { id: 'dashboard'  as Page, icon: '▦',  label: 'Dashboard',   roles: ['admin','pastor','usher','member'] },
  { id: 'attendance' as Page, icon: '✔',  label: 'Attendance',  roles: ['admin','pastor','usher'] },
  { id: 'feedback'   as Page, icon: '◎',  label: 'Feedback',    roles: ['admin','pastor','usher','member'] },
  { id: 'forecast'   as Page, icon: '⟋',  label: 'AI Forecast', roles: ['admin','pastor'] },
  { id: 'alerts'     as Page, icon: '◈',  label: 'Alerts',      roles: ['admin','pastor'], badge: 3 },
]

const ROLE_CLASS: Record<string,string> = { admin:'role-admin', pastor:'role-pastor', usher:'role-usher', member:'role-member' }
const initials = (name: string) => name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()

export function Navbar({ user, page, onNav, onLogout }: Props) {
  const items = NAV.filter(i => i.roles.includes(user.role))
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <div className="brand-icon">⛪</div>
          <div className="brand-text">
            <div className="brand-name">CG Forecast</div>
            <div className="brand-sub">Growth Intelligence · SVR ML</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-group-label">Main</div>
        {items.slice(0,3).map(i => (
          <div key={i.id} className={`nav-link ${page===i.id?'active':''}`} onClick={()=>onNav(i.id)}>
            <span className="nav-icon">{i.icon}</span>
            {i.label}
            {i.badge && <span className="nav-pill">{i.badge}</span>}
          </div>
        ))}
        <div className="nav-group-label">Intelligence</div>
        {items.slice(3).map(i => (
          <div key={i.id} className={`nav-link ${page===i.id?'active':''}`} onClick={()=>onNav(i.id)}>
            <span className="nav-icon">{i.icon}</span>
            {i.label}
            {i.badge && <span className="nav-pill">{i.badge}</span>}
          </div>
        ))}
        <div className="nav-group-label">System</div>
        <div className="nav-link"><span className="nav-icon">◻</span>Settings</div>
        <div className="nav-link"><span className="nav-icon">↗</span>Reports</div>
      </nav>

      <div className="sidebar-foot">
        <div style={{marginBottom:8}}>
          <span className={`role-tag ${ROLE_CLASS[user.role]}`} style={{textTransform:'capitalize'}}>{user.role}</span>
        </div>
        <div className="user-chip">
          <div className="avatar">{initials(user.name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div className="avatar-name">{user.name}</div>
            <div className="avatar-role">{user.email}</div>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Sign out">⇥</button>
        </div>
      </div>
    </aside>
  )
}
