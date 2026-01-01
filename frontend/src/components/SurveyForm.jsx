// frontend/src/components/SurveyForm.jsx
import React, { useState } from 'react';
import { StarInput, CheckboxInput, DateInput, ScaleInput } from './QuestionInputs'; // Bileşenleri çekiyoruz

function SurveyForm({ preloadedSurvey }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Soruları Sayfalara Böl
  // Backend'den sorular karışık gelebilir, önce order'a göre sırala
  const sortedQuestions = preloadedSurvey.questions.sort((a, b) => a.order - b.order);
  
  // Hangi sayfada hangi sorular var? Gruplayalım.
  const questionsByPage = {};
  let maxPage = 1;

  sortedQuestions.forEach(q => {
    const p = q.page_number || 1; // Eğer null gelirse 1 say
    if (!questionsByPage[p]) questionsByPage[p] = [];
    questionsByPage[p].push(q);
    if (p > maxPage) maxPage = p;
  });

  // Şu anki sayfanın soruları
  const currentQuestions = questionsByPage[currentPage] || [];

  // --- HANDLERS ---
  const handleAnswerChange = (qId, val) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const handleNext = (e) => {
    e.preventDefault();
    window.scrollTo(0, 0); 
    setCurrentPage(prev => prev + 1);
  };

  const handleBack = (e) => {
    e.preventDefault();
    setCurrentPage(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Cevaplarınızı göndermek istiyor musunuz?")) return;

    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      const payload = {
        survey: preloadedSurvey.id,
        answers: Object.entries(answers).map(([qId, val]) => ({
            question: parseInt(qId),
            value: val.toString()
        }))
      };

      const res = await fetch('http://localhost:8000/api/responses/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Gönderirken bir hata oluştu.");
      }
    } catch (err) { alert("Sunucu hatası."); } 
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
        <div style={{textAlign:'center', padding:'40px'}}>
            <div style={{fontSize:'4rem'}}>🎉</div>
            <h3 style={{color:'var(--heading-color)'}}>Teşekkürler!</h3>
            <p style={{color:'var(--text-muted)'}}>Cevaplarınız başarıyla kaydedildi.</p>
        </div>
    );
  }

  return (
    <div>
      {/* İLERLEME ÇUBUĞU (PROGRESS BAR) */}
      <div style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
        <div style={{flex:1, height:'8px', background:'var(--input-bg)', borderRadius:'4px', overflow:'hidden'}}>
            <div style={{
                width: `${(currentPage / maxPage) * 100}%`, 
                height:'100%', background:'var(--ozal-cyan)', transition:'width 0.3s'
            }}></div>
        </div>
        <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>
            Sayfa {currentPage} / {maxPage}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* SORULAR */}
        <div style={{display:'flex', flexDirection:'column', gap:'25px'}}>
            {currentQuestions.map(q => (
                <div key={q.id} style={{marginBottom:'10px'}}>
                    <label style={{display:'block', marginBottom:'10px', fontWeight:'600', color:'var(--heading-color)', fontSize:'1.05rem'}}>
                        {q.text}
                    </label>

                    {/* --- INPUT TİPLERİ --- */}
                    
                    {/* 1. KISA METİN */}
                    {q.question_type === 'text' && (
                        <input 
                            type="text" className="modern-input"
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Cevabınız..."
                        />
                    )}

                    {/* 2. TEK SEÇİM (RADIO) */}
                    {q.question_type === 'choice' && (
                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                            {q.options.split(',').map((opt, i) => (
                                <label key={i} style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                                    <input 
                                        type="radio" name={`q-${q.id}`}
                                        checked={answers[q.id] === opt.trim()}
                                        onChange={() => handleAnswerChange(q.id, opt.trim())}
                                        style={{width:'18px', height:'18px', accentColor:'var(--ozal-cyan)'}}
                                    />
                                    <span style={{color:'var(--text-main)'}}>{opt.trim()}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* 3. YENİ TİPLER: Componentlerden çağırıyoruz */}
                    {q.question_type === 'star' && (
                        <StarInput value={answers[q.id]} onChange={(val) => handleAnswerChange(q.id, val)} />
                    )}
                    
                    {q.question_type === 'multiple' && (
                        <CheckboxInput options={q.options} value={answers[q.id]} onChange={(val) => handleAnswerChange(q.id, val)} />
                    )}

                    {q.question_type === 'date' && (
                        <DateInput value={answers[q.id]} onChange={(val) => handleAnswerChange(q.id, val)} />
                    )}

                    {q.question_type === 'scale' && (
                        <ScaleInput value={answers[q.id]} onChange={(val) => handleAnswerChange(q.id, val)} />
                    )}

                </div>
            ))}
            
            {currentQuestions.length === 0 && (
                <p>Bu sayfada soru bulunamadı.</p>
            )}
        </div>

        {/* BUTONLAR */}
        <div style={{display:'flex', justifyContent:'space-between', marginTop:'30px', borderTop:'1px solid var(--card-border)', paddingTop:'20px'}}>
            
            {/* GERİ BUTONU */}
            {currentPage > 1 ? (
                <button type="button" onClick={handleBack} className="auth-btn" style={{width:'auto', background:'var(--text-muted)'}}>
                    ← Geri
                </button>
            ) : (
                <div></div>
            )}

            {/* İLERİ VEYA GÖNDER BUTONU */}
            {currentPage < maxPage ? (
                <button type="button" onClick={handleNext} className="auth-btn" style={{width:'auto', background:'var(--ozal-cyan)'}}>
                    İleri →
                </button>
            ) : (
                <button type="submit" disabled={loading} className="auth-btn" style={{width:'auto', padding:'12px 30px'}}>
                    {loading ? 'Gönderiliyor...' : 'ANKETİ TAMAMLA ✅'}
                </button>
            )}
        </div>

      </form>
    </div>
  );
}

export default SurveyForm;