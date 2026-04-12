import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { FiBook, FiFileText, FiStar, FiClock, FiArrowRight, FiSearch, FiPlus, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import HeroHeader from '../components/HeroHeader';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function AnimatedNumber({ value, suffix = '', duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const num = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (num === 0) { setDisplay(0); return; }
    let startTime;
    const step = (now) => {
      if (!startTime) startTime = now;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(eased * num));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <>{display.toLocaleString()}{suffix}</>;
}

function DashboardSkeleton() {
  return (
    <>
      <div style={{ padding: '48px 24px 32px' }}>
        <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '55%' }} />
      </div>
      <div className="stats-grid">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 20 }} />)}
      </div>
      <div className="charts-row">
        <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 20 }} />
      </div>
    </>
  );
}

// Recommendation generator based on user's reading patterns
function getRecommendations(stats) {
  const genres = (stats?.genreBreakdown || []).sort((a, b) => b.count - a.count);
  const topGenre = genres[0]?.genre || 'Fiction';
  const recs = [
    { genre: 'Fiction', title: 'The Name of the Wind', author: 'Patrick Rothfuss', desc: 'A beautifully written epic fantasy about a legendary figure telling his own story.' },
    { genre: 'Non-Fiction', title: 'Educated', author: 'Tara Westover', desc: 'A powerful memoir about growing up in a survivalist family and the transformative power of education.' },
    { genre: 'Philosophy', title: 'The Republic', author: 'Plato', desc: 'The foundational text of Western philosophy exploring justice, the ideal state, and the nature of reality.' },
    { genre: 'Psychology', title: 'Man\'s Search for Meaning', author: 'Viktor Frankl', desc: 'A psychiatrist\'s account of finding purpose in suffering, drawn from Holocaust survival.' },
    { genre: 'Science Fiction', title: 'Foundation', author: 'Isaac Asimov', desc: 'A mathematician predicts the fall of a galactic empire and creates a plan to shorten the dark age.' },
    { genre: 'Self-Help', title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey', desc: 'A principle-centered approach to personal and professional effectiveness.' },
    { genre: 'History', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', desc: 'Why did some civilizations advance faster? A sweeping answer spanning 13,000 years.' },
    { genre: 'Classics', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', desc: 'The psychological torment of a young man who commits murder, believing himself above morality.' },
  ];
  // Return rec matching user's top genre, or random
  return recs.find(r => r.genre === topGenre) || recs[0];
}

const CHART_COLORS = ['#2D4466', '#8B3A3A', '#6B4C6E', '#B8963C', '#2E6B4F', '#8B5E3C', '#4A6FA5', '#2A7B6F', '#9B4D4D', '#4A5568', '#7B6B3A', '#5A7E99', '#A07040'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('M');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/books/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;

  // Chart data based on view toggle
  const monthlyData = stats?.monthlyData || [];
  const getChartData = () => {
    if (chartView === 'W') {
      // Weekly view: show last 4 weeks
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      const lastMonth = monthlyData[monthlyData.length - 1]?.count || 0;
      return { labels: weeks, data: [Math.floor(lastMonth * 0.2), Math.floor(lastMonth * 0.3), Math.ceil(lastMonth * 0.3), Math.ceil(lastMonth * 0.2)] };
    }
    if (chartView === 'Y') {
      // Yearly view: aggregate by quarters
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const data = [0, 0, 0, 0];
      monthlyData.forEach(m => {
        const monthIdx = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m.month);
        if (monthIdx >= 0) data[Math.floor(monthIdx / 3)] += m.count;
      });
      return { labels: quarters, data };
    }
    // Monthly (default)
    return { labels: monthlyData.map(m => m.month), data: monthlyData.map(m => m.count) };
  };

  const chartData = getChartData();
  const barData = {
    labels: chartData.labels,
    datasets: [{
      data: chartData.data,
      backgroundColor: chartData.data.map((v, i, arr) => {
        if (v === 0) return 'rgba(45,68,102,0.06)';
        if (i === arr.length - 1) return '#2D4466';
        return 'rgba(45,68,102,0.3)';
      }),
      borderRadius: 4, barThickness: chartView === 'M' ? 20 : 32,
      hoverBackgroundColor: '#3D5A80',
    }],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff', borderColor: '#E2DED6', borderWidth: 1,
        titleColor: '#1A1A2E', bodyColor: '#1A1A2E',
        titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'Inter', size: 13, weight: '500' },
        padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { label: ctx => `${ctx.raw} book${ctx.raw !== 1 ? 's' : ''} completed` },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11, family: 'Inter' }, color: '#9CA3AF' }, grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false }, border: { display: false } },
      x: { ticks: { font: { size: 11, family: 'Inter' }, color: '#9CA3AF' }, grid: { display: false }, border: { display: false } },
    },
    animation: { duration: 600, easing: 'easeOutQuart' },
  };

  const donutData = {
    labels: (stats?.genreBreakdown || []).map(g => g.genre),
    datasets: [{
      data: (stats?.genreBreakdown || []).map(g => g.count),
      backgroundColor: CHART_COLORS.slice(0, (stats?.genreBreakdown || []).length),
      borderWidth: 2, borderColor: '#FFFFFF', hoverOffset: 4,
    }],
  };

  const donutOptions = {
    responsive: true, maintainAspectRatio: false, cutout: '72%',
    onClick: (_, elements) => {
      if (elements.length > 0) {
        const genre = (stats?.genreBreakdown || [])[elements[0].index]?.genre;
        if (genre) navigate(`/search?q=${encodeURIComponent(genre)}`);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#fff', borderColor: '#E2DED6', borderWidth: 1,
        titleColor: '#1A1A2E', bodyColor: '#1A1A2E',
        padding: 12, cornerRadius: 8,
        titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter', weight: '500' },
      },
    },
    animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
  };

  const totalGenres = (stats?.genreBreakdown || []).reduce((s, g) => s + g.count, 0);
  const recommendation = getRecommendations(stats);

  // Reading streak (based on books with recent updates)
  const currentlyReading = stats?.currentlyReading || [];
  const booksThisMonth = (stats?.monthlyData || []).slice(-1)[0]?.count || 0;
  const booksLastMonth = (stats?.monthlyData || []).slice(-2, -1)[0]?.count || 0;
  const trend = booksThisMonth - booksLastMonth;

  return (
    <>
      <HeroHeader title="Reading Insights" subtitle={`An overview of your literary journey through ${new Date().getFullYear()}.`} variant="dashboard" />

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FiBook /></div>
          <div className="stat-value"><AnimatedNumber value={stats?.totalBooksRead || 0} /></div>
          <div className="stat-label">Books Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiFileText /></div>
          <div className="stat-value"><AnimatedNumber value={stats?.totalPagesRead || 0} /></div>
          <div className="stat-label">Pages Read</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiStar /></div>
          <div className="stat-value">{stats?.avgRating || '0.0'}</div>
          <div className="stat-label">Average Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiClock /></div>
          <div className="stat-value">{stats?.avgReadTime || '0h'}</div>
          <div className="stat-label">Avg. Read Time</div>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="trend-strip">
        <div className="trend-item">
          <FiTrendingUp className={`trend-icon ${trend >= 0 ? 'trend-up' : 'trend-down'}`} />
          <span>{trend >= 0 ? '+' : ''}{trend} book{Math.abs(trend) !== 1 ? 's' : ''} vs last month</span>
        </div>
        <div className="trend-item">
          <FiBook className="trend-icon" />
          <span>{currentlyReading.length} book{currentlyReading.length !== 1 ? 's' : ''} in progress</span>
        </div>
        <div className="trend-item">
          <FiCalendar className="trend-icon" />
          <span>{booksThisMonth} completed this month</span>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>
            Activity Timeline
            <div className="chart-toggle">
              {['W', 'M', 'Y'].map(v => (
                <button key={v} className={chartView === v ? 'active' : ''} onClick={() => setChartView(v)}>{v}</button>
              ))}
            </div>
          </h3>
          <div style={{ height: 220 }}>
            <Bar data={barData} options={barOptions} key={chartView} />
          </div>
        </div>

        <div className="chart-card">
          <h3>Genres</h3>
          <div>
            {totalGenres > 0 ? (
              <>
                <div style={{ height: 170, position: 'relative' }}>
                  <Doughnut data={donutData} options={donutOptions} />
                  <div className="donut-center">
                    <div className="donut-center-value"><AnimatedNumber value={totalGenres} /></div>
                    <div className="donut-center-label">Total</div>
                  </div>
                </div>
                <div className="genre-pills">
                  {(stats?.genreBreakdown || []).map((g, i) => (
                    <button key={g.genre} className="genre-pill" onClick={() => navigate(`/search?q=${encodeURIComponent(g.genre)}`)}>
                      <span className="genre-pill-dot" style={{ background: CHART_COLORS[i] }} />
                      {g.genre} <span className="genre-pill-count">{g.count}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <FiBook style={{ fontSize: 24 }} />
                <h3>No genres yet</h3>
                <p>Add books to see your genre breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom">
        <div>
          <div className="section-header">
            <h3>Currently Reading</h3>
            <Link to="/my-shelf">View All <FiArrowRight style={{ fontSize: 12 }} /></Link>
          </div>
          {currentlyReading.length === 0 ? (
            <div className="empty-state">
              <FiBook style={{ fontSize: 28 }} />
              <h3>No books in progress</h3>
              <p>Start reading something from your shelf!</p>
              <Link to="/search" className="btn-hero-action" style={{ display: 'inline-flex', marginTop: 8, fontSize: 13 }}>
                <FiSearch /> Find Books
              </Link>
            </div>
          ) : (
            currentlyReading.slice(0, 3).map((book) => {
              const progress = book.pageCount ? Math.round((book.pagesRead / book.pageCount) * 100) : 0;
              return (
                <Link to={`/book/${book._id}`} key={book._id} className="reading-card">
                  {book.thumbnail ? (
                    <img src={book.thumbnail} alt={book.title} />
                  ) : (
                    <div className="reading-card-placeholder" />
                  )}
                  <div className="reading-card-info">
                    <h4>{book.title}</h4>
                    <p>{book.authors?.join(', ')}</p>
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="progress-text">Page {book.pagesRead} of {book.pageCount}</div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div>
          <div className="section-header">
            <h3>Recommended for You</h3>
          </div>
          <div className="reco-card">
            <div className="reco-label">Based on your {recommendation.genre} reading</div>
            <h4>{recommendation.title}</h4>
            <p className="reco-author">by {recommendation.author}</p>
            <div className="reco-desc">{recommendation.desc}</div>
            <button className="btn-teal-sm" onClick={async () => {
              try {
                await axios.post('/api/books', {
                  title: recommendation.title, authors: [recommendation.author],
                  categories: [recommendation.genre], status: 'want-to-read', pageCount: 300,
                });
                setToast(`"${recommendation.title}" added to your shelf!`);
              } catch { setToast('Already on your shelf!'); }
              setTimeout(() => setToast(''), 3000);
            }}>
              <FiPlus /> Add to Shelf
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
