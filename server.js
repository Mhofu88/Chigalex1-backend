const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple LOCAL admin - No GitHub fetch
app.get(['/admin.html','/admin'], (req,res)=>{
  res.set({'Cache-Control':'no-store'});
  res.sendFile(path.join(__dirname,'public','admin.html'));
});

// EXTRA ROUTERS (safe load - no crash if file missing)
function safeRequire(p){
  try { return require(p); } catch(e){ console.warn(`⚠️ Skipping ${p}: ${e.message}`); return null; }
}
const subscriptionsMod = safeRequire("./subscriptions-admin");
const listingsRouter = safeRequire("./listings");
const gcvRouter = safeRequire("./bizapp-gcv-admin");
const pkgRouter = safeRequire("./bizapp-packages-admin");
const paymentsRouter = safeRequire("./payments");
const authMod = safeRequire("./auth");

if(gcvRouter) app.use("/", gcvRouter);
if(pkgRouter) app.use("/", pkgRouter);
if(subscriptionsMod && subscriptionsMod.router) app.use("/", subscriptionsMod.router);
if(listingsRouter) app.use("/listings", listingsRouter);
if(paymentsRouter) app.use("/payments", paymentsRouter);
if(authMod && authMod.router) app.use("/auth", authMod.router);

console.log("✅ Routers loaded");

// ── PI NODE SDK ──
let pi = null;
try {
  const PiNetwork = require('pi-backend');
  pi = new PiNetwork(process.env.PI_API_KEY, process.env.APP_WALLET_SEED);
  console.log('✅ Pi SDK loaded');
} catch(e){
  console.warn('⚠️ Pi SDK not loaded:', e.message);
}

// ── REDIS ──
let redis = null;
try {
  const { Redis } = require('@upstash/redis');
  redis = Redis.fromEnv();
  console.log('✅ Redis connected');
} catch (e) {
  console.warn('⚠️ Redis not configured');
}

function requireRedis(res) {
  if (!redis) { res.status(503).json({ error: 'Redis not configured' }); return false; }
  return true;
}

// ── HELPERS ──
function sanitizeString(str, maxLen = 500) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[<>]/g, '');
}
function isValidUsername(u) {
  return typeof u === 'string' && /^[a-zA-Z0-9_]{1,64}$/.test(u.trim());
}
function validateAdminKey(req, res) {
  if (!process.env.ADMIN_KEY || req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
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
    if (entry.count > maxRequests) return res.status(429).json({ error: 'Too many requests' });
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore) if (now > entry.resetAt) rateLimitStore.delete(ip);
}, 5 * 60_000);

// ════════════════════════════════════════════
// ── PI PAYMENTS - FIXED - MUST BE HERE ──
// ════════════════════════════════════════════
app.get('/pi-payments-status', (req, res) => {
  res.json({
    pi_api_key_set: !!process.env.PI_API_KEY,
    pi_api_key_prefix: process.env.PI_API_KEY ? process.env.PI_API_KEY.slice(0,8)+'...' : 'NOT SET',
    app_wallet_seed_set: !!process.env.APP_WALLET_SEED,
    node_env: process.env.NODE_ENV || 'not set',
    time: new Date().toISOString()
  });
});

app.post(['/approve-payment', '/api/payments/approve'], rateLimit(20, 60_000), async (req, res) => {
  const paymentId = req.body.paymentId || req.body.payment_id;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY not set in Render Environment' });
  try {
    console.log(`🔄 Approving ${paymentId}`);
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('Pi approve:', response.status, JSON.stringify(data).slice(0,300));
    if (!response.ok) return res.status(response.status).json({ error: 'Pi API approve failed', pi_response: data });
    res.json({ success: true, approved: true, data });
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post(['/complete-payment', '/api/payments/complete'], rateLimit(20, 60_000), async (req, res) => {
  const paymentId = req.body.paymentId || req.body.payment_id;
  const txid = req.body.txid;
  const username = sanitizeString(req.body.username || 'Chigalex1', 64);
  if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY not set' });
  try {
    console.log(`🔄 Completing ${paymentId} txid ${txid}`);
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid })
    });
    const data = await response.json();
    console.log('Pi complete:', response.status, JSON.stringify(data).slice(0,300));
    if (!response.ok) return res.status(response.status).json({ error: 'Pi API complete failed', pi_response: data });
    if (redis) {
      try {
        const now = new Date().toISOString();
        await redis.set(`member:${username}:status`, 'paid');
        await redis.set(`member:${username}:txid`, txid);
        await redis.set(`member:${username}:paidAt`, now);
        await redis.zadd('member:index', { score: Date.now(), member: username });
      } catch (err) { console.warn('Redis save failed:', err.message); }
    }
    res.json({ success: true, completed: true, username, txid, data });
  } catch (e) {
    console.error('Complete error:', e);
    res.status(500).json({ error: e.message });
  }
});

console.log('✅ Pi Payments FIX loaded - /approve-payment, /complete-payment');

// ════════════════════════════════════════
// V5 FINAL COMBINED - STATUS + DIRECT + TRANSACTIONS
// Paste this as ONE block replacing ALL A2U code!
// ════════════════════════════════════════

// STATUS - Blockchain count
app.get('/api/testnet/a2u/status', async (req, res) => {
  res.setHeader('Content-Type','application/json');
  try {
    const StellarSdk = require('stellar-sdk');
    let appWallet = 'NOT SET';
    let balances = [];
    let uniqueWalletsSet = new Set();
    let recentPayments = [];
    if (process.env.APP_WALLET_SEED_TESTNET) {
      try {
        const kp = StellarSdk.Keypair.fromSecret(process.env.APP_WALLET_SEED_TESTNET);
        appWallet = kp.publicKey();
        const server = new StellarSdk.Server('https://api.testnet.minepi.com');
        try { const account = await server.loadAccount(appWallet); balances = account.balances; } catch(e){ balances=[{error:e.message}]; }
        try {
          const payments = await server.payments().forAccount(appWallet).limit(100).order('desc').call();
          recentPayments = payments.records.filter(p=>p.type==='payment'&&p.from===appWallet).map(p=>({to:p.to,amount:p.amount,at:p.created_at}));
          recentPayments.forEach(p=>{ if(p.to&&p.to!==appWallet) uniqueWalletsSet.add(p.to); });
        } catch(e){}
      } catch(e){ appWallet='Seed error: '+e.message; }
    }
    const count = uniqueWalletsSet.size;
    res.json({
      testnet_key_set: !!process.env.PI_API_KEY_TESTNET,
      testnet_seed_set: !!process.env.APP_WALLET_SEED_TESTNET,
      app_wallet_testnet: appWallet,
      balances, completed_a2u_count: count,
      unique_wallets_blockchain: Array.from(uniqueWalletsSet),
      recent_payments: recentPayments.slice(0,15),
      need:5, remaining: Math.max(0,5-count),
      version:'V5 final combined', note: count>=5 ? '🎉 5/5 COMPLETE!' : `✅ ${count}/5 done!`
    });
  } catch(e){ res.status(200).json({ error:'Status error: '+e.message, completed_a2u_count:0, version:'V5 error' }); }
});

// DIRECT - Blockchain send 1 Test-Pi
app.post('/api/testnet/a2u/direct', rateLimit(20, 60_000), async (req, res) => {
  res.setHeader('Content-Type','application/json');
  const { uid, username, walletAddress, amount } = req.body;
  const finalUsername = (username || 'testuser').toString().slice(0,64);
  const finalAmount = (parseFloat(amount) || 1).toString();
  const destAddress = walletAddress || req.body.address;
  const finalUid = uid || 'direct-'+Date.now();
  if (!destAddress || !destAddress.startsWith('G')) {
    return res.status(400).json({ error: 'walletAddress required (G...)' });
  }
  const seed = process.env.APP_WALLET_SEED_TESTNET;
  if (!seed) return res.status(500).json({ error: 'APP_WALLET_SEED_TESTNET not set' });
  try {
    console.log(`🔄 DIRECT V5: ${finalAmount} from GABWR... to ${destAddress} user ${finalUsername}`);
    const StellarSdk = require('stellar-sdk');
    const server = new StellarSdk.Server('https://api.testnet.minepi.com');
    const sourceKeys = StellarSdk.Keypair.fromSecret(seed);
    const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
    const fee = await server.fetchBaseFee();
    // Try Pi Testnet passphrase (required for Pi network)
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: fee.toString(),
      networkPassphrase: 'Pi Testnet'
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: destAddress,
      asset: StellarSdk.Asset.native(),
      amount: finalAmount
    }))
    .setTimeout(30)
    .build();
    tx.sign(sourceKeys);
    const result = await server.submitTransaction(tx);
    console.log('Direct V5 success:', result.hash);
    res.json({ success:true, txHash:result.hash, from:sourceKeys.publicKey(), to:destAddress, amount:finalAmount, ledger: result.ledger });
  } catch (e) {
    console.error('Direct V5 error:', e.message, e.response?.data);
    // Fallback with TESTNET passphrase
    try {
      const StellarSdk = require('stellar-sdk');
      const server = new StellarSdk.Server('https://api.testnet.minepi.com');
      const sourceKeys = StellarSdk.Keypair.fromSecret(seed);
      const sourceAccount = await server.loadAccount(sourceKeys.publicKey());
      const fee = await server.fetchBaseFee();
      const tx2 = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: fee.toString(),
        networkPassphrase: StellarSdk.Networks.TESTNET
      })
      .addOperation(StellarSdk.Operation.payment({ destination: destAddress, asset: StellarSdk.Asset.native(), amount: finalAmount }))
      .setTimeout(30).build();
      tx2.sign(sourceKeys);
      const result2 = await server.submitTransaction(tx2);
      return res.json({ success:true, txHash:result2.hash, from:sourceKeys.publicKey(), to:destAddress, amount:finalAmount, note:'Used TESTNET passphrase fallback' });
    } catch (e2) {
      res.status(500).json({ error: e2.message || e.message, details: e.response?.data || e2.response?.data || e.message });
    }
  }
});

app.get('/api/testnet/a2u/transactions', async (req, res) => {
  try {
    const seed = process.env.APP_WALLET_SEED_TESTNET;
    if (!seed) return res.status(500).json({ error: 'No testnet seed' });
    const StellarSdk = require('stellar-sdk');
    const server = new StellarSdk.Server('https://api.testnet.minepi.com');
    const sourceKeys = StellarSdk.Keypair.fromSecret(seed);
    const account = await server.loadAccount(sourceKeys.publicKey());
    const payments = await server.payments().forAccount(sourceKeys.publicKey()).limit(15).order('desc').call();
    res.json({ app_wallet: sourceKeys.publicKey(), balances: account.balances, recent: payments.records.map(p=>({type:p.type, from:p.from, to:p.to, amount:p.amount, at:p.created_at, tx:p.transaction_hash})) });
  } catch(e){ res.status(500).json({ error: e.message }); }
});

console.log('✅ A2U V5 FINAL COMBINED loaded - status + direct + transactions');
    
// ════════════════════════════════════════════
// ── REST OF YOUR ORIGINAL SERVER.JS BELOW ──
// (Keep everything else as it was - pricing, ambassador, etc)
// For brevity, we include only essential health + catch-all
// Your original file's remaining 1500 lines can stay - this patch adds routes early so they work!
// ════════════════════════════════════════════

// Load original rest of server.js dynamically to keep your other features
try {
  const fs = require('fs');
  const originalPath = path.join(__dirname, 'server-original.js');
  if (fs.existsSync(originalPath)) {
    console.log('Loading original server routes from server-original.js');
    require(originalPath);
  }
} catch(e) { console.warn('No server-original.js, using minimal routes'); }

// Minimal essential routes if original not loaded
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString(), pi_payments: 'fixed' }));
app.get('/api/translations/list', async (req, res) => {
  // Return 25 languages list
  res.json({ 
    count: 25,
    languages: ["en","sn","nd","zu","xh","af","st","tn","pt","ny","sw","am","rw","lg","so","ha","yo","ig","tw","wo","fr","ar","ber","ln","kg"]
  });
});

// Catch-all - serve index.html for SPA
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) res.status(404).send('Not found');
  });
});
const fs = require('fs');
const path = require('path');

app.get('/api/translations/:lang', (req, res) => {
  const lang = req.params.lang;
  const file = path.join(__dirname, 'locales', `${lang}.json`);
  const fallback = path.join(__dirname, 'locales', 'en.json');
  try {
    const target = fs.existsSync(file) ? file : fallback;
    res.json(JSON.parse(fs.readFileSync(target, 'utf8')));
  } catch (e) {
    res.status(500).json({error: 'Translation not found'});
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Chigalex1 FIXED on port ${PORT}`);
  console.log(`   Pi status: http://localhost:${PORT}/pi-payments-status`);
});
