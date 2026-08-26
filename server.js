const express=require('express');const cors=require('cors');const path=require('path');const fs=require('fs');
const app=express();const PORT=process.env.PORT||10000;
app.use(cors());app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
app.get(['/admin.html','/admin'],(req,res)=>{res.set({'Cache-Control':'no-store'});res.sendFile(path.join(__dirname,'public','admin.html'));});

function safeRequire(p){try{return require(p);}catch(e){console.warn(`⚠️ Skipping ${p}: ${e.message}`);return null;}}
let redis=null;try{const{Redis}=require('@upstash/redis');redis=Redis.fromEnv();console.log('✅ Redis connected');}catch(e){console.warn('⚠️ Redis not configured');}
function requireRedis(res){if(!redis){res.status(503).json({error:'Redis not configured'});return false;}return true;}

const listingsRouter=safeRequire("./listings");
const gcvRouter=safeRequire("./bizapp-gcv-admin");
const pkgRouter=safeRequire("./bizapp-packages-admin");
const paymentsRouter=safeRequire("./payments");
const authMod=safeRequire("./auth");

if(gcvRouter)app.use("/",gcvRouter);
if(pkgRouter)app.use("/",pkgRouter);
if(listingsRouter)app.use("/api/listings",listingsRouter);
if(paymentsRouter)app.use("/payments",paymentsRouter);
if(authMod&&authMod.router)app.use("/auth",authMod.router);

// NEW: Translations - safe load, won't crash if folder missing
try{
 const transRouter=safeRequire("./routes/translations");
 if(transRouter) app.use("/api/translations", transRouter);
 else {
   // fallback inline if routes folder missing
   app.get('/api/translations/list',(req,res)=>{
     try{const files=fs.readdirSync(path.join(__dirname,'locales')).map(f=>f.replace('.json',''));res.json({supported:files,count:files.length});}
     catch{res.json({supported:['en','sn','nd'],count:3});}
   });
   app.get('/api/translations/:lang',(req,res)=>{
     const lang=(req.params.lang||'en').toLowerCase();
     const file=path.join(__dirname,'locales',`${lang}.json`);
     if(fs.existsSync(file)){res.set({'Cache-Control':'public, max-age=86400'});res.sendFile(file);}
     else res.status(404).json({error:'Not found'});
   });
   console.log('✅ Translations fallback active');
 }
}catch(e){console.warn('Translations skip',e.message);}

app.get('/health',(req,res)=>res.json({status:'ok',version:'v2.1-resilient',languages:25}));
app.get('*',(req,res)=>{res.sendFile(path.join(__dirname,'public','index.html'),err=>{if(err)res.send('<h1>Chigalex1 LIVE V2.1</h1>');});});
app.listen(PORT,()=>console.log(`🚀 Chigalex1 V2.1 LIVE ${PORT}`));

// ════════════════════════════════════════════
// PASTE THIS AT LINE 45 - RIGHT AFTER Pi SDK LOAD
// ════════════════════════════════════════════
app.get('/pi-payments-status', (req, res) => {
  res.json({
    pi_api_key_set: !!process.env.PI_API_KEY,
    pi_api_key_prefix: process.env.PI_API_KEY ? process.env.PI_API_KEY.slice(0,8)+'...' : 'NOT SET',
    app_wallet_seed_set: !!process.env.APP_WALLET_SEED,
    time: new Date().toISOString()
  });
});

app.post(['/approve-payment', '/api/payments/approve'], async (req, res) => {
  const paymentId = req.body.paymentId || req.body.payment_id;
  if (!paymentId) return res.status(400).json({ error: 'paymentId required' });
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY not set in Render Environment' });
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Pi API approve failed', pi_response: data });
    res.json({ success: true, approved: true, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post(['/complete-payment', '/api/payments/complete'], async (req, res) => {
  const paymentId = req.body.paymentId || req.body.payment_id;
  const txid = req.body.txid;
  const username = (req.body.username || 'Chigalex1').toString().slice(0,64);
  if (!paymentId || !txid) return res.status(400).json({ error: 'paymentId and txid required' });
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'PI_API_KEY not set' });
  try {
    const response = await fetch(`https://api.minepi.com/v2/payments/${encodeURIComponent(paymentId)}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ txid })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: 'Pi API complete failed', pi_response: data });
    res.json({ success: true, completed: true, username, txid, data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
console.log('✅ Pi Payments FIX loaded');
// ════════════════════════════════════════════
