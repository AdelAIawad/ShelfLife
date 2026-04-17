import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend,
} from 'chart.js';
import {
  FiBook, FiFileText, FiStar, FiClock, FiArrowRight,
  FiTrendingUp, FiCalendar, FiAward, FiBookOpen, FiLayers, FiArchive,
  FiZap, FiCompass, FiHexagon, FiEdit3
} from 'react-icons/fi';

const BADGE_ICONS = {
  'book-open': FiBookOpen,
  'layers': FiLayers,
  'award': FiAward,
  'archive': FiArchive,
  'file-text': FiFileText,
  'zap': FiZap,
  'star': FiStar,
  'compass': FiCompass,
  'hexagon': FiHexagon,
  'edit-3': FiEdit3,
};

function BadgeIcon({ name, size = 18 }) {
  const Icon = BADGE_ICONS[name] || FiAward;
  return <Icon size={size} />;
}
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

const CHART_COLORS = ['#3D6B9E', '#9B4A5A', '#7B5E8E', '#C49A5C', '#4A8B8B', '#A0704A', '#5A8EC4', '#4A7CB5', '#8B6B55', '#5A6B82', '#7B9A5E', '#6B8BAA'];

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
        if (v === 0) return 'rgba(74,124,181,0.06)';
        if (i === arr.length - 1) return '#4A7CB5';
        return 'rgba(74,124,181,0.3)';
      }),
      borderRadius: 4, barThickness: chartView === 'M' ? 20 : 32,
      hoverBackgroundColor: '#5A9BD5',
    }],
  };

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 22, 36, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        titleColor: '#E8ECF4', bodyColor: '#E8ECF4',
        titleFont: { family: 'Inter', size: 12 }, bodyFont: { family: 'Inter', size: 13, weight: '500' },
        padding: 12, cornerRadius: 8, displayColors: false,
        callbacks: { label: ctx => `${ctx.raw} book${ctx.raw !== 1 ? 's' : ''} completed` },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11, family: 'Inter' }, color: '#6B7B95' }, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, border: { display: false } },
      x: { ticks: { font: { size: 11, family: 'Inter' }, color: '#6B7B95' }, grid: { display: false }, border: { display: false } },
    },
    animation: { duration: 600, easing: 'easeOutQuart' },
  };

  const donutData = {
    labels: (stats?.genreBreakdown || []).map(g => g.genre),
    datasets: [{
      data: (stats?.genreBreakdown || []).map(g => g.count),
      backgroundColor: CHART_COLORS.slice(0, (stats?.genreBreakdown || []).length),
      borderWidth: 2, borderColor: 'rgba(15, 22, 36, 0.8)', hoverOffset: 4,
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
        backgroundColor: 'rgba(15, 22, 36, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
        titleColor: '#E8ECF4', bodyColor: '#E8ECF4',
        padding: 12, cornerRadius: 8,
        titleFont: { family: 'Inter' }, bodyFont: { family: 'Inter', weight: '500' },
      },
    },
    animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' },
  };

  const totalGenres = (stats?.genreBreakdown || []).reduce((s, g) => s + g.count, 0);

  // Reading streak (based on books with recent updates)
  const currentlyReading = stats?.currentlyReading || [];
  const booksThisMonth = (stats?.monthlyData || []).slice(-1)[0]?.count || 0;
  const booksLastMonth = (stats?.monthlyData || []).slice(-2, -1)[0]?.count || 0;
  const trend = booksThisMonth - booksLastMonth;

  return (
    <>
      <HeroHeader
        title={`Your ${new Date().getFullYear()} in Books`}
        subtitle="A look at your reading patterns, achievements, and the stories that shaped your year."
        variant="dashboard"
      />

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

      {/* Achievements */}
      {(stats?.achievements || []).length > 0 && (
        <div style={{ padding: '0 var(--sp-xl)', marginBottom: 'var(--sp-2xl)' }}>
          <div className="section-header" style={{ marginBottom: 12 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiAward /> Achievements</h3>
            {stats?.readingStreak > 0 && (
              <span style={{ fontSize: 12, color: 'var(--brand-accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                <FiZap size={13} /> {stats.readingStreak} month streak
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(stats?.achievements || []).map(badge => (
              <div key={badge.id + (badge.earned ? '-earned' : '-locked')} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px',
                background: badge.earned ? 'var(--glass-bg)' : 'var(--glass-bg-light)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: badge.earned ? '1px solid var(--border-glass)' : '1px solid var(--border-light)',
                borderRadius: 'var(--r-lg)',
                opacity: badge.earned ? 1 : 0.5,
                transition: 'all 0.25s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: badge.earned ? 'var(--glass-highlight)' : 'none',
              }}>
                {!badge.earned && badge.progress != null && (
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0,
                    height: 3, width: `${Math.min(badge.progress * 100, 100)}%`,
                    background: 'var(--gradient-brand)',
                    borderRadius: 2,
                  }} />
                )}
                <div style={{
                  width: 34, height: 34, borderRadius: 'var(--r-md)',
                  background: badge.earned ? 'rgba(74,124,181,0.12)' : 'rgba(74,124,181,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: badge.earned ? 'var(--clr-sapphire)' : 'var(--text-faint)',
                  flexShrink: 0,
                }}>
                  <BadgeIcon name={badge.icon} size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: badge.earned ? 'var(--text-primary)' : 'var(--text-muted)', lineHeight: 1.3 }}>
                    {badge.title}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.3 }}>{badge.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="charts-row">
        <div className="chart-card">
          <h3>
            Activity Timeline
            <div className="chart-toggle">
              {['M', 'Y'].map(v => (
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

      {/* Top Authors & Best Book */}
      {stats?.totalBooksRead > 0 && (
        <div style={{ padding: '0 var(--sp-xl)', marginBottom: 'var(--sp-2xl)' }}>
          <div className="dashboard-summary-grid">
            {/* Top rated book */}
            <div className="summary-card">
              <div className="summary-card-label"><FiStar /> Top Rated This Year</div>
              {(() => {
                const topBook = [...(stats.currentlyReading || []), ...(stats.completed || [])]
                  .concat(stats.topRatedBook ? [stats.topRatedBook] : []);
                return null;
              })()}
              <div className="summary-card-content">
                <h4>See your reviews</h4>
                <p>Head to My Shelf to revisit your highest-rated reads</p>
                <Link to="/my-shelf" className="summary-card-link">
                  Browse completed <FiArrowRight />
                </Link>
              </div>
            </div>

            {/* Reading pace */}
            <div className="summary-card">
              <div className="summary-card-label"><FiClock /> Your Reading Pace</div>
              <div className="summary-card-content">
                <div className="summary-big-number">
                  {stats.totalBooksRead > 0
                    ? Math.round((stats.totalPagesRead || 0) / stats.totalBooksRead)
                    : 0}
                  <span>pages</span>
                </div>
                <p>per book on average · about {stats.avgReadTime || '0h'} reading time</p>
              </div>
            </div>

            {/* Genre diversity */}
            <div className="summary-card">
              <div className="summary-card-label"><FiTrendingUp /> Genre Diversity</div>
              <div className="summary-card-content">
                <div className="summary-big-number">
                  {(stats.genreBreakdown || []).length}
                  <span>genres</span>
                </div>
                <p>
                  {(stats.genreBreakdown || []).length >= 5
                    ? 'You\'re an eclectic reader'
                    : 'Explore a new genre to expand'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
