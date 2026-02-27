import React, { useState, useEffect } from 'react'
import './Nav.css'

export default function Nav(){
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch (e) {
      return null
    }
  })

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }
    window.addEventListener('storage', onStorage)
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // cleanup for scroll listener on unmount
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // redirect to home
    window.location.href = '/'
  }

  return (
    <nav className={`site-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a className="brand" href="/">Ger Camp</a>

        <div className="nav-links">
          <a href="/listings">Listings</a>
          <a href="/host">Host a Ger</a>
          {user && (
            <>
              <a href="/booked">Booked</a>
              <a href="/dashboard">Dashboard</a>
            </>
          )}

          {!user && (
            <a className="btn" href="/login">Login</a>
          )}

          {user && (
            <>
              <span className="user-name">Hi, {user.name}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
