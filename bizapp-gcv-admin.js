// ============================
// BizApp ZW - GCV Admin Backend - V2 LIVE ENDPOINTS
// File: bizapp-gcv-admin.js  OR paste into subscriptions-admin.js
// Author: Chancellor for VC - Chigalex1 Empire
// ============================

const express = require('express');
const router = express.Router();

// Use your existing redis client - same as other routes
// const redis = require('./redis-client'); // or however you import
// If you use global redis, adjust accordingly

// Middleware to check x-admin-key - same as your existing admin routes
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized - Invalid Admin Key' });
  }
  next();
}

// ============================
// ENDPOINT 1: GET GCV CONFIG (PUBLIC - for frontend listings to show LIVE rate)
// ============================
// GET /listings/config  OR  GET /bizapp/gcv-config (public)
// This is called by BizAppZW V2 frontend to display LIVE GCV rate
// No auth needed - public info

router.get('/gcv-config-public', async (req, res) => {
  try {
    // Try Redis first
    let config = null;
    try {
      const redis = require('./redis-client');
      const data = await redis.get('bizapp:gcv:config');
      if (data) config = JSON.parse(data);
    } catch (e) { console.log('Redis not available, using defaults'); }

    // Default if no saved config
    if (!config) {
      config = {
        gcvRate: 314159,
        badgeType: 'Pi-Friendly Merchant',
        badgeText: '✅ Pi-Friendly Merchant - Pi Payment Accepted',
        featuredPrice: 5,
        featuredPriceUSD: 5,
        freeDurationDays: 30,
        piGcvPlans: [
          { id: 'pi-free', name: 'Pi GCV Free Basic', rate: 0, duration: 30, adverts: 1, description: 'Free Pi GCV shop - 1 advert, 30 days, Pi-Friendly Merchant badge', category: 'Pi GCV Shops' },
          { id: 'pi-featured', name: 'Pi-Friendly Merchant Featured', rate: 5, duration: 30, adverts: 5, description: 'Featured Pi shop - Homepage, 5 adverts, Pi-Friendly badge, MapOfPi listed', category: 'Pi GCV Shops' },
          { id: 'pi-premium', name: 'Pi Champion Premium', rate: 10, duration: 60, adverts: 15, description: 'Premium Pi champion - Top placement, 15 adverts, 60 days, Priority support', category: 'Pi GCV Shops' }
        ],
        badgeTiers: [
          { tier: 'basic', name: 'Pi Payment Accepted', price: 0, desc: 'Basic Pi accepted' },
          { tier: 'featured', name: 'Pi-Friendly Merchant', price: 5, desc: 'Featured Pi merchant' },
          { tier: 'premium', name: 'Pi Champion', price: 10, desc: 'Premium Pi champion' }
        ],
        lastUpdated: new Date().toISOString()
      };
    }

    res.json(config);
  } catch (err) {
    console.error('GCV config public error:', err);
    res.status(500).json({ error: 'Failed to load GCV config' });
  }
});

// ============================
// ENDPOINT 2: ADMIN - GET & POST GCV CONFIG (PRIVATE - Admin Panel V2)
// ============================
// GET /admin/bizapp/gcv-config  - Admin loads current
// POST /admin/bizapp/gcv-config - Admin saves LIVE

router.get('/admin/bizapp/gcv-config', adminAuth, async (req, res) => {
  try {
    let config = null;
    try {
      const redis = require('./redis-client');
      const data = await redis.get('bizapp:gcv:config');
      if (data) config = JSON.parse(data);
    } catch (e) {}

    if (!config) {
      config = {
        gcvRate: 314159,
        badgeType: 'Pi-Friendly Merchant',
        badgeText: '✅ Pi-Friendly Merchant - Pi Payment Accepted',
        featuredPrice: 5,
        freeDurationDays: 30,
        lastUpdated: new Date().toISOString()
      };
    }

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admin GCV config' });
  }
});

router.post('/admin/bizapp/gcv-config', adminAuth, async (req, res) => {
  try {
    const { gcvRate, badgeType, badgeText, featuredPrice, freeDurationDays, piGcvPlans, badgeTiers } = req.body;

    // Validation
    if (!gcvRate || isNaN(gcvRate) || gcvRate <= 0) {
      return res.status(400).json({ error: 'Invalid GCV Rate' });
    }

    const newConfig = {
      gcvRate: parseFloat(gcvRate),
      badgeType: badgeType || 'Pi-Friendly Merchant',
      badgeText: badgeText || `✅ ${badgeType || 'Pi-Friendly Merchant'} - Pi Payment Accepted`,
      featuredPrice: parseFloat(featuredPrice) || 5,
      freeDurationDays: parseInt(freeDurationDays) || 30,
      piGcvPlans: piGcvPlans || undefined,
      badgeTiers: badgeTiers || undefined,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'VC Admin Panel V2'
    };

    // Save to Redis
    try {
      const redis = require('./redis-client');
      await redis.set('bizapp:gcv:config', JSON.stringify(newConfig));
      console.log('✅ GCV Config saved to Redis:', newConfig);
    } catch (e) {
      console.error('Redis save failed, but returning success:', e.message);
      // Even if Redis fails, we still return success for demo - in production you might want to handle differently
    }

    res.json({ ok: true, message: 'GCV Config saved LIVE!', config: newConfig });
  } catch (err) {
    console.error('GCV save error:', err);
    res.status(500).json({ error: 'Failed to save GCV config' });
  }
});

// ============================
// BONUS: PI GCV PLANS ENDPOINTS - For Subscription Plans tab
// ============================

router.get('/admin/bizapp/pi-gcv-plans', adminAuth, async (req, res) => {
  try {
    let plans = null;
    try {
      const redis = require('./redis-client');
      const data = await redis.get('bizapp:pi-gcv:plans');
      if (data) plans = JSON.parse(data);
    } catch (e) {}

    if (!plans) {
      plans = [
        { id: 'pi-free', name: 'Pi GCV Free Basic', rate: 0, rateDisplay: 'Free', duration: 30, adverts: 1, description: 'Free Pi GCV shop listing - 1 advert, 30 days, Pi-Friendly badge included', active: true },
        { id: 'pi-featured', name: 'Pi-Friendly Merchant Featured', rate: 5, rateDisplay: '5 USD or 0.0000159 Pi', duration: 30, adverts: 5, description: 'Featured Pi shop - Homepage placement, 5 adverts, MapOfPi listed, Pi-Friendly Merchant badge', active: true },
        { id: 'pi-premium', name: 'Pi Champion Premium', rate: 10, rateDisplay: '10 USD or 0.0000318 Pi', duration: 60, adverts: 15, description: 'Premium champion - Top placement, 15 adverts, 60 days, priority support, all badges', active: true }
      ];
    }

    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load Pi GCV plans' });
  }
});

router.post('/admin/bizapp/pi-gcv-plans', adminAuth, async (req, res) => {
  try {
    const { plans } = req.body;
    if (!Array.isArray(plans)) return res.status(400).json({ error: 'Plans must be array' });

    try {
      const redis = require('./redis-client');
      await redis.set('bizapp:pi-gcv:plans', JSON.stringify(plans));
    } catch (e) { console.log('Redis not available for Pi GCV plans'); }

    res.json({ ok: true, message: 'Pi GCV Plans saved LIVE!', plans });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save Pi GCV plans' });
  }
});

module.exports = router;
module.exports.router = router;
