import React, { Suspense } from 'react'
import './Landing.css'

// lazy load Programs to keep initial bundle small
const Programs = React.lazy(() => import('./Programs'))

export default function Landing(){
  return (
    <div className="landing">
      <header className="hero">
        {/* Decorative Mongolian landscape illustration (pure SVG) */}
        <svg className="hero-illustration" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="g-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="60%" stopColor="#FCE7A9" />
              <stop offset="100%" stopColor="#FDE68A" />
            </linearGradient>
            <linearGradient id="g-hill" x1="0" x2="1">
              <stop offset="0%" stopColor="#ecfccb" />
              <stop offset="100%" stopColor="#bbf7d0" />
            </linearGradient>
            <linearGradient id="g-mt" x1="0" x2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* sky */}
          <rect x="0" y="0" width="1200" height="420" fill="url(#g-sky)" />

          {/* distant mountains */}
          <path d="M0 260 L120 180 L220 240 L340 160 L460 230 L600 140 L740 230 L900 150 L980 210 L1200 130 L1200 420 L0 420 Z" fill="url(#g-mt)" opacity="0.14" />

          {/* rolling hills */}
          <path d="M0 300 C150 240, 300 320, 450 280 C600 240, 750 320, 900 290 C1050 260, 1200 330, 1200 330 L1200 420 L0 420 Z" fill="url(#g-hill)" opacity="0.95" />

          {/* ger (yurt) silhouette */}
          <g transform="translate(180,230) scale(0.9)">
            <ellipse cx="80" cy="40" rx="72" ry="28" fill="#fff7ed" opacity="0.95" />
            <rect x="10" y="40" width="140" height="70" rx="20" fill="#fff7ed" opacity="0.95" />
            <path d="M10 40 C80 10, 120 10, 150 40" fill="none" stroke="#d97706" strokeWidth="3" opacity="0.9" />
            <circle cx="80" cy="28" r="6" fill="#d97706" />
          </g>

          {/* horse silhouette */}
          <g transform="translate(760,260) scale(0.95)" fill="#0b1220" opacity="0.85">
            <path d="M0 24 c12 -8,28 -12,40 -8 c8 2,14 8,22 10 c6 2,10 0,16 -2 c4 -2,8 -6,12 -6 c6 0,12 6,14 10 c4 8 2 18 -2 24 c-6 8 -16 12 -26 14 c-12 2 -24 0 -36 -6 c-8 -4 -14 -12 -22 -16 c-6 -4 -12 -8 -18 -12 z" />
            <path d="M58 12 c6 -6,14 -10,22 -10 c6 0,10 4,14 8" stroke="#0b1220" strokeWidth="2" fill="none" />
          </g>

        </svg>

        <div className="hero-inner">
          <h1>Монголыг туулж мэдрэх — Гэрт саат</h1>
          <p className="lead">Уламжлалт тав тух, гайхамшигтай байгаль, халуун дулаан зочломтгой байдал. Аялалаа сонгож, өнөөдөр гэр захиал.</p>
          <div className="cta">
            <a className="btn btn-primary" href="/listings">Гэр захиалах</a>
            {/* small helper text */}
            <p style={{marginTop:12, color:'#6b7280'}}>Жагсаалтыг үзэхэд данс шаардлаггүй — гэр хостлох эсвэл захиалгаа удирдах бол нэвтэрнэ үү.</p>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="container">
          <h2>Яагаад биднийг сонгох вэ</h2>
          <div className="cards">
            <div className="card">
              <h3>Жинхэнэ туршлага</h3>
              <p>Уламжлалт гэрт унтаж, нутгийн нүүдэлчин соёлтой холбогдоно.</p>
            </div>
            <div className="card">
              <h3>Халагдсан хостууд</h3>
              <p>Хостууд зочломтгой байдал, аюулгүй байдал болон нутгийн мэдлэгээр шалгарсан.</p>
            </div>
            <div className="card">
              <h3>Уян хатан аялал</h3>
              <p>Өдөр тутмын аялал, хэд хэдэн өдрийн аялал, гэр бүлийн байр — өөрт тохирохыг захиална уу.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trips">
        <div className="container">
          <h2>Сонгож болох аялалууд</h2>
          <div className="listings">
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Уулын харагдах гэр</h3>
                <p>Хөндлөн алхагчид болон байгаль хайрлагчдад төгс — шөнийн үнэ $30-с эхлэнэ</p>
              </div>
            </div>
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Гол дагасан гэр (гэр бүлийн)</h3>
                <p>Гол руу гарцтай гэр бүлийн тохиромжтой газар — шөнийн үнэ $45-с эхлэнэ</p>
              </div>
            </div>
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Нүүдэлчдийн амьдралын туршлага</h3>
                <p>Соёлын туршлага авахын тулд нүүдэлч гэр бүлд нэгдээрэй — шөнийн үнэ $60-с эхлэнэ</p>
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
          <p>© {new Date().getFullYear()} Гэр Кэмп — Хайртайгаар бүтээгдсэн</p>
        </div>
      </footer>
    </div>
  )
}
