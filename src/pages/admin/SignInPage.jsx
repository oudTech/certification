import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '../../lib/api.js'

export default function SignInPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (getToken()) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(username.trim(), password)
      setToken(data.token)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <Link to="/">
          <img src="/brand/oudtech-logo.svg" alt="OudTech" />
        </Link>
        <div className="auth-visual-copy">
          <h2>
            Certificates Portal
            <br />
          </h2>
          <p>
            Manage certificates, keep the registry accurate, and verify every award Oud Technologies
            issues.
          </p>
        </div>
      </aside>

      <div className="auth-panel-wrap">
        <div className="auth-panel">
          <p className="auth-kicker">Sign in</p>
          <h1 className="auth-title">
            Welcome back,<span> Admin</span>
          </h1>
          <p className="auth-subtitle">Admins only — sign in to manage the certificate registry.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <p className="auth-error">{error}</p>}

            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                className="admin-input"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="field">
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                <span className="hint">Minimum 8 characters</span>
              </div>
              <div className="password-wrap">
                <input
                  id="password"
                  className="admin-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Continue'}
              {!loading && <span aria-hidden="true">→</span>}
            </button>

            <p className="auth-meta">
              Looking for the public checker? <Link to="/">Verify a certificate</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
