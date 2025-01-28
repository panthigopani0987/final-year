const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true
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
    gender:{
        type: String,
        enum : ["Male","Female","Other"]
    },
    address:{
        type: String
    },
    phone: {
        type: Number
    },
    age:{
        type: String
    },
    profilePhoto:{
        type: String,
        default:""
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);