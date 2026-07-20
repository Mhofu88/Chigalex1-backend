# Chigalex1-backend

Africa Pi Network Education Hub# 

BizApp ZW — Listings & Auth Scaffold

Four files, meant to sit alongside your existing server code (same pattern as Chigalex1-backend):

- `redis-client.js` — shared Upstash Redis connection
- `auth.js` — register, login, `requireAuth` middleware
- `listings.js` — create/browse/edit listings
- `payments.js` — manual EcoCash submit + admin approve/reject

## 1. Install dependencies

In your project's terminal (or add to `package.json` manually):

```
npm install express @upstash/redis bcryptjs jsonwebtoken
```

## 2. Environment variables to add on Render

| Variable | What it's for |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Same Redis database you already use — or a new one |
| `UPSTASH_REDIS_REST_TOKEN` | Same as above |
| `JWT_SECRET` | Any long random string — keeps login tokens secure |
| `ECOCASH_NUMBER` | +263772951579 — shown to users so they know where to pay |
| `ECOCASH_NAME` | Alexander Chigodo — shown alongside the number |

## 3. Wire the routes into your main server file

In your existing `server.js` (or `index.js`), add:

```js
const { router: authRouter } = require("./auth");
const listingsRouter = require("./listings");
const paymentsRouter = require("./payments");

app.use("/auth", authRouter);
app.use("/listings", listingsRouter);
app.use("/payments", paymentsRouter);
```

## 4. How the flow works end to end

1. User registers (`POST /auth/register`) — pioneers include their Pi username, general users leave it blank
2. User creates a listing (`POST /listings`) — starts as `pending`, not publicly visible yet
3. User picks a plan (Starter/Business/Pro), sends EcoCash payment to your number, then submits the reference (`POST /payments/submit`)
4. You review pending payments (`GET /payments/pending`) and approve (`POST /payments/:id/approve`) — this makes the listing `active` for 30 days and visible in `GET /listings`

## What's not built yet (on purpose)

- No frontend pages yet — these are API routes only
- No automatic payment verification — approval is manual by design, matching your admin workflow in Chigalex1
- No Pi payment split — layer this in later once the fiat flow is proven, reusing your Chigalex1 advertise-section Pi logic
