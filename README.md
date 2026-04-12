# ShelfLife - The Digital Archivist

A full-stack book tracking web application that enables users to manage their personal reading journey — track books, write reviews, rate reads, and visualize reading statistics with interactive charts.

## Live Demo

**Quick Start** — works immediately, no external database needed:
```bash
git clone <repo-url> && cd ShelfLife
npm run install-all
npm run dev
```
Open **http://localhost:3000** and log in with:
- Email: `adel@shelflife.com`
- Password: `password123`

The app auto-starts an in-memory MongoDB and seeds 14 demo books with ratings, reviews, and reading progress.

---

## Features

### Core Functionality
- **User Authentication** — JWT-based registration & login with secure password hashing (bcrypt)
- **Book Search** — Live search powered by Google Books API with debounced queries and genre filtering
- **My Shelf** — Organize books into three categories: Currently Reading, Want to Read, Completed
- **Rate & Review** — 5-star ratings with labels, reading progress slider, written reviews, mark-as-finished with confetti animation
- **Reading Dashboard** — Interactive stat cards, activity timeline (bar chart), genre breakdown (doughnut chart), currently reading list, curated recommendations
- **Notifications** — Activity feed with reading streaks, monthly goals, and milestone alerts
- **Profile Management** — Account info, settings, help & support via dropdown menus and modals

### UX/UI Design
- **Warm cream & deep color palette** — Burgundy, navy, plum, amber, emerald, sienna accent variety
- **Source Serif 4 + Inter** typography pairing for literary feel
- **JetBrains Mono** for stat numbers
- **Gold shimmer** animated stripe on navigation
- **Contextual hero headers** per page with decorative icons
- **Responsive** — works on desktop, tablet, and mobile
- **Micro-interactions** — hover lifts, smooth transitions, staggered animations, loading skeletons

### Information Architecture
- **Navigation flow**: Dashboard (overview) > My Shelf (manage) > Explore (discover)
- **"Add Book" placement**: Contextual — hero button on My Shelf, integrated on Explore page
- **No duplicate navigation** — single top nav replaces sidebar + top nav + FAB pattern
- **Footer**: Deep green gradient with gold shimmer, literary quote, functional links (all open modals)

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, Vite | SPA with hot module replacement |
| Routing | React Router v6 | Client-side routing with auth guards |
| Charts | Chart.js + react-chartjs-2 | Bar chart (activity), doughnut (genres) |
| Icons | react-icons (Feather) | Consistent stroke-style iconography |
| Backend | Node.js, Express.js | RESTful API server |
| Database | MongoDB + Mongoose | Document store (with in-memory fallback) |
| Auth | JWT + bcryptjs | Stateless authentication |
| External API | Google Books API | Book search, metadata, cover images |
| Styling | Custom CSS (no framework) | Design system with CSS variables |

---

## Project Structure

```
ShelfLife/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Top nav, footer, dropdowns, modals
│   │   │   └── HeroHeader.jsx       # Reusable per-page hero section
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth state (login, register, logout)
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Split-screen login/register + forgot password
│   │   │   ├── Dashboard.jsx        # Reading insights with charts & stats
│   │   │   ├── MyShelf.jsx          # Book collection manager (3 categories)
│   │   │   ├── SearchBooks.jsx      # Google Books search with genre filters
│   │   │   └── RateReview.jsx       # Book detail: rate, review, track progress
│   │   ├── App.jsx                  # Routes & auth guard
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Complete design system (~800 lines)
│   ├── index.html
│   ├── vite.config.js               # Dev server proxy to backend
│   └── package.json
├── server/                          # Express backend
│   ├── config/db.js                 # MongoDB connection (auto in-memory fallback)
│   ├── middleware/auth.js           # JWT verification middleware
│   ├── models/
│   │   ├── User.js                  # User schema (bcrypt password hashing)
│   │   └── Book.js                  # Book schema (status, rating, progress, review)
│   ├── routes/
│   │   ├── auth.js                  # POST /register, POST /login, GET /me
│   │   └── books.js                 # Full CRUD + search + stats + single book
│   ├── seed.js                      # Standalone seed script
│   └── index.js                     # Server entry + auto-seed on startup
├── .env                             # Environment configuration
├── .gitignore
├── package.json                     # Root scripts (dev, build, install-all)
└── README.md
```

---

## API Documentation

### Authentication
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{name, email, password}` | Create account, returns JWT |
| POST | `/api/auth/login` | `{email, password}` | Login, returns JWT |
| GET | `/api/auth/me` | — | Get current user (requires token) |

### Books (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | Get user's books (optional `?status=reading`) |
| GET | `/api/books/stats` | Reading statistics, monthly data, genre breakdown |
| GET | `/api/books/search?q=term&category=fiction` | Search Google Books API |
| GET | `/api/books/:id` | Get single book by ID |
| POST | `/api/books` | Add book to shelf |
| PUT | `/api/books/:id` | Update book (rating, review, status, pagesRead) |
| DELETE | `/api/books/:id` | Remove book from shelf |

---

## Setup Guide

### Prerequisites
- **Node.js** v18+ — [download](https://nodejs.org/)
- **npm** v9+ (included with Node.js)
- **MongoDB** — Optional. App auto-starts in-memory MongoDB if none is found.

### Installation
```bash
# 1. Clone the repository
git clone <repo-url>
cd ShelfLife

# 2. Install all dependencies (server + client)
npm run install-all

# 3. Start development servers
npm run dev
```

Both servers start concurrently:
- **Frontend**: http://localhost:3000 (Vite dev server)
- **Backend**: http://localhost:5000 (Express API)

### Environment Variables
The `.env` file includes working defaults. Customize as needed:
```env
MONGO_URI=mongodb://localhost:27017/shelflife    # Or MongoDB Atlas URI
JWT_SECRET=shelflife_jwt_secret_key_2026         # Change in production
PORT=5000                                        # Backend port
GOOGLE_BOOKS_API_KEY=                            # Optional (works without)
```

### Using MongoDB Atlas (Cloud — Persistent Storage)
1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Set `MONGO_URI` in `.env` to your Atlas URI
4. Restart the server — data persists across restarts

### Google Books API Key (Optional)
Works without a key (with rate limits). To get one:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Books API
3. Create an API key
4. Set `GOOGLE_BOOKS_API_KEY` in `.env`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend & backend concurrently |
| `npm run server` | Start backend only (port 5000) |
| `npm run client` | Start frontend only (port 3000) |
| `npm run build` | Build frontend for production |
| `npm run seed` | Seed demo data manually |
| `npm run install-all` | Install all dependencies |

---

## Demo Data

The app auto-seeds on startup (when using in-memory DB) with:

| Category | Count | Examples |
|----------|-------|---------|
| Completed | 6 | Dune, Deep Work, Thinking Fast & Slow, Atomic Habits, The Shadow of the Wind, The Picture of Dorian Gray |
| Currently Reading | 3 | The Great Gatsby (65%), Meditations (35%), Design Principles (20%) |
| Want to Read | 5 | The Alchemist, Sapiens, Metamorphosis, 1984, The Lean Startup |

All completed books include star ratings (4-5 stars) and written reviews.

---

## Design System

### Color Palette
| Role | Color | Hex |
|------|-------|-----|
| Page Background | Warm Cream | `#F5F0E8` |
| Card Surface | White | `#FFFFFF` |
| Brand Primary | Deep Forest | `#2D4A3E` |
| Stat 1 (Books) | Navy | `#2D4466` |
| Stat 2 (Pages) | Plum | `#6B4C6E` |
| Stat 3 (Rating) | Amber | `#B8963C` |
| Stat 4 (Time) | Burgundy | `#8B3A3A` |
| Emerald | Success/CTA | `#2E6B4F` |
| Sienna | Warm Accent | `#8B5E3C` |

### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Page Titles | Source Serif 4 | 28-30px | 700 |
| Section Heads | Source Serif 4 | 18-20px | 600 |
| Body | Inter | 14px | 400-500 |
| Stat Numbers | JetBrains Mono | 34px | 700 |
| Labels | Inter | 11px | 600 (uppercase) |

### Shadows (Green-tinted)
```css
--shadow-sm:   0 1px 3px rgba(27,77,62,0.06);
--shadow-card: 0 10px 24px rgba(27,77,62,0.08);
--shadow-lg:   0 16px 34px rgba(27,77,62,0.10);
```

---

## Professor Feedback — Addressed

| Feedback | Resolution |
|----------|-----------|
| "Add New Book" below viewport | Moved to hero section on My Shelf (always visible) |
| "Add New Book" not clickable on My Shelf | Now a prominent button in the hero header |
| Search between My Shelf and Dashboard | Navigation reordered: Dashboard > My Shelf > Explore |
| Database choice undecided | MongoDB selected (documented with Atlas deployment option) |
| No explanation of live search | Debounced client-side search (400ms) proxied through Express to Google Books API |
| Design and Prototype pages identical | Full functional prototype built with complete interactivity |

---

## Team

| Member | Role |
|--------|------|
| Adel | UX/UI Designer |
| Krystal | Front-End Developer |
| Carolyn | Back-End Developer |
| Shirley | Data/API Integration |

---

## License

Copyright 2026 ShelfLife. All rights reserved.
