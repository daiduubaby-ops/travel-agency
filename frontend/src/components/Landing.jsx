import React, { useEffect, useState } from 'react'
import './Landing.css'
import Programs from './Programs'

// Inline SVG icons to avoid extra assets
const IconHeritage = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M6 7h12v10H6z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconLandscape = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
    <path d="M3 16c3-3 5-5 9-5s6 2 9 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)
const IconHospitality = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
    <path d="M12 3v6l4 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconAdventure = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
    <path d="M3 21l9-18 9 18H3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Use bundled hero image that matches the reference design.
// Prefer the backend static URL (VITE_API_URL) when available so the
// hero loads even when the frontend is served separately from the backend.
const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000'
// Prefer the frontend public asset (served at /hero_photo.jpg by Vite)
// but also try backend-served /public paths when available.
const sampleHero = '/hero_photo.jpg'

// The hero image can be replaced by an admin via the admin UI which
// uploads to /api/upload/home and the server writes it to
// backend/public/home-hero.jpg. Load the image dynamically so the
// landing page uses the admin-updated image when present.
const categoryImgs = [
  '/public/uploads/1772799338849-mom9n0.jpg',
  '/public/uploads/1772800220860-gjx19c.jpg',
  '/public/uploads/1772810636346-m39do1.jpg'
]

const tours = [
  { id:1, image:'/public/uploads/1772800244233-0dhlna.jpg', title:'Хоньчин болон Монгол гэрийн тур', price:'$320', rating:4.8, tags:['Хэнтий','3 өдөр'] },
  { id:2, image:'/public/uploads/1772797589684-0cvvp1.jpg', title:'Өргөн талын морьт аялал', price:'$480', rating:4.9, tags:['Төв аймаг','5 өдөр'] },
  { id:3, image:'/public/uploads/1772896080646-0wbjw0.jpg', title:'Хангайн нуруу, нуурын аялал', price:'$395', rating:4.7, tags:['Хангай','4 өдөр'] }
]

// Search bar component removed per request

export default function Landing(){
  const [hero, setHero] = useState(sampleHero)

  useEffect(() => {
    let mounted = true
    // try fetch the backend-served hero (proxy in dev -> /public/home-hero.jpg)
    // try absolute backend URL first (works when backend is running),
    // then fall back to proxied /public path which is handled by Vite proxy.
    // 1) try backend absolute URL (useful when frontend is served separately)
    fetch(`${API_BASE}/public/hero_photo.jpg`, { method: 'HEAD' }).then(res => {
      if(!mounted) return
      if(res.ok) setHero(`${API_BASE}/public/hero_photo.jpg`)
    }).catch(()=>{/* ignore */})
    // 2) try proxied backend path (/public) — Vite proxy maps /public to backend
    .finally(() => {
      fetch('/public/hero_photo.jpg', { method: 'HEAD' }).then(res => {
        if(!mounted) return
        if(res.ok) setHero('/public/hero_photo.jpg')
      }).catch(()=>{/* ignore */})
      // 3) final fallback: bundled frontend public asset served at /hero_photo.jpg
      .finally(() => {
        fetch('/hero_photo.jpg', { method: 'HEAD' }).then(res => {
          if(!mounted) return
          if(res.ok) setHero('/hero_photo.jpg')
        }).catch(()=>{/* ignore */})
      })
    })
    return () => { mounted = false }
  }, [])

  return (
    <div className="mongol-landing">
      {/* Use an explicit inline background-image as a fallback so the hero image
          is visible even if CSS custom properties are not applied by the
          environment/proxy. This ensures the background shows during dev. */}
      <header
        className="hero has-hero half-hero"
        style={{
          // set both the explicit background-image and the CSS variable used by
          // Landing.css (.hero.half-hero uses var(--hero-image)). Some browsers
          // or build setups may prefer the CSS variable path, so set both to be safe.
          backgroundImage: `linear-gradient(180deg, rgba(3,37,65,0.22), rgba(3,37,65,0.06)), url(${hero})`,
          '--hero-image': `url(${hero})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Fallback <img> to ensure hero shows even if background-image is blocked
            or not applied in certain environments (helps during development). */}
        <img
          src={hero}
          alt="hero"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            pointerEvents: 'none'
          }}
        />
        <div className="overlay" />

        <div className="container hero-inner">
          <div className="hero-content" role="region" aria-label="Hero">
            {/* Hero overlay text removed as requested - keep structure for layout */}
            <div className="hero-copy" aria-hidden />
          </div>
        </div>
      </header>

      {/* Featured program cards that visually overlap the hero (like the reference) */}
      <div className="hero-programs container" aria-hidden>
        <div className="hero-cards">
          {tours.slice(0,4).map(t => (
            <article key={t.id} className="program-card hero-card">
              <div className="program-media" aria-hidden>
                <img src={t.image} alt="" />
                <div className="badge-top">JOINME.MN ОНЦЛОХ</div>
              </div>
              <div className="program-body">
                <div className="program-head">
                  <h3>{t.title}</h3>
                </div>
                <div className="program-meta">
                  <div className="program-location"><span className="icon">📍</span> {t.tags && t.tags[0]}</div>
                </div>
                <div className="program-footer">
                  <div>
                    <div style={{fontSize:12,color:'#6b7280'}}>Эхлэх үнэ</div>
                    <div style={{fontWeight:800,fontSize:20}}>{t.price}</div>
                  </div>
                  <div className="program-actions">
                    <a className="btn btn-outline" href="/programs">Дэлгэрэнгүй</a>
                    <a className="btn btn-primary" href="/programs">Захиалах</a>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div style={{textAlign:'center', marginTop:22}}>
          <a className="btn btn-primary" href="/programs">Бүгдийг үзэх</a>
        </div>
      </div>

      <main>
        <section className="why container">
          <h2>Яагаад Хөвсгөл аймгийг сонгох вэ?</h2>
          <div className="why-grid">
            <div className="why-item">
              <div className="icon"><IconHeritage /></div>
              <h4>Сүрлэг байгаль</h4>
              <p>Хөвсгөл нуур, тайга, уулс хосолсон онцгой тогтоц нь аялагч бүрт мартагдашгүй мэдрэмж төрүүлнэ.</p>
            </div>
            <div className="why-item">
              <div className="icon"><IconLandscape /></div>
              <h4>Нүүдлийн соёл</h4>
              <p>Орон нутгийн өв уламжлал, ахуй амьдрал нь Монголын жинхэнэ өнгө төрхийг мэдрэх боломж олгоно.</p>
            </div>
            <div className="why-item">
              <div className="icon"><IconHospitality /></div>
              <h4>Тайван амралт</h4>
              <p>Цэвэр агаар, нам гүм орчин, байгалийн тэнцвэрт уур амьсгал нь бие сэтгэлийг амраах төгс нөхцөл бүрдүүлдэг.</p>
            </div>
            <div className="why-item">
              <div className="icon"><IconAdventure /></div>
              <h4>Адал явдал</h4>
              <p>Явган аялал, уулын маршрут, нуур орчмын аялал зэрэг сонирхол татам туршлагууд таныг хүлээж байдаг.</p>
            </div>
          </div>
        </section>

        {/* Render programs grid (reuses Programs component) so the landing page shows
            the same program cards layout as the dedicated Programs page. */}
        <Programs />

        <section className="testimonial">
          <div className="container">
            <div className="testimonial-card">
              <img className="avatar" src="/public/uploads/1772810257164-l1mxwp.png" alt="user avatar" />
              <blockquote>"Монголын тал нутагт бид амьдралын хамгийн чөлөөт, мартагдашгүй хайрыг мэдэрсэн. Хөтөч, гэр бүл — бүх зүйл төгс байлаа."</blockquote>
              <cite> </cite>
            </div>
          </div>
        </section>

        {/* Newsletter section removed as requested */}

      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="col">
            <h4>Khankh Tour</h4>
            <p className="muted">Утас: +976 95699988<br/>И-мэйл: info@mongolayalal.mn</p>
          </div>
          <div className="col social">
            <h4>Бидэнтэй холбогдоно уу</h4>
            <div className="icons">
              
            
            </div>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} — Бүх эрх хуулиар хамгаалагдсан</div>
      </footer>
    </div>
  )
}
