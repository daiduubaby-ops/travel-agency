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
  // booking page supports query param ?id=123 or path starting with /book
  // but exclude the /booked page which should show BookedListings
  if(path.startsWith('/book') && path !== '/booked') View = Booking
  return (
    <>
      <Nav />
      <View />
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
