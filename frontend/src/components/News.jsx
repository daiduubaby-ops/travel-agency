import React from 'react'
import './Landing.css'
import './Nav.css'

const cards = [
  // New informational pages with short descriptions
  { title: 'МОНГОЛ ОРНЫ ТУХАЙ', color: 'teal', img: '/uploads/1772810257164-l1mxwp.png', route: '/mongol', desc: 'Монгол орны түүх, соёл, байгалийн өвөрмөц газруудын тухай товч мэдээлэл.' },
  { title: 'ДАРХАД ТАЙГА, ХӨВСГӨЛ', color: 'brown', img: '/uploads/1772949320319-1fx3x0.jpg', route: '/darhad', desc: 'Дархадын тайга болон Хөвсгөл нуурын байгалийн үзэсгэлэн, аялалын маршрут.' },
  { title: 'ДОТООД АЯЛАЛ', color: 'blue', img: '/uploads/1772796652964-7hbnlf.webp', desc: 'Орон нутгийн соёл, уламжлалтай танилцах дотоод аяллын санал.' },
  { title: 'ДАЛАЙН ЭРГИЙН АЯЛАЛ', color: 'orange', img: '/uploads/1772797304650-k9vkso.jpg', desc: 'Далайн эргийн амралт, далайн бүтээгдэхүүн, аяллын багц мэдээлэл.' },
  { title: 'ӨВЛИЙН АЯЛАЛ', color: 'lightblue', img: '/uploads/1772797589684-0cvvp1.jpg', desc: 'Өвлийн улирлын онцлох аялал, цасны спорт, амралтын газрууд.' },
  { title: '2-3 ХОТЫН АЯЛАЛ', color: 'red', img: '/uploads/1772799338849-mom9n0.jpg', desc: 'Хот хоорондын аяллын маршрут, онцлох газар, зочид буудлын мэдээлэл.' },
  { title: 'СОЁЛ, СҮСЭГ БИШРЭЛИЙН АЯЛАЛ', color: 'green', img: '/uploads/1772800220860-gjx19c.jpg', desc: 'Соёлын өв, шашин шүтлэг, ёс заншилтай танилцах аялал.' },
  { title: 'ТАНСАГ ЭЗЭРГЭЛИЙН АЯЛАЛ', color: 'purple', img: '/uploads/1772800244233-0dhlna.jpg', desc: 'Тансаг зэрэглэлийн үйлчилгээтэй аяллын багц, онцлог зочид буудлууд.' }
]

export default function News(){
  return (
    <div className="container">
      <section className="news-grid" aria-label="Аяллын төрлүүд">
        {cards.map((c, i) => (
          <article
            key={i}
            className={`news-card`}
            onClick={c.route ? () => window.location.pathname = c.route : undefined}
            role={c.route ? 'link' : undefined}
            tabIndex={c.route ? 0 : undefined}
            onKeyDown={c.route ? (e) => { if(e.key === 'Enter') window.location.pathname = c.route } : undefined}
            style={c.route ? {cursor: 'pointer'} : undefined}
          >
            <div className="news-illustration" style={{backgroundImage:`url(${c.img})`}} aria-hidden="true" />
            <div className={`news-content ${c.color}`}>
              <div className="news-meta">Join x {['Khasaa','Aюурзана','Batzaya','Natsgaa','Mend'][i%5]}</div>
              <h3 className="news-title">{c.title} <span className="news-arrow">››</span></h3>
              {c.desc ? <p className="news-desc">{c.desc}</p> : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
