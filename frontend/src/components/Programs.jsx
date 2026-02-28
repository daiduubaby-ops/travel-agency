import React from 'react'
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
  // check for a program id in the URL so we can show a detail view
  const params = new URLSearchParams(window.location.search)
  let id = params.get('id')
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
        totalPrice: 0,
        userId: (() => { try { return JSON.parse(localStorage.getItem('user'))?.id } catch { return null } })()
      }
      local.push(booking)
      localStorage.setItem('sampleBookings', JSON.stringify(local))
      // navigate to booking page which will pick up the sample booking by gerId
      window.location.href = `/booking?id=${booking.gerId}`
    }catch(e){
      console.error(e)
      // fallback: just navigate
      window.location.href = `/booking?id=program-${p.id}`
    }
  }

  if(id){
    const program = programs.find(p => String(p.id) === String(id))
    if(!program) return (
      <div className="container"><p>Хөтөлбөр олдсонгүй. Буцах: <a href="/programs">Өдрийн хөтөлбөрүүд</a></p></div>
    )
    // render timeline style per user's screenshot
    return (
      <section className="programs">
        <div className="container">
          <h2>АЯЛЛЫН ХӨТӨЛБӨР</h2>
          <div style={{marginTop:12}}>
            <div style={{display:'flex',gap:20}}>
              <div style={{flex:'0 0 60px', display:'flex', flexDirection:'column', alignItems:'center'}}>
                {/* vertical timeline line with dots */}
                <div style={{width:4, background:'#f1f3f5', flex:1, borderRadius:4, position:'relative'}}>
                  {/* left aligned marker area is decorative */}
                </div>
              </div>
              <div style={{flex:1}}>
                {(program.days||[]).map((d, i) => (
                  <div key={i} style={{border:'1px solid #eef2f6', borderRadius:8, padding:12, marginBottom:12}}>
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <div style={{minWidth:96, textAlign:'center'}}>
                        <div style={{background:'#fff', border:'1px solid #e6eef6', padding:8, borderRadius:8}}>{d.date}</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                          <strong style={{fontSize:16}}>{d.title}</strong>
                          <button className="btn btn-ghost">▾</button>
                        </div>
                        <div style={{marginTop:8, color:'#374151'}}>{d.body}</div>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{marginTop:12}}>
                  <button className="btn btn-primary" onClick={() => startBooking(program)}>Захиалах</button>
                  <a style={{marginLeft:8}} className="btn btn-ghost" href="/programs">Буцах</a>
                </div>
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
        <h2>Өдрийн хөтөлбөрүүд</h2>
        <p className="programs-lead">Та дамжуулан нэг өдрийн олон үйл ажиллагаа бүхий хөтөлбөрүүдээс сонгож болно. Доорх картуудаар дэлгэрэнгүйг үзнэ үү.</p>

        <div className="program-grid" role="list">
          {programs.map(p => (
            <article key={p.id} className="program-card" role="listitem" tabIndex={0} aria-labelledby={`prog-${p.id}-title`}>
              <div className="program-media" aria-hidden="true" />
              <div className="program-body">
                <h3 id={`prog-${p.id}-title`}>{p.title}</h3>
                <div className="program-meta">
                  <div><strong>Цаг:</strong> {p.time}</div>
                  <div><strong>Байршил:</strong> {p.location}</div>
                </div>
                <p className="program-extra">Нас: {p.age} • Үнэ: {p.price}</p>
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
