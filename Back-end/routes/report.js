const express=require('express');

const {handleLoginDetails,handleUploading,handleReport,handleModel}=require('../controllers/report');


const router=express.Router();

router.post('/login',handleLoginDetails);
router.post('/photos',handleUploading);
router.get('/reports',handleReport);
router.post('/model',handleModel);

module.exports=router;