// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/components.css';
import SurveyForm from '../components/SurveyForm';

function HomePage() {
    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // Arama State'i

    const [expandedSurveyId, setExpandedSurveyId] = useState(null);

    // Debounce search effect
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            setIsAuthenticated(false);
            setLoading(false);
            return;
        }

        setIsAuthenticated(true);

        // Her tuş vuruşunda istek atmamak için 500ms gecikme
        const timeoutId = setTimeout(() => {
            fetchSurveys(token, searchTerm);
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const fetchSurveys = async (token, query = "") => {
        try {
            // Backend'e parametre gönderiyoruz
            const url = query
                ? `http://localhost:8000/api/surveys/?search=${encodeURIComponent(query)}`
                : 'http://localhost:8000/api/surveys/';

            const response = await fetch(url, {
                headers: { 'Authorization': `Token ${token}` }
            });
            if (response.ok) {
                setSurveys(await response.json());
            }
        } catch (error) {
            console.error("Hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSurvey = (id) => {
        setExpandedSurveyId(expandedSurveyId === id ? null : id);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
            <div className="loader"></div>
        </div>
    );
    // GİRİŞ YAPILMAMIŞSA BU KART GÖRÜNMELİ
    if (!isAuthenticated) {
        return (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                <div className="menu-card" style={{ textAlign: 'center', maxWidth: '600px', padding: '60px 40px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔒</div>
                    <h2 style={{ color: 'var(--heading-color)', marginBottom: '15px' }}>Oturum Açmanız Gerekiyor</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '30px', fontSize: '1.1rem' }}>
                        Etkinlik ve anketleri görüntülemek, oylamalara katılmak için lütfen giriş yapınız.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/login" className="auth-btn" style={{ textDecoration: 'none', width: 'auto', padding: '15px 40px' }}>
                            Giriş Yap
                        </Link>
                        <Link to="/register" className="auth-btn" style={{ textDecoration: 'none', width: 'auto', padding: '15px 40px', background: 'transparent', color: 'var(--ozal-orange)', border: '2px solid var(--ozal-orange)' }}>
                            Kayıt Ol
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // GİRİŞ YAPILMIŞSA ANKETLER
    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '80px' }}>

            <div className="page-header" style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Aktif Anketler</h1>
                <p style={{ opacity: 0.7 }}>Görüşlerinle kampüsü şekillendir.</p>

                {/* 🔍 ARAMA BUTONU */}
                <div style={{ marginTop: '20px', maxWidth: '400px', margin: '20px auto 0' }}>
                    <input
                        type="text"
                        placeholder="Anket ara... (Örn: Yemek)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            borderRadius: '30px',
                            border: '1px solid var(--card-border)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-main)',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {surveys.length === 0 ? (
                    <div className="menu-card" style={{ textAlign: 'center', padding: '60px' }}>
                        <h3 style={{ color: 'var(--text-muted)' }}>📭 Şu an aktif bir anket bulunmuyor.</h3>
                    </div>
                ) : (
                    surveys.map(survey => {
                        const isOpen = expandedSurveyId === survey.id;

                        return (
                            <motion.div
                                key={survey.id}
                                className={`accordion-item ${isOpen ? 'open' : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {/* BAŞLIK (HEADER) */}
                                <div
                                    className="accordion-header"
                                    onClick={() => toggleSurvey(survey.id)}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                                            <span className="status-dot"></span> {/* Yeşil nokta */}
                                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{survey.title}</h3>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                                            {survey.description}
                                        </p>
                                    </div>

                                    {/* DÖNEN İKON */}
                                    <motion.div
                                        className="accordion-icon-wrapper"
                                        animate={{ rotate: isOpen ? 45 : 0 }} // Artı (+) çarpı (x) olur
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                    </motion.div>
                                </div>

                                {/* İÇERİK (BODY) - ANIMASYONLU */}
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            style={{ overflow: 'hidden' }} // Animasyon sırasında taşmayı önler
                                        >
                                            <div className="accordion-body">
                                                <SurveyForm preloadedSurvey={survey} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default HomePage;