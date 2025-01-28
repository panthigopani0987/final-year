const express = require('express');
const router = express.Router();
const multer = require("multer");
const { addDoctor, getAllUser, getUserById, getAllDoctors, getDoctorsById, adminDashborad, listAppointment } = require('../controllers/AdminController');
const { storage } = require("../config/cloud.Config");
const { changeAvailablity } = require('../controllers/DoctorController');
const upload = multer({ storage });

//get all user
router.get('/users',getAllUser);
router.get('/user/:id',getUserById);

//add doctor
router.post('/add-doctor', upload.fields([{ name: 'doctorPhoto', maxCount: 1 }]), addDoctor);
router.get('/dashboard',adminDashborad);
//get all doctor
router.get('/doctors',getAllDoctors);
router.get('/doctors/:id',getDoctorsById);
router.patch('/changeAvailablity/:id', changeAvailablity);

//for appointment
router.get('/list-appointment',listAppointment);

module.exports = router;       