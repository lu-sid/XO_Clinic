
const Appointment = require('../models/appointment');

// GET ALL APPOINTMENTS + SEARCH + FILTER + SORT
exports.getAppointments = async (req, res) => {
    try {
        const {
            search, doctorName, status, date,
            dateFrom, dateTo, excludeStatus,
            doctors, statuses, sort
        } = req.query;

        const conditions = [];

        // Search by ID or patient name
        if (search) {
            conditions.push({
                $or: [
                    { appointmentId: { $regex: search, $options: 'i' } },
                    { patientName: { $regex: search, $options: 'i' } }
                ]
            });
        }

        if (doctorName) conditions.push({ doctorName });
        if (status) conditions.push({ status });

        // Filter by exact date
        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);

            conditions.push({
                appointmentDate: { $gte: start, $lt: end }
            });
        }

        // Filter by date range
        if (dateFrom || dateTo) {
            const range = {};
            if (dateFrom) range.$gte = new Date(dateFrom);
            if (dateTo) range.$lte = new Date(dateTo);

            conditions.push({ appointmentDate: range });
        }

        // Exclude a status
        if (excludeStatus) {
            conditions.push({ status: { $ne: excludeStatus } });
        }

        // Multiple doctors
        if (doctors) {
            conditions.push({
                doctorName: { $in: doctors.split(',') }
            });
        }

        // Multiple statuses
        if (statuses) {
            conditions.push({
                status: { $in: statuses.split(',') }
            });
        }

        const filter = conditions.length ? { $and: conditions } : {};

        const appointments = await Appointment.find(filter)
            .sort({
                appointmentDate: sort === 'desc' ? -1 : 1,
                appointmentTime: sort === 'desc' ? -1 : 1
            });

        res.status(200).json({
            count: appointments.length,
            appointments,
            message: appointments.length === 0
                ? "No matching appointments found."
                : "Appointments retrieved successfully."
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET APPOINTMENT BY CUSTOM ID
exports.getAppointmentById = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            appointmentId: req.params.id
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }

        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CREATE APPOINTMENT
exports.createAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.create(req.body);

        res.status(201).json({
            message: "Appointment created successfully!",
            appointment
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Appointment ID already exists."
            });
        }

        res.status(400).json({ message: error.message });
    }
};

// UPDATE APPOINTMENT
exports.updateAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { appointmentId: req.params.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }

        res.json({
            message: "Appointment updated successfully!",
            appointment
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE APPOINTMENT
exports.deleteAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOneAndDelete({
            appointmentId: req.params.id
        });

        if (!appointment) {
            return res.status(404).json({
                message: "Appointment not found."
            });
        }

        res.json({
            message: "Appointment deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};