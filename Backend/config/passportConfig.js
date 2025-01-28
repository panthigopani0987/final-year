require('dotenv').config();
const Passport = require("passport");
const UserModel = require("../models/user.model");
const DoctorModel = require("../models/doctor.model");
const jwt = require("passport-jwt");
const jwtStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;

// JWT Strategy Options
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

// Admin Authentication Strategy
Passport.use('admin', new jwtStrategy(jwtOptions, async (record, done) => {
    try {
        if (record.role === process.env.ADMIN_ROLE && record.email === process.env.ADMIN_EMAIL) {
            const adminData = {
                email: process.env.ADMIN_EMAIL,
                role: process.env.ADMIN_ROLE
            };
            return done(null, adminData);
        }
        return done(null, false, { message: 'Unauthorized admin access' });
    } catch (error) {
        return done(error, false);
    }
}));

// User Authentication Strategy
Passport.use('user', new jwtStrategy(jwtOptions, async (record, done) => {
    try {
        if (record.role === process.env.USER_ROLE) {
            const userData = await UserModel.findById(record.userData._id);
            if (userData) {
                return done(null, userData);
            }
        }
        return done(null, false, { message: 'Unauthorized user access' });
    } catch (error) {
        return done(error, false);
    }
}));

// Doctor Authentication Strategy
Passport.use('doctor', new jwtStrategy(jwtOptions, async (record, done) => {
    try {
        if (record.role === process.env.DOCTOR_ROLE) {
            const doctorData = await DoctorModel.findById(record.userData._id);
            if (doctorData) {
                return done(null, doctorData);
            }
        }
        return done(null, false, { message: 'Unauthorized doctor access' });
    } catch (error) {
        return done(error, false);
    }
}));

// Serialize User (Used to store user id in session)
Passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize User (Used to retrieve user from session)
Passport.deserializeUser(async (id, done) => {
    try {
        console.log(id);
        
        const user = await UserModel.findById(id) || await DoctorModel.findById(id);
        user ? done(null, user) : done(null, false);
    } catch (error) {
        done(error, false);
    }
});

module.exports = Passport;
