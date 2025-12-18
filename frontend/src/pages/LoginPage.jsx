// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '', // Backend "username" bekliyor!
    password: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        // Jetonu kaydet
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data)); // Opsiyonel
        // Ana sayfaya yönlendir
        navigate('/');
        // Sayfayı yenile ki Navbar güncellensin
        window.location.reload(); 
      } else {
        // Hata mesajını göster (Backend'den gelen array veya string olabilir)
        const errorMsg = data.non_field_errors ? data.non_field_errors[0] : "Giriş yapılamadı.";
        setMessage(errorMsg);
      }
    } catch (err) {
      setMessage("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
      <h2 style={{color: 'var(--ozal-cyan)'}}>GİRİŞ YAP</h2>
      <form onSubmit={handleSubmit} className="menu-card" style={{ gap: '15px' }}>
        <div>
          <label>Kullanıcı Adı:</label>
          <input 
            type="text" 
            name="username" 
            value={formData.username} 
            onChange={handleChange} 
            required 
            placeholder="Kullanıcı adınız..."
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
            placeholder="******"
          />
        </div>
        
        <button type="submit">GİRİŞ YAP</button>
        
        {message && <p className="error-msg" style={{marginTop:'10px'}}>{message}</p>}
      </form>
    </div>
  );
}

export default LoginPage;