require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Book = require('./models/Book');

const DEMO_USER = {
  name: 'Adel Alawad',
  email: 'adel@shelflife.com',
  password: 'password123',
};

const BOOKS = [
  // === COMPLETED (with ratings & reviews) ===
  {
    title: 'The Shadow of the Wind',
    authors: ['Carlos Ruiz Zafón'],
    description: 'A young boy discovers a mysterious book that leads him into a labyrinth of intrigue in post-war Barcelona.',
    thumbnail: 'https://books.google.com/books/content?id=lwB-BAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 487,
    categories: ['Fiction', 'Mystery'],
    isbn: '978-0143034902',
    publishedDate: '2004',
    publisher: 'Penguin Books',
    status: 'completed',
    pagesRead: 487,
    rating: 5,
    review: 'A breathtaking masterpiece that weaves mystery, romance, and history into one of the most captivating stories I have ever read. Zafón writes Barcelona like a living character — every alley, every shadow feels alive. The Cemetery of Forgotten Books is a concept that haunts me still.',
    format: 'Hardcover',
    dateCompleted: new Date('2026-01-15'),
    dateAdded: new Date('2025-12-01'),
  },
  {
    title: 'Deep Work',
    authors: ['Cal Newport'],
    description: 'Rules for focused success in a distracted world.',
    thumbnail: 'https://books.google.com/books/content?id=4QTzCAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 296,
    categories: ['Self-Help', 'Productivity'],
    isbn: '978-1455586691',
    publishedDate: '2016',
    publisher: 'Grand Central Publishing',
    status: 'completed',
    pagesRead: 296,
    rating: 4,
    review: 'A compelling argument for focused, undistracted work. Newport makes a strong case that deep work is becoming increasingly rare and increasingly valuable. The strategies are practical and I have already started implementing the "shutdown complete" ritual.',
    format: 'Paperback',
    dateCompleted: new Date('2026-02-08'),
    dateAdded: new Date('2026-01-20'),
  },
  {
    title: 'Thinking, Fast and Slow',
    authors: ['Daniel Kahneman'],
    description: 'A groundbreaking exploration of the two systems that drive the way we think.',
    thumbnail: 'https://books.google.com/books/content?id=ZuKTvERuPG8C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 499,
    categories: ['Psychology', 'Non-Fiction'],
    isbn: '978-0374533557',
    publishedDate: '2011',
    publisher: 'Farrar, Straus and Giroux',
    status: 'completed',
    pagesRead: 499,
    rating: 5,
    review: 'This book fundamentally changed how I understand decision-making. System 1 and System 2 thinking is a framework I now apply daily. Dense but rewarding — every chapter offers a new insight into human cognition and bias.',
    format: 'Hardcover',
    dateCompleted: new Date('2025-11-20'),
    dateAdded: new Date('2025-10-01'),
  },
  {
    title: 'Dune',
    authors: ['Frank Herbert'],
    description: 'A stunning blend of adventure and mysticism, environmentalism and politics.',
    thumbnail: 'https://books.google.com/books/content?id=B1hSG45JCX4C&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 688,
    categories: ['Science Fiction', 'Fiction'],
    isbn: '978-0441172719',
    publishedDate: '1965',
    publisher: 'Ace Books',
    status: 'completed',
    pagesRead: 688,
    rating: 5,
    review: 'Herbert built an entire universe that feels as real as our own. The political intrigue, ecological themes, and philosophical underpinnings make this far more than a sci-fi novel. Paul Atreides\' journey is epic in the truest sense of the word.',
    format: 'Paperback',
    dateCompleted: new Date('2025-12-28'),
    dateAdded: new Date('2025-11-15'),
  },
  {
    title: 'Atomic Habits',
    authors: ['James Clear'],
    description: 'An easy and proven way to build good habits and break bad ones.',
    thumbnail: 'https://books.google.com/books/content?id=XfFvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 320,
    categories: ['Self-Help', 'Productivity'],
    isbn: '978-0735211292',
    publishedDate: '2018',
    publisher: 'Avery',
    status: 'completed',
    pagesRead: 320,
    rating: 4,
    review: 'Clear and actionable. The 1% improvement framework is simple but powerful. I especially liked the identity-based habits concept — you don\'t rise to the level of your goals, you fall to the level of your systems.',
    format: 'Hardcover',
    dateCompleted: new Date('2026-03-10'),
    dateAdded: new Date('2026-02-15'),
  },
  {
    title: 'The Picture of Dorian Gray',
    authors: ['Oscar Wilde'],
    description: 'A philosophical novel about aestheticism, corruption, and self-destruction.',
    thumbnail: 'https://books.google.com/books/content?id=a3bZDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 272,
    categories: ['Fiction', 'Classics'],
    isbn: '978-0141439570',
    publishedDate: '1890',
    publisher: 'Penguin Classics',
    status: 'completed',
    pagesRead: 272,
    rating: 4,
    review: 'Wilde\'s wit is razor-sharp and every page drips with quotable lines. The moral decay of Dorian is horrifying and fascinating in equal measure. Lord Henry is one of literature\'s most dangerously charismatic characters.',
    format: 'Paperback',
    dateCompleted: new Date('2026-02-25'),
    dateAdded: new Date('2026-02-01'),
  },

  // === CURRENTLY READING ===
  {
    title: 'The Great Gatsby',
    authors: ['F. Scott Fitzgerald'],
    description: 'A portrait of the Jazz Age in all of its decadence and excess.',
    thumbnail: 'https://books.google.com/books/content?id=iWA-DwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 218,
    categories: ['Fiction', 'Classics'],
    isbn: '978-0743273565',
    publishedDate: '1925',
    publisher: 'Scribner',
    status: 'reading',
    pagesRead: 142,
    rating: 4,
    review: '',
    format: 'Hardcover',
    dateAdded: new Date('2026-03-20'),
  },
  {
    title: 'Meditations',
    authors: ['Marcus Aurelius'],
    description: 'Personal writings of the Roman Emperor on Stoic philosophy.',
    thumbnail: 'https://books.google.com/books/content?id=nNCFDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 256,
    categories: ['Philosophy', 'Non-Fiction'],
    isbn: '978-0140449334',
    publishedDate: '180',
    publisher: 'Penguin Classics',
    status: 'reading',
    pagesRead: 89,
    rating: 0,
    review: '',
    format: 'Paperback',
    dateAdded: new Date('2026-04-01'),
  },
  {
    title: 'Design Principles',
    authors: ['William Lidwell', 'Kritina Holden', 'Jill Butler'],
    description: 'Universal principles of design, revised and updated.',
    thumbnail: 'https://books.google.com/books/content?id=TZoDBQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 272,
    categories: ['Design', 'Non-Fiction'],
    isbn: '978-1592535873',
    publishedDate: '2010',
    publisher: 'Rockport Publishers',
    status: 'reading',
    pagesRead: 55,
    rating: 0,
    review: '',
    format: 'Hardcover',
    dateAdded: new Date('2026-04-05'),
  },

  // === WANT TO READ ===
  {
    title: 'The Alchemist',
    authors: ['Paulo Coelho'],
    description: 'A fable about following your dream.',
    thumbnail: 'https://books.google.com/books/content?id=FzVjBgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 197,
    categories: ['Fiction', 'Philosophy'],
    isbn: '978-0062315007',
    publishedDate: '1988',
    publisher: 'HarperOne',
    status: 'want-to-read',
    pagesRead: 0,
    rating: 0,
    review: '',
    format: 'Paperback',
    dateAdded: new Date('2026-03-15'),
  },
  {
    title: 'Sapiens',
    authors: ['Yuval Noah Harari'],
    description: 'A brief history of humankind.',
    thumbnail: 'https://books.google.com/books/content?id=FmyBAwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 464,
    categories: ['History', 'Non-Fiction'],
    isbn: '978-0062316097',
    publishedDate: '2015',
    publisher: 'Harper',
    status: 'want-to-read',
    pagesRead: 0,
    rating: 0,
    review: '',
    format: 'Hardcover',
    dateAdded: new Date('2026-04-02'),
  },
  {
    title: 'Metamorphosis',
    authors: ['Franz Kafka'],
    description: 'A man wakes to find himself transformed into a giant insect.',
    thumbnail: 'https://books.google.com/books/content?id=dOZvDwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 201,
    categories: ['Fiction', 'Classics'],
    isbn: '978-0486290300',
    publishedDate: '1915',
    publisher: 'Dover Publications',
    status: 'want-to-read',
    pagesRead: 0,
    rating: 0,
    review: '',
    format: 'Paperback',
    dateAdded: new Date('2026-03-28'),
  },
  {
    title: '1984',
    authors: ['George Orwell'],
    description: 'A dystopian novel about totalitarianism and surveillance.',
    thumbnail: 'https://books.google.com/books/content?id=kotPYEqx7kMC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 328,
    categories: ['Fiction', 'Dystopian'],
    isbn: '978-0451524935',
    publishedDate: '1949',
    publisher: 'Signet Classic',
    status: 'want-to-read',
    pagesRead: 0,
    rating: 0,
    review: '',
    format: 'Paperback',
    dateAdded: new Date('2026-04-08'),
  },
  {
    title: 'The Lean Startup',
    authors: ['Eric Ries'],
    description: 'How today\'s entrepreneurs use continuous innovation to create successful businesses.',
    thumbnail: 'https://books.google.com/books/content?id=tvfyz-4JILwC&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    pageCount: 336,
    categories: ['Business', 'Non-Fiction'],
    isbn: '978-0307887894',
    publishedDate: '2011',
    publisher: 'Currency',
    status: 'want-to-read',
    pagesRead: 0,
    rating: 0,
    review: '',
    format: 'Hardcover',
    dateAdded: new Date('2026-04-10'),
  },
];

async function seed() {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Book.deleteMany({});

  console.log('Cleared existing data.');

  // Create demo user
  const user = await User.create(DEMO_USER);
  console.log(`Created user: ${user.name} (${user.email})`);

  // Create books
  const books = await Book.insertMany(
    BOOKS.map(b => ({ ...b, user: user._id }))
  );
  console.log(`Seeded ${books.length} books:`);

  const reading = books.filter(b => b.status === 'reading');
  const wantToRead = books.filter(b => b.status === 'want-to-read');
  const completed = books.filter(b => b.status === 'completed');

  console.log(`  - ${completed.length} completed`);
  console.log(`  - ${reading.length} currently reading`);
  console.log(`  - ${wantToRead.length} want to read`);
  console.log('');
  console.log('=================================');
  console.log('  Demo account ready!');
  console.log(`  Email:    ${DEMO_USER.email}`);
  console.log(`  Password: ${DEMO_USER.password}`);
  console.log('=================================');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
