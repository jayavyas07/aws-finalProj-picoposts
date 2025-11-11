import React, { useMemo, useState } from 'react'
import Goals from './Goals'
import SelfAssessment from './SelfAssessment'
import ManagerReview from './ManagerReview'
import PerfReports from './PerfReports'
import client from '../api/client' // if you later want to fetch cycles here

export default function Performance() {
  const role = localStorage.getItem('role') || 'employee'
  const [tab, setTab] = useState('goals') // goals | self | manager | reports | history

  const Tabs = useMemo(() => ([
    { key: 'goals',    label: 'Goals' },
    { key: 'self',     label: 'Self Assessment' },
    ...(role === 'admin' || role === 'manager' ? [{ key: 'manager', label: 'Manager Review' }] : []),
    ...(role === 'admin' ? [{ key: 'reports', label: 'Reports' }] : []),
    { key: 'history',  label: 'My Reviews' }
  ]), [role])

  return (
    <div>
      <h3 className="mb-3">Performance</h3>

      {/* Nav tabs */}
      <ul className="nav nav-tabs mb-3">
        {Tabs.map(t => (
          <li className="nav-item" key={t.key}>
            <button
              className={`nav-link ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Tab content */}
      {tab === 'goals'    && <Goals />}
      {tab === 'self'     && <SelfAssessment />}
      {tab === 'manager'  && <ManagerReview />}
      {tab === 'reports'  && <PerfReports />}
      {tab === 'history'  && <MyReviewsCard />}
    </div>
  )
}

/** Inline card for PERF-6: My Reviews (same logic you added to Dashboard) */
function MyReviewsCard() {
  const [reviews, setReviews] = React.useState([])
  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/pms/my-reviews')
        setReviews(data.data || [])
      } catch (_) {}
    })()
  }, [])
  return (
    <div className="card shadow-sm">
      <div className="card-header">My Reviews</div>
      <div className="card-body">
        <ul className="list-group list-group-flush">
          {reviews.slice(0,5).map(r => (
            <li key={r.ID || r.id} className="list-group-item d-flex justify-content-between">
              <span>Cycle #{r.CycleID || r.cycle_id}</span>
              <strong>Rating: {r.Rating || r.rating}</strong>
            </li>
          ))}
          {reviews.length === 0 && (
            <li className="list-group-item text-muted">No reviews yet</li>
          )}
        </ul>
      </div>
    </div>
  )
}
