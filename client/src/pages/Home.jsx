import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiArrowRight, FiBook, FiBookOpen, FiPlus, FiCheck, FiClock,
  FiTrendingUp, FiSearch, FiStar, FiTarget, FiZap,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

// Recommendation pool (shared with Dashboard)
const ALL_RECS = [
  { genre: 'Fiction', title: 'The Name of the Wind', author: 'Patrick Rothfuss', desc: 'A beautifully written epic fantasy about a legendary figure telling his own story.', pageCount: 662 },
  { genre: 'Fiction', title: 'Never Let Me Go', author: 'Kazuo Ishiguro', desc: 'A haunting story of three friends growing up with a devastating secret.', pageCount: 288 },
  { genre: 'Fiction', title: 'The Road', author: 'Cormac McCarthy', desc: 'A father and son walk through a scorched America in this Pulitzer-winning masterpiece.', pageCount: 287 },
  { genre: 'Fiction', title: 'Pachinko', author: 'Min Jin Lee', desc: 'An epic saga of a Korean family in Japan across four generations.', pageCount: 496 },
  { genre: 'Non-Fiction', title: 'Educated', author: 'Tara Westover', desc: 'A powerful memoir about self-invention through education.', pageCount: 334 },
  { genre: 'Non-Fiction', title: 'The Body', author: 'Bill Bryson', desc: 'A witty, fascinating guide to the human body — how it works, why it fails.', pageCount: 464 },
  { genre: 'Non-Fiction', title: 'Bad Blood', author: 'John Carreyrou', desc: 'The shocking true story of Theranos, the biggest corporate fraud in Silicon Valley history.', pageCount: 352 },
  { genre: 'Philosophy', title: 'The Republic', author: 'Plato', desc: 'The foundational text of Western philosophy on justice and the ideal state.', pageCount: 416 },
  { genre: 'Philosophy', title: 'Thus Spoke Zarathustra', author: 'Friedrich Nietzsche', desc: 'Nietzsche\'s philosophical novel on the Übermensch and eternal recurrence.', pageCount: 352 },
  { genre: 'Psychology', title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', desc: 'Finding purpose in suffering, drawn from Holocaust survival.', pageCount: 184 },
  { genre: 'Psychology', title: 'The Power of Habit', author: 'Charles Duhigg', desc: 'Why we do what we do in life and business — and how to change.', pageCount: 371 },
  { genre: 'Science Fiction', title: 'Foundation', author: 'Isaac Asimov', desc: 'A mathematician predicts the fall of a galactic empire.', pageCount: 244 },
  { genre: 'Science Fiction', title: 'Neuromancer', author: 'William Gibson', desc: 'The genre-defining cyberpunk novel that imagined the internet before it existed.', pageCount: 271 },
  { genre: 'Science Fiction', title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', desc: 'A human envoy on a planet where inhabitants have no fixed gender.', pageCount: 304 },
  { genre: 'Self-Help', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', desc: 'A principle-centered approach to personal effectiveness.', pageCount: 381 },
  { genre: 'Self-Help', title: 'The Power of Now', author: 'Eckhart Tolle', desc: 'A guide to spiritual enlightenment through present-moment awareness.', pageCount: 236 },
  { genre: 'History', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', desc: 'Why did some civilizations advance faster? An answer spanning 13,000 years.', pageCount: 528 },
  { genre: 'History', title: 'SPQR', author: 'Mary Beard', desc: 'A fresh history of ancient Rome from a leading classicist.', pageCount: 608 },
  { genre: 'Classics', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', desc: 'The psychological torment of a young man who commits murder.', pageCount: 671 },
  { genre: 'Classics', title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', desc: 'Seven generations of the Buendía family blending reality with magic.', pageCount: 417 },
  { genre: 'Classics', title: 'Beloved', author: 'Toni Morrison', desc: 'A former slave haunted by the ghost of her daughter. A Nobel Prize-winning novel.', pageCount: 324 },
  { genre: 'Productivity', title: 'Make Time', author: 'Jake Knapp', desc: 'A framework for choosing what matters and finding focus.', pageCount: 304 },
  { genre: 'Design', title: 'The Design of Everyday Things', author: 'Don Norman', desc: 'The essential guide to human-centered design.', pageCount: 368 },
  { genre: 'Business', title: 'Zero to One', author: 'Peter Thiel', desc: 'Notes on startups, or how to build the future.', pageCount: 224 },
  { genre: 'Dystopian', title: 'Brave New World', author: 'Aldous Huxley', desc: 'A chilling vision of a future society where happiness is manufactured.', pageCount: 288 },
  { genre: 'Mystery', title: 'The Hound of the Baskervilles', author: 'Arthur Conan Doyle', desc: 'Sherlock Holmes investigates a supernatural hound on the English moors.', pageCount: 256 },
  { genre: 'Mystery', title: 'Gone Girl', author: 'Gillian Flynn', desc: 'A gripping psychological thriller about a marriage gone terrifyingly wrong.', pageCount: 419 },
];

function getMultipleRecommendations(stats, shelfTitles = [], count = 5) {
  const genres = (stats?.genreBreakdown || []).sort((a, b) => b.count - a.count);
  const topGenres = genres.slice(0, 4).map(g => g.genre);
  if (topGenres.length === 0) topGenres.push('Fiction', 'Non-Fiction');

  const available = ALL_RECS.filter(r => !shelfTitles.includes(r.title.toLowerCase()));
  const picked = [];
  const usedTitles = new Set();

  // Try to pick one from each top genre first
  for (const genre of topGenres) {
    if (picked.length >= count) break;
    const matches = available.filter(r => r.genre === genre && !usedTitles.has(r.title));
    if (matches.length > 0) {
      const pick = matches[Math.floor(Math.random() * matches.length)];
      picked.push(pick);
      usedTitles.add(pick.title);
    }
  }

  // Fill the rest randomly
  const remaining = available.filter(r => !usedTitles.has(r.title));
  while (picked.length < count && remaining.length > 0) {
    const idx = Math.floor(Math.random() * remaining.length);
    picked.push(remaining[idx]);
    remaining.splice(idx, 1);
  }

  return picked;
}

function HomeSkeleton() {
  return (
    <div style={{ padding: 'var(--sp-xl)' }}>
      <div className="skeleton" style={{ height: 32, width: '40%', marginBottom: 20 }} />
      <div className="skeleton" style={{ height: 280, borderRadius: 'var(--r-xl)', marginBottom: 32 }} />
      <div className="skeleton" style={{ height: 24, width: '20%', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 240, flex: 1, borderRadius: 'var(--r-md)' }} />
        ))}
      </div>
    </div>
  );
}

function TimeGreeting({ name }) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 18 ? 'Good afternoon' :
    'Good evening';
  return (
    <div className="home-greeting">
      <p className="home-greeting-time">{greeting},</p>
      <h1 className="home-greeting-name">{name?.split(' ')[0] || 'Reader'}</h1>
    </div>
  );
}

function ProgressRing({ value, max, size = 72, label }) {
  const pct = Math.min(value / max, 1);
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - pct * circumference;
  return (
    <div className="goal-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <circle
          cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="url(#ring-grad)" strokeWidth="5"
          strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4A7CB5" />
            <stop offset="100%" stopColor="#C4854C" />
          </linearGradient>
        </defs>
      </svg>
      <div className="goal-ring-content">
        <div className="goal-ring-value">{value}<span>/{max}</span></div>
        {label && <div className="goal-ring-label">{label}</div>}
      </div>
    </div>
  );
}

function BookCard({ book, onClick, showProgress = false }) {
  const progress = book.pageCount ? Math.round((book.pagesRead / book.pageCount) * 100) : 0;
  return (
    <div className="home-book-card" onClick={onClick}>
      <div className="home-book-cover-wrap">
        {book.thumbnail ? (
          <img src={book.thumbnail} alt={book.title} className="home-book-cover" />
        ) : (
          <div className="no-cover home-book-cover">{book.title}</div>
        )}
      </div>
      <div className="home-book-title">{book.title}</div>
      <div className="home-book-author">{book.authors?.join(', ')}</div>
      {showProgress && book.pageCount > 0 && (
        <div className="home-book-progress">
          <div className="progress-bar"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const loadData = () => {
    Promise.all([
      axios.get('/api/books'),
      axios.get('/api/books/stats'),
    ]).then(([booksRes, statsRes]) => {
      setBooks(booksRes.data);
      setStats(statsRes.data);
      const titles = booksRes.data.map(b => b.title.toLowerCase());
      setRecommendations(getMultipleRecommendations(statsRes.data, titles, 6));
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const addRecommendation = async (rec) => {
    try {
      await axios.post('/api/books', {
        title: rec.title,
        authors: [rec.author],
        categories: [rec.genre],
        status: 'want-to-read',
        pageCount: rec.pageCount || 300,
      });
      showToast(`"${rec.title}" added to Want to Read`);
      loadData();
    } catch (err) {
      if (err.response?.status === 409) {
        showToast('Already on your shelf!');
        loadData();
      } else {
        showToast('Failed to add book');
      }
    }
  };

  if (loading) return <HomeSkeleton />;

  const reading = books.filter(b => b.status === 'reading');
  const wantToRead = books.filter(b => b.status === 'want-to-read');
  const completed = books.filter(b => b.status === 'completed')
    .sort((a, b) => new Date(b.dateCompleted || 0) - new Date(a.dateCompleted || 0));

  // Featured book = reading with highest progress, or first one
  const featured = reading.length > 0
    ? [...reading].sort((a, b) => {
        const aPct = (a.pagesRead || 0) / (a.pageCount || 1);
        const bPct = (b.pagesRead || 0) / (b.pageCount || 1);
        return bPct - aPct;
      })[0]
    : null;

  const otherReading = featured ? reading.filter(b => b._id !== featured._id) : reading;
  const yearlyGoal = 20;
  const completedThisYear = completed.filter(b => {
    const d = b.dateCompleted ? new Date(b.dateCompleted) : null;
    return d && d.getFullYear() === new Date().getFullYear();
  }).length;

  return (
    <div className="home-page">
      {/* Greeting */}
      <TimeGreeting name={user?.name} />

      {/* Continue Reading Hero */}
      {featured ? (
        <section className="continue-reading-hero">
          <div className="crh-cover-wrap">
            {featured.thumbnail ? (
              <img src={featured.thumbnail} alt={featured.title} className="crh-cover" />
            ) : (
              <div className="crh-cover no-cover">{featured.title}</div>
            )}
            <div className="crh-cover-shadow" />
          </div>
          <div className="crh-details">
            <div className="crh-eyebrow">
              <FiBookOpen /> Continue Reading
            </div>
            <h2 className="crh-title">{featured.title}</h2>
            <p className="crh-author">by {featured.authors?.join(', ')}</p>

            {featured.pageCount > 0 && (
              <div className="crh-progress-wrap">
                <div className="crh-progress-numbers">
                  <span className="crh-pct">{Math.round((featured.pagesRead / featured.pageCount) * 100)}%</span>
                  <span className="crh-pages">Page {featured.pagesRead} of {featured.pageCount}</span>
                </div>
                <div className="progress-bar crh-progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${(featured.pagesRead / featured.pageCount) * 100}%` }} />
                </div>
                <div className="crh-eta">
                  {Math.max(1, Math.round((featured.pageCount - featured.pagesRead) / 40))}h remaining at your pace
                </div>
              </div>
            )}

            <div className="crh-actions">
              <Link to={`/book/${featured._id}`} className="btn-hero-action">
                Pick Up Where You Left Off <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="empty-hero">
          <FiBookOpen size={48} />
          <h2>No books in progress</h2>
          <p>Pick up a book from your shelf or discover something new to start reading.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <Link to="/my-shelf" className="btn-hero-action"><FiBook /> Browse Shelf</Link>
            <Link to="/search" className="btn-hero-action btn-hero-action--ghost"><FiSearch /> Discover Books</Link>
          </div>
        </section>
      )}

      {/* Quick Stats Row */}
      <section className="home-stats-row">
        <div className="home-stat-mini">
          <ProgressRing value={completedThisYear} max={yearlyGoal} size={72} />
          <div>
            <div className="home-stat-mini-label"><FiTarget /> {new Date().getFullYear()} Goal</div>
            <div className="home-stat-mini-value">{completedThisYear} of {yearlyGoal} books</div>
            <div className="home-stat-mini-sub">
              {yearlyGoal - completedThisYear > 0
                ? `${yearlyGoal - completedThisYear} to go`
                : 'Goal reached!'}
            </div>
          </div>
        </div>

        <div className="home-stat-mini">
          <div className="home-stat-mini-icon"><FiZap /></div>
          <div>
            <div className="home-stat-mini-label">Reading Streak</div>
            <div className="home-stat-mini-value">{stats?.readingStreak || 0} months</div>
            <div className="home-stat-mini-sub">
              {stats?.readingStreak > 0 ? 'Keep it going' : 'Finish a book to start'}
            </div>
          </div>
        </div>

        <div className="home-stat-mini">
          <div className="home-stat-mini-icon"><FiTrendingUp /></div>
          <div>
            <div className="home-stat-mini-label">Pages Read</div>
            <div className="home-stat-mini-value">{(stats?.totalPagesRead || 0).toLocaleString()}</div>
            <div className="home-stat-mini-sub">across {stats?.totalBooksRead || 0} books</div>
          </div>
        </div>
      </section>

      {/* Also Reading */}
      {otherReading.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h3>Also Reading</h3>
            <Link to="/my-shelf" className="home-section-link">View all <FiArrowRight /></Link>
          </div>
          <div className="home-row-scroll">
            {otherReading.map(book => (
              <BookCard key={book._id} book={book} showProgress onClick={() => navigate(`/book/${book._id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Recommended for You */}
      {recommendations.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h3>Recommended for You</h3>
            <button
              className="home-section-link"
              onClick={() => {
                const titles = books.map(b => b.title.toLowerCase());
                setRecommendations(getMultipleRecommendations(stats, titles, 6));
                showToast('New recommendations loaded');
              }}
            >
              Refresh <FiArrowRight />
            </button>
          </div>
          <div className="home-row-scroll">
            {recommendations.map((rec, i) => (
              <div key={i} className="home-reco-card">
                <div className="home-reco-genre">{rec.genre}</div>
                <h4 className="home-reco-title">{rec.title}</h4>
                <p className="home-reco-author">by {rec.author}</p>
                <p className="home-reco-desc">{rec.desc}</p>
                <button className="home-reco-btn" onClick={() => addRecommendation(rec)}>
                  <FiPlus /> Add to Want to Read
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Up Next (Want to Read) */}
      {wantToRead.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h3>Up Next</h3>
            <Link to="/my-shelf" className="home-section-link">View all <FiArrowRight /></Link>
          </div>
          <div className="home-row-scroll">
            {wantToRead.slice(0, 10).map(book => (
              <BookCard key={book._id} book={book} onClick={() => navigate(`/book/${book._id}`)} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Completed */}
      {completed.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h3>Recently Completed</h3>
            <Link to="/dashboard" className="home-section-link">See insights <FiArrowRight /></Link>
          </div>
          <div className="home-row-scroll">
            {completed.slice(0, 8).map(book => (
              <div key={book._id} className="home-book-card home-book-card--completed" onClick={() => navigate(`/book/${book._id}`)}>
                <div className="home-book-cover-wrap">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} className="home-book-cover" />
                  ) : (
                    <div className="no-cover home-book-cover">{book.title}</div>
                  )}
                  <div className="home-book-completed-badge"><FiCheck /></div>
                </div>
                <div className="home-book-title">{book.title}</div>
                <div className="home-book-author">{book.authors?.join(', ')}</div>
                {book.rating > 0 && (
                  <div className="home-book-rating">
                    {Array.from({ length: book.rating }).map((_, i) => (
                      <FiStar key={i} style={{ fill: 'var(--brand-accent)', color: 'var(--brand-accent)' }} size={11} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
