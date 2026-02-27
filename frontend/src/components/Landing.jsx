import React from 'react'
import './Landing.css'

export default function Landing(){
  return (
    <div className="landing">
      <header className="hero">
        <div className="hero-inner">
          <h1>Experience Mongolia — Stay in a Ger</h1>
          <p className="lead">Traditional comfort, stunning landscapes, and warm hospitality. Choose your adventure and book a ger today.</p>
          <div className="cta">
            <a className="btn btn-primary" href="/listings">Book Ger</a>
            {/* small helper text */}
            <p style={{marginTop:12, color:'#6b7280'}}>No account required to browse listings — sign in to host or manage bookings.</p>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="container">
          <h2>Why choose us</h2>
          <div className="cards">
            <div className="card">
              <h3>Authentic Experience</h3>
              <p>Sleep in traditional gers and connect with local nomadic culture.</p>
            </div>
            <div className="card">
              <h3>Curated Hosts</h3>
              <p>Hosts are selected for hospitality, safety, and local knowledge.</p>
            </div>
            <div className="card">
              <h3>Flexible Trips</h3>
              <p>Day trips, multi-day treks, and family stays—book what fits your pace.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="trips">
        <div className="container">
          <h2>Trips you can choose</h2>
          <div className="listings">
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Mountain View Ger</h3>
                <p>Perfect for hikers and nature lovers — from $30 / night</p>
              </div>
            </div>
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Riverside Family Ger</h3>
                <p>Family-friendly spot with river access — from $45 / night</p>
              </div>
            </div>
            <div className="listing">
              <div className="listing-img" />
              <div className="listing-body">
                <h3>Nomad Life Experience</h3>
                <p>Join a nomad family for a cultural stay — from $60 / night</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <p>© {new Date().getFullYear()} Ger Camp — Built with care</p>
        </div>
      </footer>
    </div>
  )
}
