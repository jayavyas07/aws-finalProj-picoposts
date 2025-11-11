import React, { useState } from 'react'
import client from '../api/client'


export default function SelfAssessment(){
const [cycleId, setCycleId] = useState('')
const [comments, setComments] = useState('')
const [rating, setRating] = useState('')
const [msg, setMsg] = useState('')
const [err, setErr] = useState('')


const submit = async (e) => {
e.preventDefault(); setErr(''); setMsg('')
try{
const payload = { cycle_id: Number(cycleId), comments }
if (rating) payload.rating = Number(rating)
await client.post('/api/pms/self-assess', payload)
setMsg('Submitted!')
}catch(e){ setErr(e?.response?.data?.error || 'Submit failed') }
}


return (
<div>
<h3>Self Assessment</h3>
<form className="card card-body" onSubmit={submit}>
<div className="row g-2">
<div className="col-md-2">
<input className="form-control" placeholder="Cycle ID" value={cycleId} onChange={e=>setCycleId(e.target.value)} required />
</div>
<div className="col-md-7">
<input className="form-control" placeholder="Comments" value={comments} onChange={e=>setComments(e.target.value)} />
</div>
<div className="col-md-2">
<select className="form-select" value={rating} onChange={e=>setRating(e.target.value)}>
<option value="">Self Rating (opt)</option>
{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
</select>
</div>
<div className="col-md-1 d-grid">
<button className="btn btn-primary" type="submit">Submit</button>
</div>
</div>
{msg && <div className="text-success mt-2">{msg}</div>}
{err && <div className="text-danger mt-2">{err}</div>}
</form>
</div>
)
}