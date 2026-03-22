import React, { Suspense, useState, useEffect } from 'react'
import './Landing.css'

function FeatureList(){
  const [items, setItems] = useState(null)
  useEffect(() => {
    let mounted = true
    async function load(){
      try{
        const res = await fetch('/api/features')
        if(!res.ok){ setItems([]); return }
        const data = await res.json()
        if(!mounted) return
        setItems(data)
      }catch(e){ setItems([]) }
    }
    load()
    return () => { mounted = false }
  }, [])

  if(items === null) return <div>Ачааллаж байна…</div>
  if(!items || items.length === 0){
    // fallback static cards (original hardcoded content)
    const fallback = [
      { id:1, title: 'Дэлхийд үлдсэн цорын ганц нүүдэл', lead: 'Монголчуудын өвөрмөц нүүдэлчин соёл — түүх, амьдрал, хэв маяг.', description: 'Бусад улсаас юугаар ялгарах вэ? Бид дэлхий дээрх цорын ганц нүүдэлч соёлыг хадгалж, уламжлалыг хойч үедээ дамжуулсаар ирсэн.', image: '/public/uploads/1772949320319-1fx3x0.jpg' },
      { id:2, title: 'Эрдэнийн чулуун мэт Монгол гэр', lead: 'Уламжлалт гөр, илбэн доторх дулаан.', description: 'Гэр бол зөвхөн байр биш — энэ нь хувь хүний түүх, ур чадвар, гэр бүлийн уламжлалыг илэрхийлдэг билээ.', image: '/public/uploads/1772799338849-mom9n0.jpg' },
      { id:3, title: 'Цагаан дарь эхийн хорго', lead: 'Соёл, сүсэг, түүх нэг дор.', description: 'Хожмын зочдод зориулсан соёлын аялал, бясалгал болон нутгийн домог түүхүүд — амралт зөвхөн биеийн бус сэтгэлийн ч өртөг болно.', image: '/public/uploads/1772800220860-gjx19c.jpg' }
    ]
    return fallback.map(f => (
      <article key={f.id} className="feature-card" role="listitem">
        <div className="feature-img" style={{ backgroundImage: `url('${f.image}')` }} aria-hidden />
        <div className="feature-body">
          <h3 className="feature-title">{f.title}</h3>
          <p className="feature-lead">{f.lead}</p>
          <p className="feature-desc">{f.description}</p>
        </div>
      </article>
    ))
  }

  return items.map(f => (
    <article key={f.id} className="feature-card" role="listitem">
      <div className="feature-img" style={{ backgroundImage: f.image ? `url('${f.image}')` : undefined }} aria-hidden />
      <div className="feature-body">
        <h3 className="feature-title">{f.title}</h3>
        <p className="feature-lead">{f.lead}</p>
        <p className="feature-desc">{f.description}</p>
      </div>
    </article>
  ))
}

// lazy load Programs to keep initial bundle small
const Programs = React.lazy(() => import('./Programs'))

export default function Landing(){
  // allow local image previews for the three example listings
  // default hero image: use an existing upload so the landing shows the forest
  // background immediately (user requested the hero background to match the
  // provided forest image without changing any text). This uses a file that
  // already exists in backend/public/uploads so no new asset is required.
  const [images, setImages] = useState([null, null, null])
  const [hero, setHero] = useState('/public/uploads/1772949320319-1fx3x0.jpg')

  useEffect(() => {
    // cleanup object URLs on unmount
    return () => {
      images.forEach(url => {
        if (url) URL.revokeObjectURL(url)
      })
    }
  }, [images])

  useEffect(() => {
    // fetch server-provided hero image if available
    let mounted = true
    async function loadHero(){
      try{
        const res = await fetch('/public/home-hero.jpg')
        if(!res.ok) return
        // we can directly use the public path (same origin) or createObjectURL
        if(!mounted) return
        setHero('/public/home-hero.jpg')
      }catch(e){ /* ignore */ }
    }
    loadHero()
    return () => { mounted = false }
  }, [])

  const handleImageChange = (index, e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    // revoke previous url if exists
    setImages(prev => {
      const next = [...prev]
      if (next[index]) URL.revokeObjectURL(next[index])
      next[index] = URL.createObjectURL(file)
      return next
    })
  }

  return (
    <div className="landing dark">
      {/* HERO */}
      <header
        className={`hero hero-dark ${hero ? 'has-hero' : ''}`}
        style={ hero ? { backgroundImage: `url(${hero})` } : undefined }
      >
        <div className="hero-overlay" />
        <div className="hero-inner container">
          <nav aria-hidden className="hero-topbar">
            {/* decorative thin gold line */}
            <div className="gold-line" />
          </nav>

          <div className="hero-center">
            <h1 className="hero-title">ADVENTURE</h1>
            <p className="hero-sub">Discover remote places, cinematic landscapes and the luxury of true solitude.</p>
            <div className="hero-cta">
              <a className="btn btn-primary btn-hero" href="/listings">Book an experience</a>
              <a className="btn btn-outline" href="/programs">View programs</a>
            </div>

            <ul className="hero-features" role="list">
              <li>Curated expeditions</li>
              <li>Private guides & bespoke services</li>
              <li>Comfortable high-end camps</li>
            </ul>
          </div>
        </div>
      </header>

      {/* The Wonders of Nature */}
      <section className="wonders container">
        <h2>The Wonders of Nature</h2>
        <p className="section-lead">Handpicked destinations that showcase raw landscapes and immersive experiences.</p>

        <div className="dest-grid">
          {["1772949320319-1fx3x0.jpg","1772799338849-mom9n0.jpg","1772800220860-gjx19c.jpg","1772800244233-0dhlna.jpg"].map((fn, idx) => (
            <article key={idx} className="dest-card">
              <div className="dest-media" style={{ backgroundImage: `url('/public/uploads/${fn}')` }} aria-hidden />
              <div className="dest-body">
                <h3>Destination {idx + 1}</h3>
                <p className="muted">A short enticing sentence that hints at discovery and serenity.</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Reasons */}
      <section className="reasons">
        <div className="container">
          <h2>Reason For Choosing Us</h2>
          <div className="reasons-grid">
            {[
              { title:'Expert Guides', desc:'Local experts with decades of experience.' },
              { title:'Luxury Camps', desc:'Comfort in the wild — elevated camps and dining.' },
              { title:'Sustainable Travel', desc:'We protect the places we visit.' },
              { title:'Tailor-made', desc:'Personalized itineraries for discerning travelers.' }
            ].map((r,i) => (
              <div key={i} className="reason">
                <div className="reason-icon" aria-hidden>
                  <svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2"/></svg>
                </div>
                <h4>{r.title}</h4>
                <p className="muted">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Split layout promotional */}
      <section className="promo container split">
        <div className="split-media">
          <div className="stacked" style={{ backgroundImage:`url('/public/uploads/1772810636346-m39do1.jpg')` }} />
          <div className="stacked" style={{ backgroundImage:`url('/public/uploads/1772797589684-0cvvp1.jpg')` }} />
        </div>
        <div className="split-copy">
          <h3>Journey Beyond the Ordinary</h3>
          <p className="muted">Join small group departures or enjoy private expeditions designed to reveal the heart of wild places.</p>
          <a className="btn btn-primary" href="/bookings">Start your booking</a>
        </div>
      </section>

      {/* Explore large forest background with overlay graphic */}
      <section className="explore">
        <div className="explore-bg" style={{ backgroundImage: `url('/public/uploads/1772896450896-kvp8jn.jpg')` }}>
          <div className="explore-overlay">
            <svg className="explore-graph" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden>
              <polyline points="0,140 80,100 160,120 240,60 320,80 400,40 480,52 560,30 640,60 720,20 800,40" fill="none" strokeWidth="2" stroke="rgba(255,215,150,0.85)" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div className="explore-copy">
              <h3>Explore The Nature With Us</h3>
              <p className="muted">Cinematic routes, editorial storytelling and photography-led experiences.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer dark-footer">
        <div className="container footer-inner">
          <div className="brand-row">
            <a className="brand" href="/">Khankh Tour</a>
            <div className="socials">
              <a aria-label="instagram" href="#">IG</a>
              <a aria-label="facebook" href="#">FB</a>
            </div>
          </div>
          <small className="muted">© {new Date().getFullYear()} Khankh Tour — All rights reserved</small>
        </div>
      </footer>
    </div>
  )
}
