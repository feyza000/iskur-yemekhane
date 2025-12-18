import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
  return (
    <> {}
      
      {}
      <nav>
        {}
        <div className="nav-container">
            <Link to="/">
                <img src="/logo.png" alt="Turgut Özal Üniversitesi" className="nav-logo" />
            </Link>
            
            <div className="nav-links">
                <Link to="/">Ana Sayfa</Link>
                <Link to="/login">Giriş Yap</Link>
                <Link to="/register">Kayıt Ol</Link>
            </div>
        </div>
      </nav>

      {/* ANA İÇERİK */}
      <div className="App">
        {}
        {}

        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </>
  );
}

export default App;