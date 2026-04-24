import React, { useEffect, useState } from 'react'
import './Dashboard.css'

const HOME_STATUS_OPTIONS = [
  { value: 'pending', label: 'Хүлээгдэж байна' },
  { value: 'confirmed', label: 'Баталгаажсан' },
  { value: 'completed', label: 'Дууссан' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
]

const HOME_STATUS_LABELS = HOME_STATUS_OPTIONS.reduce((acc, cur) => {
  acc[cur.value] = cur.label
  return acc
}, {})

export default function Dashboard(){
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  const isAdmin = !!user?.isAdmin
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [homeBookings, setHomeBookings] = useState([])
  const [homeLoading, setHomeLoading] = useState(false)
  const [homeError, setHomeError] = useState('')
  const [homeMsg, setHomeMsg] = useState('')
  // Allow overriding API base during development (set VITE_API_URL in .env)
  const API = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    if(!user || isAdmin) return
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
  }, [user, isAdmin])

  useEffect(() => {
    if (!user || !isAdmin) return
    loadHomeBookings()
  }, [user, isAdmin])

  async function loadHomeBookings(){
    setHomeLoading(true)
    setHomeError('')
    setHomeMsg('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/home-bookings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await res.json().catch(() => ([]))
      if (!res.ok) {
        setHomeError(data.message || 'Гэр захиалгууд унших үед алдаа гарлаа')
        setHomeBookings([])
      } else {
        setHomeBookings(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setHomeError('Сүлжээний алдаа')
      setHomeBookings([])
    } finally {
      setHomeLoading(false)
    }
  }

  async function updateHomeStatus(item, status){
    setHomeMsg('')
    setHomeError('')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/admin/home-bookings/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, admin_note: item.admin_note || '' })
      })
      const data = await res.json().catch(() => ({}))
      if(!res.ok){
        setHomeError(data.message || 'Төлөв шинэчлэх үед алдаа гарлаа')
        return
      }
      setHomeBookings(prev => prev.map(x => x.id === data.id ? data : x))
      setHomeMsg('Төлөв шинэчлэгдлээ')
    } catch (e) {
      setHomeError('Сүлжээний алдаа')
    }


  async function saveAdminNote(item, value){
    setHomeBookings(prev => prev.map(x => x.id === item.id ? { ...x, admin_note: value } : x))
    const currentStatus = item.status || 'pending'
    await updateHomeStatus({ ...item, admin_note: value }, currentStatus)
  }

  if(!user) {
    return (
      <div className="dashboard">
        <div className="container">
          <h2>Дашбоард</h2>
          <p>Дашбоард үзэхийн тулд нэвтэрсэн байх шаардлагатай. <a href="/login">Нэвтрэх</a></p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="container">
        <h2>{isAdmin ? 'Админ хяналтын самбар' : `${user.name} -хяналтын самбар`}</h2>
        <p>И-мэйл: {user.email}</p>
        {isAdmin && (
          <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
            <button className="btn">Гэр захиалга</button>
            <a href="/admin/programs" className="btn">Админ: Аяллын хөтөлбөр</a>
          </div>
        )}

        {!isAdmin && (
        <section>
          <h3>Таны захиалгууд</h3>
          {loading && <p>Захиалгуудыг уншиж байна…</p>}
          {error && <p style={{color:'red'}}>{error}</p>}
          {!loading && bookings && bookings.length === 0 && <p>Танд ямар ч захиалга байхгүй байна.</p>}
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
        )}

        {isAdmin && (
          <section>
            <h3>Гэр захиалгууд</h3>
            {homeLoading && <p>Уншиж байна…</p>}
            {homeError && <p style={{color:'red'}}>{homeError}</p>}
            {homeMsg && <p style={{color:'#0b8457'}}>{homeMsg}</p>}

            {!homeLoading && homeBookings.length === 0 && <p>Одоогоор гэр захиалга байхгүй байна.</p>}
            {!homeLoading && homeBookings.length > 0 && (
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{textAlign:'left',borderBottom:'1px solid #e5e7eb'}}>
                      <th>ID</th>
                      <th>Утас</th>
                      <th>Хаяг</th>
                      <th>Үйлчилгээ</th>
                      <th>Огноо/цаг</th>
                      <th>Төлөв</th>
                      <th>Үйлдэл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeBookings.map((hb) => (
                      <tr key={hb.id} style={{borderBottom:'1px solid #f1f5f9',verticalAlign:'top'}}>
                        <td style={{padding:'8px 6px'}}>{hb.booking_number || hb.id}</td>
                        <td style={{padding:'8px 6px'}}>{hb.patient_name}</td>
                        <td style={{padding:'8px 6px'}}>{hb.phone}</td>
                        <td style={{padding:'8px 6px',maxWidth:170,whiteSpace:'pre-wrap'}}>{hb.address_text}</td>
                        <td style={{padding:'8px 6px'}}>{hb.service_id}</td>
                        <td style={{padding:'8px 6px'}}>{hb.preferred_date} {hb.preferred_time}</td>
                        <td style={{padding:'8px 6px'}}>{hb.assigned_doctor_id || '-'}</td>
                        <td style={{padding:'8px 6px'}}>{HOME_STATUS_LABELS[hb.status] || hb.status}</td>
                        <td style={{padding:'8px 6px',minWidth:220}}>
                          <div style={{display:'grid',gap:6}}>
                            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                              <button className="btn btn-ghost" onClick={() => updateHomeStatus(hb, 'confirmed')}>Баталгаажуулах</button>
                              <button className="btn btn-ghost" onClick={() => updateHomeStatus(hb, 'cancelled')}>Цуцлах</button>
                            </div>
                            <select value={hb.status || 'pending'} onChange={(e) => updateHomeStatus(hb, e.target.value)}>
                              {HOME_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <textarea
                              placeholder="Админ тэмдэглэл"
                              value={hb.admin_note || ''}
                              onChange={(e) => setHomeBookings(prev => prev.map(x => x.id === hb.id ? { ...x, admin_note: e.target.value } : x))}
                              onBlur={(e) => saveAdminNote(hb, e.target.value)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
}
