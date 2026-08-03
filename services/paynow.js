// services/paynow.js
// Paynow payment integration for BizApp ZW subscriptions
// Covers: EcoCash, OneMoney, InnBucks via the Paynow aggregator (Express Checkout)

const { Paynow } = require("paynow");
const crypto = require("crypto");
const querystring = require("querystring");

// --- Setup ---------------------------------------------------------------

const paynow = new Paynow(process.env.PAYNOW_ID, process.env.PAYNOW_KEY);
paynow.resultUrl = "https://chigalex1-backend.onrender.com/paynow/update";
paynow.returnUrl = "https://bizappzw.co.zw/payment-complete";

// --- Plan config -----------------------------------------------------------
// Shape matches exactly what admin.html's loadBizappPlans()/saveBizappPlan()
// already expect from GET/PUT /admin/subscriptions — do not rename these
// fields, the frontend is already built against them.
//
// "rate" is stored as the display string the admin typed (e.g. "$5"),
// since that's what the admin.html input is — a free-text field, not a
// number field. parsePrice() below strips it down to a number for Paynow.

const DEFAULT_PLANS = [
  { id: "onetime", name: "One-Time", rate: "$5", duration_days: 14, adverts_included: 1, max_images: 3, description: "" },
  { id: "monthly", name: "Monthly", rate: "$8", duration_days: 30, adverts_included: 2, max_images: 5, description: "" },
  { id: "annual", name: "Annual", rate: "$80", duration_days: 365, adverts_included: 5, max_images: 5, description: "" },
];

async function getPlans(redis) {
  const raw = await redis.get("bizapp:subscriptions");
  if (!raw) return DEFAULT_PLANS;
  try {
    return JSON.parse(raw);
  } catch {
    console.error("bizapp:subscriptions in Redis is not valid JSON — using defaults");
    return DEFAULT_PLANS;
  }
}

async function setPlans(redis, plans) {
  await redis.set("bizapp:subscriptions", JSON.stringify(plans));
}

function getPlanById(plans, id) {
  return plans.find((p) => p.id === id);
}

function parsePrice(rate) {
  const n = parseFloat(String(rate).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// --- Payment options ---------------------------------------------------
// Matches GET/PUT /admin/payment-options already called by admin.html.
// "enabled" = array of method names shown on checkout.
// "details" = optional info per method (kept for backward compatibility
// with the old manual-EcoCash-number flow; not needed once Paynow is live,
// since Paynow handles routing to the correct number itself).

async function getPaymentOptions(redis) {
  const raw = await redis.get("bizapp:payment_options");
  if (!raw) return { enabled: ["ecocash", "onemoney", "innbucks"], details: {} };
  try {
    return JSON.parse(raw);
  } catch {
    return { enabled: ["ecocash", "onemoney", "innbucks"], details: {} };
  }
}

async function setPaymentOption(redis, method, enabled, detail) {
  const current = await getPaymentOptions(redis);
  const enabledSet = new Set(current.enabled);
  if (enabled) enabledSet.add(method);
  else enabledSet.delete(method);
  const details = { ...current.details, [method]: detail };
  const updated = { enabled: [...enabledSet], details };
  await redis.set("bizapp:payment_options", JSON.stringify(updated));
  return updated;
}

// --- SDK-based initiation (preferred path) --------------------------------

async function initiateSubscriptionPayment({ redis, listingId, tier, merchantEmail, phone, method }) {
  const plans = await getPlans(redis);
  const plan = getPlanById(plans, tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  const price = parsePrice(plan.rate);

  const payment = paynow.createPayment(`BizApp-${listingId}-${tier}-${Date.now()}`, merchantEmail);
  payment.add(`BizApp ZW ${plan.name} listing`, price);

  // method: "ecocash" | "onemoney" | "innbucks"
  const response = await paynow.sendMobile(payment, phone, method);
  return response;
}

// --- Raw REST fallback -----------------------------------------------------
// Use only if paynow.sendMobile() fails for a given method (e.g. InnBucks
// isn't reliably supported by the SDK wrapper yet). Test in sandbox first —
// field order in the hash may need adjusting; a wrong order just returns a
// hash-mismatch error, not a silent failure.

function generatePaynowHash(fields, integrationKey) {
  const raw = Object.values(fields).join("") + integrationKey;
  return crypto.createHash("sha512").update(raw, "utf8").digest("hex").toUpperCase();
}

async function initiateExpressCheckoutRest({ redis, listingId, tier, merchantEmail, phone, method }) {
  const plans = await getPlans(redis);
  const plan = getPlanById(plans, tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);
  const price = parsePrice(plan.rate);

  const fields = {
    id: process.env.PAYNOW_ID,
    reference: `BizApp-${listingId}-${tier}-${Date.now()}`,
    amount: price.toFixed(2),
    additionalinfo: "BizApp ZW subscription",
    returnurl: paynow.returnUrl,
    resulturl: paynow.resultUrl,
    authemail: merchantEmail,
    phone,
    method,
    status: "Message",
  };
  fields.hash = generatePaynowHash(fields, process.env.PAYNOW_KEY);

  const res = await fetch("https://www.paynow.co.zw/interface/remotetransaction", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: querystring.stringify(fields),
  });

  const text = await res.text();
  return querystring.parse(text);
}

// --- Shared activation logic ------------------------------------------------
// Reused by both the manual /activate route and the /paynow/update webhook
// so plan values never drift out of sync between the two.

async function activateListingSubscription(redis, listingId, tier) {
  const plans = await getPlans(redis);
  const plan = getPlanById(plans, tier);
  if (!plan) throw new Error(`Unknown plan tier: ${tier}`);

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + plan.duration_days);

  await redis.hset(`listings:${listingId}`, {
    status: "active",
    plan: tier,
    subscription_expiry: expiry.toISOString(),
    adverts_included: String(plan.adverts_included),
    adverts_used: "0",
    images_allowed: String(plan.max_images),
  });
}

module.exports = {
  paynow,
  DEFAULT_PLANS,
  getPlans,
  setPlans,
  getPlanById,
  parsePrice,
  getPaymentOptions,
  setPaymentOption,
  initiateSubscriptionPayment,
  initiateExpressCheckoutRest,
  activateListingSubscription,
};
