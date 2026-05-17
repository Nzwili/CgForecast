import { render, screen } from '@testing-library/react'
import { Navbar } from '../Navbar'
import { vi, describe, it, expect } from 'vitest'

// Mock the API client
vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] }))
  }
}))

describe('Navbar Component - Role Based Access', () => {
  const mockOnNav = vi.fn()
  const mockOnLogout = vi.fn()

  it('should show "Model Metrics" for Analyst role', () => {
    const analystUser = { id: '1', name: 'Analyst User', email: 'a@c.org', role: 'analyst' }
    render(
      <Navbar 
        user={analystUser} 
        page="dashboard" 
        onNav={mockOnNav} 
        onLogout={mockOnLogout} 
      />
    )
    
    // Check for Model Metrics (should be visible for analysts)
    // Note: in the code it's items.filter... but in the render loop it might be in different sections
    // Actually in Navbar.tsx line 12: { id: 'metrics', label: 'Model Metrics', roles: ['admin','analyst'] }
    // But wait, Navbar.tsx filter logic for categories...
    expect(screen.getByText(/Model Metrics/i)).toBeInTheDocument()
  })

  it('should hide "Data Import" for Pastor role', () => {
    const pastorUser = { id: '1', name: 'Pastor User', email: 'p@c.org', role: 'pastor' }
    render(
      <Navbar 
        user={pastorUser} 
        page="dashboard" 
        onNav={mockOnNav} 
        onLogout={mockOnLogout} 
      />
    )
    
    expect(screen.queryByText(/Data Import/i)).not.toBeInTheDocument()
  })

  it('should show "Data Import" for Admin role', () => {
    const adminUser = { id: '1', name: 'Admin User', email: 'admin@c.org', role: 'admin' }
    render(
      <Navbar 
        user={adminUser} 
        page="dashboard" 
        onNav={mockOnNav} 
        onLogout={mockOnLogout} 
      />
    )
    
    expect(screen.getByText(/Data Import/i)).toBeInTheDocument()
  })
})
