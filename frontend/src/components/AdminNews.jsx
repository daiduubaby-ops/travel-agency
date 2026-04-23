import React, { useEffect, useState } from 'react'

const emptyForm = { title: '', img: '', date: '', desc: '' }

export default function AdminNews() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // try to load from backend first (admin view), fall back to localStorage
    (async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await fetch('/api/news', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json)) {
            // normalize shape to match local expectations
            const normalized = json.map(n => ({
              id: n.id,
              title: n.title || '',
              img: n.img || '',
              date: n.date || '',
              desc: n.desc || ''
            }))
            setItems(normalized)
            localStorage.setItem('newsCards', JSON.stringify(normalized))
            return
          }
        }
      } catch (err) {
        // ignore and fall back to localStorage
      }
      try {
        const raw = localStorage.getItem('newsCards')
        const parsed = raw ? JSON.parse(raw) : []
        const normalized = Array.isArray(parsed)
          ? parsed.map((n) => ({
              id: n?.id || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`),
              title: n?.title || '',
              img: n?.img || '',
              date: n?.date || '',
              desc: n?.desc || ''
            }))
          : []
        setItems(normalized)
        localStorage.setItem('newsCards', JSON.stringify(normalized))
      } catch {
        setItems([])
      }
    })()
  }, [])

  function save(next) {
    setItems(next)
    localStorage.setItem('newsCards', JSON.stringify(next))
  }

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function onFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Зөвхөн зураг файл оруулна уу')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({ ...prev, img: String(reader.result || '') }))
      setMessage('Зураг сонгогдлоо')
    }
    reader.readAsDataURL(file)
  }

  // normalize image paths (same logic as News.getImgUrl)
  function getImgUrl(img) {
    if (!img) return ''
    if (typeof img !== 'string') return ''
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('data:') || img.startsWith('blob:')) return img
    if (img.startsWith('/public')) return img
    if (img.startsWith('/')) return `/public${img}`
    return `/public/${img}`
  }

  function addNews(e) {
    e.preventDefault()
    if (!form.title.trim()) {
      setMessage('Гарчиг заавал оруулна уу')
      return
    }
    if (!form.desc.trim()) {
      setMessage('Мэдээний текст заавал оруулна уу')
      return
    }
    if (!form.img.trim()) {
      setMessage('Зураг заавал оруулна уу')
      return
    }
    if (editingId) {
      // attempt to update on server when admin token available
      (async () => {
        try {
          const token = localStorage.getItem('token')
          if (!token) throw new Error('Not authenticated')
          const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          const res = await fetch(`/api/admin/news/${editingId}`, { method: 'PUT', headers, body: JSON.stringify({ title: form.title, img: form.img, date: form.date, desc: form.desc }) })
          if (!res.ok) {
            const errJson = await res.json().catch(()=>({}))
            throw new Error(errJson.message || 'Server error')
          }
          const saved = await res.json().catch(()=>null)
          const next = items.map((n) => (
            n.id === editingId
              ? (saved || { ...n, ...form, date: form.date || n.date || new Date().toISOString().slice(0, 10) })
              : n
          ))
          save(next)
          setForm(emptyForm)
          setEditingId(null)
          setMessage('Мэдээ амжилттай засагдлаа')
        } catch (err) {
          // fallback to local update
          const next = items.map((n) => (
            n.id === editingId
              ? { ...n, ...form, date: form.date || n.date || new Date().toISOString().slice(0, 10) }
              : n
          ))
          save(next)
          setForm(emptyForm)
          setEditingId(null)
          setMessage(`Мэдээ локалд шинэчлэгдлээ (алдаа: ${err && err.message ? err.message : 'unknown'})`)
        }
      })()
      return
    }

    const newItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...form,
      date: form.date || new Date().toISOString().slice(0, 10)
    }
    ;
    // Try to POST to backend admin API; fallback to localStorage in case of error
    (async () => {
      try {
        const token = localStorage.getItem('token')
        // If there's no token, save offline and instruct admin to login
        if (!token) {
          const next = [newItem, ...items]
          save(next)
          setForm(emptyForm)
          setMessage('Мэдээ локалд хадгалагдлаа. Админ эрхээр нэвтэрч сервер рүү илгээнэ үү')
          return
        }

        const headers = { 'Content-Type': 'application/json' }
        headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/admin/news', { method: 'POST', headers, body: JSON.stringify({ title: newItem.title, img: newItem.img, date: newItem.date, desc: newItem.desc }) })
        if (!res.ok) {
          // try to parse backend error for better debugging and show to user
          let info = ''
          try { const json = await res.json(); info = json && json.message ? `: ${json.message}` : '' } catch (e) {}
          const err = new Error('Server rejected request' + info)
          throw err
        }
        // parse JSON response only when server returned JSON; some server setups may return an empty body
        let saved = null
        try {
          const ct = (res.headers.get && res.headers.get('content-type')) || ''
          if (res.status === 204 || !ct.includes('application/json')) {
            // fallback to using the locally-created item when server returns no JSON
            saved = { id: newItem.id, title: newItem.title, img: newItem.img, date: newItem.date, desc: newItem.desc }
          } else {
            saved = await res.json()
          }
        } catch (e) {
          // if parsing fails, fallback to newItem so UI remains consistent
          console.warn('Failed to parse JSON response for admin/news:', e)
          saved = { id: newItem.id, title: newItem.title, img: newItem.img, date: newItem.date, desc: newItem.desc }
        }
        const next = [saved, ...items]
        save(next)
        setForm(emptyForm)
        setMessage('Мэдээ амжилттай сервер рүү нийтлэгдлээ')
      } catch (err) {
        // surface the error message to the admin for easier debugging
        console.error('AdminNews add error', err)
        const next = [newItem, ...items]
        save(next)
        setForm(emptyForm)
        setMessage(`Мэдээ локалд хадгалагдлаа (алдаа: ${err && err.message ? err.message : 'unknown'})`)
      }
    })()
  }

  function removeNews(id) {
    if (!window.confirm('Энэ мэдээг устгах уу?')) return
    ;(async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) throw new Error('Not authenticated')
        const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) {
          const errJson = await res.json().catch(()=>({}))
          throw new Error(errJson.message || 'Server error')
        }
        const next = items.filter((n) => n.id !== id)
        save(next)
        if (editingId === id) {
          setForm(emptyForm)
          setEditingId(null)
        }
        setMessage('Мэдээ устгагдлаа')
      } catch (err) {
        // fallback to local delete
        const next = items.filter((n) => n.id !== id)
        save(next)
        if (editingId === id) {
          setForm(emptyForm)
          setEditingId(null)
        }
        setMessage(`Мэдээ локалд устгагдлаа (алдаа: ${err && err.message ? err.message : 'unknown'})`)
      }
    })()
  }

  function startEdit(item) {
    setForm({
      title: item?.title || '',
      img: item?.img || '',
      date: item?.date || '',
      desc: item?.desc || ''
    })
    setEditingId(item?.id || null)
    setMessage('Засварлах горим идэвхжлээ')
  }

  function cancelEdit() {
    setForm(emptyForm)
    setEditingId(null)
    setMessage('Засварлах горим цуцлагдлаа')
  }

  return (
    <div className="container" style={{ paddingTop: 12 }}>
      <h2>Мэдээ нэмэх / засах / устгах</h2>
      {message && <div style={{ margin: '8px 0', color: '#0b8457' }}>{message}</div>}

      <form onSubmit={addNews} style={{ marginBottom: 20, border: '1px solid #eee', borderRadius: 10, padding: 12 }}>
        <label style={{ display: 'block', marginBottom: 8 }}>Гарчиг
          <input name="title" value={form.title} onChange={onChange} required style={{ color: '#111827' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>Зургийн зам (ж: /uploads/a.jpg эсвэл https://...)
          <input name="img" value={form.img} onChange={onChange} placeholder="/uploads/a.jpg" required style={{ color: '#111827' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>Эсвэл зураг файл оруулах
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>
        {form.img && (
          <div style={{ marginBottom: 8 }}>
            <img src={form.img} alt="Урьдчилж харах" style={{ width: 160, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid #ddd' }} />
          </div>
        )}
        <label style={{ display: 'block', marginBottom: 8 }}>Огноо
          <input type="date" name="date" value={form.date} onChange={onChange} style={{ color: '#111827' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>Мэдээний текст
          <textarea name="desc" value={form.desc} onChange={onChange} rows={6} required style={{ width: '100%', resize: 'vertical', color: '#111827', background: '#fff' }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit">{editingId ? 'Засах' : 'Нэмэх'}</button>
          {editingId && (
            <button className="btn" type="button" onClick={cancelEdit}>Цуцлах</button>
          )}
        </div>
      </form>

      <h3>Хадгалсан бүх мэдээ</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Гарчиг</th>
            <th style={{ padding: 8 }}>Огноо</th>
            <th style={{ padding: 8 }}>Зураг</th>
            <th style={{ padding: 8 }}>Мэдээ</th>
            <th style={{ padding: 8 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((n, i) => (
            <tr key={n.id || `${n.title}-${i}`} style={{ borderTop: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{n.title}</td>
              <td style={{ padding: 8 }}>{n.date}</td>
              <td style={{ padding: 8, verticalAlign: 'middle' }}>
                {n.img ? (
                  <img
                    src={getImgUrl(n.img)}
                    alt={n.title || 'news image'}
                    style={{ width: 120, height: 72, objectFit: 'cover', borderRadius: 6, border: '1px solid #e6e7ea' }}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/public/placeholder.svg' }}
                  />
                ) : '-'}
              </td>
              <td style={{ padding: 8, maxWidth: 360 }}>{n.desc || '-'}</td>
              <td style={{ padding: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn" style={{ background: '#2563eb', color: '#fff' }} onClick={() => startEdit(n)}>Засах</button>
                  <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={() => removeNews(n.id)}>Устгах</button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: 12, color: '#6b7280' }}>Мэдээ алга байна</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
