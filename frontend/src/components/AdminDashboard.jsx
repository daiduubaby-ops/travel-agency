import React, { useEffect, useState } from 'react'
import { getUser, getAuthHeaders } from '../utils/auth'
import './Dashboard.css'

const HOME_STATUS_OPTIONS = [
  { value: 'pending', label: 'Хүлээгдэж байна' },
  { value: 'confirmed', label: 'Баталгаажсан' },
  { value: 'on_the_way', label: 'Замдаа' },
  { value: 'completed', label: 'Дууссан' },
  { value: 'cancelled', label: 'Цуцлагдсан' },
]

const HOME_STATUS_LABELS = HOME_STATUS_OPTIONS.reduce((acc, cur) => {
  acc[cur.value] = cur.label
  return acc
}, {})

export default function AdminDashboard() {
  const user = getUser();
  const isAdminUser = !!(user?.role === 'admin' || user?.isAdmin)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')
  const [homeBookings, setHomeBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const pendingCount = homeBookings.filter(x => x.status === 'pending').length
  const unassignedCount = homeBookings.filter(x => !x.assigned_doctor_id).length

  function getLocalSampleBookings() {
    try {
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      return Array.isArray(local) ? local : []
    } catch {
      return []
    }
  }

  function getLocalHomeBookings() {
    try {
      const local = JSON.parse(localStorage.getItem('localHomeBookings') || '[]')
      return Array.isArray(local) ? local : []
    } catch {
      return []
    }
  }

  useEffect(() => {
    if (!isAdminUser) return
    loadBookings()
    loadHomeBookings()
  }, [isAdminUser])

  async function loadBookings() {
    setBookingsLoading(true)
    setBookingsError('')
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: getAuthHeaders()
      })
      const data = await res.json().catch(() => ([]))
      if (!res.ok) {
        setBookingsError(data.message || 'Хэрэглэгчийн захиалгууд унших үед алдаа гарлаа')
        setBookings(getLocalSampleBookings())
      } else {
        const serverRows = Array.isArray(data) ? data : []
        const localRows = getLocalSampleBookings()
        const merged = [...serverRows]
        for (const b of localRows) {
          if (!merged.some((m) => String(m.id) === String(b.id))) merged.push(b)
        }
        setBookings(merged)
      }
    } catch (e) {
      setBookingsError('Сүлжээний алдаа')
      setBookings(getLocalSampleBookings())
    } finally {
      setBookingsLoading(false)
    }
  }

  async function updateBookingStatus(item, status) {
    setBookingsError('')
    // local/sample bookings update in localStorage (no backend row)
    if (String(item.id).startsWith('local-') || String(item.id).startsWith('sample-') || String(item.gerId || '').startsWith('sample-')) {
      try {
        const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
        const updated = local.map((x) => String(x.id) === String(item.id) ? { ...x, status } : x)
        localStorage.setItem('sampleBookings', JSON.stringify(updated))
        setBookings(prev => prev.map(x => String(x.id) === String(item.id) ? { ...x, status } : x))
        setMsg('Локал захиалгын төлөв шинэчлэгдлээ')
      } catch {
        setBookingsError('Локал захиалга шинэчлэхэд алдаа гарлаа')
      }
      return
    }
    try {
      const res = await fetch(`/api/admin/bookings/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setBookingsError(data.message || 'Захиалгын төлөв шинэчлэх үед алдаа гарлаа')
        return
      }
      setBookings(prev => prev.map(x => x.id === data.id ? { ...x, ...data } : x))
      setMsg('Хэрэглэгчийн захиалгын төлөв шинэчлэгдлээ')
    } catch (e) {
      setBookingsError('Сүлжээний алдаа')
    }
  }

  async function cancelBooking(item) {
    setBookingsError('')
    // local/sample bookings cancel in localStorage (no backend row)
    if (String(item.id).startsWith('local-') || String(item.id).startsWith('sample-') || String(item.gerId || '').startsWith('sample-')) {
      try {
        const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
        const updated = local.map((x) => String(x.id) === String(item.id) ? { ...x, status: 'cancelled' } : x)
        localStorage.setItem('sampleBookings', JSON.stringify(updated))
        setBookings(prev => prev.map(x => String(x.id) === String(item.id) ? { ...x, status: 'cancelled' } : x))
        setMsg('Локал захиалга цуцлагдлаа')
      } catch {
        setBookingsError('Локал захиалга цуцлахад алдаа гарлаа')
      }
      return
    }
    try {
      const res = await fetch(`/api/admin/bookings/${item.id}/cancel`, {
        method: 'PUT',
        headers: getAuthHeaders()
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setBookingsError(data.message || 'Захиалга цуцлах үед алдаа гарлаа')
        return
      }
      setBookings(prev => prev.map(x => x.id === data.id ? { ...x, ...data } : x))
      setMsg('Захиалга цуцлагдлаа')
    } catch (e) {
      setBookingsError('Сүлжээний алдаа')
    }
  }

  async function loadHomeBookings() {
    setLoading(true)
    setError('')
    setMsg('')
    try {
      const res = await fetch('/api/admin/home-bookings', {
        headers: getAuthHeaders()
      })
      const data = await res.json().catch(() => ([]))
      if (!res.ok) {
        setError(data.message || 'Захиалгууд унших үед алдаа гарлаа')
        setHomeBookings(getLocalHomeBookings())
      } else {
        const serverRows = Array.isArray(data) ? data : []
        const localRows = getLocalHomeBookings()
        const merged = [...serverRows]
        for (const hb of localRows) {
          if (!merged.some((m) => String(m.id) === String(hb.id) || String(m.booking_number) === String(hb.booking_number))) {
            merged.push(hb)
          }
        }
        setHomeBookings(merged)
      }
    } catch (e) {
      setError('Сүлжээний алдаа')
      setHomeBookings(getLocalHomeBookings())
    } finally {
      setLoading(false)
    }
  }

  async function updateHomeStatus(item, status) {
    setMsg('')
    setError('')
    try {
      const res = await fetch(`/api/admin/home-bookings/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ status, admin_note: item.admin_note || '' })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Төлөв шинэчлэх үед алдаа гарлаа')
        return
      }
      setHomeBookings(prev => prev.map(x => x.id === data.id ? data : x))
      setMsg('Төлөв амжилттай шинэчлэгдлээ')
    } catch (e) {
      setError('Сүлжээний алдаа')
    }
  }

  async function assignGuide(item) {
    const guide = window.prompt('Томилох хөтөч/ажилтны нэр оруулна уу', item.assigned_doctor_id || '')
    if (!guide) return
    setMsg('')
    setError('')
    try {
      const res = await fetch(`/api/admin/home-bookings/${item.id}/assign-doctor`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ assigned_doctor_id: guide, admin_note: item.admin_note || '' })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Ажилтан томилох үед алдаа гарлаа')
        return
      }
      setHomeBookings(prev => prev.map(x => x.id === data.id ? data : x))
      setMsg('Ажилтан амжилттай томилогдлоо')
    } catch (e) {
      setError('Сүлжээний алдаа')
    }
  }

  async function saveAdminNote(item, value) {
    setHomeBookings(prev => prev.map(x => x.id === item.id ? { ...x, admin_note: value } : x))
    const currentStatus = item.status || 'pending'
    await updateHomeStatus({ ...item, admin_note: value }, currentStatus)
  }

  return (
    <div className="admin-dashboard-view">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>Захиалгын хяналт</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
           <div className="stat-card" style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
             Хүлээгдэж буй: <strong style={{ color: '#ef4444' }}>{pendingCount}</strong>
           </div>
           <div className="stat-card" style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
             Хөтөчгүй: <strong style={{ color: '#f59e0b' }}>{unassignedCount}</strong>
           </div>
        </div>
      </header>

      <section className="dashboard-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Хэрэглэгчийн ирсэн захиалгууд</h3>
          <button
            className="btn btn-primary"
            onClick={() => { if (!bookingsLoading) loadBookings() }}
            style={{
              minWidth: '140px',
              fontWeight: 700,
              fontSize: '14px',
              color: '#ffffff',
              background: '#2563eb',
              border: '1px solid #1d4ed8',
              opacity: 1
            }}
          >
            {bookingsLoading ? 'Шинэчилж байна...' : 'Шинэчлэх'}
          </button>
        </div>

        {bookingsLoading && <p className="loading-text">Уншиж байна…</p>}
        {bookingsError && <p className="error-text" style={{ color: '#ef4444' }}>{bookingsError}</p>}

        {!bookingsLoading && bookings.length === 0 && <p className="empty-text">Одоогоор хэрэглэгчийн захиалга байхгүй байна.</p>}
        {!bookingsLoading && bookings.length > 0 && (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Хэрэглэгч</th>
                  <th style={{ padding: '12px' }}>Гэр</th>
                  <th style={{ padding: '12px' }}>Огноо</th>
                  <th style={{ padding: '12px' }}>Нийт үнэ</th>
                  <th style={{ padding: '12px' }}>Төлөв</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>#{b.id}</td>
                    <td style={{ padding: '12px' }}>{b.user_name || b.userId}</td>
                    <td style={{ padding: '12px' }}>
                      <div>{b.program_title || b.ger_title || b.gerId}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>
                        {(b.programId || String(b.gerId || '').startsWith('sample-program-')) ? 'Аялал' : 'Гэр захиалга'}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(b.checkInDate).toISOString().slice(0, 10)} — {new Date(b.checkOutDate).toISOString().slice(0, 10)}
                    </td>
                    <td style={{ padding: '12px' }}>{b.totalPrice}</td>
                    <td style={{ padding: '12px' }}><strong>{b.status}</strong></td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <select
                          value={b.status || 'confirmed'}
                          onChange={(e) => updateBookingStatus(b, e.target.value)}
                          style={{ padding: '4px 6px' }}
                        >
                          <option value="confirmed">Баталгаажсан</option>
                          <option value="pending">Хүлээгдэж байна</option>
                          <option value="cancelled">Цуцлагдсан</option>
                        </select>
                        <button className="btn btn-sm" onClick={() => cancelBooking(b)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                          Цуцлах
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Ирсэн захиалгууд</h3>
          <button
            className="btn btn-primary"
            onClick={() => { if (!loading) loadHomeBookings() }}
            style={{
              minWidth: '140px',
              fontWeight: 700,
              fontSize: '14px',
              color: '#ffffff',
              background: '#2563eb',
              border: '1px solid #1d4ed8',
              opacity: 1
            }}
          >
            {loading ? 'Шинэчилж байна...' : 'Шинэчлэх'}
          </button>
        </div>

        {loading && <p className="loading-text">Уншиж байна…</p>}
        {error && <p className="error-text" style={{ color: '#ef4444' }}>{error}</p>}
        {msg && <p className="success-text" style={{ color: '#10b981' }}>{msg}</p>}

        {!loading && homeBookings.length === 0 && <p className="empty-text">Одоогоор захиалга байхгүй байна.</p>}
        {!loading && homeBookings.length > 0 && (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px' }}>Захиалга</th>
                  <th style={{ padding: '12px' }}>Хэрэглэгч</th>
                  <th style={{ padding: '12px' }}>Үйлчилгээ / Байршил</th>
                  <th style={{ padding: '12px' }}>Огноо</th>
                  <th style={{ padding: '12px' }}>Хөтөч</th>
                  <th style={{ padding: '12px' }}>Төлөв</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {homeBookings.map((hb) => (
                  <tr key={hb.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>#{hb.booking_number || hb.id.slice(-6)}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{hb.patient_name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{hb.phone}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>{hb.service_id}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{hb.address_text}</div>
                    </td>
                    <td style={{ padding: '12px' }}>{hb.preferred_date}</td>
                    <td style={{ padding: '12px' }}>{hb.assigned_doctor_id || '-'}</td>
                    <td style={{ padding: '12px' }}>
                      <span className={`status-badge status-${hb.status}`} style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background: hb.status === 'confirmed' ? '#dcfce7' : hb.status === 'pending' ? '#fef9c3' : '#f1f5f9',
                        color: hb.status === 'confirmed' ? '#166534' : hb.status === 'pending' ? '#854d0e' : '#475569'
                      }}>
                        {HOME_STATUS_LABELS[hb.status] || hb.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => updateHomeStatus(hb, 'confirmed')} style={{ padding: '4px 8px' }}>Тийм</button>
                        <button className="btn btn-sm" onClick={() => assignGuide(hb)} style={{ padding: '4px 8px' }}>Ажилтан</button>
                        <button className="btn btn-sm" onClick={() => updateHomeStatus(hb, 'cancelled')} style={{ padding: '4px 8px', color: '#ef4444' }}>Х</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
