import { useState, useEffect } from 'react'
import './index.css'
import { Navbar } from './components/Navbar'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'
import { ForecastPage } from './pages/ForecastPage'
import { AlertsPage } from './pages/AlertsPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { SettingsPage } from './pages/SettingsPage'
import { ImportPage } from './pages/ImportPage'
import { ModelMetricsPage } from './pages/ModelMetricsPage'
import { UserManagementPage } from './pages/UserManagementPage'
import { useAuth } from './context/AuthContext'

export type Page = 'dashboard' | 'attendance' | 'forecast' | 'alerts' | 'feedback' | 'settings' | 'import' | 'metrics' | 'users'
export interface User { id: string; name: string; email: string; role: 'admin'|'pastor'|'analyst' }

function App() {
  const { user, login, logout } = useAuth() as { user: User | null; login: (email: string, pw: string) => Promise<void>; logout: () => void }
  const [page, setPage] = useState<Page>('dashboard')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark'|'light') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('app-theme', theme)
    if (theme === 'light') document.body.classList.add('light-theme')
    else document.body.classList.remove('light-theme')
  }, [theme])

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') setPage('import')
      else if (user.role === 'analyst') setPage('metrics')
      else setPage('dashboard')
    }
  }, [user])

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark')

  const handleNav = (p: Page, gid?: number) => {
    setPage(p)
    if (gid) setSelectedGroupId(gid)
    else if (p !== 'forecast') setSelectedGroupId(null)
  }

  if (!user) return <><div className="aurora-bg"/><LoginPage onLogin={login}/></>

  return (
    <>
      <div className="aurora-bg"/>
      <div className="app-shell">
        <Navbar user={user} page={page} onNav={handleNav} onLogout={logout} theme={theme} toggleTheme={toggleTheme}/>
        <main className="page-canvas">
          {page === 'dashboard'  && <DashboardPage  user={user} onNav={handleNav}/>}
          {page === 'attendance' && <AttendancePage user={user}/>}
          {page === 'forecast'   && <ForecastPage   user={user} initialGroupId={selectedGroupId}/>}
          {page === 'alerts'     && <AlertsPage     user={user} onNav={handleNav}/>}
          {page === 'feedback'   && <FeedbackPage   user={user}/>}
          {page === 'settings'   && <SettingsPage   user={user} onNav={handleNav}/>}
          {page === 'import'     && <ImportPage     user={user}/>}
          {page === 'metrics'    && <ModelMetricsPage    user={user}/>}
          {page === 'users'      && <UserManagementPage  user={user}/>}
        </main>
      </div>
    </>
  )
}
export default App
