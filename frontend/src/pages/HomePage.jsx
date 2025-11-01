// 1. React'ten 'useState' ve 'useEffect' kancalarını (hooks) import ediyoruz.
// useState: Veri saklamak için (state yönetimi).
// useEffect: Bileşen yüklendiğinde bir kez çalışacak yan etkiler (API çağrısı gibi) için.
import { useState, useEffect } from 'react';
import '../App.css'; // Varsayılan stil dosyası (şimdilik kalsın)

function App() {
  
  // 2. İki adet "state" (durum) tanımlıyoruz.
  // menus: API'den gelen menüleri saklayacağımız dizi (array).
  // setMenus: Bu diziyi güncellememizi sağlayan fonksiyon.
  const [menus, setMenus] = useState([]); // Varsayılan olarak boş bir dizi.
  
  // loading: Veri yüklenirken (örn: yavaş internet) kullanıcıya bilgi vermek için.
  const [loading, setLoading] = useState(true); // Başlangıçta yükleniyor.

  // 3. useEffect: Bu bileşen (App) ekrana yüklendiğinde BİR KEZ çalışır.
  // Görevi: Backend'imizden (Django) veriyi çekmek.
  useEffect(() => {
    
    // async/await: Modern JavaScript'te API isteği yapmanın en temiz yoludur.
    // "fetchMenus" adında bir fonksiyon tanımlıyoruz.
    const fetchMenus = async () => {
      try {
        setLoading(true); // Veri çekmeye başlıyoruz, "Yükleniyor..."
        
        // 4. İSTEK ANI: Django API'mize (CORS izni aldığımız yer) istek atıyoruz.
        const response = await fetch('http://localhost:8000/api/menus/');
        
        // Gelen cevabı (JSON) parse ediyoruz (JavaScript objesine çeviriyoruz).
        const data = await response.json();
        
        // 5. BAŞARI: Gelen veriyi 'menus' state'ine kaydediyoruz.
        setMenus(data);

      } catch (error) {
        // Hata olursa konsola yazdırıyoruz.
        console.error("Menüleri çekerken bir hata oluştu:", error);
      } finally {
        // Ne olursa olsun (başarı veya hata), yüklemeyi bitiriyoruz.
        setLoading(false);
      }
    };

    fetchMenus(); // Tanımladığımız fonksiyonu çağırıyoruz.

  }, []); // <-- Bu boş dizi [] ÇOK ÖNEMLİ.
          // Anlamı: "Bu useEffect'i sadece component ilk yüklendiğinde BİR KEZ çalıştır."
          // Eğer bunu koymazsak, her 'setMenus' çağrısında component tekrar render olur
          // ve sonsuz bir API isteği döngüsüne gireriz (Çok Kötü Pratik).


  // 6. Ekrana ne çizeceğimizi (render) JSX ile tanımlıyoruz.
  
  // Yükleme (loading) hala devam ediyorsa, kullanıcıya bir mesaj göster.
  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  // Yükleme bittiyse, menüleri göster.
  return (
    <div className="App">
      <h1>Yemekhane Menüleri</h1>
      
      {/* 7. VERİYİ RENDER ETME:
        'menus' dizisi üzerinde .map() fonksiyonu ile dönüyoruz.
        Her 'menu' objesi için bir <div> oluşturuyoruz.
        Bu, React'te listeleri göstermenin "Best Practice" yoludur.
      */}
      <div className="menu-list">
        {menus.map(menu => (
          // 'key', React'in her bir elemanı ayırt edebilmesi için ZORUNLUDUR.
          <div key={menu.id} className="menu-card">
            
            {/* Django'dan gelen 'date' alanını göster */}
            <h2>{menu.date} Menüsü</h2>
            
            {/* Her menünün içindeki 'meals' dizisi üzerinde de dönüyoruz
              (İç içe .map() kullanımı).
            */}
            <ul>
              {menu.meals.map(meal => (
                <li key={meal.id}>
                  {meal.name} ({meal.calories} kcal) - [{meal.category || 'Kategori Yok'}]
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;