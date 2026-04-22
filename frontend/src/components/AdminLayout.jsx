import React from 'react';
import AdminSidebar from './AdminSidebar';

/**
 * AdminLayout provides the structure for all administrative pages.
 * Includes a sidebar and a scrollable content area.
 */
const AdminLayout = ({ children }) => {
  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <AdminSidebar />
      <main className="admin-content" style={{ 
        flex: 1, 
        marginLeft: '260px', 
        padding: '2.5rem',
        minHeight: '100vh'
      }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
