import React, { useState } from 'react';

// 1. Bu bileşen, 'props' (özellikler) olarak dışarıdan 'mealId' alacak.
//    Buna "props" denir ve React'in temelidir.
function RatingForm({ mealId }) {
  
  // 2. Bu bileşen, KENDİ "state"ini (durumunu) yönetir.
  //    Sadece seçilen puanı saklar.
  const [score, setScore] = useState(0); // 0 = Puan seçilmemiş
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 3. Form gönderildiğinde (Submit) çalışacak fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault(); // Sayfa yenilemeyi engelle

    if (score === 0) {
      setMessage("Lütfen 1 ile 5 arası bir puan seçin.");
      return;
    }

    // 4. "Kimlik Kartımızı" (jeton) alıyoruz
    const token = localStorage.getItem('authToken');
    if (!token) {
      setMessage("Puan vermek için giriş yapmalısınız.");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 5. Backend'deki KORUMALI /rate/ kapısına istek atıyoruz
      const response = await fetch(`http://localhost:8000/api/meals/${mealId}/rate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` // Jetonu (kimlik kartı) ekliyoruz
        },
        // 6. JSON olarak "score" alanını yolluyoruz (Serializer bunu bekliyordu)
        body: JSON.stringify({ score: score }) 
      });

      if (response.ok) {
        // Backend'in 'update_or_create' sayesinde 200 (OK) veya 201 (Created) döner
        setMessage("Puanınız başarıyla kaydedildi!");
      } else {
        const errorData = await response.json();
        setMessage(`Hata: ${errorData.detail || 'Bir sorun oluştu.'}`);
      }
    } catch (err) {
      setMessage("Ağ hatası: Puan verilemedi.");
    } finally {
      setLoading(false);
    }
  };

  // 7. Ekrana ne çizileceği (JSX)
  return (
    <form onSubmit={handleSubmit} style={{ margin: '10px 0', padding: '10px', border: '1px solid #ccc' }}>
      <strong>Yemeği Puanla:</strong>
      <div>
        {/* Puan seçimi için <select> (dropdown) kullanmak en basitidir */}
        <select 
          value={score} 
          onChange={(e) => setScore(Number(e.target.value))} // Gelen değeri sayıya çevir
        >
          <option value="0">Seçin...</option>
          <option value="1">1 Yıldız</option>
          <option value="2">2 Yıldız</option>
          <option value="3">3 Yıldız</option>
          <option value="4">4 Yıldız</option>
          <option value="5">5 Yıldız</option>
        </select>
        
        <button type="submit" disabled={loading} style={{ marginLeft: '10px' }}>
          {loading ? '...' : 'Gönder'}
        </button>
      </div>
      {/* Kullanıcıya geri bildirim verdiğimiz yer */}
      {message && <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>{message}</p>}
    </form>
  );
}

export default RatingForm;