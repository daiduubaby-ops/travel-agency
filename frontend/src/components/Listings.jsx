import React, { useEffect, useState } from 'react'
import './Landing.css'
import formatMNT from '../utils/formatCurrency'

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
                {c ? c.day : ''}
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
  const [modalForm, setModalForm] = useState({ images: [], description: '', amenities: '' })
  const [modalImageInput, setModalImageInput] = useState('')
  const [modalTab, setModalTab] = useState('view') // 'view' or 'edit' (admin only)

  function handleModalFileUpload(files){
    const list = Array.from(files || [])
    if(list.length === 0) return
    list.forEach(f => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const data = ev.target.result
        setModalForm(prev => ({ ...prev, images: [...(prev.images||[]), data] }))
      }
      reader.readAsDataURL(f)
    })
  }

  function isAdmin(){
    try{
      const u = JSON.parse(localStorage.getItem('user') || 'null')
      return !!(u && (u.isAdmin || u.role === 'admin'))
    }catch(e){ return false }
  }

  function handleModalInputChange(field, value){
    setModalForm(prev => ({ ...prev, [field]: value }))
  }

  function handleModalImageAdd(){
    const url = (modalImageInput || '').trim()
    if(!url) return
    setModalForm(prev => ({ ...prev, images: [...(prev.images||[]), url] }))
    setModalImageInput('')
  }

  function handleModalImageRemove(idx){
    setModalForm(prev => ({ ...prev, images: (prev.images||[]).filter((_,i)=>i!==idx) }))
  }

  function saveModalDetails(){
    if(!modalItem) return
    try{
      const raw = localStorage.getItem('localListingDetails')
      const map = raw ? JSON.parse(raw) : {}
      map[modalItem.id] = { images: modalForm.images || [], description: modalForm.description || '', amenities: modalForm.amenities || '' }
      localStorage.setItem('localListingDetails', JSON.stringify(map))
      // reflect changes on modalItem for immediate UI feedback
      setModalItem(prev => prev ? ({ ...prev, images: map[modalItem.id].images, description: map[modalItem.id].description, amenities: map[modalItem.id].amenities }) : prev)
      // also update global sampleItems if needed (not necessary for sample items here)
      alert('Деталүүд хадгалагдлаа')
    }catch(e){
      console.error(e)
    }
  }

  const sampleItems = []
  for(let i=1;i<=5;i++) sampleItems.push({ id:`sample-ger-${i}`, title:`Цомцог гэр ${i}`, location:'Гэр', pricePerNight:250000, isSample:true })
  for(let i=1;i<=5;i++) sampleItems.push({ id:`sample-house-${i}`, title:`Бөмбөгөр сууц ${i}`, location:'Гэр', pricePerNight:250000, isSample:true })

  function generateSampleBookedDays(count=3){
    const out = []
    const t = new Date()
    for(let i=0;i<count;i++){
      // use UTC-based date construction to avoid timezone shifts
      const d = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + i))
      out.push(d.toISOString().slice(0,10))
    }
    return out
  }

  useEffect(() => {
    async function load(){
      try{
        const res = await fetch('/api/gers')
        const data = await res.json()
        setGers(data)
        // do not auto-select — allow user to check items
      }catch(err){
        console.error(err)
      }
    }
    load()
  }, [])

  // load bookings for a given item id (sample items get synthetic bookings)
  async function loadBookingsFor(item){
    try{
      if(item.isSample){
        // prefer any client-side sample bookings stored in localStorage
        const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
        const forItem = local.filter(b => b.gerId === item.id)
        if(forItem.length > 0){
          const taken = []
          forItem.forEach(b => {
            const start = new Date(b.checkInDate)
            const end = new Date(b.checkOutDate)
            // iterate days in UTC to produce stable yyyy-mm-dd strings
            for(let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); cur < end; cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1))){
              taken.push(cur.toISOString().slice(0,10))
            }
          })
          setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set([...(prev[item.id]||[]), ...taken])) }))
          return
        }
        // No server bookings for sample items and no client-side sample bookings exist.
        // Do not inject synthetic bookings by default — keep sample items free until user creates local bookings.
        setBookedDaysMap(prev => ({ ...prev, [item.id]: [] }))
        return
      }
      const res = await fetch(`/api/gers/${item.id}/bookings`)
      const data = await res.json()
      const taken = []
      data.forEach(b => {
        const start = new Date(b.checkInDate)
        const end = new Date(b.checkOutDate)
        for(let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); cur < end; cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1))){
          taken.push(cur.toISOString().slice(0,10))
        }
      })
      setBookedDaysMap(prev => ({ ...prev, [item.id]: taken }))
    }catch(err){
      console.error(err)
      setBookedDaysMap(prev => ({ ...prev, [item.id]: [] }))
    }
  }

  // modal control helpers
  function openModal(item){
    setModalItem(item)
    setModalOpen(true)
    // populate modal form from item or from local storage overrides
    try{
      const raw = localStorage.getItem('localListingDetails')
      const map = raw ? JSON.parse(raw) : {}
      const local = map[item.id] || {}
      setModalForm({
        images: Array.isArray(local.images) ? local.images : (Array.isArray(item.images) ? item.images : (item.image ? [item.image] : [])),
        description: local.description || item.description || '',
        amenities: local.amenities || item.amenities || ''
      })
    }catch(e){
      setModalForm({ images: Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []), description: item.description || '', amenities: item.amenities || '' })
    }
    // ensure view state and bookings are loaded for the modal calendar
    setViewMap(prev => ({ ...prev, [item.id]: prev[item.id] || { year: now.getFullYear(), month: now.getMonth() } }))
    loadBookingsFor(item)
  }
  function closeModal(){
    setModalOpen(false)
    setModalItem(null)
  }

  // close modal on Escape
  useEffect(() => {
    function onKey(e){ if(e.key === 'Escape') closeModal() }
    if(modalOpen){ document.addEventListener('keydown', onKey) }
    return () => { document.removeEventListener('keydown', onKey) }
  }, [modalOpen])

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
    // Prefer any locally-saved admin images stored under localListingDetails
    try{
      const raw = localStorage.getItem('localListingDetails')
      const map = raw ? JSON.parse(raw) : {}
      const local = map[item?.id]
      if(local && Array.isArray(local.images) && local.images.length > 0) return local.images[0]
    }catch(e){}
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
      if(!token){ setMessage('You must be signed in to book listings'); setLoading(false); return }

      const results = []
      for(const item of selectedItems){
        const sel = (selectedDatesMap[item.id] || []).slice().sort()
        if(sel.length === 0) continue
        const ranges = datesToRanges(sel)
        if(item.isSample){
          // Create local (client-side) bookings for sample items so users can see them in dashboard
          const msPerDay = 1000 * 60 * 60 * 24
          const existing = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
          for(const r of ranges){
            const nights = Math.ceil((new Date(r.end) - new Date(r.start)) / msPerDay)
            const nowIso = new Date().toISOString()
            const booking = {
              id: `local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
              userId: (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })(),
              gerId: item.id,
              checkInDate: r.start,
              checkOutDate: r.end,
              totalPrice: nights * (item.pricePerNight || 0),
              status: 'confirmed',
              createdAt: nowIso,
              updatedAt: nowIso,
              ger_title: item.title,
              ger_location: item.location
            }
            existing.push(booking)
            results.push({ item, ok:true, booking })
            // expand bookedDaysMap for immediate UI feedback
            const start = new Date(r.start)
            const end = new Date(r.end)
            const taken = []
            for(let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); cur < end; cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1))){
              taken.push(cur.toISOString().slice(0,10))
            }
            setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set([...(prev[item.id]||[]), ...taken])) }))
            // clear selected dates for this item
            setSelectedDatesMap(prev => ({ ...prev, [item.id]: [] }))
          }
          localStorage.setItem('sampleBookings', JSON.stringify(existing))
          continue
        }
        for(const r of ranges){
          const res = await fetch('/api/bookings', {
            method: 'POST',
            headers: {
              'Content-Type':'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ gerId: item.id, checkInDate: r.start, checkOutDate: r.end })
          })
          const data = await res.json()
          if(!res.ok){
            results.push({ item, ok:false, message: data.message || 'Booking failed' })
          } else {
            results.push({ item, ok:true, booking: data })
            // expand bookedDaysMap for immediate UI feedback
            const start = new Date(r.start)
            const end = new Date(r.end)
            const taken = []
            for(let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); cur < end; cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1))){
              taken.push(cur.toISOString().slice(0,10))
            }
            setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set([...(prev[item.id]||[]), ...taken])) }))
            // clear selected dates for this item
            setSelectedDatesMap(prev => ({ ...prev, [item.id]: [] }))
          }
        }
      }

      const failed = results.filter(r => !r.ok)
      if(failed.length > 0){
        setMessage(failed.map(f => `${f.item.title}: ${f.message}`).join('; '))
      } else if(results.length === 0){
        setMessage('No dates selected to book')
      } else {
        setMessage('Booking(s) confirmed! Redirecting to your bookings...')
        setTimeout(() => window.location.href = '/booked', 800)
      }
    }catch(err){
      console.error(err)
      setMessage('Network or server error')
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

  return (
    <div className="container">
      <h2>Байр сонгох</h2>
      <div className="listings two-column">
        <div className="gers-list">
          <h4 style={{margin:'0 0 8px 0'}}></h4>
          {sampleItems.map(g => {
            const checked = selectedItems.some(s => s.id === g.id)
            return (
              <label key={g.id} className={`listing small ${checked ? 'selected' : ''}`} style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="checkbox" checked={checked} onChange={() => {
                  // toggle selection
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
                }} />
                <div className="listing-body" style={{flex:1}}>
                  <h4 style={{margin:'0'}}>{g.title}</h4>
                  <p style={{margin:'0'}}>{g.location} — {formatMNT(g.pricePerNight)} {g.isSample && <span style={{color:'#6b7280',marginLeft:8,fontSize:12}}></span>}</p>
                </div>
                <div style={{marginLeft:8}}>
                  <button className="btn btn-outline" onClick={(e) => { e.preventDefault(); openModal(g) }} style={{padding:'6px 8px'}} aria-label={`Дэлгэрэнгүй ${g.title}`}>
                    дэлгэрэнгүй
                  </button>
                </div>
              </label>
            )
          })}

          {/* Removed extra "Нэмэлт (VIP)" section per request */}
          {gers.length === 0 && <p>Одоогоор бодит жагсаалт алга байна.</p>}
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
                            <div style={{marginTop:6}}>
                              <button className="btn btn-outline" onClick={() => openModal(item)} aria-label={`Дэлгэрэнгүй ${item.title}`}>дэлгэрэнгүй</button>
                            </div>
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
                              Сууцны зураг харагдах хэсэг
                              
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
                          {getItemPreviewImage(modalItem) ? (
                            <img src={getItemPreviewImage(modalItem)} alt={modalItem.title} style={{width:'100%',height:360,objectFit:'cover',borderRadius:8,border:'1px solid #e5e7eb'}} />
                          ) : (
                            <div style={{width:'100%',height:360,display:'flex',alignItems:'center',justifyContent:'center',background:'#f8fafc',borderRadius:8}}>Зураг байхгүй</div>
                          )}
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
                                      <div style={{color:'#6b7280',fontSize:12,marginTop:6}}>Файлыг оруулах үед зураг нь base64 болгон хадгалагдана (туршилтын функц). Backend руу upload хийхийг хүсвэл мэдэгдэнэ үү.</div>
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
                        <button className="btn btn-primary" onClick={() => { /* optionally handle direct booking */ window.location.href = `/book?items=${encodeURIComponent(modalItem.id + ':' + (selectedDatesMap[modalItem.id]||[]).join(','))}` }}>Захиалах</button>
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
                      <button className="btn btn-primary" onClick={handleBookSelected} disabled={loading} style={{marginLeft:12}}>
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
