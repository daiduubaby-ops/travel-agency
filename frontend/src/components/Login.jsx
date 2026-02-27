import React, { useState } from 'react'
import './Login.css'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e){
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if(!res.ok) {
        setError(data.message || 'Login failed')
      } else {
        // store token and redirect
        if(data.token) localStorage.setItem('token', data.token)
        if(data.user) localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = '/listings'
      }
    }catch(err){
      console.error(err)
      setError('Network error')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <h2>Sign in to Ger Camp</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          </div>
        </form>

        <p className="muted">Don't have an account? <a href="/register">Register</a></p>
      </div>
    </div>
  )
}
