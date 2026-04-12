import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiBookOpen, FiBook, FiStar, FiTrendingUp, FiX, FiMail } from 'react-icons/fi';

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'The only thing you absolutely have to know is the location of the library.', author: 'Albert Einstein' },
  { text: 'I have always imagined that Paradise will be a kind of library.', author: 'Jorge Luis Borges' },
  { text: 'Reading is dreaming with open eyes.', author: 'Anissa Trisdianty' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
];

function FloatingBooks() {
  const books = ['📖', '📚', '📕', '📗', '📘', '📙', '📓', '🔖', '✨'];
  return (
    <div className="floating-books">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${12 + Math.random() * 20}px`,
            opacity: 0.06 + Math.random() * 0.08,
            animation: `float ${5 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
            filter: 'grayscale(0.5)',
            userSelect: 'none',
          }}
        >
          {books[Math.floor(Math.random() * books.length)]}
        </span>
      ))}
    </div>
  );
}

export default function Login() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSession, setKeepSession] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const cardRef = useRef(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg)`;
    };
    const handleLeave = () => {
      card.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
      card.style.transition = 'transform 0.5s ease';
    };
    const handleEnter = () => { card.style.transition = 'transform 0.1s ease'; };

    card.addEventListener('mousemove', handleMove);
    card.addEventListener('mouseleave', handleLeave);
    card.addEventListener('mouseenter', handleEnter);
    return () => {
      card.removeEventListener('mousemove', handleMove);
      card.removeEventListener('mouseleave', handleLeave);
      card.removeEventListener('mouseenter', handleEnter);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <FloatingBooks />

      {/* Left side — Brand story */}
      <div className="login-left">
        <div className="login-left-content">
          <h1 className="login-hero-title">
            <span className="login-logo-icon">📖</span>
            ShelfLife
          </h1>
          <p className="login-hero-sub">The Digital Archivist</p>

          <div className="login-hero-quote">
            <p>"{quote.text}"</p>
            <span>— {quote.author}</span>
          </div>

          <div className="login-features">
            <div className="login-feature">
              <div className="lf-icon"><FiBook /></div>
              <div>
                <strong>Curate Your Library</strong>
                <p>Track books across reading, wishlist, and completed shelves</p>
              </div>
            </div>
            <div className="login-feature">
              <div className="lf-icon"><FiStar /></div>
              <div>
                <strong>Rate & Reflect</strong>
                <p>Write reviews and rate every book in your collection</p>
              </div>
            </div>
            <div className="login-feature">
              <div className="lf-icon"><FiTrendingUp /></div>
              <div>
                <strong>Reading Insights</strong>
                <p>Beautiful charts showing your reading journey over time</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="login-right">
        <div className="login-card" ref={cardRef}>
          <div className="login-brand">
            <h2>{isRegister ? 'Create Your Archive' : 'Welcome Back'}</h2>
            <p>{isRegister ? 'Start your literary journey today' : 'Continue your reading adventure'}</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group" style={{ animation: 'slideUp 0.3s ease' }}>
                <label>Full Name</label>
                <input type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="curator@shelflife.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label>
                Password
                {!isRegister && <button type="button" onClick={() => setShowForgot(true)} style={{ all: 'unset', cursor: 'pointer', fontSize: '12px', color: 'var(--clr-emerald)', fontWeight: 500 }}>Forgot?</button>}
              </label>
              <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete={isRegister ? 'new-password' : 'current-password'} />
            </div>

            {!isRegister && (
              <div className="checkbox-group">
                <input type="checkbox" id="keepSession" checked={keepSession} onChange={e => setKeepSession(e.target.checked)} />
                <label htmlFor="keepSession">Keep my archive session active</label>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" />
                  Please wait...
                </span>
              ) : (
                <>{isRegister ? 'Create Account' : 'Log In'} <FiArrowRight /></>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>{isRegister ? 'Already a curator?' : 'New Curator?'}</span>
          </div>

          <button className="btn-outline" onClick={() => { setIsRegister(!isRegister); setError(''); }}>
            {isRegister ? 'Sign In Instead' : 'Create an Account'}
          </button>

          {!isRegister && (
            <button className="btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => setError('Google Sign-In will be available soon. Please use email registration for now.')}>
              <FiBookOpen /> Sign Up With Google
            </button>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="modal-overlay" onClick={() => { setShowForgot(false); setForgotSent(false); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={() => { setShowForgot(false); setForgotSent(false); }}><FiX /></button>
            </div>
            <div className="modal-body">
              {forgotSent ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <FiMail style={{ fontSize: '2.5rem', color: 'var(--teal)', marginBottom: 16 }} />
                  <h4 style={{ marginBottom: 8 }}>Check Your Email</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    If an account exists for <strong>{forgotEmail}</strong>, we've sent password reset instructions.
                  </p>
                  <button className="btn-primary" style={{ marginTop: 20 }} onClick={() => { setShowForgot(false); setForgotSent(false); }}>
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" placeholder="curator@shelflife.com" value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)} autoFocus />
                  </div>
                  <button className="btn-primary" onClick={() => { if (forgotEmail.trim()) setForgotSent(true); }}>
                    Send Reset Link <FiArrowRight />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
