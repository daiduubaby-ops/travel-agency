import React from 'react'
import formatMNT from '../utils/formatCurrency'
import './Landing.css'

const defaultPrograms = [
  {
    id: 1,
    title: 'Морь + Тайга фото + Завь + Галыг үзүүлэг',
    time: '12:00 - 18:00',
    location: 'Бааc / Тайга',
    price: '25,000₮',
    age: '6+'
  },
  { id: 2, title: 'Таиланд фото аялал', time: '15:00 - 16:00', location: 'Тайга', price: '-', age: 'Бүх нас' },
  { id: 3, title: 'Завьтай аялал', time: '17:00 - 18:00', location: 'Хөвсгөл нуур', price: '40,000₮/завь', age: 'Бүх нас' },
  { id: 4, title: 'Галын үзүүлэг & хөгжим', time: '19:00 - 21:00', location: 'Бааc', price: '-', age: 'Бүх нас' },
  { id: 5, title: 'Орчны тайгад алхалт', time: '21:00 - 23:00', location: 'Тайга', price: '-', age: 'Бүх нас' },
  { id: 6, title: 'Нууруудын завьтай аялал + фото', time: '08:00 - 11:00', location: 'Хөвсгөл нуур', price: '40,000₮', age: 'Бүх нас' },
  { id: 7, title: 'Өдөр тутмын амралт & соёл', time: '10:00 - 14:00', location: 'Бааc', price: '15,000₮', age: 'Бүх нас' },
  { id: 8, title: 'Өглөөний цай & нүүдэлчийн тосгон', time: '07:00 - 09:00', location: 'Бааc', price: '10,000₮', age: 'Бүх нас' }
]

export default function Programs(){
  // load programs from backend if available, fallback to localStorage/default
  const [programsState, setProgramsState] = React.useState(() => {
    try{ const raw = localStorage.getItem('programs'); if(raw) return JSON.parse(raw) }catch(e){}
    return defaultPrograms
  })

  React.useEffect(() => {
    let mounted = true
    async function load(){
      try{
        const res = await fetch('/api/programs')
        if(!res.ok) return
        const data = await res.json()
        if(!mounted) return
        setProgramsState(data)
      }catch(e){/* ignore */}
    }
    load()
    return () => { mounted = false }
  }, [])
  const programs = programsState
  // helper to display price strings; backend may send '-' or localized strings
  function displayPrice(price){
    if(!price || price === '-' || String(price).trim() === '') return '—'
    try{
      // strip non-numeric characters (keep dot and minus) and parse
      const cleaned = String(price).replace(/[^0-9.-]/g, '')
      const n = Number(cleaned)
      if(Number.isFinite(n)) return formatMNT(n)
    }catch(e){/* ignore */}
    // fallback: return original string
    return String(price)
  }

  // try to get a numeric price (raw number) from various price formats so we can
  // display a properly formatted 'Нийт үнэ' in the detail view.
  function numericPrice(price){
    if(price === undefined || price === null) return 0
    try{
      const cleaned = String(price).replace(/[^0-9.-]/g, '')
      const n = Number(cleaned)
      return Number.isFinite(n) ? n : 0
    }catch(e){ return 0 }
  }
  // check for a program id in the URL so we can show a detail view
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id')
  const created = params.get('created')
  const [modalImage, setModalImage] = React.useState(null)
  const [successMessage, setSuccessMessage] = React.useState(created ? 'Аялал амжилттай нэмэгдлээ' : '')
  const [imgIndex, setImgIndex] = React.useState(0)
  const touch = React.useRef({ startX: 0, endX: 0 })
  // admin-configurable category buttons (stored in localStorage by admin)
  const [categoriesConfig, setCategoriesConfig] = React.useState(() => {
    try{ const raw = localStorage.getItem('programCategories'); if(raw) return JSON.parse(raw) }catch(e){}
    return { visible: true, labels: ['Адал явдалт аялал', 'Танин мэдэхүй аялал'] }
  })
  if(!id){
    const parts = window.location.pathname.split('/').filter(Boolean)
    if(parts.length >= 2 && parts[0] === 'programs') id = parts[1]
  }

  function startBooking(p){
    try{
      const local = JSON.parse(localStorage.getItem('sampleBookings') || '[]')
      const bookingId = `sample-${Date.now()}-${p.id}`
      const today = new Date()
      const tomorrow = new Date(today.getTime() + 24*60*60*1000)
      const booking = {
        id: bookingId,
        gerId: `sample-program-${p.id}`,
        ger_title: p.title,
        ger_location: p.location,
        checkInDate: today.toISOString().slice(0,10),
        checkOutDate: tomorrow.toISOString().slice(0,10),
        // use numericPrice helper to set the sample booking total from the program price
        totalPrice: numericPrice(p.price),
        userId: (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      }
      local.push(booking)
      localStorage.setItem('sampleBookings', JSON.stringify(local))
      // navigate to booked listings and show a success message
      const qp = `?success=1&added=${encodeURIComponent(booking.id)}`
      window.location.href = `/booked${qp}`
    }catch(e){
      console.error(e)
      // fallback: just navigate
      window.location.href = `/booked?success=1`
    }
  }

  if(id){
    const program = programs.find(p => String(p.id) === String(id))
    if(!program) return (
      <div className="container"><p>Хөтөлбөр олдсонгүй. Буцах: <a href="/programs">Аяллын хөтөлбөр</a></p></div>
    )
    // render compact features layout similar to provided design
    const features = [
      { icon: '⏳', title: program.duration || '8 өдөр', subtitle: 'хугацаа' },
      { icon: '👥', title: program.capacity || '5', subtitle: 'хүн' },
      { icon: '🛏️', title: program.accommodation || 'Цомцог гэр', subtitle: 'хоноглох газар' },
      { icon: '🚗', title: program.transport || 'Морь', subtitle: 'унаа' },
      { icon: '❌', title: program.cancellation || 'Цуцлах боломжгүй', subtitle: 'цуцлах нөхцөл' },
      { icon: '🌐', title: program.language || 'Монгол', subtitle: 'хөтчийн хэл' },
      { icon: '📞', title: program.phone || '95699988', subtitle: 'утас' }
    ]

    return (
      <section className="programs">
        <div className="container">
          {successMessage && <div style={{margin:'8px 0',color:'#0b8457',fontWeight:600}}>{successMessage}</div>}
          {/* image modal overlay */}
          {modalImage && (
            <div onClick={() => setModalImage(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
              <img src={modalImage} alt="" style={{maxWidth:'95%',maxHeight:'95%',boxShadow:'0 6px 30px rgba(0,0,0,0.6)'}} />
            </div>
          )}

          {/* show a larger hero image (click to enlarge) using a simple carousel; thumbnails removed */}
          {program.images && program.images.length > 0 && (
            <>
              <div
                style={{marginBottom:16,display:'flex',justifyContent:'center',position:'relative'}}
                onTouchStart={e => { touch.current.startX = e.touches[0].clientX }}
                onTouchMove={e => { touch.current.endX = e.touches[0].clientX }}
                onTouchEnd={() => {
                  const dx = touch.current.endX - touch.current.startX
                  if(Math.abs(dx) > 40){
                    if(dx < 0) setImgIndex(i => (i + 1) % program.images.length)
                    else setImgIndex(i => (i - 1 + program.images.length) % program.images.length)
                  }
                }}
              >
                <img
                  src={program.images[imgIndex]}
                  alt=""
                  onClick={() => setModalImage(program.images[imgIndex])}
                  style={{width:'100%',maxWidth:560,height:320,objectFit:'cover',borderRadius:12,cursor:'pointer',boxShadow:'0 6px 20px rgba(0,0,0,0.15)'}}
                />

                {/* left / right arrows overlay */}
                {program.images.length > 1 && (
                  <>
                    <button onClick={() => setImgIndex(i => (i - 1 + program.images.length) % program.images.length)} style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:0,borderRadius:6,width:36,height:36,cursor:'pointer'}} aria-label="Prev image">‹</button>
                    <button onClick={() => setImgIndex(i => (i + 1) % program.images.length)} style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'rgba(0,0,0,0.4)',color:'#fff',border:0,borderRadius:6,width:36,height:36,cursor:'pointer'}} aria-label="Next image">›</button>
                  </>
                )}
              </div>
              {/* small indicator dots */}
              {program.images.length > 1 && (
                <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:16}}>
                  {program.images.map((_, i) => (
                    <div key={i} style={{width:8,height:8,borderRadius:8,background: i === imgIndex ? '#111' : '#ddd'}} />
                  ))}
                </div>
              )}
            </>
          )}
          <h2 style={{marginBottom:12}}>АЯЛЛЫН ХӨТӨЛБӨР</h2>
          {/* category buttons — visibility and labels controlled by admin via AdminPrograms (localStorage key: programCategories) */}
          {categoriesConfig && categoriesConfig.visible && (
            <div style={{display:'flex',gap:12, marginBottom:18}}>
              <button style={{padding:'10px 18px', borderRadius:12, background:'#eef7ff', border:'none'}}>{(categoriesConfig.labels && categoriesConfig.labels[0]) || 'Адал явдалт аялал'}</button>
              <button style={{padding:'10px 18px', borderRadius:12, background:'#eef7ff', border:'none'}}>{(categoriesConfig.labels && categoriesConfig.labels[1]) || 'Танин мэдэхүй аялал'}</button>
            </div>
          )}

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            {features.map((f, i) => (
              <div key={i} style={{display:'flex',gap:12,alignItems:'center'}}>
                <div style={{width:44,height:44,display:'inline-flex',alignItems:'center',justifyContent:'center',borderRadius:10,background:'#fff4f2',color:'#ef4444',fontSize:18}} aria-hidden>
                  {f.icon}
                </div>
                <div>
                  <div style={{fontWeight:700,color:'#111'}}>{f.title}</div>
                  <div style={{fontSize:12,color:'#6b7280'}}>{f.subtitle}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{marginTop:20}}>
            {/* show a compact total price on the right similar to design */}
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
              <div>
                <button className="btn btn-primary" onClick={() => startBooking(program)}>Захиалах</button>
                <a style={{marginLeft:8}} className="btn btn-ghost" href="/programs">Буцах</a>
              </div>
              <div style={{textAlign:'right', color:'#374151'}}>
                <div style={{fontSize:12}}>Нийт үнэ:</div>
                <div style={{fontSize:16,fontWeight:700}}>{formatMNT(numericPrice(program.price))}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="programs">
      <div className="container">
          <h2>Аяллын хөтөлбөр</h2>
        <p className="programs-lead">Та дамжуулан нэг өдрийн олон үйл ажиллагаа бүхий хөтөлбөрүүдээс сонгож болно. Доорх картуудаар дэлгэрэнгүйг үзнэ үү.</p>

        <div className="program-grid" role="list">
          {programs.map(p => (
            <article key={p.id} className="program-card" role="listitem" tabIndex={0} aria-labelledby={`prog-${p.id}-title`}>
              <div
                className="program-media"
                aria-hidden="true"
                style={p.images && p.images[0] ? { backgroundImage: `url(${p.images[0]})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              />
              <div className="program-body">
                <h3 id={`prog-${p.id}-title`}>{p.title}</h3>
                <div className="program-meta">
                  <div><strong>Цаг:</strong> {p.time}</div>
                  <div><strong>Байршил:</strong> {p.location}</div>
                </div>
                <p className="program-extra">Нас: {p.age} • Үнэ: {displayPrice(p.price)}</p>
                <div className="program-actions">
                  <a className="btn btn-outline" href={`/programs/${p.id}`}>Дэлгэрэнгүй</a>
                  <button className="btn btn-primary" onClick={() => startBooking(p)}>Захиалах</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
