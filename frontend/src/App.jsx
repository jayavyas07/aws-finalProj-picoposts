import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Leaves from './pages/Leaves'
import Performance from './pages/Performance'
import Goals from './pages/Goals'
import SelfAssessment from './pages/SelfAssessment'
import ManagerReview from './pages/ManagerReview'
import PerfReports from './pages/PerfReports'
import Onboarding from './pages/Onboarding'

const isAuthed = () => !!localStorage.getItem('token')

const PrivateRoute = ({ children }) => {
  return isAuthed() ? children : <Navigate to="/login" replace />
}

export default function App() {
  const navigate = useNavigate()

  const logout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="container py-4">
      {/* Navigation bar */}
      <nav className="d-flex gap-3 mb-4">
        <Link to="/">Dashboard</Link>
        <Link to="/employees">Employees</Link>
        <Link to="/leaves">Leaves</Link>
        <Link to="/performance">Performance</Link>
        <Link to="/goals">Goals</Link>
        <Link to="/self-assessment">Self Assessment</Link>
        <Link to="/manager/review">Manager Review</Link>
        <Link to="/reports/performance">Performance Reports</Link>
        <button className="btn btn-link ms-auto" onClick={logout}>Logout</button>
      </nav>

      {/* All routes inside <Routes> */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/employees" element={<PrivateRoute><Employees /></PrivateRoute>} />
        <Route path="/leaves" element={<PrivateRoute><Leaves /></PrivateRoute>} />
        <Route path="/performance" element={<PrivateRoute><Performance /></PrivateRoute>} />

// optional redirects so old links still work
<Route path="/goals" element={<Navigate to="/performance" replace />} />
<Route path="/self-assessment" element={<Navigate to="/performance" replace />} />
<Route path="/manager/review" element={<Navigate to="/performance" replace />} />
<Route path="/reports/performance" element={<Navigate to="/performance" replace />} />

    
      </Routes>
    </div>
  )
}
