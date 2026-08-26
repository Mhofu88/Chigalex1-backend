let redis=null;try{const{Redis}=require('@upstash/redis');redis=Redis.fromEnv();console.log('✅ Redis connected');}catch(e){console.warn('⚠️ Redis not configured');}
function requireRedis(res){if(!redis){res.status(503).json({error:'Redis not configured'});return false;}return true;}
async function trackEvent(ev){if(!redis)return;try{const day=new Date().toISOString().slice(0,10);await redis.incr(`analytics:${day}:${ev}`);await redis.incr(`analytics:total:${ev}`);}catch(e){}}
module.exports={redis,requireRedis,trackEvent,getRedis:()=>redis};