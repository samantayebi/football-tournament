require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const jwt     = require('jsonwebtoken');

const auth       = require('./middleware/auth');
const enrollment = require('./modules/enrollment');
const bracket    = require('./modules/bracket');
const results    = require('./modules/results');
const reports    = require('./modules/reports');

const app = express();

app.use(cors());
app.use(express.json());

const ADMIN = { username: 'admin', password: 'admin123' };

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN.username || password !== ADMIN.password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.use('/api/admin', auth, enrollment);
app.use('/api/admin', auth, bracket);
app.use('/api/admin', auth, results);
app.use('/api/admin', auth, reports);

module.exports = app;
