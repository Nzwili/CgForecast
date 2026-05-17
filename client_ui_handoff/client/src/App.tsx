import { useState } from 'react'
import './index.css'
import { Navbar } from './components/Navbar'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'
import { ForecastPage } from './pages/ForecastPage'
import { AlertsPage } from './pages/AlertsPage'
import { FeedbackPage } from './pages/FeedbackPage'

export type Page = 'dashboard' | 'attendance' | 'forecast' | 'alerts' | 'feedback'
export interface User { id: string; name: string; email: string; role: 'admin'|'pastor'|'usher'|'member' }

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<Page>('dashboard')

  if (!user) return <><div className="aurora-bg"/><LoginPage onLogin={setUser}/></>

  return (
    <>
      <div className="aurora-bg"/>
      <div className="app-shell">
        <Navbar user={user} page={page} onNav={setPage} onLogout={() => setUser(null)}/>
        <main className="page-canvas">
          {page === 'dashboard'  && <DashboardPage  user={user} onNav={setPage}/>}
          {page === 'attendance' && <AttendancePage user={user}/>}
          {page === 'forecast'   && <ForecastPage   user={user}/>}
          {page === 'alerts'     && <AlertsPage     user={user}/>}
          {page === 'feedback'   && <FeedbackPage   user={user}/>}
        </main>
      </div>
    </>
  )
}
export default App
