// routes/paynow.js
// - Payment routes: triggers Paynow subscriptions (EcoCash/OneMoney/InnBucks)
//   and receives Paynow's payment status webhook.
// - Admin routes: backs the already-built "BizApp ZW" tab in admin.html
//   (Subscription Plans, Advert Charges, Payment Options, Pending Payments).
//   Field names below match admin.html exactly — do not rename them.

const express = require("express");
const router = express.Router();

const {
  initiateSubscriptionPayment,
  activateListingSubscription,
  getPlans,
  setPlans,
  getPlanById,
  getPaymentOptions,
  setPaymentOption,
} = require("../services/paynow");

// Adjust this import to match wherever your existing redis client lives
// (the same client used in your /activate and /claim-free routes).
const redis = require("../redis");

// admin.html sends the admin key as a header on every call:
//   fetch(BASE+path, { headers: {'x-admin-key': ADMIN_KEY} })
// This matches the same check your /admin/analytics route already uses.
function requireAdminKey(req, res, next) {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid admin key" });
  }
  next();
}

// ── PAYMENT ROUTES ──────────────────────────────────────────────────────

// POST /bizapp/subscribe
// Body: { listingId, tier, merchantEmail, phone, method }
// method: "ecocash" | "onemoney" | "innbucks"
router.post("/bizapp/subscribe", async (req, res) => {
  const { listingId, tier, merchantEmail, phone, method } = req.body;

  if (!listingId || !tier || !merchantEmail || !phone || !method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await initiateSubscriptionPayment({
      redis,
      listingId,
      tier,
      merchantEmail,
      phone,
      method,
    });

    if (!response.success) {
      return res.status(400).json({ error: response.error });
    }

    // Track the pending transaction so it's visible in the existing
    // "Pending Listing Payments" admin card until it's confirmed paid.
    await redis.hset(`pending_tx:${response.pollUrl}`, {
      listing_id: String(listingId),
      plan: tier,
      ecocash_reference: response.pollUrl, // reusing this field for consistency with the admin UI
      amount: String(response.amount || ""),
    });
    await redis.sadd("pending_tx:all", response.pollUrl);

    if (method === "innbucks") {
      return res.json({
        instructions: response.instructions,
        authorizationCode: response.authorizationcode,
        deepLink: `schinn.wbpycode://innbucks.co.zw?pymInnCode=${response.authorizationcode}`,
        qrUrl: `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${response.authorizationcode}`,
        pollUrl: response.pollUrl,
      });
    }

    // ecocash / onemoney
    return res.json({
      instructions: response.instructions,
      pollUrl: response.pollUrl,
    });
  } catch (err) {
    console.error("Paynow subscribe error:", err);
    return res.status(500).json({ error: "Payment initiation failed" });
  }
});

// POST /paynow/update
// Paynow posts payment status updates here automatically (resultUrl).
// Since Paynow confirms payment itself, this activates the listing
// directly — no manual admin approval needed for Paynow-routed payments.
router.post("/paynow/update", async (req, res) => {
  try {
    const status = req.body;

    if (status.status === "Paid") {
      const [, listingId, tier] = String(status.merchantreference).split("-");
      await activateListingSubscription(redis, listingId, tier);

      // Clean up the pending-payment record now that it's confirmed
      const pollUrl = status.pollurl;
      if (pollUrl) {
        await redis.del(`pending_tx:${pollUrl}`);
        await redis.srem("pending_tx:all", pollUrl);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Paynow webhook error:", err);
    res.sendStatus(500);
  }
});

// ── ADMIN ROUTES (already called by admin.html) ────────────────────────

// GET /admin/subscriptions
router.get("/admin/subscriptions", requireAdminKey, async (req, res) => {
  const plans = await getPlans(redis);
  res.json({ plans });
});

// PUT /admin/subscriptions/:id
// Body: { rate, duration_days, adverts_included, max_images, description }
router.put("/admin/subscriptions/:id", requireAdminKey, async (req, res) => {
  const { id } = req.params;
  const { rate, duration_days, adverts_included, max_images, description } = req.body;

  const plans = await getPlans(redis);
  const plan = getPlanById(plans, id);
  if (!plan) return res.status(404).json({ error: "Unknown plan id" });

  plan.rate = rate ?? plan.rate;
  plan.duration_days = duration_days !== undefined ? Number(duration_days) : plan.duration_days;
  plan.adverts_included = adverts_included !== undefined ? Number(adverts_included) : plan.adverts_included;
  plan.max_images = max_images !== undefined ? Number(max_images) : plan.max_images;
  plan.description = description ?? plan.description;

  await setPlans(redis, plans);
  res.json({ message: `${plan.name} plan updated`, plan });
});

// PUT /admin/advert-charges
// Body: { rate }
router.put("/admin/advert-charges", requireAdminKey, async (req, res) => {
  const { rate } = req.body;
  if (!rate) return res.status(400).json({ error: "Missing rate" });
  await redis.set("bizapp:advert_charge_rate", rate);
  res.json({ message: "Advert charge updated", rate });
});

// GET /admin/payment-options
router.get("/admin/payment-options", requireAdminKey, async (req, res) => {
  const options = await getPaymentOptions(redis);
  res.json(options);
});

// PUT /admin/payment-options
// Body: { method, enabled, detail }
router.put("/admin/payment-options", requireAdminKey, async (req, res) => {
  const { method, enabled, detail } = req.body;
  if (!method) return res.status(400).json({ error: "Missing method" });
  const updated = await setPaymentOption(redis, method, enabled, detail);
  res.json({ message: `${method} updated`, ...updated });
});

// GET /payments/pending
// Lists Paynow transactions still awaiting confirmation (visibility only —
// Paynow's webhook clears these automatically once paid, approve/reject
// below are for manual overrides if a webhook is ever missed).
router.get("/payments/pending", requireAdminKey, async (req, res) => {
  const pollUrls = await redis.smembers("pending_tx:all");
  const payments = [];
  for (const url of pollUrls) {
    const tx = await redis.hgetall(`pending_tx:${url}`);
    if (tx && tx.listing_id) payments.push({ id: url, ...tx });
  }
  res.json({ payments });
});

// POST /payments/:id/approve — manual override if a webhook is ever missed
router.post("/payments/:id/approve", requireAdminKey, async (req, res) => {
  const pollUrl = req.params.id;
  const tx = await redis.hgetall(`pending_tx:${pollUrl}`);
  if (!tx || !tx.listing_id) return res.status(404).json({ error: "Pending payment not found" });

  await activateListingSubscription(redis, tx.listing_id, tx.plan);
  await redis.del(`pending_tx:${pollUrl}`);
  await redis.srem("pending_tx:all", pollUrl);
  res.json({ message: "Payment approved and listing activated" });
});

// POST /payments/:id/reject
router.post("/payments/:id/reject", requireAdminKey, async (req, res) => {
  const pollUrl = req.params.id;
  await redis.del(`pending_tx:${pollUrl}`);
  await redis.srem("pending_tx:all", pollUrl);
  res.json({ message: "Payment rejected" });
});

module.exports = router;
