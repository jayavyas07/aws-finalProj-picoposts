import React, { useState, useEffect } from 'react'
import client from '../api/client'

export default function Onboarding() {
  const [onboardedEmployees, setOnboardedEmployees] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department_id: '',
    designation: '',
    phone: '',
    location: ''
  })

  useEffect(() => {
    loadOnboarded()
  }, [])

  const loadOnboarded = async () => {
    try {
      const { data } = await client.get('/api/employees')
      setOnboardedEmployees(data.data || [])
    } catch (e) {
      console.error('Failed to load employees')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setMsg('')
    
    try {
      // Step 1: Create user account
      const userPayload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        department_id: form.department_id ? Number(form.department_id) : null
      }
      
      await client.post('/api/auth/register', userPayload)
      
      // Step 2: Get the created user's ID
      const { data: userData } = await client.get(`/api/users/by-email/${form.email}`)
      
      // Step 3: Create employee record
      const employeePayload = {
        user_id: userData.id,
        designation: form.designation,
        department_id: form.department_id ? Number(form.department_id) : 0,
        phone: form.phone,
        location: form.location
      }
      
      await client.post('/api/employees', employeePayload)
      
      setMsg('Employee onboarded successfully!')
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department_id: '',
        designation: '',
        phone: '',
        location: ''
      })
      setShowForm(false)
      loadOnboarded()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Onboarding failed')
    }
  }

  const offboardEmployee = async (employeeId, userId) => {
    if (!confirm('Are you sure you want to offboard this employee?')) return
    
    try {
      await client.delete(`/api/employees/${employeeId}`)
      await client.delete(`/api/users/${userId}`)
      setMsg('Employee offboarded successfully')
      loadOnboarded()
    } catch (e) {
      setErr('Offboarding failed')
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <h3 className="me-auto">Employee Onboarding</h3>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Onboard New Employee'}
        </button>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}
      {err && <div className="alert alert-danger">{err}</div>}

      {showForm && (
        <div className="card card-body mb-4">
          <h5>New Employee Details</h5>
          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name *</label>
                <input 
                  className="form-control" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  required 
                />
              </div>
              
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input 
                  type="email"
                  className="form-control" 
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  required 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Password *</label>
                <input 
                  type="password"
                  className="form-control" 
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  required 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Role *</label>
                <select 
                  className="form-select"
                  value={form.role}
                  onChange={e => setForm({...form, role: e.target.value})}
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">HR/Admin</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Department ID *</label>
                <input 
                  type="number"
                  className="form-control" 
                  value={form.department_id}
                  onChange={e => setForm({...form, department_id: e.target.value})}
                  required 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Designation *</label>
                <input 
                  className="form-control" 
                  value={form.designation}
                  onChange={e => setForm({...form, designation: e.target.value})}
                  required 
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <input 
                  className="form-control" 
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Location</label>
                <input 
                  className="form-control" 
                  value={form.location}
                  onChange={e => setForm({...form, location: e.target.value})}
                />
              </div>

              <div className="col-12">
                <button type="submit" className="btn btn-success">
                  Onboard Employee
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <h5 className="mt-4">Onboarded Employees</h5>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Designation</th>
            <th>Department</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {onboardedEmployees.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.role || '-'}</td>
              <td>{emp.designation}</td>
              <td>{emp.department_id}</td>
              <td>{emp.phone}</td>
              <td>{emp.location}</td>
              <td>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => offboardEmployee(emp.id, emp.user_id)}
                >
                  Offboard
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}