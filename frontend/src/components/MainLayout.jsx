// frontend/src/components/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom'; // <--- 1. Outlet IMPORT ET

const MainLayout = ({ theme, toggleTheme }) => { // children prop'una artık gerek yok
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('username');
    const staffStatus = localStorage.getItem('isStaff') === 'true';

    if (token) {
      setIsAuthenticated(true);
      setUsername(storedUser || 'Kullanıcı');
      setIsAdmin(staffStatus);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('isStaff'); // Admin bilgisini de sil
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="layout-wrapper">

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="logo-link">
            <img src="/logo.png" alt="Logo" className="nav-logo" />
          </Link>

          <div className="nav-actions">
            <div className="nav-links">
              <Link to="/">Ana Sayfa</Link>

              {isAdmin && (
                <Link to="/admin" style={{ color: 'var(--ozal-orange)' }}>YÖNETİM PANELİ</Link>
              )}

              {/* KULLANICI ALANI */}
              {isAuthenticated ? (
                <div className="user-menu">
                  <Link to="/profile" style={{ textDecoration: 'none' }}>
                    <span className="user-welcome">
                      Merhaba, <strong>{username}</strong>
                    </span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="logout-btn"
                    title="Çıkış Yap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login">Giriş Yap</Link>
                  <Link to="/register">Kayıt Ol</Link>
                </>
              )}
            </div>

            <button
              onClick={toggleTheme}
              className="theme-btn"
              title="Temayı Değiştir"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>

      {/* İÇERİK */}
      <main className="main-content">
        {/* ESKİSİ: {children} */}
        {/* YENİSİ: <Outlet /> */}
        {/* Bu sayede Route içinde tanımlanan HomePage, LoginPage buraya yerleşecek */}
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <p>
          &copy; {new Date().getFullYear()} Malatya Turgut Özal Üniversitesi -
          <strong style={{ color: 'var(--ozal-cyan)', marginLeft: '5px' }}>
            Dijital Dönüşüm Ofisi
          </strong>
        </p>
      </footer>

    </div>
  );
};

export default MainLayout;