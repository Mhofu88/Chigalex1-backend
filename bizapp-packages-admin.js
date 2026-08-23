const express = require('express');
const router = express.Router();

function adminAuth(req,res,next){
 const k=req.headers['x-admin-key'];
 if(!k || k!==process.env.ADMIN_KEY) return res.status(401).json({error:'Unauthorized'});
 next();
}

// ADMIN - GET packages
router.get('/admin/bizapp/packages', adminAuth, async (req,res)=>{
 try{
  const redis=require('./redis-client');
  const data=await redis.get('bizapp:packages');
  let pkgs=data?JSON.parse(data):[
   {id:1,name:'Starter',rate:'250',tagline:'Launch Fast',desc:'One-page Pi app with listing, wallet connect, and basic admin for startups.'},
   {id:2,name:'Business',rate:'599',tagline:'Scale Pro',desc:'Full business app with dashboard, payments, analytics and Pi GCV integration.'},
   {id:3,name:'Pro',rate:'999',tagline:'Enterprise Power',desc:'Enterprise suite with multi-shop, ambassador system, custom Pi utilities and API.'}
  ];
  res.json(pkgs);
 }catch(e){ res.json([]); }
});

// ADMIN - POST packages
router.post('/admin/bizapp/packages', adminAuth, async (req,res)=>{
 try{
  const pkgs=req.body.packages||req.body;
  const redis=require('./redis-client');
  await redis.set('bizapp:packages', JSON.stringify(pkgs));
  console.log('✅ Packages saved LIVE:', pkgs);
  res.json({ok:true, message:'Packages saved LIVE!', packages:pkgs});
 }catch(e){ res.status(500).json({error:e.message}); }
});

// PUBLIC - for frontend Build Your App page
router.get('/api/bizapp/packages', async (req,res)=>{
 try{
  const redis=require('./redis-client');
  const data=await redis.get('bizapp:packages');
  let pkgs=data?JSON.parse(data):[
   {id:1,name:'Starter',rate:'299',tagline:'Launch Fast',desc:'One-page Pi app'},
   {id:2,name:'Business',rate:'599',tagline:'Scale Pro',desc:'Full business app'},
   {id:3,name:'Pro',rate:'999',tagline:'Enterprise Power',desc:'Enterprise suite'}
  ];
  res.json(pkgs);
 }catch(e){
  res.json([
   {id:1,name:'Starter',rate:'299'},{id:2,name:'Business',rate:'599'},{id:3,name:'Pro',rate:'999'}
  ]);
 }
});

module.exports=router;