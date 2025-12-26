// frontend/src/pages/EditResponse.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Yeni bileşenlerimizi buraya da import ediyoruz!
import { StarInput, CheckboxInput, DateInput, ScaleInput } from '../components/QuestionInputs';

function EditResponse() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const respRes = await fetch(`http://localhost:8000/api/responses/${id}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      if (!respRes.ok) throw new Error("Cevap bulunamadı");
      const respData = await respRes.json();

      const initialAnswers = {};
      respData.answers.forEach(a => {
        initialAnswers[a.question] = a.value;
      });
      setAnswers(initialAnswers);

      const surveyRes = await fetch(`http://localhost:8000/api/surveys/${respData.survey}/`, {
        headers: { 'Authorization': `Token ${token}` }
      });
      const surveyData = await surveyRes.json();
      
      setSurveyTitle(surveyData.title);
      setQuestions(surveyData.questions.sort((a, b) => a.order - b.order));
      
    } catch (err) {
      alert("Veri yüklenirken hata oluştu.");
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basit validasyon
    const missing = questions.find(q => !answers[q.id]);
    if (missing) {
        alert(`Lütfen "${missing.text}" sorusunu cevaplayınız.`);
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const payload = {
            answers: Object.entries(answers).map(([qId, val]) => ({
                question: parseInt(qId),
                value: val.toString()
            }))
        };

        const res = await fetch(`http://localhost:8000/api/responses/${id}/`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Cevaplarınız güncellendi! ✅");
            navigate('/profile');
        } else {
            alert("Güncelleme başarısız oldu.");
        }
    } catch (err) { alert("Hata oluştu."); }
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>Yükleniyor...</div>;

  return (
    <div style={{maxWidth:'800px', margin:'0 auto'}}>
        <div className="page-header">
            <h1>Cevabı Düzenle</h1>
            <p>"{surveyTitle}" anketi için verdiğiniz cevapları güncelleyebilirsiniz.</p>
        </div>

        <form onSubmit={handleSubmit} className="survey-form">
            {questions.map(q => (
                <div key={q.id} className="form-group" style={{marginBottom:'25px'}}>
                    <label style={{display:'block', marginBottom:'10px', fontWeight:'bold', color:'var(--heading-color)'}}>
                        {q.text}
                    </label>
                    
                    {/* --- KISA METİN --- */}
                    {q.question_type === 'text' && (
                        <input 
                            type="text"
                            className="modern-input"
                            value={answers[q.id] || ''}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                        />
                    )}

                    {/* --- TEK SEÇİM (RADIO) --- */}
                    {q.question_type === 'choice' && (
                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                            {q.options.split(',').map((opt, i) => (
                                <label key={i} style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
                                    <input 
                                        type="radio" name={`q-${q.id}`}
                                        checked={answers[q.id] === opt.trim()}
                                        onChange={() => handleChange(q.id, opt.trim())}
                                        style={{width:'18px', height:'18px', accentColor:'var(--ozal-cyan)'}}
                                    />
                                    <span style={{color:'var(--text-main)'}}>{opt.trim()}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {/* --- YENİ TİPLER --- */}
                    {q.question_type === 'star' && (
                        <StarInput value={answers[q.id]} onChange={(val) => handleChange(q.id, val)} />
                    )}

                    {q.question_type === 'multiple' && (
                        <CheckboxInput options={q.options} value={answers[q.id]} onChange={(val) => handleChange(q.id, val)} />
                    )}

                    {q.question_type === 'date' && (
                        <DateInput value={answers[q.id]} onChange={(val) => handleChange(q.id, val)} />
                    )}

                    {q.question_type === 'scale' && (
                        <ScaleInput value={answers[q.id]} onChange={(val) => handleChange(q.id, val)} />
                    )}
                </div>
            ))}

            <div style={{display:'flex', gap:'15px', marginTop:'20px'}}>
                <button type="button" onClick={() => navigate('/profile')} className="auth-btn" style={{background:'var(--text-muted)'}}>İptal</button>
                <button type="submit" className="auth-btn">Güncellemeyi Kaydet</button>
            </div>
        </form>
    </div>
  );
}

export default EditResponse;