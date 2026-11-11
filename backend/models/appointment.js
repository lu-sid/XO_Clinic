const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({

    appointmentId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    patientName: {
        type: String,
        required: true,
        trim: true
    },

    doctorName: {
        type: String,
        required: true,
        trim: true
    },

    appointmentDate: {
        type: Date,
        required: true
    },

    appointmentTime: {
        type: String,
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Cancelled'],
        default: 'Scheduled'
    }

}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
