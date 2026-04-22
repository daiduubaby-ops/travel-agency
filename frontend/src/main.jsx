import React from 'react'
import { createRoot } from 'react-dom/client'
import { isAdmin, isLoggedIn } from './utils/auth'

import Landing from './components/Landing'
import Login from './components/Login'
import Register from './components/Register'
import Nav from './components/Nav'
import Host from './components/Host'
import Listings from './components/Listings'
import Booking from './components/Booking'
import AdminDashboard from './components/AdminDashboard'
import BookedListings from './components/BookedListings'
import Rules from './components/Rules'
import News from './components/News'
import Mongol from './components/Mongol'
import Programs from './components/Programs'
import Profile from './components/Profile'
import AdminPrograms from './components/AdminPrograms'
import AdminNews from './components/AdminNews'
import UserLayout from './components/UserLayout'
import AdminLayout from './components/AdminLayout'
import Forbidden from './components/Forbidden'
import HomeBooking from './components/HomeBooking'

function App() {
  const path = window.location.pathname
  const loggedIn = isLoggedIn()
  const admin = isAdmin()
  const isAdminPath = path === '/admin' || path === '/admin/dashboard' || path.startsWith('/admin/')

  let View = Landing
  let Layout = UserLayout

  // Auth Guards
  if (isAdminPath) {
    if (!loggedIn) {
      window.location.replace('/login')
      return null
    }
    if (!admin) {
      View = Forbidden
      Layout = UserLayout // Show forbidden in user layout or its own
    } else {
      Layout = AdminLayout
    }
  } else {
    Layout = UserLayout
  }

  // Routing Logic
  if (path === '/login') View = Login
  if (path === '/register') View = Register
  if (path === '/host') View = Host
  if (path === '/listings') View = Listings
  if (path === '/rules') View = Rules
  if (path === '/news') View = News
  if (path === '/mongol') View = Mongol
  if (path === '/programs' || path.startsWith('/programs')) View = Programs
  if (path === '/home-booking') View = HomeBooking
  
  // Guarded User Routes
  if (path === '/profile') {
    if (!loggedIn) { window.location.replace('/login'); return null; }
    View = Profile
  }
  if (path === '/booked') {
    if (!loggedIn) { window.location.replace('/login'); return null; }
    View = BookedListings
  }
  if (path.startsWith('/book') && path !== '/booked') {
    if (!loggedIn) { window.location.replace('/login'); return null; }
    View = Booking
  }
  
  // Dashboard Logic (admin only)
  if (path === '/dashboard') {
    if (!loggedIn) {
      window.location.replace('/login')
      return null
    }
    if (!admin) {
      // Non-admin users should not access dashboard
      window.location.replace('/')
      return null
    }
    Layout = AdminLayout
    View = AdminDashboard
  }
  
  if (path === '/admin' || path === '/admin/dashboard') {
    // Logic already handled in Layout/View selection above
    if (admin) View = AdminDashboard
  }

  if (path.startsWith('/admin/programs')) {
    if (admin) View = AdminPrograms
  }

  if (path.startsWith('/admin/news')) {
    if (admin) View = AdminNews
  }

  return (
    <Layout>
      <View />
    </Layout>
  )
}

createRoot(document.getElementById('root')).render(<App />)
