# Unolo Field Force Tracker

A web application for tracking field employee check-ins at client locations with real-time distance calculation and comprehensive reporting.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express.js, SQLite (better-sqlite3)
- **Authentication:** JWT

## Features

- ✅ Employee check-in/check-out at client locations
- ✅ **Real-time distance calculation** from client location using Haversine formula
- ✅ **Distance warnings** when checking in > 500m from client
- ✅ Manager dashboard with team statistics
- ✅ **Daily summary reports** for managers
- ✅ Check-in history with filtering
- ✅ Role-based access control (Employee/Manager)
- ✅ **Unit tests** for API endpoints (Jest + Supertest)
- ✅ **Activity visualization** (Bar chart on manager dashboard)

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm run setup    # Installs dependencies and initializes database
cp .env.example .env
npm run dev
```

Backend runs on: `http://localhost:3001`

### Run Tests

```bash
cd backend
npm test           # Run tests with coverage
npm run test:watch # Run tests in watch mode
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Test Credentials

| Role     | Email              | Password    |
|----------|-------------------|-------------|
| Manager  | manager@unolo.com | password123 |
| Employee | rahul@unolo.com   | password123 |
| Employee | priya@unolo.com   | password123 |

## Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API routes (auth, checkin, dashboard, reports)
│   ├── scripts/         # Database init scripts
│   ├── tests/           # Unit tests (Jest + Supertest)
│   └── server.js        # Express app entry
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components (ActivityChart, etc.)
│   │   ├── pages/       # Page components
│   │   └── utils/       # API helpers
│   └── index.html
├── database/            # SQL schemas (reference only)
├── BUG_FIXES.md         # Documentation of bugs fixed
├── QUESTIONS.md         # Technical questions answered
└── RESEARCH.md          # Real-time location tracking research
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `GET /api/auth/me` - Get current user profile

### Check-ins
- `GET /api/checkin/clients` - Get assigned clients for employee
- `POST /api/checkin` - Create check-in with location and distance calculation
  ```json
  {
    "client_id": 1,
    "latitude": 28.4595,
    "longitude": 77.0266,
    "notes": "Client meeting"
  }
  ```
  Response includes `distance_from_client` in kilometers.

- `PUT /api/checkin/checkout` - Checkout from current location
- `GET /api/checkin/history` - Get check-in history with optional date filters
  - Query params: `start_date`, `end_date` (YYYY-MM-DD format)
- `GET /api/checkin/active` - Get current active check-in

### Dashboard
- `GET /api/dashboard/stats` - Manager stats (team size, today's check-ins, active check-ins)
- `GET /api/dashboard/employee` - Employee stats (today's check-ins, assigned clients, week stats)

### Reports (Manager Only)
- `GET /api/reports/daily-summary` - Get daily summary of team activity
  - **Required:** `date` (YYYY-MM-DD format)
  - **Optional:** `employee_id` (filter by specific employee)
  - Returns team summary and per-employee breakdown with check-ins, hours worked, and clients visited

  Example:
  ```bash
  GET /api/reports/daily-summary?date=2024-01-26&employee_id=2
  ```

## New Features Implemented

### 1. Distance Calculation
- Automatically calculates distance between employee's current location and client location
- Uses Haversine formula for accurate geographic distance
- Displays distance in kilometers (rounded to 2 decimal places)
- Shows warning if distance > 500 meters
- Distance stored in database and visible in history

### 2. Daily Summary Report API
- Manager-only endpoint for team activity reports
- Provides team-level aggregates (total check-ins, active employees, hours worked)
- Per-employee breakdown with detailed statistics
- Efficient SQL queries to avoid N+1 problems
- Input validation and error handling

## Architecture Decisions

### Database
- **SQLite with better-sqlite3**: Chosen for simplicity and zero-configuration setup
- **Compatibility layer**: Custom `execute()` function mimics mysql2 API for easy migration
- **Schema**: Normalized design with proper foreign keys and indexes

### Distance Calculation
- **Haversine formula**: Industry-standard formula for calculating great-circle distance
- **Client-side preview**: Shows distance before check-in for better UX
- **Server-side validation**: Recalculates on backend to prevent tampering

### Security
- **JWT tokens**: Stateless authentication with 24-hour expiry
- **Password hashing**: bcrypt with salt rounds
- **Role-based access**: Middleware for manager-only endpoints
- **SQL injection prevention**: Parameterized queries throughout

## Notes

- The database uses SQLite - no external database setup required
- Run `npm run init-db` to reset the database to initial state
- Location permissions required for distance calculation feature
- All distances calculated using Earth's radius of 6,371 km

