import React, { useState } from 'react'
import './Landing.css'

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

// Use bundled hero image that matches the reference design
const sampleHero = '/public/home-hero.jpg'
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

function SearchBar(){
  const [place, setPlace] = useState('')
  const [type, setType] = useState('Бүх төрөл')
  const [date, setDate] = useState('')
  return (
    <form className="searchbar" onSubmit={(e)=>e.preventDefault()} role="search">
      <div className="field">
        <label className="sr-only">Очих газар</label>
        <input value={place} onChange={e=>setPlace(e.target.value)} placeholder="Очих газар" />
      </div>
      <div className="field">
        <label className="sr-only">Аяллын төрөл</label>
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option>Бүх төрөл</option>
          <option>Соёлын аялал</option>
          <option>Адал явдал</option>
          <option>Байгалийн аялал</option>
        </select>
      </div>
      <div className="field">
        <label className="sr-only">Хугацаа</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <button className="cta" aria-label="Аялал хайх">Аялал хайх</button>
    </form>
  )
}

export default function Landing(){
  return (
    <div className="mongol-landing">
      <header className="hero has-hero" style={{ backgroundImage: `url(${sampleHero})` }}>
        <div className="overlay" />
        <div className="container hero-inner">
          {/* Top navigation removed as requested */}

          <div className="hero-content" role="region" aria-label="Hero">
            <h1 className="headline">
              <span className="line1">Монгол орны хязгааргүй уудамд</span>
              <span className="accent">Мартагдашгүй дурсамжийг</span>
            </h1>
            <div className="hero-subwrap">
              <p className="sub">Эртний соёл • Байгалийн гайхамшиг • Адал явдал</p>
              <div className="hero-note">⭐ 2025 оны зуны улирлын захиалга эхэллээ • Эрт бүртгүүлсэнд <strong className="gold">10% хөнгөлөлт</strong></div>
            </div>
            {/* decorative underline */}
            <svg className="hero-divider" width="220" height="18" viewBox="0 0 220 18" aria-hidden>
              <path d="M4 9c30-18 50-4 80 0s50-14 80 0" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            </svg>
          </div>

          {/* floating glass-like search bar positioned over bottom edge of hero */}
          <div className="search-float glass-search" role="search">
            <SearchBar />
          </div>
        </div>
      </header>

      <main>
        <section className="categories container">
          <h2>Категори</h2>
          <div className="cards">
            {[{title:'Соёлын аялал', img:categoryImgs[0]}, {title:'Адал явдал', img:categoryImgs[1]}, {title:'Байгалийн аялал', img:categoryImgs[2]}].map((c,i)=> (
              <article key={i} className="cat-card" style={{ backgroundImage: `url(${c.img})` }}>
                <div className="card-overlay" />
                <h3>{c.title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section className="why container">
          <h2>Яагаад Хөвсгөл аймгийн Ханх сумыг сонгох вэ?</h2>
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

        <section id="tours" className="tours container">
          <h2>Популяр Аялалууд</h2>
          <div className="tour-grid">
            {tours.map(t => (
              <article key={t.id} className="tour-card">
                <div className="tour-media" style={{ backgroundImage: `url(${t.image})` }}>
                  <div className="price">{t.price}</div>
                </div>
                <div className="tour-body">
                  <h3>{t.title}</h3>
                  <div className="meta">
                    <div className="rating">{'★'.repeat(Math.round(t.rating))} <span className="muted">{t.rating}</span></div>
                    <div className="tags">{t.tags.map((tg,i)=>(<span key={i} className="tag">{tg}</span>))}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="testimonial">
          <div className="container">
            <div className="testimonial-card">
              <img className="avatar" src="/public/uploads/1772810257164-l1mxwp.png" alt="user avatar" />
              <blockquote>"Монголын тал нутагт бид амьдралын хамгийн чөлөөт, мартагдашгүй хайрыг мэдэрсэн. Хөтөч, гэр бүл — бүх зүйл төгс байлаа."</blockquote>
              <cite> — Н. Бат</cite>
            </div>
          </div>
        </section>

        {/* Newsletter section removed as requested */}

      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="col">
            <h4>Монгол Аялал</h4>
            <p className="muted">Утас: +976 00 000000<br/>И-мэйл: info@mongolayalal.mn</p>
          </div>
          <div className="col social">
            <h4>Бидэнтэй холбогдоно уу</h4>
            <div className="icons">
              <a href="#" aria-label="facebook">FB</a>
              <a href="#" aria-label="instagram">IG</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} Монгол Аялал — Бүх эрх хуулиар хамгаалагдсан</div>
      </footer>
    </div>
  )
}
