import React, { useEffect, useState } from 'react'
import './Landing.css'

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
        const iso = new Date(year, month, day).toISOString().slice(0,10)
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
                title={c ? `${c.iso}${c.disabled ? ' (booked)' : ''}` : undefined}
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
  // view month/year for dynamic calendar navigation
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  // sample inventory: 8 gers at $50 and 5 houses at $70 (selectable)
  const sampleItems = []
  for(let i=1;i<=8;i++) sampleItems.push({ id:`sample-ger-${i}`, title:`Жишээ гэр ${i}`, location:'Жишээ', pricePerNight:50, isSample:true })
  for(let i=1;i<=5;i++) sampleItems.push({ id:`sample-house-${i}`, title:`Жишээ байр ${i}`, location:'Жишээ', pricePerNight:70, isSample:true })

  function generateSampleBookedDays(count=3){
    const out = []
    const t = new Date()
    for(let i=0;i<count;i++){
      const d = new Date(t)
      d.setDate(t.getDate() + i)
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
            for(let d = new Date(start); d < end; d.setDate(d.getDate() + 1)){
              taken.push(d.toISOString().slice(0,10))
            }
          })
          setBookedDaysMap(prev => ({ ...prev, [item.id]: Array.from(new Set([...(prev[item.id]||[]), ...taken])) }))
          return
        }
        // fallback synthetic bookings
        const gen = generateSampleBookedDays()
        setBookedDaysMap(prev => ({ ...prev, [item.id]: gen }))
        return
      }
      const res = await fetch(`/api/gers/${item.id}/bookings`)
      const data = await res.json()
      const taken = []
      data.forEach(b => {
        const start = new Date(b.checkInDate)
        const end = new Date(b.checkOutDate)
        for(let d = new Date(start); d < end; d.setDate(d.getDate() + 1)){
          taken.push(d.toISOString().slice(0,10))
        }
      })
      setBookedDaysMap(prev => ({ ...prev, [item.id]: taken }))
    }catch(err){
      console.error(err)
      setBookedDaysMap(prev => ({ ...prev, [item.id]: [] }))
    }
  }

  // navigation handlers for calendar
  function prevMonth(){
    if(viewMonth === 0){ setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth(){
    if(viewMonth === 11){ setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function goToday(){
    const t = new Date()
    setViewYear(t.getFullYear())
    setViewMonth(t.getMonth())
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
            for(let d = new Date(start); d < end; d.setDate(d.getDate() + 1)){
              taken.push(d.toISOString().slice(0,10))
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
            for(let d = new Date(start); d < end; d.setDate(d.getDate() + 1)){
              taken.push(d.toISOString().slice(0,10))
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

  return (
    <div className="container">
      <h2>Жагсаалт</h2>
      <div className="listings two-column">
        <div className="gers-list">
          <h4 style={{margin:'0 0 8px 0'}}>Жишиг сан</h4>
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
                  } else {
                    setSelectedItems(prev => [...prev, g])
                    setSelectedDatesMap(prev => ({ ...prev, [g.id]: [] }))
                    loadBookingsFor(g)
                  }
                }} />
                <div className="listing-body" style={{flex:1}}>
                  <h4 style={{margin:'0'}}>{g.title}</h4>
                  <p style={{margin:'0'}}>{g.location} — ${g.pricePerNight} {g.isSample && <span style={{color:'#6b7280',marginLeft:8,fontSize:12}}>(жишээ)</span>}</p>
                </div>
              </label>
            )
          })}

          <h4 style={{margin:'16px 0 8px 0'}}>Бодит жагсаалт</h4>
          {gers.map(g => {
            const checked = selectedItems.some(s => s.id === g.id)
            return (
              <label key={g.id} className={`listing small ${checked ? 'selected' : ''}`} style={{display:'flex',alignItems:'center',gap:12}}>
                <input type="checkbox" checked={checked} onChange={() => {
                  if(checked){
                    setSelectedItems(prev => prev.filter(p => p.id !== g.id))
                    setSelectedDatesMap(prev => { const next = { ...prev }; delete next[g.id]; return next })
                    setBookedDaysMap(prev => { const next = { ...prev }; delete next[g.id]; return next })
                  } else {
                    setSelectedItems(prev => [...prev, g])
                    setSelectedDatesMap(prev => ({ ...prev, [g.id]: [] }))
                    loadBookingsFor(g)
                  }
                }} />
                <div className="listing-body" style={{flex:1}}>
                  <h4 style={{margin:'0'}}>{g.title}</h4>
                  <p style={{margin:'0'}}>{g.location} — ${g.pricePerNight}</p>
                </div>
              </label>
            )
          })}
          {gers.length === 0 && <p>Одоогоор бодит жагсаалт алга байна.</p>}
        </div>

        <div className="gers-detail">
          {selectedItems.length > 0 ? (
            <>
              <h3>Сонгосон ({selectedItems.length})</h3>
              <div className="selected-area">
                <div className="selected-grid">
                {selectedItems.map(item => {
                  const booked = bookedDaysMap[item.id] || []
                  const sel = selectedDatesMap[item.id] || []
                  return (
                    <div key={item.id} style={{border:'1px solid #e6e7ea',padding:12,borderRadius:8,display:'flex',gap:12,alignItems:'flex-start'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <div>
                            <h4 style={{margin:'0 0 4px 0'}}>{item.title}</h4>
                            <div style={{color:'#6b7280',fontSize:13}}>{item.location} — ${item.pricePerNight} / night</div>
                          </div>
                            <div style={{textAlign:'right'}}>
                            <div style={{fontSize:12,color:'#6b7280'}}>Сонгосон: {sel.length}</div>
                            </div>
                        </div>

                        <div style={{maxWidth:280,marginTop:8}}>
                          <div className="calendar-wrapper">
                            <div className="calendar-nav" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                              <div>
                                <button className="btn btn-outline" onClick={prevMonth} aria-label="Өмнөх сар">‹</button>
                                <button className="btn btn-outline" onClick={goToday} style={{marginLeft:8}}>Өнөөдөр</button>
                                <button className="btn btn-outline" onClick={nextMonth} style={{marginLeft:8}} aria-label="Дараагийн сар">›</button>
                              </div>
                              <div style={{color:'#6b7280',fontSize:14}}>Сонгогдсон: {sel.length}</div>
                            </div>
                            <Calendar
                              year={viewYear}
                              month={viewMonth}
                              disabledDays={booked}
                              onSelectDay={(iso) => toggleDateForItem(item.id, iso)}
                              selectedIsos={sel}
                            />
                          </div>
                          <div style={{marginTop:8, display:'flex', gap:12, alignItems:'flex-start'}}>
                            <div style={{minWidth:120}}>
                              <div style={{display:'flex',alignItems:'center',marginBottom:6}}>
                                <span style={{display:'inline-block',width:12,height:12,background:'#ef4444',marginRight:8,verticalAlign:'middle',borderRadius:3}}></span>
                                <span style={{color:'#374151'}}>захиалагдсан / боломжгүй</span>
                              </div>
                              <div style={{display:'flex',alignItems:'center'}}>
                                <span style={{display:'inline-block',width:12,height:12,background:'#10b981',marginRight:8,verticalAlign:'middle',borderRadius:3}}></span>
                                <span style={{color:'#374151'}}>сонгосон</span>
                              </div>
                            </div>
                            {/* selected dates removed per request */}
                            <div style={{minWidth:120, textAlign:'right'}}>
                              <strong style={{display:'block',marginBottom:6,color:'#374151'}}>Дэд нийлбэр</strong>
                              <div style={{fontSize:16,fontWeight:700}}>${sel.length * (item.pricePerNight || 0)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* end selected-grid */}
                </div>
                {/* totals rendered below grid so it spans full width */}
                <div className="selected-footer-wrapper">
                  <div className="selected-footer">
                    <div style={{color:'#374151'}}>Нийт шөнө: <strong>{totals.nights}</strong></div>
                    <div style={{color:'#374151'}}>Нийт үнэ: <strong>${totals.price}</strong></div>
                    <div>
                      <button className="btn btn-primary" onClick={handleBookSelected} disabled={loading} style={{marginLeft:12}}>
                        {loading ? 'Захиалж байна...' : 'Сонгосон захиалах'}
                      </button>
                    </div>
                  </div>
                </div>
                {message && <div style={{marginTop:8,color:'#374151'}}>{message}</div>}
              </div>
            </>
          ) : (
            <p>Бүх жагсаалтыг баруун тал дахь хэсгээс захиалгаа болон боломжийг удирдана уу.</p>
          )}
        </div>
      </div>
    </div>
  )
}
