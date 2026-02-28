import React from 'react'
import { createRoot } from 'react-dom/client'

import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import Nav from './components/Nav'
import Host from './components/Host'
import Listings from './components/Listings'
import Booking from './components/Booking'
import Dashboard from './components/Dashboard'
import BookedListings from './components/BookedListings'
import Rules from './components/Rules'
import News from './components/News'
import Programs from './components/Programs'
import Profile from './components/Profile'
import AdminPrograms from './components/AdminPrograms'



function App(){
  // Simple client-side routing using location.pathname
  const path = window.location.pathname
  let View = Landing
  if(path === '/login') View = Login
  if(path === '/register') View = Register
  if(path === '/host') View = Host
  if(path === '/dashboard') View = Dashboard
  if(path === '/listings') View = Listings
  if(path === '/booked') View = BookedListings
  if(path === '/rules') View = Rules
  if(path === '/news') View = News
  // support both the programs list and individual program detail routes like /programs/1
  if(path === '/programs' || path.startsWith('/programs')) View = Programs
  if(path === '/profile') View = Profile
  if(path === '/admin/programs' || path.startsWith('/admin/programs')) View = AdminPrograms
  // booking page supports query param ?id=123 or path starting with /book
  // but exclude the /booked page which should show BookedListings
  if(path.startsWith('/book') && path !== '/booked') View = Booking
// Favorites page removed from navigation; keep component for now if needed
  
  return (
    <>
      <Nav />
      <View />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
