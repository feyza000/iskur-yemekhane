import { useNavigate, Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { AuthService } from '../services/auth.service';

function LoginPage() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // Şifremi Unuttum State'leri
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const data = await AuthService.login(formData.username, formData.password);

      // AuthService içinde localStorage set ediliyor zaten
      navigate('/');
      window.location.reload();

    } catch (err) {
      // api.request throw { status, ...data } fırlatıyor
      const errorMsg = err.non_field_errors ? err.non_field_errors[0] : (err.detail || "Giriş bilgileri hatalı.");
      setError(errorMsg);
    }
  };

  // --- ŞİFRE SIFIRLAMA İSTEĞİ ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const data = await AuthService.requestPasswordReset(forgotEmail);
      alert(`${data.status}\n(DEV: Check backend terminal/console for the link!)`);

      setShowForgotModal(false);
      setForgotEmail('');
    } catch (err) {
      alert(err.error || "Hata oluştu.");
    }
  };

  return (
    <>

      <div className="auth-header">
        <h2>Giriş Yap</h2>
        <p>Hesabınıza erişmek için bilgilerinizi girin.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="modern-input-group">
          <label>Kullanıcı Adı</label>
          <input type="text" name="username" className="modern-input" required value={formData.username} onChange={handleChange} />
        </div>

        <div className="modern-input-group">
          <label>Şifre</label>
          <input type="password" name="password" className="modern-input" required value={formData.password} onChange={handleChange} />
        </div>

        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '0.9rem' }}>{error}</div>}

        <button type="submit" className="auth-btn">GİRİŞ YAP</button>
      </form>

      {/* LİNKLER */}
      <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setShowForgotModal(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--ozal-orange)', cursor: 'pointer', fontWeight: '600' }}
        >
          Şifremi Unuttum
        </button>

        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Hesabın yok mu? <Link to="/register" style={{ color: 'var(--ozal-cyan)', fontWeight: 'bold', textDecoration: 'none' }}>Kayıt Ol</Link>
        </p>
      </div>

      {/* MODAL - Layout dışında olması sorun değil, fixed position kullanıyor */}
      {showForgotModal && createPortal(
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ color: 'var(--heading-color)', marginTop: 0 }}>Şifre Sıfırlama</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Sisteme kayıtlı e-posta adresinizi girin. Yeni şifreniz gönderilecektir.
            </p>
            <form onSubmit={handleForgotPassword}>
              <div className="modern-input-group">
                <input
                  type="email"
                  className="modern-input"
                  placeholder="E-posta adresi"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="modal-btn btn-copy">Gönder</button>
                <button type="button" onClick={() => setShowForgotModal(false)} className="modal-btn btn-cancel">İptal</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default LoginPage;