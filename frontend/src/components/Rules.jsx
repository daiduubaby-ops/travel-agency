import React, {useState} from 'react'
import './Rules.css'

export default function Rules(){
  const [open, setOpen] = useState(0)

  const toggle = (i) => setOpen(open === i ? -1 : i)

  return (
    <div className="rules-page container">
      <header className="rules-header">
        <div>
          <h1>АЯЛАЛЫН ЖУРАМ</h1>
          <h2>Хөвсгөл нуур — Хөвсгөл ханх — Ой тайгын болон морин аялал</h2>
        </div>
      </header>

      <main className="rules-grid">

        <article className={`rule-card ${open===0? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(0)} aria-expanded={open===0}>
            <span className="icon" aria-hidden>
              {/* packing icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 7v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>1. Аялалд гарахаас өмнөх бэлтгэл</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>1.1. Аяллын маршрутад тохирсон хувцас, уулын болон явган аяллын зориулалтын гутал, бороо/нарнаас хамгаалах хэрэгсэл, үүргэвч, гар чийдэн зэргийг бэлдэнэ.</li>
              <li>1.2. Хувийн хэрэглээний эм (архаг өвчинтэй бол шаардлагатай эм), ариун цэврийн хэрэглэл, жижиг хогийн уут авч явна.</li>
              <li>1.3. Иргэний үнэмлэх, шаардлагатай бусад бичиг баримтыг заавал авч явна.</li>
              <li>1.4. Намар, өвлийн улиралд дулаан хувцас, нэмэлт оймс, дулаан дэвсгэр болон шаардлагатай хамгаалалтын хэрэгсэл бэлднэ.</li>
              <li>1.5. Хөдөө, тайгын бүсэд сүлжээ тасрах магадлалтай тул гар утас, цэнэглэгч, power bank зэрэг хэрэгслийг хангалттай авч явна.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===1? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(1)} aria-expanded={open===1}>
            <span className="icon" aria-hidden>
              {/* health icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="0"/></svg>
            </span>
            <div className="card-title">
              <h3>2. Эрүүл мэнд, аюулгүй байдал</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>2.1. Аялагч өөрийн бие бялдрын нөхцөл, тэсвэр тэвчээрт тохирсон аяллыг сонгоно.</li>
              <li>2.2. Архаг хууч өвчтэй бол аялалд гарахаасаа өмнө эмчийн зөвлөгөө авч, шаардлагатай эмээ өөрөө авч яваарай.</li>
              <li>2.3. Аяллын явцад архидан согтуурах, бусдад саад учруулах, аюултай үйлдэл хийх зэргээр бүлгийн ажиллагааг алдагдуулбал хөтөч аялалаас хасах эрхтэй.</li>
              <li>2.4. Осол, гэмтэл, эрүүл мэндийн асуудал гарвал даруй хөтөч, багийн ахлагчид мэдэгдэнэ.</li>
              <li>2.5. Нуурын эрэг, уул хад, ой тайгын бүс, морин аяллын үед өөрийн хувийн аюулгүй байдлыг өөрөө хангана.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===2? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(2)} aria-expanded={open===2}>
            <span className="icon" aria-hidden>
              {/* horse icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20s1-4 6-4 6 4 10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 7a4 4 0 0 0-4 4v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>3. Морин болон тайгын аяллын тусгай журам</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <p><strong>3.1. Морь унахын өмнө:</strong></p>
            <ul>
              <li>Эмээл, дөрөө, хазарайг шалгуулна.</li>
              <li>Хамгаалалтын малгай өмсөх.</li>
              <li>Туршлагагүй хүн заавал хөтөчтэй хамт явах.</li>
            </ul>

            <p><strong>3.2. Морь унах үед:</strong></p>
            <ul>
              <li>Морь үргээх, хашгирах, огцом хөдөлгөөн хийхийг хатуу хориглоно.</li>
              <li>Бие биенийхээ хооронд хангалттай зай барина.</li>
              <li>Уруудах, өгсөх үед хурдыг тохируулах (огцом хурдлахгүй).</li>
            </ul>

            <p><strong>3.3. Осол гарсан тохиолдолд:</strong></p>
            <ul>
              <li>Шууд багийн ахлагч, хөтөчид мэдэгдэж, зааварчилгааг дагана.</li>
              <li>Өөрөө дур мэдэн аюултай арга хэмжээ авахгүй.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===3? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(3)} aria-expanded={open===3}>
            <span className="icon" aria-hidden>
              {/* water icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3s4 4 4 7a4 4 0 1 1-8 0c0-3 4-7 4-7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>4. Нуур орчмын аялал, завь усанд сэлэх журам</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <p><strong>4.1. Усанд сэлэхдээ:</strong></p>
            <ul>
              <li>Гүн усанд ганцаараа орохгүй.</li>
              <li>Хүйтэн усанд удаан хугацаагаар үлдэхгүй.</li>
              <li>Согтууруулах ундаа хэрэглэсэн үед усанд орохгүй.</li>
            </ul>

            <p><strong>4.2. Завиар аялах үед:</strong></p>
            <ul>
              <li>Аврах хантааз заавал өмсөнө.</li>
              <li>Цаг агаар таагүй бол завь ашиглахгүй.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===4? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(4)} aria-expanded={open===4}>
            <span className="icon" aria-hidden>
              {/* forest icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 12l7-10 7 10H5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>5. Ой тайгын бүсэд мөрдөх журам</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>5.1. Гал зөвшөөрөгдсөн газарт л түлнэ.</li>
              <li>5.2. Гал асаасан бол бүрэн унтраасан эсэхийг шалгана.</li>
              <li>5.3. Хог хаягдлыг буцааж авч явах (хог үлдэхийг хориглоно).</li>
              <li>5.4. Зэрлэг ан амьтан, ургамлыг гэмтээхгүй.</li>
              <li>5.5. Мод огтлох, ан хийхийг хориглоно.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===5? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(5)} aria-expanded={open===5}>
            <span className="icon" aria-hidden>
              {/* etiquette icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>6. Аяллын явцад баримтлах ёс зүй</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>6.1. Хөтөлбөрийн дагуу цаг баримтална.</li>
              <li>6.2. Хөтөч, жолоочийн зааврыг чандлах.</li>
              <li>6.3. Байгаль орчныг хамгаалж, хог үлдээхгүй байх.</li>
              <li>6.4. Овоо тахилга, нутгийн зан заншил, шашин шүтлэгт хүндэтгэлтэй хандана.</li>
              <li>6.5. Бусад аялагчидтай соёлтой, хүндэтгэлтэй харьцана.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===6? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(6)} aria-expanded={open===6}>
            <span className="icon" aria-hidden>
              {/* shield icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>7. Хариуцлага ба нөхөн төлбөр</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>7.1. Аялагчийн буруугаас аялал тасалдсан, хоцорсон, бичиг баримтгүйгээс оролцож чадахгүй болсон тохиолдолд төлбөр буцаан олгогдохгүй.</li>
              <li>7.2. Цаг агаар, зам хаагдах зэрэг байгалийн хүчин зүйлээс шалтгаалсан өөрчлөлтөд зохион байгуулагч хариуцлага хүлээхгүй.</li>
              <li>7.3. Хувийн эд зүйлсийг аялагч өөрөө хариуцна.</li>
              <li>7.4. Аяллын үеэр бусдад эсвэл байгаль орчинд учруулсан хохирлыг тухайн аялагч бүрэн хариуцна.</li>
            </ul>

            <div className="callout">Мэдээлэл: Тухайн нөхцөлд зохицуулалт хийх боломжтой боловч ерөнхий зарчим дээр дээрх заалт үйлчилнэ.</div>
          </div>
        </article>

        <article className={`rule-card ${open===7? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(7)} aria-expanded={open===7}>
            <span className="icon" aria-hidden>
              {/* child icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>8. Насанд хүрээгүй аялагч</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>8.1. 18-аас доош насны хүүхэд эцэг эх, асран хамгаалагчийн хамт оролцоно.</li>
              <li>8.2. Хүүхдийн аюулгүй байдал, сахилга батыг дагалдан яваа том хүн хариуцна.</li>
            </ul>
          </div>
        </article>

        <article className={`rule-card ${open===8? 'open':''}`}>
          <button className="card-header" onClick={()=>toggle(8)} aria-expanded={open===8}>
            <span className="icon" aria-hidden>
              {/* tips icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 10c1.5-1 3-1 5 0s3.5 1 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
            <div className="card-title">
              <h3>9. Тусгай зөвлөмж</h3>
            </div>
            <span className="chev" />
          </button>

          <div className="card-body">
            <ul>
              <li>9.1. Сүлжээгүй бүсэд байх магадлалтай тул ойр дотнын хүмүүстээ урьдчилан мэдэгдэнэ.</li>
              <li>9.2. Байгаль дэлхийгээ хайрлан хамгаалах нь аялагч бүрийн үүрэг.</li>
              <li>9.3. Хамтын аяллын соёл, сахилга батыг эрхэмлэнэ.</li>
            </ul>
          </div>
        </article>

      </main>

      <footer className="rules-footer">
        <p className="final-note"><em>Энэхүү журам нь аяллын явцад хөтөч, зохион байгуулагчийн нэмэлт зааварчлага, нөхцөл шаардлагаар өөрчлөгдөж болохыг анхаарна уу.</em></p>
      </footer>
    </div>
  )
}
