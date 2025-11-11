import React, { useEffect, useState } from 'react'
import client from '../api/client'

export default function Dashboard() {
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const { data } = await client.get('/api/pms/my-reviews')
        setReviews(data.data || [])
      } catch (e) {
        // silent fail if no PMS data yet
      }
    })()
  }, [])

  return (
    <div>
      <h3>PeopleSoft Dashboard</h3>
      <p>Welcome! Use the navigation to manage Employees, Leaves, Goals, and Performance.</p>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header">My Reviews</div>
            <div className="card-body">
              <ul className="list-group list-group-flush">
                {reviews.slice(0, 5).map(r => (
                  <li
                    key={r.ID || r.id}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
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
        </div>
      </div>
    </div>
  )
}
