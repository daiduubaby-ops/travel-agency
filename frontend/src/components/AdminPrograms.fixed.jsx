import React, { useEffect, useState } from 'react'

const emptyForm = { title:'', time:'', location:'', price:'', age:'', days: [], images: [], duration:'', capacity:'', accommodation:'', transport:'', cancellation:'', nights:'', language:'', phone:'', people: '', description: '', features: '' }

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
          // try public programs endpoint as a fallback
          try{
            const publicRes = await fetch('/api/programs')
            if(publicRes.ok){ 
              const pub = await publicRes.json(); 
              // Don't save to localStorage anymore
              setPrograms(pub); 
              return 
            }
          }catch(e){
            console.error('Failed to fetch from public API:', e)
          }

          // If both APIs fail, show empty list
          setPrograms([])
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
            // Don't save to localStorage anymore
            setPrograms(merged)
          } else {
            // Don't save to localStorage anymore
            setPrograms(data)
          }
        }catch(e){ 
          // Don't save to localStorage anymore
          setPrograms(data) 
        }
      }catch(e){
        // on error, try the public programs endpoint
        try{
          const publicRes = await fetch('/api/programs')
          if(publicRes.ok){ 
            const pub = await publicRes.json(); 
            setPrograms(pub); 
            return 
          }
        }catch(err){
          console.error('Failed to fetch from public API as fallback:', err)
        }
        // If all else fails, show empty list
        setPrograms([])
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
        // prefer .jpg (file in public folder is hero_photo.jpg)
        const res = await fetch('/public/hero_photo.jpg')
        if(!res.ok) return
        if(!mounted) return
        setHomePreview('/public/hero_photo.jpg')
      }catch(e){/* ignore */}
    }
    load()
    return () => { mounted = false }
  }, [])

  function setLocal(programs){
    // Don't save to localStorage anymore - only update the state
    // This ensures all users get data from the backend
    setPrograms(programs)
  }

  function setBookingLocal(bookings){
    // Don't save to localStorage anymore
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
      phone: p.phone || '',
      description: p.description || '',
      features: p.features || ''
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
    if(!confirm('Энэ захиалгыг шинэчлэх үү?')) return
    setLoading(true)
    try{
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if(res.ok){
        const updated = await res.json()
        const next = bookings.map(b => b.id === updated.id ? updated : b)
        setBookingLocal(next)
        setBookingMessage('Захиалгын төлөв шинэчлэгдлээ')
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
        setMessage(data.message || 'Серверт хадгалах