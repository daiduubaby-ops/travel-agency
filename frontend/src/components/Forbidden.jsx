import React from 'react';

const Forbidden = () => {
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#f8fafc'
    }}>
      <h1 style={{ fontSize: '6rem', margin: 0, color: '#1e293b' }}>403</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#475569' }}>Хандах эрхгүй байна</h2>
      <p style={{ color: '#64748b', maxWidth: '400px', marginBottom: '2rem' }}>
        Уучлаарай, та энэ хуудас руу хандах зөвшөөрөлгүй байна. Зөвхөн админ эрхтэй хэрэглэгч нэвтрэх боломжтой.
      </p>
      <a href="/" style={{ 
        padding: '0.75rem 1.5rem', 
        backgroundColor: '#3b82f6', 
        color: 'white', 
        textDecoration: 'none', 
        borderRadius: '0.5rem',
        fontWeight: 600
      }}>Нүүр хуудас руу буцах</a>
    </div>
  );
};

export default Forbidden;
