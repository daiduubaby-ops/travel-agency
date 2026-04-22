import React, { useState, useEffect } from 'react'
import { getUser, isAdmin, logout } from '../utils/auth'
import './Nav.css'

export default function Nav() {
  const [user, setUser] = useState(getUser())
  const [isScrolled, setIsScrolled] = useState(false)
  const is_admin = isAdmin()

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }
    window.addEventListener('storage', onStorage)
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  function handleLogout() {
    logout()
  }

  return (
    <nav className={`site-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <div className="nav-left">
          <a className="brand" href="/" aria-label="home"></a>
        </div>

        <div className="nav-links">
          {/* Public Links */}
          <a href="/listings"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          </span>Гэр захиалах</a>
          <a href="/news"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H7L3 6v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><path d="M7 10h8M7 14h5"/></svg>
          </span>Мэдээ мэдээлэл</a>
          <a href="/programs"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>Аяллын хөтөлбөр</a>
          <a href="/rules"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M7 9h10M10 13h4"/></svg>
          </span>Аяллын журам</a>

          {/* User Only Links */}
          {user && !is_admin && (
            <>
              <a href="/booked"><span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </span>Захиалсан</a>
            </>
          )}

          {/* Admin Only Links */}
          {user && is_admin && (
            <>
              <a href="/admin"><span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </span>Админ самбар</a>
              <a href="/admin/programs"><span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>Аяллын удирдлага</a>
            </>
          )}

          {/* Account Profile / Login */}
          {user ? (
            <>
              <a href="/profile" className="profile-link" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <img src={user.avatar || ''} alt={user.name || 'U'} onError={(e) => { e.target.onerror = null; e.target.src = '' }} style={{ width: 26, height: 26, borderRadius: 9999, background: '#f1f3f5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#374151', objectFit: 'cover' }} />
                <span style={{ fontSize: 14, color: 'var(--text-dark,#0b1220)', fontWeight: 600 }}>{user.name}</span>
              </a>
              <button className="btn btn-ghost" onClick={handleLogout}>Гарах</button>
            </>
          ) : (
            <a className="btn btn-primary" href="/login">
              <span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
              </span>Нэвтрэх
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
