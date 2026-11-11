
require('dotenv').config();

const mongoose = require('mongoose');
const Appointment = require('../models/appointment');

const sampleAppointments = [
    {
        appointmentId: "APT001",
        patientName: "Aarav Naik",
        doctorName: "Dr. Meera Sharma",
        appointmentDate: "2026-11-12",
        appointmentTime: "09:00",
        reason: "General Checkup",
        status: "Scheduled"
    },
    {
        appointmentId: "APT002",
        patientName: "Ananya Dessai",
        doctorName: "Dr. Rahul Patil",
        appointmentDate: "2026-11-12",
        appointmentTime: "09:30",
        reason: "Fever",
        status: "Scheduled"
    },
    {
        appointmentId: "APT003",
        patientName: "Rohan Kamat",
        doctorName: "Dr. Meera Sharma",
        appointmentDate: "2026-11-12",
        appointmentTime: "10:00",
        reason: "Headache",
        status: "Completed"
    },
    {
        appointmentId: "APT004",
        patientName: "Isha Sawant",
        doctorName: "Dr. Neha Rao",
        appointmentDate: "2026-11-12",
        appointmentTime: "10:30",
        reason: "Dental Consultation",
        status: "Scheduled"
    },
    {
        appointmentId: "APT005",
        patientName: "Kabir Prabhu",
        doctorName: "Dr. Rahul Patil",
        appointmentDate: "2026-11-13",
        appointmentTime: "09:00",
        reason: "Cold and Cough",
        status: "Cancelled"
    },
    {
        appointmentId: "APT006",
        patientName: "Mira Naik",
        doctorName: "Dr. Neha Rao",
        appointmentDate: "2026-11-13",
        appointmentTime: "09:30",
        reason: "Tooth Pain",
        status: "Scheduled"
    },
    {
        appointmentId: "APT007",
        patientName: "Vivaan Shirodkar",
        doctorName: "Dr. Meera Sharma",
        appointmentDate: "2026-11-13",
        appointmentTime: "10:00",
        reason: "Routine Checkup",
        status: "Scheduled"
    },
    {
        appointmentId: "APT008",
        patientName: "Sara Fernandes",
        doctorName: "Dr. Rahul Patil",
        appointmentDate: "2026-11-13",
        appointmentTime: "10:30",
        reason: "Allergy",
        status: "Completed"
    },
    {
        appointmentId: "APT009",
        patientName: "Arjun Borkar",
        doctorName: "Dr. Neha Rao",
        appointmentDate: "2026-11-14",
        appointmentTime: "09:00",
        reason: "Dental Cleaning",
        status: "Scheduled"
    },
    {
        appointmentId: "APT010",
        patientName: "Diya Gawas",
        doctorName: "Dr. Meera Sharma",
        appointmentDate: "2026-11-14",
        appointmentTime: "09:30",
        reason: "Stomach Pain",
        status: "Scheduled"
    },
    {
        appointmentId: "APT011",
        patientName: "Reyansh Naik",
        doctorName: "Dr. Rahul Patil",
        appointmentDate: "2026-11-14",
        appointmentTime: "10:00",
        reason: "Follow-up",
        status: "Completed"
    },
    {
        appointmentId: "APT012",
        patientName: "Myra Costa",
        doctorName: "Dr. Neha Rao",
        appointmentDate: "2026-11-14",
        appointmentTime: "10:30",
        reason: "Tooth Sensitivity",
        status: "Scheduled"
    },
    {
        appointmentId: "APT013",
        patientName: "Aditya Rane",
        doctorName: "Dr. Meera Sharma",
        appointmentDate: "2026-11-15",
        appointmentTime: "09:00",
        reason: "Body Pain",
        status: "Cancelled"
    },
    {
        appointmentId: "APT014",
        patientName: "Aisha Khedekar",
        doctorName: "Dr. Rahul Patil",
        appointmentDate: "2026-11-15",
        appointmentTime: "09:30",
        reason: "Migraine",
        status: "Scheduled"
    },
    {
        appointmentId: "APT015",
        patientName: "Neil D Souza",
        doctorName: "Dr. Neha Rao",
        appointmentDate: "2026-11-15",
        appointmentTime: "10:00",
        reason: "Dental Checkup",
        status: "Scheduled"
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        await Appointment.deleteMany({});

        await Appointment.insertMany(sampleAppointments);

        console.log("15 sample appointments inserted successfully!");

    } catch (error) {
        console.error("Seeding error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

seedDatabase();