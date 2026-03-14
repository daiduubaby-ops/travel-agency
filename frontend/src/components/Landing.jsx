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
    <div className="landing">
      <header
        className={`hero ${hero ? 'has-hero' : ''}`}
        style={
          hero
            ? { backgroundImage: `url(${hero})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : undefined
        }
      >
        {/* Decorative Mongolian landscape illustration (pure SVG) - hide when a hero image is present */}
        {!hero && (
          <svg className="hero-illustration" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="g-sky" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#cfeeff" />
                <stop offset="60%" stopColor="#9fd3ff" />
                <stop offset="100%" stopColor="#7cc5ff" />
              </linearGradient>
              <linearGradient id="g-mt" x1="0" x2="1">
                <stop offset="0%" stopColor="#e6f3ff" />
                <stop offset="100%" stopColor="#7aa3bf" />
              </linearGradient>
              <linearGradient id="g-lake" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2bb0ff" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>

            {/* sky */}
            <rect x="0" y="0" width="1200" height="420" fill="url(#g-sky)" />

            {/* distant mountains (cool blue tones) */}
            <path d="M0 260 L140 180 L260 240 L380 170 L520 230 L660 150 L820 240 L980 160 L1100 220 L1200 160 L1200 420 L0 420 Z" fill="url(#g-mt)" opacity="0.9" />

            {/* mid-ground foothills */}
            <path d="M0 320 C140 270, 300 340, 460 300 C620 260, 780 340, 940 310 C1100 280, 1200 350, 1200 350 L1200 420 L0 420 Z" fill="#a6d8ff" opacity="0.85" />

            {/* lake in the foreground */}
            <g transform="translate(0,320)">
              <path d="M0 30 C140 -10, 300 30, 460 10 C620 -10, 780 30, 940 5 C1100 -20, 1200 10, 1200 10 L1200 140 L0 140 Z" fill="url(#g-lake)" opacity="0.98" />
              {/* subtle highlights/reflections */}
              <path d="M40 50 C200 30, 360 70, 520 50" stroke="rgba(255,255,255,0.22)" strokeWidth="8" fill="none" strokeLinecap="round" />
              <path d="M660 60 C820 40, 980 80, 1140 58" stroke="rgba(255,255,255,0.16)" strokeWidth="6" fill="none" strokeLinecap="round" />
            </g>

            {/* small ger silhouette on a lakeshore (dark navy) */}
            <g transform="translate(160,250) scale(0.85)" fill="#06142a" opacity="0.95">
              <ellipse cx="80" cy="40" rx="72" ry="28" />
              <rect x="10" y="40" width="140" height="70" rx="20" />
              <path d="M10 40 C80 10, 120 10, 150 40" fill="none" stroke="#06142a" strokeWidth="3" />
              <circle cx="80" cy="28" r="6" />
            </g>

            {/* horse silhouette further along the shore */}
            <g transform="translate(760,270) scale(0.95)" fill="#06142a" opacity="0.9">
              <path d="M0 24 c12 -8,28 -12,40 -8 c8 2,14 8,22 10 c6 2,10 0,16 -2 c4 -2,8 -6,12 -6 c6 0,12 6,14 10 c4 8 2 18 -2 24 c-6 8 -16 12 -26 14 c-12 2 -24 0 -36 -6 c-8 -4 -14 -12 -22 -16 c-6 -4 -12 -8 -18 -12 z" />
              <path d="M58 12 c6 -6,14 -10,22 -10 c6 0,10 4,14 8" stroke="#06142a" strokeWidth="2" fill="none" />
            </g>
          </svg>
        )}

        <div className="hero-inner">
          {/* New two-column hero layout: copy on the left, circular visual on the right.
              Text content is kept exactly the same per request. */}
          <div className="hero-grid">
            <div className="hero-copy">
              <h1>Тал нутгийн түүхийг туулж, гэрийн тооноор оддыг ширт</h1>
              <p className="lead">Улаан гал, уудам тал, уламжлалт тав тух.
Аяллаа өнөөдөр сонго, гэртээ амар — Монголын аялал энд эхэлнэ!</p>
              <div className="cta">
                <a className="btn btn-primary" href="/listings">Энд дарж гэрээ захиалаарай</a>
                {/* small helper text (hosting mention removed) */}
                <p style={{marginTop:12, color:'#6b7280'}}></p>
              </div>
            </div>

            <div className="hero-visual" aria-hidden style={ hero ? { backgroundImage: `url(${hero})` } : undefined } />
          </div>
        </div>
      </header>

      <section className="features" aria-labelledby="features-heading">
        <div className="container">
          <h2 id="features-heading">Таны амралтыг онцгой болгох шалтгаанууд</h2>

          {/* Dynamic features: fetched from backend so admin can add/edit */}
          <div className="feature-cards" role="list">
            {/** render placeholder while loading or empty state */}
            <FeatureList />
          </div>
        </div>
      </section>

      <section className="trips">
        <div className="container">
          <h2>Сонгож болох аялалууд</h2>
          <div className="listings">
            <div className="listing">
              <div
                className="listing-img"
                style={images[0] ? { backgroundImage: `url(${images[0]})` } : undefined}
              >
                {/* clicking the yellow area will open file picker */}
                <input type="file" accept="image/*" onChange={e => handleImageChange(0, e)} />
              </div>
              <div className="listing-body">
                <h3>Уулын харагдах гэр</h3>
                <p>Хөндлөн алхагчид болон байгаль хайрлагчдад төгс — шөнийн үнэ ₮30-с эхлэнэ</p>
              </div>
            </div>
            <div className="listing">
              <div
                className="listing-img"
                style={images[1] ? { backgroundImage: `url(${images[1]})` } : undefined}
              >
                <input type="file" accept="image/*" onChange={e => handleImageChange(1, e)} />
              </div>
              <div className="listing-body">
                <h3>Гол дагасан гэр (гэр бүлийн)</h3>
                <p>Гол руу гарцтай гэр бүлийн тохиромжтой газар — шөнийн үнэ ₮45-с эхлэнэ</p>
              </div>
            </div>
            <div className="listing">
              <div
                className="listing-img"
                style={images[2] ? { backgroundImage: `url(${images[2]})` } : undefined}
              >
                <input type="file" accept="image/*" onChange={e => handleImageChange(2, e)} />
              </div>
              <div className="listing-body">
                <h3>Нүүдэлчдийн амьдралын туршлага</h3>
                <p>Соёлын туршлага авахын тулд нүүдэлч гэр бүлд нэгдээрэй — шөнийн үнэ ₮60-с эхлэнэ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs section - daily program cards */}
      <section>
        <div className="container">
          {/* lazy-load Programs component to keep landing light */}
          <Suspense fallback={<div>Ачааллаж байна...</div>}>
            <Programs />
          </Suspense>
        </div>
      </section>

      {/* News section removed per request */}

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Гэр Кэмп </p>
        </div>
      </footer>
    </div>
  )
}
