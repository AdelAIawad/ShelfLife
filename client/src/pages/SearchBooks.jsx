import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiPlus, FiCheck, FiBookOpen } from 'react-icons/fi';
import HeroHeader from '../components/HeroHeader';

const GENRES = ['All Genres', 'Fiction', 'Non-Fiction', 'Mystery', 'Sci-Fi', 'History', 'Biography', 'Philosophy'];

function SearchSkeleton() {
  return (
    <div className="search-book-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 360, borderRadius: 'var(--r-md)' }} />
      ))}
    </div>
  );
}

// Fallback popular books — tagged to match genre filters
const POPULAR_BOOKS = [
  { googleBooksId: 'pop1', title: 'The Alchemist', authors: ['Paulo Coelho'], thumbnail: 'https://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 197, categories: ['Fiction'], isbn: '978-0062315007' },
  { googleBooksId: 'pop2', title: '1984', authors: ['George Orwell'], thumbnail: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 328, categories: ['Fiction', 'Sci-Fi'], isbn: '978-0451524935' },
  { googleBooksId: 'pop3', title: 'Sapiens', authors: ['Yuval Noah Harari'], thumbnail: 'https://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 464, categories: ['Non-Fiction', 'History'], isbn: '978-0062316097' },
  { googleBooksId: 'pop4', title: 'Atomic Habits', authors: ['James Clear'], thumbnail: 'https://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 320, categories: ['Non-Fiction'], isbn: '978-0735211292' },
  { googleBooksId: 'pop5', title: 'Dune', authors: ['Frank Herbert'], thumbnail: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 688, categories: ['Fiction', 'Sci-Fi'], isbn: '978-0441172719' },
  { googleBooksId: 'pop6', title: 'The Girl with the Dragon Tattoo', authors: ['Stieg Larsson'], thumbnail: 'https://books.google.com/books/content?id=CqEiDQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 672, categories: ['Fiction', 'Mystery'], isbn: '978-0307949486' },
  { googleBooksId: 'pop7', title: 'Thinking, Fast and Slow', authors: ['Daniel Kahneman'], thumbnail: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 499, categories: ['Non-Fiction', 'Psychology'], isbn: '978-0374533557' },
  { googleBooksId: 'pop8', title: 'Meditations', authors: ['Marcus Aurelius'], thumbnail: 'https://books.google.com/books/content?id=nNCFDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 256, categories: ['Philosophy', 'Non-Fiction'], isbn: '978-0140449334' },
  { googleBooksId: 'pop9', title: 'Steve Jobs', authors: ['Walter Isaacson'], thumbnail: 'https://books.google.com/books/content?id=8U2oAAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 656, categories: ['Biography', 'Non-Fiction'], isbn: '978-1451648539' },
  { googleBooksId: 'pop10', title: 'The Guns of August', authors: ['Barbara Tuchman'], thumbnail: 'https://books.google.com/books/content?id=EB3cDCnBgGEC&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 511, categories: ['History', 'Non-Fiction'], isbn: '978-0345386236' },
  { googleBooksId: 'pop11', title: 'And Then There Were None', authors: ['Agatha Christie'], thumbnail: 'https://books.google.com/books/content?id=Zu3ICgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 272, categories: ['Fiction', 'Mystery'], isbn: '978-0062073488' },
  { googleBooksId: 'pop12', title: 'The Lean Startup', authors: ['Eric Ries'], thumbnail: 'https://books.google.com/books/content?id=tvfyz-4JILwC&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 336, categories: ['Non-Fiction'], isbn: '978-0307887894' },
];

// Filter popular books by genre
function filterPopularBooks(genre) {
  if (!genre || genre === 'All Genres') return POPULAR_BOOKS;
  return POPULAR_BOOKS.filter(b =>
    b.categories.some(c => c.toLowerCase().includes(genre.toLowerCase()))
  );
}

export default function SearchBooks() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeGenre, setActiveGenre] = useState('All Genres');
  const [addedBooks, setAddedBooks] = useState(new Set());
  const [toast, setToast] = useState('');
  const [statusMenu, setStatusMenu] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [showingPopular, setShowingPopular] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const [addedIsbns, setAddedIsbns] = useState(new Set());
  useEffect(() => {
    axios.get('/api/books').then(res => {
      setAddedBooks(new Set(res.data.map(b => b.googleBooksId).filter(Boolean)));
      setAddedIsbns(new Set(res.data.map(b => b.isbn).filter(Boolean)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const searchTerm = query.trim();
    if (!searchTerm && activeGenre === 'All Genres') {
      setResults([]);
      setShowingPopular(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setShowingPopular(false);
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (activeGenre !== 'All Genres') params.set('category', activeGenre.toLowerCase());
      if (!searchTerm && activeGenre !== 'All Genres') params.set('q', activeGenre.toLowerCase());

      axios.get(`/api/books/search?${params.toString()}`)
        .then(res => {
          if (res.data.length > 0) {
            setResults(res.data);
          } else {
            // API returned no results — show filtered popular books
            const filtered = filterPopularBooks(activeGenre !== 'All Genres' ? activeGenre : null);
            const textFiltered = searchTerm
              ? filtered.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase()) || b.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase())))
              : filtered;
            setResults(textFiltered.length > 0 ? textFiltered : filtered);
            setShowingPopular(true);
          }
        })
        .catch(() => {
          const filtered = filterPopularBooks(activeGenre !== 'All Genres' ? activeGenre : null);
          setResults(filtered.length > 0 ? filtered : POPULAR_BOOKS);
          setShowingPopular(true);
        })
        .finally(() => setLoading(false));
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeGenre]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  // Close status menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (statusMenu !== null && !e.target.closest('.status-dropdown')) {
        setStatusMenu(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [statusMenu]);

  const addToShelf = async (book, status = 'want-to-read') => {
    setAddingId(book.googleBooksId);
    try {
      await axios.post('/api/books', { ...book, status });
      setAddedBooks(prev => new Set([...prev, book.googleBooksId]));
      setStatusMenu(null);
      const labels = { 'reading': 'Currently Reading', 'want-to-read': 'Want to Read', 'completed': 'Completed' };
      showToast(`"${book.title}" added to ${labels[status]}!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add book';
      if (err.response?.status === 409) {
        // Book already on shelf — mark it as added in UI
        setAddedBooks(prev => new Set([...prev, book.googleBooksId]));
        showToast(`"${book.title}" is already on your shelf`);
      } else {
        showToast(msg);
      }
    } finally {
      setAddingId(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <>
      <HeroHeader
        title="Explore the Archives"
        subtitle="Discover your next great read from millions of titles."
        variant="explore"
      >
        <div className="search-input-wrapper" style={{ marginTop: 20 }}>
          <FiSearch />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              style={{ color: 'var(--text-faint)', fontSize: '1.2rem', lineHeight: 1, padding: 4 }}
            >
              &times;
            </button>
          )}
        </div>
        <div className="genre-filters">
          {GENRES.map((genre, i) => (
            <button
              key={genre}
              className={`genre-tag ${activeGenre === genre ? 'active' : ''}`}
              onClick={() => setActiveGenre(genre)}
              style={{ animation: `slideUp 0.4s var(--ease-out) ${i * 0.03}s backwards` }}
            >
              {genre}
            </button>
          ))}
        </div>
      </HeroHeader>

      {loading && <SearchSkeleton />}

      {!loading && results.length > 0 && (
        <>
          <div className="search-results-header">
            <FiBookOpen />
            {showingPopular
              ? 'Popular books you might enjoy'
              : <>Showing {results.length} results{query && <> for &ldquo;{query}&rdquo;</>}</>
            }
          </div>
          <div className="search-book-grid">
            {results.map((book, i) => {
              const isAdded = addedBooks.has(book.googleBooksId) || (book.isbn && addedIsbns.has(book.isbn));
              const isAdding = addingId === book.googleBooksId;
              return (
                <div key={book.googleBooksId || i} className="search-book-card">
                  <div style={{ overflow: 'hidden' }}>
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} className="search-book-cover" />
                    ) : (
                      <div className="no-cover">{book.title}</div>
                    )}
                  </div>
                  <div className="search-book-info">
                    <h4>{book.title}</h4>
                    <p>{book.authors?.join(', ')}</p>
                    {(book.pageCount > 0 || book.categories?.length > 0) && (
                      <div className="search-book-meta">
                        {book.pageCount > 0 && <span>{book.pageCount} pages</span>}
                        {book.categories?.[0] && <span>{book.categories[0]}</span>}
                      </div>
                    )}
                    {isAdded ? (
                      <button className="btn-add-shelf btn-added" disabled>
                        <FiCheck /> On Your Shelf
                      </button>
                    ) : (
                      <div className="status-dropdown">
                        <button
                          className="btn-add-shelf"
                          onClick={(e) => { e.stopPropagation(); setStatusMenu(statusMenu === i ? null : i); }}
                          disabled={isAdding}
                          style={isAdding ? { opacity: 0.6 } : {}}
                        >
                          {isAdding ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                              Adding...
                            </span>
                          ) : (
                            <><FiPlus /> Add to Shelf</>
                          )}
                        </button>
                        {statusMenu === i && (
                          <div className="status-dropdown-menu">
                            <button onClick={(e) => { e.stopPropagation(); addToShelf(book, 'reading'); }}>
                              📖 Currently Reading
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); addToShelf(book, 'want-to-read'); }}>
                              📚 Want to Read
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); addToShelf(book, 'completed'); }}>
                              ✅ Completed
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && results.length === 0 && !query && (
        <>
          <div className="search-results-header">
            <FiBookOpen /> {activeGenre === 'All Genres' ? 'Popular books to explore' : `Popular ${activeGenre} books`}
          </div>
          <div className="search-book-grid">
            {filterPopularBooks(activeGenre !== 'All Genres' ? activeGenre : null).map((book, i) => {
              const isAdded = addedBooks.has(book.googleBooksId) || (book.isbn && addedIsbns.has(book.isbn));
              return (
                <div key={book.googleBooksId} className="search-book-card">
                  <div style={{ overflow: 'hidden' }}>
                    <img src={book.thumbnail} alt={book.title} className="search-book-cover" />
                  </div>
                  <div className="search-book-info">
                    <h4>{book.title}</h4>
                    <p>{book.authors?.join(', ')}</p>
                    {(book.pageCount > 0 || book.categories?.length > 0) && (
                      <div className="search-book-meta">
                        {book.pageCount > 0 && <span>{book.pageCount} pages</span>}
                        {book.categories?.[0] && <span>{book.categories[0]}</span>}
                      </div>
                    )}
                    {isAdded ? (
                      <button className="btn-add-shelf btn-added" disabled><FiCheck /> On Your Shelf</button>
                    ) : (
                      <div className="status-dropdown">
                        <button className="btn-add-shelf" onClick={() => setStatusMenu(statusMenu === `pop-${i}` ? null : `pop-${i}`)}>
                          <FiPlus /> Add to Shelf
                        </button>
                        {statusMenu === `pop-${i}` && (
                          <div className="status-dropdown-menu">
                            <button onClick={() => addToShelf(book, 'reading')}>📖 Currently Reading</button>
                            <button onClick={() => addToShelf(book, 'want-to-read')}>📚 Want to Read</button>
                            <button onClick={() => addToShelf(book, 'completed')}>✅ Completed</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
