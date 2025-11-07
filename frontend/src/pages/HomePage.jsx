// frontend/src/pages/HomePage.jsx

import { useState, useEffect } from 'react';
import '../App.css'; 
import RatingForm from '../components/RatingForm';
import SurveyForm from '../components/SurveyForm';

function HomePage() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/menus/');
        const data = await response.json();
        setMenus(data);
      } catch (error) {
        console.error("Menüleri çekerken bir hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const handleLike = async (menuId) => {
    
    // 1. "Kasamızdan" (localStorage) kimlik kartımızı (jeton) alıyoruz.
    const token = localStorage.getItem('authToken');

    // 2. Jeton (kimlik kartı) yoksa, kullanıcı giriş yapmamıştır.
    //    Bu bir "Savunmacı Programlama" (Defensive Programming) kontrolüdür.
    if (!token) {
      alert("Beğenmek için lütfen giriş yapın.");
      // TODO (Belki burada kullanıcıyı /login sayfasına yönlendirebiliriz)
      return; 
    }

    try {
      // 3. Backend'deki KORUMALI API'mıza POST isteği atıyoruz.
      //    Hangi menüyü beğendiğimizi (menuId) URL'e ekliyoruz.
      const response = await fetch(`http://localhost:8000/api/menus/${menuId}/like/`, {
        method: 'POST',
        headers: {
          // Bu iki başlık (header) ÇOK ÖNEMLİ
          'Content-Type': 'application/json',
          
          // 4. KİMLİK KARTINI GÖSTERME (Authentication)
          //    "Authorization" başlığına jetonumuzu "Token ..." formatında ekliyoruz.
          //    Django (Backend) bu başlığı görünce request.user'ı dolduracak.
          'Authorization': `Token ${token}`
        },
        // Bu isteğe bir 'body' (gövde) yollamıyoruz,
        // Django kim olduğumuzu jetondan, neyi beğendiğimizi URL'den bilecek.
      });

      // 5. Backend'den gelen cevabı işliyoruz
      if (response.ok) { // HTTP 201 Created (Başarılı)
        alert("Menü beğenildi!");
        // (İleride burayı, butonu 'beğenildi' olarak işaretlemesi için güncelleyebiliriz)
      } else {
        // HTTP 400 Bad Request (Zaten beğenilmiş) veya
        // HTTP 401 Unauthorized (Jeton geçersiz/süresi dolmuş)
        const errorData = await response.json();
        alert(`Hata: ${errorData.detail || 'Bir sorun oluştu.'}`);
      }
    } catch (err) {
      // Ağ hatası (Backend çalışmıyor vb.)
      alert("Beğenme işlemi sırasında bir ağ hatası oluştu.");
    }
  };


  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="App">
      <h1>Yemekhane Menüleri</h1>
      
      <div className="menu-list">
        {menus.map(menu => (
          <div key={menu.id} className="menu-card">
            
            <h2>{menu.date} Menüsü</h2>
            
            {/* 6. YENİ EKLENEN BUTON: Kalp (Beğen) Butonu */}
            {/* onClick olduğunda, 'handleLike' fonksiyonunu çağır
              ve ona *bu* menünün ID'sini (menu.id) parametre olarak ver.
            */}
            <button 
              onClick={() => handleLike(menu.id)}
              style={{ fontSize: '20px', cursor: 'pointer' }}
            >
              ♥
            </button>
            
            <ul>
              {menu.meals.map(meal => (
                <li key={meal.id}>
                  {meal.name} ({meal.calories} kcal)
                  <RatingForm mealId={meal.id} />                  
                </li>
              ))}
            </ul>            
                  <SurveyForm menuId={menu.id} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default HomePage;