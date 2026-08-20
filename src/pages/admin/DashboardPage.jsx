import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, clearToken } from '../../lib/api.js'

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .dashboard()
      .then((data) => {
        if (alive) setStats(data)
      })
      .catch((err) => {
        if (err.status === 401) {
          clearToken()
          window.location.href = '/admin/sign-in'
          return
        }
        if (alive) setError(err.message || 'Failed to load dashboard')
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Admin / Dashboard</p>
          <h1>Welcome back</h1>
          <p>All systems are ready. Manage and verify certificates from one place.</p>
        </div>
        <Link to="/admin/certificates/new" className="btn-primary">
          Add certificate
        </Link>
      </div>

      {error && <div className="toast err">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card blue">
          <span>Total certificates</span>
          <strong>{stats?.totalCertificates ?? '—'}</strong>
          <small>On registry</small>
        </div>
        <div className="stat-card indigo">
          <span>Classes / cohorts</span>
          <strong>{stats?.classCount ?? '—'}</strong>
          <small>Distinct statuses</small>
        </div>
        <div className="stat-card coral">
          <span>Awarded (30 days)</span>
          <strong>{stats?.recentAwarded ?? '—'}</strong>
          <small>Recent activity</small>
        </div>
        <div className="stat-card navy">
          <span>Print enabled</span>
          <strong>{stats ? (stats.allowPrint ? 'Yes' : 'No') : '—'}</strong>
          <small>Store: {stats?.dbMode || '…'}</small>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent certificates</h2>
          <Link to="/admin/certificates">View all</Link>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student</th>
                <th>Class</th>
                <th>Award date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent || []).map((cert) => (
                <tr key={cert.id}>
                  <td>{cert.certificateId}</td>
                  <td>{cert.studentName}</td>
                  <td>{cert.className || '—'}</td>
                  <td>{cert.awardDate || '—'}</td>
                  <td>
                    <span className="badge green">Active</span>
                  </td>
                </tr>
              ))}
              {stats && !stats.recent?.length && (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">No certificates yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
