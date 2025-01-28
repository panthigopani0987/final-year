const express = require('express');
const router = express.Router();
const multer = require("multer");
const { storage } = require("../config/cloud.Config");
const { updateDoctor, changeAvailablity } = require('../controllers/DoctorController');
const upload = multer({ storage });

router.patch('/updateDoctor/:id', upload.fields([{ name: 'doctorPhoto', maxCount: 1 }]), updateDoctor);
router.patch('/changeAvailablity/:id', changeAvailablity);

module.exports = router;