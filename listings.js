// Listings routes — the core of the promotion/marketplace division.
// New listings start as "pending" and only appear in public browsing
// once a payment is approved (see payments.js).

const express = require("express");
const { redis } = require("./redis-client");
const { requireAuth } = require("./auth");

const router = express.Router();

// POST /listings — create a new listing (requires login)
router.post("/", requireAuth, async (req, res) => {
  const { business_name, category, description, contact } = req.body;
  if (!business_name || !category || !contact) {
    return res.status(400).json({ error: "business_name, category, and contact are required" });
  }
  const wordCount = (description || "").trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 40) {
    return res.status(400).json({ error: "description must be 40 words or fewer" });
  }

  const id = `l_${Date.now()}`;
  const listing = {
    id,
    owner_id: req.user.id,
    business_name,
    category,
    description: description || "",
    contact,
    status: "pending", // becomes "active" once payment is approved
    created_at: new Date().toISOString(),
  };

  await redis.hset(`listings:${id}`, listing);
  await redis.sadd(`listings:by-category:${category}`, id);
  await redis.sadd(`listings:by-owner:${req.user.id}`, id);

  res.json({ message: "Listing created — submit payment to activate it", listing });
});

// GET /listings?category=retail — browse active listings, optionally by category
router.get("/", async (req, res) => {
  const { category } = req.query;
  const ids = category
    ? await redis.smembers(`listings:by-category:${category}`)
    : await redis.smembers("listings:all");

  const listings = await Promise.all(ids.map((id) => redis.hgetall(`listings:${id}`)));
  res.json({ listings: listings.filter((l) => l && l.status === "active") });
});

// GET /listings/mine — the logged-in user's own listings, any status
router.get("/mine", requireAuth, async (req, res) => {
  const ids = await redis.smembers(`listings:by-owner:${req.user.id}`);
  const listings = await Promise.all(ids.map((id) => redis.hgetall(`listings:${id}`)));
  res.json({ listings });
});

// GET /listings/:id — view a single listing
router.get("/:id", async (req, res) => {
  const listing = await redis.hgetall(`listings:${req.params.id}`);
  if (!listing || !listing.id) return res.status(404).json({ error: "listing not found" });
  res.json({ listing });
});

// PUT /listings/:id — owner edits their own listing
router.put("/:id", requireAuth, async (req, res) => {
  const listing = await redis.hgetall(`listings:${req.params.id}`);
  if (!listing || !listing.id) return res.status(404).json({ error: "listing not found" });
  if (listing.owner_id !== req.user.id) return res.status(403).json({ error: "this is not your listing" });

  const { business_name, description, contact } = req.body;
  const updates = {};
  if (business_name) updates.business_name = business_name;
  if (description) updates.description = description;
  if (contact) updates.contact = contact;

  await redis.hset(`listings:${req.params.id}`, updates);
  res.json({ message: "Listing updated" });
});

module.exports = router;
