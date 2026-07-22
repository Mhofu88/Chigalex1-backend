<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Browse Listings — BizApp ZW</title>
<meta name="description" content="Browse businesses and services listed on BizApp ZW, or list your own to be found by customers — pay in fiat or Pi.">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#182848">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@500;700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root{
    --indigo:#182848;
    --indigo-deep:#0f1a33;
    --marigold:#e8a33d;
    --clay:#c1440e;
    --sand:#f2ead9;
    --ink:#1b1b1b;
    --paper:#faf6ec;
    --green:#2f7d5c;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{
    background:var(--paper);
    color:var(--ink);
    font-family:'Work Sans', sans-serif;
    line-height:1.55;
  }
  h1,h2,h3{font-family:'Space Grotesk', sans-serif; font-weight:700;}
  .eyebrow{
    font-family:'JetBrains Mono', monospace;
    font-size:0.72rem; letter-spacing:0.14em; text-transform:uppercase;
    color:var(--clay); font-weight:500;
  }
  .wrap{max-width:920px; margin:0 auto; padding:0 24px;}

  nav{
    background:var(--indigo); color:var(--paper);
    padding:16px 0; border-bottom:4px solid var(--marigold);
  }
  nav .wrap{ display:flex; justify-content:space-between; align-items:center; }
  nav a{ color:var(--paper); text-decoration:none; font-family:'Space Grotesk', sans-serif; font-weight:700; }
  nav .back{ font-size:0.9rem; opacity:0.8; }

  header.page-head{ padding:44px 0 30px; }
  header.page-head h1{ font-size:clamp(1.6rem,5vw,2.3rem); margin-top:6px; }
  header.page-head p{ max-width:56ch; color:#4a4a4a; margin-top:10px; }

  .btn{
    display:inline-flex; align-items:center; gap:8px;
    font-family:'Space Grotesk', sans-serif; font-weight:700; font-size:0.95rem;
    padding:12px 22px; border-radius:999px; border:2px solid var(--ink);
    text-decoration:none; cursor:pointer; background:none;
    transition:transform 0.15s ease;
  }
  .btn:hover{ transform:translateY(-2px); }
  .btn-primary{ background:var(--clay); color:var(--paper); border-color:var(--ink); }
  .btn-whatsapp{ background:var(--green); color:var(--paper); }
  .btn-outline{ background:transparent; color:var(--ink); }
  .btn:disabled{ opacity:0.5; cursor:not-allowed; transform:none; }

  /* ---- filter bar ---- */
  .filter-bar{
    display:flex; gap:10px; flex-wrap:wrap; align-items:center;
    padding:18px 0; border-top:1px solid rgba(27,27,27,0.12); border-bottom:1px solid rgba(27,27,27,0.12);
  }
  select{
    font-family:'Work Sans', sans-serif; font-size:0.92rem;
    padding:10px 14px; border-radius:6px; border:1.5px solid var(--ink); background:var(--paper);
  }

  /* ---- listings grid ---- */
  .listings-section{ padding:36px 0 60px; }
  .grid{
    display:grid; grid-template-columns:repeat(auto-fit, minmax(240px,1fr)); gap:18px; margin-top:20px;
  }
  .card{
    background:var(--sand); border:2px solid var(--ink); border-radius:5px; padding:20px;
  }
  .card h3{ font-size:1.05rem; margin-bottom:6px; }
  .card .cat{ font-family:'JetBrains Mono', monospace; font-size:0.68rem; color:var(--clay); text-transform:uppercase; letter-spacing:0.06em; }
  .card p{ font-size:0.9rem; color:#3a3a3a; margin:10px 0 14px; }
  .card a.contact{ font-size:0.88rem; font-weight:600; color:var(--indigo); text-decoration:none; }
  .state-msg{ text-align:center; padding:40px 0; color:#666; font-size:0.95rem; }

  /* ---- list-your-business section ---- */
  .cta-section{ background:var(--indigo-deep); color:var(--paper); padding:56px 0; }
  .cta-section .eyebrow{ color:var(--marigold); }
  .cta-section h2{ color:var(--paper); margin:6px 0 24px; }

  .panel{
    background:var(--paper); color:var(--ink); border-radius:8px; padding:26px;
    max-width:520px;
  }
  .panel h3{ font-size:1.1rem; margin-bottom:16px; }
  .field{ margin-bottom:14px; }
  .field label{ display:block; font-size:0.85rem; font-weight:600; margin-bottom:5px; }
  .field input, .field textarea, .field select{
    width:100%; padding:11px 13px; border-radius:5px; border:1.5px solid rgba(27,27,27,0.3);
    font-family:'Work Sans', sans-serif; font-size:0.95rem;
  }
  .field textarea{ resize:vertical; min-height:70px; }
  .toggle-row{ display:flex; gap:8px; margin-bottom:20px; }
  .toggle-row button{
    flex:1; padding:10px; border-radius:6px; border:1.5px solid var(--ink);
    background:transparent; font-family:'Space Grotesk', sans-serif; font-weight:700; cursor:pointer; font-size:0.9rem;
  }
  .toggle-row button.active{ background:var(--indigo); color:var(--paper); }
  .msg{ font-size:0.88rem; padding:10px 12px; border-radius:5px; margin-bottom:14px; }
  .msg.error{ background:#fbe2da; color:var(--clay); }
  .msg.success{ background:#e2f0e8; color:var(--green); }
  .hint{ font-size:0.82rem; color:#666; margin-top:4px; }
  .pay-box{ background:var(--sand); border:1.5px dashed var(--clay); border-radius:6px; padding:16px; margin:16px 0; font-size:0.9rem; }
  .pay-box strong{ font-family:'JetBrains Mono', monospace; }

  footer{ background:var(--ink); color:rgba(250,246,236,0.7); text-align:center; padding:30px 0; font-size:0.85rem; }
  footer a{ color:var(--marigold); }

  @media (max-width:520px){ .filter-bar{ flex-direction:column; align-items:stretch; } }
</style>
</head>
<body>

<nav>
  <div class="wrap">
    <a href="index.html">BizApp ZW</a>
    <a class="back" href="index.html">← Back home</a>
  </div>
</nav>

<header class="page-head">
  <div class="wrap">
    <span class="eyebrow">Marketplace</span>
    <h1>Businesses & services on BizApp ZW</h1>
    <p>Browse what's listed, or list your own business to be found by customers — pay in fiat or Pi.</p>
  </div>
</header>

<section class="wrap">
  <div class="filter-bar">
    <label for="category-filter" style="font-size:0.85rem; font-weight:600;">Filter:</label>
    <select id="category-filter">
      <option value="">All categories</option>
      <option value="retail">Retail</option>
      <option value="food">Food & Beverage</option>
      <option value="services">Services</option>
      <option value="tech">Tech</option>
      <option value="fashion">Fashion</option>
      <option value="other">Other</option>
    </select>
    <button class="btn btn-outline" id="refresh-btn">Refresh</button>
  </div>
</section>

<section class="listings-section wrap">
  <div id="listings-grid" class="grid"></div>
  <div id="listings-state" class="state-msg">Loading listings…</div>
</section>

<section class="cta-section">
  <div class="wrap">
    <span class="eyebrow">Get listed</span>
    <h2>List your business on BizApp ZW</h2>

    <div class="panel" id="auth-panel">
      <div class="toggle-row">
        <button id="show-login" class="active" type="button">Log in</button>
        <button id="show-register" type="button">Register</button>
      </div>
      <div id="auth-msg"></div>

      <form id="login-form">
        <div class="field"><label>Username</label><input type="text" id="login-username" required></div>
        <div class="field"><label>Password</label><input type="password" id="login-password" required></div>
        <button class="btn btn-primary" type="submit">Log in</button>
      </form>

      <form id="register-form" style="display:none;">
        <div class="field"><label>Username</label><input type="text" id="reg-username" required></div>
        <div class="field"><label>Phone number</label><input type="tel" id="reg-phone" required></div>
        <div class="field"><label>Password</label><input type="password" id="reg-password" required></div>
        <div class="field">
          <label>Pi username (optional — leave blank if you're not a Pi Network pioneer)</label>
          <input type="text" id="reg-pi-username">
        </div>
        <button class="btn btn-primary" type="submit">Create account</button>
      </form>
    </div>

    <div class="panel" id="listing-panel" style="display:none; margin-top:20px;">
      <h3>Create your listing</h3>
      <div id="listing-msg"></div>
      <form id="listing-form">
        <div class="field"><label>Business name</label><input type="text" id="l-name" required></div>
        <div class="field">
          <label>Category</label>
          <select id="l-category" required>
            <option value="retail">Retail</option>
            <option value="food">Food & Beverage</option>
            <option value="services">Services</option>
            <option value="tech">Tech</option>
            <option value="fashion">Fashion</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="field">
          <label>Description (max 40 words)</label>
          <textarea id="l-description"></textarea>
          <div class="hint" id="l-description-count">0 / 40 words</div>
        </div>
        <div class="field"><label>Contact (WhatsApp number or link)</label><input type="text" id="l-contact" required></div>
        <button class="btn btn-primary" type="submit">Create listing</button>
      </form>
    </div>

    <div class="panel" id="payment-panel" style="display:none; margin-top:20px;">
      <h3>Activate your listing</h3>
      <p style="font-size:0.9rem; margin-bottom:10px;">Choose a package, send payment, then submit your reference below — your listing goes live once approved.</p>
      <div class="field">
        <label>Plan</label>
        <select id="p-plan"><option>Loading plans…</option></select>
        <div class="hint" id="p-plan-detail"></div>
      </div>
      <div class="pay-box" id="pay-box">
        Send your payment via EcoCash to the number shown once you pick a plan above.
      </div>
      <div id="payment-msg"></div>
      <form id="payment-form">
        <div class="field"><label>EcoCash reference number</label><input type="text" id="p-reference" required></div>
        <div class="field"><label>Amount sent</label><input type="text" id="p-amount"></div>
        <input type="hidden" id="p-listing-id">
        <button class="btn btn-whatsapp" type="submit">Submit payment for review</button>
      </form>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    BizApp ZW — App Development for businesses & merchants. <a href="index.html">Back to home →</a>
  </div>
</footer>

<script>
// ---- Configuration ----
// Points at your existing Chigalex1-backend, which now also hosts the
// listings/auth/payments routes you wired in.
const API_BASE = "https://chigalex1-backend.onrender.com";

let authToken = null; // kept in memory only — refreshing the page requires logging in again
let currentListingId = null;

// ---- Browse listings ----
async function loadListings() {
  const grid = document.getElementById("listings-grid");
  const state = document.getElementById("listings-state");
  const category = document.getElementById("category-filter").value;
  grid.innerHTML = "";
  state.textContent = "Loading listings…";
  state.style.display = "block";

  try {
    const url = category
      ? `${API_BASE}/listings?category=${encodeURIComponent(category)}`
      : `${API_BASE}/listings`;
    const res = await fetch(url);
    const data = await res.json();
    const listings = data.listings || [];

    if (listings.length === 0) {
      state.textContent = "No listings yet — be the first to list your business below.";
      return;
    }
    state.style.display = "none";
    listings.forEach((l) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <span class="cat">${l.category || "General"}</span>
        <h3>${escapeHtml(l.business_name || "Untitled")}</h3>
        <p>${escapeHtml(l.description || "")}</p>
        <a class="contact" href="https://wa.me/${normalizePhone(l.contact)}" target="_blank" rel="noopener">💬 Contact on WhatsApp</a>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    state.textContent = "Couldn't load listings right now — please try again shortly.";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function normalizePhone(contact) {
  return (contact || "").replace(/[^0-9]/g, "");
}

document.getElementById("category-filter").addEventListener("change", loadListings);
document.getElementById("refresh-btn").addEventListener("click", loadListings);
loadListings();

// ---- Auth: toggle login/register ----
const showLogin = document.getElementById("show-login");
const showRegister = document.getElementById("show-register");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

showLogin.addEventListener("click", () => {
  showLogin.classList.add("active");
  showRegister.classList.remove("active");
  loginForm.style.display = "block";
  registerForm.style.display = "none";
});
showRegister.addEventListener("click", () => {
  showRegister.classList.add("active");
  showLogin.classList.remove("active");
  registerForm.style.display = "block";
  loginForm.style.display = "none";
});

function setAuthMsg(text, type) {
  const el = document.getElementById("auth-msg");
  el.innerHTML = text ? `<div class="msg ${type}">${text}</div>` : "";
}

function onLoggedIn() {
  document.getElementById("auth-panel").style.display = "none";
  document.getElementById("listing-panel").style.display = "block";
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthMsg("", "");
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return setAuthMsg(data.error || "Login failed", "error");
    authToken = data.token;
    onLoggedIn();
  } catch {
    setAuthMsg("Couldn't reach the server — try again shortly.", "error");
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  setAuthMsg("", "");
  const username = document.getElementById("reg-username").value;
  const phone = document.getElementById("reg-phone").value;
  const password = document.getElementById("reg-password").value;
  const pi_username = document.getElementById("reg-pi-username").value;
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, phone, password, pi_username }),
    });
    const data = await res.json();
    if (!res.ok) return setAuthMsg(data.error || "Registration failed", "error");
    authToken = data.token;
    onLoggedIn();
  } catch {
    setAuthMsg("Couldn't reach the server — try again shortly.", "error");
  }
});

// ---- Create listing ----
function setListingMsg(text, type) {
  const el = document.getElementById("listing-msg");
  el.innerHTML = text ? `<div class="msg ${type}">${text}</div>` : "";
}

const descField = document.getElementById("l-description");
const descCount = document.getElementById("l-description-count");
descField.addEventListener("input", () => {
  const words = descField.value.trim().split(/\s+/).filter(Boolean).length;
  descCount.textContent = `${words} / 40 words`;
  descCount.style.color = words > 40 ? "#c1440e" : "#666";
});

// ---- Dynamic plans + payment details ----
let loadedPlans = [];
async function loadPricing() {
  try {
    const res = await fetch(`${API_BASE}/pricing`);
    const data = await res.json();
    loadedPlans = data.plans || [];
    const select = document.getElementById("p-plan");
    select.innerHTML = loadedPlans
      .map((p) => `<option value="${p.id}">${p.name}${p.rate ? " — " + p.rate : ""}</option>`)
      .join("");
    updatePlanDetail();
    const ecocash = (data.payment_methods || []).includes("ecocash");
    if (ecocash) {
      const ecocashDetail = (data.payment_details || {}).ecocash || "";
      document.getElementById("pay-box").innerHTML = ecocashDetail
        ? `Send your payment via EcoCash to:<br><strong>${escapeHtml(ecocashDetail)}</strong><br>Then submit the reference below.`
        : `Send your payment via EcoCash, then submit the reference below.`;
    } else {
      document.getElementById("pay-box").innerHTML =
        `Payment details will be shown here once available — contact us on WhatsApp for now.`;
    }
  } catch {
    document.getElementById("p-plan").innerHTML = `<option>Couldn't load plans</option>`;
  }
}
function updatePlanDetail() {
  const select = document.getElementById("p-plan");
  const plan = loadedPlans.find((p) => p.id === select.value);
  const detail = document.getElementById("p-plan-detail");
  if (plan) {
    detail.textContent = `${plan.description || ""} (${plan.duration_days || "?"} days, ${plan.adverts_included || "?"} advert(s) included)`;
  }
}
document.getElementById("p-plan").addEventListener("change", updatePlanDetail);
loadPricing();

document.getElementById("listing-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setListingMsg("", "");
  const business_name = document.getElementById("l-name").value;
  const category = document.getElementById("l-category").value;
  const description = document.getElementById("l-description").value;
  const contact = document.getElementById("l-contact").value;

  try {
    const res = await fetch(`${API_BASE}/listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ business_name, category, description, contact }),
    });
    const data = await res.json();
    if (!res.ok) return setListingMsg(data.error || "Couldn't create listing", "error");

    currentListingId = data.listing.id;
    document.getElementById("p-listing-id").value = currentListingId;
    document.getElementById("listing-panel").style.display = "none";
    document.getElementById("payment-panel").style.display = "block";
  } catch {
    setListingMsg("Couldn't reach the server — try again shortly.", "error");
  }
});

// ---- Submit payment ----
function setPaymentMsg(text, type) {
  const el = document.getElementById("payment-msg");
  el.innerHTML = text ? `<div class="msg ${type}">${text}</div>` : "";
}

document.getElementById("payment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setPaymentMsg("", "");
  const plan = document.getElementById("p-plan").value;
  const ecocash_reference = document.getElementById("p-reference").value;
  const amount = document.getElementById("p-amount").value;

  try {
    const res = await fetch(`${API_BASE}/payments/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ listing_id: currentListingId, plan, ecocash_reference, amount }),
    });
    const data = await res.json();
    if (!res.ok) return setPaymentMsg(data.error || "Couldn't submit payment", "error");
    setPaymentMsg("Payment submitted! Your listing will go live once it's approved.", "success");
    document.getElementById("payment-form").reset();
  } catch {
    setPaymentMsg("Couldn't reach the server — try again shortly.", "error");
  }
});
</script>

</body>
</html>
