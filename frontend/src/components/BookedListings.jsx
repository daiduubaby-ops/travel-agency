import React, { useEffect, useState } from 'react'
import formatMNT from '../utils/formatCurrency'

export default function BookedListings(){
  const [bookings, setBookings] = useState([])
  const [homeBookings, setHomeBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [justBooked, setJustBooked] = useState('')

  const LOCAL_HOME_BOOKINGS_KEY = 'localHomeBookings'

  const cancelBtnStyle = {
    background: '#dc2626',
    color: '#fff',
    border: '1px solid #b91c1c'
  }

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
    if(!token){ setError('Захиалгыг цуцлахын тулд нэвтэрсэн байх шаардлагатай'); return }
    try{
      const res = await fetch(`/api/bookings/${booking.id}/cancel`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if(!res.ok){ setError(data.message || 'Захиалгыг цуцлахад амжилтгүй боллоо') }
      else {
        // replace booking in list with updated one
        setBookings(prev => prev.map(b => b.id === data.id ? data : b))
      }
    }catch(err){
      console.error(err)
      setError('Сүлжээний алдаа')
    }
  }

  useEffect(() => {
    // detect success query param when arriving from Programs
    try{
      const params = new URLSearchParams(window.location.search)
      if(params.get('success')){
        const added = params.get('added')
        setJustBooked(added || '1')
        // remove query params from URL without reloading
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, document.title, url.toString())
      }
    }catch(e){/* ignore */}

    async function load(){
      setLoading(true)
      setError('')
      // Load client-side sample bookings first (they may reference sample ger ids)
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      const localHome = JSON.parse(localStorage.getItem(LOCAL_HOME_BOOKINGS_KEY) || '[]')
      const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      const localForUser = local.filter(b => !userId || b.userId === userId)
      const localHomeForUser = localHome.filter(b => !userId || b.userId === userId)
      setHomeBookings(localHomeForUser)
      try{
        const token = localStorage.getItem('token')
        if(!token){
          // no auth: show local bookings only
          setBookings(localForUser)
          return
        }
        const res = await fetch('/api/bookings/my', { headers: { Authorization: `Bearer ${token}` } })
        if(!res.ok){
          try{ const data = await res.json(); setError(data.message || 'Захиалгыг уншихад алдаа гарлаа') } catch(e){ setError('Захиалгыг уншихад алдаа гарлаа') }
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
        setError('Сүлжээний алдаа')
        setBookings(localForUser)
      }finally{ setLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="container">
      <h2>Таны захиалсан жагсаалт</h2>
      {loading && <p>Уншиж байна…</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
      {!loading && bookings.length === 0 && homeBookings.length === 0 && <p>Танд ямар ч захиалга байхгүй байна.</p>}
      {justBooked && (
        <p style={{color:'green',background:'#ecfdf5',padding:8,borderRadius:6}}>Захиалга амжилттай нэмэгдлээ.</p>
      )}

      {!loading && bookings.length > 0 && (
        <>
          <h3 style={{marginTop:16}}>Байр / Аяллын захиалга</h3>
          <div style={{display:'grid',gap:12}}>
            {bookings.map(b => {
              const isProgramBooking = String(b.gerId || '').startsWith('sample-program-')
              const statusLower = String(b.status || '').toLowerCase()
              const canCancel = statusLower !== 'cancelled' && statusLower !== 'цуцлагдсан'
              const programId = isProgramBooking ? String(b.gerId).replace('sample-program-', '') : null
              return (
                <div key={b.id} className="listing small">
                  <div className="listing-body">
                    <h4 style={{margin:'0 0 4px 0'}}>{b.ger_title}</h4>
                    <div style={{color:'#6b7280',fontSize:13}}>
                      {b.ger_location || '—'} — {formatMNT(b.totalPrice || 0)} — <strong>{b.status}</strong>
                    </div>
                    <div style={{fontSize:13,marginTop:6}}>Төрөл: {isProgramBooking ? 'Аяллын захиалга' : 'Байр захиалга'}</div>
                    {b.checkInDate && b.checkOutDate && (
                      <div style={{fontSize:13,marginTop:6}}>
                        Эхлэх: {new Date(b.checkInDate).toISOString().slice(0,10)} — Дуусах: {new Date(b.checkOutDate).toISOString().slice(0,10)}
                      </div>
                    )}
                    <div style={{marginTop:6}}>
                      <a href={isProgramBooking && programId ? `/programs/${programId}` : `/booking?id=${b.gerId}`}>
                        {isProgramBooking ? 'Аяллыг үзэх' : 'Жагсаалтыг үзэх'}
                      </a>
                    </div>
                    {canCancel && (
                      <div style={{marginTop:8}}>
                        <button className="btn" style={cancelBtnStyle} onClick={() => handleCancel(b)}>Цуцлах</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {!loading && homeBookings.length > 0 && (
        <>
          <h3 style={{marginTop:20}}>Гэрийн үйлчилгээний захиалга</h3>
          <div style={{display:'grid',gap:12}}>
            {homeBookings.map(hb => (
              <div key={hb.id} className="listing small">
                <div className="listing-body">
                  <h4 style={{margin:'0 0 4px 0'}}>#{hb.booking_number || hb.id}</h4>
                  <div style={{color:'#6b7280',fontSize:13}}>
                    {hb.patient_name || '—'} — <strong>{hb.status || 'pending'}</strong>
                  </div>
                  <div style={{fontSize:13,marginTop:6}}>Үйлчилгээ: {hb.service_id || '—'}</div>
                  <div style={{fontSize:13,marginTop:6}}>Өдөр/цаг: {hb.preferred_date || '—'} {hb.preferred_time || ''}</div>
                  {hb.address_text && <div style={{fontSize:13,marginTop:6}}>Хаяг: {hb.address_text}</div>}
                  {hb.admin_note && <div style={{fontSize:13,marginTop:6}}>Тэмдэглэл: {hb.admin_note}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
