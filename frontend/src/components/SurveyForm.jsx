import React, {useState} from 'react';

// 1. Bu bileşen, 'props' olarak dışarıdan 'menuId' alacak.
function SurveyForm({ menuId }) {
  
  // 2. Bu bileşen, KENDİ "state"ini (durumunu) yönetir.
  //    Üç anket sorusunun cevaplarını tek bir objede tutmak en temiz yoldur.
  const [formData, setFormData] = useState({
    q_portion: 0, // 0 = Seçilmemiş
    q_taste: 0,
    q_cleanliness: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 3. Formdaki <select> (dropdown) değiştikçe state'i güncelleyen fonksiyon
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: Number(value) // Değeri sayıya çevir
    }));
  };

  // 4. Form gönderildiğinde (Submit) çalışacak fonksiyon
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.q_portion === 0 || formData.q_taste === 0 || formData.q_cleanliness === 0) {
      setMessage("Lütfen tüm anket sorularını (1-5) yanıtlayın.");
      return;
    }

    // 5. "Kimlik Kartımızı" (jeton) alıyoruz
    const token = localStorage.getItem('authToken');
    if (!token) {
      setMessage("Anketi doldurmak için giriş yapmalısınız.");
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 6. Backend'deki KORUMALI /submit_survey/ kapısına istek atıyoruz
      const response = await fetch(`http://localhost:8000/api/menus/${menuId}/submit_survey/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}` // Jetonu (kimlik kartı) ekliyoruz
        },
        // 7. JSON olarak 3 sorunun cevabını yolluyoruz (Serializer bunu bekliyordu)
        body: JSON.stringify(formData) 
      });

      if (response.ok) { // 200 (Güncellendi) veya 201 (Oluşturuldu)
        setMessage("Anketiniz başarıyla kaydedildi!");
      } else {
        const errorData = await response.json();
        setMessage(`Hata: ${errorData.detail || 'Bir sorun oluştu.'}`);
      }
    } catch (err) {
      setMessage("Ağ hatası: Anket gönderilemedi.");
    } finally {
      setLoading(false);
    }
  };
  
  // 8. Ekrana çizilecek JSX
  // (Not: 1-5'i map ile dönmek daha 'Temiz Kod' olurdu, 
  //  ancak okunabilirlik için şimdilik manuel (elle) yazalım.)
  const renderOptions = () => (
    <>
      <option value="0">Seçin...</option>
      <option value="1">1 (Kesinlikle Katılmıyorum)</option>
      <option value="2">2 (Katılmıyorum)</option>
      <option value="3">3 (Kararsızım)</option>
      <option value="4">4 (Katılıyorum)</option>
      <option value="5">5 (Kesinlikle Katılıyorum)</option>
    </>
  );

  return (
    <form onSubmit={handleSubmit} style={{ margin: '15px 0', padding: '15px', border: '1px solid #007bff' }}>
      <h4>Günün Menüsü Anketi</h4>
      
      <div>
        <label>Porsiyon yeterliydi:</label>
        <select name="q_portion" value={formData.q_portion} onChange={handleChange}>
          {renderOptions()}
        </select>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label>Yemekler lezzetliydi:</label>
        <select name="q_taste" value={formData.q_taste} onChange={handleChange}>
          {renderOptions()}
        </select>
      </div>
      
      <div style={{ marginTop: '10px' }}>
        <label>Yemekhane/Ekipman temizliği yeterliydi:</label>
        <select name="q_cleanliness" value={formData.q_cleanliness} onChange={handleChange}>
          {renderOptions()}
        </select>
      </div>
      
      <button type="submit" disabled={loading} style={{ marginTop: '15px' }}>
        {loading ? '...' : 'Anketi Gönder'}
      </button>

      {message && <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>{message}</p>}
    </form>
  );
}

export default SurveyForm;