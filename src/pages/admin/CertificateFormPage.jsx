import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, clearToken } from '../../lib/api.js'
import { certificateImageUrl } from '../../lib/images.js'

const emptyForm = {
  certificateId: '',
  studentName: '',
  studentEmail: '',
  studentContact: '',
  className: '',
  awardDate: '',
  specialNotes: '',
  currentLocation: '',
  image: '',
}

export default function CertificateFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [settings, setSettings] = useState({ cohorts: [], award_dates: [], track_prefix: 'N251' })
  const [idMode, setIdMode] = useState('auto')
  const [dateMode, setDateMode] = useState('preset')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let alive = true

    async function boot() {
      try {
        const cfg = await api.getSettings()
        if (!alive) return
        setSettings(cfg)

        if (isEdit) {
          const cert = await api.getCertificate(id)
          if (!alive) return
          setForm({
            certificateId: cert.certificateId || '',
            studentName: cert.studentName || '',
            studentEmail: cert.studentEmail || '',
            studentContact: cert.studentContact || '',
            className: cert.className || '',
            awardDate: cert.awardDate || '',
            specialNotes: cert.specialNotes || '',
            currentLocation: cert.currentLocation || '',
            image: certificateImageUrl(cert.image || ''),
          })
          setIdMode('manual')
          const presets = cfg.award_dates || []
          setDateMode(cert.awardDate && presets.includes(cert.awardDate) ? 'preset' : 'manual')
        } else {
          setIdMode('auto')
          const next = await api.nextCertificateId()
          if (!alive) return
          setForm((prev) => ({ ...prev, certificateId: next.certificateId }))
        }
      } catch (err) {
        if (err.status === 401) {
          clearToken()
          window.location.href = '/admin/sign-in'
          return
        }
        if (alive) setError(err.message || 'Could not load form')
      } finally {
        if (alive) setLoading(false)
      }
    }

    boot()
    return () => {
      alive = false
    }
  }, [id, isEdit])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function regenerateId() {
    setGenerating(true)
    setError('')
    try {
      const next = await api.nextCertificateId()
      updateField('certificateId', next.certificateId)
    } catch (err) {
      setError(err.message || 'Could not generate ID')
    } finally {
      setGenerating(false)
    }
  }

  async function handleIdMode(mode) {
    setIdMode(mode)
    if (mode === 'auto' && !isEdit) {
      await regenerateId()
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const data = await api.uploadImage(file)
      updateField('image', certificateImageUrl(data.url || data.filename))
      setMessage('Image uploaded')
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      if (isEdit) {
        await api.updateCertificate(id, form)
        setMessage('Certificate updated')
      } else {
        const created = await api.createCertificate(form)
        setMessage('Certificate created')
        navigate(`/admin/certificates/${created.id}/edit`, { replace: true })
      }
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="empty-state">Loading certificate…</div>
  }

  const cohorts = settings.cohorts || []
  const awardDates = settings.award_dates || []
  const cohortOptions =
    form.className && !cohorts.includes(form.className)
      ? [form.className, ...cohorts]
      : cohorts
  const dateOptions =
    form.awardDate && !awardDates.includes(form.awardDate)
      ? [form.awardDate, ...awardDates]
      : awardDates

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Admin / Certificates / {isEdit ? 'Edit' : 'New'}</p>
          <h1>{isEdit ? 'Update certificate' : 'Register certificate'}</h1>
          <p>Use the form below to keep registry details accurate and printable.</p>
        </div>
        <Link to="/admin/certificates" className="btn-secondary">
          Back to list
        </Link>
      </div>

      {message && <div className="toast ok">{message}</div>}
      {error && <div className="toast err">{error}</div>}

      <form onSubmit={handleSubmit}>
        <section className="form-card">
          <div className="form-card-head">
            <h2>Student details</h2>
            <p>Core identity fields shown on the public verification result.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="certificateId">Certificate ID</label>
              {!isEdit && (
                <div className="id-mode-toggle" role="group" aria-label="Certificate ID mode">
                  <button
                    type="button"
                    className={idMode === 'auto' ? 'active' : ''}
                    onClick={() => handleIdMode('auto')}
                  >
                    Auto generate
                  </button>
                  <button
                    type="button"
                    className={idMode === 'manual' ? 'active' : ''}
                    onClick={() => handleIdMode('manual')}
                  >
                    Manual input
                  </button>
                </div>
              )}
              <div className="inline-add">
                <input
                  id="certificateId"
                  className="admin-input"
                  value={form.certificateId}
                  onChange={(e) => updateField('certificateId', e.target.value)}
                  placeholder={`${settings.track_prefix || 'N251'}-08-000000`}
                  required
                  readOnly={idMode === 'auto' && !isEdit}
                />
                {idMode === 'auto' && !isEdit && (
                  <button type="button" className="btn-secondary" onClick={regenerateId} disabled={generating}>
                    {generating ? '…' : 'Regenerate'}
                  </button>
                )}
              </div>
              <p className="helper">
                {idMode === 'auto' && !isEdit
                  ? `Uses prefix “${settings.track_prefix || 'N251'}” from Settings.`
                  : 'Unique registry ID printed on the certificate.'}
              </p>
            </div>
            <div className="field">
              <label htmlFor="studentName">Student name</label>
              <input
                id="studentName"
                className="admin-input"
                value={form.studentName}
                onChange={(e) => updateField('studentName', e.target.value)}
                placeholder="Jane Doe"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="studentEmail">Student email</label>
              <input
                id="studentEmail"
                type="email"
                className="admin-input"
                value={form.studentEmail}
                onChange={(e) => updateField('studentEmail', e.target.value)}
                placeholder="student@email.com"
              />
            </div>
            <div className="field">
              <label htmlFor="studentContact">Phone / contact</label>
              <input
                id="studentContact"
                className="admin-input"
                value={form.studentContact}
                onChange={(e) => updateField('studentContact', e.target.value)}
                placeholder="+234…"
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-head">
            <h2>Program & award</h2>
            <p>Pick from saved cohorts and award dates, or enter a custom date.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="className">Class / cohort</label>
              {cohortOptions.length > 0 ? (
                <select
                  id="className"
                  className="admin-input"
                  value={form.className}
                  onChange={(e) => updateField('className', e.target.value)}
                >
                  <option value="">Select a cohort</option>
                  {cohortOptions.map((cohort) => (
                    <option key={cohort} value={cohort}>
                      {cohort}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="className"
                  className="admin-input"
                  value={form.className}
                  onChange={(e) => updateField('className', e.target.value)}
                  placeholder="Node 25.1"
                />
              )}
              <p className="helper">
                Manage cohorts in <Link to="/admin/settings">Settings</Link>.
              </p>
            </div>
            <div className="field">
              <label htmlFor="awardDate">Award date</label>
              <div className="id-mode-toggle" role="group" aria-label="Award date mode">
                <button
                  type="button"
                  className={dateMode === 'preset' ? 'active' : ''}
                  onClick={() => setDateMode('preset')}
                >
                  Saved dates
                </button>
                <button
                  type="button"
                  className={dateMode === 'manual' ? 'active' : ''}
                  onClick={() => setDateMode('manual')}
                >
                  Manual date
                </button>
              </div>
              {dateMode === 'preset' && dateOptions.length > 0 ? (
                <select
                  id="awardDate"
                  className="admin-input"
                  value={form.awardDate}
                  onChange={(e) => updateField('awardDate', e.target.value)}
                >
                  <option value="">Select an award date</option>
                  {dateOptions.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="awardDate"
                  type="date"
                  className="admin-input"
                  value={form.awardDate}
                  onChange={(e) => updateField('awardDate', e.target.value)}
                />
              )}
              <p className="helper">
                {dateMode === 'preset'
                  ? 'Choose from dates saved in Settings, or switch to Manual date.'
                  : 'Pick any date with the calendar.'}
              </p>
            </div>
            <div className="field full">
              <label htmlFor="specialNotes">Notes</label>
              <textarea
                id="specialNotes"
                className="admin-input"
                rows={3}
                value={form.specialNotes}
                onChange={(e) => updateField('specialNotes', e.target.value)}
                placeholder="Performance notes, level, or remarks"
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-card-head">
            <h2>Certificate image</h2>
            <p>Upload the certificate file shown on the public checker and used for print.</p>
          </div>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="imageFile">Upload image</label>
              <input id="imageFile" type="file" accept="image/*" onChange={handleUpload} />
              <p className="helper">{uploading ? 'Uploading…' : 'PNG, JPG, or WEBP up to 8MB.'}</p>
            </div>
            <div className="field">
              <label htmlFor="imageUrl">Or image path / URL</label>
              <input
                id="imageUrl"
                className="admin-input"
                value={form.image}
                onChange={(e) => updateField('image', e.target.value)}
                placeholder="/certificates/filename.png"
              />
            </div>
            {form.image && (
              <div className="field full">
                <p className="helper" style={{ marginBottom: 8 }}>
                  Preview
                </p>
                <img
                  src={certificateImageUrl(form.image)}
                  alt="Certificate preview"
                  style={{ maxWidth: 360, borderRadius: 12, border: '1px solid var(--brand-border)' }}
                />
              </div>
            )}
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create certificate'}
          </button>
          <Link to="/admin/certificates" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
