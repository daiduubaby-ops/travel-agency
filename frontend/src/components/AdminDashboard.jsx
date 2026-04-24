import React, { useEffect, useState } from 'react'
import { getUser, getAuthHeaders } from '../utils/auth'
import './Dashboard.css'

const BOOKING_STATUS_LABELS = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  cancelled: 'Цуцлагдсан',
  completed: 'Дууссан'
}

export default function AdminDashboard() {
  const user = getUser()
  const isAdminUser = !!(user?.role === 'admin' || user?.isAdmin)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)
  const [bookingsError, setBookingsError] = useState('')
  const [bookingsMsg, setBookingsMsg] = useState('')

  function getLocalSampleBookings() {
    try {
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      return Array.isArray(local) ? local : []
    } catch {
      return []
    }
  }

  useEffect(() => {
    if (!isAdminUser) return
    loadBookings()
  }, [isAdminUser])

  function normalizeSampleBooking(item) {
    const isProgram = String(item?.gerId || '').startsWith('sample-program-')
    return {
      ...item,
      user_name: item.user_name || '-',
      ger_title: isProgram ? null : (item.ger_title || '-'),
      program_title: isProgram ? (item.ger_title || 'Аялал') : null,
      status: item.status || 'confirmed'
    }
  }

  async function loadBookings() {
    setBookingsLoading(true)
    setBookingsError('')
    setBookingsMsg('')
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: getAuthHeaders()
      })
      const data = await res.json().catch(() => ([]))
      if (!res.ok) {
        setBookingsError(data.message || 'Хэрэглэгчийн захиалгууд унших үед алдаа гарлаа')
        setBookings(getLocalSampleBookings().map(normalizeSampleBooking))
      } else {
        const serverRows = Array.isArray(data) ? data : []
        const localRows = getLocalSampleBookings().map(normalizeSampleBooking)
        const merged = [...serverRows]
        for (const row of localRows) {
          if (!merged.some((m) => String(m.id) === String(row.id))) {
            merged.push(row)
          }
        }
        setBookings(merged)
      }
    } catch (e) {
      setBookingsError('Сүлжээний алдаа')
      setBookings(getLocalSampleBookings().map(normalizeSampleBooking))
    } finally {
      setBookingsLoading(false)
    }
  }

  function isLocalBooking(item) {
    return String(item?.id || '').startsWith('sample-') || String(item?.id || '').startsWith('local-') || String(item?.gerId || '').startsWith('sample-')
  }

  async function updateBookingStatus(item, status) {
    setBookingsMsg('')
    setBookingsError('')

    if (isLocalBooking(item)) {
      try {
        const local = getLocalSampleBookings().map((x) => String(x.id) === String(item.id) ? { ...x, status } : x)
        localStorage.setItem('sampleBookings', JSON.stringify(local))
        setBookings((prev) => prev.map((x) => String(x.id) === String(item.id) ? { ...x, status } : x))
        setBookingsMsg('Локал захиалгын төлөв шинэчлэгдлээ')
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
      setBookings((prev) => prev.map((x) => String(x.id) === String(data.id) ? { ...x, ...data } : x))
      setBookingsMsg('Захиалгын төлөв шинэчлэгдлээ')
    } catch {
      setBookingsError('Сүлжээний алдаа')
    }
  }

  async function cancelBooking(item) {
    setBookingsMsg('')
    setBookingsError('')

    if (isLocalBooking(item)) {
      await updateBookingStatus(item, 'cancelled')
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
      setBookings((prev) => prev.map((x) => String(x.id) === String(data.id) ? { ...x, ...data } : x))
      setBookingsMsg('Захиалга цуцлагдлаа')
    } catch {
      setBookingsError('Сүлжээний алдаа')
    }
  }

  function formatBookingRange(item) {
    if (!item?.checkInDate || !item?.checkOutDate) return '-'
    try {
      const from = new Date(item.checkInDate).toISOString().slice(0, 10)
      const to = new Date(item.checkOutDate).toISOString().slice(0, 10)
      return `${from} — ${to}`
    } catch {
      return '-'
    }
  }

  return (
    <div className="admin-dashboard-view">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="dashboard-title" style={{ margin: 0 }}>Захиалгын хяналт</h2>
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
            {bookingsLoading ? 'Шинэчилж байна...' : 'Дахин татах'}
          </button>
        </div>

        {bookingsLoading && <p className="loading-text">Уншиж байна…</p>}
        {bookingsError && <p className="error-text" style={{ color: '#ef4444' }}>{bookingsError}</p>}
        {bookingsMsg && <p className="success-text" style={{ color: '#10b981' }}>{bookingsMsg}</p>}

        {!bookingsLoading && bookings.length === 0 && <p className="empty-text">Одоогоор хэрэглэгчийн захиалга байхгүй байна.</p>}
        {!bookingsLoading && bookings.length > 0 && (
          <div className="admin-table-wrapper" style={{ overflowX: 'auto', marginBottom: '2rem' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                  <th style={{ padding: '12px' }}>ID</th>
                  <th style={{ padding: '12px' }}>Гэр / Хөтөлбөр</th>
                  <th style={{ padding: '12px' }}>Хэрэглэгч</th>
                  <th style={{ padding: '12px' }}>Утас</th>
                  <th style={{ padding: '12px' }}>Хүний тоо</th>
                  <th style={{ padding: '12px' }}>Өдөр</th>
                  <th style={{ padding: '12px' }}>Төлөв</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px' }}>{b.id}</td>
                    <td style={{ padding: '12px' }}>{b.ger_title || b.program_title || '-'}</td>
                    <td style={{ padding: '12px' }}>{b.user_name || '-'}</td>
                    <td style={{ padding: '12px' }}>{b.user_phone || b.phone || '-'}</td>
                    <td style={{ padding: '12px' }}>{b.ger_capacity || b.program_capacity || '-'}</td>
                    <td style={{ padding: '12px' }}>{formatBookingRange(b)}</td>
                    <td style={{ padding: '12px' }}>{BOOKING_STATUS_LABELS[b.status] || b.status || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm" onClick={() => updateBookingStatus(b, 'confirmed')} style={{ padding: '4px 8px' }}>Батлах</button>
                        <button className="btn btn-sm" onClick={() => cancelBooking(b)} style={{ padding: '4px 8px', color: '#ff0303' }}>Цуцлах</button>
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
