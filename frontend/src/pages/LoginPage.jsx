import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// import { Link } from 'react-router-dom'; // (Opsiyonel: Kayıt linki için)

function LoginPage() {
  
  // 1. Form verisi için state (Kontrollü Bileşen)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // 2. Yüklenme ve Hata state'leri
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 3. Yönlendirme için
  const navigate = useNavigate();

  // 4. Form input'larını güncelleyen standart fonksiyonumuz
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // 5. Form gönderildiğinde (Submit) çalışacak fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault(); // Sayfa yenilemeyi engelle

    setLoading(true);
    setError(null);

    try {
      // 6. Django'daki /api/login/ kapısına POST isteği atıyoruz
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Django'nun 'obtain_auth_token' view'i 'username' ve 'password' bekler
        body: JSON.stringify(formData), 
      });

      if (response.ok) {
        // 7. BAŞARILI GİRİŞ (HTTP 200 OK)
        // Backend'den gelen JSON'u ({"token": "..."}) al
        const data = await response.json();
        
        // 8. EN KRİTİK ADIM: Jetonu tarayıcının kasasına (localStorage) kaydet
        // Bu jeton, artık bizim "kimlik kartımız".
        localStorage.setItem('authToken', data.token);
        
        alert('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz.');
        // Kullanıcıyı ana sayfaya yönlendir
        navigate('/'); 

      } else {
        // 9. BAŞARISIZ GİRİŞ (HTTP 400 Bad Request)
        // Django "Kullanıcı adı veya şifre hatalı" derse burası çalışır
        setError('Kullanıcı adı veya şifre hatalı.');
      }
    } catch (err) {
      // Ağ hatası (Backend çalışmıyor vb.)
      setError('Giriş sırasında bir ağ hatası oluştu. Sunucu çalışıyor mu?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Giriş Yap</h1>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>E-posta:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Şifre:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange} 
            required
          />
        </div>
        
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
        </button>
        
        {/* Opsiyonel: Kullanıcının hesabı yoksa kayıt sayfasına link
        <p>
          Hesabınız yok mu? <Link to="/register">Buradan kayıt olun</Link>
        </p>
        */}
      </form>
    </div>
  );
}

export default LoginPage;