# ShelfLife — The Digital Archivist

A full-stack personal reading companion. Track what you're reading, remember why you liked each book, see your reading patterns, and discover your next read — all wrapped in a glassmorphism UI inspired by Apple Music and Spotify.

![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%2B%20Node.js%20%2B%20MongoDB-4A7CB5)

---

## Quick Start (Local Development)

Works immediately, no external services needed:

```bash
git clone https://github.com/AdelAIawad/ShelfLife.git
cd ShelfLife
npm run install-all
npm run dev
```

Open **http://localhost:3000** and log in with any demo account:

| Name | Email | Password |
|------|-------|----------|
| Adel Alawad | `adel@shelflife.com` | `password123` |
| Shirley | `shirley@shelflife.com` | `password123` |
| Carolyn | `carolyn@shelflife.com` | `password123` |
| Xiaolei | `xiaolei@shelflife.com` | `password123` |

The app auto-starts an in-memory MongoDB and seeds 14 demo books on Adel's shelf.

---

## Features

### Reading Experience
- **Home** — Continue reading hero (large tilted book cover, progress, reading-time estimate), multi-book recommendation carousel, rotating genres
- **My Shelf** — Three organized sections (Currently Reading, Want to Read, Completed) with sort options (title, author, rating, pages, date)
- **Insights (Dashboard)** — Stat cards, activity timeline, genre breakdown, achievements, reading streak, "Your Year in Books" summary
- **Explore** — Live search powered by Google Books API with debounced queries, 8 genre filters, and popular books fallback
- **Rate & Review** — 5-star rating, reading progress slider, written reviews, completion confetti animation

### Achievement System
10+ unlockable badges based on real activity:
- **First Chapter** (1 book), **Bookworm** (5), **Scholar** (10), **Librarian** (25)
- **Page Turner** (1,000 pages), **Marathon Reader** (5,000 pages)
- **Critic** (5+ ratings), **Genre Explorer** (5+ genres)
- **Connoisseur** (3+ five-star ratings), **Thoughtful Reviewer** (3+ written reviews)

Locked badges show progress bars toward the next milestone.

### Design System
- **Glassmorphism** — frosted glass cards with 20–40px backdrop blur, subtle borders, ambient mesh gradient background
- **Blue & copper palette** — deep navy (`#1E3A5F`), sapphire (`#4A7CB5`), warm copper (`#C4854C`) on midnight canvas (`#0F1624`)
- **Typography** — Source Serif 4 (headings), Inter (UI), JetBrains Mono (numbers)
- **Motion** — spring easing, staggered card entrances, animated progress rings, smooth horizontal scroll rows

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router v6, Chart.js, react-icons (Feather), Axios |
| Backend | Node.js, Express.js, Mongoose, JWT (jsonwebtoken), bcryptjs |
| Database | MongoDB (with `mongodb-memory-server` auto-fallback for dev) |
| External API | Google Books API (optional key for higher rate limits) |
| Styling | Custom CSS with design system (no framework) |

---

## Project Structure

```
ShelfLife/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # Top nav, footer, dropdowns, modals, SVG logo
│   │   │   └── HeroHeader.jsx       # Reusable per-page hero
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page: Continue Reading + recommendations
│   │   │   ├── Dashboard.jsx        # Insights, charts, achievements
│   │   │   ├── MyShelf.jsx          # Library manager (3 sections + sort)
│   │   │   ├── SearchBooks.jsx      # Google Books search / Explore
│   │   │   ├── RateReview.jsx       # Book detail: rate, review, progress
│   │   │   └── Login.jsx            # Split-screen login / register
│   │   ├── App.jsx                  # Routes + auth guard
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Design system (~1100 lines)
│   ├── index.html
│   ├── vite.config.js               # Dev server proxy to backend
│   └── package.json
├── server/                          # Express backend
│   ├── config/db.js                 # MongoDB connection (auto in-memory fallback)
│   ├── middleware/auth.js           # JWT verification
│   ├── models/
│   │   ├── User.js
│   │   └── Book.js
│   ├── routes/
│   │   ├── auth.js                  # POST /register, POST /login, GET /me
│   │   └── books.js                 # CRUD + search + stats + achievements
│   ├── seed.js
│   └── index.js                     # Server entry + auto-seed + serves client in prod
├── .env.example
├── .gitignore
├── render.yaml                      # Render deployment config
├── package.json
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
| GET | `/api/books/stats` | Stats, monthly data, genre breakdown, achievements, streak |
| GET | `/api/books/search?q=term&category=fiction` | Search Google Books |
| GET | `/api/books/:id` | Get single book |
| POST | `/api/books` | Add book (409 if duplicate) |
| PUT | `/api/books/:id` | Update book (status, rating, review, progress) |
| DELETE | `/api/books/:id` | Remove book |

All book routes use a field whitelist — arbitrary body fields are ignored.

---

## Setup

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org/))
- **npm** v9+ (included with Node)
- **MongoDB** — optional (app auto-starts an in-memory MongoDB if no URI is set)

### Installation

```bash
git clone https://github.com/AdelAIawad/ShelfLife.git
cd ShelfLife
npm run install-all
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001

### Environment Variables

Copy `.env.example` to `.env` and customize:

```env
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/shelflife   # or leave default for in-memory
JWT_SECRET=change_me_to_a_random_string
PORT=5001
SERVER_PORT=5001
GOOGLE_BOOKS_API_KEY=                           # optional
```

---

## Deployment (Production)

The app is configured for **monolithic deployment** — the Express server serves the built React frontend from `/client/dist`. One deploy, one URL.

### One-click deploy to Render + MongoDB Atlas

**1. Set up MongoDB Atlas (free tier):**
- Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a free M0 cluster
- Create a database user and whitelist `0.0.0.0/0` in Network Access
- Copy the connection string (looks like `mongodb+srv://user:pass@cluster.mongodb.net/shelflife`)

**2. Deploy to Render:**
- Sign up at [render.com](https://render.com) with GitHub
- Click **New → Blueprint**
- Connect this repo — Render reads `render.yaml` automatically
- In the env var settings, paste your MongoDB Atlas URI as `MONGO_URI`
- Deploy. Your app will be live at `https://shelflife.onrender.com`

**3. (Optional) Get a Google Books API key:**
- [Google Cloud Console](https://console.cloud.google.com/) → Enable Books API → create API key
- Add as `GOOGLE_BOOKS_API_KEY` in Render env vars

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend concurrently (development) |
| `npm run server` | Backend only |
| `npm run client` | Frontend only |
| `npm run build` | Build frontend for production |
| `npm start` | Production start (serves built frontend from Express) |
| `npm run seed` | Manually seed demo data |
| `npm run install-all` | Install all dependencies |

---

## License

Copyright 2026 ShelfLife. All rights reserved.
