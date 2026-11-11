
require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');

const appointmentRoutes = require('./routes/appointmentRoutes');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/appointments', appointmentRoutes);

app.get('/', (req, res) => {
    res.send('Clinic Appointment Management System API is running!');
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
