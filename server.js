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