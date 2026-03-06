import React, { useEffect, useState } from 'react'

const emptyForm = { title:'', time:'', location:'', price:'', age:'', days: [], images: [], duration:'', capacity:'', accommodation:'', transport:'', cancellation:'', nights:'', language:'', phone:'' }

function api(path, options={}){
  const token = localStorage.getItem('token')
  const headers = options.headers || {}
  if(token) headers.Authorization = `Bearer ${token}`
  // when sending FormData we should not set content-type
  if(!(options && options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  return fetch(`/api/programs${path}`, { ...options, headers })
}

async function uploadImage(file){
  const token = localStorage.getItem('token')
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetch('/api/upload', { method:'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
  if(!res.ok) throw new Error('Upload failed')
  // server returns { url: 'http://localhost:5000/public/uploads/..', path: '/public/uploads/..' }
  const data = await res.json()
  // prefer absolute url (data.url), fall back to path or raw response
  return data.url || data.path || data
}

export default function AdminPrograms(){
  const [programs, setPrograms] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [homePreview, setHomePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  // admin-configurable program category buttons visibility/labels
  const [categoriesConfig, setCategoriesConfig] = useState(() => {
    try{ const raw = localStorage.getItem('programCategories'); if(raw) return JSON.parse(raw) }catch(e){}
    return { visible: true, labels: ['Адал явдалт аялал', 'Танин мэдэхүй аялал'] }
  })

  // ensure only admin can access this page
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()
  if(!user || !user.isAdmin) return (
    <div className="container" style={{paddingTop:12}}>
      <h3>Нэвтрэх шаардлагатай эсвэл админ эрх байхгүй байна.</h3>
      <p><a href="/">Буцах</a></p>
    </div>
  )

  useEffect(() => {
    let mounted = true
    async function load(){
      try{
        const res = await api('/')
        if(!res.ok){
          // fallback to localStorage
          const raw = localStorage.getItem('programs')
          setPrograms(raw ? JSON.parse(raw) : [])
          return
        }
        const data = await res.json()
        if(!mounted) return
        setPrograms(data)
      }catch(e){
        const raw = localStorage.getItem('programs')
        setPrograms(raw ? JSON.parse(raw) : [])
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    // try load current home hero for preview in admin
    let mounted = true
    async function load(){
      try{
        const res = await fetch('/public/home-hero.jpg')
        if(!res.ok) return
        if(!mounted) return
        setHomePreview('/public/home-hero.jpg')
      }catch(e){/* ignore */}
    }
    load()
    return () => { mounted = false }
  }, [])

  function setLocal(programs){
    try{ localStorage.setItem('programs', JSON.stringify(programs)) }catch(e){}
    setPrograms(programs)
  }

  function handleEdit(p){
    setEditing(p.id);
    setForm({
      title: p.title || '',
      time: p.time || '',
      location: p.location || '',
      price: p.price || '',
      age: p.age || '',
      days: p.days || [],
      images: p.images || [],
      duration: p.duration || '',
      capacity: p.capacity || '',
      accommodation: p.accommodation || '',
      transport: p.transport || '',
      cancellation: p.cancellation || '',
      nights: p.nights || '',
      language: p.language || '',
      phone: p.phone || ''
    });
    setMessage('')
  }

  async function handleDelete(id){
    if(!confirm('Энэ хөтөлбөрийг устгах уу?')) return
    setLoading(true)
    try{
      const res = await api(`/${id}`, { method: 'DELETE' })
      if(res.ok){
        const next = programs.filter(p => p.id !== id)
        setLocal(next)
        setMessage('Хөтөлбөр устгалаа')
      } else {
        const d = await res.json().catch(()=>({}))
        setMessage(d.message || 'Устгах үед алдаа')
      }
    }catch(e){ setMessage('Сүлжээний алдаа') }
    setLoading(false)
  }

  function handleChange(e){ const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }

  // images
  async function handleImagePick(e){
    const file = e.target.files && e.target.files[0]
    if(!file) return
    setLoading(true)
    try{
      const url = await uploadImage(file)
      // store absolute URL so images load correctly when frontend dev server is used
      setForm(prev => ({ ...prev, images: [...(prev.images||[]), url] }))
    }catch(err){ setMessage('Зураг байрлуулахад алдаа') }
    setLoading(false)
  }

  // admin: upload home background
  async function handleHomePick(e){
    const file = e.target.files && e.target.files[0]
    if(!file) return
    setLoading(true)
    try{
      const token = localStorage.getItem('token')
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/upload/home', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd })
      if(!res.ok) {
        const d = await res.json().catch(()=>({})); setMessage(d.message || 'Home upload failed'); setLoading(false); return
      }
      const d = await res.json()
      setHomePreview(d.url || d.path || '/public/home-hero.jpg')
      setMessage('Home background амжилттай солигдлоо')
    }catch(err){ setMessage('Зураг байрлуулахад алдаа') }
    setLoading(false)
  }

  function removeImage(i){ setForm(prev => { const imgs = (prev.images||[]).slice(); imgs.splice(i,1); return { ...prev, images: imgs } }) }

  // days editor
  function addDay(){ setForm(prev => ({ ...prev, days: [...(prev.days||[]), { date:'', title:'', body:'' }] })) }
  function updateDay(i, key, value){ setForm(prev => { const days = (prev.days||[]).slice(); days[i] = { ...days[i], [key]: value }; return { ...prev, days } }) }
  function removeDay(i){ setForm(prev => { const days = (prev.days||[]).slice(); days.splice(i,1); return { ...prev, days } }) }

  async function handleCreate(e){ e.preventDefault(); setLoading(true); setMessage('')
    try{
      const res = await api('/', { method: 'POST', body: JSON.stringify(form) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Create failed'); setLoading(false); return }
      const created = await res.json()
      const next = [...programs, created]
      setLocal(next)
      setForm(emptyForm)
      // show success and redirect to the program itinerary/detail page
      // add created=1 to query so Programs page can show a success message
      window.location.href = `/programs/${created.id}?created=1`
    }catch(e){ setMessage('Network error') }
    setLoading(false)
  }

  async function handleUpdate(e){ e.preventDefault(); setLoading(true); setMessage('')
    try{
      const res = await api(`/${editing}`, { method: 'PUT', body: JSON.stringify(form) })
      if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Update failed'); setLoading(false); return }
      const updated = await res.json()
      const next = programs.map(p => p.id === updated.id ? updated : p)
      setLocal(next)
      setEditing(null)
      setForm(emptyForm)
      setMessage('Хөтөлбөр шинэчлэгдлээ')
    }catch(e){ setMessage('Network error') }
    setLoading(false)
  }

  return (
    <div className="container" style={{paddingTop:12}}>
      <h2></h2>
      {message && <div style={{margin:'8px 0',color:'#0b8457'}}>{message}</div>}

      {/* Home background admin control */}
      <div style={{margin:'12px 0 18px 0', display:'flex', alignItems:'center', gap:12}}>
        <div style={{width:220, height:120, border:'1px solid #eee', borderRadius:8, overflow:'hidden', backgroundSize:'cover', backgroundPosition:'center', backgroundImage: homePreview ? `url(${homePreview})` : undefined}} />
        <div style={{flex:1}}>
          <div style={{fontWeight:600, marginBottom:6}}>Home арын зураг (админ)</div>
          <input type="file" accept="image/*" onChange={handleHomePick} />
          <div style={{fontSize:12, color:'#6b7280', marginTop:6}}>Энэ зураг Home хуудсын hero хэсгийн арын зураг болно.</div>
        </div>
      </div>

      {/* Admin control: categories shown on Programs page */}
      <div style={{margin:'12px 0 18px 0', padding:12, border:'1px dashed #eee', borderRadius:8}}>
        <div style={{fontWeight:600, marginBottom:8}}>Ангиллууд (админ)</div>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:8}}>
          <label style={{display:'flex',alignItems:'center',gap:8}}>
            <input type="checkbox" checked={!!categoriesConfig.visible} onChange={e => setCategoriesConfig(prev => ({ ...prev, visible: e.target.checked }))} />
            <span>Товчлуурууд харуулах</span>
          </label>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
          <input style={{flex:1}} value={(categoriesConfig.labels && categoriesConfig.labels[0]) || ''} onChange={e => setCategoriesConfig(prev => ({ ...prev, labels: [e.target.value, (prev.labels && prev.labels[1]) || ''] }))} />
          <input style={{flex:1}} value={(categoriesConfig.labels && categoriesConfig.labels[1]) || ''} onChange={e => setCategoriesConfig(prev => ({ ...prev, labels: [(prev.labels && prev.labels[0]) || '', e.target.value] }))} />
        </div>
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button className="btn" onClick={() => { try{ localStorage.setItem('programCategories', JSON.stringify(categoriesConfig)); setMessage('Ангиллын тохиргоог хадгаллаа') }catch(e){ setMessage('Хадгалах алдаа') } }}>Хадгалах</button>
        </div>
      </div>

      <section style={{display:'flex',gap:20}}>
        <div style={{flex:1}}>
          <h3>Бүх хөтөлбөрүүд</h3>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{textAlign:'left'}}><th>Id</th><th>Нэр</th><th>Хугацаа</th><th>Байршил</th><th>Үнэ</th><th>Хүний тоо</th><th></th></tr>
            </thead>
            <tbody>
              {programs.map(p => (
                <tr key={p.id} style={{borderTop:'1px solid #eee'}}>
                  <td style={{padding:8}}>{p.id}</td>
                  <td style={{padding:8}}>{p.title}</td>
                  <td style={{padding:8}}>{p.time}</td>
                  <td style={{padding:8}}>{p.location}</td>
                  <td style={{padding:8}}>{p.price}</td>
                  <td style={{padding:8}}>{p.age}</td>
                  <td style={{padding:8}}>
                    <button className="btn btn-ghost" onClick={() => handleEdit(p)}>Засах</button>
                    <button className="btn" onClick={() => handleDelete(p.id)} style={{marginLeft:8}} disabled={loading}>Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{width:420}}>
          <h3>{editing ? 'Хөтөлбөр засварлах' : 'Шинэ хөтөлбөр нэмэх'}</h3>
          <form onSubmit={editing ? handleUpdate : handleCreate}>
            <label style={{display:'block',marginBottom:8}}>Аяллын нэр<input name="title" value={form.title} onChange={handleChange} required /></label>
            <label style={{display:'block',marginBottom:8}}>Хугацаа<input name="time" value={form.time} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Үнэ<input name="price" value={form.price} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Хүний тоо<input name="people" value={form.people} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Хүний дээд хэмжээ (capacity)<input name="capacity" value={form.capacity} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Хоноглох газар<input name="accommodation" value={form.accommodation} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Цуцлах нөхцөл<input name="cancellation" value={form.cancellation} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Хэл / Жишээ: Монгол<input name="language" value={form.language} onChange={handleChange} /></label>
            <label style={{display:'block',marginBottom:8}}>Утас<input name="phone" value={form.phone} onChange={handleChange} /></label>

            <div style={{marginTop:12}}>
              <h4>Өдрүүд / маршрут</h4>
              {(form.days||[]).map((d,i) => (
                <div key={i} style={{border:'1px solid #eee',padding:8,borderRadius:8,marginBottom:8}}>
                  <div style={{display:'flex',gap:8}}>
                    <input type="date" value={d.date||''} onChange={e => updateDay(i,'date', e.target.value)} style={{flex:0}} />
                    <input placeholder="Гарчиг" value={d.title||''} onChange={e => updateDay(i,'title', e.target.value)} style={{flex:1}} />
                    <button type="button" className="btn btn-ghost" onClick={() => removeDay(i)}>X</button>
                  </div>
                  <textarea placeholder="Тайлбар/үйл явдал" value={d.body||''} onChange={e => updateDay(i,'body', e.target.value)} style={{width:'100%',marginTop:8}} />
                </div>
              ))}
              <div style={{marginTop:6}}><button type="button" className="btn" onClick={addDay}>Өдөр нэмэх</button></div>
            </div>

            <label style={{display:'block',marginTop:8}}>Зураг оруулах<input type="file" accept="image/*" onChange={handleImagePick} /></label>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
              {(form.images||[]).map((img,i) => (
                <div key={i} style={{position:'relative',width:100,height:70,border:'1px solid #eee',borderRadius:6,overflow:'hidden',marginRight:8}}>
                  <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <button type="button" className="btn btn-ghost" onClick={() => removeImage(i)} style={{position:'absolute',top:4,right:4}}>X</button>
                </div>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'flex-end',gap:8, marginTop:12}}>
              {editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm(emptyForm) }}>Болих</button>}
              <button className="btn" type="submit" disabled={loading}>{editing ? 'Хадгалах' : 'Нэмэх'}</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}
