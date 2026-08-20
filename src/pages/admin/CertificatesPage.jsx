import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CertificateDetailModal from '../../components/admin/CertificateDetailModal.jsx'
import { api, clearToken } from '../../lib/api.js'

export default function CertificatesPage() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api.listCertificates('')
      setItems(data.items || [])
    } catch (err) {
      if (err.status === 401) {
        clearToken()
        window.location.href = '/admin/sign-in'
        return
      }
      setError(err.message || 'Could not load certificates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter((cert) =>
      [cert.certificateId, cert.studentName, cert.studentEmail, cert.className, cert.specialNotes]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    )
  }, [items, q])

  async function handleDelete(cert) {
    if (!window.confirm(`Delete certificate ${cert.certificateId}?`)) return
    try {
      await api.deleteCertificate(cert.id)
      setMessage(`Deleted ${cert.certificateId}`)
      setSelected(null)
      load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Admin / Certificates</p>
          <h1>Manage certificates</h1>
          <p>Register, update, or remove records in the OudTech registry.</p>
        </div>
        <Link to="/admin/certificates/new" className="btn-primary">
          Add certificate
        </Link>
      </div>

      {message && <div className="toast ok">{message}</div>}
      {error && <div className="toast err">{error}</div>}

      <div className="panel">
        <div className="panel-head">
          <h2>All certificates</h2>
          <input
            className="admin-input"
            style={{ minWidth: 220 }}
            placeholder="Search ID, name, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Certificate ID</th>
                <th>Student</th>
                <th>Email</th>
                <th>Class</th>
                <th>Award date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">Loading…</div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((cert) => (
                  <tr
                    key={cert.id}
                    className="clickable"
                    onClick={() => setSelected(cert)}
                  >
                    <td>{cert.certificateId}</td>
                    <td>{cert.studentName}</td>
                    <td>{cert.studentEmail || '—'}</td>
                    <td>
                      <span className="badge blue">{cert.className || '—'}</span>
                    </td>
                    <td>{cert.awardDate || '—'}</td>
                    <td>
                      <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                        <Link to={`/admin/certificates/${cert.id}/edit`}>Edit</Link>
                        <button type="button" className="danger" onClick={() => handleDelete(cert)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && !filtered.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No certificates found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CertificateDetailModal
        certificate={selected}
        onClose={() => setSelected(null)}
        onDelete={handleDelete}
      />
    </div>
  )
}
