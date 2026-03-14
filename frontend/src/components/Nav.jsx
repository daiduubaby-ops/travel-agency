import React, { useState, useEffect, useRef } from 'react'
import './Nav.css'

export default function Nav(){
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch (e) {
      return null
    }
  })

  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'user') {
        setUser(e.newValue ? JSON.parse(e.newValue) : null)
      }
    }
    window.addEventListener('storage', onStorage)
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // cleanup for scroll listener on unmount
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleLogout(){
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // redirect to home
    window.location.href = '/'
  }

  return (
    <nav className={`site-nav ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <div className="nav-left">
          <a className="brand" href="/">Khankh Tour</a>

          

         
        </div>

        <div className="nav-links">
          <a href="/listings"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          </span>Гэр захиалах</a>
          
          <a href="/news"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H7L3 6v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><path d="M7 10h8M7 14h5"/></svg>
          </span>Мэдээ мэдээлэл</a>
          <a href="/mongol">Монгол орны тухай</a>
          <a href="/darhad">Дархад тайга, Хөвсгөл</a>
          <a href="/programs"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </span>Аяллын хөтөлбөр</a>
          <a href="/rules"><span className="nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18M7 9h10M10 13h4"/></svg>
          </span>Аяллын журам</a>
          {user && (
            <>
              <a href="/booked"><span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              </span>Захиалсан</a>
              <a href="/dashboard"><span className="nav-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              </span>Дашбоард</a>
          {user ? (
            <a href="/profile" className="profile-link" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none'}}>
                <label style={{display:'inline-block',position:'relative'}}>
                  <input type="file" accept="image/*" style={{display:'none'}} onChange={async (e)=>{
                    const f = e.target.files && e.target.files[0];
                    if(!f) return;
                    try{
                      const fd = new FormData(); fd.append('image', f);
                      const token = localStorage.getItem('token');
                      const res = await fetch((import.meta.env?.VITE_API_BASE||'') + '/api/upload/avatar', { method: 'POST', body: fd, headers: token?{ Authorization: `Bearer ${token}` }:{}})
                      const data = await res.json();
                      if(res.ok){
                        // update local user in localStorage so UI updates across the app
                        const u = JSON.parse(localStorage.getItem('user')||'null') || {};
                        u.avatar = data.user.avatar;
                        localStorage.setItem('user', JSON.stringify(u));
                        window.dispatchEvent(new StorageEvent('storage', { key: 'user', newValue: JSON.stringify(u) }));
                      } else {
                        alert(data.message || 'Upload failed')
                      }
                    }catch(err){
                      console.error(err); alert('Upload error')
                    }
                  }} />
                  <img src={user.avatar||''} alt={user.name||'U'} onError={(e)=>{e.target.onerror=null;e.target.src=''}} style={{width:26,height:26,borderRadius:9999,background:'#f1f3f5',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#374151',objectFit:'cover'}}/>
                </label>
              <span style={{fontSize:14,color:'var(--text-dark,#0b1220)',fontWeight:600}}>{user.name}</span>
            </a>
          ) : (
            <a href="/profile"><span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-3-3.87"/><path d="M4 21v-2a4 4 0 0 1 3-3.87"/><circle cx="12" cy="7" r="4"/></svg>
            </span>Профайл</a>
          )}
            </>
          )}

          {!user && (
            <a className="btn" href="/login"><span className="nav-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>
            </span>Нэвтрэх</a>
          )}

          {user && (
            <>
              <span className="user-name">Сайн уу, {user.name}</span>
              <button className="btn btn-ghost" onClick={handleLogout}>Гарах</button>
            </>
          )}
        </div>

        {/* Quick actions removed — profile is available in the main menu (nav-links) */}
      </div>
    </nav>
  )
}
