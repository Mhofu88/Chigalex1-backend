const express=require('express');const path=require('path');const fs=require('fs');const router=express.Router();
const LOCALES_DIR=path.join(__dirname,'..','locales');
const SUPPORTED=fs.readdirSync(LOCALES_DIR).map(f=>f.replace('.json',''));
router.get('/list',(req,res)=>res.json({supported:SUPPORTED,count:SUPPORTED.length}));
router.get('/:lang',(req,res)=>{const lang=(req.params.lang||'en').toLowerCase();if(!SUPPORTED.includes(lang))return res.status(404).json({error:'Language not supported',supported:SUPPORTED});const file=path.join(LOCALES_DIR,`${lang}.json`);res.set({'Cache-Control':'public, max-age=86400'});res.sendFile(file);});
router.get('/',(req,res)=>res.json({message:'Use /api/translations/:lang',supported:SUPPORTED}));
console.log(`✅ Translations: ${SUPPORTED.length} languages lazy-load`);
module.exports=router;
