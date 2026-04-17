import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiChevronLeft, FiChevronRight, FiBook, FiBookOpen, FiTrash2, FiAlertTriangle, FiGrid, FiList } from 'react-icons/fi';
import HeroHeader from '../components/HeroHeader';

function ConfirmModal({ open, title, message, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-icon" style={{ color: danger ? 'var(--danger)' : 'var(--clr-amber)' }}>
          <FiAlertTriangle />
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {danger ? 'Remove' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShelfSkeleton() {
  return (
    <>
      <div style={{ padding: '48px 24px 32px' }}>
        <div className="skeleton" style={{ height: 28, width: '30%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '50%' }} />
      </div>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ padding: '0 24px', marginBottom: 40 }}>
          <div className="skeleton" style={{ height: 20, width: '25%', marginBottom: 16 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 260, borderRadius: 12 }} />)}
          </div>
        </div>
      ))}
    </>
  );
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'title', label: 'Title (A–Z)' },
  { value: 'author', label: 'Author (A–Z)' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'pages', label: 'Most Pages' },
];

function sortBooks(books, sortBy) {
  const sorted = [...books];
  switch (sortBy) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'author':
      return sorted.sort((a, b) => (a.authors?.[0] || '').localeCompare(b.authors?.[0] || ''));
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'pages':
      return sorted.sort((a, b) => (b.pageCount || 0) - (a.pageCount || 0));
    case 'recent':
    default:
      return sorted.sort((a, b) => new Date(b.updatedAt || b.dateAdded || 0) - new Date(a.updatedAt || a.dateAdded || 0));
  }
}

export default function MyShelf() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    axios.get('/api/books')
      .then(res => setBooks(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ShelfSkeleton />;

  const reading = sortBooks(books.filter(b => b.status === 'reading'), sortBy);
  const wantToRead = sortBooks(books.filter(b => b.status === 'want-to-read'), sortBy);
  const completed = sortBooks(books.filter(b => b.status === 'completed'), sortBy);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget._id);
    setDeleteTarget(null);
    try {
      await axios.delete(`/api/books/${deleteTarget._id}`);
      setBooks(prev => prev.filter(b => b._id !== deleteTarget._id));
      showToast(`"${deleteTarget.title}" removed`);
    } catch { showToast('Failed to remove book'); }
    finally { setDeletingId(null); }
  };

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const changeStatus = async (e, id, newStatus) => {
    e.preventDefault(); e.stopPropagation();
    try {
      const res = await axios.put(`/api/books/${id}`, { status: newStatus });
      setBooks(prev => prev.map(b => b._id === id ? res.data : b));
      const labels = { 'reading': 'Currently Reading', 'want-to-read': 'Want to Read', 'completed': 'Completed' };
      showToast(`Moved to ${labels[newStatus]}`);
    } catch { showToast('Failed to update'); }
  };

  const scrollGrid = (sectionId, direction) => {
    const grid = document.getElementById(sectionId);
    if (grid) grid.scrollBy({ left: direction * 220, behavior: 'smooth' });
  };

  const emptyCopyByStatus = {
    'Currently Reading': {
      icon: <FiBookOpen />,
      title: 'Nothing in progress',
      message: 'When you start reading a book, it will appear here.',
    },
    'Want to Read': {
      icon: <FiBook />,
      title: 'Your wishlist is empty',
      message: 'Discover something new and save it for later.',
    },
    'Completed': {
      icon: <FiBook />,
      title: 'No completed books yet',
      message: 'Finished books appear here with your rating and review.',
    },
  };

  const renderSection = (title, bookList, count) => {
    const sectionId = `shelf-${title.replace(/\s+/g, '-').toLowerCase()}`;
    const emptyCopy = emptyCopyByStatus[title] || { icon: <FiBook />, title: 'Empty', message: 'Nothing here yet.' };
    return (
      <div className="shelf-section">
        <div className="shelf-section-header">
          <h2>{title} <span className="badge">{count} book{count !== 1 ? 's' : ''}</span></h2>
          {bookList.length > 4 && (
            <div className="shelf-nav">
              <button onClick={() => scrollGrid(sectionId, -1)} aria-label="Scroll left"><FiChevronLeft /></button>
              <button onClick={() => scrollGrid(sectionId, 1)} aria-label="Scroll right"><FiChevronRight /></button>
            </div>
          )}
        </div>

        {bookList.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 32, marginBottom: 12, color: 'var(--clr-sapphire)', opacity: 0.6 }}>{emptyCopy.icon}</div>
            <h3>{emptyCopy.title}</h3>
            <p>{emptyCopy.message}</p>
            <Link to="/search" className="btn-hero-action" style={{ display: 'inline-flex', fontSize: 13 }}>
              <FiPlus /> Find Books
            </Link>
          </div>
        ) : (
          <div className={`book-grid ${bookList.length > 4 ? 'book-grid-scroll' : ''}`} id={sectionId}>
            {bookList.map((book) => {
              const progress = book.pageCount ? Math.round((book.pagesRead / book.pageCount) * 100) : 0;
              const isDeleting = deletingId === book._id;
              return (
                <Link to={`/book/${book._id}`} key={book._id} className="book-card" style={{ opacity: isDeleting ? 0.3 : 1 }}>
                  <div className="book-card-cover-wrap">
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} className="book-card-cover" />
                    ) : (
                      <div className="no-cover">{book.title}</div>
                    )}
                    <div className="book-card-overlay">
                      {book.status !== 'reading' && (
                        <button className="overlay-btn" onClick={e => changeStatus(e, book._id, 'reading')}>Start Reading</button>
                      )}
                      {book.status !== 'completed' && (
                        <button className="overlay-btn" onClick={e => changeStatus(e, book._id, 'completed')}>Mark Complete</button>
                      )}
                      <button className="overlay-btn overlay-btn-danger" onClick={e => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(book); }}>
                        <FiTrash2 /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="book-card-info">
                    <h4>{book.title}</h4>
                    <p>{book.authors?.join(', ')}</p>
                  </div>
                  {book.status === 'reading' && (
                    <div className="progress-bar-wrapper" style={{ padding: '0 2px 4px' }}>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="progress-text">{progress}%</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <HeroHeader
        title="My Shelf"
        subtitle={`${books.length} book${books.length !== 1 ? 's' : ''} across your reading journey — organized, curated, and yours.`}
        variant="shelf"
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/search" className="btn-hero-action"><FiPlus /> Add Book</Link>
            <div className="shelf-sort-wrap">
              <label className="shelf-sort-label">Sort:</label>
              <select
                className="shelf-sort-select"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {renderSection('Currently Reading', reading, reading.length)}
      {renderSection('Want to Read', wantToRead, wantToRead.length)}
      {renderSection('Completed', completed, completed.length)}

      <ConfirmModal
        open={!!deleteTarget}
        title="Remove Book"
        message={`Are you sure you want to remove "${deleteTarget?.title}" from your shelf? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        danger
      />

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
