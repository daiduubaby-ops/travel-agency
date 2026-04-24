import React, { useEffect, useMemo, useState } from 'react'
import formatMNT from '../utils/formatCurrency'

const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'approved', 'confirmed', 'paid'])

function getToken(){
  return localStorage.getItem('token')
}

function eachDateBetween(startIso, endIso){
  if(!startIso || !endIso) return []
  const start = new Date(startIso)
  const end = new Date(endIso)
  if(Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
  const dates = []
  for(
    let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    cur < end;
    cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1))
  ){
    dates.push(cur.toISOString().slice(0,10))
  }
  return dates
}

function bookingIsActive(booking){
  const status = String(booking?.status || 'pending').toLowerCase()
  return ACTIVE_BOOKING_STATUSES.has(status)
}

function parseBookingTarget(){
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id')
  let selectedDates = []

  const items = params.get('items')
  if(items){
    const first = decodeURIComponent(items).split('|')[0] || ''
    const [itemId, datesRaw = ''] = first.split(':')
    if(itemId) id = itemId
    selectedDates = datesRaw.split(',').map(x => x.trim()).filter(Boolean).sort()
  }

  if(!id){
    const parts = window.location.pathname.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    if(last && !['book', 'booking'].includes(last.toLowerCase())) id = last
  }

  return { id, selectedDates }
}

export default function Booking(){
  const target = useMemo(() => parseBookingTarget(), [])
  const id = target.id

  const [ger, setGer] = useState(null)
  const [checkIn, setCheckIn] = useState(target.selectedDates[0] || '')
  const [checkOut, setCheckOut] = useState(() => {
    if(target.selectedDates.length === 0) return ''
    const last = new Date(target.selectedDates[target.selectedDates.length - 1])
    last.setUTCDate(last.getUTCDate() + 1)
    return last.toISOString().slice(0,10)
  })
  const [bookedDates, setBookedDates] = useState([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadBookedDates(gerId){
    try{
      const res = await fetch(`/api/gers/${gerId}/bookings`)
      const data = await res.json().catch(() => [])
      if(!res.ok) return

      const dates = []
      ;(Array.isArray(data) ? data : []).forEach(b => {
        if(!bookingIsActive(b)) return
        dates.push(...eachDateBetween(b.checkInDate || b.check_in_date || b.startDate, b.checkOutDate || b.check_out_date || b.endDate))
      })
      setBookedDates(Array.from(new Set(dates)))
    }catch(err){
      console.error(err)
    }
  }

  useEffect(() => {
    if(!id) return

    async function load(){
      setMessage('')
      try{
        const res = await fetch(`/api/gers/${id}`)
        const data = await res.json().catch(() => ({}))
        if(res.ok){
          setGer({
            ...data,
            pricePerNight: Number(data.pricePerNight || data.price || 0)
          })
          await loadBookedDates(id)
        } else {
          setMessage(data.message || 'Listing not found')
        }
      }catch(err){
        console.error(err)
        setMessage('Error loading listing')
      }
    }

    load()
  }, [id])

  const selectedDates = useMemo(() => eachDateBetween(checkIn, checkOut), [checkIn, checkOut])
  const hasBookedDate = selectedDates.some(d => bookedDates.includes(d))
  const invalidRange = !!checkIn && !!checkOut && new Date(checkOut) <= new Date(checkIn)

  async function handleBook(e){
    e.preventDefault()
    setMessage('')

    if(!id){
      setMessage('Гэр сонгогдоогүй байна')
      return
    }
    if(invalidRange){
      setMessage('Гарах өдөр нь ирэх өдрөөс хойш байх ёстой')
      return
    }
    if(hasBookedDate){
      setMessage('Сонгосон хугацаанд захиалгатай өдөр байна. Өөр өдөр сонгоно уу.')
      return
    }

    const token = getToken()
    if(!token){
      setMessage('Захиалга хийхийн тулд эхлээд нэвтэрнэ үү')
      return
    }

    setLoading(true)
    try{
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gerId: id,
          checkInDate: checkIn,
          checkOutDate: checkOut
        })
      })
      const data = await res.json().catch(() => ({}))
      if(!res.ok){
        setMessage(data.message || 'Booking failed')
      } else {
        setMessage('Захиалга амжилттай илгээгдлээ!')
        await loadBookedDates(id)
        setTimeout(() => window.location.href = '/booked?success=1', 900)
      }
    }catch(err){
      console.error(err)
      setMessage('Сүлжээний алдаа')
    }finally{
      setLoading(false)
    }
  }

  if(!id){
    return (
      <div className="container">
        <p>Ямар нэгэн жагсаалт сонгогдоогүй байна. Буцах: <a href="/listings">жагсаалт</a>.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <h2>Гэр захиалах</h2>

      {ger && (
        <div className="listing">
          {Array.isArray(ger.images) && ger.images[0] ? (
            <img src={ger.images[0]} alt={ger.title} style={{width:180,height:120,objectFit:'cover',borderRadius:10}} />
          ) : (
            <div className="listing-img" />
          )}
          <div className="listing-body">
            <h3>{ger.title}</h3>
            <p>{ger.location} — {formatMNT(ger.pricePerNight)} / шөнө</p>
          </div>
        </div>
      )}

      <form onSubmit={handleBook} style={{maxWidth:420}}>
        <label>
          Ирэх огноо
          <input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} required />
        </label>

        <label>
          Гарах огноо
          <input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} required />
        </label>

        {bookedDates.length > 0 && (
          <div style={{marginTop:8,padding:8,border:'1px solid #fecaca',borderRadius:8,background:'#fef2f2'}}>
            <strong>Захиалгатай өдрүүд:</strong>{' '}
            {bookedDates.slice(0,12).join(', ')}
            {bookedDates.length > 12 ? ' ...' : ''}
          </div>
        )}

        {hasBookedDate && (
          <div style={{marginTop:8,color:'#dc2626'}}>
            Сонгосон хугацаанд захиалгатай өдөр орсон байна.
          </div>
        )}

        {message && <div style={{marginTop:8}}>{message}</div>}

        <div style={{marginTop:12}}>
          <button className="btn" type="submit" disabled={loading || invalidRange || hasBookedDate}>
            {loading ? 'Илгээж байна...' : hasBookedDate ? 'Захиалгатай' : 'Захиалгаа батлах'}
          </button>
        </div>
      </form>
    </div>
  )
}
