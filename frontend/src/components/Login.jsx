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
        // store token and redirect to Home
        if(data.token) localStorage.setItem('token', data.token)
        if(data.user) localStorage.setItem('user', JSON.stringify(data.user))
        // attempt to publish any locally-saved admin news after login
        try{
          const pending = JSON.parse(localStorage.getItem('newsCards') || '[]')
          // only try if there are pending items and user is admin
          if(Array.isArray(pending) && pending.length && data.user?.role === 'admin'){
            // post pending items in background (fire-and-forget)
            ;(async ()=>{
              for(const p of pending){
                try{
                  const token = data.token
                  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                  const res = await fetch('/api/admin/news', { method: 'POST', headers, body: JSON.stringify({ title: p.title, img: p.img, date: p.date, desc: p.desc }) })
                  if(res.ok){
                    // remove item locally by filtering existing storage
                    const current = JSON.parse(localStorage.getItem('newsCards') || '[]')
                    const filtered = current.filter(x => !(x.title === p.title && x.date === p.date))
                    localStorage.setItem('newsCards', JSON.stringify(filtered))
                  }
                }catch(e){ console.error('retry publish failed', e) }
              }
            })()
          }
        }catch(e){/* ignore */}
        if (data.user?.role === 'admin') {
          window.location.href = '/admin'
        } else {
          window.location.href = '/'
        }
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
        <h2>Нэвтрэх</h2>
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

        <p className="muted">Та бүртгэлгүй юу? <a href="/register">Бүртгүүлэх</a></p>
      </div>
    </div>
  )
}
