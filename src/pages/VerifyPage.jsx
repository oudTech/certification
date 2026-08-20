import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api.js'
import CertificateResult from '../components/CertificateResult.jsx'

export default function VerifyPage() {
  const [certId, setCertId] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [queriedId, setQueriedId] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = certId.trim()
    if (!trimmed) {
      setError('Enter a certificate ID to continue.')
      return
    }

    setError('')
    setStatus('loading')
    setResult(null)

    try {
      const match = await api.lookup(trimmed)
      setQueriedId(trimmed.toUpperCase())
      setResult(match)
      setStatus('done')
    } catch (err) {
      setQueriedId(trimmed.toUpperCase())
      setResult(null)
      setStatus('done')
      if (err.status !== 404) {
        setError(err.message || 'Lookup failed. Please try again.')
      }
    }
  }

  return (
    <div className="public-shell">
      <header className="public-header">
        <a className="public-brand" href="#/">
          <img src="/brand/oudtech-logo.svg" alt="OudTech" />
        </a>
        <nav className="public-nav">
          <a href="https://academy.oudtechnologies.com">Go to Academy</a>
         
        </nav>
      </header>

      <section className="public-hero">
        <p className="eyebrow">Certificate authenticity</p>
        <h1>
          Confirm a certificate is <span>genuinely ours</span>.
        </h1>
        <p>
          Every certificate Oud Technologies issues is logged in our registry under a unique ID.
          Enter that ID to confirm the student, class, and award date on file.
        </p>
      </section>

      <main className="public-main">
        <div className="checker-card">
          <div className="checker-card-head">
            <h2>Look up a certificate</h2>
            <span>Registry search</span>
          </div>

          <form className="check-form" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="certId">Certificate ID</label>
              <input
                id="certId"
                name="certId"
                type="text"
                placeholder="e.g. N251-08-076982"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <button type="submit" className="btn-primary" disabled={status === 'loading'} style={{ alignSelf: 'end' }}>
              {status === 'loading' ? 'Checking…' : 'Check certificate'}
            </button>
          </form>

          {error && <p className="form-error">{error}</p>}

          <p className="form-hint">
            Try a sample record:{' '}
            
            <button type="button" onClick={() => setCertId('N251-08-640935')}>
              N251-08-640935
            </button>
          </p>

          {status === 'done' && (
            <div className="result-wrap">
              <CertificateResult certificate={result} queriedId={queriedId} />
            </div>
          )}
        </div>
      </main>

      <section className="how-strip">
        <div className="how-strip-inner">
          <div className="how-item">
            <span>01</span>
            <h3>Find the ID</h3>
            <p>Every certificate carries an ID in the format N251-XX-XXXXXX, printed near the seal.</p>
          </div>
          <div className="how-item">
            <span>02</span>
            <h3>Search the registry</h3>
            <p>We match it against the official record — student, class, and the date it was awarded.</p>
          </div>
          <div className="how-item">
            <span>03</span>
            <h3>Read the result</h3>
            <p>A verified match shows the registry details. No match means the ID is not on file with us.</p>
          </div>
        </div>
      </section>

      <footer className="public-footer">
        <span>© {new Date().getFullYear()} <a href="https://www.oudtechnologies.com">Oud Technologies</a></span>
        <span><a href="mailto:support@oudtechnologies.com" className="btn-primary">Contact us</a></span>
      </footer>
    </div>
  )
}
