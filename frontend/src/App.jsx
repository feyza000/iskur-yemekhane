// frontend/src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  // Artık App.jsx'in TEK SORUMLULUĞU:
  // URL'ye bakmak ve doğru sayfayı (component) ekrana basmaktır.
  return (
    <div>
      {/* Basit bir navigasyon menüsü ekleyelim */}
      <nav>
        <Link to="/">Ana Sayfa</Link> | 
        <Link to="/login">Giriş Yap</Link> | 
        <Link to="/register">Kayıt Ol</Link>
      </nav>

      <hr />

      {/* TRAFİK POLİSİ (Router'ın kararları) */}
      <Routes>
        {/* URL '/' (ana dizin) ise: HomePage component'ini göster */}
        <Route path="/" element={<HomePage />} />

        {/* URL '/login' ise: LoginPage component'ini göster */}
        <Route path="/login" element={<LoginPage />} />

        {/* URL '/register' ise: RegisterPage component'ini göster */}
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </div>
  );
}

export default App;