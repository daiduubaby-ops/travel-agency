import React, { useEffect, useState } from 'react'
import './Dashboard.css'

export default function Dashboard(){
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Allow overriding API base during development (set VITE_API_URL in .env)
  const API = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    if(!user) return
    async function load(){
      setLoading(true)
      setError('')
      try{
        const token = localStorage.getItem('token')
        // Use configured API base (falls back to proxy when empty)
        const url = `${API}/api/bookings/my`
        console.debug('[Dashboard] fetching bookings from', url, 'tokenPresent=', !!token)
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if(!res.ok){
          const data = await res.json()
          setError(data.message || 'Failed to load bookings')
          setBookings([])
        } else {
          const data = await res.json()
          // merge with any local sample bookings stored by Listings
          const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
          const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
          const localForUser = local.filter(b => !userId || b.userId === userId)
          setBookings([...data, ...localForUser])
        }
      }catch(err){
        console.error(err)
        setError('Network error')
        setBookings([])
      }finally{ setLoading(false) }
    }
    load()
  }, [user])

  if(!user) {
    return (
      <div className="dashboard">
        <div className="container">
          <h2>Dashboard</h2>
          <p>You must be signed in to view the dashboard. <a href="/login">Sign in</a></p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h2>{user.name}'s Dashboard</h2>
        <p>Email: {user.email}</p>
        <section>
          <h3>Your bookings</h3>
          {loading && <p>Loading bookings…</p>}
          {error && <p style={{color:'red'}}>{error}</p>}
          {!loading && bookings && bookings.length === 0 && <p>You have no bookings.</p>}
          {!loading && bookings && bookings.length > 0 && (
            <div className="bookings-list">
              {bookings.map(b => (
                <div key={b.id} className="listing small" style={{marginBottom:8}}>
                  <div className="listing-body">
                    <h4 style={{margin:'0 0 4px 0'}}>{b.ger_title}</h4>
                    <div style={{color:'#6b7280',fontSize:13}}>{b.ger_location} — ${b.totalPrice} — <strong>{b.status}</strong></div>
                    <div style={{fontSize:13,marginTop:6}}>From {new Date(b.checkInDate).toISOString().slice(0,10)} to {new Date(b.checkOutDate).toISOString().slice(0,10)}</div>
                    <div style={{marginTop:6}}><a href={`/booking?id=${b.gerId}`}>View listing</a></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
