import React from 'react'

export default function Host(){
  const user = (() => { try { return JSON.parse(localStorage.getItem('user')) } catch { return null } })()

  // Public host page (no forced redirect). If user is present we personalize the message.
  return (
    <div className="host-page">
      <div className="container">
        <h2>Host a Ger</h2>
        {user ? (
          <p>Welcome {user.name}. This is a placeholder for the host flow — create your listing here.</p>
        ) : (
          <>
            <p>Thinking of hosting? Create an account to list your ger and manage bookings, or continue to learn more.</p>
            <p><a className="btn" href="/register">Create account</a></p>
          </>
        )}
      </div>
    </div>
  )
}
