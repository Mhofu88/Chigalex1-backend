const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ════════════════════════════════════════════
// ── REDIS ──
// ════════════════════════════════════════════
let redis = null;
try {
  const { Redis } = require('@upstash/redis');
  redis = Redis.fromEnv();
  console.log('✅ Redis connected');
} catch (e) {
  console.warn('⚠️ Redis not configured — add env vars in Render dashboard');
}

function requireRedis(res) {
  if (!redis) { res.status(503).json({ error: 'Redis not configured' }); return false; }
  return true;
}

// ════════════════════════════════════════════
// ── INPUT VALIDATION HELPERS ──
// ════════════════════════════════════════════
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}

function isValidUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{1,64}$/.test(u.trim());
}

function isValidEmail(e) {
  if (!e) return true;
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) && e.length <= 254;
}

function validateAdminKey(req, res) {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ════════════════════════════════════════════
// ── RATE LIMITING ──
// ════════════════════════════════════════════
const rateLimitStore = new Map();

function rateLimit(maxRequests = 20, windowMs = 60_000) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests — please slow down.' });
    }
    next();
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 5 * 60_000);

// ════════════════════════════════════════════
// ── ANALYTICS HELPER ──
// ════════════════════════════════════════════
async function trackEvent(event) {
  if (!redis) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    await redis.incr(`analytics:${day}:${event}`);
    await redis.incr(`analytics:total:${event}`);
  } catch (e) {
    console.warn('Analytics tracking failed:', e.message);
  }
}

// ════════════════════════════════════════════
// ── REDIS HELPERS ──
// ════════════════════════════════════════════
async function getFAQs(lang = null) {
  const ids = await redis.zrange('faq:index', 0, -1);
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.hgetall(`faq:${id}`));
  const results = await pipeline.exec();
  const faqs = results.map(r => r).filter(Boolean);
  return lang ? faqs.filter(f => !f.lang || f.lang === lang || f.lang === 'all') : faqs;
}

async function getQuestions(filter = 'all') {
  const key = filter === 'answered' ? 'question:index:answered' : 'question:index:all';
  const ids = await redis.zrange(key, 0, -1, { rev: true });
  if (!ids.length) return [];
  const pipeline = redis.pipeline();
  ids.forEach(id => pipeline.hgetall(`question:${id}`));
  const results = await pipeline.exec();
  return results.filter(Boolean);
}

// ════════════════════════════════════════════
// ── HEALTH CHECK ──
// ════════════════════════════════════════════
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Chigalex1 – Africa Pi Network Education Hub',
    referral: 'chigalex1',
    redis: redis ? 'connected' : 'not configured'
  });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Chigalex1 Backend Online ✅', referral: 'chigalex1' });
});

// ════════════════════════════════════════════
// ── PI DOMAIN VALIDATION KEY ──
// ════════════════════════════════════════════
app.get('/validation-key.txt', (req, res) => {
  res.type('text/plain');
  res.send('66fd2fe77f7974921d81546a3e9e70af5d70ab6de3068f474775154713c90bfae119028b5541e88f5857fc36f04b102cb5edde4341012fd42834d145dd39e2bf');
});

// ════════════════════════════════════════════
// ── PRIVACY POLICY ──
// ════════════════════════════════════════════
app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Privacy Policy – Chigalex1</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:#0D0A1A;color:#F0EBF8;padding:40px 20px;max-width:800px;margin:0 auto;line-height:1.75;}h1{font-size:1.8rem;font-weight:800;color:#F5C518;margin-bottom:6px;}.sub{color:#9B59B6;font-size:.9rem;margin-bottom:32px;}h2{font-size:1.1rem;font-weight:700;color:#00D4AA;margin:28px 0 10px;}p{color:#B8A8D8;font-size:.93rem;margin-bottom:12px;}ul{color:#B8A8D8;font-size:.93rem;padding-left:20px;margin-bottom:12px;}ul li{margin-bottom:6px;}.pi{color:#F5C518;font-weight:700;}.warn{color:#FF7043;}a{color:#9B59B6;}.back{display:inline-block;margin-top:32px;background:linear-gradient(135deg,#7B2D8B,#9B59B6);color:#fff;padding:10px 22px;border-radius:100px;text-decoration:none;font-weight:700;font-size:.9rem;}.logo{font-size:2rem;margin-bottom:8px;}</style>
</head><body>
<div class="logo">π</div>
<h1>Privacy Policy</h1>
<p class="sub">Chigalex1 – Africa Pi Network Education Hub · Last updated: May 2026</p>
<h2>1. Who We Are</h2>
<p><strong class="pi">Chigalex1</strong> is an independent educational platform and community DApp created to help pioneers and businesses across Africa register on Pi Network, complete KYC and KYB verification, and list on Map of Pi. Chigalex1 is operated under the Africa Pi GCV Industry Alliance and is <span class="warn">not affiliated with Pi Network or SocialChain Inc.</span></p>
<h2>2. Information We Collect</h2>
<ul>
<li><strong>Pi Username</strong> — collected when you authenticate via Pi Network login.</li>
<li><strong>Payment Transaction ID (txid)</strong> — collected to confirm your membership payment.</li>
<li><strong>Name and Email (optional)</strong> — collected only if you submit a question.</li>
<li><strong>Questions submitted</strong> — stored so the administrator can publish answers.</li>
</ul>
<p>We do <strong>not</strong> collect passwords, passphrases, national ID information, or sensitive financial data.</p>
<h2>3. Data Storage</h2>
<p>All data is stored securely using Upstash Redis with encryption in transit and at rest.</p>
<h2>4. Pi Network Authentication</h2>
<p>Chigalex1 uses the official Pi Network SDK. We only receive your Pi username and payment confirmation — we never receive or store your passphrase or private keys.</p>
<p><strong class="warn">Never share your 24-word Pi passphrase with anyone — including Chigalex1.</strong></p>
<h2>5. Your Rights</h2>
<p>You may request deletion of your data by submitting a question with the subject "Data Deletion Request". We will process it within 30 days.</p>
<h2>6. Contact</h2>
<p>For privacy concerns, contact us through the Chigalex1 Ask the Administrator feature at <a href="/">chigalex1-backend.onrender.com</a>.</p>
<a href="/" class="back">← Back to Chigalex1</a>
</body></html>`);
});

// ════════════════════════════════════════════
// ── TERMS OF SERVICE ──
// ════════════════════════════════════════════
app.get('/terms', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Terms of Service – Chigalex1</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;background:#0D0A1A;color:#F0EBF8;padding:40px 20px;max-width:800px;margin:0 auto;line-height:1.75;}h1{font-size:1.8rem;font-weight:800;color:#F5C518;margin-bottom:6px;}.sub{color:#9B59B6;font-size:.9rem;margin-bottom:32px;}h2{font-size:1.1rem;font-weight:700;color:#00D4AA;margin:28px 0 10px;}p{color:#B8A8D8;font-size:.93rem;margin-bottom:12px;}ul{color:#B8A8D8;font-size:.93rem;padding-left:20px;margin-bottom:12px;}ul li{margin-bottom:6px;}.pi{color:#F5C518;font-weight:700;}.warn{color:#FF7043;}a{color:#9B59B6;}.back{display:inline-block;margin-top:32px;background:linear-gradient(135deg,#7B2D8B,#9B59B6);color:#fff;padding:10px 22px;border-radius:100px;text-decoration:none;font-weight:700;font-size:.9rem;}.logo{font-size:2rem;margin-bottom:8px;}.highlight{background:rgba(245,197,24,0.1);border:1px solid rgba(245,197,24,0.3);border-radius:10px;padding:14px 18px;margin:16px 0;}</style>
</head><body>
<div class="logo">π</div>
<h1>Terms of Service</h1>
<p class="sub">Chigalex1 – Africa Pi Network Education Hub · Last updated: May 2026</p>
<div class="highlight"><p style="color:#F5C518;font-weight:700;">Important Notice</p><p>Chigalex1 is an <strong>independent community educational platform</strong> and is not affiliated with, endorsed by, or officially connected to Pi Network or SocialChain Inc.</p></div>
<h2>1. Acceptance of Terms</h2>
<p>By using Chigalex1, you agree to be bound by these Terms. If you do not agree, please do not use the App.</p>
<h2>2. Description of Service</h2>
<p><strong class="pi">Chigalex1</strong> provides step-by-step training on Pi Network registration, KYC, KYB, Map of Pi, and Pi security across all 54 African countries in 22 languages.</p>
<h2>3. Membership Fee</h2>
<p>Access requires a <strong>one-time fee of 1 Pi (1π)</strong>. This is a community app access fee and is <span class="warn">NOT a charge by Pi Network or SocialChain Inc.</span></p>
<h2>4. Security Warning</h2>
<p><strong class="warn">Chigalex1 will NEVER ask for your 24-word Pi passphrase.</strong> Anyone who does is attempting fraud.</p>
<h2>5. Disclaimer of Affiliation</h2>
<p>Chigalex1 is <span class="warn">NOT affiliated with Pi Network or SocialChain Inc.</span> All Pi Network trademarks belong to their respective owners.</p>
<h2>6. Contact</h2>
<p>Submit questions at <a href="/">chigalex1-backend.onrender.com</a></p>
<a href="/" class="back">← Back to Chigalex1</a>
</body></html>`);
});

// ════════════════════════════════════════════
// ── MEMBERSHIP ROUTES ──
// ════════════════════════════════════════════
app.get('/check-membership', rateLimit(30, 60_000), async (req, res) => {
  const username = sanitizeString(req.query.username, 64);
  if (!isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' });
  if (!redis) return res.json({ username, paid: false, status: 'free' });
  try {
    const [status, paidAt, country, lang] = await Promise.all([
      redis.get(`member:${username}:status`),
      redis.get(`member:${username}:paidAt`),
      redis.get(`member:${username}:country`),
      redis.get(`member:${username}:lang`),
    ]);
    await trackEvent('check_membership');
    res.json({ username, paid: status === 'paid', status: status || 'free', paidAt, country, lang });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/approve-payment', rateLimit(10, 60_000), async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId || typeof paymentId !== 'string') return res.status(400).json({ error: 'paymentId required' });
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY || ''}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('✅ Payment approved:', paymentId);
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/complete-payment', rateLimit(10, 60_000), async (req, res) => {
  const paymentId = sanitizeString(req.body.paymentId, 128);
  const txid = sanitizeString(req.body.txid, 128);
  const username = sanitizeString(req.body.username, 64);
  const country = sanitizeString(req.body.country || '', 64);
  const lang = sanitizeString(req.body.lang || 'en', 10);
  if (!paymentId || !txid || !isValidUsername(username)) {
    return res.status(400).json({ error: 'paymentId, txid and valid username required' });
  }
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${process.env.PI_API_KEY || ''}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid })
    });
    const data = await response.json();
    console.log('✅ Payment completed:', username, txid);
    if (redis) {
      const now = new Date().toISOString();
      await Promise.all([
        redis.set(`member:${username}:status`, 'paid'),
        redis.set(`member:${username}:txid`, txid),
        redis.set(`member:${username}:paidAt`, now),
        redis.set(`member:${username}:country`, country),
        redis.set(`member:${username}:lang`, lang),
        redis.zadd('member:index', { score: Date.now(), member: username }),
      ]);
      await trackEvent('new_member');
      sendPiNotification(username, '🎉 Welcome to Chigalex1! Your membership is confirmed. Start your Pi training now.').catch(() => {});
    }
    res.json({ success: true, username, status: 'paid' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── USER PROFILE ──
// ════════════════════════════════════════════
app.get('/profile/:username', rateLimit(30, 60_000), async (req, res) => {
  const username = sanitizeString(req.params.username, 64);
  if (!isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' });
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    const [status, paidAt, txid, country, lang, progress] = await Promise.all([
      redis.get(`member:${username}:status`),
      redis.get(`member:${username}:paidAt`),
      redis.get(`member:${username}:txid`),
      redis.get(`member:${username}:country`),
      redis.get(`member:${username}:lang`),
      redis.hgetall(`member:${username}:progress`),
    ]);
    if (!status) return res.status(404).json({ error: 'User not found' });
    await trackEvent('profile_view');
    res.json({ username, status: status || 'free', paid: status === 'paid', paidAt, txid, country, lang, progress: progress || {} });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/profile/:username', rateLimit(10, 60_000), async (req, res) => {
  const username = sanitizeString(req.params.username, 64);
  if (!isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' });
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  const updates = {};
  if (req.body.country) updates.country = sanitizeString(req.body.country, 64);
  if (req.body.lang) updates.lang = sanitizeString(req.body.lang, 10);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields to update' });
  try {
    await Promise.all(Object.entries(updates).map(([k, v]) => redis.set(`member:${username}:${k}`, v)));
    res.json({ success: true, username, ...updates });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/profile/:username/progress', rateLimit(60, 60_000), async (req, res) => {
  const username = sanitizeString(req.params.username, 64);
  const step = sanitizeString(req.body.step || '', 64);
  if (!isValidUsername(username) || !step) return res.status(400).json({ error: 'username and step required' });
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    await redis.hset(`member:${username}:progress`, { [step]: new Date().toISOString() });
    await trackEvent('progress_update');
    res.json({ success: true, username, step });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── PI NOTIFICATIONS ──
// ════════════════════════════════════════════
async function sendPiNotification(username, message) {
  if (!process.env.PI_API_KEY) return;
  const res = await fetch('https://api.minepi.com/v2/me/notifications', {
    method: 'POST',
    headers: { 'Authorization': `Key ${process.env.PI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid: username, message }),
  });
  return res.json();
}

app.post('/admin/notify', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  const username = sanitizeString(req.body.username || '', 64);
  const message = sanitizeString(req.body.message || '', 500);
  if (!isValidUsername(username) || !message) return res.status(400).json({ error: 'username and message required' });
  try {
    const data = await sendPiNotification(username, message);
    await trackEvent('notification_sent');
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── ANALYTICS ──
// ════════════════════════════════════════════
app.get('/admin/analytics', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.json({ error: 'Redis not configured' });
  try {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10);
    });
    const events = ['new_member', 'check_membership', 'profile_view', 'question_submitted', 'progress_update', 'notification_sent'];
    const pipeline = redis.pipeline();
    days.forEach(day => events.forEach(e => pipeline.get(`analytics:${day}:${e}`)));
    events.forEach(e => pipeline.get(`analytics:total:${e}`));
    const results = await pipeline.exec();
    const daily = {};
    days.forEach((day, di) => {
      daily[day] = {};
      events.forEach((e, ei) => { daily[day][e] = parseInt(results[di * events.length + ei] || '0', 10); });
    });
    const totals = {};
    events.forEach((e, i) => { totals[e] = parseInt(results[days.length * events.length + i] || '0', 10); });
    const memberCount = await redis.zcard('member:index');
    res.json({ totals, daily, memberCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── MULTI-LANGUAGE CONTENT ──
// ════════════════════════════════════════════
app.get('/content/:slug', rateLimit(60, 60_000), async (req, res) => {
  const slug = sanitizeString(req.params.slug, 64);
  const lang = sanitizeString(req.query.lang || 'en', 10);
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    let content = await redis.hgetall(`content:${lang}:${slug}`);
    if (!content || !content.body) content = await redis.hgetall(`content:en:${slug}`);
    if (!content || !content.body) return res.status(404).json({ error: 'Content not found' });
    await trackEvent('content_view');
    res.json({ slug, lang: content.lang || lang, ...content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/content', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!requireRedis(res)) return;
  const slug = sanitizeString(req.body.slug || '', 64);
  const lang = sanitizeString(req.body.lang || 'en', 10);
  const title = sanitizeString(req.body.title || '', 200);
  const body = sanitizeString(req.body.body || '', 5000);
  if (!slug || !title || !body) return res.status(400).json({ error: 'slug, title, and body required' });
  try {
    await redis.hset(`content:${lang}:${slug}`, { slug, lang, title, body, updatedAt: new Date().toISOString() });
    await redis.sadd(`content:index:${lang}`, slug);
    res.json({ success: true, slug, lang });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/content', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.json({ content: [] });
  const lang = sanitizeString(req.query.lang || 'en', 10);
  try {
    const slugs = await redis.smembers(`content:index:${lang}`);
    if (!slugs.length) return res.json({ content: [] });
    const pipeline = redis.pipeline();
    slugs.forEach(slug => pipeline.hgetall(`content:${lang}:${slug}`));
    const results = await pipeline.exec();
    res.json({ content: results.filter(Boolean) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── FAQ ROUTES ──
// ════════════════════════════════════════════
app.get('/faqs', rateLimit(30, 60_000), async (req, res) => {
  if (!redis) return res.json({ faqs: [] });
  const lang = sanitizeString(req.query.lang || '', 10);
  try {
    const faqs = await getFAQs(lang || null);
    res.json({ faqs });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/faqs', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!requireRedis(res)) return;
  const question = sanitizeString(req.body.question || '', 500);
  const answer = sanitizeString(req.body.answer || '', 2000);
  const lang = sanitizeString(req.body.lang || 'en', 10);
  if (!question || !answer) return res.status(400).json({ error: 'question and answer required' });
  try {
    const id = Date.now();
    const faq = { id: String(id), question, answer, lang, addedAt: new Date().toISOString() };
    await redis.hset(`faq:${id}`, faq);
    await redis.zadd('faq:index', { score: id, member: String(id) });
    res.json({ success: true, faq });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/admin/faqs/:id', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!requireRedis(res)) return;
  const id = sanitizeString(req.params.id, 20);
  try {
    await redis.del(`faq:${id}`);
    await redis.zrem('faq:index', id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── QUESTION ROUTES ──
// ════════════════════════════════════════════
app.post('/questions', rateLimit(5, 60_000), async (req, res) => {
  if (!redis) return res.json({ success: true, note: 'Redis not configured' });
  const name = sanitizeString(req.body.name || 'Anonymous', 100);
  const email = sanitizeString(req.body.email || '', 254);
  const question = sanitizeString(req.body.question || '', 1000);
  if (!question) return res.status(400).json({ error: 'question is required' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Invalid email address' });
  try {
    const id = Date.now();
    const record = { id: String(id), name, email, question, status: 'pending', askedAt: new Date().toISOString() };
    await redis.hset(`question:${id}`, record);
    await redis.zadd('question:index:all', { score: id, member: String(id) });
    await trackEvent('question_submitted');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/questions/answered', rateLimit(30, 60_000), async (req, res) => {
  if (!redis) return res.json({ questions: [] });
  try {
    const questions = await getQuestions('answered');
    res.json({ questions: questions.map(({ email, ...q }) => q) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/questions', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.json({ questions: [] });
  try {
    const filter = req.query.filter || 'all';
    const questions = await getQuestions(filter);
    res.json({ questions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/questions/answer', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!requireRedis(res)) return;
  const id = sanitizeString(String(req.body.id || ''), 20);
  const answer = sanitizeString(req.body.answer || '', 2000);
  if (!id || !answer) return res.status(400).json({ error: 'id and answer required' });
  try {
    const existing = await redis.hgetall(`question:${id}`);
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    await redis.hset(`question:${id}`, { ...existing, answer, status: 'answered', answeredAt: new Date().toISOString() });
    await redis.zadd('question:index:answered', { score: parseInt(id), member: id });
    if (req.body.notify !== false && existing.username) {
      sendPiNotification(existing.username, `📚 Your question has been answered on Chigalex1!`).catch(() => {});
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── ADMIN: MEMBERS ──
// ════════════════════════════════════════════
app.get('/admin/members', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.json({ count: 0, members: [] });
  try {
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const start = page * limit;
    const end = start + limit - 1;
    const usernames = await redis.zrange('member:index', start, end, { rev: true });
    const total = await redis.zcard('member:index');
    if (!usernames.length) return res.json({ count: total, members: [], page, limit });
    const pipeline = redis.pipeline();
    usernames.forEach(u => {
      pipeline.get(`member:${u}:status`);
      pipeline.get(`member:${u}:paidAt`);
      pipeline.get(`member:${u}:country`);
      pipeline.get(`member:${u}:lang`);
    });
    const results = await pipeline.exec();
    const members = usernames.map((u, i) => ({
      username: u,
      status: results[i * 4] || 'free',
      paidAt: results[i * 4 + 1],
      country: results[i * 4 + 2],
      lang: results[i * 4 + 3],
    }));
    res.json({ count: total, members, page, limit });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/set-membership', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!requireRedis(res)) return;
  const username = sanitizeString(req.body.username || '', 64);
  const status = req.body.status === 'free' ? 'free' : 'paid';
  if (!isValidUsername(username)) return res.status(400).json({ error: 'Invalid username' });
  try {
    await redis.set(`member:${username}:status`, status);
    if (status === 'paid') await redis.zadd('member:index', { score: Date.now(), member: username });
    res.json({ success: true, username, status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── ADVERTS ──
// ════════════════════════════════════════════
app.post('/adverts/apply', rateLimit(3, 60_000), async (req, res) => {
  if (!redis) return res.json({ success: true });
  const title = sanitizeString(req.body.title || '', 100);
  const desc = sanitizeString(req.body.desc || '', 200);
  const pi = sanitizeString(req.body.pi || '', 64);
  if (!title || !desc || !pi) return res.status(400).json({ error: 'title, desc and pi required' });
  const id = Date.now();
  try {
    await redis.hset(`advert:${id}`, {
      id: String(id), title, desc, pi,
      country: sanitizeString(req.body.country || '', 64),
      contact: sanitizeString(req.body.contact || '', 100),
      link: sanitizeString(req.body.link || '', 200),
      icon: sanitizeString(req.body.icon || '📣', 10),
      status: 'pending', submittedAt: new Date().toISOString()
    });
    await redis.zadd('advert:index:pending', { score: id, member: String(id) });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/adverts/pending', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.json({ adverts: [] });
  try {
    const ids = await redis.zrange('advert:index:pending', 0, -1, { rev: true });
    if (!ids.length) return res.json({ adverts: [], count: 0 });
    const pipeline = redis.pipeline();
    ids.forEach(id => pipeline.hgetall(`advert:${id}`));
    const adverts = (await pipeline.exec()).filter(Boolean);
    res.json({ adverts, count: adverts.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/adverts/approve', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  const id = sanitizeString(String(req.body.id || ''), 20);
  if (!id) return res.status(400).json({ error: 'id required' });
  try {
    const existing = await redis.hgetall(`advert:${id}`);
    if (!existing) return res.status(404).json({ error: 'Advert not found' });
    await redis.hset(`advert:${id}`, { ...existing, status: 'approved', approvedAt: new Date().toISOString() });
    await redis.zrem('advert:index:pending', id);
    await redis.zadd('advert:index:approved', { score: parseInt(id), member: id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/admin/adverts/:id', async (req, res) => {
  if (!validateAdminKey(req, res)) return;
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  const id = sanitizeString(req.params.id, 20);
  try {
    await redis.del(`advert:${id}`);
    await redis.zrem('advert:index:pending', id);
    await redis.zrem('advert:index:approved', id);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── AI CHATBOT PROXY ──
// ════════════════════════════════════════════
app.post('/ai/chat', rateLimit(20, 60_000), async (req, res) => {
  const message = sanitizeString(req.body.message || '', 500);
  const history = (req.body.history || []).slice(-10).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: sanitizeString(m.content || '', 500)
  }));
  if (!message) return res.status(400).json({ error: 'message required' });
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: `You are the Chigalex1 AI Assistant — expert on Pi Network for Africa. Help pioneers across all 54 African nations with: Pi registration, KYC, KYB, Map of Pi, GCV strategy ($314,159 per 1π already coded in blockchain), Pi security, and the Africa Pi GCV Industry Alliance. Keep answers under 120 words, practical and encouraging. Referral code: chigalex1. Visit minepi.com/chigalex1 to join free. Never ask for passphrases.`,
        messages: [...history, { role: 'user', content: message }]
      })
    });
    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Please try again.';
    res.json({ reply });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── MERCHANT DIRECTORY MODULE ──
// ════════════════════════════════════════════
require('./merchant-directory')(app, redis, rateLimit, sanitizeString, isValidUsername, validateAdminKey, trackEvent);

// ════════════════════════════════════════════
// ── REFERRAL SYSTEM MODULE ──
// ════════════════════════════════════════════
require('./referral-system')(app, redis, rateLimit, sanitizeString, isValidUsername, validateAdminKey, trackEvent);

// ════════════════════════════════════════════
// ── CATCH-ALL — MUST BE LAST ──
// ════════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ════════════════════════════════════════════
// ── START SERVER ──
// ════════════════════════════════════════════
const PRICING = {
  membership: 0.01,          // Membership fee in Pi
  advert: 0.01,              // Advert fee in Pi
  merchant: 0.01,
app.get('/api/pricing', (req, res) => {
  res.json({
    membership: PRICING.membership,
    advert: PRICING.advert,
    merchant: PRICING.merchant,
    currency: 'π',
    formatted: {
      membership: `${PRICING.membership}π`,
      advert: `${PRICING.advert}π`,
      merchant: `${PRICING.merchant}π`,
    }
  });
});

app.post('/ai/chat/free', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  app.post('/ai/chat/free', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

  const FREE_SYSTEM_PROMPT = `You are Chigalex1 AI — a Pi Network assistant for Africa.

IMPORTANT RULES FOR FREE TIER:
- Give PARTIAL answers only — maximum 3 sentences
- Never give step-by-step instructions or detailed guides
- Never reveal specific document requirements, fees, or technical steps
- Always end EVERY response with a membership call-to-action
- Be warm, helpful in tone, but deliberately incomplete in content
- You can confirm facts exist but not explain them fully
- Respond in whatever language the pioneer is writing in

TOPICS YOU CAN PARTIALLY ANSWER:
- What Pi Network is (general only)
- That KYC exists and is important (no steps)
- That GCV = $314,159 per Pi (no strategy)
- That Map of Pi exists (no how-to)
- That PiDEX exists (no usage guide)
- That Pi Launchpad exists (no participation guide)
- General encouragement to join Pi

ALWAYS END WITH (translate to their language):
"🔒 For the complete step-by-step guide, unlock full Chigalex1 membership — just a small one-time Pi fee. Message @chigalex1 on Pi Network to learn more!"

NEVER:
- Give complete how-to guides
- List specific steps
- Reveal exact document requirements
- Explain full GCV strategy
- Give full PiDEX or Launchpad walkthrough`;

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

const messages = [
      ...history.slice(-6).map(h => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200, // Deliberately short for free tier
      system: FREE_SYSTEM_PROMPT,
      messages
    });

    const reply = response.content[0]?.text || 'Please try again.';
    res.json({ reply, tier: 'free' });

  } catch (err) {
    console.error('Free AI error:', err);
    res.status(500).json({
      reply: 'I am having trouble connecting right now. Please try again shortly.',
      tier: 'free'
    });
  }
});

app.post('/ai/chat', async (req, res) => {
  const { message, history = [], username } = req.body;
  if (!message) return res.status(400).json({ error: 'No message' });

let isPaidMember = false;
  if (username) {
    try {
      const memberCheck = await redisClient.get(`member:${username}`);
      isPaidMember = memberCheck === 'paid';
    } catch (e) {
      console.error('Redis check error:', e);
    }
  }

if (!isPaidMember) {
    return res.status(403).json({
      reply: '🔒 This is a members-only feature. Unlock full Chigalex1 access with a small one-time Pi fee to chat with the full AI expert. Message @chigalex1 on Pi Network!',
      tier: 'free',
      upgrade: true
    });
  }

  const PAID_SYSTEM_PROMPT = `You are Chigalex1 AI — the expert Pi Network guide for Africa, created by Alexander (Chigalex1), Vice Chair of the Africa Pi GCV Industry Alliance.

YOUR EXPERTISE:
- Complete Pi Network knowledge: Registration, KYC, KYB, Security, Map of Pi
- GCV ($314,159 per 1π) — strategy, implementation, business adoption
- PiDEX — how to use Pi's decentralized exchange safely
- Pi Launchpad Testnet — staking, committing, participating in token launches
- Africa-specific guidance for all 54 nations
- KYC documents accepted in every African country
- Business Pi adoption strategies (GCV Phase 1 through Phase 5)
- Scam identification and security best practices

LANGUAGE:
- Detect and respond in the pioneer's language automatically
- Supported: English, Shona, Ndebele, isiZulu, isiXhosa, Afrikaans, Sesotho,
  Setswana, Chichewa, Português, Kiswahili, Amharic, Kinyarwanda, Luganda,
  Somali, Hausa, Yoruba, Igbo, Twi, Wolof, Français, Arabic, Tamazight,
  Lingala, Kikongo
- If unsure of language, respond in English but ask which language they prefer

YOUR PERSONALITY:
- Warm, encouraging, patient — many pioneers are new to crypto
- Use simple everyday analogies (markets, farming, community savings)
- Never talk down to pioneers — treat everyone as capable
- Celebrate pioneer milestones and progress
- Africa-proud — emphasize Africa's leadership in Pi adoption

RESPONSE STYLE:
- Give COMPLETE, detailed, step-by-step answers
- Use numbered steps for processes
- Use emojis to make content friendly and scannable
- Always provide context for WHY each step matters
- Include warnings where scams are common
- End with encouragement and next steps

IMPORTANT FACTS TO ALWAYS GET RIGHT:
- GCV = $314,159 per 1π (encoded in Pi blockchain)
- Chigalex1 membership = small one-time Pi fee
- Referral code = chigalex1
- Pi Browser required for Pi apps
- KYC required before Pi Wallet activation
- KYB required before business can accept Pi
- Map of Pi = mapofpi.com
- PiDEX launched March 12 2026
- Pi Launchpad launched Testnet March 2026
- SLICE is the second Launchpad test token
- Staking ≠ Committing (must do BOTH to earn Launchpad tokens)
- Pi Core Team: support@minepi.com

NEVER:
- Recommend buying Pi on external exchanges
- Give financial advice or price predictions beyond GCV
- Share anyone's private information
- Claim to be human`;

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client = new Anthropic.default({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

const messages = [
      ...history.slice(-20).map(h => ({
        role: h.role,
        content: h.content
      })),
      { role: 'user', content: message }
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000, // Full responses for paid members
      system: PAID_SYSTEM_PROMPT,
      messages
    });

    const reply = response.content[0]?.text || 'Please try again.';
    res.json({ reply, tier: 'paid' });

  } catch (err) {
    console.error('Paid AI error:', err);
    res.status(500).json({
      reply: 'I am having trouble connecting right now. Please try again shortly.',
      tier: 'paid'
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Chigalex1 running on port ${PORT}`);
  console.log(`   Health:     http://localhost:${PORT}/health`);
  console.log(`   AI Chat:    http://localhost:${PORT}/ai/chat`);
  console.log(`   Validation: http://localhost:${PORT}/validation-key.txt`);
  console.log(`   Privacy:    http://localhost:${PORT}/privacy`);
  console.log(`   Terms:      http://localhost:${PORT}/terms`);
});
