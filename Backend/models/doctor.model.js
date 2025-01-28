const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    age: {
        type: String
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"]
    },
    address: {
        type: String
    },
    speciality: {
        type: String,
        enum: ["Cardiologist", "Dermatologist", "Orthopedic", "Neurologist", "Pediatrician", "Nephrologist", "Surgeon", "Gynaecologist", "General Practitioner"],
    },
    education: {
        type: String
    },
    experience: {
        type: String
    },
    joinDate: {
        type: Date
    },
    doctorLinkedin: {
        type: String
    },
    doctorInstagram: {
        type: String
    },
    doctorTwitter: {
        type: String
    },
    doctorPhoto: {
        type: String,
    },
    availability: {
        type: String,
        enum: ["Available", "On Leave", "Not Available"],
        default: 'Available'
    },
    fees: {
        type: Number,
        required: true
    },
    slots_booked: { 
        type: Object, 
        default: {} 
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Doctor', doctorSchema);