import React from 'react';
import Nav from './Nav';

/**
 * UserLayout provides the common navigation and structure for public and user pages.
 * Includes the main navigation bar.
 */
const UserLayout = ({ children }) => {
  return (
    <div className="user-layout">
      <Nav />
      <main className="user-content">
        {children}
      </main>
      {/* Footer can be added here */}
    </div>
  );
};

export default UserLayout;
