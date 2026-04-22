import React, { useEffect, useState } from 'react'

const emptyForm = { title:'', time:'', location:'', price:'', age:'', days: [], images: [], duration:'', capacity:'', accommodation:'', transport:'', cancellation:'', nights:'', language:'', phone:'', people: '' }

function api(path, options={}){
  const token = localStorage.getItem('token')
  const headers = options.headers || {}
  if(token) headers.Authorization = `Bearer ${token}`
  // when sending FormData we should not set content-type
  if(!(options && options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json'
  return fetch(`/api/admin/programs${path}`, { ...options, headers })
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
  const [bookings, setBookings] = useState([])
  const [editingBooking, setEditingBooking] = useState(null)
  const [bookingForm, setBookingForm] = useState({ status: '' })
  const [bookingMessage, setBookingMessage] = useState('')
  const [features, setFeatures] = useState([])
  const [editingFeature, setEditingFeature] = useState(null)
  const [featureForm, setFeatureForm] = useState({ title:'', lead:'', description:'', image:'' })
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState('')
  const [homePreview, setHomePreview] = useState(null)
  const [listingsGallery, setListingsGallery] = useState([])
  const LISTINGS_GALLERY_STORAGE_KEY = 'listingsEmptyGalleryImages'

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
          // try public programs endpoint as a fallback as well
          try{
            const publicRes = await fetch('/api/programs')
            if(publicRes.ok){ const pub = await publicRes.json(); try{ localStorage.setItem('programs', JSON.stringify(pub)) }catch(e){}; setPrograms(pub); return }
          }catch(e){}

          const raw = localStorage.getItem('programs')
          setPrograms(raw ? JSON.parse(raw) : [])
          return
        }
        const data = await res.json()
        if(!mounted) return

        // additionally fetch public programs and merge any that admin list may not include
        try{
          const publicRes = await fetch('/api/programs')
          if(publicRes.ok){
            const pub = await publicRes.json()
            const merged = Array.isArray(data) ? [...data] : []
            if(Array.isArray(pub)){
              pub.forEach(p => {
                if(!merged.some(x => String(x.id) === String(p.id))) merged.push(p)
              })
            }
            try{ localStorage.setItem('programs', JSON.stringify(merged)) }catch(e){}
            setPrograms(merged)
          } else {
            try{ localStorage.setItem('programs', JSON.stringify(data)) }catch(e){}
            setPrograms(data)
          }
        }catch(e){ try{ localStorage.setItem('programs', JSON.stringify(data)) }catch(err){}; setPrograms(data) }
      }catch(e){
        // on error, try the public programs endpoint then localStorage
        try{
          const publicRes = await fetch('/api/programs')
          if(publicRes.ok){ const pub = await publicRes.json(); setPrograms(pub); return }
        }catch(err){}
        const raw = localStorage.getItem('programs')
        setPrograms(raw ? JSON.parse(raw) : [])
      }
    }
    load()
    // load bookings for admin management
    ;(async function loadBookings(){
      try{
        const res = await fetch('/api/admin/bookings')
        if(!res.ok) return
        const data = await res.json()
        if(mounted) setBookings(data)
      }catch(e){/* ignore */}
    })()
    // load features for admin management
    ;(async function loadFeatures(){
      try{
        const token = localStorage.getItem('token')
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch('/api/features', { headers })
        if(!res.ok) return
        const data = await res.json()
        if(mounted) setFeatures(data)
      }catch(e){/* ignore */}
    })()
    ;(async function loadListingsGallery(){
      try{
        const res = await fetch('/api/settings/listings-empty-gallery')
        if(!res.ok) throw new Error('settings fetch failed')
        const data = await res.json()
        const imgs = Array.isArray(data.images) ? data.images : []
        if(mounted) setListingsGallery(imgs)
        try{ localStorage.setItem(LISTINGS_GALLERY_STORAGE_KEY, JSON.stringify(imgs)) }catch(e){}
      }catch(e){
        // backend unavailable fallback
        try{
          const raw = localStorage.getItem(LISTINGS_GALLERY_STORAGE_KEY)
          const imgs = raw ? JSON.parse(raw) : []
          if(mounted) setListingsGallery(Array.isArray(imgs) ? imgs : [])
        }catch(err){/* ignore */}
      }
    })()
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

  function setBookingLocal(bookings){
    try{ localStorage.setItem('bookings', JSON.stringify(bookings)) }catch(e){}
    setBookings(bookings)
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

  async function handleBookingUpdate(id, status){
    if(!confirm('Энэ захиалгын төлөвлөлтийг шинэчлэх үү?')) return
    setLoading(true)
    try{
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if(res.ok){
        const updated = await res.json()
        const next = bookings.map(b => b.id === updated.id ? updated : b)
        setBookingLocal(next)
        setBookingMessage('Захиалгын төлөвлөлт шинэчлэгдлээ')
      } else {
        const d = await res.json().catch(()=>({}))
        setBookingMessage(d.message || 'Шинэчлэх үед алдаа')
      }
    }catch(e){ setBookingMessage('Сүлжээний алдаа') }
    setLoading(false)
  }

  async function handleBookingCancel(id){
    if(!confirm('Энэ захиалгыг цуцлах үү?')) return
    setLoading(true)
    try{
      const res = await fetch(`/api/admin/bookings/${id}/cancel`, { method: 'PUT' })
      if(res.ok){
        const updated = await res.json()
        const next = bookings.map(b => b.id === updated.id ? updated : b)
        setBookingLocal(next)
        setBookingMessage('Захиалга цуцлагдлаа')
      } else {
        const d = await res.json().catch(()=>({}))
        setBookingMessage(d.message || 'Цуцлах үед алдаа')
      }
    }catch(e){ setBookingMessage('Сүлжээний алдаа') }
    setLoading(false)
  }

  function handleChange(e){ const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })) }
  function handleBookingChange(e){ const { name, value } = e.target; setBookingForm(prev => ({ ...prev, [name]: value })) }

  // images - support picking multiple files
  async function handleImagePick(e){
    const files = e.target.files
    if(!files || files.length === 0) return
    setLoading(true)
    try{
      const uploaded = []
      for(let i=0;i<files.length;i++){
        try{
          const url = await uploadImage(files[i])
          uploaded.push(url)
        }catch(err){
          console.error('image upload failed', err)
          setMessage('Зураг байрлуулахад алдаа')
        }
      }
      if(uploaded.length > 0){
        setForm(prev => ({ ...prev, images: [...(prev.images||[]), ...uploaded] }))
      }
    }catch(err){ setMessage('Зураг байрлуулахад алдаа') }
    setLoading(false)
    // clear input so same files can be selected again
    try{ e.target.value = '' }catch(e){}
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

  async function handleListingsGalleryPick(e){
    const files = e.target.files
    if(!files || files.length === 0) return
    setLoading(true)
    try{
      const next = [...listingsGallery]
      for(let i=0;i<files.length;i++){
        if(next.length >= 5) break
        const url = await uploadImage(files[i])
        next.push(url)
      }
      setListingsGallery(next.slice(0,5))
      if(next.length > 5) setMessage('Дээд тал нь 5 зураг оруулна')
    }catch(err){
      setMessage('Зураг байрлуулахад алдаа')
    }
    setLoading(false)
    try{ e.target.value = '' }catch(e){}
  }

  function removeListingsGalleryImage(i){
    setListingsGallery(prev => prev.filter((_, idx) => idx !== i))
  }

  async function saveListingsGallery(){
    if(listingsGallery.length < 3 || listingsGallery.length > 5){
      setMessage('3-5 зураг байх ёстой')
      return
    }
    setLoading(true)
    try{
      // always keep a local backup so values survive logout/login even if backend is down
      try{ localStorage.setItem(LISTINGS_GALLERY_STORAGE_KEY, JSON.stringify(listingsGallery)) }catch(e){}

      const token = localStorage.getItem('token')
      const res = await fetch('/api/settings/listings-empty-gallery', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ images: listingsGallery })
      })
      const data = await res.json().catch(() => ({}))
      if(!res.ok){
        setMessage(data.message || 'Серверт хадгалах үед алдаа гарлаа. Локал хадгалалт хийгдсэн.')
      } else {
        setListingsGallery(Array.isArray(data.images) ? data.images : listingsGallery)
        try{ localStorage.setItem(LISTINGS_GALLERY_STORAGE_KEY, JSON.stringify(Array.isArray(data.images) ? data.images : listingsGallery)) }catch(e){}
        setMessage('Listings хоосон хэсгийн зураг хадгалагдлаа')
      }
    }catch(err){
      setMessage('Сүлжээний алдаа. Локал хадгалалт хийгдсэн.')
    }
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

  // feature helpers (moved inside component so they can access state)
  function setFeatureLocal(next){ try{ localStorage.setItem('features', JSON.stringify(next)) }catch(e){}; setFeatures(next) }

  function handleFeatureEdit(f){ setEditingFeature(f.id); setFeatureForm({ title: f.title||'', lead: f.lead||'', description: f.description||'', image: f.image||'' }) ; setMessage('') }

  async function handleFeatureDelete(id){ if(!confirm('Энэ элементийг устгах уу?')) return; setLoading(true); try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/features/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }); if(res.ok){ const next = features.filter(x=>x.id!==id); setFeatureLocal(next); setMessage('Элемент устгагдлаа') } else { const d = await res.json().catch(()=>({})); setMessage(d.message||'Устгах үед алдаа') } }catch(e){ setMessage('Сүлжээний алдаа') } setLoading(false) }

  function handleFeatureChange(e){ const { name, value } = e.target; setFeatureForm(prev => ({ ...prev, [name]: value })) }

  async function handleFeatureImagePick(e){ const file = e.target.files && e.target.files[0]; if(!file) return; setLoading(true); try{ const url = await uploadImage(file); setFeatureForm(prev => ({ ...prev, image: url })); setMessage('Зураг байршуулсан') }catch(err){ setMessage('Зураг байрлуулахад алдаа') } setLoading(false); try{ e.target.value = '' }catch(e){} }

  async function handleFeatureCreate(e){ e && e.preventDefault(); setLoading(true); setMessage(''); try{ const token = localStorage.getItem('token'); const res = await fetch('/api/features', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }, body: JSON.stringify(featureForm) }); if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Create failed'); setLoading(false); return } const created = await res.json(); const next = [...features, created]; setFeatureLocal(next); setFeatureForm({ title:'', lead:'', description:'', image:'' }); setMessage('Элемент нэмэгдлээ') }catch(e){ setMessage('Network error') } setLoading(false) }

  async function handleFeatureUpdate(e){ e && e.preventDefault(); setLoading(true); setMessage(''); try{ const token = localStorage.getItem('token'); const res = await fetch(`/api/features/${editingFeature}`, { method: 'PUT', headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type':'application/json' } : { 'Content-Type':'application/json' }, body: JSON.stringify(featureForm) }); if(!res.ok){ const d = await res.json().catch(()=>({})); setMessage(d.message || 'Update failed'); setLoading(false); return } const updated = await res.json(); const next = features.map(p => p.id === updated.id ? updated : p); setFeatureLocal(next); setEditingFeature(null); setFeatureForm({ title:'', lead:'', description:'', image:'' }); setMessage('Элемент шинэчлэгдлээ') }catch(e){ setMessage('Network error') } setLoading(false) }

  return (
    <div className="container" style={{paddingTop:12}}>
      <h2 style={{marginBottom:6}}>Хөтөлбөрийн удирдлага</h2>
      <p style={{marginTop:0, color:'#64748b', marginBottom:14}}>Эндээс аяллын хөтөлбөр нэмэх, засах, устгах боломжтой.</p>
      {message && <div style={{margin:'8px 0 14px',color:'#0b8457', background:'#ecfdf5', border:'1px solid #a7f3d0', padding:'8px 10px', borderRadius:8}}>{message}</div>}
      {bookingMessage && <div style={{margin:'8px 0 14px',color:'#0b8457', background:'#ecfdf5', border:'1px solid #a7f3d0', padding:'8px 10px', borderRadius:8}}>{bookingMessage}</div>}

      <section style={{display:'flex',gap:20,alignItems:'flex-start'}}>
        <div style={{flex:1, border:'1px solid #eee', borderRadius:10, padding:16, background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.03)'}}>
          <h3>Бүх хөтөлбөрүүд</h3>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
            <thead>
              <tr style={{textAlign:'left',background:'#f8fafc'}}><th style={{padding:10}}>Id</th><th style={{padding:10}}>Нэр</th><th style={{padding:10}}>Хугацаа</th><th style={{padding:10}}>Байршил</th><th style={{padding:10}}>Үнэ</th><th style={{padding:10}}>Хүний тоо</th><th style={{padding:10}}></th></tr>
            </thead>
            <tbody>
              {programs.length === 0 && (
                <tr><td colSpan="7" style={{padding:10,color:'#6b7280'}}>Одоогоор хөтөлбөр бүртгэгдээгүй байна.</td></tr>
              )}
              {programs.map(p => (
                <tr key={p.id} style={{borderTop:'1px solid #eee',transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='#fbfdfe'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <td style={{padding:10,verticalAlign:'middle',width:60}}>{p.id}</td>
                  <td style={{padding:10,verticalAlign:'middle'}}>{p.title}</td>
                  <td style={{padding:10,verticalAlign:'middle',width:140}}>{p.time}</td>
                  <td style={{padding:10,verticalAlign:'middle'}}>{p.location}</td>
                  <td style={{padding:10,verticalAlign:'middle',width:120}}>{p.price}</td>
                  <td style={{padding:10,verticalAlign:'middle',width:120}}>{p.age}</td>
                  <td style={{padding:10,verticalAlign:'middle',textAlign:'right'}}>
                    <button className="btn btn-ghost" onClick={() => handleEdit(p)}>Засах</button>
                    <button className="btn" onClick={() => handleDelete(p.id)} style={{marginLeft:8}} disabled={loading}>Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{width:520, border:'1px solid #eee', borderRadius:10, padding:16, background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.03)'}}>
        <h3 style={{marginTop:0,marginBottom:12}}>{editing ? 'Хөтөлбөр засварлах' : 'Шинэ хөтөлбөр нэмэх'}</h3>
        <form onSubmit={editing ? handleUpdate : handleCreate} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          <div style={{gridColumn:'1 / span 2'}}>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Аяллын нэр</label>
            <input name="title" value={form.title} onChange={handleChange} required style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>

          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Хугацаа</label>
            <input name="time" value={form.time} onChange={handleChange} placeholder="Жишээ: 2 өдөр / 1 шөнө" style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Үнэ</label>
            <input name="price" value={form.price} onChange={handleChange} placeholder="Жишээ: 25000" style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>

          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Хүний тоо</label>
            <input name="people" value={form.people} onChange={handleChange} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Хүний дээд хэмжээ (capacity)</label>
            <input name="capacity" value={form.capacity} onChange={handleChange} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>

          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Хоноглох газар</label>
            <input name="accommodation" value={form.accommodation} onChange={handleChange} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Цуцлах нөхцөл</label>
            <input name="cancellation" value={form.cancellation} onChange={handleChange} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>

          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Хэл</label>
            <input name="language" value={form.language} onChange={handleChange} placeholder="Монгол" style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>
          <div>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Утас</label>
            <input name="phone" value={form.phone} onChange={handleChange} style={{width:'100%',padding:'10px 12px',borderRadius:8,border:'1px solid #e6e6e6'}} />
          </div>

          <div style={{gridColumn:'1 / span 2'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h4 style={{margin:0,fontSize:15}}>Өдрүүд / маршрут</h4>
              <button type="button" className="btn" onClick={addDay} style={{padding:'6px 10px'}}>Өдөр нэмэх</button>
            </div>
            <div style={{marginTop:10}}>
              {(form.days||[]).map((d,i) => (
                <div key={i} style={{border:'1px solid #eee',padding:10,borderRadius:8,marginBottom:8,background:'#fbfbfd'}}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input type="date" value={d.date||''} onChange={e => updateDay(i,'date', e.target.value)} style={{flex:'0 0 150px',padding:8,borderRadius:6,border:'1px solid #e6e6e6'}} />
                    <input placeholder="Гарчиг" value={d.title||''} onChange={e => updateDay(i,'title', e.target.value)} style={{flex:1,padding:8,borderRadius:6,border:'1px solid #e6e6e6'}} />
                    <button type="button" className="btn btn-ghost" onClick={() => removeDay(i)} style={{marginLeft:8}}>X</button>
                  </div>
                  <textarea placeholder="Тайлбар/үйл явдал" value={d.body||''} onChange={e => updateDay(i,'body', e.target.value)} style={{width:'100%',marginTop:8,padding:8,borderRadius:6,border:'1px solid #e6e6e6',minHeight:70}} />
                </div>
              ))}
            </div>
          </div>

          <div style={{gridColumn:'1 / span 2'}}>
            <label style={{display:'block',fontSize:13,marginBottom:6,fontWeight:600}}>Зураг оруулах</label>
            <input type="file" accept="image/*" multiple onChange={handleImagePick} />
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
              {(form.images||[]).map((img,i) => (
                <div key={i} style={{position:'relative',width:100,height:70,border:'1px solid #eee',borderRadius:6,overflow:'hidden',marginRight:8}}>
                  <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  <button type="button" className="btn btn-ghost" onClick={() => removeImage(i)} style={{position:'absolute',top:4,right:4}}>X</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{gridColumn:'1 / span 2',display:'flex',justifyContent:'flex-end',gap:8,marginTop:6}}>
            <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm(emptyForm) }}>Болих</button>
            <button className="btn" type="submit" disabled={loading} style={{padding:'10px 16px'}}>{editing ? 'Хадгалах' : 'Нэмэх'}</button>
          </div>
        </form>
      </div>

      {/* Features (Landing) admin management removed as requested */}

    </div>
  )
}