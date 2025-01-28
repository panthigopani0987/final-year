const mongoose = require('mongoose');

const appoinmentSchema = new mongoose.Schema({
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        chooseDoctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true
        },
        patientIllness: {
            type: String,
            required: true
        },
        department: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        slotDate: {
            type: Date,
            required: true
        },
        slotTime: {
            type: String,
            required: true
        },
        payment: {
            type: Boolean,
            default: false
        },
        cancelled: {
            type: Boolean,
            default: false
        },
        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Appoinement', appoinmentSchema);