// frontend/src/components/QuestionInputs.jsx
import React from 'react';

// --- 1. LETTERBOXD TARZI YILDIZ (Yarım Puanlı) ---
export const StarInput = ({ value, onChange }) => {
  // value string gelebilir ("3.5"), sayıya çevir
  const currentVal = parseFloat(value) || 0;

  const handleClick = (starIndex) => {
    // starIndex: 1, 2, 3, 4, 5 (Hangi yıldıza tıklandı)
    
    // Eğer tıklanan yıldıza zaten tam puan verilmişse -> Yarım yap
    if (currentVal === starIndex) {
      onChange(starIndex - 0.5);
    }
    // Eğer zaten o yıldızda yarım puandaysa -> Sıfırla (Kaldır)
    else if (currentVal === starIndex - 0.5) {
      onChange(0);
    }
    // Değilse -> Tam puan ver
    else {
      onChange(starIndex);
    }
  };

  return (
    <div className="star-rating-group" style={{display:'flex', gap:'5px'}}>
      {[1, 2, 3, 4, 5].map((star) => {
        let fillType = 'empty'; // empty, half, full
        if (currentVal >= star) fillType = 'full';
        else if (currentVal === star - 0.5) fillType = 'half';

        return (
          <span 
            key={star} 
            onClick={() => handleClick(star)}
            style={{
                fontSize: '2rem', 
                cursor: 'pointer', 
                color: fillType === 'empty' ? '#ddd' : '#FFD700', // Altın Sarısı
                position: 'relative',
                display: 'inline-block',
                userSelect: 'none'
            }}
          >
            {/* Yarım yıldız için özel karakter veya CSS gradient kullanılabilir ama
                basitlik için standart ★ kullanıp rengi ayarladık. 
                Daha ileri görsel için SVG gerekir, şimdilik basit tutuyoruz.
            */}
            {fillType === 'half' ? '½' : '★'} 
            {/* Not: ½ karakteri yerine SVG daha iyi olur ama logic çalışsın diye böyle yaptık.
                Aşağıda SVG versiyonunu da verebilirim istersen. */}
          </span>
        );
      })}
      <span style={{fontSize:'1rem', color:'var(--text-muted)', alignSelf:'center', marginLeft:'10px'}}>
        {currentVal > 0 ? currentVal : ''}
      </span>
    </div>
  );
};

// --- 2. ÇOKLU SEÇİM (CHECKBOX) ---
export const CheckboxInput = ({ options, value, onChange }) => {
  // Gelen value "Elma, Armut" gibi bir string olabilir. Diziye çevir.
  const selectedOptions = value ? value.split(',').map(s => s.trim()) : [];
  const optionList = options ? options.split(',') : [];

  const handleCheck = (opt) => {
    const cleanOpt = opt.trim();
    let newSelection = [];
    
    if (selectedOptions.includes(cleanOpt)) {
      // Varsa çıkar
      newSelection = selectedOptions.filter(item => item !== cleanOpt);
    } else {
      // Yoksa ekle
      newSelection = [...selectedOptions, cleanOpt];
    }
    // Virgülle birleştirip geri yolla
    onChange(newSelection.join(', '));
  };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
      {optionList.map((opt, i) => (
        <label key={i} style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}}>
          <input 
            type="checkbox" 
            checked={selectedOptions.includes(opt.trim())}
            onChange={() => handleCheck(opt)}
            style={{width:'18px', height:'18px', accentColor:'var(--ozal-cyan)'}}
          />
          <span style={{color:'var(--text-main)'}}>{opt.trim()}</span>
        </label>
      ))}
    </div>
  );
};

// --- 3. TARİH SEÇİMİ ---
export const DateInput = ({ value, onChange }) => {
  return (
    <input 
      type="date" 
      className="modern-input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      style={{maxWidth:'200px'}}
    />
  );
};

// --- 4. 1-10 ÖLÇEK (Linear Scale) ---
export const ScaleInput = ({ value, onChange }) => {
    return (
        <div style={{display:'flex', gap:'5px', flexWrap:'wrap'}}>
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <div 
                    key={num} 
                    onClick={() => onChange(num.toString())}
                    style={{
                        width:'35px', height:'35px', borderRadius:'50%', 
                        border: value === num.toString() ? '2px solid var(--ozal-cyan)' : '1px solid var(--card-border)',
                        background: value === num.toString() ? 'rgba(18, 167, 205, 0.2)' : 'var(--input-bg)',
                        color: value === num.toString() ? 'var(--ozal-cyan)' : 'var(--text-muted)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        cursor:'pointer', fontWeight:'bold', fontSize:'0.9rem'
                    }}
                >
                    {num}
                </div>
            ))}
        </div>
    )
}