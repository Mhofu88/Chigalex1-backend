function sanitizeString(s,m=500){if(typeof s!=='string')return'';return s.trim().slice(0,m).replace(/[<>]/g,'');}
function isValidUsername(u){return typeof u==='string'&&/^[a-zA-Z0-9_]{1,64}$/.test(u.trim());}
function isValidEmail(e){if(!e)return true;return typeof e==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())&&e.length<=254;}
function validateAdminKey(req,res){if(!process.env.ADMIN_KEY||req.headers['x-admin-key']!==process.env.ADMIN_KEY){res.status(401).json({error:'Unauthorized'});return false;}return true;}
module.exports={sanitizeString,isValidUsername,isValidEmail,validateAdminKey};