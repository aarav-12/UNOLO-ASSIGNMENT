# Unolo Full Stack Intern Assignment

## Field Force Tracker - Debug & Build Challenge

**Duration:** 4-6 hours (recommended)

---

## Overview

You are given a partially built "Field Force Tracker" application - a simplified version of what Unolo builds for real clients. The application allows field employees to check-in at client locations, and managers to track their team's activities.

**The codebase has intentional bugs and missing features. Your job is to:**

1. Fix all bugs (backend + frontend)
2. Implement new features
3. Document your work

---

## What's Provided

Download and extract the `starter-code.zip` from the shared Drive link. You'll find:

```
starter-code/
├── frontend/          # React application (Vite)
├── backend/           # Node.js + Express API
└── database/          # SQLite schema + seed data
```

### Tech Stack
- **Frontend:** React 18, Vite, Axios, React Router, Tailwind CSS
- **Backend:** Node.js, Express.js, SQLite
- **Authentication:** JWT

---

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm run setup    # This installs dependencies AND initializes the database
cp .env.example .env
npm run dev
```
Backend runs on: `http://localhost:3001`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

**Note:** This project uses SQLite - no external database installation required!

### Test Credentials
- **Manager:** manager@unolo.com / password123
- **Employee:** rahul@unolo.com / password123
- **Employee:** priya@unolo.com / password123

---

## Part 1: Bug Fixes

The application has several bugs across frontend and backend. Find and fix as many as you can.

### Symptoms You'll Notice:
1. Login sometimes fails even with correct credentials
2. Check-in form doesn't submit properly
3. Dashboard shows incorrect data for some users
4. Attendance history page crashes on load
5. API returns wrong status codes in certain scenarios
6. Location data is not being saved correctly
7. Some React components have performance issues and don't update correctly

### Deliverable:
Create a file `BUG_FIXES.md` documenting:
- Where each bug was located (file + line number)
- What was wrong
- How you fixed it
- Why your fix is correct

---

## Part 2: Feature Implementation

### Feature A: Real-time Distance Calculation

When an employee checks in, calculate and display the distance between their current location and the assigned client location.

**Requirements:**
- Calculate the distance between two geographic coordinates (employee's current location and client's location)
- Show distance in kilometers (rounded to 2 decimal places)
- If distance > 500 meters, show a warning: "You are far from the client location"
- Store the distance in the database with each check-in

**API Change:**
- `POST /api/checkin` should accept `latitude` and `longitude`
- Response should include `distance_from_client` field

**UI Change:**
- Show current distance on the check-in form
- Display distance in the attendance history table

---

### Feature B: Daily Summary Report API

Create a new API endpoint for managers to get a daily summary of their team's activity.

**Endpoint:** `GET /api/reports/daily-summary`

**Query Parameters:**
- `date` (required): YYYY-MM-DD format
- `employee_id` (optional): Filter by specific employee

**Requirements:**
- Design an appropriate response format that includes:
  - Per-employee breakdown (check-ins, working hours, clients visited)
  - Team-level aggregate statistics
- Only accessible by users with role "manager"
- Handle edge cases: no data for date, invalid date format, unauthorized access
- Write efficient SQL (avoid N+1 queries)

---

## Part 3: Code Quality & Documentation

### 3.1 Code Quality
- Clean, readable code
- Proper error handling
- No console.logs in final submission
- Consistent naming conventions
- Comments where logic is complex

### 3.2 README Update
Update the README.md with:
- Any setup changes needed for your features
- API documentation for new endpoints
- Brief architecture decisions you made

### 3.3 Questions File
Create `QUESTIONS.md` answering:

**Technical Questions:**

1. **If this app had 10,000 employees checking in simultaneously, what would break first? How would you fix it?**

2. **The current JWT implementation has a security issue. What is it and how would you improve it?**

3. **How would you implement offline check-in support? (Employee has no internet, checks in, syncs later)**

**Theory/Research Questions:**

4. **Explain the difference between SQL and NoSQL databases. For this Field Force Tracker application, which would you recommend and why? Consider factors like data structure, scaling, and query patterns.**

5. **What is the difference between authentication and authorization? Identify where each is implemented in this codebase.**

6. **Explain what a race condition is. Can you identify any potential race conditions in this codebase? How would you prevent them?**

---

## Submission Instructions

1. **Create a GitHub Repository:**
   - Create a new **public** repository on GitHub
   - Push the starter code along with your changes
   - Make meaningful commits (not just one big commit)
   - Your commit history is part of the evaluation

2. **Required Files:**
   ```
   your-repo/
   ├── frontend/
   ├── backend/
   ├── database/
   ├── BUG_FIXES.md      # Part 1 documentation
   ├── QUESTIONS.md      # Part 3.3 answers
   ├── RESEARCH.md       # Research assignment (see RESEARCH_ASSIGNMENT.md)
   └── README.md         # Updated documentation
   ```

3. **Submit:**
   - Make sure your repository is **public**
   - Email the repository link to hr@unolo.com
   - Subject: "Full Stack Intern Assignment - [Your Name]"
   - Include a brief cover note (2-3 sentences about your approach)

---

## Evaluation Criteria

You will be evaluated on:

| Criteria | What We Look For |
|----------|------------------|
| Bug Fixes | All 6 bugs found and correctly fixed with clear explanations |
| Feature A | Working distance calculation with proper UI integration |
| Feature B | Well-designed API with edge cases handled |
| Code Quality | Clean, maintainable, production-ready code |
| Documentation | Clear explanations, good README, thoughtful answers |

### Bonus (Optional):
- Add unit tests for the new API endpoint
- Implement input validation with meaningful error messages
- Add a simple visualization (chart/graph) on manager dashboard

---

## Important Notes

1. **AI Usage Policy:**  
   You may use AI tools for reference, but you must understand and be able to explain every line of code you submit. We will ask detailed questions about your implementation in the next round.

2. **Time Tracking:**  
   Note your start and end time. We value efficiency, not just completion.

3. **Stuck?**  
   If you're stuck on setup, email us. We want to evaluate your coding skills, not your ability to debug environment issues.

4. **Partial Submissions:**  
   A well-documented partial submission is better than a complete but messy one.

---

## Questions?

Contact: hr@unolo.com

Good luck! We're excited to see your work. 🚀
