import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { certificateImageUrl } from '../../lib/images.js'

function formatDate(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function CertificateDetailModal({ certificate, onClose, onDelete }) {
  useEffect(() => {
    if (!certificate) return undefined
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [certificate, onClose])

  if (!certificate) return null

  const imageUrl = certificateImageUrl(certificate.image)

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 id="cert-modal-title">{certificate.studentName || 'Certificate'}</h2>
            <p>{certificate.certificateId}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-details">
            <dl>
              <div>
                <dt>Class / cohort</dt>
                <dd>{certificate.className || '—'}</dd>
              </div>
              <div>
                <dt>Award date</dt>
                <dd>{formatDate(certificate.awardDate)}</dd>
              </div>
              <div>
                <dt>Student email</dt>
                <dd>{certificate.studentEmail || '—'}</dd>
              </div>
              <div>
                <dt>Contact</dt>
                <dd>{certificate.studentContact || '—'}</dd>
              </div>
              <div>
                <dt>Notes</dt>
                <dd>{certificate.specialNotes || '—'}</dd>
              </div>
            </dl>

            <div className="modal-actions">
              <Link to={`/admin/certificates/${certificate.id}/edit`} className="btn-primary">
                Edit
              </Link>
              <button type="button" className="btn-danger" onClick={() => onDelete?.(certificate)}>
                Delete
              </button>
            </div>
          </div>

          <div className="modal-image">
            {imageUrl ? (
              <img src={imageUrl} alt={`Certificate ${certificate.certificateId}`} />
            ) : (
              <div className="empty-state">No certificate image on file.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
