// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import '../App.css'; 
import SurveyForm from '../components/SurveyForm';

function HomePage() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const token = localStorage.getItem('authToken');
        // ARTIK MENÜLERİ DEĞİL, ANKETLERİ ÇEKİYORUZ
        const response = await fetch('http://localhost:8000/api/surveys/', {
            headers: token ? { 'Authorization': `Token ${token}` } : {}
        });

        if (response.ok) {
          const data = await response.json();
          setSurveys(data);
        } else {
            console.error("Anketler çekilemedi");
        }
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSurveys();
  }, []);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#fff'}}>Yükleniyor...</div>;

  return (
    <div className="App">
      
      {/* BAŞLIK */}
      <div style={{textAlign:'center', marginBottom:'30px'}}>
        <h1 style={{color:'var(--ozal-orange)', fontSize:'2.5rem', textShadow:'0 0 10px rgba(0,0,0,0.5)'}}>
           ANKET SİSTEMİ
        </h1>
        <p style={{color:'var(--text-muted)'}}>Aktif etkinlikleri ve hizmetleri değerlendirin.</p>
      </div>

      <div className="menu-list">
        {surveys.length === 0 ? (
            <div style={{color:'#fff', fontSize:'1.2rem'}}>Şu an aktif bir anket bulunmuyor.</div>
        ) : (
            surveys.map(survey => (
            <div key={survey.id} className="menu-card" style={{maxWidth:'600px', flex:'1 1 500px'}}>
                
                {/* ANKET BAŞLIĞI */}
                <div className="menu-header" style={{flexDirection:'column', alignItems:'flex-start', gap:'10px'}}>
                    <h2 style={{color:'var(--ozal-cyan)'}}>{survey.title}</h2>
                    <p style={{color:'var(--text-muted)', fontSize:'0.9rem', margin:0}}>
                        {survey.description}
                    </p>
                </div>

                {/* DİNAMİK ANKET FORMU */}
                {/* SurveyForm'a bu sefer 'surveyData'yı direkt props olarak verelim ki tekrar fetch atmasın */}
                <SurveyForm preloadedSurvey={survey} />
                
            </div>
            ))
        )}
      </div>
    </div>
  );
}

export default HomePage;