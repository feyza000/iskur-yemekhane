// frontend/src/components/SurveyForm.jsx
import React, { useState, useEffect } from 'react';

// preloadedSurvey: Eğer ana sayfa veriyi gönderirse onu kullan, yoksa null
function SurveyForm({ preloadedSurvey = null }) {
  const [survey, setSurvey] = useState(preloadedSurvey);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(!preloadedSurvey); // Eğer veri geldiyse loading false
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Eğer dışarıdan veri gelmediyse (preloadedSurvey yoksa) kendimiz çekelim
    if (!preloadedSurvey) {
        const fetchSurvey = async () => {
          try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:8000/api/surveys/', {
                headers: token ? { 'Authorization': `Token ${token}` } : {}
            });
            if (response.ok) {
              const data = await response.json();
              if (data.length > 0) setSurvey(data[0]);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
        fetchSurvey();
    }
  }, [preloadedSurvey]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert("Anketi göndermek için giriş yapmalısınız!");
      return;
    }

    setSubmitting(true);
    
    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        question: qId,
        value: val.toString()
    }));

    const payload = {
        survey: survey.id,
        answers: formattedAnswers
    };

    try {
      const response = await fetch('http://localhost:8000/api/responses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage("Cevabınız kaydedildi, teşekkürler!");
        setAnswers({});
      } else {
        setMessage("Hata oluştu veya daha önce gönderdiniz.");
      }
    } catch (err) {
      setMessage("Ağ hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question) => {
    
    // A) YILDIZ SORUSU
    if (question.question_type === 'star') {
      return (
        <div className="star-rating-group">
          {[1, 2, 3, 4, 5].map(star => (
            <span
              key={star}
              className={`star ${answers[question.id] >= star ? 'active' : ''}`}
              onClick={() => handleAnswerChange(question.id, star)}
              style={{cursor: 'pointer', fontSize: '1.5rem', marginRight: '5px'}}
            >
              ★
            </span>
          ))}
        </div>
      );
    }

    // B) METİN SORUSU
    if (question.question_type === 'text') {
      return (
        <textarea
          rows="3"
          placeholder="Cevabınız..."
          value={answers[question.id] || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
        />
      );
    }

    // C) SEÇMELİ SORU (YENİ ÖZELLİK)
    if (question.question_type === 'choice') {
        // Backend'den gelen "Evet, Hayır" stringini diziye çeviriyoruz
        const optionsArray = question.options ? question.options.split(',').map(opt => opt.trim()) : [];
        
        return (
            <select 
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="survey-select" // CSS'te stil vereceğiz
            >
                <option value="">Seçiniz...</option>
                {optionsArray.map((opt, index) => (
                    <option key={index} value={opt}>{opt}</option>
                ))}
            </select>
        );
    }

    return <input type="text" onChange={(e) => handleAnswerChange(question.id, e.target.value)} />;
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (!survey) return null;

  return (
    <form onSubmit={handleSubmit} className="survey-form" style={{borderTop:'none', padding:0, marginTop:0}}>
      {/* Soru Listesi */}
      {survey.questions.map(q => (
        <div key={q.id} className="form-group" style={{marginBottom: '20px'}}>
          <label style={{display:'block', marginBottom:'8px', color:'var(--ozal-cyan)', fontWeight:'600'}}>
            {q.text}
          </label>
          {renderQuestionInput(q)}
        </div>
      ))}

      <button type="submit" disabled={submitting} className="survey-btn">
        {submitting ? '...' : 'GÖNDER'}
      </button>
      {message && <p className="message">{message}</p>}
    </form>
  );
}

export default SurveyForm;