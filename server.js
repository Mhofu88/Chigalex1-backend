const express = require('express');
const cors = require('cors');
const path = require('path');
const { Redis } = require('@upstash/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());

// Serve the frontend (index.html and all files in /public)
app.use(express.static(path.join(__dirname, 'public')));

// ── REDIS CONNECTION ──
// Render environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
let redis;
try {
  redis = Redis.fromEnv();
  console.log('✅ Connected to Upstash Redis');
} catch (err) {
  console.warn('⚠️  Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Render environment variables.');
  redis = null;
}

// Helper: check Redis is ready
function requireRedis(res) {
  if (!redis) {
    res.status(503).json({ error: 'Database not configured. Add Redis env vars in Render dashboard.' });
    return false;
  }
  return true;
}

// ── ROUTES ──

// Health check — Render uses this to confirm the app is running
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Chigalex1 Backend', version: '1.0.0' });
});

// Root — confirm backend is live
app.get('/api', (req, res) => {
  res.json({ message: 'Chigalex1 Backend Online ✅', referral: 'chigalex1' });
});

// ── MEMBERSHIP ROUTES ──

// Check if a Pi username has paid membership
app.get('/check-membership', async (req, res) => {
  if (!requireRedis(res)) return;
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username required' });
    const status = await redis.get(`member:${username}:status`);
    res.json({ username, paid: status === 'paid', status: status || 'free' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve a Pi payment (called by frontend onReadyForServerApproval)
app.post('/approve-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;
    if (!paymentId) return res.status(400).json({ error: 'paymentId required' });

    // Call Pi Network API to approve the payment
    const response = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const data = await response.json();
    console.log('Payment approved:', paymentId, data);
    res.json({ success: true, paymentId, data });
  } catch (err) {
    console.error('Approve error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Complete a Pi payment (called by frontend onReadyForServerCompletion)
app.post('/complete-payment', async (req, res) => {
  if (!requireRedis(res)) return;
  try {
    const { paymentId, txid, username } = req.body;
    if (!paymentId || !txid || !username) {
      return res.status(400).json({ error: 'paymentId, txid and username required' });
    }

    // Tell Pi Network the payment is complete
    const response = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      }
    );
    const data = await response.json();
    console.log('Payment completed:', paymentId, txid, data);

    // Mark user as paid in Redis
    await redis.set(`member:${username}:status`, 'paid');
    await redis.set(`member:${username}:txid`, txid);
    await redis.set(`member:${username}:paidAt`, new Date().toISOString());

    res.json({ success: true, username, status: 'paid' });
  } catch (err) {
    console.error('Complete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN ROUTES ──

// Get all members (admin use)
app.get('/admin/members', async (req, res) => {
  if (!requireRedis(res)) return;
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const keys = await redis.keys('member:*:status');
    const members = keys.map(k => k.replace('member:', '').replace(':status', ''));
    res.json({ count: members.length, members });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually grant/revoke membership (admin)
app.post('/admin/set-membership', async (req, res) => {
  if (!requireRedis(res)) return;
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { username, status } = req.body; // status: 'paid' or 'free'
    await redis.set(`member:${username}:status`, status || 'paid');
    res.json({ success: true, username, status: status || 'paid' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FAQ ROUTES ──

// Get FAQs
app.get('/faqs', async (req, res) => {
  if (!requireRedis(res)) return;
  try {
    const data = await redis.get('chigalex1:faqs');
    res.json({ faqs: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add FAQ (admin)
app.post('/admin/faqs', async (req, res) => {
  if (!requireRedis(res)) return;
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { question, answer, lang } = req.body;
    const existing = await redis.get('chigalex1:faqs') || [];
    existing.push({ id: Date.now(), question, answer, lang: lang || 'en', addedAt: new Date().toISOString() });
    await redis.set('chigalex1:faqs', existing);
    res.json({ success: true, count: existing.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── QUESTIONS ROUTES ──

// Submit a user question
app.post('/questions', async (req, res) => {
  if (!requireRedis(res)) return;
  try {
    const { name, email, question } = req.body;
    const existing = await redis.get('chigalex1:questions') || [];
    existing.push({ id: Date.now(), name, email, question, status: 'pending', askedAt: new Date().toISOString() });
    await redis.set('chigalex1:questions', existing);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get answered questions (public)
app.get('/questions/answered', async (req, res) => {
  if (!requireRedis(res)) return;
  try {
    const all = await redis.get('chigalex1:questions') || [];
    res.json({ questions: all.filter(q => q.status === 'answered') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all questions (admin)
app.get('/admin/questions', async (req, res) => {
  if (!requireRedis(res)) return;
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const all = await redis.get('chigalex1:questions') || [];
    res.json({ questions: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Answer a question (admin)
app.post('/admin/questions/answer', async (req, res) => {
  if (!requireRedis(res)) return;
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { id, answer } = req.body;
    const all = await redis.get('chigalex1:questions') || [];
    const updated = all.map(q => q.id === id ? { ...q, answer, status: 'answered', answeredAt: new Date().toISOString() } : q);
    await redis.set('chigalex1:questions', updated);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── CATCH-ALL — serve index.html for any unmatched route ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START SERVER ──
app.listen(PORT, () => {
  console.log(`🚀 Chigalex1 server running on port ${PORT}`);
  console.log(`   Visit: http://localhost:${PORT}`);
});
