import React, { useEffect, useState } from 'react'

export default function Booking(){
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id')
  // Defensive: also accept id as last path segment (e.g. /booking/sample-ger-1 or /book/sample-ger-1)
  if(!id){
    const parts = window.location.pathname.split('/').filter(Boolean)
    // last segment may be an id when path is like /book or /booking
    const last = parts[parts.length - 1]
    // ignore generic route names
    if(last && !['book', 'booking'].includes(last.toLowerCase())) id = last
  }

  const [ger, setGer] = useState(null)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if(!id) return
    async function load(){
      try{
        const res = await fetch(`/api/gers/${id}`)
        if(res.ok){
          const data = await res.json()
          setGer(data)
        } else {
          // If the listing is a client-side sample item (created in Listings.jsx)
          // try to resolve it from localStorage so users can view listings they
          // booked from the sample inventory.
          try{
            const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
            const booking = local.find(b => b.gerId === id)
            if(booking){
              // derive a minimal ger object from the stored booking
              const nights = Math.max(1, Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000*60*60*24)))
              const pricePerNight = booking.totalPrice ? Math.round(booking.totalPrice / nights) : 0
              setGer({ id: booking.gerId, title: booking.ger_title || 'Sample listing', location: booking.ger_location || 'Sample', pricePerNight })
              return
            }
          }catch(e){/* ignore */}
          setMessage('Listing not found')
        }
      }catch(err){
        console.error(err)
        setMessage('Error loading listing')
      }
    }
    load()
  }, [id])

  async function handleBook(e){
    e.preventDefault()
    setMessage('')
    try{
      const token = localStorage.getItem('token')
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ gerId: id, checkInDate: checkIn, checkOutDate: checkOut })
      })
      const data = await res.json()
      if(!res.ok) setMessage(data.message || 'Booking failed')
      else {
        setMessage('Booking confirmed!')
        // redirect to dashboard or bookings page
        setTimeout(() => window.location.href = '/booked', 1200)
      }
    }catch(err){
      console.error(err)
      setMessage('Network error')
    }
  }

  if(!id) {
    // As a final fallback, if user has exactly one sample booking, open that listing
    try{
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      const localForUser = local.filter(b => !userId || b.userId === userId)
      if(localForUser.length === 1){
        id = localForUser[0].gerId
      }
    }catch(e){/* ignore */}
  }

  if(!id) return <div className="container"><p>No listing selected. Go back to <a href="/listings">listings</a>.</p></div>

  return (
    <div className="container">
      <h2>Book Ger</h2>
      {ger && (
        <div className="listing">
          <div className="listing-img" />
          <div className="listing-body">
            <h3>{ger.title}</h3>
            <p>{ger.location} — ${ger.pricePerNight} / night</p>
          </div>
        </div>
      )}

      <form onSubmit={handleBook} style={{maxWidth:400}}>
        <label>
          Check-in
          <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} required />
        </label>

        <label>
          Check-out
          <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} required />
        </label>

        {message && <div style={{marginTop:8}}>{message}</div>}

        <div style={{marginTop:12}}>
          <button className="btn" type="submit">Confirm Booking</button>
        </div>
      </form>
    </div>
  )
}
