import React, { useState, useEffect } from 'react'
import './Landing.css'
import './Nav.css'
import './News.css'

const defaultCards = [
  {
    title: 'Хөвсгөл нуур — байгалийн онцгой бүс',
    slug: 'hovsgol',
    // Local Windows paths can't be loaded by the browser. Use filenames
    // under /uploads so they resolve to /public/uploads/<file> via
    // getImgUrl().
    img: '/uploads/nuur.jpg',
    date: '2026-03-20',
    desc: 'Хөвсгөл нуур нь Монгол орны хойд хэсэгт орших бөгөөд цэнгэг усны асар их нөөц, байгалийн өвөрмөц тогтоц, экологийн ач холбогдлоороо онцгой байр суурь эзэлдэг. Тус нуур нь тунгалаг цэвэр ус, хүрээлэн буй ой тайга, уул нуруу, байгалийн унаган төрхөөрөө дотоод, гадаадын жуулчдын сонирхлыг татдаг. Мөн Хөвсгөл орчимд аялал жуулчлал хөгжих таатай нөхцөл бүрдсэн бөгөөд байгалийн үзэсгэлэнт газруудаар аялах маршрут, майхант болон амралтын кемпингийн сонголтууд, загасчлал хийх боломж бүхий бүсүүд өргөн байдаг. Үүнээс гадна орон нутгийн иргэдийн ахуй амьдрал, уламжлал, соёлын онцлогтой танилцах боломжтой нь энэхүү бүс нутгийн үнэ цэнийг улам нэмэгдүүлдэг..'
  },
  {
    title: 'Ой тайга — уламжлалт амьдрал ба байгалийн орчин',
    slug: 'oi-taiga-caa-urts',
    img: '/uploads/1774447368116-lwvcgz.jpg',
    date: '2026-03-18',
    desc: 'Хөвсгөлийн ой тайга нь байгалийн өвөрмөц тогтоц, ан амьтны аймаг, уламжлалт нүүдлийн соёлыг нэг дор хадгалсан ховор бүс нутаг юм. Энэ нутагт тайгын унаган экосистем бүрэлдэж, олон төрлийн ан амьтан, шувуу, ургамал тархан ургадаг нь байгалийн тэнцвэр, экологийн үнэ цэнийг илэрхийлдэг. Мөн цаачдын аж амьдрал, цаа маллах уламжлал, урцан сууц, байгальтайгаа зохицон амьдрах ахуй соёл нь энэхүү бүс нутгийн онцлог төрхийг бүрдүүлдэг. Ой тайгын орчинд аялах нь байгалийн үзэсгэлэн, нутгийн өв соёлтой танилцах боломж олгодог хэдий ч зам, цаг агаар, аюулгүй байдлыг урьдчилан тооцож, шаардлагатай бэлтгэлийг хангах нь чухал байдаг..'
  },
  { title: 'Монгол орны тухай', img: '/public/uploads/huduu.jpg', date: '2026-03-10', desc: 'Монгол орон нь өргөн уудам тал нутаг, мөнх цаст уулс, элсэн манхан, өтгөн ой тайга, тунгалаг нуурууд хосолсон байгалийн өвөрмөц тогтоцтой улс юм. Энэхүү олон янзын газарзүй нь Монгол орныг зөвхөн байгалийн үзэсгэлэнгээрээ төдийгүй нүүдэлчин ахуй, уламжлалт соёл, түүхэн өвөөрөө дэлхийд онцгойрон ялгарахад хүргэдэг. Жилийн дөрвөн улиралд өөр өөр өнгө төрхээ илэрхийлдэг энэ орон нь аялагчдад уудам байгальтай танилцах, нутгийн өв соёлыг мэдрэх, тайван амгалан атлаа мартагдашгүй аяллын туршлага хуримтлуулах боломжийг олгодог. Иймээс Монгол орон нь олон улсын зочдод байгаль, соёл, адал явдал, жинхэнэ нүүдэлчин амьдралын хэв маягийг нэг дороос мэдрэх боломжтой аяллын онцгой чиглэл болдог..' },
  { title: 'Хөвсгөл нуурын эргийн морин аялал', img: '/public/uploads/mori.jpg', date: '2026-03-05', desc: 'Хөвсгөл нуурын эргийн морин аялал нь нуурын байгалийн үзэсгэлэн, ой тайгын намуухан орчин, орон нутгийн өвөрмөц ахуй соёлыг нэгэн зэрэг мэдрэх боломж олгодог аяллын төрөл юм. Нуурын эрэг дагуух замаар морьтой аялах үед тунгалаг ус, ногоон ой, уулархаг тогтоц хосолсон үзэсгэлэнт байгаль аяллын туршид дагалддаг. Энэ төрлийн аялал нь байгалийг илүү ойроос мэдрэхийн зэрэгцээ нутгийн уламжлалт морин соёл, амьдралын хэв маягтай танилцах боломж бүрдүүлдэг. Мөн морин аялалд оролцогчид замын нөхцөл, цаг агаар, аюулгүй байдлын зөвлөмжийг анхааран, тохирсон хувцас хэрэглэлтэй явах нь чухал байдаг.э.' },
  { title: 'Хөвсгөлийн нуурын эргийн амралт', img: '/uploads/hanh.jpeg', date: '2026-02-26', desc: 'Далайн эргийн амралт, амтат хоол, аяллын багц мэдээлэлХөвсгөлийн нуурын эргийн амралт нь байгалийн тайван уур амьсгал, тунгалаг ус, цэвэр агаарыг мэдрэх боломж олгодог аяллын онцгой хэлбэр юм. Нуурын эрэг орчимд амрах хугацаанд аялагчид байгалийн үзэсгэлэнт орчинд тайван өнгөрүүлэхээс гадна алхалт хийх, нар мандах болон жаргах үеийн үзэмжийг сонирхох, орон нутгийн ахуй соёлтой танилцах боломжтой. Мөн энэ бүс нутагт амралтын бааз, кемпингийн сонголт, гэр буудал зэрэг аялагчдын хэрэгцээнд тохирсон үйлчилгээ өргөн байдаг. Иймээс Хөвсгөлийн нуурын эргийн амралт нь амралт, аялал, байгальтай ойр байх мэдрэмжийг хослуулсан үнэ цэнтэй туршлага болдог..' },
  { title: 'Хөвсгөлийн өвлийн улирал', img: '/uploads/b3826d36b744b38e78b04fea71387d01.jpg', date: '2026-01-10', desc: 'Хөвсгөлийн өвлийн улирал нь цаст уулс, мөсөн нуур, тунгалаг хүйтэн агаараараа онцгой уур амьсгал бүрдүүлдэг. Энэ үед Хөвсгөл нуур хөлдөн, байгаль орчин нам гүм атлаа үзэмж төгс төрхөө илэрхийлдэг бөгөөд өвлийн аялал, гэрэл зураг, мөсөн дээрх аялал зэрэг сонирхолтой боломжууд бүрддэг. Мөн өвлийн улиралд нутгийн ахуй соёл, уламжлалт амьдралын хэв маягтай танилцахын зэрэгцээ байгалийн өвөрмөц тогтоцыг өөр өнгө төрхөөр нь мэдрэх боломжтой. Иймээс Хөвсгөл нь өвлийн улиралд тайван амралт, байгаль үзэсгэлэн, өвөрмөц аяллын туршлагыг эрэлхийлэгчдэд тохиромжтой бүс нутаг болдог..' },
  { title: 'Мөсний баяр', img: '/uploads/29ed12f8e88703c1f4cd51224c0e6f6c.jpg', date: '2026-02-01', desc: ' Хөвсгөл нуурын мөсний баяр нь өвлийн улиралд зохион байгуулагддаг, байгаль, соёл, аяллыг хослуулсан онцгой арга хэмжээ юм. Нуурын зузаан мөсөн дээр болдог энэхүү баяр нь өвлийн өвөрмөц уур амьсгалыг мэдрүүлэхийн зэрэгцээ орон нутгийн уламжлал, урлаг, соёлын өнгө төрхийг олон нийтэд таниулдгаараа онцлогтой. Баярын үеэр мөсний дээрх тоглолт, үзүүлбэр, уралдаан тэмцээн, аяллын үйл ажиллагаа зохион байгуулдаг бөгөөд дотоод, гадаадын жуулчдын сонирхлыг татдаг. Иймээс мөсний баяр нь Хөвсгөлийн өвлийн аяллын хамгийн онцлох үйл явдлуудын нэг болдог.' }
]

export default function News(){
  const [cards, setCards] = useState(defaultCards)

  useEffect(() => {
    // try to fetch from backend; fall back to localStorage/defaults
    (async () => {
      try {
        const res = await fetch('/api/news')
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json) && json.length) {
            setCards(json)
            return
          }
        }
      } catch (e) {
        // ignore network errors
      }
      try {
        const raw = localStorage.getItem('newsCards')
        if (!raw) return
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setCards(parsed)
      } catch {}
    })()
  }, [])

  const hasCards = cards.length > 0
  const featured = hasCards ? cards[0] : null
  const others = hasCards ? cards.slice(1) : []

  // normalize image paths so frontend can load images served from the backend's
  // /public route. Cards in this file use paths like "/uploads/.." so ensure
  // they resolve to "/public/uploads/...". Also allow absolute http(s)
  // URLs (e.g. images copied from Google or other CDNs).
  const getImgUrl = (img) => {
    if (!img) return img
    if (img.startsWith('http://') || img.startsWith('https://')) return img
    if (img.startsWith('data:') || img.startsWith('blob:')) return img
    if (img.startsWith('/public')) return img
    // if it already starts with a slash (e.g. "/uploads/...") prefix /public
    if (img.startsWith('/')) return `/public${img}`
    // otherwise treat as relative to /public
    return `/public/${img}`
  }

  const [selected, setSelected] = useState(null)

  const open = (routeOrIndex) => {
    // keep existing navigation behaviour for external routing strings
    if (typeof routeOrIndex === 'string') window.location.pathname = routeOrIndex
  }

  useEffect(()=>{
    const onKey = (e)=>{ if(e.key==='Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return ()=> window.removeEventListener('keydown', onKey)
  },[])

  return (
    <section className="news-section" aria-labelledby="news-heading">
      <div className="news-bg" style={{backgroundColor:'#ffffff'}} aria-hidden="true" />
      <div className="container">
        <div className="news-inner">
          {/* header removed as requested */}

            <div className="news-layout">
          {hasCards ? (
            <>
              {/* Grid of news cards (2 columns) */}
              <div className="news-grid">
                {cards.map((c, i) => (
                  <article key={c.id || i} className="news-card grid glass-panel" tabIndex={0} onClick={() => setSelected(c)}>
                    <div className="news-grid-media" aria-hidden="true">
                      <img src={getImgUrl(c.img)} alt={c.title} className="news-grid-media-img" onError={(e)=>{e.currentTarget.src='/public/placeholder.svg'}} />
                    </div>
                      <div className="news-grid-body">
                      <div className="news-meta">{c.date}</div>
                      <h4 className="news-title">{c.title}</h4>
                       <p className="news-desc clamp-small">{c.desc}</p>
                      <div style={{ marginTop: 12 }}>
                         <button className="btn news-link" onClick={(e)=>{ e.stopPropagation(); setSelected(c); }} aria-label={`Дэлгэрэнгүй: ${c.title}`}>Дэлгэрэнгүй</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="glass-panel" style={{ padding: 20, color: '#111827' }}>
              Одоогоор мэдээ алга байна.
            </div>
          )}
          </div>
        </div>
      </div>
      {selected && (
        <div className="news-modal" onClick={()=>setSelected(null)} role="dialog" aria-modal="true" aria-label="Мэдээ дэлгэрэнгүй">
          <div className="news-modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="news-modal-media" aria-hidden="true">
               <img src={getImgUrl(selected.img)} alt={selected.title} className="news-modal-media-img" onError={(e)=>{e.currentTarget.src='/public/placeholder.svg'}} />
            </div>
            <div className="news-modal-body">
              <div className="feature-meta">Шинэчилсэн: {selected.date}</div>
              <h3 className="feature-title">{selected.title}</h3>
              <p className="feature-desc">{selected.desc}</p>
              <div style={{marginTop:16}}>
                <button className="btn" style={{marginLeft:8}} onClick={()=>setSelected(null)}>Хаах</button>
              </div>
            </div>
            <button className="news-modal-close" onClick={()=>setSelected(null)} aria-label="Хаах">✕</button>
          </div>
        </div>
      )}
    </section>
  )
}





















