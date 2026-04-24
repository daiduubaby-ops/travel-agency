import React, { useEffect, useState } from 'react'
import './Landing.css'
import formatMNT from '../utils/formatCurrency'


const ACTIVE_BOOKING_STATUSES = new Set(['pending', 'approved', 'confirmed', 'paid'])

function safeJsonArray(value){
  if(Array.isArray(value)) return value
  if(!value) return []
  if(typeof value === 'string'){
    try{
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    }catch(e){
      return value.split(',').map(x => x.trim()).filter(Boolean)
    }
  }
  return []
}

function normalizeGer(item){
  const images = safeJsonArray(item.images)
  const amenities = safeJsonArray(item.amenities || item.features)
  return {
    ...item,
    id: item.id || item._id,
    title: item.title || item.name || 'Гэр',
    location: item.location || 'Гэр',
    pricePerNight: Number(item.pricePerNight || item.price || 0),
    capacity: item.capacity || item.people || '',
    description: item.description || '',
    amenities,
    images,
  }
}

function amenitiesToInput(value){
  const arr = safeJsonArray(value)
  if(arr.length > 0) return arr.join(', ')
  if(typeof value === 'string') return value
  return ''
}

function parseAmenitiesInput(value){
  if(Array.isArray(value)) return value.map(x => String(x).trim()).filter(Boolean)
  return String(value || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
}

function bookingIsActive(booking){
  const status = String(booking?.status || 'pending').toLowerCase()
  return ACTIVE_BOOKING_STATUSES.has(status)
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

// Simple calendar rendering helper
function Calendar({ year, month, disabledDays = [], onSelectDay = () => {}, selectedIsos = [] }){
  // month: 0-based
  const first = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDay = first.getDay() // 0 (Sun) - 6 (Sat)
  const weeks = []
  let day = 1 - startDay
  while(day <= daysInMonth){
    const week = []
    for(let i=0;i<7;i++, day++){
      if(day < 1 || day > daysInMonth) week.push(null)
      else {
        // Build an ISO date string in UTC for the given y/m/d to avoid timezone shifts
        const iso = new Date(Date.UTC(year, month, day)).toISOString().slice(0,10)
        week.push({ day, iso, disabled: disabledDays.includes(iso) })
      }
    }
    weeks.push(week)
  }
  const monthName = first.toLocaleString(undefined, { month: 'long' })
  return (
    <table className="simple-calendar" aria-label={`Calendar for ${month + 1}/${year}`}>
      <caption className="calendar-caption">{monthName} {year}</caption>
      <thead>
        <tr><th>Ня</th><th>Да</th><th>Мя</th><th>Лха</th><th>Пү</th><th>Ба</th><th>Бя</th></tr>
      </thead>
      <tbody>
        {weeks.map((w, i) => (
          <tr key={i}>
            {w.map((c, j) => (
              <td
                key={j}
                className={c ? `${c.disabled ? 'disabled' : 'available'}${selectedIsos.includes(c && c.iso) ? ' selected' : ''}` : 'empty'}
                onClick={() => c && onSelectDay(c.iso)}
                role={c ? 'button' : undefined}
                tabIndex={c ? 0 : -1}
                onKeyDown={(e) => { if(c && (e.key === 'Enter' || e.key === ' ')) onSelectDay(c.iso) }}
                title={c ? `${c.iso}${c.disabled ? ' (Захиалсан)' : ''}` : undefined}
              >
                {c ? (
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',lineHeight:1.1}}>
                    <span>{c.day}</span>
                    {c.disabled && <small style={{fontSize:10,marginTop:3}}>Захиалгатай</small>}
                  </div>
                ) : ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function Listings(){
  const [gers, setGers] = useState([])
  // multiple selected items (gers/houses)
  const [selectedItems, setSelectedItems] = useState([]) // array of item objects
  // maps of id -> array of selected ISO date strings (for multi-day selection)
  const [selectedDatesMap, setSelectedDatesMap] = useState({})
  // maps of id -> array of booked ISO dates
  const [bookedDaysMap, setBookedDaysMap] = useState({})
  // view month/year state per selected item so each calendar can be navigated independently
  const now = new Date()
  const [viewMap, setViewMap] = useState({}) // { [itemId]: { year, month } }
  // modal state for showing detailed overlay for an item
  const [modalOpen, setModalOpen] = useState(false)
  const [modalItem, setModalItem] = useState(null)
  const [modalForm, setModalForm] = useState({
    title: '',
    location: '',
    pricePerNight: '',
    capacity: '',
    images: [],
    description: '',
    amenities: ''
  })
  const [modalImageInput, setModalImageInput] = useState('')
  const [modalMainImageIdx, setModalMainImageIdx] = useState(0)
  const [modalTab, setModalTab] = useState('view') // 'view' or 'edit' (admin only)
  const [addGerOpen, setAddGerOpen] = useState(false)
  const [addGerLoading, setAddGerLoading] = useState(false)
  const [addGerMessage, setAddGerMessage] = useState('')
  const [deletingGerId, setDeletingGerId] = useState(null)
  const [newGerImages, setNewGerImages] = useState([])
  const [newGerForm, setNewGerForm] = useState({
    title: '',
    location: '',
    description: '',
    pricePerNight: '',
    capacity: '',
    amenities: '',
    imageUrl: ''
  })

  function handleModalFileUpload(files){
    // read files as base64 and persist to modalForm; when admin and editing a real ger
    // also attempt to persist the images to the backend automatically so other
    // users see them without needing to explicitly press Save.
    const list = Array.from(files || [])
    if(list.length === 0) return
    ;(async () => {
      try{
        const loaded = []
        for(const f of list){
          const data = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (ev) => resolve(ev.target.result)
            reader.onerror = (err) => reject(err)
            reader.readAsDataURL(f)
          })
          loaded.push(data)
        }
        setModalForm(prev => {
          const imgs = [...(prev.images||[]), ...loaded]
          // async persist to server if admin and editing a real ger
          try{ if(isAdmin() && modalItem && !modalItem.isSample){ persistToServer(modalItem, { ...prev, images: imgs }, false) } }catch(e){}
          return { ...prev, images: imgs }
        })
      }catch(e){ console.error('File read failed', e) }
    })()
  }

  function isAdmin(){
    try{
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      return !!(u && (u.isAdmin || u.role === 'admin'))
    }catch(e){ return false }
  }

  function handleNewGerChange(e){
    const { name, value } = e.target
    setNewGerForm(prev => ({ ...prev, [name]: value }))
  }

  async function filesToDataUrls(files){
    const list = Array.from(files || [])
    const loaded = []

    for(const file of list){
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = ev => resolve(ev.target.result)
        reader.onerror = err => reject(err)
        reader.readAsDataURL(file)
      })
      loaded.push(dataUrl)
    }

    return loaded
  }

  async function handleNewGerFileUpload(e){
    try{
      const loaded = await filesToDataUrls(e.target.files)
      if(loaded.length > 0){
        setNewGerImages(prev => [...prev, ...loaded])
      }
    }catch(err){
      console.error(err)
      setAddGerMessage('Зураг уншихад алдаа гарлаа')
    }finally{
      try{ e.target.value = '' }catch(err){}
    }
  }

  function handleNewGerImageUrlAdd(){
    const url = (newGerForm.imageUrl || '').trim()
    if(!url) return

    setNewGerImages(prev => [...prev, url])
    setNewGerForm(prev => ({ ...prev, imageUrl: '' }))
  }

  function removeNewGerImage(index){
    setNewGerImages(prev => prev.filter((_, i) => i !== index))
  }

  async function handleCreateGer(e){
    e.preventDefault()
    setAddGerMessage('')

    if(!isAdmin()){
      setAddGerMessage('Зөвхөн admin гэр нэмэх боломжтой')
      return
    }

    const title = (newGerForm.title || '').trim()
    const location = (newGerForm.location || '').trim()
    const pricePerNight = Number(newGerForm.pricePerNight)
    const capacity = Number(newGerForm.capacity)

    if(!title || !location || !pricePerNight || !capacity){
      setAddGerMessage('Нэр, байршил, үнэ, багтаамжийг заавал бөглөнө үү')
      return
    }

    setAddGerLoading(true)

    try{
      const token = localStorage.getItem('token')
      if(!token){
        setAddGerMessage('Admin token олдсонгүй. Дахин нэвтэрнэ үү')
        return
      }

      const amenities = (newGerForm.amenities || '')
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)

      const body = {
        title,
        location,
        description: newGerForm.description || '',
        pricePerNight,
        capacity,
        amenities,
        images: newGerImages
      }

      const res = await fetch('/api/gers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const text = await res.text()
      let data = {}
      try{ data = text ? JSON.parse(text) : {} }catch(err){
        throw new Error(`Backend JSON биш response буцаалаа: ${text.slice(0, 100)}`)
      }

      if(!res.ok){
        setAddGerMessage(data.message || 'Гэр нэмэхэд алдаа гарлаа')
        return
      }

      const created = normalizeGer(data)
      setGers(prev => [created, ...(Array.isArray(prev) ? prev : [])])
      setNewGerForm({ title:'', location:'', description:'', pricePerNight:'', capacity:'', amenities:'', imageUrl:'' })
      setNewGerImages([])
      setAddGerMessage('Гэр амжилттай нэмэгдлээ')
    }catch(err){
      console.error(err)
      setAddGerMessage(err.message || 'Сүлжээ эсвэл серверийн алдаа')
    }finally{
      setAddGerLoading(false)
    }
  }

  function handleModalInputChange(field, value){
    setModalForm(prev => ({ ...prev, [field]: value }))
  }

  function handleModalImageAdd(){
    const url = (modalImageInput || '').trim()
    if(!url) return
    setModalForm(prev => {
      const imgs = [...(prev.images||[]), url]
      try{ if(isAdmin() && modalItem && !modalItem.isSample){ persistToServer(modalItem, { ...prev, images: imgs }, false) } }catch(e){}
      return ({ ...prev, images: imgs })
    })
    setModalImageInput('')
  }

  function handleModalImageRemove(idx){
    setModalForm(prev => ({ ...prev, images: (prev.images||[]).filter((_,i)=>i!==idx) }))
  }

  function saveModalDetails(){
    if(!modalItem) return
    ;(async () => {
      try{
        if(isAdmin()){
          const ok = await persistToServer(modalItem, modalForm, true)
          if(!ok) return
        } else {
          setModalItem(prev => prev ? ({
            ...prev,
            ...modalForm,
            images: modalForm.images || []
          }) : prev)
        }

      }catch(e){
        console.error(e)
        alert('Save failed: ' + e.message)
      }
    })()
  }

  // Persist changes to backend for a given ger and modal form-like state.
  async function persistToServer(item, formState, showAlert = true){
    if(!item) return false;
    try{
      const token = localStorage.getItem('token')
      if(!token){
        if(showAlert) try{ alert('Admin token олдсонгүй. Дахин нэвтэрнэ үү') }catch(e){}
        return false
      }

      const title = String(formState.title ?? item.title ?? '').trim()
      const location = String(formState.location ?? item.location ?? '').trim()
      const pricePerNight = Number(formState.pricePerNight ?? item.pricePerNight ?? 0)
      const capacity = Number(formState.capacity ?? item.capacity ?? 0)

      if(!title || !location || !Number.isFinite(pricePerNight) || pricePerNight <= 0 || !Number.isFinite(capacity) || capacity <= 0){
        if(showAlert) try{ alert('Нэр, байршил, үнэ, багтаамж зөв бөглөнө үү') }catch(e){}
        return false
      }

      const body = {
        title,
        location,
        description: formState.description || item.description || null,
        pricePerNight,
        capacity,
        amenities: parseAmenitiesInput(formState.amenities ?? item.amenities),
        images: formState.images || item.images || []
      }

      const targetIsSample = !!item.isSample
      const url = targetIsSample ? '/api/gers' : `/api/gers/${item.id}`
      const method = targetIsSample ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if(res.ok){
        const normalized = normalizeGer(data)
        setModalItem(normalized)
        setModalForm(prev => ({
          ...prev,
          title: normalized.title || '',
          location: normalized.location || '',
          pricePerNight: normalized.pricePerNight ?? '',
          capacity: normalized.capacity ?? '',
          description: normalized.description || '',
          amenities: amenitiesToInput(normalized.amenities),
          images: Array.isArray(normalized.images) ? normalized.images : []
        }))

        setGers(prev => {
          if(!Array.isArray(prev)) return [normalized]
          if(targetIsSample) return [normalized, ...prev]
          return prev.map(g => (String(g.id) === String(normalized.id) ? normalized : g))
        })

        if(showAlert) try{ alert(targetIsSample ? 'Шинээр үүслээ' : 'Амжилттай шинэчлэгдлээ') }catch(e){}
        return true
      } else {
        if(showAlert) try{ alert('Server save failed: ' + (data && data.message ? data.message : JSON.stringify(data))) }catch(e){}
        return false
      }
    }catch(e){
      console.error('persistToServer failed', e)
      if(showAlert) try{ alert('Save failed: ' + e.message) }catch(e){}
      return false
    }
  }


  useEffect(() => {
    async function load(){
    try{
      const res = await fetch('/api/gers')
      const data = await res.json()
      // Defensive: ensure images/amenities are arrays on the client too
      const normalized = Array.isArray(data) ? data.map(normalizeGer) : []
      setGers(normalized)
      // do not auto-select — allow user to check items
    }catch(err){
        console.error(err)
      }
    }
    load()
  }, [])

  // Add a refresh effect to periodically fetch the latest data from the backend
  useEffect(() => {
    // Only refresh data periodically if admin is logged in
    if (!isAdmin()) return;
    
    const refreshInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/gers');
        if (!res.ok) return;
        
        const data = await res.json();
        // Normalize the data
        const normalized = Array.isArray(data) ? data.map(normalizeGer) : [];
        
        setGers(normalized);
      } catch (e) {
        console.error('Failed to refresh gers data', e);
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, []);

  // load bookings for a given item id from the shared backend/database
  async function loadBookingsFor(item){
    try{
      if(!item || item.isSample){
        setBookedDaysMap(prev => ({ ...prev, [item?.id || 'sample']: [] }))
        return
      }

      const res = await fetch(`/api/gers/${item.id}/bookings`)
      const data = await res.json().catch(() => [])
      if(!res.ok) throw new Error(data.message || 'Bookings fetch failed')

      const taken = []
      ;(Array.isArray(data) ? data : []).forEach(b => {
        if(!bookingIsActive(b)) return
        taken.push(...eachDateBetween(b.checkInDate || b.check_in_date || b.startDate, b.checkOutDate || b.check_out_date || b.endDate))
      })
      setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set(taken)) }))
    }catch(err){
      console.error(err)
      setBookedDaysMap(prev => ({ ...prev, [item?.id]: [] }))
    }
  }

  // modal control helpers
  function openModal(item, initialTab = 'view'){
    setModalItem(item)
    setModalOpen(true)
    setModalTab(initialTab)
    // Always use the data from the item directly, not from localStorage
    setModalForm({ 
      title: item.title || '',
      location: item.location || '',
      pricePerNight: item.pricePerNight ?? '',
      capacity: item.capacity ?? '',
      images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []), 
      description: item.description || '', 
      amenities: amenitiesToInput(item.amenities)
    })
    // reset selected main image index when opening
    setModalMainImageIdx(0)
    // ensure view state and bookings are loaded for the modal calendar
    setViewMap(prev => ({ ...prev, [item.id]: prev[item.id] || { year: now.getFullYear(), month: now.getMonth() } }))
    loadBookingsFor(item)
  }
  function closeModal(){
    setModalOpen(false)
    setModalItem(null)
  }

  async function handleDeleteGer(item){
    if(!item?.id) return

    if(!isAdmin()){
      alert('Зөвхөн admin устгах боломжтой')
      return
    }

    if(item.isSample){
      alert('Туршилтын item устгах боломжгүй')
      return
    }

    const confirmed = window.confirm(`"${item.title}" гэрийг устгах уу?`)
    if(!confirmed) return

    const token = localStorage.getItem('token')
    if(!token){
      alert('Admin token олдсонгүй. Дахин нэвтэрнэ үү')
      return
    }

    setDeletingGerId(item.id)
    try{
      const res = await fetch(`/api/gers/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await res.json().catch(() => ({}))
      if(!res.ok){
        alert(data.message || 'Гэр устгахад алдаа гарлаа')
        return
      }

      setGers(prev => Array.isArray(prev) ? prev.filter(g => String(g.id) !== String(item.id)) : prev)
      setSelectedItems(prev => prev.filter(s => String(s.id) !== String(item.id)))
      setSelectedDatesMap(prev => { const next = { ...prev }; delete next[item.id]; return next })
      setBookedDaysMap(prev => { const next = { ...prev }; delete next[item.id]; return next })
      setViewMap(prev => { const next = { ...prev }; delete next[item.id]; return next })

      if(modalItem && String(modalItem.id) === String(item.id)){
        closeModal()
      }

      setMessage(`"${item.title}" гэр устгагдлаа`)
    }catch(err){
      console.error(err)
      alert('Сүлжээ эсвэл серверийн алдаа')
    }finally{
      setDeletingGerId(null)
    }
  }

  // close modal on Escape
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') closeModal() }
    if(modalOpen){ document.addEventListener('keydown', onKey) }
    return () => { document.removeEventListener('keydown', onKey) }
  }, [modalOpen])

  // ensure main image index stays valid when images change
  useEffect(() => {
    const imgs = modalForm.images || []
    if(modalMainImageIdx >= imgs.length) setModalMainImageIdx(0)
  }, [modalForm.images, modalMainImageIdx])

  // navigation handlers for calendar (per-item)
  function prevMonth(id){
    setViewMap(prev => {
      const cur = prev[id] || { year: now.getFullYear(), month: now.getMonth() }
      let { year, month } = cur
      if(month === 0){ month = 11; year = year - 1 }
      else month = month - 1
      return { ...prev, [id]: { year, month } }
    })
  }
  function nextMonth(id){
    setViewMap(prev => {
      const cur = prev[id] || { year: now.getFullYear(), month: now.getMonth() }
      let { year, month } = cur
      if(month === 11){ month = 0; year = year + 1 }
      else month = month + 1
      return { ...prev, [id]: { year, month } }
    })
  }
  function goToday(id){
    const t = new Date()
    setViewMap(prev => ({ ...prev, [id]: { year: t.getFullYear(), month: t.getMonth() } }))
  }

  // helper to toggle multi-date selection (ignore disabled dates)
  function toggleDateForItem(id, iso){
    const booked = bookedDaysMap[id] || []
    if(booked.includes(iso)) return
    setSelectedDatesMap(prev => {
      const prevArr = prev[id] || []
      let nextArr
      if(prevArr.includes(iso)) nextArr = prevArr.filter(d => d !== iso)
      else nextArr = [...prevArr, iso]
      nextArr.sort()
      return { ...prev, [id]: nextArr }
    })
  }

  // build bulk booking URL encoding selected items and dates
  function buildBulkBookingUrl(){
    const parts = selectedItems
      .map(item => {
        const dates = (selectedDatesMap[item.id] || []).join(',')
        return dates ? `${item.id}:${dates}` : null
      })
      .filter(Boolean)
    if(parts.length === 0) return '/book'
    return '/book?items=' + encodeURIComponent(parts.join('|'))
  }

  function clearDatesForItem(id){
    setSelectedDatesMap(prev => ({ ...prev, [id]: [] }))
  }

  function clearAllDates(){
    // clear selections for all selected items
    setSelectedDatesMap({})
  }

  // totals across selected items
  const totals = selectedItems.reduce((acc,item) => {
    const nights = (selectedDatesMap[item.id] || []).length
    acc.nights += nights
    acc.price += nights * (item.pricePerNight || 0)
    return acc
  }, { nights:0, price:0 })

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [emptyGalleryImages, setEmptyGalleryImages] = useState([])
  const LISTINGS_GALLERY_STORAGE_KEY = 'listingsEmptyGalleryImages'

  function getItemPreviewImage(item, idx = 0){
    // Always use the images from the item directly, not from localStorage
    if(Array.isArray(item?.images) && item.images.length > 0) return item.images[0]
    if(item?.image) return item.image
    if(Array.isArray(emptyGalleryImages) && emptyGalleryImages.length > 0){
      return emptyGalleryImages[idx % emptyGalleryImages.length]
    }
    return ''
  }

  // convert array of ISO date strings into contiguous ranges
  function datesToRanges(dates){
    if(!dates || dates.length === 0) return []
    const msPerDay = 1000 * 60 * 60 * 24
    const parsed = dates.map(d => new Date(d)).sort((a,b)=>a-b)
    const ranges = []
    let rangeStart = parsed[0]
    let prev = parsed[0]
    for(let i=1;i<parsed.length;i++){
      const cur = parsed[i]
      const diff = Math.round((cur - prev) / msPerDay)
      if(diff === 1){
        prev = cur
        continue
      }
      // close current range
      ranges.push({ start: rangeStart.toISOString().slice(0,10), end: new Date(prev.getTime() + msPerDay).toISOString().slice(0,10) })
      rangeStart = cur
      prev = cur
    }
    // push last
    ranges.push({ start: rangeStart.toISOString().slice(0,10), end: new Date(prev.getTime() + msPerDay).toISOString().slice(0,10) })
    return ranges
  }

  async function handleBookSelected(){
    setMessage('')
    setLoading(true)
    try{
      const token = localStorage.getItem('token')
      if(!token){
        setMessage('Захиалга хийхийн тулд эхлээд нэвтэрнэ үү')
        return
      }

      const results = []
      for(const item of selectedItems){
        const sel = (selectedDatesMap[item.id] || []).slice().sort()
        if(sel.length === 0) continue


        const ranges = datesToRanges(sel)
        for(const r of ranges){
          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type':'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              gerId: item.id,
              checkInDate: r.start,
              checkOutDate: r.end
            })
          })
          const data = await res.json().catch(() => ({}))
          if(!res.ok){
            results.push({ item, ok:false, message: data.message || 'Захиалга амжилтгүй боллоо' })
          } else {
            results.push({ item, ok:true, booking: data })
            const taken = eachDateBetween(r.start, r.end)
            setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set([...(prev[item.id]||[]), ...taken])) }))
            setSelectedDatesMap(prev => ({ ...prev, [item.id]: [] }))
          }
        }
      }

      const failed = results.filter(r => !r.ok)
      if(failed.length > 0){
        setMessage(failed.map(f => `${f.item.title}: ${f.message}`).join('; '))
      } else if(results.length === 0){
        setMessage('Захиалах өдөр сонгоогүй байна')
      } else {
        setMessage('Захиалга амжилттай илгээгдлээ. Таны захиалгууд руу шилжүүлж байна...')
        setTimeout(() => window.location.href = '/booked?success=1', 800)
      }
    }catch(err){
      console.error(err)
      setMessage('Сүлжээ эсвэл серверийн алдаа')
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    async function loadEmptyGallery(){
      try{
        const res = await fetch('/api/settings/listings-empty-gallery')
        if(!res.ok) throw new Error('settings fetch failed')
        const data = await res.json()
        const imgs = Array.isArray(data.images) ? data.images : []
        if(mounted) setEmptyGalleryImages(imgs)
        try{ localStorage.setItem(LISTINGS_GALLERY_STORAGE_KEY, JSON.stringify(imgs)) }catch(e){}
      }catch(err){
        // fallback to local storage backup if backend is unavailable
        try{
          const raw = localStorage.getItem(LISTINGS_GALLERY_STORAGE_KEY)
          const imgs = raw ? JSON.parse(raw) : []
          if(mounted) setEmptyGalleryImages(Array.isArray(imgs) ? imgs : [])
        }catch(e){
          console.error(err)
        }
      }
    }
    loadEmptyGallery()
    return () => { mounted = false }
  }, [])

  const blockedListingTitles = new Set([
    'terelj ger',
    'gobi desert ger',
    'цомцог гэр 1',
    'цомцог гэр 2'
  ])

  const normalizeListingTitle = (value = '') => String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  const displayItems = gers.filter(item => {
    const title = normalizeListingTitle(item?.title || item?.name || '')
    return !blockedListingTitles.has(title)
  })

  return (
    <div className="container">
      <h2>Байр сонгох</h2>
      {isAdmin() && (
        <div style={{border:'1px solid #e5e7eb',borderRadius:12,padding:14,margin:'12px 0 18px',background:'#fff'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <div>
              <h3 style={{margin:'0 0 4px'}}>Гэр нэмэх</h3>
              <p style={{margin:0,color:'#6b7280'}}></p>
            </div>
            <button type="button" className="btn" onClick={() => setAddGerOpen(v => !v)}>
              {addGerOpen ? 'Хаах' : 'Гэр нэмэх'}
            </button>
          </div>

          {addGerOpen && (
            <form onSubmit={handleCreateGer} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:14}}>
              <div>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Гэрийн нэр</label>
                <input
                  name="title"
                  value={newGerForm.title}
                  onChange={handleNewGerChange}
                  placeholder="Жишээ: Цомцог гэр 1"
                  required
                  style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                />
              </div>

              <div>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Байршил</label>
                <input
                  name="location"
                  value={newGerForm.location}
                  onChange={handleNewGerChange}
                  placeholder="Жишээ: Terelj"
                  required
                  style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                />
              </div>

              <div>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Үнэ</label>
                <input
                  name="pricePerNight"
                  type="number"
                  min="0"
                  value={newGerForm.pricePerNight}
                  onChange={handleNewGerChange}
                  placeholder="250000"
                  required
                  style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                />
              </div>

              <div>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Багтаамж</label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  value={newGerForm.capacity}
                  onChange={handleNewGerChange}
                  placeholder="2"
                  required
                  style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                />
              </div>

              <div style={{gridColumn:'1 / span 2'}}>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Танилцуулга</label>
                <textarea
                  name="description"
                  value={newGerForm.description}
                  onChange={handleNewGerChange}
                  placeholder="Гэрийн тайлбар..."
                  style={{width:'100%',minHeight:90,padding:10,borderRadius:8,border:'1px solid #e5e7eb',color:'#000',background:'#fff'}}
                />
              </div>

              <div style={{gridColumn:'1 / span 2'}}>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Тав тух / amenities</label>
                <input
                  name="amenities"
                  value={newGerForm.amenities}
                  onChange={handleNewGerChange}
                  placeholder="heating, meals, wifi"
                  style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                />
              </div>

              <div style={{gridColumn:'1 / span 2'}}>
                <label style={{display:'block',fontWeight:600,marginBottom:6}}>Зураг</label>
                <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                  <input
                    name="imageUrl"
                    value={newGerForm.imageUrl}
                    onChange={handleNewGerChange}
                    placeholder="Зургийн URL"
                    style={{flex:1,minWidth:220,padding:10,borderRadius:8,border:'1px solid #e5e7eb'}}
                  />
                  <button type="button" className="btn btn-outline" onClick={handleNewGerImageUrlAdd}>URL нэмэх</button>
                  <input type="file" accept="image/*" multiple onChange={handleNewGerFileUpload} />
                </div>

                {newGerImages.length > 0 && (
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
                    {newGerImages.map((img, idx) => (
                      <div key={`${img}-${idx}`} style={{position:'relative',width:100,height:70,border:'1px solid #e5e7eb',borderRadius:8,overflow:'hidden'}}>
                        <img src={img} alt={`new-ger-${idx}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                        <button
                          type="button"
                          onClick={() => removeNewGerImage(idx)}
                          style={{position:'absolute',top:4,right:4,border:'none',borderRadius:4,background:'rgba(0,0,0,.65)',color:'#fff',cursor:'pointer'}}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {addGerMessage && (
                <div style={{gridColumn:'1 / span 2',color:addGerMessage.includes('амжилттай') ? '#047857' : '#dc2626'}}>
                  {addGerMessage}
                </div>
              )}

              <div style={{gridColumn:'1 / span 2',display:'flex',justifyContent:'flex-end'}}>
                <button type="submit" className="btn btn-primary" disabled={addGerLoading} style={{background:'#000',border:'1px solid #000',color:'#fff'}}>
                  {addGerLoading ? 'Хадгалж байна...' : 'Амжилттай хадгалагдлаа'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="listings two-column">
        <div className="gers-list">
          <h4 style={{margin:'0 0 8px 0'}}></h4>
          {displayItems.map(g => {
            const checked = selectedItems.some(s => s.id === g.id)
            const toggleSelection = () => {
              if(checked){
                setSelectedItems(prev => prev.filter(p => p.id !== g.id))
                setSelectedDatesMap(prev => { const next = { ...prev }; delete next[g.id]; return next })
                setBookedDaysMap(prev => { const next = { ...prev }; delete next[g.id]; return next })
                setViewMap(prev => { const next = { ...prev }; delete next[g.id]; return next })
              } else {
                setSelectedItems(prev => [...prev, g])
                setSelectedDatesMap(prev => ({ ...prev, [g.id]: [] }))
                setViewMap(prev => ({ ...prev, [g.id]: { year: now.getFullYear(), month: now.getMonth() } }))
                loadBookingsFor(g)
              }
            }

            return (
              <div key={g.id} className={`listing small listing-item ${checked ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={toggleSelection}
                  aria-label={`${g.title} сонгох`}
                />

                <button
                  type="button"
                  className="listing-card-main"
                  onClick={() => openModal(g)}
                  aria-label={`${g.title} дэлгэрэнгүй`}
                >
                  <div className="listing-body">
                    <h4>{g.title}</h4>
                    <p>{g.location}</p>
                    <p>{formatMNT(g.pricePerNight)}</p>
                  </div>
                </button>

                <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'flex-end'}}>
                  <button
                    type="button"
                    className="listing-detail-btn"
                    onClick={() => openModal(g)}
                  >
                    дэлгэрэнгүй
                  </button>

                  {isAdmin() && (
                    <div style={{display:'flex',gap:6}}>
                      <button
                        type="button"
                        onClick={() => openModal(g, 'manage')}
                        style={{border:'1px solid #111827',background:'#fff',color:'#111827',borderRadius:999,padding:'5px 10px',fontSize:12,fontWeight:700,cursor:'pointer'}}
                      >
                        засах
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGer(g)}
                        disabled={deletingGerId === g.id}
                        style={{border:'1px solid #dc2626',background:'#dc2626',color:'#fff',borderRadius:999,padding:'5px 10px',fontSize:12,fontWeight:700,cursor: deletingGerId === g.id ? 'not-allowed' : 'pointer',opacity: deletingGerId === g.id ? 0.65 : 1}}
                      >
                        {deletingGerId === g.id ? 'устгаж байна...' : 'устгах'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Removed extra "Нэмэлт (VIP)" section per request */}
          {gers.length === 0 && <p>Одоогоор жагсаалт алга байна.</p>}
        </div>

        <div className="gers-detail">
          {selectedItems.length > 0 ? (
            <>
              <h3>Сонгосон ({selectedItems.length})</h3>
              <div className="selected-area">
                <div className="selected-grid">
                {selectedItems.map((item, index) => {
                  const booked = bookedDaysMap[item.id] || []
                  const sel = selectedDatesMap[item.id] || []
                  const previewImage = getItemPreviewImage(item, index)
                  return (
                    <div key={item.id} style={{border:'1px solid #e6e7ea',padding:12,borderRadius:8,display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <h4 style={{margin:'0 0 4px 0'}}>{item.title}</h4>
                            <div style={{color:'#6b7280',fontSize:13}}>{item.location} — {formatMNT(item.pricePerNight)} / шөнө</div>
                          </div>
                            <div style={{textAlign:'right'}}>
                              <div style={{fontSize:12,color:'#6b7280'}}>Сонгосон: {sel.length}</div>
                            </div>
                        </div>

                        <div style={{marginTop:10}}>
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={`${item.title} зураг`}
                              style={{
                                width:'100%',
                                maxWidth:320,
                                height:180,
                                objectFit:'cover',
                                borderRadius:10,
                                border:'1px solid #e5e7eb',
                                display:'block'
                              }}
                            />
                          ) : (
                            <div className="empty-state-image-placeholder" style={{maxWidth:320,height:180,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              Гэрийн зураг харагдах хэсэг
                              
                            </div>
                          )}
                        </div>

                        <div style={{maxWidth:280,marginTop:8}}>
                        <div className="calendar-wrapper">
                          <div className="calendar-nav" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                            <div>
                              <button className="btn btn-outline" onClick={() => prevMonth(item.id)} aria-label="Өмнөх сар">‹</button>
                              <button className="btn btn-outline" onClick={() => goToday(item.id)} style={{marginLeft:8}}>Өнөөдөр</button>
                              <button className="btn btn-outline" onClick={() => nextMonth(item.id)} style={{marginLeft:8}} aria-label="Дараагийн сар">›</button>
                            </div>
                            <div style={{color:'#6b7280',fontSize:14}}>Сонгосон: {sel.length}</div>
                          </div>
                          {(() => {
                            const v = viewMap[item.id] || { year: now.getFullYear(), month: now.getMonth() }
                            return (
                              <Calendar
                                year={v.year}
                                month={v.month}
                                disabledDays={booked}
                                onSelectDay={(iso) => toggleDateForItem(item.id, iso)}
                                selectedIsos={sel}
                              />
                            )
                          })()}
                        </div>
                          <div style={{marginTop:8, display:'flex', gap:12, alignItems:'flex-start'}}>
                            <div style={{minWidth:120}}>
                              <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
                                <span style={{display:'inline-block',width:12,height:12,background:'#ef4444',marginRight:8,verticalAlign:'middle',borderRadius:3}}></span>
                                <span style={{color:'#374151'}}>захиалга дүүрсэн</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center'}}>
                                <span style={{display:'inline-block',width:12,height:12,background:'#10b981',marginRight:8,verticalAlign:'middle',borderRadius:3}}></span>
                                <span style={{color:'#374151'}}>сонгосон</span>
                              </div>
                            </div>
                            {/* selected dates removed per request */}
                            <div style={{minWidth:120, textAlign:'right'}}>
                              <strong style={{display:'block',marginBottom:6,color:'#374151'}}>Нийт төлбөр</strong>
                              <div style={{fontSize:16,fontWeight:700}}>{formatMNT(sel.length * (item.pricePerNight || 0))}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Modal overlay for item details */}
                {modalOpen && modalItem && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="modal-overlay"
                    style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}
                    onClick={closeModal}
                  >
                    <div className="modal-content" style={{background:'#fff',width:'90%',maxWidth:980,maxHeight:'90%',overflow:'auto',borderRadius:12,padding:20,boxShadow:'0 10px 40px rgba(2,6,23,0.4)'}} onClick={(e)=>e.stopPropagation()}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                        <div>
                          <h2 style={{margin:0}}>{modalItem.title}</h2>
                          <div style={{color:'#6b7280'}}>{modalItem.location} — {formatMNT(modalItem.pricePerNight)} / шөнө</div>
                        </div>
                        <div>
                          <button onClick={closeModal} aria-label="Хаах" style={{fontSize:24,lineHeight:1,border:'none',background:'transparent',cursor:'pointer'}}>×</button>
                        </div>
                      </div>
                      <div style={{display:'flex',gap:16,alignItems:'flex-start',flexWrap:'wrap'}}>
                        <div style={{flex:'1 1 420px',minWidth:280}}>
                          {(() => {
                            const imgs = Array.isArray(modalForm.images) && modalForm.images.length > 0 ? modalForm.images : (Array.isArray(modalItem?.images) && modalItem.images.length > 0 ? modalItem.images : (modalItem?.image ? [modalItem.image] : []))
                            const main = imgs[modalMainImageIdx] || imgs[0] || getItemPreviewImage(modalItem)
                            return (
                              <div>
                                {main ? (
                                  <img src={main} alt={modalItem.title} style={{width:'100%',height:360,objectFit:'cover',borderRadius:8,border:'1px solid #e5e7eb'}} />
                                ) : (
                                  <div style={{width:'100%',height:360,display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',borderRadius:8}}>Зураг байхгүй</div>
                                )}
                                {imgs && imgs.length > 0 && (
                                  <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                                    {imgs.map((u,idx) => (
                                      <button key={u+idx} onClick={() => setModalMainImageIdx(idx)} aria-label={`Image ${idx+1}`} style={{width:90,height:60,padding:0,border: modalMainImageIdx===idx ? '2px solid #111' : '1px solid #e5e7eb',borderRadius:6,overflow:'hidden',background:'transparent',cursor:'pointer'}}>
                                        <img src={u} alt={`thumb-${idx}`} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        <div style={{flex:'1 1 360px',minWidth:260}}>
                          {/* Admin-only Manage tab; regular users see only the View content. */}
                          {isAdmin() ? (
                            <div>
                              <div style={{display:'flex',gap:8,marginBottom:12}}>
                                <button className={`btn ${modalTab==='view' ? '' : 'btn-outline'}`} onClick={() => setModalTab('view')}>View</button>
                                <button className={`btn ${modalTab==='manage' ? '' : 'btn-outline'}`} onClick={() => setModalTab('manage')}>Manage</button>
                              </div>
                              {modalTab === 'view' ? (
                                <>
                                  <div style={{marginBottom:12}}>
                                    <strong>Танилцуулга</strong>
                                    <p style={{marginTop:6,color:'#374151'}}>{modalForm.description || modalItem.description || 'Тодорхойлолт байхгүй'}</p>
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <strong>Тав тух/Үзүүлэлтүүд</strong>
                                    <p style={{marginTop:6,color:'#374151'}}>{modalForm.amenities || modalItem.amenities || 'Мэдээлэл байхгүй'}</p>
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <strong>Зурагнууд</strong>
                                    <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                                      {(modalForm.images||[]).length > 0 ? (modalForm.images||[]).map((u,idx)=> (
                                        <div key={u+idx} style={{width:140,height:100,border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden'}}>
                                          <img src={u} alt={`img-${idx}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                        </div>
                                      )) : (
                                        <div style={{color:'#6b7280'}}>Зургийн мэдээлэл байхгүй</div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div style={{marginBottom:12}}>
                                    <strong>Гэрийн нэр (Засварлах)</strong>
                                    <input value={modalForm.title} onChange={(e)=>handleModalInputChange('title', e.target.value)} placeholder="Гэрийн нэр" style={{width:'100%',marginTop:6,padding:8}} />
                                  </div>
                                  <div style={{marginBottom:12,display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                                    <div>
                                      <strong>Үнэ / шөнө</strong>
                                      <input type="number" min="0" value={modalForm.pricePerNight} onChange={(e)=>handleModalInputChange('pricePerNight', e.target.value)} placeholder="Үнэ" style={{width:'100%',marginTop:6,padding:8}} />
                                    </div>
                                    <div>
                                      <strong>Багтаамж</strong>
                                      <input type="number" min="1" value={modalForm.capacity} onChange={(e)=>handleModalInputChange('capacity', e.target.value)} placeholder="Багтаамж" style={{width:'100%',marginTop:6,padding:8}} />
                                    </div>
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <strong>Танилцуулга (Засварлах)</strong>
                                    <textarea value={modalForm.description} onChange={(e)=>handleModalInputChange('description', e.target.value)} placeholder="Танилцуулга оруулна уу" style={{width:'100%',minHeight:80,marginTop:6,padding:8}} />
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <strong>Тав тух/Үзүүлэлтүүд (Засварлах)</strong>
                                    <input value={modalForm.amenities} onChange={(e)=>handleModalInputChange('amenities', e.target.value)} placeholder="Тав тух, үйлчилгээг таслалаар тусгаарлан бичнэ үү" style={{width:'100%',marginTop:6,padding:8}} />
                                  </div>
                                  <div style={{marginBottom:12}}>
                                    <strong>Зурагнууд (Upload)</strong>
                                    <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                                      {(modalForm.images||[]).map((u,idx)=> (
                                        <div key={u+idx} style={{width:100,height:70,position:'relative',border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden'}}>
                                          <img src={u} alt={`img-${idx}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                          <button onClick={()=>handleModalImageRemove(idx)} style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.6)',color:'#fff',border:'none',borderRadius:4,cursor:'pointer',padding:'2px 6px'}}>x</button>
                                        </div>
                                      ))}
                                    </div>
                                    <div style={{display:'flex',gap:8,marginTop:8,alignItems:'center'}}>
                                      <input value={modalImageInput} onChange={(e)=>setModalImageInput(e.target.value)} placeholder="Зургийн URL оруулна уу" style={{flex:1,padding:8}} />
                                      <button className="btn btn-outline" onClick={handleModalImageAdd}>Нэмэх URL</button>
                                    </div>
                                    <div style={{marginTop:8}}>
                                      <input type="file" accept="image/*" multiple onChange={(e)=>handleModalFileUpload(e.target.files)} />
                                      <div style={{color:'#6b7280',fontSize:12,marginTop:6}}></div>
                                    </div>
                                  </div>
                                  <div style={{marginTop:6}}>
                                    <button className="btn btn-primary" onClick={saveModalDetails}>Хадгалах</button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <>
                              <div style={{marginBottom:12}}>
                                <strong>Танилцуулга</strong>
                                <p style={{marginTop:6,color:'#374151'}}>{modalForm.description || modalItem.description || 'Тодорхойлолт байхгүй'}</p>
                              </div>
                              <div style={{marginBottom:12}}>
                                <strong>Тав тух/Үзүүлэлтүүд</strong>
                                <p style={{marginTop:6,color:'#374151'}}>{modalForm.amenities || modalItem.amenities || 'Мэдээлэл байхгүй'}</p>
                              </div>
                              <div style={{marginBottom:12}}>
                                <strong>Зурагнууд</strong>
                                <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                                  {(modalForm.images||[]).length > 0 ? (modalForm.images||[]).map((u,idx)=> (
                                    <div key={u+idx} style={{width:140,height:100,border:'1px solid #e5e7eb',borderRadius:6,overflow:'hidden'}}>
                                      <img src={u} alt={`img-${idx}`} style={{width:'100%',height:'100%',objectFit:'cover'}} />
                                    </div>
                                  )) : (
                                    <div style={{color:'#6b7280'}}>Зургийн мэдээлэл байхгүй</div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{display:'flex',justifyContent:'flex-end',marginTop:16,gap:8}}>
                        <button className="btn" onClick={closeModal}>Хаах</button>
                        <button className="btn btn-primary" onClick={() => { closeModal(); setMessage('Календар дээр өдрөө сонгоод доорх “Захиалга баталгаажуулах” товчийг дарна уу.') }}>Захиалах</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* end selected-grid */}
                </div>
                {/* totals rendered below grid so it spans full width */}
                <div className="selected-footer-wrapper">
                  <div className="selected-footer">
                    <div style={{color:'#374151'}}>Нийт хоног: <strong>{totals.nights}</strong></div>
                    <div style={{color:'#374151'}}>Нийт үнэ: <strong>{formatMNT(totals.price)}</strong></div>
                    <div>
                      <button className="btn btn-primary" onClick={handleBookSelected} disabled={loading} style={{marginLeft:12, background:'#000', border:'1px solid #000', color:'#fff'}}>
                        {loading ? 'Захиалж байна...' : 'Захиалга баталгаажуулах'}
                      </button>
                    </div>
                  </div>
                </div>
                {message && <div style={{marginTop:8,color:'#374151'}}>{message}</div>}
              </div>
            </>
          ) : (
            <div className="empty-state-upload-area">
              <p>Та өөрт тохирох амрах байраа сонгоод захиалгаа баталгаажуулна уу..</p>

              <div className="empty-state-image-card">
                {emptyGalleryImages.length > 0 ? (
                  <div className="empty-gallery-grid">
                    {emptyGalleryImages.map((img, idx) => (
                      <img key={`${img}-${idx}`} src={img} alt={`Хоосон хэсгийн зураг ${idx+1}`} className="empty-state-image" />
                    ))}
                  </div>
                ) : (
                  <div className="  "></div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
