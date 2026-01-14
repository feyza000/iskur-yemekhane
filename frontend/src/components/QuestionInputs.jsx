// frontend/src/components/QuestionInputs.jsx
import React from 'react';


// --- 1. SVG YILDIZ BİLEŞENİ ---
const StarIcon = ({ fillPercentage, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{ cursor: 'pointer', display: 'inline-block', transition: 'transform 0.1s' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'} // Hover efekti
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradyan Tanımı (Sihir Burada): 
            Yıldızın ne kadarının boyanacağını 'offset' belirler.
            Her yıldıza unique (eşsiz) bir ID veriyoruz ki karışmasın.
        */}
        <defs>
          <linearGradient id={`grad-${fillPercentage}`}>
            <stop offset={`${fillPercentage}%`} stopColor="#FFD700" /> {/* Altın Sarısı */}
            <stop offset={`${fillPercentage}%`} stopColor="#E2E8F0" /> {/* Gri (Boş Kısım) */}
          </linearGradient>
        </defs>

        {/* Yıldız Çizimi */}
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={`url(#grad-${fillPercentage})`} // Yukarıdaki gradyanı kullan
          stroke="#CBD5E0" // Hafif gri çerçeve
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

// --- LETTERBOXD TARZI YILDIZ INPUT (Yarım Puanlı) ---
export const StarInput = ({ value, onChange }) => {
  const currentVal = parseFloat(value) || 0;

  const handleClick = (starIndex) => {
    // starIndex: 1, 2, 3... (Hangi yıldıza tıklandı)

    if (currentVal === starIndex) {
      // Zaten tamsa -> Yarıma düşür
      onChange(starIndex - 0.5);
    } else if (currentVal === starIndex - 0.5) {
      // Zaten yarımsa -> Sıfırla (O yıldızı boşalt)
      // Ancak buradaki mantık: 3.5 ise ve 3. yıldıza tıklarsan, 
      // kullanıcı muhtemelen 3 yapmak istiyordur veya silmek istiyordur.
      // Letterboxd mantığı: Tekrar tıklama o puanı siler.
      // Biz kullanıcı dostu olsun diye o yıldızı tamamen kaldırıp bir öncekine dönelim.
      onChange(starIndex - 1);
    } else {
      // Boşsa veya azsa -> Tam puan yap
      onChange(starIndex);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map((starIndex) => {

        let fillPercentage = 0;

        if (currentVal >= starIndex) {
          fillPercentage = 100; // Tam dolu
        } else if (currentVal === starIndex - 0.5) {
          fillPercentage = 50;  // Yarım dolu
        } else {
          fillPercentage = 0;   // Boş
        }

        return (
          <StarIcon
            key={starIndex}
            fillPercentage={fillPercentage}
            onClick={() => handleClick(starIndex)}
          />
        );
      })}

      {/* Puanı yanına metin olarak yazalım (Opsiyonel, şık durur) */}
      <span style={{
        marginLeft: '10px',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: 'var(--ozal-cyan)',
        minWidth: '30px'
      }}>
        {currentVal > 0 ? currentVal : ''}
      </span>
    </div>
  );
};

// --- 2. ÇOKLU SEÇİM (CHECKBOX) ---
export const CheckboxInput = ({ options, value, onChange }) => {
  // Gelen value "Elma, Armut" gibi bir string olabilir. Diziye çevir.
  const selectedOptions = value ? value.split(',').map(s => s.trim()) : [];
  // Backend'den JSON Array veya String gelebilir. Her ikisini de destekle.
  const optionList = Array.isArray(options) ? options : (options ? options.split(',') : []);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {optionList.map((opt, i) => (
        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectedOptions.includes(opt.trim())}
            onChange={() => handleCheck(opt)}
            style={{ width: '18px', height: '18px', accentColor: 'var(--ozal-cyan)' }}
          />
          <span style={{ color: 'var(--text-main)' }}>{opt.trim()}</span>
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
      style={{ maxWidth: '200px' }}
    />
  );
};

// --- 4. 1-10 ÖLÇEK (Linear Scale) ---
export const ScaleInput = ({ value, onChange }) => {
  return (
    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
        <div
          key={num}
          onClick={() => onChange(num.toString())}
          style={{
            width: '35px', height: '35px', borderRadius: '50%',
            border: value === num.toString() ? '2px solid var(--ozal-cyan)' : '1px solid var(--card-border)',
            background: value === num.toString() ? 'rgba(18, 167, 205, 0.2)' : 'var(--input-bg)',
            color: value === num.toString() ? 'var(--ozal-cyan)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
          }}
        >
          {num}
        </div>
      ))}
    </div>
  )
}