
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

console.log("=== Chigalex1 EMERGENCY MODE - No Exit 1 ===");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health - Render needs this
app.get('/health', (req,res) => res.json({ ok:true, mode:'emergency', time:new Date().toISOString() }));
app.get('/', (req,res) => res.send('<h1>Chigalex1 LIVE - Emergency Mode</h1><p>Backend is running. No Exit 1.</p>'));

// BizApp packages - public (fallback)
const DEFAULT_PKGS = [
  { id:"starter", name:"Starter", price:250, tag:"Launch Fast" },
  { id:"business", name:"Business", price:599, tag:"POPULAR" },
  { id:"pro", name:"Pro", price:999, tag:"ELITE" }
];

let redisClient = null;
try {
  const { Redis } = require('@upstash/redis');
  redisClient = Redis.fromEnv();
  console.log("Redis client created");
} catch(e) { console.log("Redis not configured, using memory"); }

async function getPackages(){
  if(!redisClient) return DEFAULT_PKGS;
  try {
    const data = await redisClient.get('bizapp:packages');
    if(data){
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if(Array.isArray(parsed) && parsed.length>=3) return parsed;
    }
    return DEFAULT_PKGS;
  } catch(e){ return DEFAULT_PKGS; }
}

// Public endpoint BizAppZW needs
app.get('/api/bizapp/packages', async (req,res) => {
  try {
    const pkgs = await getPackages();
    res.set({ 'Cache-Control':'no-store' });
    res.json({ packages: pkgs });
  } catch(e){ res.json({ packages: DEFAULT_PKGS }); }
});

// Try load your existing routers safely - if they fail, we still stay LIVE
function safeLoad(p, mount){
  try{
    const r = require(p);
    if(mount) app.use(mount, r);
    else app.use(r);
    console.log(`✅ Loaded ${p} ${mount||''}`);
  }catch(e){
    console.log(`⚠️ Skipped ${p}: ${e.message}`);
  }
}

// Load what you have - won't crash if missing
safeLoad('./bizapp-packages-admin.js');
safeLoad('./bizapp-gcv-admin-BACKEND-V2.js');
safeLoad('./subscriptions-admin.js');
safeLoad('./referrals-admin.js');
safeLoad('./listings');
safeLoad('./auth');

app.get('*', (req,res) => {
  const idx = path.join(__dirname,'public','index.html');
  try { res.sendFile(idx); } catch(e){ res.send('<h1>Chigalex1 LIVE</h1>'); }
});

app.listen(PORT, () => {
  console.log(`🚀 Chigalex1 EMERGENCY LIVE on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});
