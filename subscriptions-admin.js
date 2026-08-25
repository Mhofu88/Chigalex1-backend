
const express = require('express');
const router = express.Router();

let redisClient = null;
try { const { Redis } = require('@upstash/redis'); redisClient = Redis.fromEnv(); } catch(e){}

async function getSubs(){
  if(!redisClient) return [];
  try{ const d=await redisClient.get('subscriptions'); return d ? (typeof d==='string'?JSON.parse(d):d) : []; }catch(e){ return []; }
}

router.get('/api/subscriptions', async (req,res)=>{
  const subs = await getSubs();
  res.json({ subscriptions: subs });
});

router.get('/api/admin/subscriptions', async (req,res)=>{
  const key=req.headers['x-admin-key'];
  if(!key || key!==process.env.ADMIN_KEY) return res.status(401).json({error:'Unauthorized'});
  const subs = await getSubs();
  res.json({ subscriptions: subs });
});

module.exports = router;
