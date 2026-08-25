
const express = require('express');
const router = express.Router();

router.get('/api/auth/status', (req,res)=>{
  res.json({ ok:true, auth:'pi', mode:'live' });
});

router.post('/api/auth/pi', (req,res)=>{
  const { uid, username } = req.body;
  if(!uid) return res.status(400).json({error:'UID required'});
  console.log('Pi Auth UID:', uid, 'Username:', username);
  res.json({ success:true, uid, username, message:'Auth OK - Add UID to ADMIN_ACCOUNTS if needed' });
});

module.exports = router;
