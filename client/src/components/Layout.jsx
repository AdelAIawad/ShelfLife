import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid, FiBook, FiSearch, FiLogOut, FiBell,
  FiSettings, FiHelpCircle, FiChevronDown, FiX,
  FiAward, FiTrendingUp, FiStar, FiMail, FiBookOpen
} from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

const QUOTES = [
  { text: 'A reader lives a thousand lives before he dies.', author: 'George R.R. Martin' },
  { text: 'I have always imagined that Paradise will be a kind of library.', author: 'Jorge Luis Borges' },
  { text: 'Books are a uniquely portable magic.', author: 'Stephen King' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Generate dynamic notifications from actual book data
  useEffect(() => {
    axios.get('/api/books').then(res => {
      const books = res.data;
      const notifs = [];
      const completed = books.filter(b => b.status === 'completed');
      const reading = books.filter(b => b.status === 'reading');

      if (completed.length >= 5) {
        notifs.push({ id: 'n1', icon: <FiAward />, title: 'Achievement Unlocked!', desc: `You've completed ${completed.length} books. Keep the momentum going!`, time: 'Just now', color: '#B8963C', read: false });
      }
      if (reading.length > 0) {
        const closest = reading.sort((a, b) => (b.pagesRead / (b.pageCount || 1)) - (a.pagesRead / (a.pageCount || 1)))[0];
        const pct = closest.pageCount ? Math.round((closest.pagesRead / closest.pageCount) * 100) : 0;
        if (pct > 50) {
          notifs.push({ id: 'n2', icon: <FiBookOpen />, title: 'Almost Done!', desc: `You're ${pct}% through "${closest.title}". Keep reading!`, time: 'Today', color: '#2E6B4F', read: false });
        }
      }
      const rated = completed.filter(b => b.rating >= 4);
      if (rated.length > 0) {
        notifs.push({ id: 'n3', icon: <FiStar />, title: 'Top Rated', desc: `You've given ${rated.length} book${rated.length > 1 ? 's' : ''} a 4+ star rating.`, time: 'This week', color: '#8B5E3C', read: false });
      }
      notifs.push({ id: 'n4', icon: <FiTrendingUp />, title: 'Library Growing', desc: `Your shelf has ${books.length} books across ${new Set(books.flatMap(b => b.categories || [])).size} genres.`, time: 'Overview', color: '#2D4466', read: true });

      setNotifications(notifs);
    }).catch(() => {});
  }, [location.pathname]);
  const [settingsModal, setSettingsModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [aboutModal, setAboutModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [termsModal, setTermsModal] = useState(false);
  const [toast, setToast] = useState('');
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setShowProfile(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showToast('All notifications marked as read');
  };
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-layout">
      {/* ===== TOP NAV ===== */}
      <header className={`top-nav ${scrolled ? 'scrolled' : ''}`}>
        {/* Left: Brand */}
        <NavLink to="/dashboard" className="top-nav-brand">
          <span className="logo-icon">📖</span>
          <span className="brand-name">ShelfLife</span>
        </NavLink>

        {/* Center: Navigation */}
        <nav className="top-nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiGrid /> Dashboard
          </NavLink>
          <NavLink to="/my-shelf" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiBook /> My Shelf
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => isActive ? 'active' : ''}>
            <FiSearch /> Explore
          </NavLink>
        </nav>

        {/* Right: Utilities */}
        <div className="top-nav-right">
          <div className="search-bar-nav">
            <FiSearch />
            <input type="text" placeholder="Search..." onKeyDown={e => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                navigate(`/search?q=${encodeURIComponent(e.target.value.trim())}`);
                e.target.value = '';
              }
            }} />
          </div>

          {/* Notifications */}
          <div className="dropdown-wrapper" ref={notifRef}>
            <button className={`nav-icon-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}>
              <FiBell />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            {showNotifications && (
              <div className="dropdown-panel notifications-panel">
                <div className="dropdown-header">
                  <h4>Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h4>
                  <button className="dropdown-close" onClick={() => setShowNotifications(false)}><FiX /></button>
                </div>
                <div className="dropdown-body">
                  {notifications.map(n => (
                    <div key={n.id} className={`notification-item ${n.read ? 'read' : ''}`}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}>
                      <div className="notif-icon" style={{ color: n.color, background: `${n.color}15` }}>{n.icon}</div>
                      <div className="notif-content">
                        <strong>{n.title}</strong>
                        <p>{n.desc}</p>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      {!n.read && <div className="notif-unread-dot" />}
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button onClick={markAllRead}>Mark all as read</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="dropdown-wrapper" ref={profileRef}>
            <button className={`profile-trigger ${showProfile ? 'active' : ''}`}
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}>
              <div className="avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
              <FiChevronDown className={`chevron ${showProfile ? 'rotated' : ''}`} />
            </button>
            {showProfile && (
              <div className="dropdown-panel profile-panel">
                <div className="profile-header">
                  <div className="avatar avatar-lg">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
                  <div>
                    <h4>{user?.name || 'Reader'}</h4>
                    <p>{user?.email || ''}</p>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-body">
                  <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/my-shelf'); }}><FiBook /> My Collection</button>
                  <button className="dropdown-item" onClick={() => { setShowProfile(false); navigate('/dashboard'); }}><FiTrendingUp /> Reading Stats</button>
                  <button className="dropdown-item" onClick={() => { setShowProfile(false); setSettingsModal(true); }}><FiSettings /> Settings</button>
                  <button className="dropdown-item" onClick={() => { setShowProfile(false); setHelpModal(true); }}><FiHelpCircle /> Help & Support</button>
                </div>
                <div className="dropdown-divider" />
                <div className="dropdown-body">
                  <button className="dropdown-item danger" onClick={handleLogout}><FiLogOut /> Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content" key={location.pathname}>
        <Outlet />
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="app-footer">
        <div className="footer-shelf-edge" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-brand">
            <span>📖</span>
            <span className="footer-brand-name">ShelfLife</span>
            <span className="footer-tagline">The Digital Archivist</span>
          </div>
          <div className="footer-links">
            <button onClick={() => setAboutModal(true)}>About</button>
            <button onClick={() => setPrivacyModal(true)}>Privacy</button>
            <button onClick={() => setTermsModal(true)}>Terms</button>
            <button onClick={() => setHelpModal(true)}>Contact</button>
          </div>
          <div className="footer-copy">
            <span className="footer-copy-animated">
              &copy; {new Date().getFullYear()} ShelfLife. All rights reserved.
            </span>
          </div>
        </div>
        <div className="footer-quote">
          <p>"{quote.text}"</p>
          <span>— {quote.author}</span>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      <Modal open={settingsModal} onClose={() => setSettingsModal(false)} title="Settings">
        <div className="settings-section">
          <h4>Account</h4>
          <div className="settings-row"><span>Name</span><span className="settings-value">{user?.name}</span></div>
          <div className="settings-row"><span>Email</span><span className="settings-value">{user?.email}</span></div>
        </div>
        <div className="settings-section">
          <h4>Preferences</h4>
          <div className="settings-row"><span>Reading Goal</span><span className="settings-value">4 books / month</span></div>
          <div className="settings-row"><span>Notifications</span><span className="settings-value">Enabled</span></div>
          <div className="settings-row"><span>Theme</span><span className="settings-value">Light</span></div>
        </div>
      </Modal>

      <Modal open={helpModal} onClose={() => setHelpModal(false)} title="Help & Support">
        <div className="help-section">
          <div className="help-item"><FiBookOpen className="help-icon" /><div><strong>Getting Started</strong><p>Search for books using the Explore page, add them to your shelf, then track progress and write reviews.</p></div></div>
          <div className="help-item"><FiSearch className="help-icon" /><div><strong>Finding Books</strong><p>Use the search bar or browse by genre. Our archive is powered by Google Books.</p></div></div>
          <div className="help-item"><FiStar className="help-icon" /><div><strong>Rating & Reviews</strong><p>Click any book on your shelf to rate it, update progress, and write a review.</p></div></div>
          <div className="help-item"><FiMail className="help-icon" /><div><strong>Contact Us</strong><p>Have questions? Reach out at support@shelflife.app</p></div></div>
        </div>
      </Modal>

      <Modal open={aboutModal} onClose={() => setAboutModal(false)} title="About ShelfLife">
        <div className="about-content">
          <div className="about-logo">📖</div>
          <h2>ShelfLife</h2>
          <p className="about-tagline">The Digital Archivist</p>
          <p className="about-desc">A personal reading companion that helps you track your literary journey. Curate your library, discover new books, write reviews, and visualize your reading habits.</p>
          <div className="about-meta">
            <div><strong>Version</strong><span>1.0.0</span></div>
            <div><strong>Built with</strong><span>React, Node.js, MongoDB</span></div>
            <div><strong>API</strong><span>Google Books</span></div>
          </div>
          <p className="about-copy">&copy; 2026 ShelfLife. All rights reserved.</p>
        </div>
      </Modal>

      <Modal open={privacyModal} onClose={() => setPrivacyModal(false)} title="Privacy Policy">
        <div className="privacy-content">
          <h4>Data Collection</h4>
          <p>ShelfLife collects only the data necessary to provide our service: your account information (name, email) and reading data (books, ratings, reviews).</p>
          <h4>Data Usage</h4>
          <p>Your data is used exclusively to power your personal reading dashboard. We never share, sell, or transfer your personal information to third parties.</p>
          <h4>Data Storage & Security</h4>
          <p>All data is stored securely using industry-standard encryption. You can request complete deletion of your account and all associated data at any time by contacting support.</p>
        </div>
      </Modal>

      <Modal open={termsModal} onClose={() => setTermsModal(false)} title="Terms of Service">
        <div className="privacy-content">
          <h4>Acceptable Use</h4>
          <p>By using ShelfLife, you agree to use the service for personal, non-commercial book tracking purposes. You must be at least 13 years old to create an account.</p>
          <h4>Your Content</h4>
          <p>Reviews, ratings, and reading data you create remain yours. By posting reviews, you grant ShelfLife a license to display them within the platform.</p>
          <h4>Service Availability</h4>
          <p>ShelfLife is provided "as is." We strive for 99.9% uptime but cannot guarantee uninterrupted access. Book data is sourced from Google Books API and may vary in accuracy.</p>
        </div>
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
