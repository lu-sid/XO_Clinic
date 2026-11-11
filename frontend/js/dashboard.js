
const API_URL = 'http://localhost:5000/api/appointments';

async function loadDashboard() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const appointments = data.appointments;

        document.getElementById('totalCount').textContent =
            appointments.length;

        document.getElementById('scheduledCount').textContent =
            appointments.filter(a => a.status === 'Scheduled').length;

        document.getElementById('completedCount').textContent =
            appointments.filter(a => a.status === 'Completed').length;

        document.getElementById('cancelledCount').textContent =
            appointments.filter(a => a.status === 'Cancelled').length;

        const recent = appointments.slice(0, 5);

        const table = `
            <table>
                <thead>
                    <tr>
                        <th>Appointment ID</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Date</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${recent.map(a => `
                        <tr>
                            <td>${a.appointmentId}</td>
                            <td>${a.patientName}</td>
                            <td>${a.doctorName}</td>
                            <td>${new Date(a.appointmentDate).toLocaleDateString('en-IN')}</td>
                            <td>${a.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('recentAppointments').innerHTML = table;

    } catch (error) {
        document.getElementById('recentAppointments').textContent =
            'Unable to load appointments. Please check the server.';
    }
}

loadDashboard();
