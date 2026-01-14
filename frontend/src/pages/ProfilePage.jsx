// frontend/src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponseService } from '../services/response.service';
import { request } from '../services/api';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

function ProfilePage() {
    const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'settings'
    const [responses, setResponses] = useState([]);
    const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const navigate = useNavigate();

    // --- DATA FETCHING ---
    useEffect(() => {
        fetchMyResponses();
    }, []);

    const fetchMyResponses = async () => {
        try {
            const data = await ResponseService.getMyResponses();
            // Sort Descending (Newest first)
            const sortedData = data.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
            setResponses(sortedData);
        } catch (err) {
            console.error(err);
            toast.error("Anket geçmişi yüklenirken bir sorun oluştu.");
        }
    };

    // --- HANDLERS ---
    const handlePassChange = async (e) => {
        e.preventDefault();
        if (passData.new !== passData.confirm) {
            toast.warn("Şifreler eşleşmiyor!");
            return;
        }

        try {
            await request('/change-password/', {
                method: 'POST',
                body: JSON.stringify({
                    old_password: passData.old,
                    new_password: passData.new
                })
            });

            toast.success("Şifreniz başarıyla değiştirildi.");
            setPassData({ old: '', new: '', confirm: '' });
        } catch (err) {
            toast.error("Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.");
            console.error(err);
        }
    };

    const handleDeleteResponse = async (id) => {
        try {
            await ResponseService.delete(id);
            setResponses(prev => prev.filter(r => r.id !== id));
            toast.success("Cevabınız silindi. Anketi tekrar cevaplayabilirsiniz.");
        } catch (err) {
            console.error(err);
            toast.error("Silinemedi.");
        }
    };

    // --- ANIMATION VARIANTS ---
    const variants = {
        enter: { opacity: 0, y: 10, filter: 'blur(5px)' },
        center: { opacity: 1, y: 0, filter: 'blur(0px)' },
        exit: { opacity: 0, y: -10, filter: 'blur(5px)' },
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '50px' }}>

            {/* HEADER */}
            <div className="page-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Profilim</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Hesap ayarlarını ve anket geçmişini yönet.</p>
            </div>

            {/* TAB NAVIGATION */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '40px',
                background: 'var(--card-bg)',
                padding: '5px',
                borderRadius: '50px',
                border: '1px solid var(--card-border)',
                width: 'fit-content',
                margin: '0 auto 40px auto'
            }}>
                {['activity', 'settings'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            position: 'relative',
                            background: 'transparent',
                            border: 'none',
                            padding: '10px 30px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: activeTab === tab ? 'white' : 'var(--text-muted)',
                            zIndex: 1,
                            transition: 'color 0.2s'
                        }}
                    >
                        {tab === 'activity' ? 'Anket Geçmişi' : 'Ayarlar'}

                        {activeTab === tab && (
                            <motion.div
                                layoutId="activeTabPill"
                                style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    background: 'var(--ozal-cyan)',
                                    borderRadius: '40px',
                                    zIndex: -1
                                }}
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* CONTENT AREA */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'activity' ? (
                        /* --- ACTIVITY TAB --- */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {responses.length === 0 ? (
                                <div style={{
                                    padding: '60px',
                                    textAlign: 'center',
                                    background: 'var(--card-bg)',
                                    borderRadius: '20px',
                                    border: '1px solid var(--card-border)'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📭</div>
                                    <h3 style={{ color: 'var(--text-main)', marginBottom: '10px' }}>Henüz bir hareket yok.</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Katıldığınız anketler burada listelenecek.</p>
                                </div>
                            ) : (
                                responses.map(resp => (
                                    <motion.div
                                        key={resp.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: '25px',
                                            background: 'var(--card-bg)',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            border: '1px solid var(--card-border)',
                                            boxShadow: 'var(--card-shadow)'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--heading-color)' }}>{resp.survey_title}</h4>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>📅 {new Date(resp.submitted_at).toLocaleDateString('tr-TR')}</span>
                                                <span>•</span>
                                                <span>⏰ {new Date(resp.submitted_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => navigate(`/response/${resp.id}/edit`)}
                                                style={{
                                                    background: 'rgba(56, 189, 248, 0.1)', color: 'var(--ozal-cyan)', border: '1px solid var(--ozal-cyan)',
                                                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Düzenle
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (deleteConfirmId === resp.id) {
                                                        handleDeleteResponse(resp.id);
                                                        setDeleteConfirmId(null);
                                                    } else {
                                                        setDeleteConfirmId(resp.id);
                                                        setTimeout(() => setDeleteConfirmId(null), 3000);
                                                    }
                                                }}
                                                style={{
                                                    background: deleteConfirmId === resp.id ? '#EF4444' : 'rgba(239, 68, 68, 0.1)',
                                                    color: deleteConfirmId === resp.id ? 'white' : '#EF4444',
                                                    border: '1px solid #EF4444',
                                                    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
                                                    transition: 'all 0.2s',
                                                    minWidth: '100px'
                                                }}
                                            >
                                                {deleteConfirmId === resp.id ? 'Emin misin?' : 'Sil'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* --- SETTINGS TAB --- */
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                            <div style={{
                                background: 'var(--card-bg)',
                                padding: '40px',
                                borderRadius: '20px',
                                border: '1px solid var(--card-border)',
                                boxShadow: 'var(--card-shadow)'
                            }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '30px', color: 'var(--heading-color)' }}>Şifre Güncelle</h2>
                                <form onSubmit={handlePassChange}>
                                    <div className="modern-input-group">
                                        <label>Mevcut Şifre</label>
                                        <input
                                            type="password" className="modern-input" required
                                            value={passData.old} onChange={e => setPassData({ ...passData, old: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Yeni Şifre</label>
                                        <input
                                            type="password" className="modern-input" required
                                            value={passData.new} onChange={e => setPassData({ ...passData, new: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="modern-input-group">
                                        <label>Yeni Şifre (Tekrar)</label>
                                        <input
                                            type="password" className="modern-input" required
                                            value={passData.confirm} onChange={e => setPassData({ ...passData, confirm: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <button type="submit" className="auth-btn" style={{ marginTop: '10px' }}>
                                        Şifreyi Güncelle
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

        </div>
    );
}

export default ProfilePage;