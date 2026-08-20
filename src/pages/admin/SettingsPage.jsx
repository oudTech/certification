import { useEffect, useState } from 'react'
import { api, clearToken } from '../../lib/api.js'

export default function SettingsPage() {
  const [form, setForm] = useState(null)
  const [cohortInput, setCohortInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    api
      .getSettings()
      .then((data) => {
        if (alive) {
          setForm({
            ...data,
            cohorts: data.cohorts || [],
            award_dates: data.award_dates || [],
          })
        }
      })
      .catch((err) => {
        if (err.status === 401) {
          clearToken()
          window.location.href = '/admin/sign-in'
          return
        }
        if (alive) setError(err.message || 'Could not load settings')
      })
    return () => {
      alive = false
    }
  }, [])

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addCohort() {
    const value = cohortInput.trim()
    if (!value) return
    const cohorts = [...new Set([...(form.cohorts || []), value])]
    updateField('cohorts', cohorts)
    setCohortInput('')
  }

  function removeCohort(value) {
    updateField(
      'cohorts',
      (form.cohorts || []).filter((item) => item !== value)
    )
  }

  function addAwardDate() {
    const value = dateInput.trim()
    if (!value) return
    const award_dates = [...new Set([...(form.award_dates || []), value])].sort()
    updateField('award_dates', award_dates)
    setDateInput('')
  }

  function removeAwardDate(value) {
    updateField(
      'award_dates',
      (form.award_dates || []).filter((item) => item !== value)
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await api.updateSettings(form)
      setForm({
        ...updated,
        cohorts: updated.cohorts || [],
        award_dates: updated.award_dates || [],
      })
      setMessage('Settings saved')
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (!form && !error) {
    return <div className="empty-state">Loading settings…</div>
  }

  return (
    <div>
      <div className="page-heading">
        <div>
          <p className="breadcrumb">Admin / Settings</p>
          <h1>Site settings</h1>
          <p>Registry defaults, ID prefix, cohorts, and award dates.</p>
        </div>
      </div>

      {message && <div className="toast ok">{message}</div>}
      {error && <div className="toast err">{error}</div>}

      {form && (
        <form onSubmit={handleSubmit}>
          <section className="form-card">
            <div className="form-card-head">
              <h2>General</h2>
              <p>Public-facing site identity and contact details.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="sitename">Site name</label>
                <input
                  id="sitename"
                  className="admin-input"
                  value={form.sitename || ''}
                  onChange={(e) => updateField('sitename', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="site_title">Site title</label>
                <input
                  id="site_title"
                  className="admin-input"
                  value={form.site_title || ''}
                  onChange={(e) => updateField('site_title', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="site_url">Site URL</label>
                <input
                  id="site_url"
                  className="admin-input"
                  value={form.site_url || ''}
                  onChange={(e) => updateField('site_url', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="email_address">Support email</label>
                <input
                  id="email_address"
                  className="admin-input"
                  value={form.email_address || ''}
                  onChange={(e) => updateField('email_address', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-head">
              <h2>Certificate numbering</h2>
              <p>Prefix and digit length used when auto-generating new IDs.</p>
            </div>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="track_prefix">ID prefix</label>
                <input
                  id="track_prefix"
                  className="admin-input"
                  value={form.track_prefix || ''}
                  onChange={(e) => updateField('track_prefix', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="track_num">Numeric length</label>
                <input
                  id="track_num"
                  className="admin-input"
                  value={form.track_num || ''}
                  onChange={(e) => updateField('track_num', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="allow_print">Allow print</label>
                <select
                  id="allow_print"
                  className="admin-input"
                  value={form.allow_print || 'Yes'}
                  onChange={(e) => updateField('allow_print', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="email_name">Email from name</label>
                <input
                  id="email_name"
                  className="admin-input"
                  value={form.email_name || ''}
                  onChange={(e) => updateField('email_name', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-head">
              <h2>Cohorts</h2>
              <p>These appear as dropdown options when registering a certificate.</p>
            </div>
            <div className="inline-add">
              <input
                className="admin-input"
                placeholder="e.g. Node 25.1"
                value={cohortInput}
                onChange={(e) => setCohortInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addCohort()
                  }
                }}
              />
              <button type="button" className="btn-secondary" onClick={addCohort}>
                Add cohort
              </button>
            </div>
            <div className="chip-list">
              {(form.cohorts || []).map((cohort) => (
                <span className="chip" key={cohort}>
                  {cohort}
                  <button type="button" onClick={() => removeCohort(cohort)} aria-label={`Remove ${cohort}`}>
                    ×
                  </button>
                </span>
              ))}
              {!form.cohorts?.length && <span className="helper">No cohorts yet.</span>}
            </div>
          </section>

          <section className="form-card">
            <div className="form-card-head">
              <h2>Award dates</h2>
              <p>Saved dates for quick selection. Manual date pick is still available on the form.</p>
            </div>
            <div className="inline-add">
              <input
                type="date"
                className="admin-input"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={addAwardDate}>
                Add date
              </button>
            </div>
            <div className="chip-list">
              {(form.award_dates || []).map((date) => (
                <span className="chip" key={date}>
                  {date}
                  <button type="button" onClick={() => removeAwardDate(date)} aria-label={`Remove ${date}`}>
                    ×
                  </button>
                </span>
              ))}
              {!form.award_dates?.length && <span className="helper">No award dates yet.</span>}
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
