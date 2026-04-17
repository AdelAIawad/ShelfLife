import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiBookOpen, FiClock, FiStar, FiArrowLeft, FiCheck } from 'react-icons/fi';
import HeroHeader from '../components/HeroHeader';

// Confetti burst on completing a book
function ConfettiBurst({ active }) {
  if (!active) return null;
  const colors = ['#1a6b5a', '#c8944a', '#e8b86a', '#22917a', '#2ecc71', '#e74c3c', '#3498db'];
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${30 + Math.random() * 40}%`,
          bottom: '30%',
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          background: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          animation: `confetti ${1 + Math.random() * 1.5}s ease-out forwards`,
          animationDelay: `${Math.random() * 0.3}s`,
          transform: `rotate(${Math.random() * 360}deg)`,
        }} />
      ))}
    </div>
  );
}

export default function RateReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [pagesRead, setPagesRead] = useState(0);
  const [toast, setToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    axios.get(`/api/books/${id}`)
      .then(res => {
        setBook(res.data);
        setRating(res.data.rating || 0);
        setReview(res.data.review || '');
        setPagesRead(res.data.pagesRead || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/books/${id}`, { rating, review, pagesRead });
      setBook(res.data);
      setSaved(true);
      showToast('Review saved successfully!');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkFinished = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/books/${id}`, {
        rating, review,
        pagesRead: book.pageCount,
        status: 'completed',
      });
      setBook(res.data);
      setPagesRead(res.data.pageCount);
      setShowConfetti(true);
      showToast('Congratulations! Book marked as finished!');
      setTimeout(() => setShowConfetti(false), 3000);
    } catch {
      showToast('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  if (loading) {
    return (
      <div className="review-page">
        <div style={{ display: 'flex', gap: 40 }}>
          <div className="skeleton" style={{ width: 260, height: 390, borderRadius: 'var(--r-md)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-title" style={{ width: '70%', height: 36 }} />
            <div className="skeleton skeleton-text" style={{ width: '40%', marginTop: 12 }} />
            <div className="skeleton" style={{ width: '60%', height: 32, marginTop: 32 }} />
            <div className="skeleton" style={{ width: '100%', height: 12, marginTop: 32, borderRadius: 6 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!book) return (
    <div className="empty-state" style={{ paddingTop: 100 }}>
      <FiBookOpen style={{ fontSize: '3rem' }} />
      <h3>Book not found</h3>
      <p>This book may have been removed from your shelf.</p>
      <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px', fontSize: '0.85rem' }} onClick={() => navigate('/my-shelf')}>
        <FiArrowLeft /> Back to Shelf
      </button>
    </div>
  );

  const progress = book.pageCount ? Math.round((pagesRead / book.pageCount) * 100) : 0;
  const remaining = book.pageCount ? Math.max(0, book.pageCount - pagesRead) : 0;

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Masterpiece'];

  return (
    <div className="review-page">
      <ConfettiBurst active={showConfetti} />

      <HeroHeader
        title={book.title}
        subtitle={`by ${book.authors?.join(', ')}`}
        variant="review"
        actions={
          <Link to="/my-shelf" className="btn-hero-action btn-hero-action--ghost">
            <FiArrowLeft /> Back to Shelf
          </Link>
        }
      />

      <div className="review-top">
        <div className="review-cover">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={book.title} />
          ) : (
            <div className="no-cover" style={{ height: 390, borderRadius: 'var(--r-md)' }}>{book.title}</div>
          )}
        </div>

        <div className="review-details">
          <h1>{book.title}</h1>
          <p className="review-author">by {book.authors?.join(', ')}</p>

          {/* Status badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 'var(--r-full)',
            background: book.status === 'completed' ? 'rgba(74,173,170,0.12)' : 'rgba(74,124,181,0.12)',
            color: book.status === 'completed' ? '#4AADAA' : '#4A7CB5',
            fontSize: '0.75rem', fontWeight: 600, marginBottom: 24,
            textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            {book.status === 'completed' ? <FiCheck /> : <FiBookOpen />}
            {book.status.replace('-', ' ')}
          </div>

          <div className="review-section">
            <div className="review-section-title">Personal Rating</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    className={(hoverRating || rating) >= star ? 'filled' : ''}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star === rating ? 0 : star)}
                  >
                    <FiStar fill={(hoverRating || rating) >= star ? '#c8944a' : 'none'} />
                  </button>
                ))}
              </div>
              {(hoverRating || rating) > 0 && (
                <span style={{
                  fontSize: '0.82rem', color: 'var(--gold)', fontWeight: 600,
                  animation: 'fadeIn 0.2s ease',
                }}>
                  {starLabels[hoverRating || rating]}
                </span>
              )}
            </div>
          </div>

          <div className="review-section">
            <div className="review-section-title">Reading Progress</div>
            <div className="review-progress-bar">
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="review-progress-pct">{progress}%</span>
            </div>
            <div className="review-progress-hint">
              {remaining > 0
                ? `Approximately ${remaining} pages remaining.`
                : 'You\'ve finished this book!'}
            </div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Pages read:
              </label>
              <input
                type="range"
                min={0}
                max={book.pageCount || 100}
                value={pagesRead}
                onChange={e => setPagesRead(Number(e.target.value))}
                style={{
                  flex: 1, accentColor: '#4A7CB5',
                  cursor: 'pointer',
                }}
              />
              <span style={{
                fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums', minWidth: 80, textAlign: 'right',
              }}>
                {pagesRead} / {book.pageCount || '?'}
              </span>
            </div>
          </div>

          <div className="review-meta">
            <div className="review-meta-item">
              <div className="meta-label">Format</div>
              <div className="meta-value">{book.format || 'Hardcover'}</div>
            </div>
            <div className="review-meta-item">
              <div className="meta-label">Pages</div>
              <div className="meta-value">{book.pageCount || '—'}</div>
            </div>
            <div className="review-meta-item">
              <div className="meta-label">ISBN</div>
              <div className="meta-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                {book.isbn || '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section-title">Archive Entry & Reflections</div>
        <textarea
          className="review-textarea"
          placeholder="Capture your thoughts on the narrative depth, atmosphere, and prose..."
          value={review}
          onChange={e => setReview(e.target.value)}
        />
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          fontSize: '0.72rem', color: 'var(--text-faint)', marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {review.length} characters
        </div>
      </div>

      <div className="review-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={saved ? { background: 'var(--success)', boxShadow: '0 4px 16px rgba(46,204,113,0.3)' } : {}}
        >
          {saving ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
              Saving...
            </span>
          ) : saved ? (
            <><FiCheck /> Saved!</>
          ) : (
            'Save Review'
          )}
        </button>
        {book.status !== 'completed' && (
          <button className="btn-secondary" onClick={handleMarkFinished} disabled={saving}>
            Mark as Finished
          </button>
        )}
      </div>

      <div className="review-footer-cards">
        <div className="footer-card">
          <div className="fc-icon"><FiBookOpen /></div>
          <h4>In "{book.categories?.[0] || 'General'}"</h4>
          <p>Part of your collection since {book.dateAdded ? new Date(book.dateAdded).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</p>
        </div>
        <div className="footer-card">
          <div className="fc-icon"><FiClock /></div>
          <h4>Last Updated</h4>
          <p>{book.updatedAt ? new Date(book.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never'}</p>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
