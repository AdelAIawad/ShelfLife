const express = require('express');
const Book = require('../models/Book');
const auth = require('../middleware/auth');
const axios = require('axios');
const router = express.Router();

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

// GET /api/books/stats - Get reading statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const books = await Book.find({ user: req.user._id });
    const completed = books.filter(b => b.status === 'completed');
    const reading = books.filter(b => b.status === 'reading');

    const totalBooksRead = completed.length;
    const totalPagesRead = completed.reduce((sum, b) => sum + (b.pageCount || 0), 0)
      + reading.reduce((sum, b) => sum + (b.pagesRead || 0), 0);
    const avgRating = completed.length
      ? (completed.reduce((sum, b) => sum + (b.rating || 0), 0) / completed.filter(b => b.rating > 0).length || 0).toFixed(1)
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

    res.json({
      totalBooksRead,
      totalPagesRead,
      avgRating: Number(avgRating) || 0,
      avgReadTime: `${Math.round(totalPagesRead / Math.max(totalBooksRead, 1) * 0.02)}h`,
      monthlyData,
      genreBreakdown: Object.entries(genreCounts).map(([genre, count]) => ({ genre, count })),
      currentlyReading: reading,
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

// POST /api/books - Add a book
router.post('/', auth, async (req, res) => {
  try {
    const book = await Book.create({ ...req.body, user: req.user._id });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/books/:id - Update a book
router.put('/:id', auth, async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, user: req.user._id });
    if (!book) return res.status(404).json({ message: 'Book not found' });

    Object.assign(book, req.body);
    if (req.body.status === 'completed' && !book.dateCompleted) {
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

// GET /api/books/search - Search Google Books API
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
    res.status(500).json({ message: 'Failed to search books' });
  }
});

module.exports = router;
