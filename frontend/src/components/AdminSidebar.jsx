import React from 'react';
import { logout } from '../utils/auth';

/**
 * AdminSidebar provides navigation for administrative tasks.
 */
const AdminSidebar = () => {
  return (
    <aside className="admin-sidebar" style={{ 
      width: '260px', 
      height: '100vh', 
      backgroundColor: '#f8fafc', 
      borderRight: '1px solid #e2e8f0',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <div className="sidebar-header" style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>Админ Самбар</h2>
      </div>

      <nav className="sidebar-links" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <a href="/admin" style={linkStyle}>
          <IconBookings /> Захиалга хянах
        </a>
        <a href="/admin/programs" style={linkStyle}>
          <IconPrograms /> Хөтөлбөр нэмэх / хасах
        </a>
        <a href="/admin/news" style={linkStyle}>
          <IconNews /> Мэдээ нэмэх / устгах
        </a>
      </nav>

      <div className="sidebar-footer">
        <a href="/" style={{ ...linkStyle, color: '#64748b' }}>
          <IconHome /> Нүүр хуудас руу шилжих
        </a>
        <button onClick={logout} style={{ 
          ...linkStyle, 
          width: '100%', 
          textAlign: 'left', 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer',
          color: '#ef4444' 
        }}>
          <IconLogout /> Гарах
        </button>
      </div>
    </aside>
  );
};

// Simple Styles
const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  textDecoration: 'none',
  color: '#475569',
  borderRadius: '0.5rem',
  fontSize: '0.925rem',
  fontWeight: 500,
  transition: 'all 0.2s'
};

// Tiny Icons
const IconPrograms = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const IconBookings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>;
const IconNews = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15V6a2 2 0 0 0-2-2H7L3 6v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/><path d="M7 10h8M7 14h5"/></svg>;
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IconLogout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

export default AdminSidebar;
