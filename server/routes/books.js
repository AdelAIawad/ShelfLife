const express = require('express');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

// Allowed fields for book creation/update (prevents mass assignment)
const ALLOWED_BOOK_FIELDS = [
  'title', 'authors', 'thumbnail', 'pageCount', 'categories', 'isbn',
  'status', 'pagesRead', 'rating', 'review', 'format', 'googleBooksId',
  'description', 'publishedDate', 'publisher', 'dateCompleted', 'dateAdded'
];

function sanitizeBookInput(body) {
  const clean = {};
  ALLOWED_BOOK_FIELDS.forEach(field => {
    if (body[field] !== undefined) clean[field] = body[field];
  });
  return clean;
}

// GET /api/books - Get all books for user
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { user: req.user._id };
    if (status) filter.status = status;
    const books = await Book.find(filter).sort({ updatedAt: -1 });
    res.json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/books/search - Search Google Books API
// IMPORTANT: This must be ABOVE /:id to avoid "search" being treated as an ObjectId
router.get('/search', auth, async (req, res) => {
  try {
    const { q, category, maxResults = 12 } = req.query;
    if (!q && !category) {
      return res.status(400).json({ message: 'Search query required' });
    }
    let searchQuery = q || '';
    if (category) searchQuery += `+subject:${category}`;

    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=${maxResults}${apiKey ? `&key=${apiKey}` : ''}`;

    const response = await axios.get(url);
    const books = (response.data.items || []).map(item => ({
      googleBooksId: item.id,
      title: item.volumeInfo.title || 'Unknown Title',
      authors: item.volumeInfo.authors || ['Unknown Author'],
      description: item.volumeInfo.description || '',
      thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      pageCount: item.volumeInfo.pageCount || 0,
      categories: item.volumeInfo.categories || [],
      isbn: (item.volumeInfo.industryIdentifiers || []).find(id => id.type === 'ISBN_13')?.identifier || '',
      publishedDate: item.volumeInfo.publishedDate || '',
      publisher: item.volumeInfo.publisher || '',
    }));

    res.json(books);
  } catch (error) {
    if (error.response?.status === 429) {
      return res.status(429).json({ message: 'Google Books API rate limit reached. Try again later or browse popular books below.' });
    }
    res.status(500).json({ message: 'Failed to search books. Please try again.' });
  }
});

// GET /api/books/stats - Get reading statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id });
    const completed = books.filter(b => b.status === 'completed');
    const reading = books.filter(b => b.status === 'reading');

    const totalBooksRead = completed.length;
    const totalPagesRead = completed.reduce((sum, b) => sum + (b.pageCount || 0), 0)
      + reading.reduce((sum, b) => sum + (b.pagesRead || 0), 0);

    // Fix: safe avgRating calculation
    const ratedBooks = completed.filter(b => b.rating > 0);
    const avgRating = ratedBooks.length > 0
      ? (ratedBooks.reduce((sum, b) => sum + b.rating, 0) / ratedBooks.length).toFixed(1)
      : '0.0';

    // Books per month (last 12 months)
    const now = new Date();
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        count: 0,
      };
    });
    completed.forEach(book => {
      const d = book.dateCompleted || book.updatedAt;
      if (d) {
        const idx = monthlyData.findIndex(
          m => m.month === d.toLocaleString('default', { month: 'short' }) && m.year === d.getFullYear()
        );
        if (idx !== -1) monthlyData[idx].count++;
      }
    });

    // Genre breakdown
    const genreCounts = {};
    books.forEach(book => {
      (book.categories || []).forEach(cat => {
        genreCounts[cat] = (genreCounts[cat] || 0) + 1;
      });
    });

    // Achievements / badges system — icon values map to Feather icon names rendered on frontend
    const achievements = [];
    if (totalBooksRead >= 1) achievements.push({ id: 'first-book', title: 'First Chapter', desc: 'Completed your first book', icon: 'book-open', earned: true });
    if (totalBooksRead >= 5) achievements.push({ id: 'bookworm', title: 'Bookworm', desc: 'Completed 5 books', icon: 'layers', earned: true });
    if (totalBooksRead >= 10) achievements.push({ id: 'scholar', title: 'Scholar', desc: 'Completed 10 books', icon: 'award', earned: true });
    if (totalBooksRead >= 25) achievements.push({ id: 'librarian', title: 'Librarian', desc: 'Completed 25 books', icon: 'archive', earned: true });
    if (totalPagesRead >= 1000) achievements.push({ id: 'page-turner', title: 'Page Turner', desc: 'Read 1,000 pages', icon: 'file-text', earned: true });
    if (totalPagesRead >= 5000) achievements.push({ id: 'marathon-reader', title: 'Marathon Reader', desc: 'Read 5,000 pages', icon: 'zap', earned: true });
    if (ratedBooks.length >= 5) achievements.push({ id: 'critic', title: 'Critic', desc: 'Rated 5+ books', icon: 'star', earned: true });
    if (Object.keys(genreCounts).length >= 5) achievements.push({ id: 'explorer', title: 'Genre Explorer', desc: 'Read across 5+ genres', icon: 'compass', earned: true });
    const fiveStarBooks = completed.filter(b => b.rating === 5);
    if (fiveStarBooks.length >= 3) achievements.push({ id: 'connoisseur', title: 'Connoisseur', desc: 'Gave 3+ books a perfect 5-star rating', icon: 'hexagon', earned: true });
    const reviewedBooks = completed.filter(b => b.review && b.review.length > 0);
    if (reviewedBooks.length >= 3) achievements.push({ id: 'reviewer', title: 'Thoughtful Reviewer', desc: 'Wrote 3+ book reviews', icon: 'edit-3', earned: true });

    // Upcoming achievements (not yet earned)
    if (totalBooksRead < 5) achievements.push({ id: 'bookworm', title: 'Bookworm', desc: `Complete 5 books (${totalBooksRead}/5)`, icon: 'layers', earned: false, progress: totalBooksRead / 5 });
    else if (totalBooksRead < 10) achievements.push({ id: 'scholar', title: 'Scholar', desc: `Complete 10 books (${totalBooksRead}/10)`, icon: 'award', earned: false, progress: totalBooksRead / 10 });
    else if (totalBooksRead < 25) achievements.push({ id: 'librarian', title: 'Librarian', desc: `Complete 25 books (${totalBooksRead}/25)`, icon: 'archive', earned: false, progress: totalBooksRead / 25 });
    if (totalPagesRead < 1000) achievements.push({ id: 'page-turner', title: 'Page Turner', desc: `Read 1,000 pages (${totalPagesRead.toLocaleString()}/1,000)`, icon: 'file-text', earned: false, progress: totalPagesRead / 1000 });
    else if (totalPagesRead < 5000) achievements.push({ id: 'marathon-reader', title: 'Marathon Reader', desc: `Read 5,000 pages (${totalPagesRead.toLocaleString()}/5,000)`, icon: 'zap', earned: false, progress: totalPagesRead / 5000 });

    // Reading streak (consecutive months with at least 1 completed book, counting back from current month)
    let streak = 0;
    for (let i = monthlyData.length - 1; i >= 0; i--) {
      if (monthlyData[i].count > 0) streak++;
      else break;
    }

    // Avg read time: use realistic calculation (assume ~40 pages/hour average reading speed)
    const avgPagesPerBook = totalBooksRead > 0 ? totalPagesRead / totalBooksRead : 0;
    const avgReadTimeHours = Math.round(avgPagesPerBook / 40);

    // Top-rated book (highest rating, tiebreaker = most recently completed)
    const topRatedBook = ratedBooks.length > 0
      ? [...ratedBooks].sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating;
          return new Date(b.dateCompleted || 0) - new Date(a.dateCompleted || 0);
        })[0]
      : null;

    res.json({
      totalBooksRead,
      totalPagesRead,
      avgRating: Number(avgRating) || 0,
      avgReadTime: `${avgReadTimeHours}h`,
      monthlyData,
      genreBreakdown: Object.entries(genreCounts).map(([genre, count]) => ({ genre, count })),
      currentlyReading: reading,
      achievements,
      readingStreak: streak,
      totalBooks: books.length,
      totalReviews: reviewedBooks.length,
      topRatedBook: topRatedBook ? {
        _id: topRatedBook._id,
        title: topRatedBook.title,
        authors: topRatedBook.authors,
        thumbnail: topRatedBook.thumbnail,
        rating: topRatedBook.rating,
        review: topRatedBook.review,
        dateCompleted: topRatedBook.dateCompleted,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/books/:id - Get a single book
router.get('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/books - Add a book (with duplicate prevention)
router.post('/', auth, async (req, res) => {
  try {
    const data = sanitizeBookInput(req.body);

    // Prevent duplicate books by googleBooksId or isbn
    if (data.googleBooksId) {
      const existing = await Book.findOne({ user: req.user._id, googleBooksId: data.googleBooksId });
      if (existing) return res.status(409).json({ message: 'This book is already on your shelf', book: existing });
    }
    if (data.isbn) {
      const existing = await Book.findOne({ user: req.user._id, isbn: data.isbn });
      if (existing) return res.status(409).json({ message: 'This book is already on your shelf', book: existing });
    }

    const book = await Book.create({ ...data, user: req.user._id });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/books/:id - Update a book (sanitized)
router.put('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const data = sanitizeBookInput(req.body);
    Object.assign(book, data);
    if (data.status === 'completed' && !book.dateCompleted) {
      book.dateCompleted = new Date();
      book.pagesRead = book.pageCount;
    }
    await book.save();
    res.json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/books/:id - Delete a book
router.delete('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
