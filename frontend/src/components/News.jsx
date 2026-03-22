import React from 'react'
import './Landing.css'
import './Nav.css'

const cards = [
  { title: 'Монгол орны тухай', img: '/uploads/1772810257164-l1mxwp.png', date: '2026-03-10', desc: 'Монгол орны байгалийн өвөрмц тойм — олон улсын зочдод зориулсан аяллын онцлог.' },
  { title: 'Дотоод аялал шинэ маршрут', img: '/uploads/1772796652964-7hbnlf.webp', date: '2026-03-05', desc: 'Орон нутгийн соёл, уламжлалтай танилцах шинэ маршрут нээгдлээ.' },
  { title: 'Далайн эргийн амралт', img: '/uploads/1772797304650-k9vkso.jpg', date: '2026-02-26', desc: 'Далайн эргийн амралт, амтат хоол, аяллын багц мэдээлэл.' },
  { title: 'Өвлийн улирлын зөвлөмж', img: '/uploads/1772797589684-0cvvp1.jpg', date: '2026-01-10', desc: 'Өвлийн аялалд зориулсан бэлтгэл, аюулгүй байдлын зөвлөмжүүд.' },
  { title: 'Эко үзэсгэлэн - уулзалт', img: '/uploads/1772800244233-0dhlna.jpg', date: '2026-02-01', desc: 'Байгаль хамгаалал, байгальтай ээлтэй аялалын талаарх эвент.' }
]

export default function News(){
  const featured = cards[0]
  const others = cards.slice(1)

  const open = (routeOrIndex) => {
    // placeholder navigation — in this app we use pathname changes for simple routing
    if(typeof routeOrIndex === 'string') window.location.pathname = routeOrIndex
  }

  return (
    <section className="news-section" aria-labelledby="news-heading">
      <div className="news-bg" style={{backgroundImage:`linear-gradient(180deg, rgba(2,36,20,0.72), rgba(2,12,18,0.84)), url('/uploads/1772949320319-1fx3x0.jpg')`}} aria-hidden="true" />
      <div className="container">
        <div className="news-inner">
          <header className="news-header">
            <h2 id="news-heading">Мэдээ мэдээлэл</h2>
            <p className="news-sub">Сүүлийн шинэчлэлт, арга хэмжээ, аяллын зөвлөмж болон зарлал — байгальтай зүй зохистой аяллын мэдээллийг эндээс аваарай.</p>
          </header>

          <div className="news-layout">
            <article className="news-feature glass-panel" tabIndex={0} onClick={() => open('/') } onKeyDown={(e)=>{if(e.key==='Enter')open('/')}}>
              <div className="feature-media" style={{backgroundImage:`url(${featured.img})`}} aria-hidden="true" />
              <div className="feature-body">
                <div className="feature-meta">Шинэчилсэн: {featured.date}</div>
                <h3 className="feature-title">{featured.title}</h3>
                <p className="feature-desc">{featured.desc} Илүү дэлгэрэнгүй мэдээллийг уншина уу.</p>
                <div className="feature-actions">
                  <button className="btn news-btn">Дэлгэрэнгүй</button>
                </div>
              </div>
            </article>

            <aside className="news-side">
              <div className="news-grid-small">
                {others.map((c,i) => (
                  <article key={i} className="news-card small glass-panel" tabIndex={0} onClick={()=>open('/')} onKeyDown={(e)=>{if(e.key==='Enter')open('/')}}>
                    <div className="news-illustration" style={{backgroundImage:`url(${c.img})`}} aria-hidden="true" />
                    <div className="news-content">
                      <div className="news-meta">{c.date}</div>
                      <h4 className="news-title">{c.title}</h4>
                      <p className="news-desc">{c.desc}</p>
                      <div className="news-actions">
                        <button className="btn news-link">Дэлгэрэнгүй <span className="arrow">›</span></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}
