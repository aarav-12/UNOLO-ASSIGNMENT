# Technical Questions - Answers

## 1. If this app had 10,000 employees checking in simultaneously, what would break first? How would you fix it?

### What Would Break First:

**The SQLite database would be the first bottleneck.** SQLite is a file-based database that uses file-level locking, which means it can only handle one write operation at a time. With 10,000 simultaneous check-ins (all write operations), we'd face:

1. **Write Lock Contention**: Requests would queue up waiting for the database lock
2. **Connection Pool Exhaustion**: The application would run out of available database connections
3. **Slow Response Times**: Users would experience timeouts and failures
4. **Potential Database Corruption**: Under extreme load, concurrent writes could corrupt the database file

### How to Fix It:

**Short-term fixes:**
1. **Switch to PostgreSQL or MySQL**: These support concurrent writes with row-level locking
2. **Add Connection Pooling**: Configure proper connection pool size (e.g., 20-50 connections)
3. **Implement Request Queuing**: Use a message queue (Redis/RabbitMQ) to buffer check-in requests
4. **Add Caching**: Use Redis to cache frequently accessed data (client locations, user info)

**Long-term architecture:**
```
Mobile Apps → Load Balancer → Multiple API Servers → Message Queue → Worker Processes → PostgreSQL
                                                    ↓
                                                  Redis Cache
```

5. **Horizontal Scaling**: Deploy multiple API servers behind a load balancer
6. **Database Replication**: Use read replicas for queries, master for writes
7. **Batch Processing**: Group check-ins and process them in batches
8. **Rate Limiting**: Implement per-user rate limits to prevent abuse

---

## 2. The current JWT implementation has a security issue. What is it and how would you improve it?

### Security Issues Identified:

1. **Weak JWT Secret**: Uses `process.env.JWT_SECRET || 'default-secret-key'`
   - The fallback to a default secret is extremely dangerous
   - If JWT_SECRET is not set, all tokens can be forged

2. **No Token Refresh Mechanism**: 24-hour expiry with no refresh
   - If a token is stolen, it's valid for 24 hours
   - Users must re-login every 24 hours (poor UX)

3. **No Token Revocation**: No way to invalidate tokens
   - Can't logout users remotely
   - Can't revoke access if account is compromised

4. **No HTTPS Enforcement**: Tokens sent over HTTP can be intercepted

### How to Improve:

**1. Secure Secret Management:**
```javascript
// Fail fast if JWT_SECRET is not set
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;
```

**2. Implement Refresh Tokens:**
```javascript
// Short-lived access token (15 minutes)
const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

// Long-lived refresh token (7 days)
const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

// Store refresh token in database with user_id
await pool.execute(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
    [user.id, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
);
```

**3. Token Blacklist for Revocation:**
```javascript
// On logout, add token to Redis blacklist
await redis.setex(`blacklist:${token}`, 900, 'true'); // 15 min TTL

// Check blacklist in auth middleware
const isBlacklisted = await redis.get(`blacklist:${token}`);
if (isBlacklisted) {
    return res.status(401).json({ message: 'Token revoked' });
}
```

**4. Additional Security Measures:**
- Use HTTPS only (enforce in production)
- Add `httpOnly` and `secure` flags if using cookies
- Include user agent and IP in token payload for additional validation
- Implement rate limiting on auth endpoints
- Add CSRF protection for web clients

---

## 3. How would you implement offline check-in support? (Employee has no internet, checks in, syncs later)

### Implementation Strategy:

**Frontend (Mobile/Web):**

1. **Local Storage Queue:**
```javascript
// Store check-in locally when offline
const offlineCheckin = {
    id: generateUUID(),
    client_id: selectedClient,
    latitude: location.latitude,
    longitude: location.longitude,
    notes: notes,
    timestamp: new Date().toISOString(),
    synced: false
};

// Save to IndexedDB or localStorage
await db.offlineCheckins.add(offlineCheckin);
```

2. **Network Status Detection:**
```javascript
// Listen for online/offline events
window.addEventListener('online', syncOfflineData);
window.addEventListener('offline', () => setOfflineMode(true));

// Check connectivity
const isOnline = navigator.onLine;
```

3. **Background Sync (Service Worker):**
```javascript
// Register background sync
if ('serviceWorker' in navigator && 'sync' in registration) {
    registration.sync.register('sync-checkins');
}

// Service worker sync event
self.addEventListener('sync', async (event) => {
    if (event.tag === 'sync-checkins') {
        event.waitUntil(syncPendingCheckins());
    }
});
```

**Backend Changes:**

1. **Idempotency:**
```javascript
// Accept client-generated UUID to prevent duplicates
router.post('/checkin', authenticateToken, async (req, res) => {
    const { client_generated_id, client_id, latitude, longitude, timestamp } = req.body;
    
    // Check if already synced
    const [existing] = await pool.execute(
        'SELECT id FROM checkins WHERE client_generated_id = ?',
        [client_generated_id]
    );
    
    if (existing.length > 0) {
        return res.json({ success: true, message: 'Already synced', id: existing[0].id });
    }
    
    // Insert with client timestamp
    // ... rest of check-in logic
});
```

2. **Conflict Resolution:**
```javascript
// Handle time conflicts (e.g., checking in while already checked in)
if (activeCheckins.length > 0) {
    // If offline check-in is older, allow it but mark as historical
    if (new Date(timestamp) < new Date(activeCheckins[0].checkin_time)) {
        // Insert as historical record
        status = 'checked_out'; // Auto-checkout old offline check-ins
    }
}
```

**Sync Flow:**

1. Employee checks in offline → Saved to local storage
2. App shows "Pending Sync" indicator
3. When online:
   - Background sync triggers automatically
   - Or manual sync button
4. Send all pending check-ins to server
5. Server validates and inserts with conflict resolution
6. Mark local records as synced
7. Show success notification

**Edge Cases to Handle:**
- Multiple offline check-ins at different clients
- Offline checkout (store locally, sync later)
- Clock drift (use server time for validation)
- Partial sync failures (retry failed items)
- Data consistency (what if client assignment changed while offline?)

---

## 4. Explain the difference between SQL and NoSQL databases. For this Field Force Tracker application, which would you recommend and why?

### SQL vs NoSQL Databases:

**SQL (Relational) Databases:**
- **Structure**: Fixed schema with tables, rows, and columns
- **Relationships**: Strong support for joins and foreign keys
- **ACID**: Guarantees Atomicity, Consistency, Isolation, Durability
- **Query Language**: Structured Query Language (SQL)
- **Scaling**: Vertical scaling (more powerful servers), limited horizontal scaling
- **Examples**: PostgreSQL, MySQL, SQLite
- **Best for**: Structured data, complex relationships, transactions

**NoSQL Databases:**
- **Structure**: Flexible schema (document, key-value, graph, column-family)
- **Relationships**: Weak or no built-in relationship support
- **BASE**: Basically Available, Soft state, Eventually consistent
- **Query Language**: Varies by type (MongoDB query language, Redis commands, etc.)
- **Scaling**: Horizontal scaling (add more servers)
- **Examples**: MongoDB, Redis, Cassandra, DynamoDB
- **Best for**: Unstructured data, high write throughput, rapid scaling

### Recommendation for Field Force Tracker: **SQL (PostgreSQL)**

**Reasons:**

1. **Strong Relationships**: The app has clear relationships:
   - Users → Managers (one-to-many)
   - Employees → Clients (many-to-many via employee_clients)
   - Employees → Check-ins (one-to-many)
   - Clients → Check-ins (one-to-many)
   
   SQL handles these relationships elegantly with foreign keys and joins.

2. **Data Integrity**: Check-ins involve financial/compliance data that requires:
   - ACID transactions (can't lose check-in records)
   - Referential integrity (can't check in to non-existent client)
   - Consistent state (checkout must follow check-in)

3. **Complex Queries**: Manager dashboard needs:
   - Aggregations (total hours, count of check-ins)
   - Joins across multiple tables
   - Date range filtering
   - GROUP BY operations
   
   SQL excels at these analytical queries.

4. **Structured Data**: All entities have well-defined, stable schemas:
   - Users have fixed fields (name, email, role)
   - Check-ins have predictable structure
   - Schema changes are infrequent

5. **Scale Considerations**: 
   - Even with 10,000 employees, a properly configured PostgreSQL can handle millions of check-ins
   - Read replicas can handle reporting queries
   - Partitioning by date can optimize large tables

**When NoSQL Might Be Better:**
- If storing unstructured notes/attachments (use S3 + metadata in SQL)
- If real-time location tracking (use Redis for current locations, SQL for history)
- If extreme write throughput (use Cassandra for time-series data)

**Hybrid Approach (Best of Both):**
```
PostgreSQL (primary): Users, clients, check-ins (transactional data)
Redis: Session management, caching, real-time location
S3: Photo attachments, documents
```

This gives us ACID guarantees where needed while leveraging NoSQL for specific use cases.

---

## 5. What is the difference between authentication and authorization? Identify where each is implemented in this codebase.

### Definitions:

**Authentication**: Verifying *who* you are (identity verification)
- "Are you really the person you claim to be?"
- Typically involves credentials (username/password, tokens, biometrics)

**Authorization**: Verifying *what* you can do (permission verification)
- "Are you allowed to perform this action?"
- Happens after authentication
- Based on roles, permissions, ownership

### Implementation in This Codebase:

**Authentication:**

1. **Login Endpoint** (`backend/routes/auth.js` lines 9-55):
```javascript
router.post('/login', async (req, res) => {
    // Verify identity using email and password
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    // Issue JWT token as proof of authentication
    const token = jwt.sign({ id, email, role, name }, JWT_SECRET, { expiresIn: '24h' });
});
```

2. **Token Verification Middleware** (`backend/middleware/auth.js` lines 5-20):
```javascript
const authenticateToken = (req, res, next) => {
    const token = authHeader && authHeader.split(' ')[1];
    
    // Verify the token is valid and not tampered with
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token' });
        req.user = user; // Attach authenticated user to request
        next();
    });
};
```

3. **Get Current User** (`backend/routes/auth.js` lines 58-84):
```javascript
router.get('/me', async (req, res) => {
    // Authenticate token and return user profile
    const decoded = jwt.verify(token, JWT_SECRET);
    const [users] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
});
```

**Authorization:**

1. **Manager-Only Middleware** (`backend/middleware/auth.js` lines 22-27):
```javascript
const requireManager = (req, res, next) => {
    // Check if authenticated user has manager role
    if (req.user.role !== 'manager') {
        return res.status(403).json({ message: 'Manager access required' });
    }
    next();
};
```

2. **Manager Dashboard** (`backend/routes/dashboard.js` line 8):
```javascript
router.get('/stats', authenticateToken, requireManager, async (req, res) => {
    // First authenticates (who are you?)
    // Then authorizes (are you a manager?)
});
```

3. **Client Assignment Check** (`backend/routes/checkin.js` lines 34-41):
```javascript
// Check if employee is assigned to this client
const [assignments] = await pool.execute(
    'SELECT * FROM employee_clients WHERE employee_id = ? AND client_id = ?',
    [req.user.id, client_id]
);

if (assignments.length === 0) {
    return res.status(403).json({ message: 'You are not assigned to this client' });
}
```
This is authorization - the user is authenticated, but we're checking if they have permission to check in at this specific client.

4. **Daily Summary Report** (`backend/routes/reports.js` line 9):
```javascript
router.get('/daily-summary', authenticateToken, requireManager, async (req, res) => {
    // Authentication: verify token
    // Authorization: verify manager role
});
```

**Summary Table:**

| Feature | Type | Location | What It Checks |
|---------|------|----------|----------------|
| Login | Authentication | `routes/auth.js:9` | Email + password match |
| JWT Verify | Authentication | `middleware/auth.js:5` | Token is valid |
| requireManager | Authorization | `middleware/auth.js:22` | User has manager role |
| Client Assignment | Authorization | `routes/checkin.js:34` | Employee assigned to client |
| Manager Dashboard | Both | `routes/dashboard.js:8` | Identity + role |

**Key Difference in Practice:**
- Authentication happens once (login) and is verified on each request (token)
- Authorization happens on every protected action (role check, permission check)
- You can be authenticated but not authorized (e.g., employee trying to access manager dashboard)

---

## 6. Explain what a race condition is. Can you identify any potential race conditions in this codebase? How would you prevent them?

### What is a Race Condition?

A **race condition** occurs when the behavior of a system depends on the timing or sequence of uncontrollable events. In software, it happens when multiple operations access shared resources concurrently, and the final outcome depends on which operation completes first.

**Simple Example:**
```javascript
// Two requests check balance simultaneously
Request A: balance = getBalance(); // $100
Request B: balance = getBalance(); // $100

Request A: withdraw($80); // balance = $20
Request B: withdraw($80); // balance = $20 (should be -$60!)
```

### Race Conditions in This Codebase:

**1. Concurrent Check-ins (CRITICAL)**

**Location:** `backend/routes/checkin.js` lines 44-54

```javascript
// Check for existing active check-in
const [activeCheckins] = await pool.execute(
    'SELECT * FROM checkins WHERE employee_id = ? AND status = "checked_in"',
    [req.user.id]
);

if (activeCheckins.length > 0) {
    return res.status(400).json({ message: 'Already have active check-in' });
}

// Insert new check-in
const [result] = await pool.execute(
    'INSERT INTO checkins (...) VALUES (...)',
    [...]
);
```

**The Race:**
1. Request A checks for active check-ins → none found
2. Request B checks for active check-ins → none found (A hasn't inserted yet)
3. Request A inserts check-in
4. Request B inserts check-in
5. **Result**: User has two active check-ins!

**How to Prevent:**

**Option 1: Database Transaction with Locking**
```javascript
await pool.execute('BEGIN TRANSACTION');

const [activeCheckins] = await pool.execute(
    'SELECT * FROM checkins WHERE employee_id = ? AND status = "checked_in" FOR UPDATE',
    [req.user.id]
);

if (activeCheckins.length > 0) {
    await pool.execute('ROLLBACK');
    return res.status(400).json({ message: 'Already checked in' });
}

await pool.execute('INSERT INTO checkins (...) VALUES (...)', [...]);
await pool.execute('COMMIT');
```

**Option 2: Unique Constraint**
```sql
-- Add unique partial index (SQLite 3.15+)
CREATE UNIQUE INDEX idx_active_checkin 
ON checkins(employee_id) 
WHERE status = 'checked_in';
```

**2. Concurrent Checkouts**

**Location:** `backend/routes/checkin.js` lines 78-89

Similar issue - two checkout requests could both find the same active check-in and try to update it.

**Prevention:**
```javascript
const [result] = await pool.execute(
    `UPDATE checkins 
     SET checkout_time = NOW(), status = 'checked_out' 
     WHERE id = ? AND status = 'checked_in'`, // Add status check
    [activeCheckins[0].id]
);

if (result.affectedRows === 0) {
    return res.status(409).json({ message: 'Already checked out' });
}
```

**3. React State Updates (Frontend)**

**Location:** `frontend/src/pages/CheckIn.jsx` lines 58-84

```javascript
const handleCheckIn = async (e) => {
    setSubmitting(true); // Not atomic!
    
    // If user clicks twice quickly, both requests might go through
    const response = await api.post('/checkin', {...});
    
    setSubmitting(false);
};
```

**Prevention:**
```javascript
const handleCheckIn = async (e) => {
    if (submitting) return; // Guard clause
    
    setSubmitting(true);
    try {
        const response = await api.post('/checkin', {...});
    } finally {
        setSubmitting(false);
    }
};
```

**4. Counter Auto-Increment (Fixed)**

**Location:** `frontend/src/components/Counter.jsx` line 11 (already fixed)

The stale closure issue we fixed was actually a race condition - the interval callback was racing with state updates.

### General Prevention Strategies:

1. **Database Level:**
   - Use transactions with appropriate isolation levels
   - Add unique constraints
   - Use row-level locking (`FOR UPDATE`)
   - Implement optimistic locking (version numbers)

2. **Application Level:**
   - Implement idempotency (accept client-generated UUIDs)
   - Use distributed locks (Redis SETNX)
   - Add request deduplication
   - Use message queues for sequential processing

3. **Frontend Level:**
   - Disable buttons during submission
   - Use debouncing/throttling
   - Implement optimistic UI updates
   - Add request cancellation

**Example: Distributed Lock with Redis**
```javascript
const lockKey = `lock:checkin:${req.user.id}`;
const lockAcquired = await redis.set(lockKey, 'locked', 'EX', 5, 'NX');

if (!lockAcquired) {
    return res.status(429).json({ message: 'Request in progress' });
}

try {
    // Perform check-in
} finally {
    await redis.del(lockKey);
}
```
