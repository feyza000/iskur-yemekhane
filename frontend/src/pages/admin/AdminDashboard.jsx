// frontend/src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SurveyService } from '../../services/survey.service';
import { ResponseService } from '../../services/response.service';

function AdminDashboard() {
  const [stats, setStats] = useState({
    surveyCount: 0,
    responseCount: 0 // Şimdilik 0, backend'de endpoint yazınca bağlarız
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Anketleri Çek
        const surveyData = await SurveyService.getAll();

        // 2. Cevapları Çek (Admin olduğumuz için hepsi gelir)
        const responseData = await ResponseService.getAll();

        setStats({
          // Eğer hata varsa veya dizi değilse 0 kabul et
          surveyCount: Array.isArray(surveyData) ? surveyData.length : 0,
          responseCount: Array.isArray(responseData) ? responseData.length : 0
        });

      } catch (err) {
        console.error("İstatistik hatası:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h1>Hoş Geldin, Yönetici 👋</h1>
        <p>Sistemin genel durumunu buradan takip edebilirsin.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card blue">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.surveyCount}</h3>
            <p>Aktif Anket</p>
          </div>
        </div>
        <div className="stat-card navy">
          <div className="stat-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="stat-info">
            <h3>{stats.responseCount}</h3>
            <p>Toplam Katılım</p>
          </div>
        </div>
      </div>

      <h2 style={{ color: 'var(--text-main)', marginBottom: '25px', fontSize: '1.5rem' }}>Hızlı İşlemler</h2>
      <div className="quick-actions">

        <div className="action-card">
          <h3>Yeni Anket Oluştur</h3>
          <p>Öğrenciler için yeni bir memnuniyet anketi veya yemek menüsü başlat.</p>
          <Link to="/admin/surveys" className="auth-btn" style={{ display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '15px 40px' }}>
            Yönetime Git
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;