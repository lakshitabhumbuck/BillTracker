require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const ChatbotService = require('./chatbot');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors({
    origin: 'http://localhost:5173', // Adjust for your frontend URL
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize chatbot service
const chatbotService = new ChatbotService(pool);

// Test DB connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err.stack);
  } else {
    console.log('Database connected successfully');
  }
});

// --- API Endpoints for Bills ---

// GET all bills
app.get('/api/bills', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bills ORDER BY due_date ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST a new bill
app.post('/api/bills', async (req, res) => {
  try {
    const { category, name, amount, dueDate, status } = req.body;
    const newBill = await pool.query(
      'INSERT INTO bills (category, name, amount, due_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category, name, amount, dueDate, status]
    );
    res.json(newBill.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT (update) a bill
app.put('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, name, amount, dueDate, status } = req.body;
    const updatedBill = await pool.query(
      'UPDATE bills SET category = $1, name = $2, amount = $3, due_date = $4, status = $5 WHERE id = $6 RETURNING *',
      [category, name, amount, dueDate, status, id]
    );
    res.json(updatedBill.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE a bill
app.delete('/api/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM bills WHERE id = $1', [id]);
    res.json({ msg: 'Bill deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- API Endpoints for Credit Cards ---

// GET all credit cards
app.get('/api/cards', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM credit_cards ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST a new credit card
app.post('/api/cards', async (req, res) => {
  try {
    const { card_company, card_number, card_holder, expiry_month, expiry_year, cvv } = req.body;
    const newCard = await pool.query(
      'INSERT INTO credit_cards (card_company, card_number, card_holder, expiry_month, expiry_year, cvv) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [card_company, card_number, card_holder, expiry_month, expiry_year, cvv]
    );
    res.json(newCard.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE a credit card
app.delete('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM credit_cards WHERE id = $1', [id]);
    res.json({ msg: 'Card deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- API Endpoints for Transactions & Insights ---

// GET transactions with filtering
app.get('/api/transactions', async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ msg: 'Year and month query parameters are required' });
    }
    const result = await pool.query(
      "SELECT * FROM transactions WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2 ORDER BY date DESC",
      [year, month]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET spending by category for charts
app.get('/api/insights/spending-by-category', async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = "SELECT category, SUM(amount) as total FROM transactions WHERE type = 'Debit'";
    let params = [];
    
    if (year && month) {
      query += " AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2";
      params = [year, month];
    }
    
    query += " GROUP BY category ORDER BY total DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET spending by vendor for charts
app.get('/api/insights/spending-by-vendor', async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = "SELECT vendor, SUM(amount) as total FROM transactions WHERE type = 'Debit'";
    let params = [];
    
    if (year && month) {
      query += " AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2";
      params = [year, month];
    }
    
    query += " GROUP BY vendor ORDER BY total DESC";
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- Chatbot API Endpoint ---
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const response = await chatbotService.processMessage(message, userId);
    res.json(response);
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ 
      type: 'text', 
      content: 'Sorry, I encountered an error. Please try again.' 
    });
  }
});

// --- Contact Form API Endpoint ---
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // In a real app, you would send email via Nodemailer
    // For now, we'll just log the contact form submission
    console.log('Contact form submission:', { name, email, subject, message });
    
    res.json({ 
      success: true, 
      message: 'Thank you for your message! We will get back to you soon.' 
    });
  } catch (err) {
    console.error('Contact form error:', err.message);
    res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
});

// --- NEW INSIGHTS API ENDPOINTS ---

// GET /api/insights/summary - Combined monthly overview
app.get('/api/insights/summary', async (req, res) => {
  try {
    const { year, month } = req.query; // e.g., 2025, 7
    if (!year || !month) return res.status(400).json({ msg: 'Year and month are required.' });

    // 1. Get total from card transactions for the month
    const transactionsRes = await pool.query(
      "SELECT SUM(amount) as total FROM transactions WHERE type = 'Debit' AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2",
      [year, month]
    );
    const cardSpending = parseFloat(transactionsRes.rows[0].total) || 0;

    // 2. Get total from paid bills for the month
    const billsRes = await pool.query(
      "SELECT SUM(amount) as total FROM bills WHERE status = 'Paid' AND EXTRACT(YEAR FROM due_date) = $1 AND EXTRACT(MONTH FROM due_date) = $2",
      [year, month]
    );
    const billSpending = parseFloat(billsRes.rows[0].total) || 0;
    
    const totalSpending = cardSpending + billSpending;
    const monthlyBudget = 50000; // Static budget for now
    const budgetUsage = totalSpending > 0 ? (totalSpending / monthlyBudget) * 100 : 0;

    // 3. Data for Pie Chart
    const pieDataRes = await pool.query(
      `SELECT category, SUM(amount) as total FROM (
         SELECT category, amount FROM transactions WHERE type = 'Debit' AND EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
         UNION ALL
         SELECT category, amount FROM bills WHERE status = 'Paid' AND EXTRACT(YEAR FROM due_date) = $1 AND EXTRACT(MONTH FROM due_date) = $2
       ) as combined_expenses
       GROUP BY category`,
      [year, month]
    );

    res.json({
      totalSpending,
      budget: monthlyBudget,
      budgetUsage: Math.min(100, budgetUsage), // Cap at 100%
      pieChartData: pieDataRes.rows
    });
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/insights/categories - Category comparison data
app.get('/api/insights/categories', async (req, res) => {
  try {
    const { period } = req.query; // '1m' or '3m'
    const dateFilter = new Date();
    if (period === '3m') {
      dateFilter.setMonth(dateFilter.getMonth() - 3);
    } else {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }
    const dateLimit = dateFilter.toISOString().split('T')[0];

    const categoryData = await pool.query(
      `SELECT category, SUM(amount) as total FROM (
         SELECT category, amount, date FROM transactions WHERE type = 'Debit' AND date >= $1
         UNION ALL
         SELECT category, amount, due_date as date FROM bills WHERE status = 'Paid' AND due_date >= $1
       ) as combined
       GROUP BY category ORDER BY total DESC`,
      [dateLimit]
    );
    res.json(categoryData.rows);
  } catch(err) {
    console.error('Error fetching category comparison:', err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/insights/streaks - Payment timeliness tracker
app.get('/api/insights/streaks', async (req, res) => {
  try {
    // NOTE: This logic assumes a bill marked 'Paid' was paid on time,
    // as we don't have a `paid_date` column.
    const onTimePayments = await pool.query(
      "SELECT COUNT(*) as count FROM bills WHERE status = 'Paid'"
    );
    const streak = parseInt(onTimePayments.rows[0].count) || 0;
    
    // Create a dummy heatmap data for the last 30 days
    const heatmap = Array.from({ length: 30 }).map((_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      count: Math.floor(Math.random() * (streak > 0 ? 3 : 1)) // Random activity
    }));

    res.json({ streak, heatmap });
  } catch(err) {
    console.error('Error fetching streaks:', err.message);
    res.status(500).json({ error: 'Failed to fetch spending heatmap.' });
  }
});

// GET /api/insights/suggestions - Smart suggestions
app.get('/api/insights/suggestions', async (req, res) => {
    try {
        const suggestions = [];
        const month = req.query.month || new Date().getMonth() + 1;
        const year = req.query.year || new Date().getFullYear();
        
        // 1. Check Savings Rate
        const spendingRes = await pool.query(
            "SELECT SUM(amount) as total FROM bills WHERE status = 'Paid' AND EXTRACT(MONTH FROM due_date) = $1 AND EXTRACT(YEAR FROM due_date) = $2",
            [month, year]
        );
        const monthlySpend = parseFloat(spendingRes.rows[0].total) || 0;
        const monthlyBudget = 50000; // Static budget
        
        if (monthlySpend > (monthlyBudget * 0.9)) {
            suggestions.push({ type: 'warning', message: 'Savings are less than 10% of your budget. Consider reviewing your spending.' });
        }

        // 2. Overspending on Food
        const foodSpending = await pool.query(
            "SELECT SUM(amount) AS total FROM bills WHERE category = 'Food' AND status = 'Paid' AND EXTRACT(MONTH FROM due_date) = $1 AND EXTRACT(YEAR FROM due_date) = $2",
            [month, year]
        );
        if (foodSpending.rows[0].total > 5000) {
            suggestions.push({ type: 'warning', message: 'Overspending on Food: You have spent over ₹5,000 this month.' });
        }

        // 3. Unpaid Subscriptions
        const unpaidSubs = await pool.query("SELECT COUNT(*) as count FROM bills WHERE category = 'Subscription' AND status = 'Unpaid' AND due_date < NOW()");
        if (parseInt(unpaidSubs.rows[0].count) > 0) {
            suggestions.push({ type: 'alert', message: 'You have unpaid subscriptions. Please check your bills.' });
        }
        
        // 4. Potential duplicate charges
        const duplicateCharges = await pool.query(
          `SELECT name, amount, COUNT(*) as count
           FROM bills
           WHERE due_date >= NOW() - INTERVAL '30 days' AND status = 'Unpaid'
           GROUP BY name, amount
           HAVING COUNT(*) > 1`
        );
    
        duplicateCharges.rows.forEach(charge => {
          suggestions.push({
            type: 'info',
            message: `We noticed a potential duplicate charge for "${charge.name}" worth ₹${charge.amount}.`,
          });
        });

        if (suggestions.length === 0) {
            suggestions.push({ type: 'info', message: 'Everything looks good! No immediate suggestions.' });
        }
        
        res.json(suggestions);
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/insights/rewards - Gamification and rewards
app.get('/api/insights/rewards', async (req, res) => {
  try {
    const { year, month } = req.query;
    if(!year || !month) {
      return res.status(400).json({ error: 'Year and month are required.' });
    }
    
    // Calculate total spending for the given month
    const spendingRes = await pool.query(
      "SELECT SUM(amount) as total FROM bills WHERE status = 'Paid' AND EXTRACT(MONTH FROM due_date) = $1 AND EXTRACT(YEAR FROM due_date) = $2",
      [month, year]
    );
    const monthlySpend = parseFloat(spendingRes.rows[0].total) || 0;

    // Calculate points based on on-time payments
    const onTimePayments = await pool.query("SELECT COUNT(*) as count FROM bills WHERE status = 'Paid'");
    const points = (parseInt(onTimePayments.rows[0].count) || 0) * 10;
    
    const allCoupons = [
      { id: 1, code: 'MYN10', title: '10% off Myntra', condition: 2000, desc: 'On next purchase', logo: 'assets/myntra-logo.jpg' },
      { id: 2, code: 'AMAZON50', title: '₹50 Cashback on Amazon', condition: 5000, desc: 'On orders over ₹500', logo: 'assets/amazon-logo.png' },
      { id: 3, code: 'FLIPKART100', title: '₹100 off Flipkart', condition: 7000, desc: 'On orders over ₹1000', logo: 'assets/flipkart-logo.png' },
      { id: 4, code: 'ZEPTONOW', title: 'Free Delivery on Zepto', condition: 1000, desc: 'On your next 3 orders', logo: 'assets/zepto-logo.png' },
      { id: 5, code: 'SWIGGYIT', title: '60% off Swiggy', condition: 3000, desc: 'Up to ₹120 on your next order', logo: 'assets/swiggy-logo.png' }
    ];

    const unlockedCoupons = allCoupons.filter(c => monthlySpend >= c.condition);

    res.json({ points, unlockedCoupons });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Authentication API Endpoints ---

// Register a new user
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;

        // Check if user already exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user into the database
        const newUser = await pool.query(
            'INSERT INTO users (first_name, last_name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, first_name, last_name, email',
            [firstName, lastName, email, passwordHash]
        );

        res.status(201).json({
            message: 'User registered successfully!',
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Login a user
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const user = userResult.rows[0];

        // Compare password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // Create and sign a JWT
        const payload = {
            id: user.id,
            email: user.email,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set token in an HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set to false for local development (not HTTPS)
            sameSite: 'lax', // Helps with cross-origin cookies in dev
            maxAge: 3600000, // 1 hour
        });

        res.json({
            message: 'Logged in successfully!',
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
            },
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).send('Server Error');
    }
});

// Check authentication status
app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Middleware to authenticate and get user ID from JWT
function authenticate(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get current user profile
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const userRes = await pool.query('SELECT id, first_name, last_name, email, phone_number, profile_picture_url, notify_bills, notify_email, notify_sms FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(userRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile info
app.put('/api/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone_number, profile_picture_url } = req.body;
    await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone_number = $3, profile_picture_url = $4 WHERE id = $5',
      [firstName, lastName, phone_number, profile_picture_url, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update notification preferences
app.put('/api/profile/notifications', authenticate, async (req, res) => {
  try {
    const { notify_bills, notify_email, notify_sms } = req.body;
    await pool.query('UPDATE users SET notify_bills = $1, notify_email = $2, notify_sms = $3 WHERE id = $4', [notify_bills, notify_email, notify_sms, req.user.id]);
    res.json({ message: 'Notification preferences updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
app.put('/api/profile/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    res.json({ message: 'Password changed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
app.delete('/api/profile', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.clearCookie('token');
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 