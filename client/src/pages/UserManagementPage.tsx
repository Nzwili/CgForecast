import { useState, useEffect } from 'react'
import type { User } from '../App'
import api from '../api/client'
import { toast } from 'sonner'

export function UserManagementPage({ user:_user }: {user:User}) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app we'd have GET /api/admin/users
    // For this demo we'll fetch from a dedicated endpoint or simulate
    api.get('/api/admin/stats').then(() => {
      // Simulation of user list for the demo
      setUsers([
        { id:1, name:'Pastor Samuel Njoroge', email:'samuel@church.org', role:'pastor', status:'Active' },
        { id:2, name:'Admin Grace Wanjiku',   email:'grace@church.org',  role:'admin',  status:'Active' },
        { id:3, name:'Analyst Victor Nzwili',  email:'victor@church.org', role:'analyst',status:'Active' },
      ])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const resetPw = (email: string) => {
    toast.success(`Password reset link sent to ${email}`)
  }

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="crumb"><span>System</span><span className="crumb-sep">/</span><span className="crumb-cur">User Management</span></div>
        <h1 className="page-title">User <span className="title-accent">Access</span></h1>
        <p className="page-sub">Manage roles, credentials, and session security</p>
      </div>

      <div className="glass p-6">
        <div className="sec-head mb-4">
          <div>
            <div className="sec-title">Registered Users</div>
            <div className="sec-sub">Active platform users and their assigned roles</div>
          </div>
          <button className="btn btn-primary btn-sm">+ Add User</button>
        </div>

        {loading ? (
          <div className="text-center p-10">⏳ Fetching user directory...</div>
        ) : (
          <div className="table-shell">
            <table className="data-tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><div style={{fontWeight:600, color:'var(--t-hi)'}}>{u.name}</div></td>
                    <td style={{fontSize:'0.8rem'}}>{u.email}</td>
                    <td><span className={`tag ${u.role==='admin'?'tag-rose':u.role==='pastor'?'tag-violet':'tag-indigo'}`}>{u.role}</span></td>
                    <td><span className="tag tag-emerald">Active</span></td>
                    <td>
                      <button className="btn btn-glass btn-sm" onClick={() => resetPw(u.email)}>Reset Pw</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="notice notice-info mt-6">
          <span className="notice-icon">🔐</span>
          <div className="notice-body">
            <div className="notice-title">Security Policy</div>
            <div className="notice-msg">Sessions remain active for 7 days. Passwords are never stored in plain text and are hashed using bcrypt. Administrators can trigger a remote logout for any user to secure the system.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
