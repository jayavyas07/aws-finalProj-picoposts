import React, { useEffect, useState } from 'react'
import client from '../api/client'

export default function Leaves(){
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ user_id: 0, start_date: '', end_date: '', type: 'Casual', reason: '' })

  const load = async () => {
    const { data } = await client.get('/api/leaves')
    setRows(data.data || [])
  }
  useEffect(()=>{ load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    await client.post('/api/leaves', form)
    setForm({ user_id: 0, start_date: '', end_date: '', type: 'Casual', reason: '' })
    load()
  }

  const approve = async (id) => { await client.put(`/api/leaves/${id}/approve`); load() }
  const reject = async (id) => { await client.put(`/api/leaves/${id}/reject`); load() }

  return (
    <div>
      <h3>Leave Management</h3>
      <form onSubmit={submit} className="card card-body mb-3">
        <div className="row g-2">
          <div className="col"><input className="form-control" placeholder="User ID" value={form.user_id} onChange={e=>setForm({...form, user_id: Number(e.target.value)})} /></div>
          <div className="col"><input type="date" className="form-control" value={form.start_date} onChange={e=>setForm({...form, start_date: e.target.value})} /></div>
          <div className="col"><input type="date" className="form-control" value={form.end_date} onChange={e=>setForm({...form, end_date: e.target.value})} /></div>
          <div className="col"><input className="form-control" placeholder="Type" value={form.type} onChange={e=>setForm({...form, type: e.target.value})} /></div>
          <div className="col"><input className="form-control" placeholder="Reason" value={form.reason} onChange={e=>setForm({...form, reason: e.target.value})} /></div>
          <div className="col-auto"><button className="btn btn-primary">Request</button></div>
        </div>
      </form>

      <table className="table table-bordered">
        <thead><tr><th>ID</th><th>User</th><th>Start</th><th>End</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.ID || r.id}>
              <td>{r.ID || r.id}</td>
              <td>{r.UserID || r.user_id}</td>
              <td>{(r.StartDate || r.start_date || '').slice(0,10)}</td>
              <td>{(r.EndDate || r.end_date || '').slice(0,10)}</td>
              <td>{r.Type || r.type}</td>
              <td>{r.Status || r.status}</td>
              <td className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={()=>approve(r.ID || r.id)}>Approve</button>
                <button className="btn btn-sm btn-warning" onClick={()=>reject(r.ID || r.id)}>Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
