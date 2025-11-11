import React, { useEffect, useMemo, useState } from 'react'
import client from '../api/client'

export default function Goals(){
  const [cycleId, setCycleId] = useState('')        // optional filter
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  // create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [timeline, setTimeline] = useState('quarterly')

  // inline update state
  const [savingId, setSavingId] = useState(null)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (cycleId) p.set('cycle_id', cycleId)
    return p.toString()
  }, [cycleId])

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const { data } = await client.get(`/api/pms/my-goals?${qs}`)
      setList(data.data || [])
    } catch (e) {
      setErr(e?.response?.data?.error || 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [qs])

  const createGoal = async (e) => {
    e.preventDefault(); setErr('')
    try {
      if (!cycleId) return setErr('Select a Cycle ID (e.g., 1) before adding a goal.')
      await client.post('/api/pms/goals', {
        cycle_id: Number(cycleId),
        title,
        description,
        timeline
      })
      setTitle(''); setDescription(''); setTimeline('quarterly')
      load()
    } catch (e) {
      setErr(e?.response?.data?.error || 'Create failed')
    }
  }

  const updateGoal = async (id, patch) => {
    setSavingId(id)
    try {
      await client.put(`/api/pms/goals/${id}`, patch)
      load()
    } catch (e) {
      alert(e?.response?.data?.error || 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="d-flex align-items-center mb-3">
        <h3 className="me-auto">My Goals</h3>
        <input
          className="form-control w-auto"
          placeholder="Cycle ID (e.g. 1)"
          value={cycleId}
          onChange={e=>setCycleId(e.target.value)}
        />
      </div>

      <div className="card card-body mb-3">
        <form onSubmit={createGoal}>
          <div className="row g-2">
            <div className="col-md-4">
              <input className="form-control" placeholder="Goal title"
                     value={title} onChange={e=>setTitle(e.target.value)} required/>
            </div>
            <div className="col-md-4">
              <input className="form-control" placeholder="Description"
                     value={description} onChange={e=>setDescription(e.target.value)} />
            </div>
            <div className="col-md-2">
              <select className="form-select" value={timeline} onChange={e=>setTimeline(e.target.value)}>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-primary" type="submit">Add Goal</button>
            </div>
          </div>
          {err && <div className="text-danger mt-2">{err}</div>}
        </form>
      </div>

      {loading ? <div>Loading…</div> : (
        <table className="table table-striped">
          <thead>
            <tr><th>Title</th><th>Timeline</th><th>Status</th><th style={{width:240}}>Progress</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.map(g => {
              const id = g.ID ?? g.id
              const progress = g.Progress ?? g.progress ?? 0
              const status = g.Status ?? g.status
              const titleV = g.Title ?? g.title
              const timelineV = g.Timeline ?? g.timeline
              return (
                <tr key={id}>
                  <td>{titleV}</td>
                  <td>{timelineV}</td>
                  <td>{status}</td>
                  <td>
                    <div className="input-group">
                      <input
                        type="number" className="form-control" min={0} max={100}
                        defaultValue={progress}
                        onBlur={e=>updateGoal(id, { progress: Number(e.target.value) })}
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </td>
                  <td className="d-flex gap-2">
                    <button
                      disabled={savingId===id}
                      className="btn btn-sm btn-outline-secondary"
                      onClick={()=>updateGoal(id, { status: 'submitted' })}
                    >Submit</button>
                    <button
                      disabled={savingId===id}
                      className="btn btn-sm btn-outline-secondary"
                      onClick={()=>updateGoal(id, { status: 'archived' })}
                    >Archive</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
