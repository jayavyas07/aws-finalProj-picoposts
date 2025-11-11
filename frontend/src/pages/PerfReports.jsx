import React, { useEffect, useState } from 'react'
import client from '../api/client'


// Simple CSS bar without extra libs
const Bar = ({value}) => (
<div className="bg-light" style={{height:10, width:'100%', borderRadius:6}}>
<div className="bg-primary" style={{height:10, width: `${Math.min(100, value*20)}%`, borderRadius:6}} />
</div>
)


export default function PerfReports(){
const [cycleId, setCycleId] = useState('')
const [deptId, setDeptId] = useState('')
const [rows, setRows] = useState([])
const [err, setErr] = useState('')


const load = async () => {
setErr('')
const params = new URLSearchParams()
if (cycleId) params.set('cycle_id', cycleId)
if (deptId) params.set('department_id', deptId)
try{
const { data } = await client.get(`/api/pms/admin/report?${params.toString()}`)
setRows(data.data || [])
}catch(e){ setErr(e?.response?.data?.error || 'Report failed') }
}


useEffect(()=>{ load() }, [])


return (
<div>
<div className="d-flex align-items-center mb-3">
<h3 className="me-auto">Performance Reports</h3>
<input className="form-control w-auto me-2" placeholder="Cycle ID" value={cycleId} onChange={e=>setCycleId(e.target.value)} />
<input className="form-control w-auto me-2" placeholder="Dept ID (opt)" value={deptId} onChange={e=>setDeptId(e.target.value)} />
<button className="btn btn-outline-secondary" onClick={load}>Run</button>
</div>


{err && <div className="alert alert-danger">{err}</div>}


<table className="table">
<thead><tr><th>Department</th><th>Avg Rating</th><th>Reviews</th><th>Chart</th></tr></thead>
<tbody>
{rows.map(r => (
<tr key={r.department_id}>
<td>{r.department_id}</td>
<td>{Number(r.avg_rating).toFixed(2)}</td>
<td>{r.review_count}</td>
<td style={{minWidth:200}}><Bar value={Number(r.avg_rating)} /></td>
</tr>
))}
{rows.length===0 && <tr><td colSpan={4} className="text-muted">No data</td></tr>}
</tbody>
</table>
</div>
)
}