// frontend/src/components/AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';

const AdminLayout = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const [authStatus, setAuthStatus] = useState('loading'); 

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const isStaff = localStorage.getItem('isStaff') === 'true';

    if (!token) setAuthStatus('guest');
    else if (!isStaff) setAuthStatus('student');
    else setAuthStatus('admin');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isStaff');
    navigate('/login');
    window.location.reload();
  };


  if (authStatus === 'guest') {
    return (
        // DÜZELTME: background: 'transparent' yaptık (Logoyu kapatmasın diye)
        <div style={{minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'transparent'}}>
            <div style={{background:'var(--card-bg)', padding:'50px', borderRadius:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.1)', textAlign:'center', maxWidth:'500px', border:'1px solid var(--card-border)'}}>
                <div style={{fontSize:'4rem', marginBottom:'20px'}}>🛡️</div>
                <h2 style={{color:'var(--heading-color)', marginBottom:'10px'}}>Yönetici Erişimi Gerekiyor</h2>
                <p style={{color:'var(--text-muted)', marginBottom:'30px'}}>
                    Bu sayfayı görüntülemek için yönetici hesabınızla giriş yapmalısınız.
                </p>
                <Link to="/login" style={{
                    background: 'var(--ozal-navy)', color: 'white', padding: '15px 30px', 
                    borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display:'inline-block'
                }}>
                    Admin Girişi Yap
                </Link>
            </div>
        </div>
    );
  }

  // --- DURUM 2: YETKİSİZ KULLANICI (ÖĞRENCİ) ---
  if (authStatus === 'student') {
    return (
        // DÜZELTME: background: 'transparent' yaptık
        <div style={{minHeight:'100vh', display:'flex', justifyContent:'center', alignItems:'center', background:'transparent'}}>
             <div style={{background:'var(--card-bg)', padding:'50px', borderRadius:'16px', boxShadow:'0 10px 30px rgba(0,0,0,0.1)', textAlign:'center', maxWidth:'500px', borderTop:'5px solid red', border:'1px solid var(--card-border)'}}>
                <div style={{fontSize:'4rem', marginBottom:'20px'}}>🚫</div>
                <h2 style={{color:'red', marginBottom:'10px'}}>Erişim Reddedildi</h2>
                <p style={{color:'var(--text-muted)', marginBottom:'30px'}}>
                    Bu alana giriş yetkiniz bulunmamaktadır.
                </p>
                <div style={{display:'flex', gap:'15px', justifyContent:'center'}}>
                    <Link to="/" style={{
                        background: 'var(--text-muted)', color: 'var(--bg-body)', padding: '12px 25px', 
                        borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'
                    }}>
                        Ana Sayfaya Dön
                    </Link>
                    <button onClick={handleLogout} style={{
                        background: 'transparent', border:'2px solid var(--text-muted)', color: 'var(--text-muted)', 
                        padding: '12px 25px', borderRadius: '8px', cursor:'pointer', fontWeight: 'bold', fontSize:'1rem'
                    }}>
                        Çıkış Yap
                    </button>
                </div>
            </div>
        </div>
    );
  }
  if (authStatus === 'loading') return null;

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <div className="sidebar-title">YÖNETİM PANELİ</div>
        </div>

        <nav className="sidebar-menu">
          <NavLink to="/admin" className="menu-item" end>
            <span>📊</span> Genel Bakış
          </NavLink>
          
          <NavLink to="/admin/surveys" className="menu-item">
            <span>📝</span> Anket Yönetimi
          </NavLink>
          
          {/* Yemek Listesi SİLİNDİ */}
          
          <NavLink to="/admin/users" className="menu-item">
             <span>👥</span> Kullanıcılar
          </NavLink>

          <NavLink to="/" className="menu-item" style={{background:'rgba(255,255,255,0.05)', marginBottom:'10px', border:'1px solid rgba(255,255,255,0.1)'}}>
            <span>🏠</span> Siteye Dön
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={toggleTheme} 
            className="menu-item" 
            style={{background:'transparent', border:'none', width:'100%', cursor:'pointer', marginBottom:'5px', justifyContent:'flex-start'}}
          >
            <span>{theme === 'light' ? '🌙' : '☀️'}</span> 
            {theme === 'light' ? 'Koyu Mod' : 'Aydınlık Mod'}
          </button>

          <button onClick={handleLogout} className="menu-item" style={{background:'transparent', border:'none', width:'100%', cursor:'pointer'}}>
            <span>🚪</span> Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="admin-content">
        {/* İçerik buraya dolacak */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;