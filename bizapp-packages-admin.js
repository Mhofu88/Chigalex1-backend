
const express = require('express');
const router = express.Router();

// In-memory fallback, Redis-backed
const DEFAULT_PKGS = [
  { id: "starter", name: "Starter", price: 250, tag: "Launch Fast" },
  { id: "business", name: "Business", price: 599, tag: "POPULAR" },
  { id: "pro", name: "Pro", price: 999, tag: "ELITE" }
];

let redisClient = null;
try {
  const { Redis } = require('@upstash/redis');
  redisClient = Redis.fromEnv();
} catch(e) {}

async function getPackages() {
  if (!redisClient) return DEFAULT_PKGS;
  try {
    const data = await redisClient.get('bizapp:packages');
    if (data) {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed;
    }
    return DEFAULT_PKGS;
  } catch(e) {
    return DEFAULT_PKGS;
  }
}

async function setPackages(pkgs) {
  if (!redisClient) throw new Error('Redis not configured');
  await redisClient.set('bizapp:packages', JSON.stringify(pkgs));
  return pkgs;
}

// PUBLIC - BizAppZW frontend loads this - NO BLINK fallback handled frontend
router.get('/api/bizapp/packages', async (req, res) => {
  try {
    const pkgs = await getPackages();
    res.set({ 'Cache-Control': 'no-store' });
    res.json({ packages: pkgs });
  } catch(e) {
    res.json({ packages: DEFAULT_PKGS });
  }
});

// ADMIN - Get current packages
router.get('/api/admin/bizapp/packages', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const pkgs = await getPackages();
  res.json({ packages: pkgs });
});

// ADMIN - Update packages LIVE
router.post('/api/admin/bizapp/packages', async (req, res) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const { packages } = req.body;
  if (!Array.isArray(packages) || packages.length < 3) return res.status(400).json({ error: 'packages array required (3 items)' });
  
  // Validate prices are numbers >0
  for (const p of packages) {
    if (typeof p.price !== 'number' || p.price <= 0) return res.status(400).json({ error: `Invalid price for ${p.id}` });
  }
  
  try {
    await setPackages(packages);
    res.json({ success: true, message: `✅ Packages LIVE: $${packages[0].price}/$${packages[1].price}/$${packages[2].price} - BizAppZW updated instantly!`, packages });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ADMIN - Quick update single price
router.post('/admin/update-package-price', async (req, res) => {
  const { admin_username, id, price } = req.body;
  const ADMIN_ACCOUNTS = ['chigalex1','admin2','dorisyin','chigodop'];
  if (!ADMIN_ACCOUNTS.includes((admin_username||'').toLowerCase())) return res.status(403).json({ error: 'Admin required' });
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice <=0) return res.status(400).json({ error: 'Invalid price' });
  
  const current = await getPackages();
  const updated = current.map(p => p.id === id ? { ...p, price: numPrice } : p);
  try {
    await setPackages(updated);
    res.json({ success: true, message: `✅ ${id} price → $${numPrice} LIVE!`, packages: updated });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
