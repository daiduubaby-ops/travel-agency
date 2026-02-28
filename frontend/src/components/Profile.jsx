import React, { useEffect, useState } from 'react'

export default function Profile(){
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null
    } catch (e) {
      return null
    }
  })

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', bio: '' })
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      bio: user.bio || ''
    })
  }, [user])

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') setUser(e.newValue ? JSON.parse(e.newValue) : null)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handleChange(e){
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSave(){
    const updated = { ...user, ...form }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
    setEditing(false)
    setSaveMessage('Таны мэдээлэл амжилттай хадгалагдлаа')
    // clear message after a short delay
    setTimeout(() => setSaveMessage(''), 3000)
  }

  function handleRemoveField(field){
    const updated = { ...user }
    delete updated[field]
    // also clear from form
    const newForm = { ...form, [field]: '' }
    localStorage.setItem('user', JSON.stringify(updated))
    setUser(updated)
    setForm(newForm)
    setSaveMessage('Талбар устгагдлаа')
    setTimeout(() => setSaveMessage(''), 2500)
  }

  if (!user) return (
    <main style={{padding:24}}>
      <h1>Profile</h1>
      <p>Нэвтрэх хэрэглэгч олдсонгүй. Нэвтрэнэ үү.</p>
    </main>
  )

  return (
    <main style={{padding:24}}>
      <h1>Profile</h1>

      {/* Centered card layout (left card removed) */}
      <div style={{display:'flex', justifyContent:'center'}}>
        <div style={{width:420, border:'1px solid #e9ecef', borderRadius:10, padding:20, boxShadow:'0 6px 20px rgba(0,0,0,0.06)', background:'#fff'}}>
          <div style={{display:'flex', gap:12, alignItems:'center'}}>
            <div style={{width:72, height:72, borderRadius:9999, background:'#f1f3f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, color:'#6c757d'}}>
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{flex:1}}>
              <h2 style={{margin:'0 0 6px 0'}}>{user.name}</h2>
              <div style={{color:'#6c757d', fontSize:14}}>{user.email}</div>
            </div>
            <div>
              {!editing && <button className="btn" onClick={() => { setEditing(true); setSaveMessage('') }}>Засах</button>}
            </div>
          </div>

          {saveMessage && (
            <div style={{marginTop:12, padding:8, borderRadius:6, background:'#e6ffed', color:'#0b8457'}}>{saveMessage}</div>
          )}

          {editing && (
            <div style={{marginTop:16}}>
              <label style={{display:'block', marginBottom:8}}>
                Нэр
                <input name="name" value={form.name} onChange={handleChange} style={{width:'100%', padding:10, marginTop:6, borderRadius:6, border:'1px solid #e6e6e6'}} />
              </label>
              <label style={{display:'block', marginBottom:8}}>
                И-мэйл
                <input name="email" value={form.email} onChange={handleChange} style={{width:'100%', padding:10, marginTop:6, borderRadius:6, border:'1px solid #e6e6e6'}} />
              </label>
              <label style={{display:'block', marginBottom:8}}>
                Утас
                <input name="phone" value={form.phone} onChange={handleChange} style={{width:'100%', padding:10, marginTop:6, borderRadius:6, border:'1px solid #e6e6e6'}} />
              </label>
              <label style={{display:'block', marginBottom:8}}>
                Хаяг
                <input name="address" value={form.address} onChange={handleChange} style={{width:'100%', padding:10, marginTop:6, borderRadius:6, border:'1px solid #e6e6e6'}} />
              </label>
              <label style={{display:'block', marginBottom:8}}>
                Тухай (bio)
                <textarea name="bio" value={form.bio} onChange={handleChange} style={{width:'100%', padding:10, marginTop:6, borderRadius:6, border:'1px solid #e6e6e6'}} />
              </label>
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Болих</button>
                <button className="btn" onClick={handleSave}>Хадгалах</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
