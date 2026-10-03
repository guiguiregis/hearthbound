import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function Register() {
  const { user, ready, register } = useAuth()
  const navigate = useNavigate()
  const checkedExisting = useRef(false)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!ready || checkedExisting.current) return
    checkedExisting.current = true
    if (user) navigate('/characters', { replace: true })
  }, [ready, user, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register(username.trim(), password, displayName.trim() || undefined)
      navigate('/create')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="section" style={{ marginTop: 0 }}>
      <h1 className="section-title">Create account</h1>
      <p className="section-support">
        Make a free player account so your party can each keep their own character sheets.
      </p>
      <form className="panel form-grid" onSubmit={onSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            placeholder="nyx_quick"
          />
        </label>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="nickname"
            placeholder="Optional"
          />
        </label>
        <label className="full">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />
        </label>
        {error && <p className="dice-error full">{error}</p>}
        <div className="actions-row full">
          <Link className="ghost-btn" to="/login">
            Already have an account?
          </Link>
          <button className="primary-btn" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </section>
  )
}
