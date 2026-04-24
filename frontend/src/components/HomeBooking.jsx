import React, { useMemo, useState } from 'react'

const STATUS_LABELS = {
  pending: 'Хүлээгдэж байна',
  confirmed: 'Баталгаажсан',
  completed: 'Дууссан',
  cancelled: 'Цуцлагдсан',
}

const initialForm = {
  service_id: 'general-checkup',
  address_text: '',
  latitude: '',
  longitude: '',
  preferred_date: '',
  preferred_time: '',
  patient_name: '',
  phone: '',
  additional_note: '',
}

export default function HomeBooking() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState(null)

  const [lookupId, setLookupId] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [lookupError, setLookupError] = useState('')

  const LOCAL_HOME_BOOKINGS_KEY = 'localHomeBookings'

  function saveLocalHomeBooking(booking) {
    try {
      const userId = (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      const current = JSON.parse(localStorage.getItem(LOCAL_HOME_BOOKINGS_KEY) || '[]')
      const item = {
        ...booking,
        __type: 'home',
        userId: userId || booking.userId || null,
        _savedAt: new Date().toISOString(),
      }
      const next = [item, ...current.filter((x) => String(x.id) !== String(item.id))]
      localStorage.setItem(LOCAL_HOME_BOOKINGS_KEY, JSON.stringify(next))
    } catch {
      // ignore local storage issues
    }
  }

  function upsertLocalHomeBookingStatus(booking) {
    try {
      const current = JSON.parse(localStorage.getItem(LOCAL_HOME_BOOKINGS_KEY) || '[]')
      const idx = current.findIndex((x) => String(x.id) === String(booking.id) || String(x.booking_number) === String(booking.booking_number))
      if (idx >= 0) {
        const updated = { ...current[idx], ...booking, __type: 'home' }
        current[idx] = updated
        localStorage.setItem(LOCAL_HOME_BOOKINGS_KEY, JSON.stringify(current))
      }
    } catch {
      // ignore
    }
  }

  const canGoNext = useMemo(() => {
    if (step === 1) return !!form.service_id && !!form.address_text
    if (step === 2) return !!form.preferred_date && !!form.preferred_time
    return !!form.patient_name && !!form.phone
  }, [form, step])

  function updateField(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function nextStep() {
    if (!canGoNext) return
    setStep((s) => Math.min(3, s + 1))
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.coords.latitude.toFixed(6)),
          longitude: String(pos.coords.longitude.toFixed(6)),
        }))
      },
      () => setError('Байршил унших эрх олгогдоогүй байна'),
    )
  }

  async function submitBooking(e) {
    e.preventDefault()
    if (!canGoNext) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/home-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          latitude: form.latitude ? Number(form.latitude) : null,
          longitude: form.longitude ? Number(form.longitude) : null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.message || 'Захиалга үүсгэх үед алдаа гарлаа')
      } else {
        setCreated(data)
        saveLocalHomeBooking(data)
        setForm(initialForm)
        setStep(1)
      }
    } catch (err) {
      setError('Сүлжээний алдаа гарлаа')
    } finally {
      setLoading(false)
    }
  }

  async function lookupStatus(e) {
    e.preventDefault()
    if (!lookupId.trim()) return
    setLookupLoading(true)
    setLookupError('')
    setLookupResult(null)
    try {
      const res = await fetch(`/api/home-bookings/${encodeURIComponent(lookupId.trim())}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setLookupError(data.message || 'Захиалга олдсонгүй')
      else {
        setLookupResult(data)
        upsertLocalHomeBookingStatus(data)
      }
    } catch {
      setLookupError('Сүлжээний алдаа гарлаа')
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <div className="dashboard">
      <div className="container" style={{ maxWidth: 860 }}>
        <h2>Гэр захиалга</h2>

        <div style={{ display: 'flex', gap: 8, margin: '12px 0 16px', flexWrap: 'wrap' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ padding: '6px 10px', borderRadius: 8, background: step === s ? '#dbeafe' : '#f3f4f6' }}>
              Алхам {s}
            </div>
          ))}
        </div>

        <div className="listing" style={{ marginTop: 16, padding: 14 }}>
          <h3>Захиалгын төлөв шалгах</h3>
          <form onSubmit={lookupStatus} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input value={lookupId} onChange={(e) => setLookupId(e.target.value)} placeholder="HB-000001 эсвэл ID" style={{ minWidth: 220 }} />
            <button className="btn" type="submit" disabled={lookupLoading}>{lookupLoading ? 'Шалгаж байна…' : 'Шалгах'}</button>
          </form>
          {lookupError && <p style={{ color: 'red' }}>{lookupError}</p>}
          {lookupResult && (
            <div style={{ marginTop: 10 }}>
              <p><strong>ID:</strong> {lookupResult.booking_number || lookupResult.id}</p>
              <p><strong>Төлөв:</strong> {STATUS_LABELS[lookupResult.status] || lookupResult.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
