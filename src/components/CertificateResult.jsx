import Seal from './Seal.jsx'
import { certificateImageUrl } from '../lib/images.js'

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

export default function CertificateResult({ certificate, queriedId }) {
  if (!certificate) {
    return (
      <div className="result-card" role="status">
        <div className="result-status rejected">
          <Seal status="rejected" compact />
          Not verified
        </div>
        <div className="result-details">
          <p className="result-cert-id">Certificate ID — {queriedId}</p>
          <h2 className="result-name" style={{ fontSize: '1.45rem' }}>
            No certificate matches this ID
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '48ch', lineHeight: 1.6, margin: 0 }}>
            Double-check the ID printed on the certificate. If you believe this is an error, contact{' '}
            <a href="mailto:support@oudtechnologies.com">support@oudtechnologies.com</a>.
          </p>
        </div>
      </div>
    )
  }

  const {
    certificateId,
    studentName,
    studentEmail,
    className,
    specialNotes,
    awardDate,
    image,
  } = certificate

  const imageUrl = certificateImageUrl(image)

  function handlePrint() {
    if (!imageUrl) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `${certificateId || 'certificate'}.png`
      link.click()
      return
    }

    const title = `Certificate ${certificateId}`
    const absoluteSrc = new URL(imageUrl, window.location.origin).href
    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { margin: 0; size: landscape; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      overflow: hidden;
    }
    img {
      display: block;
      width: 100vw;
      height: 100vh;
      object-fit: contain;
      object-position: center;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <img src="${absoluteSrc}" alt="${title}" />
  <script>
    const img = document.querySelector('img');
    function go() {
      setTimeout(function () {
        window.focus();
        window.print();
      }, 50);
    }
    if (img.complete) go();
    else img.addEventListener('load', go);
    img.addEventListener('error', go);
    window.addEventListener('afterprint', function () { window.close(); });
  <\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  return (
    <div className="result-card">
      <div className="result-status verified">
        <Seal status="verified" compact />
        Verified
      </div>

      <div className="result-body">
        <div className="result-details">
          <p className="result-cert-id">Certificate ID — {certificateId}</p>
          <h2 className="result-name">{studentName}</h2>

          <dl className="result-grid">
            <div className="result-field">
              <dt>Class</dt>
              <dd>{className || '—'}</dd>
            </div>
            <div className="result-field">
              <dt>Award date</dt>
              <dd>{formatDate(awardDate)}</dd>
            </div>
            <div className="result-field full">
              <dt>Student email</dt>
              <dd>{studentEmail || '—'}</dd>
            </div>
            <div className="result-field full">
              <dt>Notes</dt>
              <dd>{specialNotes || '—'}</dd>
            </div>
          </dl>

          {imageUrl && (
            <div className="result-actions">
              <button type="button" className="btn-secondary" onClick={handlePrint}>
                Print certificate
              </button>
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="result-photo">
            <p className="result-photo-label">Certificate on file</p>
            <img src={imageUrl} alt={`Certificate ${certificateId} issued to ${studentName}`} />
          </div>
        )}
      </div>
    </div>
  )
}
