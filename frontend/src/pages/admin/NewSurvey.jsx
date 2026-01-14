import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyService } from '../../services/survey.service';

function NewSurvey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Survey Info
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: ''
  });

  // Questions List
  const [questions, setQuestions] = useState([
    // page_number default 1
    { text: '', question_type: 'text', options: '', order: 1, page_number: 1 }
  ]);

  // --- HANDLERS ---

  const handleSurveyChange = (e) => {
    setSurveyData({ ...surveyData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      // Newly added question is on page 1 by default, user can change it
      { text: '', question_type: 'text', options: '', order: questions.length + 1, page_number: 1 }
    ]);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!window.confirm("Anketi yayınlamak istiyor musunuz?")) return;

    setLoading(true);
    const token = localStorage.getItem('authToken');

    try {
      // STEP 1: Create Survey
      const createdSurvey = await SurveyService.create(surveyData);
      const surveyId = createdSurvey.id;

      // STEP 2: Create Questions
      const questionPromises = questions.map((q, index) => {
        const payload = {
          survey: surveyId,
          text: q.text,
          question_type: q.question_type,
          // If Checkbox (multiple) or Radio (choice), send options
          options: (q.question_type === 'choice' || q.question_type === 'multiple')
            ? (typeof q.options === 'string' ? q.options.split(',').map(o => o.trim()) : q.options)
            : null,
          order: index + 1,
          page_number: q.page_number || 1 // Page number
        };
        return SurveyService.createQuestion(payload);
      });

      await Promise.all(questionPromises);

      alert("Anket başarıyla oluşturuldu! 🎉");
      navigate('/admin/surveys');

    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>

      {/* BACK BUTTON */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/admin/surveys')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', fontWeight: '600' }}
        >
          ← Listeye Dön
        </button>
      </div>

      <div className="dashboard-header">
        <h1>Yeni Anket Oluştur</h1>
        <p>Anket başlığını girin ve soruları ekleyin.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

        {/* --- 1. SURVEY CARD --- */}
        <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <h3 style={{ color: 'var(--heading-color)', marginTop: 0 }}>Anket Detayları</h3>

          <div className="modern-input-group">
            <label>Anket Başlığı</label>
            <input
              type="text" name="title" className="modern-input" required
              placeholder="Örn: 2025 Bahar Şenliği Planlaması"
              value={surveyData.title} onChange={handleSurveyChange}
            />
          </div>

          <div className="modern-input-group">
            <label>Açıklama (Opsiyonel)</label>
            <textarea
              name="description" className="modern-input" rows="3"
              placeholder="Anket hakkında kısa bilgi..."
              value={surveyData.description} onChange={handleSurveyChange}
            />
          </div>
        </div>

        {/* --- 2. QUESTIONS LIST --- */}
        <div style={{ background: 'var(--card-bg)', padding: '30px', borderRadius: '16px', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--heading-color)', margin: 0 }}>Sorular ({questions.length})</h3>
            <button type="button" onClick={addQuestion} className="auth-btn" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', background: 'var(--ozal-cyan)' }}>
              + Soru Ekle
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {questions.map((q, index) => (
              <div key={index} style={{ background: 'var(--bg-body)', padding: '20px', borderRadius: '12px', border: '1px solid var(--card-border)', position: 'relative' }}>

                {/* Delete Button */}
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(index)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: 'red', cursor: 'pointer', fontSize: '1.2rem' }}>
                    ✖
                  </button>
                )}

                {/* Question Text */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Soru Metni</label>
                  <input
                    type="text" className="modern-input" required
                    value={q.text} onChange={(e) => handleQuestionChange(index, 'text', e.target.value)}
                    placeholder="Soru nedir?"
                  />
                </div>

                {/* Type and Page Selection (SIDE BY SIDE) */}
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cevap Tipi</label>
                    <select
                      className="modern-input"
                      value={q.question_type} onChange={(e) => handleQuestionChange(index, 'question_type', e.target.value)}
                    >
                      <option value="text">Kısa Metin</option>
                      <option value="star">Yıldız</option>
                      <option value="scale">1-10 Puan (Ölçek)</option>
                      <option value="choice">Tek Seçim (Radio)</option>
                      <option value="multiple">Çoklu Seçim (Checkbox)</option>
                      <option value="date">Tarih</option>
                    </select>
                  </div>

                  <div style={{ width: '100px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sayfa No</label>
                    <input
                      type="number" min="1" className="modern-input"
                      value={q.page_number}
                      onChange={(e) => handleQuestionChange(index, 'page_number', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {/* REQUIRED CHECKBOX */}
                <div style={{ width: '80px', textAlign: 'center' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Zorunlu</label>
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--ozal-cyan)', cursor: 'pointer' }}
                  />
                </div>

                {/* Options (Visible only if Choice or Multiple) */}
                {(q.question_type === 'choice' || q.question_type === 'multiple') && (
                  <div style={{ background: 'rgba(239, 127, 26, 0.1)', padding: '15px', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: 'var(--ozal-orange)', fontWeight: 'bold' }}>Seçenekler</label>
                    <input
                      type="text" className="modern-input"
                      placeholder="Elma, Armut, Muz (Virgülle ayırın)"
                      value={q.options} onChange={(e) => handleQuestionChange(index, 'options', e.target.value)}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Seçenekleri virgül (,) ile ayırarak yazınız.</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div style={{ textAlign: 'right' }}>
          <button type="submit" className="auth-btn" style={{ padding: '20px 40px', fontSize: '1.2rem' }} disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'ANKETİ YAYINLA ✅'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default NewSurvey;