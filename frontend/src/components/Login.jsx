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
        <h2>Ger Camp руу нэвтрэх</h2>
        <form onSubmit={handleSubmit}>
          <label>
            И-мэйл
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          </label>

          <label>
            Нууц үг
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          </label>

          {error && <div className="error">{error}</div>}

          <div className="form-actions">
            <button className="btn" type="submit" disabled={loading}>{loading ? 'Нэвтрэж байна...' : 'Нэвтрэх'}</button>
          </div>
        </form>

        <p className="muted">Дансгүй юу? <a href="/register">Бүртгүүлэх</a></p>
      </div>
    </div>
  )
}
