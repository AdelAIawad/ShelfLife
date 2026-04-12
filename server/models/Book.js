const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  googleBooksId: { type: String },
  title: { type: String, required: true },
  authors: [{ type: String }],
  description: { type: String },
  thumbnail: { type: String },
  pageCount: { type: Number, default: 0 },
  categories: [{ type: String }],
  isbn: { type: String },
  publishedDate: { type: String },
  publisher: { type: String },
  status: {
    type: String,
    enum: ['reading', 'want-to-read', 'completed'],
    default: 'want-to-read',
  },
  pagesRead: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  review: { type: String, default: '' },
  dateAdded: { type: Date, default: Date.now },
  dateCompleted: { type: Date },
  format: { type: String, default: '' },
}, { timestamps: true });

bookSchema.index({ user: 1, status: 1 });

module.exports = mongoose.model('Book', bookSchema);
