const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── REDIS ──
let redis = null;
try {
  const { Redis } = require('@upstash/redis');
  redis = Redis.fromEnv();
  console.log('✅ Redis connected');
} catch(e) {
  console.warn('⚠️  Redis not configured — add env vars in Render dashboard');
}

function requireRedis(res) {
  if (!redis) { res.status(503).json({ error: 'Redis not configured' }); return false; }
  return true;
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
// ── PRIVACY POLICY PAGE ──
// Required by Pi Developer Portal checklist
// ════════════════════════════════════════════
app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Privacy Policy – Chigalex1</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#0D0A1A;color:#F0EBF8;padding:40px 20px;max-width:800px;margin:0 auto;line-height:1.75;}
  h1{font-size:1.8rem;font-weight:800;color:#F5C518;margin-bottom:6px;}
  .sub{color:#9B59B6;font-size:.9rem;margin-bottom:32px;}
  h2{font-size:1.1rem;font-weight:700;color:#00D4AA;margin:28px 0 10px;}
  p{color:#B8A8D8;font-size:.93rem;margin-bottom:12px;}
  ul{color:#B8A8D8;font-size:.93rem;padding-left:20px;margin-bottom:12px;}
  ul li{margin-bottom:6px;}
  .pi{color:#F5C518;font-weight:700;}
  .warn{color:#FF7043;}
  a{color:#9B59B6;}
  .back{display:inline-block;margin-top:32px;background:linear-gradient(135deg,#7B2D8B,#9B59B6);
    color:#fff;padding:10px 22px;border-radius:100px;text-decoration:none;font-weight:700;font-size:.9rem;}
  .logo{font-size:2rem;margin-bottom:8px;}
</style>
</head>
<body>
  <div class="logo">π</div>
  <h1>Privacy Policy</h1>
  <p class="sub">Chigalex1 – Africa Pi Network Education Hub · Last updated: May 2026</p>

  <h2>1. Who We Are</h2>
  <p><strong class="pi">Chigalex1</strong> is an independent educational platform and community DApp created to help pioneers and businesses across Africa register on Pi Network, complete KYC and KYB verification, and list on Map of Pi. Chigalex1 is operated under the Africa Pi GCV Industry Alliance and is <span class="warn">not affiliated with Pi Network or SocialChain Inc.</span></p>

  <h2>2. Information We Collect</h2>
  <p>When you use Chigalex1, we may collect the following information:</p>
  <ul>
    <li><strong>Pi Username</strong> — collected when you authenticate via Pi Network login to verify membership status.</li>
    <li><strong>Payment Transaction ID (txid)</strong> — collected when you pay the one-time membership fee via Pi Network to confirm your payment.</li>
    <li><strong>Name and Email (optional)</strong> — collected only if you voluntarily submit a question through the Ask the Administrator feature.</li>
    <li><strong>Questions submitted</strong> — stored to allow the administrator to publish answers for the community.</li>
  </ul>
  <p>We do <strong>not</strong> collect passwords, passphrases, national ID information, financial data, or any sensitive personal information beyond what is listed above.</p>

  <h2>3. How We Use Your Information</h2>
  <ul>
    <li>To verify your one-time membership payment and grant access to training content.</li>
    <li>To respond to questions submitted through the community Q&amp;A feature.</li>
    <li>To improve the educational content and user experience of Chigalex1.</li>
  </ul>
  <p>We do <strong>not</strong> sell, rent, share, or trade your personal information with any third party for commercial purposes.</p>

  <h2>4. Data Storage</h2>
  <p>Membership records and community questions are stored securely using Upstash Redis, a cloud database service. Data is stored with industry-standard encryption in transit and at rest. Only the Chigalex1 administrator has access to stored data.</p>

  <h2>5. Pi Network Authentication</h2>
  <p>Chigalex1 uses the official Pi Network SDK for user authentication and payment processing. When you log in with Pi, your authentication is handled entirely by Pi Network's secure systems. Chigalex1 only receives your Pi username and payment confirmation — we never receive or store your Pi passphrase or private keys.</p>
  <p><strong class="warn">Never share your 24-word Pi passphrase with anyone — including Chigalex1.</strong></p>

  <h2>6. Cookies and Local Storage</h2>
  <p>Chigalex1 does not use tracking cookies. We may use browser session storage to maintain your login state during a session. No persistent tracking is performed.</p>

  <h2>7. Children's Privacy</h2>
  <p>Chigalex1 is intended for users aged 18 and above, in line with Pi Network's terms of service. We do not knowingly collect information from minors.</p>

  <h2>8. Your Rights</h2>
  <p>You have the right to request deletion of any personal data we hold about you. To make such a request, submit a question through the Ask the Administrator feature with the subject "Data Deletion Request" and we will process it within 30 days.</p>

  <h2>9. Third-Party Links</h2>
  <p>Chigalex1 contains links to external sites including minepi.com and mapofpi.com. We are not responsible for the privacy practices of these external sites. Please review their respective privacy policies.</p>

  <h2>10. Changes to This Policy</h2>
  <p>We may update this Privacy Policy from time to time. Changes will be reflected with an updated date at the top of this page. Continued use of Chigalex1 after changes constitutes acceptance of the updated policy.</p>

  <h2>11. Contact</h2>
  <p>For any privacy-related questions or concerns, please submit a question through the Chigalex1 Ask the Administrator feature at <a href="/">chigalex1-backend.onrender.com</a> or contact us through the Africa Pi GCV Industry Alliance community channels.</p>

  <a href="/" class="back">← Back to Chigalex1</a>
</body>
</html>`);
});

// ════════════════════════════════════════════
// ── TERMS OF SERVICE PAGE ──
// Required by Pi Developer Portal checklist
// ════════════════════════════════════════════
app.get('/terms', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Terms of Service – Chigalex1</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:Arial,sans-serif;background:#0D0A1A;color:#F0EBF8;padding:40px 20px;max-width:800px;margin:0 auto;line-height:1.75;}
  h1{font-size:1.8rem;font-weight:800;color:#F5C518;margin-bottom:6px;}
  .sub{color:#9B59B6;font-size:.9rem;margin-bottom:32px;}
  h2{font-size:1.1rem;font-weight:700;color:#00D4AA;margin:28px 0 10px;}
  p{color:#B8A8D8;font-size:.93rem;margin-bottom:12px;}
  ul{color:#B8A8D8;font-size:.93rem;padding-left:20px;margin-bottom:12px;}
  ul li{margin-bottom:6px;}
  .pi{color:#F5C518;font-weight:700;}
  .warn{color:#FF7043;}
  a{color:#9B59B6;}
  .back{display:inline-block;margin-top:32px;background:linear-gradient(135deg,#7B2D8B,#9B59B6);
    color:#fff;padding:10px 22px;border-radius:100px;text-decoration:none;font-weight:700;font-size:.9rem;}
  .logo{font-size:2rem;margin-bottom:8px;}
  .highlight{background:rgba(245,197,24,0.1);border:1px solid rgba(245,197,24,0.3);
    border-radius:10px;padding:14px 18px;margin:16px 0;}
</style>
</head>
<body>
  <div class="logo">π</div>
  <h1>Terms of Service</h1>
  <p class="sub">Chigalex1 – Africa Pi Network Education Hub · Last updated: May 2026</p>

  <div class="highlight">
    <p style="color:#F5C518;font-weight:700;">Important Notice</p>
    <p>Chigalex1 is an <strong>independent community educational platform</strong> and is not affiliated with, endorsed by, or officially connected to Pi Network or SocialChain Inc. By using Chigalex1, you agree to these Terms of Service.</p>
  </div>

  <h2>1. Acceptance of Terms</h2>
  <p>By accessing and using Chigalex1 ("the App"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the App. These terms apply to all users across all 54 African countries and globally.</p>

  <h2>2. Description of Service</h2>
  <p><strong class="pi">Chigalex1</strong> is an educational DApp that provides:</p>
  <ul>
    <li>Step-by-step training on Pi Network registration using referral code <strong class="pi">chigalex1</strong></li>
    <li>Guides on individual KYC (Know Your Customer) verification</li>
    <li>Guides on business KYB (Know Your Business) verification</li>
    <li>Instructions for listing on Map of Pi</li>
    <li>Community Q&amp;A administered by the Africa Pi GCV Industry Alliance</li>
    <li>Security awareness training for Pi Network pioneers across Africa</li>
  </ul>

  <h2>3. Membership Fee</h2>
  <p>Access to Chigalex1 training content requires a <strong>one-time membership fee of 1 Pi (1π)</strong>. This fee:</p>
  <ul>
    <li>Is a one-time payment granting lifetime access to all Chigalex1 training content</li>
    <li>Is paid via the official Pi Network payment system</li>
    <li>Is an independent community app access fee and is <span class="warn">NOT a charge by Pi Network or SocialChain Inc.</span></li>
    <li>Is non-refundable once access to training content has been granted</li>
    <li>May be modified by the administrator — existing members retain their access</li>
  </ul>

  <h2>4. Referral Code</h2>
  <p>All new Pi Network registrations initiated through Chigalex1 are encouraged to use referral code <strong class="pi">chigalex1</strong>. Use of this referral code connects new pioneers to the Chigalex1 security circle and supports the Africa Pi GCV Industry Alliance education network.</p>

  <h2>5. Disclaimer of Affiliation</h2>
  <p>Chigalex1 is <span class="warn">NOT affiliated with, endorsed by, or officially connected to Pi Network, SocialChain Inc., or any of their subsidiaries</span>. All Pi Network trademarks, logos, and brand names (including "Pi", "Pi Network", "Pi Browser", "Map of Pi") belong to their respective owners.</p>
  <p>The Africa Pi GCV Industry Alliance is an independent community organization and does not represent the official position of Pi Network or SocialChain Inc. on any matter including GCV (Global Consensus Value).</p>

  <h2>6. Educational Content</h2>
  <p>All training materials, guides, and information on Chigalex1 are provided for educational purposes only. While we strive for accuracy:</p>
  <ul>
    <li>Pi Network policies, procedures, and features may change at any time</li>
    <li>Always verify information against official Pi Network communications at minepi.com</li>
    <li>Chigalex1 accepts no liability for decisions made based on information provided in the App</li>
    <li>GCV-related content reflects community positions and not official Pi Network policy</li>
  </ul>

  <h2>7. User Conduct</h2>
  <p>By using Chigalex1, you agree to:</p>
  <ul>
    <li>Provide accurate information when registering or submitting questions</li>
    <li>Not use the App for any unlawful purpose or to spread misinformation about Pi Network</li>
    <li>Not attempt to impersonate Pi Network staff, Chigalex1 administrators, or other users</li>
    <li>Not share your Pi passphrase with anyone — including Chigalex1</li>
    <li>Respect other community members in the Q&amp;A section</li>
  </ul>

  <h2>8. Security Warning</h2>
  <p><strong class="warn">Chigalex1 will NEVER ask for your 24-word Pi passphrase.</strong> Your passphrase is the master key to your Pi wallet. Anyone — including anyone claiming to represent Chigalex1 or the Africa Pi GCV Industry Alliance — who asks for your passphrase is attempting fraud. Report such incidents to support@minepi.com.</p>

  <h2>9. Intellectual Property</h2>
  <p>The Chigalex1 name, logo, and original educational content are the property of the Chigalex1 creator. Pi Network trademarks remain the property of SocialChain Inc. Educational content may not be reproduced for commercial purposes without permission.</p>

  <h2>10. Limitation of Liability</h2>
  <p>Chigalex1 and the Africa Pi GCV Industry Alliance are not liable for any direct, indirect, incidental, or consequential damages arising from use of this App, including but not limited to loss of Pi, failed KYC/KYB applications, or reliance on educational content that may be outdated.</p>

  <h2>11. Availability</h2>
  <p>Chigalex1 is available to users across all 54 African countries and globally. The App is hosted on Render's cloud platform. We do not guarantee uninterrupted availability — the free hosting tier may result in brief delays when the server restarts.</p>

  <h2>12. Changes to Terms</h2>
  <p>We reserve the right to modify these Terms of Service at any time. Changes will be reflected with an updated date at the top of this page. Continued use of Chigalex1 after any changes constitutes acceptance of the updated terms.</p>

  <h2>13. Governing</h2>
  <p>These terms are governed by the principles of fairness and community benefit that underpin the Africa Pi GCV Industry Alliance mission to make Pi digital currency accessible to every African pioneer and business, daily, using a smartphone.</p>

  <h2>14. Contact</h2>
  <p>For any questions about these Terms of Service, please submit a question through the Chigalex1 Ask the Administrator feature at <a href="/">chigalex1-backend.onrender.com</a></p>

  <a href="/" class="back">← Back to Chigalex1</a>
</body>
</html>`);
});

// ════════════════════════════════════════════
// ── MEMBERSHIP ROUTES ──
// ════════════════════════════════════════════
app.get('/check-membership', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  if (!redis) return res.json({ username, paid: false, status: 'free' });
  try {
    const status = await redis.get(`member:${username}:status`);
    res.json({ username, paid: status === 'paid', status: status || 'free' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/approve-payment', async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY || ''}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    console.log('✅ Payment approved:', paymentId);
    res.json({ success: true, data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/complete-payment', async (req, res) => {
  const { paymentId, txid, username } = req.body;
  if (!paymentId || !txid || !username) {
    return res.status(400).json({ error: 'paymentId, txid and username required' });
  }
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });
    const data = await response.json();
    console.log('✅ Payment completed:', username, txid);
    if (redis) {
      await redis.set(`member:${username}:status`, 'paid');
      await redis.set(`member:${username}:txid`, txid);
      await redis.set(`member:${username}:paidAt`, new Date().toISOString());
    }
    res.json({ success: true, username, status: 'paid' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── FAQ ROUTES ──
// ════════════════════════════════════════════
app.get('/faqs', async (req, res) => {
  if (!redis) return res.json({ faqs: [] });
  try {
    const data = await redis.get('chigalex1:faqs');
    res.json({ faqs: data || [] });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/faqs', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    const { question, answer, lang } = req.body;
    const existing = await redis.get('chigalex1:faqs') || [];
    existing.push({
      id: Date.now(), question, answer,
      lang: lang || 'en', addedAt: new Date().toISOString()
    });
    await redis.set('chigalex1:faqs', existing);
    res.json({ success: true, count: existing.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/admin/faqs/:id', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    const id = parseInt(req.params.id);
    const existing = await redis.get('chigalex1:faqs') || [];
    const filtered = existing.filter(f => f.id !== id);
    await redis.set('chigalex1:faqs', filtered);
    res.json({ success: true, count: filtered.length });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── QUESTION ROUTES ──
// ════════════════════════════════════════════
app.post('/questions', async (req, res) => {
  if (!redis) return res.json({ success: true, note: 'Redis not configured' });
  try {
    const { name, email, question } = req.body;
    const existing = await redis.get('chigalex1:questions') || [];
    existing.push({
      id: Date.now(), name, email, question,
      status: 'pending', askedAt: new Date().toISOString()
    });
    await redis.set('chigalex1:questions', existing);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/questions/answered', async (req, res) => {
  if (!redis) return res.json({ questions: [] });
  try {
    const all = await redis.get('chigalex1:questions') || [];
    res.json({ questions: all.filter(q => q.status === 'answered') });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/admin/questions', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!redis) return res.json({ questions: [] });
  try {
    const all = await redis.get('chigalex1:questions') || [];
    res.json({ questions: all });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/questions/answer', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!redis) return res.status(503).json({ error: 'Redis not configured' });
  try {
    const { id, answer } = req.body;
    const all = await redis.get('chigalex1:questions') || [];
    const updated = all.map(q =>
      q.id === id
        ? { ...q, answer, status: 'answered', answeredAt: new Date().toISOString() }
        : q
    );
    await redis.set('chigalex1:questions', updated);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── ADMIN: MEMBERS ──
// ════════════════════════════════════════════
app.get('/admin/members', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!redis) return res.json({ count: 0, members: [] });
  try {
    const keys = await redis.keys('member:*:status');
    const members = keys.map(k => k.replace('member:', '').replace(':status', ''));
    res.json({ count: members.length, members });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/admin/set-membership', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!requireRedis(res)) return;
  try {
    const { username, status } = req.body;
    await redis.set(`member:${username}:status`, status || 'paid');
    res.json({ success: true, username, status: status || 'paid' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ════════════════════════════════════════════
// ── CATCH-ALL: serve index.html ──
// ════════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── START ──
app.listen(PORT, () => {
  console.log(`🚀 Chigalex1 running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Privacy: http://localhost:${PORT}/privacy`);
  console.log(`   Terms:   http://localhost:${PORT}/terms`);
});
