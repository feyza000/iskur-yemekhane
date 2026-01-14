import React, { useState } from 'react';
import { request } from '../services/api';

function RatingForm({ mealId }) {
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (selectedScore) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert("Giriş yapmalısın.");
      return;
    }
    setScore(selectedScore);
    setLoading(true);

    try {
      const response = await request(`/meals/${mealId}/rate/`, {
        method: 'POST',
        body: JSON.stringify({ score: selectedScore })
      });
      // console.log("Puanlandı", response);
      // request helper throws on error, so if we are here it's ok.
    } catch (err) {
      setMessage('Ağ hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Inline style temizlendi
    <div className="rating-container">
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hover || score) ? 'active' : ''}`}
            onClick={() => handleSubmit(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            role="button"
          >
            ★
          </span>
        ))}
      </div>
      {message && <small className="error-msg">{message}</small>}
    </div>
  );
}

export default RatingForm;