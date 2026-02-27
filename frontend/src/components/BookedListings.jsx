import React, { useEffect, useState } from 'react'

export default function BookedListings(){
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel(booking){
    setError('')
    // If this is a client-side sample booking, remove from localStorage
    try{
      if(String(booking.id).startsWith('sample') || String(booking.gerId).startsWith('sample')){
        const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
        const updated = local.filter(b => b.id !== booking.id)
        localStorage.setItem('sampleBookings', JSON.stringify(updated))
        setBookings(prev => prev.filter(b => b.id !== booking.id))
        return
      }
    }catch(e){/* ignore */}

    // Server-side booking: call cancel endpoint
    const token = localStorage.getItem('token')
    if(!token){ setError('You must be logged in to cancel bookings'); return }
    try{
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if(!res.ok){ setError(data.message || 'Failed to cancel booking') }
      else {
        // replace booking in list with updated one
        setBookings(prev => prev.map(b => b.id === data.id ? data : b))
      }
    }catch(err){
      console.error(err)
      setError('Network error')
    }
  }

  useEffect(() => {
    async function load(){
      setLoading(true)
      setError('')
      // Load client-side sample bookings first (they may reference sample ger ids)
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      const localForUser = local.filter(b => !userId || b.userId === userId)
      try{
        const token = localStorage.getItem('token')
        if(!token){
          // no auth: show local bookings only
          setBookings(localForUser)
          return
        }
        const res = await fetch('/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } })
        if(!res.ok){
          try{ const data = await res.json(); setError(data.message || 'Failed to load bookings') } catch(e){ setError('Failed to load bookings') }
          // still show local ones
          setBookings(localForUser)
        } else {
          const data = await res.json()
          // The backend returns bookings tied to real gers (numeric ids). Client-side sample bookings
          // use synthetic ids like "sample-ger-1" and won't match any backend ger. We should merge both
          // but ensure sample bookings are preserved.
          const merged = [...data]
          // keep sample bookings not present in backend response
          for(const b of localForUser){
            if(!merged.some(m => m.id === b.id)) merged.push(b)
          }
          setBookings(merged)
        }
      }catch(err){
        console.error(err)
        setError('Network error')
        setBookings(localForUser)
      }finally{ setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="container">
      <h2>Your booked listings</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && bookings && bookings.length === 0 && <p>You have no bookings.</p>}
      {!loading && bookings && bookings.length > 0 && (
        <div style={{display:'grid',gap:12}}>
          {bookings.map(b => (
            <div key={b.id} className="listing small">
              <div className="listing-body">
                <h4 style={{margin:'0 0 4px 0'}}>{b.ger_title}</h4>
                <div style={{color:'#6b7280',fontSize:13}}>{b.ger_location} — ${b.totalPrice} — <strong>{b.status}</strong></div>
                <div style={{fontSize:13,marginTop:6}}>From {new Date(b.checkInDate).toISOString().slice(0,10)} to {new Date(b.checkOutDate).toISOString().slice(0,10)}</div>
                <div style={{marginTop:6}}><a href={`/booking?id=${b.gerId}`}>View listing</a></div>
                {b.status === 'confirmed' && (
                  <div style={{marginTop:8}}>
                    <button className="btn" onClick={() => handleCancel(b)}>Cancel booking</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
