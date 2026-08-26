const express=require('express');const cors=require('cors');const path=require('path');const app=express();
const {PORT}=require('./config');const {redis,requireRedis,trackEvent}=require('./utils/redis');
const {sanitizeString,isValidUsername,isValidEmail,validateAdminKey}=require('./utils/validators');
const {rateLimit}=require('./utils/rateLimiter');
app.use(cors());app.use(express.json());
require('./middleware/static')(app);
function safeRequire(p){try{return require(p);}catch(e){console.warn(`⚠️ Skipping ${p}: ${e.message}`);return null;}}
const subscriptionsMod=safeRequire("./subscriptions-admin");const listingsRouter=safeRequire("./listings");
const gcvRouter=safeRequire("./bizapp-gcv-admin");const pkgRouter=safeRequire("./bizapp-packages-admin");
const paymentsRouter=safeRequire("./payments");const authMod=safeRequire("./auth");
const merchantMod=safeRequire("./merchant-directory");const referralMod=safeRequire("./referral-system");
if(gcvRouter)app.use("/",gcvRouter);if(pkgRouter)app.use("/",pkgRouter);
if(subscriptionsMod&&subscriptionsMod.router)app.use("/",subscriptionsMod.router);
if(listingsRouter)app.use("/api/listings",listingsRouter);
if(paymentsRouter)app.use("/payments",paymentsRouter);
if(authMod&&authMod.router)app.use("/auth",authMod.router);
if(merchantMod)app.use("/",merchantMod);if(referralMod)app.use("/",referralMod);
const express=require('express');const cors=require('cors');const path=require('path');const app=express();
const {PORT}=require('./config');const {redis,requireRedis,trackEvent}=require('./utils/redis');
const {sanitizeString,isValidUsername,isValidEmail,validateAdminKey}=require('./utils/validators');
const {rateLimit}=require('./utils/rateLimiter');
app.use(cors());app.use(express.json());
require('./middleware/static')(app);
function safeRequire(p){try{return require(p);}catch(e){console.warn(`⚠️ Skipping ${p}: ${e.message}`);return null;}}
const subscriptionsMod=safeRequire("./subscriptions-admin");const listingsRouter=safeRequire("./listings");
const gcvRouter=safeRequire("./bizapp-gcv-admin");const pkgRouter=safeRequire("./bizapp-packages-admin");
const paymentsRouter=safeRequire("./payments");const authMod=safeRequire("./auth");
const merchantMod=safeRequire("./merchant-directory");const referralMod=safeRequire("./referral-system");
if(gcvRouter)app.use("/",gcvRouter);if(pkgRouter)app.use("/",pkgRouter);
if(subscriptionsMod&&subscriptionsMod.router)app.use("/",subscriptionsMod.router);
if(listingsRouter)app.use("/api/listings",listingsRouter);
if(paymentsRouter)app.use("/payments",paymentsRouter);
if(authMod&&authMod.router)app.use("/auth",authMod.router);
if(merchantMod)app.use("/",merchantMod);if(referralMod)app.use("/",referralMod);
const translationsRouter=require('./routes/translations');app.use('/api/translations',translationsRouter);
console.log("✅ Routers loaded");
let pi=null;try{const PiNetwork=require('pi-backend');pi=new PiNetwork(process.env.PI_API_KEY,process.env.APP_WALLET_SEED);console.log('✅ Pi SDK');}catch(e){console.warn('⚠️ Pi SDK not loaded');}
async function getFAQs(lang=null){const r=require('./utils/redis').getRedis();if(!r)return[];const ids=await r.zrange('faq:index',0,-1);if(!ids.length)return[];const pipeline=r.pipeline();ids.forEach(id=>pipeline.hgetall(`faq:${id}`));const results=await pipeline.exec();const faqs=results.map(r=>r).filter(Boolean);return lang?faqs.filter(f=>!f.lang||f.lang===lang||f.lang==='all'):faqs;}
async function getQuestions(filter='all'){const r=require('./utils/redis').getRedis();if(!r)return[];const ids=await r.zrange('questions:index',0,-1);if(!ids.length)return[];const pipe=r.pipeline();ids.forEach(id=>pipe.hgetall(`question:${id}`));let results=(await pipe.exec()).filter(Boolean);if(filter!=='all')results=results.filter(q=>q.status===filter);return results;}
const legacyCore=safeRequire('./legacy-core');
if(legacyCore&&typeof legacyCore==='function'){legacyCore(app,{redis,requireRedis,trackEvent,sanitizeString,isValidUsername,isValidEmail,validateAdminKey,rateLimit,getFAQs,getQuestions});}
else{app.get('/health',(req,res)=>res.json({status:'ok',version:'v2-modular',languages:25}));}
app.get('*',(req,res)=>{res.sendFile(path.join(__dirname,'public','index.html'),err=>{if(err)res.status(200).send('<h1>Chigalex1 API Running V2</h1>');});});
app.listen(PORT,()=>{console.log(`🚀 Chigalex1 V2 MODULAR LIVE ${PORT}`);console.log(`   Health: /health`);console.log(`   Translations: /api/translations/list`);});
