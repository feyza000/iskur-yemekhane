// frontend/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ResponseService } from '../services/response.service';
import { request } from '../services/api'; // Şifre değişimi için özel endpoint kullanıyorsak veya auth service'e eklemeliyiz

function ProfilePage() {
    const [activeTab, setActiveTab] = useState('history'); // history | password
    const [responses, setResponses] = useState([]);
    const [passData, setPassData] = useState({ password: '', confirm: '' });
    const navigate = useNavigate();

    // Verileri Çek
    useEffect(() => {
        fetchMyResponses();
    }, []);

    const fetchMyResponses = async () => {
        try {
            // Backend'de get_queryset ile filtrelediğimiz için sadece benimkiler gelir
            // ResponseService.getMyResponses() -> /responses/ (backend user filter yapıyor varsayıyoruz)
            const data = await ResponseService.getMyResponses();
            setResponses(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handlePassChange = async (e) => {
        e.preventDefault();
        if (passData.password !== passData.confirm) {
            alert("Şifreler eşleşmiyor!");
            return;
        }

        try {
            // Şifre değişimi için AuthService'e metot eklemedik, manuel request atalım veya ekleyelim.
            // Hızlı çözüm: request helper kullanmak
            await request('/change-password/', {
                method: 'POST',
                body: JSON.stringify({ new_password: passData.password }) // Backend'in beklediği key 'new_password' olabilir
            });

            alert("Şifreniz başarıyla değiştirildi.");
            setPassData({ password: '', confirm: '' }); // Şifre alanlarını temizle
        } catch (err) {
            alert("Şifre değiştirilemedi. Lütfen tekrar deneyin."); // Hata mesajını güncelledik
            console.error(err);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

            <div className="page-header">
                <h1>Profilim</h1>
                <p>Hesap ayarlarını ve anket geçmişini yönet.</p>
            </div>

            {/* SEKMELER */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--nav-border)', marginBottom: '30px' }}>
                <button
                    onClick={() => setActiveTab('history')}
                    style={{
                        padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                        color: activeTab === 'history' ? 'var(--ozal-cyan)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'history' ? '3px solid var(--ozal-cyan)' : 'none'
                    }}>
                    Anket Geçmişim
                </button>
                <button
                    onClick={() => setActiveTab('password')}
                    style={{
                        padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold',
                        color: activeTab === 'password' ? 'var(--ozal-cyan)' : 'var(--text-muted)',
                        borderBottom: activeTab === 'password' ? '3px solid var(--ozal-cyan)' : 'none'
                    }}>
                    Şifre Değiştir
                </button>
            </div>

            {/* --- GEÇMİŞ TAB --- */}
            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {responses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                            <h3 style={{ color: 'var(--text-muted)' }}>Henüz bir ankete katılmadınız.</h3>
                        </div>
                    ) : (
                        responses.map(resp => (
                            <div key={resp.id} style={{ background: 'var(--card-bg)', padding: '25px', borderRadius: '12px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--heading-color)' }}>
                                        {resp.survey_title}
                                    </h3>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                        Katılım Tarihi: {new Date(resp.submitted_at).toLocaleDateString('tr-TR')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => navigate(`/response/${resp.id}/edit`)} // <--- YÖNLENDİRME
                                    className="auth-btn"
                                    style={{ width: 'auto', padding: '8px 20px', fontSize: '0.9rem', background: 'var(--ozal-navy)' }}
                                >
                                    Cevabımı Düzenle ✏️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- ŞİFRE TAB --- */}
            {activeTab === 'password' && (
                <div style={{ background: 'var(--card-bg)', padding: '40px', borderRadius: '16px', border: '1px solid var(--card-border)', maxWidth: '500px', margin: '0 auto' }}>
                    <form onSubmit={handlePassChange}>
                        <div className="modern-input-group">
                            <label>Yeni Şifre</label>
                            <input
                                type="password" className="modern-input" required
                                value={passData.password} onChange={e => setPassData({ ...passData, password: e.target.value })}
                            />
                        </div>
                        <div className="modern-input-group">
                            <label>Yeni Şifre (Tekrar)</label>
                            <input
                                type="password" className="modern-input" required
                                value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                            />
                        </div>
                        <button type="submit" className="auth-btn">Şifreyi Güncelle</button>
                    </form>
                </div>
            )}

        </div>
    );
}

export default ProfilePage;