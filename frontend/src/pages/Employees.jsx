import React, { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

export default function Employees(){
  const role = localStorage.getItem('role') || 'employee'

  // table data
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)

  // filters
  const [q, setQ] = useState('')
  const [designation, setDesignation] = useState('')
  const [departmentId, setDepartmentId] = useState('')

  // modal state
  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [form, setForm] = useState({
    user_id: '',
    designation: '',
    department_id: '',
    manager_id: '',
    phone: '',
    location: ''
  })
  const [err, setErr] = useState('')

  // 🔹 My Team toggle lives INSIDE the component
  const [myTeamMode, setMyTeamMode] = useState(false)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (designation) p.set('designation', designation)
    if (departmentId) p.set('department_id', departmentId)
    p.set('page', page)
    p.set('page_size', size)
    return p.toString()
  }, [q, designation, departmentId, page, size])

  // 🔹 load() switches endpoint based on myTeamMode
  const load = async () => {
    const url = myTeamMode ? '/api/my-team' : `/api/employees?${queryString}`
    const { data } = await client.get(url)
    setRows(data.data || [])
    setTotal(
      typeof data.total === 'number'
        ? data.total
        : (data.data ? data.data.length : 0)
    )
  }

  useEffect(()=>{ load() /* eslint-disable-next-line */ }, [queryString, myTeamMode])

  // ----- actions -----
  const openAdd = () => {
    setIsEdit(false)
    setCurrentId(null)
    setForm({ user_id:'', designation:'', department_id:'', manager_id:'', phone:'', location:'' })
    setErr('')
    setShowModal(true)
  }

  const openEdit = (row) => {
    setIsEdit(true)
    setCurrentId(row.id)
    setForm({
      user_id: row.user_id ?? '',
      designation: row.designation || '',
      department_id: row.department_id || '',
      manager_id: (row.manager_id ?? '') || '',
      phone: row.phone || '',
      location: row.location || ''
    })
    setErr('')
    setShowModal(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      if (isEdit) {
        const payload = {
          ...(form.designation ? { designation: form.designation } : {}),
          ...(form.department_id ? { department_id: Number(form.department_id) } : {}),
          ...(form.manager_id !== '' ? { manager_id: form.manager_id === null ? null : Number(form.manager_id) } : { manager_id: null }),
          ...(form.phone ? { phone: form.phone } : {}),
          ...(form.location ? { location: form.location } : {})
        }
        await client.put(`/api/employees/${currentId}`, payload)
      } else {
        const payload = {
          user_id: Number(form.user_id),
          designation: form.designation,
          department_id: form.department_id ? Number(form.department_id) : 0,
          manager_id: form.manager_id ? Number(form.manager_id) : null,
          phone: form.phone,
          location: form.location
        }
        await client.post('/api/employees', payload)
      }
      setShowModal(false)
      await load()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Operation failed')
    }
  }

  const del = async (id) => {
    if (!confirm('Delete this employee?')) return
    await client.delete(`/api/employees/${id}`)
    await load()
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <h3 className="me-auto">Employee Directory</h3>

        {(role === 'manager' || role === 'admin') && (
          <button
            className={`btn ${myTeamMode ? 'btn-secondary' : 'btn-outline-secondary'} me-2`}
            onClick={() => { setMyTeamMode(m => !m); setPage(1) }}
          >
            {myTeamMode ? 'All Employees' : 'My Team'}
          </button>
        )}

        {role === 'admin' && (
          <button className="btn btn-primary" onClick={openAdd}>+ Add Employee</button>
        )}
      </div>

      {/* Filters (disabled in My Team mode except search) */}
      <div className="card card-body mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control" placeholder="Search name or email"
              value={q} onChange={e=>{setPage(1); setQ(e.target.value)}} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Designation"
              value={designation} onChange={e=>{setPage(1); setDesignation(e.target.value)}}
              disabled={myTeamMode} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Department ID"
              value={departmentId} onChange={e=>{setPage(1); setDepartmentId(e.target.value)}}
              disabled={myTeamMode} />
          </div>
          <div className="col-md-2">
            <select className="form-select" value={size}
              onChange={e=>{setPage(1); setSize(Number(e.target.value))}}>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
        {myTeamMode && <small className="text-muted mt-2">Showing only your direct reports</small>}
      </div>

      {/* Table */}
      <table className="table table-striped">
        <thead><tr>
          <th>Name</th><th>Email</th><th>Designation</th>
          <th>Dept</th><th>ManagerID</th><th>Phone</th><th>Location</th>
          {(role === 'admin' || role === 'manager') && <th style={{width:160}}>Actions</th>}
        </tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.email}</td>
              <td>{r.designation}</td>
              <td>{r.department_id}</td>
              <td>{r.manager_id ?? '-'}</td>
              <td>{r.phone}</td>
              <td>{r.location}</td>
              {(role === 'admin' || role === 'manager') && (
                <td className="d-flex gap-2">
                  <button className="btn btn-sm btn-secondary" onClick={()=>openEdit(r)}>Edit</button>
                  {role === 'admin' && (
                    <button className="btn btn-sm btn-danger" onClick={()=>del(r.id)}>Delete</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="d-flex justify-content-between align-items-center">
        <small>Total: {total}</small>
        <div className="btn-group">
          <button className="btn btn-outline-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
          <button className="btn btn-outline-secondary" disabled={(page*size)>=total} onClick={()=>setPage(p=>p+1)}>Next</button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={save}>
                <div className="modal-header">
                  <h5 className="modal-title">{isEdit ? 'Edit Employee' : 'Add Employee'}</h5>
                  <button type="button" className="btn-close" onClick={()=>setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  {err && <div className="alert alert-danger">{err}</div>}

                  {!isEdit && (
                    <div className="mb-3">
                      <label className="form-label">User ID (required)</label>
                      <input className="form-control" value={form.user_id}
                        onChange={e=>setForm({...form, user_id:e.target.value})} required />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Designation</label>
                    <input className="form-control" value={form.designation}
                      onChange={e=>setForm({...form, designation:e.target.value})} />
                  </div>

                  <div className="row g-2">
                    <div className="col">
                      <label className="form-label">Department ID</label>
                      <input className="form-control" value={form.department_id}
                        onChange={e=>setForm({...form, department_id:e.target.value})} />
                    </div>
                    <div className="col">
                      <label className="form-label">Manager ID</label>
                      <input className="form-control" value={form.manager_id}
                        onChange={e=>setForm({...form, manager_id:e.target.value})} />
                    </div>
                  </div>

                  <div className="row g-2 mt-2">
                    <div className="col">
                      <label className="form-label">Phone</label>
                      <input className="form-control" value={form.phone}
                        onChange={e=>setForm({...form, phone:e.target.value})} />
                    </div>
                    <div className="col">
                      <label className="form-label">Location</label>
                      <input className="form-control" value={form.location}
                        onChange={e=>setForm({...form, location:e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{isEdit ? 'Save changes' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
