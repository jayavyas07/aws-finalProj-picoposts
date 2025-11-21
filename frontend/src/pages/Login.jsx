import React, { useState } from 'react'
import client from '../api/client'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isRegister) {
        await client.post('/api/auth/register', { name, email, password })
      }
      const { data } = await client.post('/api/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)
      localStorage.setItem('email', data.email)
      nav('/')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed')
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <h3 className="mb-3">{isRegister ? 'Register' : 'Login'}</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={submit} className="card card-body">
          {isRegister && (
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input className="form-control" value={name} onChange={e=>setName(e.target.value)} required />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary">{isRegister ? 'Create account' : 'Log in'}</button>
          <button type="button" className="btn btn-link mt-2" onClick={()=>setIsRegister(!isRegister)}>
            {isRegister ? 'Have an account? Sign in' : 'New here? Register'}
          </button>
        </form>
      </div>
    </div>
  )
}