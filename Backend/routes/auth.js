const express = require('express');
const router = express.Router();
const Passport = require('../config/passportConfig');
const { registerUser, loginUser, loginAdmin, updateProfile, loginDoctor } = require('../controllers/UserController');
const multer = require("multer");
const { storage } = require("../config/cloud.Config");
const upload = multer({ storage });
const { sendResponse } = require('../services/responseHandler');
// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/doctor-login', loginDoctor);

// User profile update
router.patch('/updateProfile/:id', upload.fields([{ name: 'profilePhoto', maxCount: 1 }]), updateProfile);

// Admin Authentication Middleware
router.use('/admin', (req, res, next) => {
    Passport.authenticate('admin', (err, user, info) => {
        if (err || !user) {
            return sendResponse(res, 403, 'Unauthorized admin access', 0);
        }
        req.user = user;
        next();
    })(req, res, next);
}, require('./admin'));

// Doctor Authentication Middleware
router.use('/doctor', (req, res, next) => {
    Passport.authenticate('doctor', (err, user, info) => {
        if (err || !user) {
            console.log("JWT Decode Error:", err || info);  // Log the error or info
            return sendResponse(res, 403, 'Unauthorized doctor access', 0);
        }
        req.user = user;
        next();
    })(req, res, next);
    
}, require('./doctor'));

// appoinment Authentication Middleware
router.use('/user', (req, res, next) => {
    Passport.authenticate('user', (err, user, info) => {
        if (err || !user) {
            console.log("JWT Decode Error:", err || info);  // Log the error or info
            return sendResponse(res, 403, 'Unauthorized user access', 0);
        }
        req.user = user;
        next();
    })(req, res, next);
    
}, require('./user'));

module.exports = router;
