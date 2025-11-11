import React, { useState } from 'react'
import client from '../api/client'

export default function ManagerReview() {
  const [employeeId, setEmployeeId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [goals, setGoals] = useState([])
  const [rating, setRating] = useState('')
  const [comments, setComments] = useState('')
  const [status, setStatus] = useState('final')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const loadGoals = async () => {
    setErr(''); setMsg('')
    try {
      const { data } = await client.get(`/api/pms/manager/goals?employee_id=${employeeId}&cycle_id=${cycleId}`)
      setGoals(data.data || [])
    } catch (e) {
      setErr(e?.response?.data?.error || 'Load failed')
    }
  }

  const submitReview = async () => {
    setErr(''); setMsg('')
    try {
      await client.post('/api/pms/reviews', {
        employee_id: Number(employeeId),
        cycle_id: Number(cycleId),
        rating: Number(rating),
        comments,
        status
      })
      setMsg('Review saved')
    } catch (e) {
      setErr(e?.response?.data?.error || 'Save failed')
    }
  }

  return (
    <div>
      <h3>Manager Review</h3>

      <div className="card card-body mb-3">
        <div className="row g-2">
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Employee ID"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <input
              className="form-control"
              placeholder="Cycle ID"
              value={cycleId}
              onChange={e => setCycleId(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-outline-secondary w-100"
              onClick={loadGoals}
            >
              Load Goals
            </button>
          </div>
          <div className="col-md-2">
            <select
              className="form-select"
              value={rating}
              onChange={e => setRating(e.target.value)}
            >
              <option value="">Rating</option>
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Comments"
              value={comments}
              onChange={e => setComments(e.target.value)}
            />
          </div>
          <div className="col-md-1 d-grid">
            <button className="btn btn-primary" onClick={submitReview}>Save</button>
          </div>
        </div>

        {msg && <div className="text-success mt-2">{msg}</div>}
        {err && <div className="text-danger mt-2">{err}</div>}
      </div>

      <h6 className="text-muted">Employee Goals</h6>
      <table className="table table-sm">
        <thead>
          <tr><th>Title</th><th>Status</th><th>Progress</th></tr>
        </thead>
        <tbody>
          {goals.map(g => (
            <tr key={g.ID || g.id}>
              <td>{g.Title || g.title}</td>
              <td>{g.Status || g.status}</td>
              <td>{g.Progress ?? g.progress ?? 0}%</td>
            </tr>
          ))}
          {goals.length === 0 && (
            <tr><td colSpan={3} className="text-muted">No goals loaded</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
