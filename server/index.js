require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auto-seed demo data when using in-memory DB
async function seedDemoData() {
  const User = require('./models/User');
  const Book = require('./models/Book');

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) return;

  console.log('Seeding demo data...');

  const user = await User.create({
    name: 'Adel Alawad',
    email: 'adel@shelflife.com',
    password: 'password123',
  });

  const books = [
    { title: 'The Shadow of the Wind', authors: ['Carlos Ruiz Zafón'], thumbnail: 'https://books.google.com/books/content?id=lwB-BAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 487, categories: ['Fiction', 'Mystery'], isbn: '978-0143034902', status: 'completed', pagesRead: 487, rating: 5, review: 'A breathtaking masterpiece that weaves mystery, romance, and history into one of the most captivating stories I have ever read. Zafón writes Barcelona like a living character.', format: 'Hardcover', dateCompleted: new Date('2026-01-15'), dateAdded: new Date('2025-12-01') },
    { title: 'Deep Work', authors: ['Cal Newport'], thumbnail: 'https://books.google.com/books/content?id=4QTzCAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 296, categories: ['Self-Help', 'Productivity'], isbn: '978-1455586691', status: 'completed', pagesRead: 296, rating: 4, review: 'A compelling argument for focused, undistracted work. The strategies are practical and I have already started implementing the shutdown ritual.', format: 'Paperback', dateCompleted: new Date('2026-02-08'), dateAdded: new Date('2026-01-20') },
    { title: 'Thinking, Fast and Slow', authors: ['Daniel Kahneman'], thumbnail: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 499, categories: ['Psychology', 'Non-Fiction'], isbn: '978-0374533557', status: 'completed', pagesRead: 499, rating: 5, review: 'This book fundamentally changed how I understand decision-making. System 1 and System 2 thinking is a framework I now apply daily.', format: 'Hardcover', dateCompleted: new Date('2025-11-20'), dateAdded: new Date('2025-10-01') },
    { title: 'Dune', authors: ['Frank Herbert'], thumbnail: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 688, categories: ['Science Fiction', 'Fiction'], isbn: '978-0441172719', status: 'completed', pagesRead: 688, rating: 5, review: 'Herbert built an entire universe that feels as real as our own. The political intrigue, ecological themes, and philosophical depth make this far more than a sci-fi novel.', format: 'Paperback', dateCompleted: new Date('2025-12-28'), dateAdded: new Date('2025-11-15') },
    { title: 'Atomic Habits', authors: ['James Clear'], thumbnail: 'https://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 320, categories: ['Self-Help', 'Productivity'], isbn: '978-0735211292', status: 'completed', pagesRead: 320, rating: 4, review: 'Clear and actionable. The 1% improvement framework is simple but powerful. You don\'t rise to the level of your goals, you fall to the level of your systems.', format: 'Hardcover', dateCompleted: new Date('2026-03-10'), dateAdded: new Date('2026-02-15') },
    { title: 'The Picture of Dorian Gray', authors: ['Oscar Wilde'], thumbnail: 'https://books.google.com/books/content?id=a3bZDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 272, categories: ['Fiction', 'Classics'], isbn: '978-0141439570', status: 'completed', pagesRead: 272, rating: 4, review: 'Wilde\'s wit is razor-sharp and every page drips with quotable lines. Lord Henry is one of literature\'s most dangerously charismatic characters.', format: 'Paperback', dateCompleted: new Date('2026-02-25'), dateAdded: new Date('2026-02-01') },
    { title: 'The Great Gatsby', authors: ['F. Scott Fitzgerald'], thumbnail: 'https://books.google.com/books/content?id=iWA-DwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 218, categories: ['Fiction', 'Classics'], isbn: '978-0743273565', status: 'reading', pagesRead: 142, rating: 4, format: 'Hardcover', dateAdded: new Date('2026-03-20') },
    { title: 'Meditations', authors: ['Marcus Aurelius'], thumbnail: 'https://books.google.com/books/content?id=nNCFDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 256, categories: ['Philosophy', 'Non-Fiction'], isbn: '978-0140449334', status: 'reading', pagesRead: 89, format: 'Paperback', dateAdded: new Date('2026-04-01') },
    { title: 'Design Principles', authors: ['William Lidwell', 'Kritina Holden'], thumbnail: 'https://books.google.com/books/content?id=TZoDBQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 272, categories: ['Design', 'Non-Fiction'], isbn: '978-1592535873', status: 'reading', pagesRead: 55, format: 'Hardcover', dateAdded: new Date('2026-04-05') },
    { title: 'The Alchemist', authors: ['Paulo Coelho'], thumbnail: 'https://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 197, categories: ['Fiction', 'Philosophy'], isbn: '978-0062315007', status: 'want-to-read', format: 'Paperback', dateAdded: new Date('2026-03-15') },
    { title: 'Sapiens', authors: ['Yuval Noah Harari'], thumbnail: 'https://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 464, categories: ['History', 'Non-Fiction'], isbn: '978-0062316097', status: 'want-to-read', format: 'Hardcover', dateAdded: new Date('2026-04-02') },
    { title: 'Metamorphosis', authors: ['Franz Kafka'], thumbnail: 'https://books.google.com/books/content?id=dOZvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 201, categories: ['Fiction', 'Classics'], isbn: '978-0486290300', status: 'want-to-read', format: 'Paperback', dateAdded: new Date('2026-03-28') },
    { title: '1984', authors: ['George Orwell'], thumbnail: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 328, categories: ['Fiction', 'Dystopian'], isbn: '978-0451524935', status: 'want-to-read', format: 'Paperback', dateAdded: new Date('2026-04-08') },
    { title: 'The Lean Startup', authors: ['Eric Ries'], thumbnail: 'https://books.google.com/books/content?id=tvfyz-4JILwC&printsec=frontcover&img=1&zoom=1&source=gbs_api', pageCount: 336, categories: ['Business', 'Non-Fiction'], isbn: '978-0307887894', status: 'want-to-read', format: 'Hardcover', dateAdded: new Date('2026-04-10') },
  ];

  await Book.insertMany(books.map(b => ({ ...b, user: user._id })));

  console.log(`Seeded ${books.length} books for ${user.name}`);
  console.log('');
  console.log('  ================================');
  console.log('  Demo login:');
  console.log('  Email:    adel@shelflife.com');
  console.log('  Password: password123');
  console.log('  ================================');
}

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  seedDemoData().catch(console.error);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
